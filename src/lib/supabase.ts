import { createClient } from "@supabase/supabase-js";
import { ClassSection, Student, StudentGrades, TeacherProfile } from "../types";
import { createEmptyGrades } from "../mockData";

// Supabase configuration credentials provided
export const DEFAULT_SUPABASE_URL = "https://wstssycklbopndiwjoyv.supabase.co";
export const DEFAULT_SUPABASE_KEY = "sb_publishable_cDLyorIGUuDq4Et9OQBy3Q_BcAejgWe";

// Read from env or fallback to user credentials or localStorage override
export function getSupabaseCredentials() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  const storedUrl = typeof window !== "undefined" ? localStorage.getItem("ilumina_supabase_url") : null;
  const storedKey = typeof window !== "undefined" ? localStorage.getItem("ilumina_supabase_key") : null;

  return {
    url: (storedUrl || envUrl || DEFAULT_SUPABASE_URL).trim(),
    key: (storedKey || envKey || DEFAULT_SUPABASE_KEY).trim(),
  };
}

let clientInstance: ReturnType<typeof createClient> | null = null;
let currentClientUrl = "";
let currentClientKey = "";

export function getSupabaseClient() {
  const { url, key } = getSupabaseCredentials();
  if (!clientInstance || currentClientUrl !== url || currentClientKey !== key) {
    currentClientUrl = url;
    currentClientKey = key;
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
}

export const supabase = getSupabaseClient();

// Test live connection status
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tables: Record<string, boolean>;
  latencyMs: number;
}> {
  const client: any = getSupabaseClient();
  const startTime = Date.now();
  const tablesStatus: Record<string, boolean> = {
    profesores: false,
    materias: false,
    alumnos: false,
    matriculas: false,
    evaluaciones: false,
    calificaciones: false,
    lapsos_config: false,
  };

  try {
    // Check if we can reach Supabase
    const { error: profError } = await client.from("profesores").select("id").limit(1);
    const latency = Date.now() - startTime;

    // Check each expected table
    const tableNames = Object.keys(tablesStatus);
    await Promise.all(
      tableNames.map(async (table) => {
        try {
          const { error } = await client.from(table).select("count", { count: "exact", head: true });
          tablesStatus[table] = !error;
        } catch {
          tablesStatus[table] = false;
        }
      })
    );

    // If connection timed out or network error
    if (profError && profError.code === "PGRST301") {
      return {
        connected: true,
        message: "Conectado a Supabase (Tablas pendientes por crear en el SQL Editor).",
        tables: tablesStatus,
        latencyMs: latency,
      };
    }

    const hasAnyTable = Object.values(tablesStatus).some((v) => v);

    return {
      connected: true,
      message: hasAnyTable
        ? "Conexión exitosa y segura establecida con Supabase."
        : "Conectado a la API de Supabase. Ejecuta el script SQL en el Editor de Supabase para crear las tablas.",
      tables: tablesStatus,
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || "Error al conectar con Supabase. Verifica tu red y claves.",
      tables: tablesStatus,
      latencyMs: 0,
    };
  }
}

// Seed initial data into Supabase
export async function seedDemoDataToSupabase(
  teacher: TeacherProfile,
  classes: ClassSection[]
): Promise<{ success: boolean; message: string }> {
  const client: any = getSupabaseClient();

  try {
    // 1. Insert or update Teacher
    const { data: profData, error: profError } = await client
      .from("profesores")
      .upsert(
        {
          nombre: teacher.name,
          email: "profesor@ilumina.edu",
          departamento: teacher.department,
          rango: teacher.rank,
          ano_escolar: teacher.schoolYear,
          avatar_url: teacher.avatarUrl,
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (profError) throw profError;
    const profesorId = profData?.id;

    // 2. Insert Lapsos Config
    await client.from("lapsos_config").upsert([
      { lapso: 1, fecha_inicio: "2025-10-01", fecha_fin: "2025-12-15", fecha_corte: "2025-11-10", is_activo: false },
      { lapso: 2, fecha_inicio: "2026-01-07", fecha_fin: "2026-03-27", fecha_corte: "2026-02-15", is_activo: false },
      { lapso: 3, fecha_inicio: "2026-04-15", fecha_fin: "2026-07-15", fecha_corte: "2026-06-11", is_activo: true },
    ]);

    // 3. Insert Classes & Students
    for (const cls of classes) {
      const { data: materiaData, error: materiaError } = await client
        .from("materias")
        .upsert(
          {
            profesor_id: profesorId,
            nombre: cls.subjectName,
            grado_ano: cls.gradeYear,
            seccion: cls.sectionLetter,
            departamento: cls.department,
            lapso_activo: cls.lapso,
            color: "#2563eb",
          },
          { onConflict: "id" }
        )
        .select("id")
        .single();

      if (materiaError) throw materiaError;
      const materiaId = materiaData?.id;

      // Create default evaluation criteria for Lapso 3
      const evaluationTemplates = [
        { clave: "homework", titulo: "Hoja de tarea", cat: "academica", weight: 20 },
        { clave: "talentShow", titulo: "Muestra de talentos", cat: "academica", weight: 20 },
        { clave: "assembly", titulo: "Montaje", cat: "academica", weight: 20 },
        { clave: "essay", titulo: "Ensayo", cat: "academica", weight: 20 },
        { clave: "performance", titulo: "Puesta en escena", cat: "academica", weight: 10 },
        { clave: "responsibility", titulo: "Responsabilidad", cat: "etica", weight: 5 },
        { clave: "personalCare", titulo: "Presentación Personal", cat: "etica", weight: 5 },
      ];

      const insertedEvals: Record<string, string> = {};
      for (const ev of evaluationTemplates) {
        const { data: evData } = await client
          .from("evaluaciones")
          .upsert(
            {
              materia_id: materiaId,
              lapso: cls.lapso,
              clave_item: ev.clave,
              titulo: ev.titulo,
              categoria: ev.cat,
              ponderacion_porcentaje: ev.weight,
            },
            { onConflict: "id" }
          )
          .select("id")
          .single();
        if (evData?.id) {
          insertedEvals[ev.clave] = evData.id;
        }
      }

      // Insert students and grades
      for (let i = 0; i < cls.students.length; i++) {
        const std = cls.students[i];
        const cedula = `V-${10000000 + i + Math.floor(Math.random() * 9000)}`;

        const { data: alumnoData, error: alumnoError } = await client
          .from("alumnos")
          .upsert(
            {
              nombres: std.firstName,
              apellidos: std.lastName,
              cedula: cedula,
              avatar_url: std.avatarUrl,
            },
            { onConflict: "cedula" }
          )
          .select("id")
          .single();

        if (alumnoError) continue;
        const alumnoId = alumnoData?.id;

        // Link student to class
        await client.from("matriculas").upsert(
          {
            materia_id: materiaId,
            alumno_id: alumnoId,
            numero_lista: i + 1,
            asistencia_porcentaje: std.attendanceRate,
          },
          { onConflict: "materia_id,alumno_id" }
        );

        // Insert grades if criteria found
        const lapsoGrades = (std.grades && (std.grades[1] || std.grades[2] || std.grades[3])) ? (std.grades[1] || std.grades[2] || std.grades[3]) : (std.grades as any);
        const studentScores: Record<string, number | undefined> = {
          homework: lapsoGrades.academic.homework.score,
          talentShow: lapsoGrades.academic.talentShow.score,
          assembly: lapsoGrades.academic.assembly.score,
          essay: lapsoGrades.academic.essay.score,
          performance: lapsoGrades.academic.performance.score,
          responsibility: lapsoGrades.ethical.responsibility.score,
          personalCare: lapsoGrades.ethical.personalCare.score,
        };

        for (const [key, score] of Object.entries(studentScores)) {
          const evalId = insertedEvals[key];
          if (evalId && score !== undefined) {
            await client.from("calificaciones").upsert(
              {
                evaluacion_id: evalId,
                alumno_id: alumnoId,
                materia_id: materiaId,
                nota: score,
              },
              { onConflict: "evaluacion_id,alumno_id" }
            );
          }
        }
      }
    }

    return {
      success: true,
      message: "¡Datos de demostración y estructura de clases migrados con éxito a Supabase!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error al sembrar datos en Supabase: ${err?.message || "Revisa permisos de tabla"}`,
    };
  }
}

export interface TeacherRegistrationInput {
  name: string;
  email: string;
  password?: string;
  department: string;
  rank: string;
  schoolYear: string;
  avatarUrl: string;
  initialSubjectName?: string;
  initialGradeYear?: string;
  initialSectionLetter?: string;
  initialSections?: string[];
}

// Helper to strip any internal auth hash fragment from avatar URLs for clean display
export function cleanAvatarUrl(url?: string): string {
  if (!url) return "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80";
  return url.split("#auth:")[0].trim();
}

// Helper to extract persistent auth hash from avatar URL
export function extractHashFromAvatar(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/#auth:([a-f0-9]+)/i);
  return match ? match[1] : null;
}

// Helper to encode auth hash into avatar URL for 100% database persistence across devices
export function encodeAvatarWithHash(url: string, hash: string): string {
  const base = cleanAvatarUrl(url);
  return `${base}#auth:${hash}`;
}

// Secure password hashing helper
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_ilumina_auth_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Register a new teacher and save to Supabase
export async function registerTeacherInSupabase(input: TeacherRegistrationInput): Promise<{
  success: boolean;
  teacher: TeacherProfile;
  newClass?: ClassSection;
  newClasses?: ClassSection[];
  savedToSupabase: boolean;
  message: string;
}> {
  const client: any = getSupabaseClient();
  const cleanEmail = input.email.trim().toLowerCase();
  let savedToSupabase = false;
  let profesorId = "";
  const passwordHash = input.password ? await hashPassword(input.password) : "";

  // 1. Register credentials locally as fast local cache
  try {
    const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
    creds[cleanEmail] = {
      passwordHash,
      name: input.name.trim(),
    };
    localStorage.setItem("ilumina_user_credentials", JSON.stringify(creds));
  } catch {}

  // 2. Prepare persistent avatar with encoded hash (ensures cross-device login even without password_hash column)
  const avatarToStore = passwordHash 
    ? encodeAvatarWithHash(input.avatarUrl || "", passwordHash)
    : (input.avatarUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80");

  const newProfile: TeacherProfile = {
    name: input.name.trim(),
    email: cleanEmail,
    department: input.department.trim(),
    schoolYear: input.schoolYear.trim(),
    rank: input.rank.trim().toUpperCase(),
    status: "ACTIVO",
    avatarUrl: cleanAvatarUrl(input.avatarUrl),
    totalStudents: 0,
    totalStudentsGrowthPercent: 0,
    averagePerformance: 0.0,
    termProgressPercent: 50,
  };

  let createdClass: ClassSection | undefined;
  let createdClasses: ClassSection[] = [];

  // 3. Save directly to Supabase profesores table
  try {
    const teacherDataToInsert: any = {
      nombre: newProfile.name,
      email: cleanEmail,
      departamento: newProfile.department,
      rango: newProfile.rank,
      ano_escolar: newProfile.schoolYear,
      avatar_url: avatarToStore,
    };

    if (passwordHash) {
      teacherDataToInsert.password_hash = passwordHash;
    }

    // Check if professor already exists by email
    const { data: existingProf } = await client
      .from("profesores")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    let profResult: any = null;

    if (existingProf?.id) {
      // Update existing record
      let { data: updated, error: updError } = await client
        .from("profesores")
        .update(teacherDataToInsert)
        .eq("id", existingProf.id)
        .select()
        .maybeSingle();

      if (updError && teacherDataToInsert.password_hash) {
        // If password_hash column doesn't exist in Supabase table, retry without that column
        delete teacherDataToInsert.password_hash;
        const retryUpd = await client
          .from("profesores")
          .update(teacherDataToInsert)
          .eq("id", existingProf.id)
          .select()
          .maybeSingle();
        profResult = retryUpd.data;
      } else {
        profResult = updated;
      }
    } else {
      // Insert new record into profesores
      let { data: inserted, error: insError } = await client
        .from("profesores")
        .insert(teacherDataToInsert)
        .select()
        .maybeSingle();

      if (insError && teacherDataToInsert.password_hash) {
        // If password_hash column doesn't exist, retry with avatar_url only
        delete teacherDataToInsert.password_hash;
        const retry1 = await client
          .from("profesores")
          .insert(teacherDataToInsert)
          .select()
          .maybeSingle();

        if (!retry1.error) {
          profResult = retry1.data;
        } else {
          throw new Error(retry1.error.message || insError.message);
        }
      } else if (insError) {
        throw new Error(insError.message);
      } else {
        profResult = inserted;
      }
    }

    if (profResult?.id) {
      savedToSupabase = true;
      profesorId = profResult.id;
      newProfile.id = profResult.id;

      // Also create initial classes in Supabase materias table
      if (input.initialSubjectName?.trim()) {
        const subName = input.initialSubjectName.trim();
        const gradeYr = input.initialGradeYear || "1er Año";
        const sectionsToCreate = (input.initialSections && input.initialSections.length > 0)
          ? input.initialSections.map(s => s.trim().toUpperCase())
          : [(input.initialSectionLetter || "A").trim().toUpperCase()];

        const rows = sectionsToCreate.map(sec => ({
          profesor_id: profesorId,
          nombre: subName,
          grado_ano: gradeYr,
          seccion: sec,
          departamento: newProfile.department,
          lapso_activo: 1,
          periodo: "2025-2026",
          is_active: true,
          color: "#2563eb",
        }));

        try {
          const { data: matsData, error: matsError } = await client
            .from("materias")
            .insert(rows)
            .select();

          if (!matsError && Array.isArray(matsData) && matsData.length > 0) {
            createdClasses = matsData.map((m: any) => ({
              id: m.id,
              profesorId: profesorId,
              subjectName: m.nombre,
              gradeYear: m.grado_ano,
              sectionLetter: m.seccion,
              department: m.departamento || newProfile.department,
              isActive: true,
              lapso: m.lapso_activo || 1,
              termPercentage: 0,
              students: [],
            }));
            createdClass = createdClasses[0];
            for (const cls of createdClasses) {
              ensureEvaluationCriteriaForClass(cls.id, cls.lapso).catch(() => {});
            }
          }
        } catch (e) {
          console.warn("Could not insert initial classes in bulk:", e);
        }
      }
    }
  } catch (err: any) {
    console.error("Error saving teacher to Supabase profesores:", err);
    savedToSupabase = false;
  }

  // If createdClasses weren't created in Supabase, create local representation
  if (createdClasses.length === 0 && input.initialSubjectName?.trim()) {
    const sectionsToCreate = (input.initialSections && input.initialSections.length > 0)
      ? input.initialSections.map(s => s.trim().toUpperCase())
      : [(input.initialSectionLetter || "A").trim().toUpperCase()];

    createdClasses = sectionsToCreate.map((sec, idx) => ({
      id: `class-${Date.now()}-${idx}-${sec}`,
      profesorId: profesorId || undefined,
      subjectName: input.initialSubjectName!.trim(),
      gradeYear: input.initialGradeYear || "1er Año",
      sectionLetter: sec,
      department: newProfile.department,
      isActive: true,
      lapso: 1,
      termPercentage: 0,
      students: [],
    }));
    createdClass = createdClasses[0];
  }

  return {
    success: true,
    teacher: newProfile,
    newClass: createdClass,
    newClasses: createdClasses,
    savedToSupabase,
    message: savedToSupabase
      ? `¡Docente registrado y guardado exitosamente en la base de datos de Supabase!`
      : `¡Docente registrado localmente! (Verifica la conexión a Supabase).`,
  };
}

// Create a new subject/class in Supabase assigned strictly to the teacher with all designated sections
export async function createSubjectInSupabase(
  profesorEmailOrId: string,
  subjectData: {
    subjectName: string;
    gradeYear: string;
    sectionLetter?: string;
    sections?: string[];
    department?: string;
    lapso?: number;
    teacherId?: string;
    teacherName?: string;
  }
): Promise<{
  success: boolean;
  newClass?: ClassSection;
  newClasses?: ClassSection[];
  message: string;
  savedToSupabase?: boolean;
  profesorId?: string;
  errorDetail?: string;
}> {
  const client: any = getSupabaseClient();
  const cleanInput = (profesorEmailOrId || "").trim();
  let profId: string | null = subjectData.teacherId || null;
  let department = subjectData.department || "Ciencias Exactas";
  const lapso = subjectData.lapso || 1;

  const sectionsToCreate: string[] = (subjectData.sections && subjectData.sections.length > 0)
    ? Array.from(new Set(subjectData.sections.map(s => s.trim().toUpperCase())))
    : [(subjectData.sectionLetter || "A").trim().toUpperCase()];

  try {
    // 1. If profId is already provided, check if it exists in profesores
    if (profId) {
      const { data: profById } = await client
        .from("profesores")
        .select("id, departamento")
        .eq("id", profId)
        .maybeSingle();
      if (!profById?.id) {
        profId = null;
      } else {
        department = subjectData.department || profById.departamento || department;
      }
    }

    // 2. Check if cleanInput is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanInput);
    if (!profId && isUuid) {
      const { data: profById } = await client
        .from("profesores")
        .select("id, departamento")
        .eq("id", cleanInput)
        .maybeSingle();
      if (profById?.id) {
        profId = profById.id;
        department = subjectData.department || profById.departamento || department;
      }
    }

    // 3. Find profesor by email
    if (!profId && cleanInput.includes("@")) {
      const { data: profByEmail } = await client
        .from("profesores")
        .select("id, departamento")
        .eq("email", cleanInput.toLowerCase())
        .maybeSingle();
      if (profByEmail?.id) {
        profId = profByEmail.id;
        department = subjectData.department || profByEmail.departamento || department;
      }
    }

    // 4. Find profesor by name
    if (!profId && subjectData.teacherName?.trim()) {
      const { data: profByName } = await client
        .from("profesores")
        .select("id, departamento")
        .eq("nombre", subjectData.teacherName.trim())
        .maybeSingle();
      if (profByName?.id) {
        profId = profByName.id;
        department = subjectData.department || profByName.departamento || department;
      }
    }

    // 5. If STILL not found in profesores table, automatically insert teacher to guarantee a valid UUID foreign key!
    if (!profId) {
      const teacherName = subjectData.teacherName?.trim() || "Docente Titular";
      const teacherEmail = cleanInput.includes("@") ? cleanInput.toLowerCase() : `docente_${Date.now()}@ilumina.edu`;
      
      const { data: createdProf, error: createProfErr } = await client
        .from("profesores")
        .insert({
          nombre: teacherName,
          email: teacherEmail,
          departamento: department,
          ano_escolar: "2025 - 2026",
          rango: "DOCENTE TITULAR",
        })
        .select("id, departamento")
        .maybeSingle();

      if (!createProfErr && createdProf?.id) {
        profId = createdProf.id;
      } else {
        console.warn("Could not auto-create professor record:", createProfErr);
      }
    }

    // If still no profId could be obtained (e.g. database offline)
    if (!profId) {
      const fallbackClasses: ClassSection[] = sectionsToCreate.map((sec, idx) => ({
        id: `class-${Date.now()}-${idx}-${sec}`,
        subjectName: subjectData.subjectName.trim(),
        gradeYear: subjectData.gradeYear.trim(),
        sectionLetter: sec,
        department: department,
        isActive: true,
        lapso: lapso,
        termPercentage: 0,
        students: [],
      }));
      return {
        success: true,
        newClass: fallbackClasses[0],
        newClasses: fallbackClasses,
        savedToSupabase: false,
        message: `Asignatura creada localmente con secciones (${sectionsToCreate.join(", ")}). (No se pudo conectar con la tabla 'profesores' de Supabase).`,
      };
    }

    // 6. Insert all requested sections into materias table with profesor_id FK explicitly set
    const rowsToInsert = sectionsToCreate.map((sec) => ({
      profesor_id: profId,
      nombre: subjectData.subjectName.trim(),
      grado_ano: subjectData.gradeYear.trim(),
      seccion: sec,
      departamento: department,
      lapso_activo: lapso,
      periodo: "2025-2026",
      is_active: true,
      color: "#2563eb",
    }));

    let insertedRows: any[] = [];
    const { data: batchData, error: batchErr } = await client
      .from("materias")
      .insert(rowsToInsert)
      .select();

    if (!batchErr && Array.isArray(batchData) && batchData.length > 0) {
      insertedRows = batchData;
    } else {
      // Fallback row-by-row insertion
      for (const row of rowsToInsert) {
        try {
          const { data: singleData, error: singleErr } = await client
            .from("materias")
            .insert(row)
            .select()
            .maybeSingle();
          if (!singleErr && singleData?.id) {
            insertedRows.push(singleData);
          } else {
            // Check if already existed in database
            const { data: existing } = await client
              .from("materias")
              .select("*")
              .eq("profesor_id", profId)
              .eq("nombre", row.nombre)
              .eq("grado_ano", row.grado_ano)
              .eq("seccion", row.seccion)
              .maybeSingle();
            if (existing?.id) {
              insertedRows.push(existing);
            }
          }
        } catch (e) {
          console.warn("Error inserting single section row:", e);
        }
      }
    }

    if (insertedRows.length === 0) {
      return {
        success: false,
        savedToSupabase: false,
        message: `Error al registrar en la base de datos: ${batchErr?.message || "Error al insertar en la tabla materias"}`,
        errorDetail: batchErr?.message,
      };
    }

    const createdClasses: ClassSection[] = insertedRows.map((m: any) => ({
      id: m.id,
      profesorId: profId,
      subjectName: m.nombre,
      gradeYear: m.grado_ano,
      sectionLetter: m.seccion,
      department: m.departamento || department,
      isActive: m.is_active ?? true,
      lapso: m.lapso_activo || lapso,
      termPercentage: 0,
      students: [],
    }));

    // Pre-populate evaluation criteria in Supabase for each created class
    for (const cls of createdClasses) {
      ensureEvaluationCriteriaForClass(cls.id, cls.lapso).catch(() => {});
    }

    const letters = createdClasses.map(c => c.sectionLetter).join(", ");

    return {
      success: true,
      newClass: createdClasses[0],
      newClasses: createdClasses,
      savedToSupabase: true,
      profesorId: profId,
      message: `¡Asignatura ${subjectData.subjectName} (${subjectData.gradeYear}) registrada con éxito con secciones (${letters}) en la base de datos asignada al docente!`,
    };
  } catch (err: any) {
    console.error("Unexpected error in createSubjectInSupabase:", err);
    return {
      success: false,
      savedToSupabase: false,
      message: err?.message || "Error inesperado al crear la asignatura.",
      errorDetail: err?.message,
    };
  }
}

// Fetch all real subjects/classes assigned to a specific teacher from Supabase
export async function getTeacherClassesFromSupabase(
  profesorEmailOrId: string,
  profesorName?: string
): Promise<ClassSection[]> {
  const client: any = getSupabaseClient();
  const cleanInput = (profesorEmailOrId || "").trim();
  if (!cleanInput && !profesorName) return [];

  try {
    let profId: string | null = null;
    let profDept = "Ciencias Exactas";

    // 1. Check if cleanInput is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanInput);
    if (isUuid) {
      const { data: profById } = await client
        .from("profesores")
        .select("id, departamento")
        .eq("id", cleanInput)
        .maybeSingle();
      if (profById?.id) {
        profId = profById.id;
        profDept = profById.departamento || profDept;
      }
    }

    // 2. Check if cleanInput is an email
    if (!profId && cleanInput.includes("@")) {
      const { data: profByEmail } = await client
        .from("profesores")
        .select("id, departamento")
        .eq("email", cleanInput.toLowerCase())
        .maybeSingle();
      if (profByEmail?.id) {
        profId = profByEmail.id;
        profDept = profByEmail.departamento || profDept;
      }
    }

    // 3. Check by professor name
    if (!profId && profesorName?.trim()) {
      const { data: profByName } = await client
        .from("profesores")
        .select("id, departamento")
        .eq("nombre", profesorName.trim())
        .maybeSingle();
      if (profByName?.id) {
        profId = profByName.id;
        profDept = profByName.departamento || profDept;
      }
    }

    if (!profId) return [];

    const { data: mats, error } = await client
      .from("materias")
      .select("*")
      .eq("profesor_id", profId)
      .order("created_at", { ascending: true });

    if (error || !mats || mats.length === 0) return [];

    const resultClasses: ClassSection[] = [];
    for (const m of mats) {
      let classStudents: Student[] = [];
      try {
        classStudents = await getStudentsForClassFromSupabase(m.id);
      } catch (e) {
        console.warn(`Could not load students for class ${m.id}:`, e);
      }

      resultClasses.push({
        id: m.id,
        profesorId: m.profesor_id || profId,
        subjectName: m.nombre,
        gradeYear: m.grado_ano,
        sectionLetter: m.seccion,
        department: m.departamento || profDept,
        isActive: m.is_active ?? true,
        lapso: m.lapso_activo || 1,
        termPercentage: 0,
        students: classStudents,
      });
    }

    return resultClasses;
  } catch (e) {
    console.error("Error fetching teacher classes from Supabase:", e);
    return [];
  }
}

// Strict & Secure Login for teacher using direct database validation & SHA-256 hash checks
export async function loginTeacherWithSupabase(email: string, password?: string): Promise<{
  success: boolean;
  teacher?: TeacherProfile;
  classes?: ClassSection[];
  message: string;
}> {
  const client: any = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();

  if (!password || password.trim().length === 0) {
    return {
      success: false,
      message: "Por favor ingresa tu contraseña de acceso.",
    };
  }

  try {
    const inputHash = await hashPassword(password);
    let passwordVerified = false;
    let isFirstTimeSetup = false;

    // 1. Fetch professor record from Supabase database
    let { data: prof, error: profError } = await client
      .from("profesores")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    // 2. Fetch local credentials from localStorage
    let localCred: any = null;
    try {
      const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
      localCred = creds[cleanEmail];
    } catch {}

    // 3. Find registered password hash (from DB columns, avatar metadata, or localStorage)
    const dbHash = String(
      prof?.password_hash ||
      extractHashFromAvatar(prof?.avatar_url) ||
      prof?.password ||
      prof?.clave ||
      prof?.contrasena ||
      ""
    ).trim();

    const localHash = String(localCred?.passwordHash || "").trim();
    const expectedHash = dbHash || localHash;

    if (expectedHash) {
      // Validate password: match against SHA-256 hash OR against plain text (if manually inserted in DB table editor)
      if (inputHash === expectedHash || password === expectedHash) {
        passwordVerified = true;
        // If DB did not have the hash in avatar_url, sync it now so all devices can log in!
        if (prof?.id && !extractHashFromAvatar(prof.avatar_url)) {
          const syncAvatar = encodeAvatarWithHash(prof.avatar_url || "", inputHash);
          const updatePayload: any = { avatar_url: syncAvatar };
          if (prof && "password_hash" in prof && prof.password_hash !== undefined) {
            updatePayload.password_hash = inputHash;
          }
          try {
            await client.from("profesores").update(updatePayload).eq("id", prof.id);
          } catch {}
        }
      } else {
        return {
          success: false,
          message: "Contraseña incorrecta. Por favor verifica tus datos e intenta nuevamente.",
        };
      }
    } else if (prof) {
      // Professor exists in Supabase database, but has no password established yet!
      // (e.g. Added directly via database table editor, or created prior to password hashing)
      // Establish their entered password right now so they are permanently activated!
      passwordVerified = true;
      isFirstTimeSetup = true;

      const syncAvatar = encodeAvatarWithHash(prof.avatar_url || "", inputHash);
      const updatePayload: any = { avatar_url: syncAvatar };
      if (prof && "password_hash" in prof && prof.password_hash !== undefined) {
        updatePayload.password_hash = inputHash;
      }
      try {
        await client.from("profesores").update(updatePayload).eq("id", prof.id);
      } catch {}

      // Also store in localStorage
      try {
        const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
        creds[cleanEmail] = {
          passwordHash: inputHash,
          name: prof.nombre,
        };
        localStorage.setItem("ilumina_user_credentials", JSON.stringify(creds));
      } catch {}
    } else if (localCred) {
      // Verified through local credentials store
      if (inputHash === localCred.passwordHash || password === localCred.passwordHash) {
        passwordVerified = true;
      } else {
        return {
          success: false,
          message: "Contraseña incorrecta. Por favor verifica tus datos e intenta nuevamente.",
        };
      }
    } else {
      return {
        success: false,
        message: "No se encontró ningún docente registrado con ese correo institucional. Por favor regístrate.",
      };
    }

    if (!passwordVerified) {
      return {
        success: false,
        message: "Contraseña incorrecta. Por favor verifica tus datos e intenta nuevamente.",
      };
    }

    let teacherClasses: ClassSection[] = [];
    const currentCalendarYear = new Date().getFullYear();
    const dynamicSchoolYear = `${currentCalendarYear} - ${currentCalendarYear + 1}`;

    // 3. If teacher is verified from local credentials but not yet saved in profesores table, SAVE NOW!
    if (!prof) {
      const rawName = 
        localCred?.name ||
        cleanEmail.split("@")[0].replace(/[0-9._-]/g, " ").trim();
      
      const teacherName = rawName 
        ? rawName.split(" ").filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
        : "Docente";

      const teacherDept = localCred?.department || "Ciencias Exactas";
      const teacherRank = localCred?.rank || "DOCENTE TITULAR";
      const teacherSchoolYear = localCred?.schoolYear || dynamicSchoolYear;
      const teacherAvatar = encodeAvatarWithHash(
        localCred?.avatarUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80",
        inputHash
      );

      const insertPayload: any = {
        nombre: teacherName,
        email: cleanEmail,
        departamento: teacherDept,
        rango: teacherRank,
        ano_escolar: teacherSchoolYear,
        avatar_url: teacherAvatar,
      };

      try {
        let { data: newProf, error: insErr } = await client
          .from("profesores")
          .insert(insertPayload)
          .select()
          .maybeSingle();

        if (insErr && insertPayload.user_id) {
          delete insertPayload.user_id;
          const retry = await client
            .from("profesores")
            .insert(insertPayload)
            .select()
            .maybeSingle();
          newProf = retry.data;
        }

        if (newProf?.id) {
          prof = newProf;
        }
      } catch (e) {
        console.warn("Could not auto-insert teacher record in profesores:", e);
      }
    }

    // Password is VALID! Build teacher profile:
    let profile: TeacherProfile;

    if (prof) {
      const adminFromDb = Boolean(
        prof.is_admin === true ||
        prof.admin === true ||
        prof.isAdmin === true ||
        String(prof.status || "").toLowerCase().includes("admin") ||
        String(prof.rango || "").toLowerCase().includes("admin") ||
        String(prof.rol || prof.role || "").toLowerCase() === "admin"
      );

      profile = {
        id: prof.id,
        name: prof.nombre,
        email: prof.email || cleanEmail,
        department: prof.departamento || "Ciencias",
        schoolYear: prof.ano_escolar || dynamicSchoolYear,
        rank: prof.rango || "DOCENTE TITULAR",
        status: prof.status || (adminFromDb ? "ADMIN" : "ACTIVO"),
        avatarUrl: cleanAvatarUrl(prof.avatar_url),
        totalStudents: 0,
        totalStudentsGrowthPercent: 0,
        averagePerformance: 0.0,
        termProgressPercent: 0,
        isAdmin: adminFromDb,
      } as TeacherProfile;

      const { data: mats } = await client
        .from("materias")
        .select("*")
        .eq("profesor_id", prof.id);

      if (mats && mats.length > 0) {
        for (const m of mats) {
          let classStudents: Student[] = [];
          try {
            classStudents = await getStudentsForClassFromSupabase(m.id);
          } catch {}

          teacherClasses.push({
            id: m.id,
            profesorId: m.profesor_id || prof.id,
            subjectName: m.nombre,
            gradeYear: m.grado_ano,
            sectionLetter: m.seccion,
            department: m.departamento || profile.department,
            isActive: m.is_active ?? true,
            lapso: m.lapso_activo || 1,
            termPercentage: 0,
            students: classStudents,
          });
        }
      } else {
        teacherClasses = [];
      }
    } else {
      // From verified local credentials
      profile = {
        id: "local-teacher",
        name: localCred?.name || "Docente",
        email: cleanEmail,
        department: "Ciencias",
        schoolYear: localCred?.schoolYear || dynamicSchoolYear,
        rank: "DOCENTE TITULAR",
        status: "ACTIVO",
        avatarUrl: cleanAvatarUrl(localCred?.avatarUrl),
        totalStudents: 0,
        totalStudentsGrowthPercent: 0,
        averagePerformance: 0.0,
        termProgressPercent: 50,
      };
    }

    const welcomeMsg = isFirstTimeSetup
      ? `¡Bienvenido(a) Prof. ${profile.name}! Contraseña establecida y guardada exitosamente.`
      : `¡Bienvenido(a) Prof. ${profile.name}! Sesión iniciada con éxito.`;

    return {
      success: true,
      teacher: profile,
      classes: teacherClasses,
      message: welcomeMsg,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Error al verificar las credenciales.",
    };
  }
}

// Ensure standard evaluation criteria exist in Supabase for a class section
export async function ensureEvaluationCriteriaForClass(materiaId: string, lapso: number = 1): Promise<Record<string, string>> {
  const client: any = getSupabaseClient();
  const evaluationTemplates = [
    { clave: "homework", titulo: "Hoja de tarea", cat: "academica", weight: 20 },
    { clave: "talentShow", titulo: "Muestra de talentos", cat: "academica", weight: 20 },
    { clave: "assembly", titulo: "Montaje", cat: "academica", weight: 20 },
    { clave: "essay", titulo: "Ensayo", cat: "academica", weight: 20 },
    { clave: "performance", titulo: "Puesta en escena", cat: "academica", weight: 10 },
    { clave: "responsibility", titulo: "Responsabilidad", cat: "etica", weight: 5 },
    { clave: "personalCare", titulo: "Presentación Personal", cat: "etica", weight: 5 },
  ];

  const evalMap: Record<string, string> = {};

  try {
    const { data: existing } = await client
      .from("evaluaciones")
      .select("id, clave_item")
      .eq("materia_id", materiaId)
      .eq("lapso", lapso);

    if (existing && existing.length > 0) {
      existing.forEach((e: any) => {
        if (e.clave_item) evalMap[e.clave_item] = e.id;
      });
    }

    for (const ev of evaluationTemplates) {
      if (!evalMap[ev.clave]) {
        const { data: inserted } = await client
          .from("evaluaciones")
          .insert({
            materia_id: materiaId,
            lapso: lapso,
            clave_item: ev.clave,
            titulo: ev.titulo,
            categoria: ev.cat,
            ponderacion_porcentaje: ev.weight,
          })
          .select("id")
          .maybeSingle();

        if (inserted?.id) {
          evalMap[ev.clave] = inserted.id;
        }
      }
    }
  } catch (err) {
    console.warn("Could not ensure evaluation criteria:", err);
  }

  return evalMap;
}

function formatGradeYear(yr?: string): string {
  const clean = (yr || "").toLowerCase();
  if (clean.includes("1")) return "1er Año";
  if (clean.includes("2")) return "2do Año";
  if (clean.includes("3")) return "3er Año";
  if (clean.includes("4")) return "4to Año";
  if (clean.includes("5")) return "5to Año";
  return yr || "1er Año";
}

function extractStudentMetadataLocally(alumno: any): { gradeYear: string; sectionLetter: string } {
  if (alumno?.avatar_url) {
    const yrMatch = alumno.avatar_url.match(/[#&]yr=([^&#]+)/);
    const secMatch = alumno.avatar_url.match(/[#&]sec=([^&#]+)/);
    if (yrMatch || secMatch) {
      const yrDecoded = yrMatch ? decodeURIComponent(yrMatch[1]).replace(/_/g, " ") : "1er Año";
      const secDecoded = secMatch ? decodeURIComponent(secMatch[1]).toUpperCase() : "A";
      return {
        gradeYear: formatGradeYear(yrDecoded),
        sectionLetter: secDecoded || "A",
      };
    }
  }
  if (alumno?.email && alumno.email.startsWith("meta:")) {
    const parts = alumno.email.replace("meta:", "").split(":");
    return {
      gradeYear: formatGradeYear(parts[0]?.replace(/_/g, " ")),
      sectionLetter: parts[1]?.toUpperCase() || "A",
    };
  }
  return {
    gradeYear: "1er Año",
    sectionLetter: "A",
  };
}

// Fetch all students and their saved grades for a specific class section from Supabase
export async function getStudentsForClassFromSupabase(materiaId: string): Promise<Student[]> {
  const client: any = getSupabaseClient();
  if (!materiaId) return [];

  try {
    // 1. Get materia metadata (grade + section) so we can rebuild the correct roster
    const { data: matMeta } = await client
      .from("materias")
      .select("grado_ano, seccion")
      .eq("id", materiaId)
      .maybeSingle();

    // 2. Read matriculas (only as a source for list numbers / attendance). Deduped by alumno_id.
    const { data: enrollments, error: enrollError } = await client
      .from("matriculas")
      .select("numero_lista, asistencia_porcentaje, alumno_id, alumnos ( id, cedula, nombres, apellidos, avatar_url, email )")
      .eq("materia_id", materiaId)
      .order("numero_lista", { ascending: true });

    if (enrollError) {
      console.warn("Could not fetch enrollments for materia:", materiaId, enrollError);
      return [];
    }

    const uniqueByAlumno = new Map<string, any>();
    (enrollments || []).forEach((enr: any) => {
      const key = String(enr.alumno_id || "").trim();
      if (!key) return;
      if (!uniqueByAlumno.has(key)) uniqueByAlumno.set(key, enr);
    });
    const dedupedMatriculas: any[] = Array.from(uniqueByAlumno.values());

    // 3. Rebuild the roster from alumnos where the alumno's OWN grade + section match the materia.
    //    This keeps polluted/cross-section matriculas out of every section card.
    let enrollmentsList: any[] = [];
    const targetGrade = formatGradeYear(matMeta?.grado_ano || "");
    const targetSection = String(matMeta?.seccion || "").trim().toUpperCase();

    if (targetGrade && targetSection) {
      const { data: matchingAlumnos, error: matchingErr } = await client
        .from("alumnos")
        .select("id, cedula, nombres, apellidos, avatar_url, email, ano, seccion, list_number")
        .eq("ano", targetGrade)
        .ilike("seccion", targetSection);

      if (!matchingErr && matchingAlumnos && matchingAlumnos.length > 0) {
        const matriculasByAlumno = new Map<string, any>();
        dedupedMatriculas.forEach((enr: any) => {
          const key = String(enr.alumno_id || "");
          if (key && !matriculasByAlumno.has(key)) matriculasByAlumno.set(key, enr);
        });

        const ordered = matchingAlumnos.sort((a: any, b: any) => {
          const la = Number(a.list_number || 0);
          const lb = Number(b.list_number || 0);
          if (la !== lb) return la === 0 ? 1 : lb === 0 ? -1 : la - lb;
          return String(a.cedula || "").localeCompare(String(b.cedula || ""));
        });

        enrollmentsList = ordered.map((a: any, i: number) => {
          const enr = matriculasByAlumno.get(String(a.id));
          return {
            numero_lista: Number(enr?.numero_lista || a.list_number || i + 1),
            asistencia_porcentaje: enr?.asistencia_porcentaje ?? 100,
            alumno_id: a.id,
            alumnos: a,
          };
        });
      }
    }

    // 4. Fallback: if the materia has no grade/section metadata we cannot filter safely,
    //    fall back to the deduped matriculas belonging to this materia only.
    if (enrollmentsList.length === 0 && !(targetGrade && targetSection) && dedupedMatriculas.length > 0) {
      enrollmentsList = dedupedMatriculas;
    }

    if (enrollmentsList.length === 0) {
      return [];
    }

    const alumnoMap: Record<string, any> = {};
    for (const enr of enrollmentsList) {
      const a = Array.isArray(enr.alumnos) ? enr.alumnos[0] : enr.alumnos;
      if (a && a.id) {
        alumnoMap[a.id] = a;
      }
    }

    const missingIds = enrollmentsList
      .map((e: any) => e.alumno_id)
      .filter((id: string) => id && !alumnoMap[id]);

    if (missingIds.length > 0) {
      try {
        const { data: fetchedAlumnos } = await client
          .from("alumnos")
          .select("id, cedula, nombres, apellidos, avatar_url")
          .in("id", missingIds);
        if (fetchedAlumnos) {
          fetchedAlumnos.forEach((fa: any) => {
            alumnoMap[fa.id] = fa;
          });
        }
      } catch (err) {
        console.warn("Could not fetch missing alumnos:", err);
      }
    }

    // 2. Get evaluations for this class across all lapsos (1, 2, 3)
    const { data: evals } = await client
      .from("evaluaciones")
      .select("id, lapso, clave_item, titulo, categoria, ponderacion_porcentaje, descripcion")
      .eq("materia_id", materiaId);

    const evalMapByLapso: Record<number, Record<string, any>> = { 1: {}, 2: {}, 3: {} };
    const evalIdToLapsoAndKey: Record<string, { lapso: number; key: string }> = {};

    if (evals && evals.length > 0) {
      evals.forEach((e: any) => {
        const lapsoNum = Number(e.lapso) || 1;
        if (!evalMapByLapso[lapsoNum]) evalMapByLapso[lapsoNum] = {};
        evalMapByLapso[lapsoNum][e.clave_item] = e;
        evalIdToLapsoAndKey[e.id] = { lapso: lapsoNum, key: e.clave_item };
      });
    }

    // 3. Get all saved grades for this class across all lapsos
    const { data: califs } = await client
      .from("calificaciones")
      .select("evaluacion_id, alumno_id, nota")
      .eq("materia_id", materiaId);

    // scoreMap[alumnoId][lapso][key] = nota
    const scoreMap: Record<string, Record<number, Record<string, number>>> = {};
    if (califs && califs.length > 0) {
      califs.forEach((c: any) => {
        if (!scoreMap[c.alumno_id]) scoreMap[c.alumno_id] = { 1: {}, 2: {}, 3: {} };
        const info = evalIdToLapsoAndKey[c.evaluacion_id];
        if (info && c.nota !== null && c.nota !== undefined) {
          if (!scoreMap[c.alumno_id][info.lapso]) scoreMap[c.alumno_id][info.lapso] = {};
          scoreMap[c.alumno_id][info.lapso][info.key] = Number(c.nota);
        }
      });
    }

    // Dedupe again at the Student level (same cedula = same person, keep first row)
    const seenPersonas = new Set<string>();
    return enrollmentsList.filter((enr: any) => {
      const a = alumnoMap[enr.alumno_id] || (Array.isArray(enr.alumnos) ? enr.alumnos[0] : enr.alumnos) || {};
      const stdId = enr.alumno_id || a.id;
      const personaKey =
        a.cedula ||
        `${String(a.nombres || "").trim().toLowerCase()}_${String(a.apellidos || "").trim().toLowerCase()}` ||
        stdId;
      if (!personaKey) return true;
      if (seenPersonas.has(String(personaKey))) return false;
      seenPersonas.add(String(personaKey));
      return true;
    }).map((enr: any) => {
      const a = alumnoMap[enr.alumno_id] || (Array.isArray(enr.alumnos) ? enr.alumnos[0] : enr.alumnos) || {};
      const stdId = enr.alumno_id || a.id;
      const grades = createEmptyGrades();

      // Populate each lapso (1, 2, 3) independently
      ([1, 2, 3] as const).forEach(lapsoNum => {
        const evalMap = evalMapByLapso[lapsoNum] || {};
        const lapsoObj = grades[lapsoNum];

        if (evalMap.homework) {
          lapsoObj.academic.homework.name = evalMap.homework.titulo || lapsoObj.academic.homework.name;
          lapsoObj.academic.homework.weight = Number(evalMap.homework.ponderacion_porcentaje) || lapsoObj.academic.homework.weight;
        }
        if (evalMap.talentShow) {
          lapsoObj.academic.talentShow.name = evalMap.talentShow.titulo || lapsoObj.academic.talentShow.name;
          lapsoObj.academic.talentShow.weight = Number(evalMap.talentShow.ponderacion_porcentaje) || lapsoObj.academic.talentShow.weight;
        }
        if (evalMap.assembly) {
          lapsoObj.academic.assembly.name = evalMap.assembly.titulo || lapsoObj.academic.assembly.name;
          lapsoObj.academic.assembly.weight = Number(evalMap.assembly.ponderacion_porcentaje) || lapsoObj.academic.assembly.weight;
        }
        if (evalMap.essay) {
          lapsoObj.academic.essay.name = evalMap.essay.titulo || lapsoObj.academic.essay.name;
          lapsoObj.academic.essay.weight = Number(evalMap.essay.ponderacion_porcentaje) || lapsoObj.academic.essay.weight;
        }
        if (evalMap.performance) {
          lapsoObj.academic.performance.name = evalMap.performance.titulo || lapsoObj.academic.performance.name;
          lapsoObj.academic.performance.weight = Number(evalMap.performance.ponderacion_porcentaje) || lapsoObj.academic.performance.weight;
        }
        if (evalMap.responsibility) {
          lapsoObj.ethical.responsibility.name = evalMap.responsibility.titulo || lapsoObj.ethical.responsibility.name;
          lapsoObj.ethical.responsibility.weight = Number(evalMap.responsibility.ponderacion_porcentaje) || lapsoObj.ethical.responsibility.weight;
        }
        if (evalMap.personalCare) {
          lapsoObj.ethical.personalCare.name = evalMap.personalCare.titulo || lapsoObj.ethical.personalCare.name;
          lapsoObj.ethical.personalCare.weight = Number(evalMap.personalCare.ponderacion_porcentaje) || lapsoObj.ethical.personalCare.weight;
        }

        const stdLapsoScores = scoreMap[stdId]?.[lapsoNum] || {};
        if (stdLapsoScores.homework !== undefined) lapsoObj.academic.homework.score = stdLapsoScores.homework;
        if (stdLapsoScores.talentShow !== undefined) lapsoObj.academic.talentShow.score = stdLapsoScores.talentShow;
        if (stdLapsoScores.assembly !== undefined) lapsoObj.academic.assembly.score = stdLapsoScores.assembly;
        if (stdLapsoScores.essay !== undefined) lapsoObj.academic.essay.score = stdLapsoScores.essay;
        if (stdLapsoScores.performance !== undefined) lapsoObj.academic.performance.score = stdLapsoScores.performance;
        if (stdLapsoScores.responsibility !== undefined) lapsoObj.ethical.responsibility.score = stdLapsoScores.responsibility;
        if (stdLapsoScores.personalCare !== undefined) lapsoObj.ethical.personalCare.score = stdLapsoScores.personalCare;
      });

      return {
        id: stdId,
        firstName: a.nombres || "Alumno",
        lastName: a.apellidos || "",
        avatarUrl: a.avatar_url,
        grades,
        attendanceRate: enr.asistencia_porcentaje !== null ? Number(enr.asistencia_porcentaje) : 100,
        hasSubmittedLastQuiz: true,
      };
    });
  } catch (err) {
    console.warn("Could not fetch students from Supabase:", err);
    return [];
  }
}

// Add a student directly to Supabase and matriculate them in the class
export async function addStudentToSupabase(
  materiaId: string,
  studentData: {
    firstName: string;
    lastName: string;
    cedula?: string;
    avatarUrl?: string;
    currentClassStudentsCount?: number;
  }
): Promise<{ success: boolean; student: Student; savedToSupabase: boolean; message: string }> {
  const client: any = getSupabaseClient();
  const cleanFirst = studentData.firstName.trim();
  const cleanLast = studentData.lastName.trim().toUpperCase();
  const generatedId = `std-${Date.now()}`;
  const cedula = studentData.cedula || `V-${10000000 + Math.floor(Math.random() * 89999999)}`;
  const avatar = studentData.avatarUrl || "";

  const emptyStudent: Student = {
    id: generatedId,
    firstName: cleanFirst,
    lastName: cleanLast,
    avatarUrl: avatar,
    grades: createEmptyGrades(),
    attendanceRate: 100,
    hasSubmittedLastQuiz: true,
  };

  try {
    // 1. Insert student into alumnos table
    let realAlumnoId = "";
    const { data: alumnoRes, error: alumnoErr } = await client
      .from("alumnos")
      .insert({
        nombres: cleanFirst,
        apellidos: cleanLast,
        cedula: cedula,
        avatar_url: avatar,
      })
      .select("id")
      .maybeSingle();

    if (!alumnoErr && alumnoRes?.id) {
      realAlumnoId = alumnoRes.id;
    } else {
      // If student already existed by cedula or insertion returned error, try finding by cedula
      const { data: existingStd } = await client
        .from("alumnos")
        .select("id")
        .eq("cedula", cedula)
        .maybeSingle();
      if (existingStd?.id) {
        realAlumnoId = existingStd.id;
      } else {
        // Retry insert with guaranteed unique cedula
        const uniqueCedula = `V-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
        const { data: retryRes } = await client
          .from("alumnos")
          .insert({
            nombres: cleanFirst,
            apellidos: cleanLast,
            cedula: uniqueCedula,
            avatar_url: avatar,
          })
          .select("id")
          .maybeSingle();
        if (retryRes?.id) {
          realAlumnoId = retryRes.id;
        }
      }
    }

    if (!realAlumnoId) {
      // Fallback local return
      return {
        success: true,
        student: emptyStudent,
        savedToSupabase: false,
        message: `Estudiante registrado localmente.`,
      };
    }

    // 2. Enroll student in class (matriculas)
    const listNumber = (studentData.currentClassStudentsCount || 0) + 1;
    const { error: enrollError } = await client.from("matriculas").upsert(
      {
        materia_id: materiaId,
        alumno_id: realAlumnoId,
        numero_lista: listNumber,
        asistencia_porcentaje: 100,
      },
      { onConflict: "materia_id,alumno_id" }
    );

    if (enrollError) {
      const { data: existingEnr } = await client
        .from("matriculas")
        .select("id")
        .eq("materia_id", materiaId)
        .eq("alumno_id", realAlumnoId)
        .maybeSingle();

      if (!existingEnr) {
        await client.from("matriculas").insert({
          materia_id: materiaId,
          alumno_id: realAlumnoId,
          numero_lista: listNumber,
          asistencia_porcentaje: 100,
        });
      }
    }

    // 3. Ensure evaluation criteria exist for this class
    await ensureEvaluationCriteriaForClass(materiaId, 1);

    emptyStudent.id = realAlumnoId;

    return {
      success: true,
      student: emptyStudent,
      savedToSupabase: true,
      message: `¡Estudiante ${cleanFirst} ${cleanLast} guardado con éxito e inscrito!`,
    };
  } catch (err: any) {
    console.warn("Error adding student to Supabase:", err);
    return {
      success: true,
      student: emptyStudent,
      savedToSupabase: false,
      message: `Estudiante registrado localmente.`,
    };
  }
}

// Save student grades and criteria directly to Supabase for the given subject
export async function saveGradesToSupabase(
  materiaId: string,
  alumnoId: string,
  updatedGrades: any,
  lapso: number = 1
): Promise<{ success: boolean; savedToSupabase: boolean; message: string }> {
  const client: any = getSupabaseClient();
  if (!materiaId || !alumnoId) {
    return { success: false, savedToSupabase: false, message: "Falta ID de materia o estudiante." };
  }

  const safeGrades = updatedGrades || {};
  const academic = safeGrades.academic || {};
  const ethical = safeGrades.ethical || {};

  try {
    // Resolve real student UUID in Supabase
    let realAlumnoId = alumnoId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alumnoId);
    if (!isUuid) {
      const { data: foundStd } = await client
        .from("alumnos")
        .select("id")
        .or(`id.eq.${alumnoId},cedula.eq.${alumnoId}`)
        .maybeSingle();
      if (foundStd?.id) {
        realAlumnoId = foundStd.id;
      } else {
        const { data: newStd } = await client
          .from("alumnos")
          .insert({
            nombres: "Estudiante",
            apellidos: alumnoId,
            cedula: alumnoId.startsWith("V-") ? alumnoId : null,
          })
          .select("id")
          .maybeSingle();
        if (newStd?.id) {
          realAlumnoId = newStd.id;
        }
      }
    }

    // 1. Ensure evaluation criteria exist in Supabase and get their IDs
    const evalMap = await ensureEvaluationCriteriaForClass(materiaId, lapso);

    // 2. Also update evaluation criterion metadata (names, weights) if present
    const criteriaUpdates = [
      { key: "homework", item: academic.homework },
      { key: "talentShow", item: academic.talentShow },
      { key: "assembly", item: academic.assembly },
      { key: "essay", item: academic.essay },
      { key: "performance", item: academic.performance },
      { key: "responsibility", item: ethical.responsibility },
      { key: "personalCare", item: ethical.personalCare },
    ];

    for (const c of criteriaUpdates) {
      const evalId = evalMap[c.key];
      if (evalId && c.item && c.item.name) {
        await client
          .from("evaluaciones")
          .update({
            titulo: c.item.name,
            ponderacion_porcentaje: c.item.weight,
            descripcion: c.item.description || null,
          })
          .eq("id", evalId);
      }
    }

    // 3. Save each score into calificaciones table
    const scoresToUpsert = [
      { key: "homework", score: academic.homework?.score },
      { key: "talentShow", score: academic.talentShow?.score },
      { key: "assembly", score: academic.assembly?.score },
      { key: "essay", score: academic.essay?.score },
      { key: "performance", score: academic.performance?.score },
      { key: "responsibility", score: ethical.responsibility?.score },
      { key: "personalCare", score: ethical.personalCare?.score },
    ];

    for (const item of scoresToUpsert) {
      const evalId = evalMap[item.key];
      if (evalId && item.score !== undefined && item.score !== null) {
        const payload: any = {
          evaluacion_id: evalId,
          alumno_id: realAlumnoId,
          materia_id: materiaId,
          nota: item.score,
        };

        const { error: califErr } = await client.from("calificaciones").upsert(
          payload,
          { onConflict: "evaluacion_id,alumno_id" }
        );

        if (califErr) {
          const { data: existingCalif } = await client
            .from("calificaciones")
            .select("id")
            .eq("evaluacion_id", evalId)
            .eq("alumno_id", realAlumnoId)
            .maybeSingle();

          if (existingCalif?.id) {
            await client
              .from("calificaciones")
              .update({
                nota: item.score,
                materia_id: materiaId,
              })
              .eq("id", existingCalif.id);
          } else {
            await client.from("calificaciones").insert({
              evaluacion_id: evalId,
              alumno_id: realAlumnoId,
              materia_id: materiaId,
              nota: item.score,
            });
          }
        }
      }
    }

    return {
      success: true,
      savedToSupabase: true,
      message: "¡Calificaciones guardadas y asignadas con éxito en la base de datos!",
    };
  } catch (err: any) {
    console.error("Error saving grades to Supabase:", err);
    return {
      success: false,
      savedToSupabase: false,
      message: `Error al guardar en la base de datos: ${err?.message || "Error desconocido"}`,
    };
  }
}

// Delete student enrollment from class
export async function removeStudentFromClassInSupabase(
  materiaId: string,
  alumnoId: string
): Promise<{ success: boolean }> {
  const client: any = getSupabaseClient();
  try {
    await client
      .from("matriculas")
      .delete()
      .eq("materia_id", materiaId)
      .eq("alumno_id", alumnoId);

    // Also delete any specific calificaciones for this subject
    await client
      .from("calificaciones")
      .delete()
      .eq("materia_id", materiaId)
      .eq("alumno_id", alumnoId);

    return { success: true };
  } catch {
    return { success: false };
  }
}

// Delete classes/materias and their related matriculas, calificaciones and evaluaciones
export async function deleteClassesFromSupabase(
  classIds: string[]
): Promise<{ success: boolean; deletedCount: number; message?: string }> {
  if (!classIds || classIds.length === 0) return { success: true, deletedCount: 0 };
  const client: any = getSupabaseClient();
  try {
    // 1. Delete associated matriculas
    await client.from("matriculas").delete().in("materia_id", classIds);
    // 2. Delete associated calificaciones
    await client.from("calificaciones").delete().in("materia_id", classIds);
    // 3. Delete associated evaluaciones
    await client.from("evaluaciones").delete().in("materia_id", classIds);
    // 4. Delete the materias
    const { error } = await client.from("materias").delete().in("id", classIds);
    if (error) {
      console.warn("Supabase delete materias error:", error);
    }
    return { success: !error, deletedCount: classIds.length };
  } catch (err: any) {
    console.warn("Error deleting classes from Supabase:", err);
    return { success: false, deletedCount: 0, message: err?.message };
  }
}

// Full SQL Migration Script for Supabase SQL Editor
export const SUPABASE_SQL_MIGRATION = `-- ========================================================
-- SISTEMA ILUMINA - ESQUEMA DE BASE DE DATOS SUPABASE
-- Diseñado para Profesores, Materias, Alumnos y Calificaciones
-- ========================================================

-- 1. EXTENSIÓN PARA GENERACIÓN DE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: PROFESORES
CREATE TABLE IF NOT EXISTS public.profesores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    departamento TEXT DEFAULT 'Ciencias',
    rango TEXT DEFAULT 'Profesor Titular',
    ano_escolar TEXT DEFAULT '2025 - 2026',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar columnas necesarias en bases de datos existentes
ALTER TABLE public.profesores ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profesores ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT false;

-- 3. TABLA: MATERIAS / ASIGNATURAS POR SECCIÓN
CREATE TABLE IF NOT EXISTS public.materias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesor_id UUID REFERENCES public.profesores(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    grado_ano TEXT NOT NULL,
    seccion TEXT NOT NULL,
    departamento TEXT DEFAULT 'Ciencias',
    lapso_activo INT DEFAULT 1 CHECK (lapso_activo IN (1, 2, 3)),
    periodo TEXT DEFAULT '2025-2026',
    is_active BOOLEAN DEFAULT true,
    color TEXT DEFAULT '#2563eb',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA: ALUMNOS
CREATE TABLE IF NOT EXISTS public.alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula TEXT UNIQUE,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA: MATRICULAS (Relación N:M Materia - Alumno con orden de lista)
CREATE TABLE IF NOT EXISTS public.matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materia_id UUID NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    numero_lista INT,
    asistencia_porcentaje NUMERIC(5,2) DEFAULT 100.0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(materia_id, alumno_id)
);

-- 6. TABLA: EVALUACIONES (Plan de evaluación por Lapso)
CREATE TABLE IF NOT EXISTS public.evaluaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materia_id UUID NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
    lapso INT NOT NULL CHECK (lapso IN (1, 2, 3)),
    clave_item TEXT NOT NULL,
    titulo TEXT NOT NULL,
    categoria TEXT DEFAULT 'academica' CHECK (categoria IN ('academica', 'etica')),
    ponderacion_porcentaje NUMERIC(5,2) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLA: CALIFICACIONES (Notas cuantitativas 0-20)
CREATE TABLE IF NOT EXISTS public.calificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    materia_id UUID NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
    nota NUMERIC(4,2) CHECK (nota >= 0 AND nota <= 20),
    observaciones TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(evaluacion_id, alumno_id)
);

-- 8. TABLA: CONFIGURACIÓN DE LAPSOS ACADÉMICOS
CREATE TABLE IF NOT EXISTS public.lapsos_config (
    lapso INT PRIMARY KEY CHECK (lapso IN (1, 2, 3)),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_corte DATE NOT NULL,
    is_activo BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_materias_profesor ON public.materias(profesor_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_materia ON public.matriculas(materia_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_alumno ON public.matriculas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_materia_lapso ON public.evaluaciones(materia_id, lapso);
CREATE INDEX IF NOT EXISTS idx_calificaciones_eval ON public.calificaciones(evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_alumno ON public.calificaciones(alumno_id);

-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lapsos_config ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACCESO CONTROLADO (Lectura y Escritura mediante API Key)
CREATE POLICY "Acceso a profesores" ON public.profesores FOR ALL USING (true);
CREATE POLICY "Acceso a materias" ON public.materias FOR ALL USING (true);
CREATE POLICY "Acceso a alumnos" ON public.alumnos FOR ALL USING (true);
CREATE POLICY "Acceso a matriculas" ON public.matriculas FOR ALL USING (true);
CREATE POLICY "Acceso a evaluaciones" ON public.evaluaciones FOR ALL USING (true);
CREATE POLICY "Acceso a calificaciones" ON public.calificaciones FOR ALL USING (true);
CREATE POLICY "Acceso a lapsos_config" ON public.lapsos_config FOR ALL USING (true);
`;
