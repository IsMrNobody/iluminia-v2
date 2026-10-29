import { TeacherProfile, RegisteredStudent, Student, ClassSection } from "../types";
import { getSupabaseClient, hashPassword, cleanAvatarUrl, encodeAvatarWithHash } from "./supabase";
import { createEmptyGrades } from "../mockData";
import * as XLSX from "xlsx";

const REGISTERED_STUDENTS_KEY = "ilumina_registered_students";
const STUDENTS_METADATA_KEY = "ilumina_students_metadata";
const TEACHERS_KEY = "ilumina_teachers_list";

export function getStudentRealCedula(std: { id?: string; cedula?: string; firstName?: string; lastName?: string }): string {
  if (std?.cedula && !std.cedula.startsWith("std-") && !std.cedula.startsWith("reg-std-") && !std.cedula.includes("class-")) {
    return std.cedula;
  }
  if (typeof window !== "undefined") {
    try {
      const registered = JSON.parse(localStorage.getItem(REGISTERED_STUDENTS_KEY) || "[]");
      const found = registered.find((r: any) =>
        (r.firstName && std?.firstName && r.firstName.toLowerCase() === std.firstName.toLowerCase() &&
         r.lastName && std?.lastName && r.lastName.toLowerCase() === std.lastName.toLowerCase()) ||
        r.id === std?.id || r.cedula === std?.id
      );
      if (found?.cedula && !found.cedula.startsWith("std-")) return found.cedula;
    } catch {}
  }
  if (std?.id && !std.id.startsWith("std-") && !std.id.startsWith("reg-std-") && !std.id.startsWith("class-")) {
    return std.id;
  }
  return "";
}

// Known mock student IDs and cedulas to actively purge from local storage
const MOCK_STUDENT_IDS = new Set([
  "reg-std-101", "reg-std-102", "reg-std-103", "reg-std-104", "reg-std-105", "reg-std-106",
  "reg-std-201", "reg-std-202", "reg-std-301", "reg-std-302", "reg-std-401", "reg-std-501"
]);

const MOCK_CEDULAS = new Set([
  "V-32.410.892", "V-32.185.304", "V-32.994.110", "V-32.651.488", "V-32.883.219", "V-32.741.002",
  "V-31.849.201", "V-31.520.198", "V-30.988.114", "V-30.771.829", "V-29.810.450", "V-28.901.320"
]);

export function isMockStudent(student: { id?: string; cedula?: string }): boolean {
  if (student.id && MOCK_STUDENT_IDS.has(student.id)) return true;
  if (student.cedula && MOCK_CEDULAS.has(student.cedula)) return true;
  return false;
}

export function purgeMockStudents(): void {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(REGISTERED_STUDENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(s => !isMockStudent(s));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(cleaned));
        }
      }
    }
  } catch {}
}

export function getStudentsMetadataMap(): Record<string, { gradeYear: string; sectionLetter: string; createdAt?: string }> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(STUDENTS_METADATA_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

export function setStudentMetadata(key: string, data: { gradeYear: string; sectionLetter: string; createdAt?: string }) {
  if (typeof window === "undefined") return;
  try {
    const current = getStudentsMetadataMap();
    current[key] = data;
    localStorage.setItem(STUDENTS_METADATA_KEY, JSON.stringify(current));
  } catch {}
}

export function normalizeYear(yr?: string): string {
  return formatGradeYear(yr);
}

export function isUserAdmin(teacher: TeacherProfile | null): boolean {
  if (!teacher) return false;
  if (teacher.isAdmin === true) return true;
  if ((teacher as any).admin === true) return true;
  const statusStr = String(teacher.status || "").toLowerCase().trim();
  if (statusStr === "admin" || statusStr === "admin true" || statusStr.includes("admin")) {
    return true;
  }
  const rankStr = String(teacher.rank || "").toLowerCase().trim();
  if (rankStr.includes("admin") || rankStr.includes("administrador") || rankStr.includes("director")) {
    return true;
  }
  if (typeof window !== "undefined") {
    if (localStorage.getItem("ilumina_is_admin") === "true") return true;
    const cleanEmail = (teacher.email || "").toLowerCase().trim();
    if (cleanEmail) {
      if (localStorage.getItem(`ilumina_admin_${cleanEmail}`) === "true") return true;
      try {
        const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
        if (creds[cleanEmail]?.isAdmin || creds[cleanEmail]?.status === "admin true" || creds[cleanEmail]?.status === "admin") {
          return true;
        }
      } catch {}
    }
  }
  return false;
}

export function setTeacherAdminStatus(email: string, isAdmin: boolean) {
  if (typeof window === "undefined") return;
  const cleanEmail = email.toLowerCase().trim();
  localStorage.setItem(`ilumina_admin_${cleanEmail}`, isAdmin ? "true" : "false");
  try {
    const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
    if (creds[cleanEmail]) {
      creds[cleanEmail].isAdmin = isAdmin;
      creds[cleanEmail].status = isAdmin ? "ADMIN" : "ACTIVO";
      localStorage.setItem("ilumina_user_credentials", JSON.stringify(creds));
    }
    const currentTeacherStr = localStorage.getItem("ilumina_current_teacher");
    if (currentTeacherStr) {
      const cur = JSON.parse(currentTeacherStr);
      if ((cur.email || "").toLowerCase() === cleanEmail) {
        cur.isAdmin = isAdmin;
        cur.status = isAdmin ? "ADMIN" : "ACTIVO";
        localStorage.setItem("ilumina_current_teacher", JSON.stringify(cur));
      }
    }
  } catch {}
}

export function getRegisteredStudents(): RegisteredStudent[] {
  if (typeof window === "undefined") return [];
  purgeMockStudents();
  try {
    const saved = localStorage.getItem(REGISTERED_STUDENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => !isMockStudent(s));
      }
    }
  } catch (e) {
    console.error("Error loading registered students:", e);
  }
  return [];
}

export function saveRegisteredStudent(student: RegisteredStudent): void {
  if (typeof window === "undefined") return;
  try {
    const current = getRegisteredStudents();
    const idx = current.findIndex(s => s.cedula === student.cedula || s.id === student.id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...student };
    } else {
      current.unshift(student);
    }
    localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(current));
    setStudentMetadata(student.cedula, { gradeYear: student.gradeYear, sectionLetter: student.sectionLetter });
  } catch {}
}

export function deleteRegisteredStudent(cedulaOrId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getRegisteredStudents();
    const filtered = current.filter(s => s.cedula !== cedulaOrId && s.id !== cedulaOrId);
    localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(filtered));
  } catch {}
}

export function syncRegisteredStudentsWithClasses(sections: ClassSection[]): void {
  // no-op or sync helper
}

export function formatGradeYear(yr?: string): string {
  const clean = (yr || "").toLowerCase();
  if (clean.includes("1")) return "1er Año";
  if (clean.includes("2")) return "2do Año";
  if (clean.includes("3")) return "3er Año";
  if (clean.includes("4")) return "4to Año";
  if (clean.includes("5")) return "5to Año";
  return yr || "1er Año";
}

export function encodeStudentAvatar(avatarUrl: string, gradeYear: string, sectionLetter: string): string {
  const base = cleanAvatarUrl(avatarUrl);
  const yr = formatGradeYear(gradeYear);
  const sec = (sectionLetter || "A").trim().toUpperCase();
  return `${base}#yr=${encodeURIComponent(yr)}&sec=${sec}`;
}

export function extractStudentMetadata(alumno: any): { gradeYear: string; sectionLetter: string } {
  if (alumno.grado_ano || alumno.ano) {
    return {
      gradeYear: formatGradeYear(alumno.grado_ano || alumno.ano),
      sectionLetter: (alumno.seccion || "A").trim().toUpperCase(),
    };
  }
  if (alumno.avatar_url) {
    const yrMatch = alumno.avatar_url.match(/[#&]yr=([^&#]+)/);
    const secMatch = alumno.avatar_url.match(/[#&]sec=([^&#]+)/);
    if (yrMatch || secMatch) {
      const yrDecoded = yrMatch ? decodeURIComponent(yrMatch[1]).replace(/_/g, " ") : "";
      const secDecoded = secMatch ? decodeURIComponent(secMatch[1]).toUpperCase() : "A";
      return {
        gradeYear: formatGradeYear(yrDecoded),
        sectionLetter: secDecoded || "A",
      };
    }
  }
  if (alumno.email && alumno.email.startsWith("meta:")) {
    const parts = alumno.email.replace("meta:", "").split(":");
    return {
      gradeYear: formatGradeYear(parts[0]?.replace(/_/g, " ")),
      sectionLetter: parts[1]?.toUpperCase() || "A",
    };
  }
  const metadataMap = getStudentsMetadataMap();
  const meta: any = (metadataMap as any)[alumno.cedula] || (metadataMap as any)[alumno.id] || {};
  if (meta?.gradeYear || meta?.sectionLetter) {
    return {
      gradeYear: formatGradeYear(meta.gradeYear),
      sectionLetter: (meta.sectionLetter || "A").trim().toUpperCase(),
    };
  }
  return {
    gradeYear: "1er Año",
    sectionLetter: "A",
  };
}

export function getCurrentSchoolYear(separator: " - " | "/" | "-" = " - "): string {
  const currentYear = new Date().getFullYear();
  return `${currentYear}${separator}${currentYear + 1}`;
}

export function getYearSearchCodes(year: string): { code: string; num: string; label: string } {
  const clean = (year || "").toLowerCase().trim();
  if (clean.includes("2")) return { code: "2do", num: "2", label: "2do Año" };
  if (clean.includes("3")) return { code: "3er", num: "3", label: "3er Año" };
  if (clean.includes("4")) return { code: "4to", num: "4", label: "4to Año" };
  if (clean.includes("5")) return { code: "5to", num: "5", label: "5to Año" };
  return { code: "1er", num: "1", label: "1er Año" };
}

export async function fetchStudentCountsByYear(): Promise<Record<string, number>> {
  const client: any = getSupabaseClient();
  const counts: Record<string, number> = {
    "1er Año": 0,
    "2do Año": 0,
    "3er Año": 0,
    "4to Año": 0,
    "5to Año": 0,
  };
  try {
    const yearConfigs = [
      { yr: "1er Año", code: "1er", num: "1" },
      { yr: "2do Año", code: "2do", num: "2" },
      { yr: "3er Año", code: "3er", num: "3" },
      { yr: "4to Año", code: "4to", num: "4" },
      { yr: "5to Año", code: "5to", num: "5" },
    ];
    const results = await Promise.all(
      yearConfigs.map(c =>
        client
          .from("alumnos")
          .select("*", { count: "exact", head: true })
          .or(`email.ilike.%${c.code}%,avatar_url.ilike.%yr=${c.code}%,avatar_url.ilike.%yr=${c.num}%`)
      )
    );
    yearConfigs.forEach((c, idx) => {
      counts[c.yr] = results[idx]?.count ?? 0;
    });
    return counts;
  } catch (err) {
    console.warn("Could not fetch student counts by year:", err);
    const cached = getRegisteredStudents();
    cached.forEach(s => {
      const yr = formatGradeYear(s.gradeYear);
      if (counts[yr] !== undefined) counts[yr]++;
    });
    return counts;
  }
}

export async function fetchRegisteredStudentsFromDatabase(selectedYear?: string): Promise<RegisteredStudent[]> {
  purgeMockStudents();
  const client: any = getSupabaseClient();
  const targetYearStr = typeof selectedYear === "string" ? selectedYear.trim() : "";
  const isFilteringYear = !!targetYearStr && targetYearStr !== "ALL";

  let supaAlumnos: any[] = [];
  try {
    if (isFilteringYear) {
      const { code, num, label } = getYearSearchCodes(targetYearStr);
      const res = await client
        .from("alumnos")
        .select("*")
        .or(`email.ilike.%\${code}%,avatar_url.ilike.%yr=\${code}%,avatar_url.ilike.%yr=\${num}%`)
        .order("nombres", { ascending: true });
      supaAlumnos = res.data || [];
    } else {
      const res = await client
        .from("alumnos")
        .select("*")
        .order("nombres", { ascending: true });
      supaAlumnos = res.data || [];
    }
  } catch (err) {
    console.warn("Supabase fetch exception:", err);
  }

  const localStudents = getRegisteredStudents();
  const mappedSupa: RegisteredStudent[] = (supaAlumnos || []).map((row: any) => {
    const meta = extractStudentMetadata(row);
    return {
      id: row.id || row.cedula,
      cedula: row.cedula || row.id,
      firstName: row.nombres || row.firstName || "",
      lastName: row.apellidos || row.lastName || "",
      gradeYear: meta.gradeYear,
      sectionLetter: meta.sectionLetter,
      avatarUrl: cleanAvatarUrl(row.avatar_url || row.avatarUrl || ""),
      createdAt: row.created_at || row.createdAt || new Date().toISOString()
    };
  });

  const map = new Map<string, RegisteredStudent>();
  localStudents.forEach(s => map.set(s.cedula || s.id, s));
  mappedSupa.forEach(s => map.set(s.cedula || s.id, s));
  const allCombined = Array.from(map.values()).filter(s => !isMockStudent(s));

  if (isFilteringYear) {
    const normTarget = normalizeYear(targetYearStr);
    return allCombined.filter(s => normalizeYear(s.gradeYear) === normTarget);
  }

  return allCombined;
}

export async function registerStudentInDatabase(student: Omit<RegisteredStudent, "createdAt">): Promise<boolean> {
  const client: any = getSupabaseClient();
  try {
    const payload = {
      cedula: student.cedula,
      nombres: student.firstName,
      apellidos: student.lastName,
      avatar_url: encodeStudentAvatar(student.avatarUrl || "", student.gradeYear, student.sectionLetter)
    };
    const { error } = await client.from("alumnos").insert([payload]);
    if (error) {
      console.warn("Error inserting student in Supabase:", error);
      return false;
    }
    setStudentMetadata(student.cedula, { gradeYear: student.gradeYear, sectionLetter: student.sectionLetter });
    return true;
  } catch (err) {
    console.warn("Exception inserting student in Supabase:", err);
    return false;
  }
}

export async function deleteStudentFromDatabase(cedulaOrId: string): Promise<boolean> {
  const client: any = getSupabaseClient();
  try {
    const { error } = await client.from("alumnos").delete().or(`cedula.eq.${cedulaOrId},id.eq.${cedulaOrId}`);
    if (error) {
      console.warn("Error deleting student from Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception deleting student from Supabase:", err);
    return false;
  }
}

export async function updateStudentInDatabase(cedula: string, updates: Partial<RegisteredStudent>): Promise<boolean> {
  const client: any = getSupabaseClient();
  try {
    const payload: any = {};
    if (updates.firstName !== undefined) payload.nombres = updates.firstName;
    if (updates.lastName !== undefined) payload.apellidos = updates.lastName;
    if (updates.cedula !== undefined) payload.cedula = updates.cedula;
    if (updates.avatarUrl || updates.gradeYear || updates.sectionLetter) {
      const currentReg = getRegisteredStudents().find(s => s.cedula === cedula);
      const yr = updates.gradeYear || currentReg?.gradeYear || "1er Año";
      const sec = updates.sectionLetter || currentReg?.sectionLetter || "A";
      const av = updates.avatarUrl || currentReg?.avatarUrl || "";
      payload.avatar_url = encodeStudentAvatar(av, yr, sec);
      setStudentMetadata(updates.cedula || cedula, { gradeYear: yr, sectionLetter: sec });
    }
    const { error } = await client.from("alumnos").update(payload).eq("cedula", cedula);
    if (error) {
      console.warn("Error updating student in Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception updating student in Supabase:", err);
    return false;
  }
}

export function importStudentsFromFile(file: File): Promise<{ success: boolean; message: string; count: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const imported: RegisteredStudent[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) return;
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          for (let i = 4; i < json.length; i++) {
            const row = json[i];
            if (!Array.isArray(row) || row.length === 0) continue;

            const apellidos = String(row[1] || "").trim();
            const nombres = String(row[2] || "").trim();
            const cedula = String(row[3] || "").trim();
            const gradeYearStr = String(row[4] || sheetName).trim();
            const sectionStr = String(row[5] || "A").trim();

            if ((nombres || apellidos) && !apellidos.toLowerCase().includes("apellidos") && !nombres.toLowerCase().includes("nombres")) {
              const cleanedCedula = cedula.replace(/[^0-9VvEe\-]/g, "");
              const formattedCedula = cleanedCedula.toUpperCase().startsWith("V-") || cleanedCedula.toUpperCase().startsWith("E-")
                ? cleanedCedula.toUpperCase()
                : (/^\d+$/.test(cleanedCedula) ? `V-${cleanedCedula}` : (cedula || "C.I. Pendiente"));

              const gradeYear = formatGradeYear(gradeYearStr || sheetName);
              const sectionLetter = (sectionStr.replace(/[^A-E]/gi, "") || "A").trim().toUpperCase().slice(-1);

              imported.push({
                id: formattedCedula !== "C.I. Pendiente" ? formattedCedula : `std-${Date.now()}-${i}-${Math.random()}`,
                cedula: formattedCedula,
                firstName: nombres.toUpperCase(),
                lastName: apellidos.toUpperCase(),
                gradeYear,
                sectionLetter: sectionLetter.length === 1 ? sectionLetter : "A",
                createdAt: new Date().toISOString()
              });
            }
          }
        });

        if (imported.length === 0) {
          resolve({ success: false, message: "No se encontraron alumnos válidos en el archivo.", count: 0 });
          return;
        }

        const current = getRegisteredStudents();
        const map = new Map<string, RegisteredStudent>();
        current.forEach(s => map.set(s.cedula || s.id, s));
        imported.forEach(s => map.set(s.cedula || s.id, s));
        const merged = Array.from(map.values());

        if (typeof window !== "undefined") {
          localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(merged));
          imported.forEach(s => {
            setStudentMetadata(s.cedula, { gradeYear: s.gradeYear, sectionLetter: s.sectionLetter });
          });
        }

        // Save to Supabase database as well
        const client: any = getSupabaseClient();
        if (client) {
          try {
            for (const s of imported) {
              const payload = {
                cedula: s.cedula,
                nombres: s.firstName,
                apellidos: s.lastName,
                avatar_url: encodeStudentAvatar(s.avatarUrl || "", s.gradeYear, s.sectionLetter)
              };
              await client.from("alumnos").upsert([payload], { onConflict: "cedula" });
            }
          } catch (dbErr) {
            console.warn("Supabase bulk insert warning:", dbErr);
          }
        }

        resolve({
          success: true,
          message: `¡Se importaron y guardaron ${imported.length} alumnos en BD y local exitosamente!`,
          count: imported.length
        });
      } catch (err) {
        console.error("Error importing students file:", err);
        reject({ success: false, message: "Error al procesar el archivo Excel.", count: 0 });
      }
    };
    reader.onerror = (error) => reject({ success: false, message: "Error al leer el archivo.", count: 0 });
    reader.readAsArrayBuffer(file);
  });
}

export function getAllTeachers(): TeacherProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(TEACHERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function createTeacherByAdmin(teacher: TeacherProfile): void {
  if (typeof window === "undefined") return;
  try {
    const teachers = getAllTeachers();
    teachers.push(teacher);
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
  } catch {}
}

export function updateTeacherByAdmin(email: string, updates: Partial<TeacherProfile>): void {
  if (typeof window === "undefined") return;
  try {
    const teachers = getAllTeachers();
    const idx = teachers.findIndex(t => t.email.toLowerCase() === email.toLowerCase());
    if (idx >= 0) {
      teachers[idx] = { ...teachers[idx], ...updates };
      localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
    }
  } catch {}
}

export function deleteTeacherByAdmin(email: string): void {
  if (typeof window === "undefined") return;
  try {
    const teachers = getAllTeachers();
    const filtered = teachers.filter(t => t.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(filtered));
  } catch {}
}

export function getRegisteredStudentsForSection(gradeYear: string, sectionLetter: string): RegisteredStudent[] {
  const all = getRegisteredStudents();
  const targetYear = formatGradeYear(gradeYear);
  const targetSec = (sectionLetter || "A").trim().toUpperCase();
  return all.filter(s => {
    const yr = formatGradeYear(s.gradeYear);
    const sec = (s.sectionLetter || "A").trim().toUpperCase();
    return yr === targetYear && sec === targetSec;
  });
}

export function convertRegisteredToClassStudents(registered: RegisteredStudent[]): Student[] {
  return registered.map((reg, idx) => ({
    id: reg.id || reg.cedula,
    cedula: reg.cedula,
    firstName: reg.firstName,
    lastName: reg.lastName,
    avatarUrl: reg.avatarUrl,
    grades: createEmptyGrades(),
    attendanceRate: 100,
    hasSubmittedLastQuiz: false,
  }));
}
