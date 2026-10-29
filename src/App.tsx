import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  getWeightedFinalScore,
  createEmptyGrades
} from "./mockData";
import { ClassSection, Student, TeacherProfile, PendingGradeTask, SubjectGroup } from "./types";
import DashboardView from "./components/DashboardView";
import ClassOverviewView from "./components/ClassOverviewView";
import SubjectSectionsView from "./components/SubjectSectionsView";
import SubjectsListView from "./components/SubjectsListView";
import GradingView from "./components/GradingView";
import ProfileView from "./components/ProfileView";
import TeacherRegisterView from "./components/TeacherRegisterView";
import AdminPanelView from "./components/AdminPanelView";
import {
  isUserAdmin,
  getRegisteredStudentsForSection,
  convertRegisteredToClassStudents,
  fetchRegisteredStudentsFromDatabase
} from "./lib/adminService";
import { AddStudentsModal, StudentCandidate } from "./components/AddStudentsModal";
import {
  getSupabaseClient,
  createSubjectInSupabase,
  getTeacherClassesFromSupabase,
  addStudentToSupabase,
  saveGradesToSupabase,
  removeStudentFromClassInSupabase,
  deleteClassesFromSupabase,
  cleanAvatarUrl
} from "./lib/supabase";
import {
  IluminaLogo,
  BrujulaLogoAnimated,
  PolaroidAvatar,
  SpriteObject
} from "./components/BitacoraBrand";
import {
  Sparkles,
  Bell,
  Home,
  School,
  User,
  X,
  Plus,
  Check,
  AlertTriangle,
  UserPlus,
  ChevronRight,
  LogOut,
  BookOpen,
  ShieldCheck,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function calculateProgressPercent(start: string, end: string, current: string): number {
  const startTime = new Date(start + "T00:00:00").getTime();
  const endTime = new Date(end + "T00:00:00").getTime();
  const currentTime = new Date(current + "T00:00:00").getTime();

  if (isNaN(startTime) || isNaN(endTime) || isNaN(currentTime)) return 0;
  if (endTime <= startTime) return 100;
  
  if (currentTime <= startTime) return 0;
  if (currentTime >= endTime) return 100;

  const total = endTime - startTime;
  const elapsed = currentTime - startTime;
  return Math.round((elapsed / total) * 100);
}

export function getCalendarLapsoForDate(
  dateStr: string,
  dates: Record<1 | 2 | 3, { start: string; end: string }>
): 1 | 2 | 3 {
  const target = new Date(dateStr + "T00:00:00").getTime();
  if (isNaN(target)) return 1;

  const l1Start = new Date(dates[1].start + "T00:00:00").getTime();
  const l1End = new Date(dates[1].end + "T23:59:59").getTime();
  if (target >= l1Start && target <= l1End) return 1;

  const l2Start = new Date(dates[2].start + "T00:00:00").getTime();
  const l2End = new Date(dates[2].end + "T23:59:59").getTime();
  if (target >= l2Start && target <= l2End) return 2;

  const l3Start = new Date(dates[3].start + "T00:00:00").getTime();
  const l3End = new Date(dates[3].end + "T23:59:59").getTime();
  if (target >= l3Start && target <= l3End) return 3;

  if (target < l1Start) return 1;
  if (target > l1End && target < l2Start) return 1;
  if (target > l2End && target < l3Start) return 2;
  return 3;
}

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth <= 760) {
        setIsScrolled(window.scrollY > 15);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Teacher session state (null when not logged in)
  const [teacher, setTeacher] = useState<TeacherProfile | null>(() => {
    const saved = localStorage.getItem("ilumina_current_teacher");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (!parsed.email) {
            const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
            const firstEmail = Object.keys(creds)[0];
            parsed.email = firstEmail || "profesor@ilumina.edu";
          }
          parsed.avatarUrl = cleanAvatarUrl(parsed.avatarUrl);
          return parsed;
        }
      } catch (e) {
        console.error("Error loading saved teacher:", e);
      }
    }
    return null;
  });

  // Classes state (empty or loaded from local storage, without any dummy example subjects)
  const [classes, setClasses] = useState<ClassSection[]>(() => {
    // Purge old mock storage
    localStorage.removeItem("ilumina_classes_state");
    const savedTeacher = localStorage.getItem("ilumina_current_teacher");
    if (savedTeacher) {
      try {
        const teacherObj = JSON.parse(savedTeacher);
        const emailKey = teacherObj?.email || teacherObj?.id || "default";
        const saved = localStorage.getItem(`ilumina_classes_${emailKey.toLowerCase()}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter(c => 
              !c.id.startsWith("class-math-") && 
              !c.id.startsWith("class-crp-") && 
              !c.id.startsWith("mock-") &&
              c.id !== "class-init" && 
              !c.subjectName?.includes("Aula 1") && 
              c.subjectName !== "Cátedra Principal"
            );
          }
        }
      } catch (e) {
        console.error("Error loading saved classes:", e);
      }
    }
    return [];
  });

  // Automatically fetch teacher's real subjects from Supabase whenever teacher changes
  useEffect(() => {
    if (!teacher) {
      setClasses([]);
      return;
    }

    const teacherIdentifier = teacher.id || teacher.email || "";
    if (!teacherIdentifier) return;

    let isMounted = true;
    fetchRegisteredStudentsFromDatabase()
      .catch(() => [])
      .then(() => getTeacherClassesFromSupabase(teacherIdentifier, teacher.name))
      .then((supaClasses) => {
        if (!isMounted) return;
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        if (supaClasses && supaClasses.length > 0) {
          // Auto-fill students registered for this year and section if class has none
          const enriched = supaClasses.map(cls => {
            const matching = getRegisteredStudentsForSection(cls.gradeYear, cls.sectionLetter);
            if (matching.length > 0) {
              // Auto-enroll in Supabase matriculas in background
              try {
                const client: any = getSupabaseClient();
                matching.forEach((reg, i) => {
                  client.from("matriculas").upsert({
                    materia_id: cls.id,
                    alumno_id: reg.id,
                    numero_lista: i + 1,
                    asistencia_porcentaje: 100,
                  }, { onConflict: "materia_id,alumno_id" }).catch(() => {});
                });
              } catch {}

              return {
                ...cls,
                students: convertRegisteredToClassStudents(matching),
              };
            }
            if (!cls.students || cls.students.length === 0) {
              if (matching.length > 0) {
                return {
                  ...cls,
                  students: convertRegisteredToClassStudents(matching),
                };
              }
            }
            return cls;
          });
          setClasses(enriched);
          localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(enriched));
        } else {
          // If classes were saved locally for this teacher, check and retain them
          const localSaved = localStorage.getItem(`ilumina_classes_${storageKey}`);
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setClasses(parsed);
                return;
              }
            } catch {}
          }
          setClasses([]);
          localStorage.removeItem(`ilumina_classes_${storageKey}`);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch classes from Supabase:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [teacher?.id, teacher?.email]);

  // Synchronize teacher admin status live from Supabase (e.g. when modified in Supabase Table Editor)
  useEffect(() => {
    if (!teacher?.email && !teacher?.id) return;
    const client: any = getSupabaseClient();
    const query = teacher.id
      ? client.from("profesores").select("*").eq("id", teacher.id)
      : client.from("profesores").select("*").eq("email", teacher.email.toLowerCase());

    let isMounted = true;
    query.maybeSingle().then(({ data }: any) => {
      if (!isMounted || !data) return;
      const adminFromDb = Boolean(
        data.is_admin === true ||
        data.admin === true ||
        data.isAdmin === true ||
        String(data.status || "").toLowerCase().includes("admin") ||
        String(data.rango || "").toLowerCase().includes("admin") ||
        String(data.rol || data.role || "").toLowerCase() === "admin"
      );

      if (adminFromDb !== Boolean(teacher.isAdmin) || (data.status && data.status !== teacher.status)) {
        setTeacher(prev => prev ? {
          ...prev,
          isAdmin: adminFromDb,
          status: data.status || (adminFromDb ? "ADMIN" : prev.status),
        } : prev);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [teacher?.id, teacher?.email]);

  const [pendingTasks, setPendingTasks] = useState<PendingGradeTask[]>([]);

  // Helper to obtain actual real-world today date (YYYY-MM-DD)
  const getTodayDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDateString();

  // Term and Date Management states
  const [lapsoDates, setLapsoDates] = useState<Record<1 | 2 | 3, { start: string; end: string }>>(() => {
    const saved = localStorage.getItem("ilumina_lapso_dates");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[1]?.start && parsed[1]?.end) {
          return {
            1: { start: parsed[1].start, end: parsed[1].end },
            2: { start: parsed[2].start, end: parsed[2].end },
            3: { start: parsed[3].start, end: parsed[3].end },
          };
        }
      } catch (e) {}
    }
    return {
      1: { start: "2026-10-01", end: "2026-12-18" },
      2: { start: "2027-01-08", end: "2027-03-26" },
      3: { start: "2027-04-12", end: "2027-07-16" }
    };
  });

  // Calculate calendar real-time current lapso based on today's date
  const calendarCurrentLapso = useMemo(() => {
    return getCalendarLapsoForDate(todayDate, lapsoDates);
  }, [todayDate, lapsoDates]);

  const [activeLapso, setActiveLapso] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem("ilumina_active_lapso");
    if (saved) {
      const parsed = parseInt(saved);
      if (parsed === 1 || parsed === 2 || parsed === 3) {
        return parsed as 1 | 2 | 3;
      }
    }
    // Synchronize by default with the calendar current lapso in real time
    return getCalendarLapsoForDate(getTodayDateString(), {
      1: { start: "2026-10-01", end: "2026-12-18" },
      2: { start: "2027-01-08", end: "2027-03-26" },
      3: { start: "2027-04-12", end: "2027-07-16" }
    });
  });

  const handleSyncWithCurrentLapso = () => {
    setActiveLapso(calendarCurrentLapso);
  };

  // Calculate dynamic progress synchronized with real-time current date
  const currentLapsoPeriod = lapsoDates[activeLapso] || { start: "2026-10-01", end: "2026-12-18" };
  const termProgressPercent = calculateProgressPercent(
    currentLapsoPeriod.start,
    currentLapsoPeriod.end,
    todayDate
  );

  // Keep teacher's termProgressPercent in sync
  useEffect(() => {
    if (teacher && teacher.termProgressPercent !== termProgressPercent) {
      setTeacher(prev => prev ? { ...prev, termProgressPercent } : prev);
    }
  }, [termProgressPercent]);

  // Persist teacher profile to localStorage
  useEffect(() => {
    if (teacher) {
      localStorage.setItem("ilumina_current_teacher", JSON.stringify(teacher));
    } else {
      localStorage.removeItem("ilumina_current_teacher");
    }
  }, [teacher]);

  // Persist settings to localstorage
  useEffect(() => {
    localStorage.setItem("ilumina_active_lapso", activeLapso.toString());
  }, [activeLapso]);

  useEffect(() => {
    localStorage.setItem("ilumina_lapso_dates", JSON.stringify(lapsoDates));
  }, [lapsoDates]);

  // Synchronize dynamic terms and percentages across all ClassSection states
  useEffect(() => {
    setClasses(prevClasses => {
      const hasDiff = prevClasses.some(c => c.lapso !== activeLapso || c.termPercentage !== termProgressPercent);
      if (!hasDiff) return prevClasses;
      return prevClasses.map(cls => ({
        ...cls,
        lapso: activeLapso,
        termPercentage: termProgressPercent
      }));
    });
  }, [activeLapso, termProgressPercent]);

  // Layout and routing states
  const [activeTab, setActiveTab] = useState<"home" | "classes" | "profile" | "admin">("home");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"subjects_list" | "subject_sections" | "section_students">("subjects_list");
  const mainContentRef = useRef<HTMLElement>(null);

  // Automatically scroll to the top when navigating between views, sections, or students
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
      }
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
    };

    scrollToTop();
    const animFrame = requestAnimationFrame(scrollToTop);
    const timer = setTimeout(scrollToTop, 20);

    return () => {
      cancelAnimationFrame(animFrame);
      clearTimeout(timer);
    };
  }, [activeTab, viewMode, selectedClassId, selectedStudentId]);

  // Overlay states
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isStudentGridOpen, setIsStudentGridOpen] = useState(false);
  const [hasUnsavedSectionChanges, setHasUnsavedSectionChanges] = useState(false);
  const [saveSectionChangesFn, setSaveSectionChangesFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    setHasUnsavedSectionChanges(false);
    setSaveSectionChangesFn(null);
  }, [selectedClassId, viewMode]);
  const [newStudentFirst, setNewStudentFirst] = useState("");
  const [newStudentLast, setNewStudentLast] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Add class modal state - default with all sections selected (A, B, C, D, E, F)
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClassSubject, setNewClassSubject] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("1er Año");
  const [newClassSection, setNewClassSection] = useState("A");
  const [selectedSections, setSelectedSections] = useState<string[]>(["A", "B", "C", "D", "E", "F"]);
  const [fillWithDefaultStudents, setFillWithDefaultStudents] = useState<boolean>(true);
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  // Group classes by Subject + Grade Year for hierarchical subject-sections navigation
  const subjectGroups = React.useMemo<SubjectGroup[]>(() => {
    const map = new Map<string, SubjectGroup>();
    classes.forEach(cls => {
      const key = `${cls.subjectName.trim().toLowerCase()}___${cls.gradeYear.trim().toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          subjectName: cls.subjectName,
          gradeYear: cls.gradeYear,
          department: cls.department,
          lapso: cls.lapso,
          sections: [],
          totalStudents: 0,
          averageScore: 0,
          coverUrl: cls.coverUrl,
        });
      }
      const group = map.get(key)!;
      group.sections.push(cls);
    });

    return Array.from(map.values()).map(group => {
      group.sections.sort((a, b) => a.sectionLetter.localeCompare(b.sectionLetter));
      const groupStudents = group.sections.flatMap(s => s.students || []);
      group.totalStudents = groupStudents.length;
      let scoreSum = 0;
      let graded = 0;
      groupStudents.forEach(std => {
        const sc = getWeightedFinalScore(std.grades);
        if (sc > 0) {
          scoreSum += sc;
          graded += 1;
        }
      });
      group.averageScore = graded > 0 ? Number((scoreSum / graded).toFixed(1)) : 0;
      return group;
    });
  }, [classes]);

  // Persist state to localstorage scoped to current teacher
  useEffect(() => {
    if (teacher?.email) {
      if (classes.length > 0) {
        localStorage.setItem(`ilumina_classes_${teacher.email.toLowerCase()}`, JSON.stringify(classes));
      } else {
        localStorage.removeItem(`ilumina_classes_${teacher.email.toLowerCase()}`);
      }
    }
  }, [classes, teacher?.email]);

  // Current selected class (null if no classes exist)
  const currentClass: ClassSection | null = classes.find(c => c.id === selectedClassId) || classes[0] || null;

  // Current active subject group
  const currentSubjectGroup: SubjectGroup | null = React.useMemo(() => {
    if (selectedSubjectKey) {
      const found = subjectGroups.find(g => g.key === selectedSubjectKey);
      if (found) return found;
    }
    if (currentClass) {
      const key = `${currentClass.subjectName.trim().toLowerCase()}___${currentClass.gradeYear.trim().toLowerCase()}`;
      const found = subjectGroups.find(g => g.key === key);
      if (found) return found;
    }
    return subjectGroups[0] || null;
  }, [subjectGroups, selectedSubjectKey, currentClass]);

  // Sibling sections for the active class (same subject & gradeYear)
  const siblingSections = React.useMemo(() => {
    if (!currentClass) return [];
    return classes.filter(
      c => c.subjectName.trim().toLowerCase() === currentClass.subjectName.trim().toLowerCase() &&
           c.gradeYear.trim().toLowerCase() === currentClass.gradeYear.trim().toLowerCase()
    ).sort((a, b) => a.sectionLetter.localeCompare(b.sectionLetter));
  }, [classes, currentClass]);

  const currentStudent = selectedStudentId && currentClass?.students
    ? currentClass.students.find(s => s.id === selectedStudentId) || null 
    : null;

  // Handle saving student grades and evaluation criteria
  const handleSaveStudentGrades = async (studentId: string, updatedGrades: any) => {
    if (!currentClass) return;

    const targetClassId = currentClass.id;
    const lapsoKey = activeLapso || 1;
    const activeLapsoGrades = updatedGrades[lapsoKey] || updatedGrades[1] || updatedGrades;

    // 1. Optimistic UI update - Strictly for the current class being evaluated!
    setClasses(prevClasses => {
      const nextClasses = prevClasses.map(cls => {
        // IMPORTANT: Only update the specific class being graded! Do not leak grades to other subjects.
        if (cls.id !== targetClassId) return cls;

        const updatedStudents = cls.students.map(s => {
          const studentGradesObj = (s.grades && (s.grades[1] || s.grades[2] || s.grades[3])
            ? s.grades
            : { 1: activeLapsoGrades, 2: activeLapsoGrades, 3: activeLapsoGrades }) as Record<number, any>;

          if (s.id === studentId) {
            return {
              ...s,
              grades: {
                ...studentGradesObj,
                [lapsoKey]: activeLapsoGrades
              } as any
            };
          }
          // Propagate updated evaluation criteria (name, description, weight) to other students in THIS same class for activeLapso only
          const targetLapsoGrades = (studentGradesObj[lapsoKey] || activeLapsoGrades) as any;
          return {
            ...s,
            grades: {
              ...studentGradesObj,
              [lapsoKey]: {
                academic: {
                  homework: { ...targetLapsoGrades.academic.homework, name: activeLapsoGrades.academic.homework.name, description: activeLapsoGrades.academic.homework.description, weight: activeLapsoGrades.academic.homework.weight },
                  talentShow: { ...targetLapsoGrades.academic.talentShow, name: activeLapsoGrades.academic.talentShow.name, description: activeLapsoGrades.academic.talentShow.description, weight: activeLapsoGrades.academic.talentShow.weight },
                  assembly: { ...targetLapsoGrades.academic.assembly, name: activeLapsoGrades.academic.assembly.name, description: activeLapsoGrades.academic.assembly.description, weight: activeLapsoGrades.academic.assembly.weight },
                  essay: { ...targetLapsoGrades.academic.essay, name: activeLapsoGrades.academic.essay.name, description: activeLapsoGrades.academic.essay.description, weight: activeLapsoGrades.academic.essay.weight },
                  performance: { ...targetLapsoGrades.academic.performance, name: activeLapsoGrades.academic.performance.name, description: activeLapsoGrades.academic.performance.description, weight: activeLapsoGrades.academic.performance.weight },
                },
                ethical: {
                  responsibility: { ...targetLapsoGrades.ethical.responsibility, name: activeLapsoGrades.ethical.responsibility.name, description: activeLapsoGrades.ethical.responsibility.description, weight: activeLapsoGrades.ethical.responsibility.weight },
                  personalCare: { ...targetLapsoGrades.ethical.personalCare, name: activeLapsoGrades.ethical.personalCare.name, description: activeLapsoGrades.ethical.personalCare.description, weight: activeLapsoGrades.ethical.personalCare.weight },
                }
              }
            } as any
          };
        });

        return {
          ...cls,
          students: updatedStudents
        };
      });

      if (teacher?.email || teacher?.id) {
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(nextClasses));
      }
      return nextClasses;
    });

    // 2. Persist to database silently and reliably for this specific subject
    try {
      await saveGradesToSupabase(targetClassId, studentId, activeLapsoGrades, currentClass.lapso || activeLapso);
    } catch (e) {
      console.warn("Could not persist grades to Supabase:", e);
    }

    setSuccessToast("¡Notas guardadas!");
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // Handle adding existing candidate students (from directory or any other section/year) to the current class
  const handleAddExistingStudentsToClass = async (candidates: StudentCandidate[]) => {
    if (!currentClass || candidates.length === 0) return;

    // Filter candidates that might already exist by ID, cedula or normalized name
    const existingIds = new Set(currentClass.students.map(s => (s.id || "").toLowerCase()));
    const existingCedulas = new Set(currentClass.students.map(s => (s.cedula || "").toLowerCase().trim()).filter(Boolean));
    const existingNames = new Set(currentClass.students.map(s => `${s.firstName.toLowerCase().trim()}_${s.lastName.toLowerCase().trim()}`));

    const toEnroll = candidates.filter(c => {
      if (c.id && existingIds.has(c.id.toLowerCase())) return false;
      if (c.cedula && existingCedulas.has(c.cedula.toLowerCase().trim())) return false;
      const nameKey = `${c.firstName.toLowerCase().trim()}_${c.lastName.toLowerCase().trim()}`;
      if (existingNames.has(nameKey)) return false;
      return true;
    });

    if (toEnroll.length === 0) {
      setSuccessToast("Los alumnos seleccionados ya están en la clase.");
      setTimeout(() => setSuccessToast(""), 3000);
      return;
    }

    const newStudents: Student[] = toEnroll.map((c, idx) => ({
      id: c.id || `std-${Date.now()}-${idx}`,
      firstName: c.firstName,
      lastName: c.lastName,
      cedula: c.cedula,
      gradeYear: c.gradeYear,
      sectionLetter: c.sectionLetter,
      avatarUrl: c.avatarUrl || "",
      grades: createEmptyGrades(),
      attendanceRate: 100,
      hasSubmittedLastQuiz: true,
    }));

    // Update state immediately
    setClasses(prevClasses => {
      const nextClasses = prevClasses.map(cls => {
        if (cls.id !== currentClass.id) return cls;
        return {
          ...cls,
          students: [...cls.students, ...newStudents],
        };
      });

      if (teacher?.email || teacher?.id) {
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(nextClasses));
      }
      return nextClasses;
    });

    // Persist enrollments into Supabase matriculas
    try {
      const client: any = getSupabaseClient();
      const baseCount = currentClass.students.length;
      for (let i = 0; i < toEnroll.length; i++) {
        const cand = toEnroll[i];
        if (cand.id && !cand.id.startsWith("std-enr-") && !cand.id.startsWith("std-cand-")) {
          await client.from("matriculas").upsert({
            materia_id: currentClass.id,
            alumno_id: cand.id,
            numero_lista: baseCount + i + 1,
            asistencia_porcentaje: 100,
          }, { onConflict: "materia_id,alumno_id" }).catch(() => {});
        } else {
          await addStudentToSupabase(currentClass.id, {
            firstName: cand.firstName,
            lastName: cand.lastName,
            cedula: cand.cedula,
            avatarUrl: cand.avatarUrl,
            currentClassStudentsCount: baseCount + i,
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Error persisting enrollments:", e);
    }

    setSuccessToast(`¡${newStudents.length} ${newStudents.length === 1 ? "alumno agregado" : "alumnos agregados"} a la clase!`);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  // Handle adding a brand new manual student directly
  const handleAddNewManualStudent = async (data: {
    firstName: string;
    lastName: string;
    cedula: string;
    gradeYear: string;
    sectionLetter: string;
  }) => {
    if (!currentClass) return;

    const res = await addStudentToSupabase(currentClass.id, {
      firstName: data.firstName,
      lastName: data.lastName,
      cedula: data.cedula,
      currentClassStudentsCount: currentClass.students.length,
    });

    const newStudent: Student = {
      ...res.student,
      cedula: data.cedula || undefined,
      gradeYear: data.gradeYear,
      sectionLetter: data.sectionLetter,
    };

    setClasses(prevClasses => {
      const nextClasses = prevClasses.map(cls => {
        if (cls.id !== currentClass.id) return cls;
        return {
          ...cls,
          students: [...cls.students, newStudent],
        };
      });

      if (teacher?.email || teacher?.id) {
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(nextClasses));
      }
      return nextClasses;
    });

    setSuccessToast("¡Alumno inscrito!");
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // Handle removing a student from the selected class
  const handleDeleteStudent = async (studentId: string) => {
    if (!currentClass) return;
    const std = currentClass.students.find(s => s.id === studentId);
    const stdName = std ? `${std.firstName}` : "Estudiante";

    // Update UI state immediately
    setClasses(prevClasses => {
      const nextClasses = prevClasses.map(cls => {
        if (cls.id !== currentClass.id) return cls;
        return {
          ...cls,
          students: cls.students.filter(s => s.id !== studentId)
        };
      });

      if (teacher?.email || teacher?.id) {
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(nextClasses));
      }
      return nextClasses;
    });

    // Delete from Supabase in background
    try {
      await removeStudentFromClassInSupabase(currentClass.id, studentId);
    } catch {}

    setSuccessToast("¡Alumno retirado!");
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // Handle deleting one or multiple subject groups (materias)
  const handleDeleteSubjectGroups = async (groupKeysToDelete: string[]) => {
    if (!groupKeysToDelete || groupKeysToDelete.length === 0) return;

    // Identify all class IDs associated with the selected group keys
    const groupsToDelete = subjectGroups.filter(g => groupKeysToDelete.includes(g.key));
    const classIdsToDelete: string[] = [];
    groupsToDelete.forEach(g => {
      g.sections.forEach(s => classIdsToDelete.push(s.id));
    });

    if (classIdsToDelete.length === 0) return;

    // Update classes state immediately
    setClasses(prevClasses => {
      const nextClasses = prevClasses.filter(c => !classIdsToDelete.includes(c.id));
      if (teacher?.email || teacher?.id) {
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(nextClasses));
      }
      return nextClasses;
    });

    // Reset current active subject / class if it was deleted
    if (selectedSubjectKey && groupKeysToDelete.includes(selectedSubjectKey)) {
      setSelectedSubjectKey(null);
      setSelectedClassId(null);
      setViewMode("subjects_list");
    } else if (selectedClassId && classIdsToDelete.includes(selectedClassId)) {
      setSelectedClassId(null);
      setViewMode("subjects_list");
    }

    // Delete in Supabase in background
    try {
      await deleteClassesFromSupabase(classIdsToDelete);
    } catch (err) {
      console.warn("Error deleting subject classes from Supabase:", err);
    }

    const count = groupKeysToDelete.length;
    setSuccessToast(count === 1 ? "¡Materia eliminada exitosamente!" : `¡${count} materias eliminadas exitosamente!`);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  // Handle deleting a single section
  const handleDeleteSection = async (sectionId: string) => {
    setClasses(prevClasses => {
      const nextClasses = prevClasses.filter(c => c.id !== sectionId);
      if (teacher?.email || teacher?.id) {
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(nextClasses));
      }
      return nextClasses;
    });

    if (selectedClassId === sectionId) {
      setSelectedClassId(null);
      setViewMode("subjects_list");
    }

    try {
      await deleteClassesFromSupabase([sectionId]);
    } catch {}

    setSuccessToast("¡Sección eliminada!");
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // Handle adding an additional section to an existing subject
  const handleAddNewSectionToSubject = async (sectionLetter: string, fillWithDefault: boolean = true) => {
    if (!currentSubjectGroup || !teacher) return;
    const cleanLetter = sectionLetter.trim().toUpperCase();
    if (currentSubjectGroup.sections.some(s => s.sectionLetter.toUpperCase() === cleanLetter)) {
      setSuccessToast(`Sección ${cleanLetter} ya existe.`);
      setTimeout(() => setSuccessToast(""), 3000);
      return;
    }

    const teacherIdentifier = teacher.id || teacher.email || "";
    const result = await createSubjectInSupabase(teacherIdentifier, {
      subjectName: currentSubjectGroup.subjectName,
      gradeYear: currentSubjectGroup.gradeYear,
      sectionLetter: cleanLetter,
      sections: [cleanLetter],
      department: currentSubjectGroup.department || teacher.department,
      lapso: activeLapso,
      teacherId: teacher.id,
      teacherName: teacher.name,
    });

    if (result.success) {
      const createdList = result.newClasses && result.newClasses.length > 0 
        ? result.newClasses 
        : (result.newClass ? [result.newClass] : []);

      if (createdList.length > 0) {
        // Automatically populate with pre-registered students for this year and section if requested
        const enrichedList = createdList.map(cls => {
          if (fillWithDefault) {
            if (!cls.students || cls.students.length === 0) {
              const matching = getRegisteredStudentsForSection(cls.gradeYear, cls.sectionLetter);
              if (matching.length > 0) {
                return {
                  ...cls,
                  students: convertRegisteredToClassStudents(matching),
                  isDefault: true,
                };
              }
            }
            return {
              ...cls,
              isDefault: true,
            };
          } else {
            return {
              ...cls,
              students: [],
              isDefault: false,
            };
          }
        });

        setClasses(prev => {
          const next = [...prev, ...enrichedList];
          const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
          localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(next));
          return next;
        });
        setSuccessToast(fillWithDefault ? `¡Sección ${cleanLetter} agregada con alumnos!` : `¡Sección ${cleanLetter} creada vacía!`);
        setTimeout(() => setSuccessToast(""), 3000);
      }
    } else {
      setSuccessToast("Error al agregar sección.");
      setTimeout(() => setSuccessToast(""), 3000);
    }
  };

  // Handle creating a real subject in Supabase & local state assigned to teacher with all sections
  const handleCreateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassSubject.trim() || !teacher) return;
    setIsCreatingClass(true);

    const teacherIdentifier = teacher.id || teacher.email || "";
    const sectionsToSave = selectedSections.length > 0 ? selectedSections : ["A"];

    const result = await createSubjectInSupabase(teacherIdentifier, {
      subjectName: newClassSubject.trim(),
      gradeYear: newClassGrade,
      sectionLetter: sectionsToSave[0],
      sections: sectionsToSave,
      department: teacher.department,
      lapso: activeLapso,
      teacherId: teacher.id,
      teacherName: teacher.name,
    });

    setIsCreatingClass(false);
    const createdList = result.newClasses && result.newClasses.length > 0 
      ? result.newClasses 
      : (result.newClass ? [result.newClass] : []);

    if (result.success && createdList.length > 0) {
      // Auto-fill students registered for this year and section if requested; otherwise leave empty for composite groups
      const enrichedList = createdList.map(cls => {
        if (fillWithDefaultStudents) {
          if (!cls.students || cls.students.length === 0) {
            const matching = getRegisteredStudentsForSection(cls.gradeYear, cls.sectionLetter);
            if (matching.length > 0) {
              return {
                ...cls,
                students: convertRegisteredToClassStudents(matching),
                isDefault: true,
              };
            }
          }
          return {
            ...cls,
            isDefault: true,
          };
        } else {
          // Explicitly empty student list for mixed/composite subjects
          return {
            ...cls,
            students: [],
            isDefault: false,
          };
        }
      });

      setClasses(prev => {
        const next = [...prev];
        enrichedList.forEach(item => {
          const idx = next.findIndex(c => c.id === item.id);
          if (idx >= 0) {
            next[idx] = item;
          } else {
            next.push(item);
          }
        });
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(next));
        return next;
      });

      setSelectedClassId(enrichedList[0].id);
      const groupKey = `${enrichedList[0].subjectName.trim().toLowerCase()}___${enrichedList[0].gradeYear.trim().toLowerCase()}`;
      setSelectedSubjectKey(groupKey);
      setViewMode("section_students");
      setActiveTab("classes");
      setIsAddClassOpen(false);
      setNewClassSubject("");
      setSelectedSections(["A", "B", "C", "D", "E", "F"]);

      // If teacher did not have id stored, update profile with real database profesorId
      if (result.profesorId && !teacher.id) {
        setTeacher(prev => prev ? { ...prev, id: result.profesorId } : null);
      }

      setSuccessToast("¡Materia agregada con nómina de alumnos!");
      setTimeout(() => setSuccessToast(""), 3000);
    } else {
      setSuccessToast("Error al registrar materia.");
      setTimeout(() => setSuccessToast(""), 3000);
    }
  };

  // Global dynamic statistics aggregate for teacher profiles
  const globalAggregates = React.useMemo(() => {
    let totalScoreSum = 0;
    let gradedCount = 0;
    let totalStudentsCount = 0;
    classes.forEach(cls => {
      cls.students?.forEach(std => {
        totalStudentsCount += 1;
        const score = getWeightedFinalScore(std.grades);
        if (score > 0) {
          totalScoreSum += score;
          gradedCount += 1;
        }
      });
    });

    return {
      averageScore: gradedCount > 0 ? Number((totalScoreSum / gradedCount).toFixed(1)) : 0.0,
      totalStudents: totalStudentsCount
    };
  }, [classes]);

  // Finding students with low averages (<10) for real-time alerts drawer
  const alertStudents = React.useMemo(() => {
    const list: Array<{ 
      student: Student; 
      classId: string;
      subjectName: string;
      gradeYear: string;
      sectionLetter: string;
      className: string; 
      score: number;
    }> = [];
    classes.forEach(cls => {
      cls.students?.forEach(std => {
        const avg = getWeightedFinalScore(std.grades);
        if (avg < 10 && avg > 0) {
          list.push({
            student: std,
            classId: cls.id,
            subjectName: cls.subjectName,
            gradeYear: cls.gradeYear,
            sectionLetter: cls.sectionLetter,
            className: `${cls.subjectName} • ${cls.gradeYear} - Sec. ${cls.sectionLetter}`,
            score: avg
          });
        }
      });
    });
    return list;
  }, [classes]);

  // 1. ENTRY SCREEN: If no teacher is logged in, show Register / Login Portal directly!
  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 text-slate-900">
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 15, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs tracking-wider uppercase px-6 py-3 shadow-xl rounded-full flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {successToast}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-4xl mx-auto">
          <TeacherRegisterView
            onRegisterSuccess={(newTeacher, initialClassOrClasses, message) => {
              setTeacher(newTeacher);
              try {
                localStorage.setItem("ilumina_current_teacher", JSON.stringify(newTeacher));
              } catch {}
              const rawClasses: ClassSection[] = Array.isArray(initialClassOrClasses)
                ? initialClassOrClasses
                : initialClassOrClasses ? [initialClassOrClasses] : [];
              const loadedClasses: ClassSection[] = rawClasses.map(cls => {
                if (!cls.students || cls.students.length === 0) {
                  const matching = getRegisteredStudentsForSection(cls.gradeYear, cls.sectionLetter);
                  if (matching.length > 0) {
                    return {
                      ...cls,
                      students: convertRegisteredToClassStudents(matching),
                    };
                  }
                }
                return cls;
              });
              setClasses(loadedClasses);
              const teacherKey = (newTeacher.email || "default").toLowerCase();
              if (loadedClasses.length > 0) {
                setSelectedClassId(loadedClasses[0].id);
                localStorage.setItem(`ilumina_classes_${teacherKey}`, JSON.stringify(loadedClasses));
              } else {
                setSelectedClassId("");
                localStorage.removeItem(`ilumina_classes_${teacherKey}`);
              }
              setActiveTab("home");
              setSelectedStudentId(null);
              setSuccessToast("¡Bienvenido(a)!");
              setTimeout(() => setSuccessToast(""), 3000);
            }}
          />
        </div>
      </div>
    );
  }

  // 2. MAIN TEACHER DASHBOARD: When teacher is logged in
  return (
    <div className="app">
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 15, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#15803D] text-white font-bold text-xs tracking-wider uppercase px-6 py-3 shadow-xl rounded-full flex items-center gap-2 border border-[#86EFAC]"
          >
            <Check className="w-4 h-4" />
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leather Top Bar (Escritorio y Móvil) */}
      <header className={`bar sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "scrolled !h-14 sm:!h-16 py-1" : ""}`}>
        {/* Mobile centered logo */}
        <div
          className="cursor-pointer flex sm:hidden items-center justify-center flex-1 w-full py-0 px-0"
          onClick={() => { setActiveTab("home"); setSelectedStudentId(null); }}
          title="Ilumina - Bitácora del Docente"
        >
          <img
            src="/logoiluminia.webp"
            alt="Ilumina"
            className="object-contain drop-shadow-[0_2px_0_rgba(0,0,0,0.25)] h-9 max-w-[190px]"
          />
        </div>

        {/* Desktop icon logo */}
        <div
          className="cursor-pointer hidden sm:flex items-center shrink-0 mr-4"
          onClick={() => { setActiveTab("home"); setSelectedStudentId(null); }}
          title="Ilumina - Bitácora del Docente"
        >
          <BrujulaLogoAnimated />
        </div>

        {/* Desktop Navigation Tabs */}
        <button
          onClick={() => { setActiveTab("home"); setSelectedStudentId(null); }}
          className={`tab hidden sm:flex ${activeTab === "home" && !selectedStudentId ? "active" : ""}`}
          aria-current={activeTab === "home" && !selectedStudentId ? "page" : undefined}
        >
          <Home className="w-4.5 h-4.5" />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => { setActiveTab("classes"); setViewMode("subjects_list"); setSelectedStudentId(null); }}
          className={`tab hidden sm:flex ${activeTab === "classes" || selectedStudentId ? "active" : ""}`}
          aria-current={activeTab === "classes" || selectedStudentId ? "page" : undefined}
        >
          <School className="w-4.5 h-4.5" />
          <span>Clases</span>
          {classes.length > 0 && <span className="ct">{classes.length}</span>}
        </button>

        <button
          onClick={() => { setActiveTab("profile"); setSelectedStudentId(null); }}
          className={`tab hidden sm:flex ${activeTab === "profile" && !selectedStudentId ? "active" : ""}`}
          aria-current={activeTab === "profile" && !selectedStudentId ? "page" : undefined}
        >
          <User className="w-4.5 h-4.5" />
          <span>Perfil</span>
        </button>

        {isUserAdmin(teacher) && (
          <button
            onClick={() => { setActiveTab("admin"); setSelectedStudentId(null); }}
            className={`tab hidden sm:flex ${activeTab === "admin" && !selectedStudentId ? "active" : ""}`}
            aria-current={activeTab === "admin" && !selectedStudentId ? "page" : undefined}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            <span>Admin</span>
          </button>
        )}

        {/* Right Info Cluster (Desktop only, without profile icon in navbar) */}
        <div className="hidden sm:flex ri ml-auto items-center">
          <span
            className="tx font-bold cursor-pointer hover:underline text-[#F6E7C8]"
            onClick={() => { setActiveTab("profile"); setSelectedStudentId(null); }}
          >
            Prof. {teacher.name}
          </span>
        </div>
      </header>

      {/* Main Parchment Sheet Container */}
      <main ref={mainContentRef} className="wrap">
          {selectedStudentId && currentStudent && currentClass ? (
            <GradingView
              key={`${currentClass.id}-${currentStudent.id}-${activeLapso}`}
              student={currentStudent}
              className={`${currentClass.gradeYear} • ${currentClass.subjectName}`}
              onBack={() => setSelectedStudentId(null)}
              onSave={handleSaveStudentGrades}
              activeLapso={activeLapso}
              calendarCurrentLapso={calendarCurrentLapso}
              onSelectLapso={(lapso) => setActiveLapso(lapso)}
              onSyncCurrentLapso={handleSyncWithCurrentLapso}
              termProgressPercent={termProgressPercent}
              termStartDate={currentLapsoPeriod.start}
              termEndDate={currentLapsoPeriod.end}
              todayDate={todayDate}
            />
          ) : (
            <>
              {activeTab === "home" && (
                <DashboardView
                  teacher={teacher}
                  classes={classes}
                  pendingTasks={pendingTasks}
                  activeLapso={activeLapso}
                  calendarCurrentLapso={calendarCurrentLapso}
                  termStartDate={currentLapsoPeriod.start}
                  termEndDate={currentLapsoPeriod.end}
                  currentDate={todayDate}
                  termProgressPercent={termProgressPercent}
                  onUpdateLapso={(l) => setActiveLapso(l)}
                  onSyncCurrentLapso={handleSyncWithCurrentLapso}
                  onUpdateDates={(newDates) => {
                    setLapsoDates(prev => ({
                      ...prev,
                      [activeLapso]: newDates
                    }));
                  }}
                  onSelectSubject={(groupKey) => {
                    setSelectedSubjectKey(groupKey);
                    const grp = subjectGroups.find(g => g.key === groupKey);
                    if (grp && grp.sections.length > 0) {
                      setSelectedClassId(grp.sections[0].id);
                    }
                    setViewMode("section_students");
                    setActiveTab("classes");
                  }}
                  onSelectClass={(id) => { 
                    setSelectedClassId(id); 
                    const found = classes.find(c => c.id === id);
                    if (found) {
                      const key = `${found.subjectName.trim().toLowerCase()}___${found.gradeYear.trim().toLowerCase()}`;
                      setSelectedSubjectKey(key);
                    }
                    setViewMode("section_students"); 
                    setActiveTab("classes"); 
                  }}
                  onQuickGrade={(stdId, classId) => { setSelectedClassId(classId); setSelectedStudentId(stdId); }}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                  onOpenAlerts={() => setIsAlertsOpen(true)}
                  onOpenAddClass={() => setIsAddClassOpen(true)}
                />
              )}

              {activeTab === "classes" && (
                classes.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <School className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      Sin asignaturas a cargo
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-5">
                      No tienes materias registradas para gestionar nóminas. Agrega tu primera clase para inscribir alumnos y cargar notas.
                    </p>
                    <button
                      onClick={() => setIsAddClassOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase px-5 py-3 rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Registrar Asignatura</span>
                    </button>
                  </div>
                ) : viewMode === "subjects_list" ? (
                  <SubjectsListView
                    subjectGroups={subjectGroups}
                    teacherName={teacher.name}
                    onSelectSubject={(groupKey) => {
                      setSelectedSubjectKey(groupKey);
                      const grp = subjectGroups.find(g => g.key === groupKey);
                      if (grp && grp.sections.length > 0) {
                        setSelectedClassId(grp.sections[0].id);
                      }
                      setViewMode("section_students");
                    }}
                    onSelectSection={(secId, groupKey) => {
                      setSelectedSubjectKey(groupKey);
                      setSelectedClassId(secId);
                      setViewMode("section_students");
                    }}
                    onOpenAddClass={() => setIsAddClassOpen(true)}
                    onDeleteSubjectGroups={handleDeleteSubjectGroups}
                  />
                ) : viewMode === "subject_sections" && currentSubjectGroup ? (
                  <SubjectSectionsView
                    subjectGroup={currentSubjectGroup}
                    allSubjectGroups={subjectGroups}
                    onSelectSubjectGroup={(groupKey) => {
                      setSelectedSubjectKey(groupKey);
                      const grp = subjectGroups.find(g => g.key === groupKey);
                      if (grp && grp.sections.length > 0) {
                        setSelectedClassId(grp.sections[0].id);
                      }
                    }}
                    teacherName={teacher.name}
                    onBack={() => setViewMode("subjects_list")}
                    onSelectSection={(secId) => {
                      setSelectedClassId(secId);
                      setViewMode("section_students");
                    }}
                    onAddNewSection={handleAddNewSectionToSubject}
                    onDeleteSection={handleDeleteSection}
                  />
                ) : currentClass ? (
                  <ClassOverviewView
                    section={currentClass}
                    allSiblingSections={siblingSections}
                    teacherName={teacher.name}
                    onSwitchSection={(secId) => setSelectedClassId(secId)}
                    onBack={() => setViewMode("subjects_list")}
                    onSelectStudent={(stdId) => setSelectedStudentId(stdId)}
                    onAddStudent={() => setIsAddStudentOpen(true)}
                    onDeleteStudent={handleDeleteStudent}
                    onSaveStudentGrades={handleSaveStudentGrades}
                    onPendingChangesChange={(hasChanges, saveFn) => {
                      setHasUnsavedSectionChanges(hasChanges);
                      setSaveSectionChangesFn(() => saveFn);
                    }}
                  />
                ) : (
                  <SubjectsListView
                    subjectGroups={subjectGroups}
                    teacherName={teacher.name}
                    onSelectSubject={(groupKey) => {
                      setSelectedSubjectKey(groupKey);
                      const grp = subjectGroups.find(g => g.key === groupKey);
                      if (grp && grp.sections.length > 0) {
                        setSelectedClassId(grp.sections[0].id);
                      }
                      setViewMode("section_students");
                    }}
                    onSelectSection={(secId, groupKey) => {
                      setSelectedSubjectKey(groupKey);
                      setSelectedClassId(secId);
                      setViewMode("section_students");
                    }}
                    onOpenAddClass={() => setIsAddClassOpen(true)}
                  />
                )
              )}

              {activeTab === "profile" && (
                <ProfileView
                  teacher={teacher}
                  classAveragePerformance={globalAggregates.averageScore}
                  totalStudentsCount={globalAggregates.totalStudents}
                  onNavigateToRegister={() => {
                    setTeacher(null);
                  }}
                  onNavigateToAdmin={() => {
                    setActiveTab("admin");
                    setSelectedStudentId(null);
                  }}
                  onLogout={() => {
                    getSupabaseClient().auth.signOut().catch(() => {});
                    if (teacher?.email) {
                      localStorage.removeItem(`ilumina_classes_${teacher.email.toLowerCase()}`);
                    }
                    localStorage.removeItem("ilumina_classes_state");
                    localStorage.removeItem("ilumina_current_teacher");
                    setClasses([]);
                    setTeacher(null);
                    setSuccessToast("Sesión cerrada.");
                    setTimeout(() => setSuccessToast(""), 3000);
                  }}
                />
              )}

              {activeTab === "admin" && (
                <AdminPanelView
                  currentTeacher={teacher}
                  classes={classes}
                  onBack={() => {
                    setActiveTab("profile");
                    setSelectedStudentId(null);
                  }}
                  onUpdateClasses={(updatedClasses) => {
                    setClasses(updatedClasses);
                    const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
                    localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(updatedClasses));
                  }}
                  onCurrentTeacherUpdated={(updatedTeacher) => {
                    setTeacher(updatedTeacher);
                    localStorage.setItem("ilumina_current_teacher", JSON.stringify(updatedTeacher));
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Sticky Mobile Bottom Navigation */}
        <nav className="bn" aria-label="Navegación principal">
          <button
            onClick={() => { setActiveTab("home"); setSelectedStudentId(null); }}
            className={activeTab === "home" && !selectedStudentId ? "active" : ""}
            aria-current={activeTab === "home" && !selectedStudentId ? "page" : undefined}
          >
            <Home className="w-5 h-5" />
            <span>Inicio</span>
          </button>

          <button
            onClick={() => { setActiveTab("classes"); setViewMode("subjects_list"); setSelectedStudentId(null); }}
            className={activeTab === "classes" || selectedStudentId ? "active" : ""}
            aria-current={activeTab === "classes" || selectedStudentId ? "page" : undefined}
          >
            <School className="w-5 h-5" />
            <span>Clases</span>
          </button>

          <button
            onClick={() => { setActiveTab("profile"); setSelectedStudentId(null); }}
            className={activeTab === "profile" && !selectedStudentId ? "active" : ""}
            aria-current={activeTab === "profile" && !selectedStudentId ? "page" : undefined}
          >
            <User className="w-5 h-5" />
            <span>Perfil</span>
          </button>

          {isUserAdmin(teacher) && (
            <button
              onClick={() => { setActiveTab("admin"); setSelectedStudentId(null); }}
              className={activeTab === "admin" && !selectedStudentId ? "active" : ""}
              aria-current={activeTab === "admin" && !selectedStudentId ? "page" : undefined}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Admin</span>
            </button>
          )}
        </nav>

      {/* Adding Student Modal overlay the Dialog */}
      <AnimatePresence>
        {isAddStudentOpen && currentClass && (
          <AddStudentsModal
            isOpen={isAddStudentOpen}
            onClose={() => setIsAddStudentOpen(false)}
            currentClass={currentClass}
            allClasses={classes}
            onAddExistingStudents={handleAddExistingStudentsToClass}
            onAddNewManualStudent={handleAddNewManualStudent}
          />
        )}

        {/* Adding Class/Subject Modal */}
        {isAddClassOpen && (
          <div className="fixed inset-0 bg-[#2B2623]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card sti co bg-white max-w-md w-full overflow-hidden"
              style={{ padding: 0 }}
            >
              <div className="p-3 sm:p-4 border-b border-[#E5DCD0] flex items-center justify-between bg-[#FFF8E6]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="p-1 bg-[#D97706] text-[#2B2623] rounded-md shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-[#2B2623]" />
                  </div>
                  <h3 className="font-display text-sm sm:text-base text-[#2B2623] truncate">
                    Registrar Asignatura
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddClassOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#FBF6ED] text-[#6E655F] hover:text-[#2B2623] transition cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClassSubmit} className="p-3 sm:p-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-200px)]">
                <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-lg space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Prof:</span>
                    <strong className="text-blue-900 font-bold truncate ml-1">{teacher.name}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Asignatura *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Matemáticas, Física"
                    value={newClassSubject}
                    onChange={(e) => setNewClassSubject(e.target.value)}
                    className="w-full text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Año
                    </label>
                    <select
                      value={newClassGrade}
                      onChange={(e) => setNewClassGrade(e.target.value)}
                      className="w-full text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition cursor-pointer"
                    >
                      <option value="1er Año">1°</option>
                      <option value="2do Año">2°</option>
                      <option value="3er Año">3°</option>
                      <option value="4to Año">4°</option>
                      <option value="5to Año">5°</option>
                      <option value="6to Grado">6°</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Secciones
                    </label>
                    <select
                      value={
                        selectedSections.length === 6 && ["A", "B", "C", "D", "E", "F"].every(s => selectedSections.includes(s))
                          ? "ALL"
                          : selectedSections.length === 4 && ["A", "B", "C", "D"].every(s => selectedSections.includes(s))
                          ? "ABCD"
                          : selectedSections.length === 3 && ["A", "B", "C"].every(s => selectedSections.includes(s))
                          ? "ABC"
                          : selectedSections.length === 1
                          ? selectedSections[0]
                          : "CUSTOM"
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewClassSection(val);
                        if (val === "ALL") {
                          setSelectedSections(["A", "B", "C", "D", "E", "F"]);
                        } else if (val === "ABCD") {
                          setSelectedSections(["A", "B", "C", "D"]);
                        } else if (val === "ABC") {
                          setSelectedSections(["A", "B", "C"]);
                        } else if (val === "CUSTOM") {
                        } else {
                          setSelectedSections([val]);
                        }
                      }}
                      className="w-full text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition cursor-pointer"
                    >
                      <option value="ALL">Todas (A-F)</option>
                      <option value="ABCD">A-D</option>
                      <option value="ABC">A-C</option>
                      <option value="A">Solo A</option>
                      <option value="B">Solo B</option>
                      <option value="C">Solo C</option>
                      <option value="D">Solo D</option>
                      <option value="U">Única (U)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-1">
                  {["A", "B", "C", "D", "E", "F"].map((sec) => {
                    const isChecked = selectedSections.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          setSelectedSections(prev =>
                            prev.includes(sec)
                              ? (prev.length > 1 ? prev.filter(s => s !== sec) : prev)
                              : [...prev, sec].sort()
                          );
                        }}
                        className={`px-1.5 py-1 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isChecked ? "✓" : ""}{sec}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-600 bg-slate-50 rounded-lg px-2 py-1.5">
                  <span>
                    <strong>{selectedSections.length}</strong> sec. en <strong>{newClassGrade}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSections(selectedSections.length >= 6 ? ["A"] : ["A", "B", "C", "D", "E", "F"]);
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    {selectedSections.length >= 6 ? "Ninguna" : "Todas"}
                  </button>
                </div>

                <label className="flex items-start gap-2 cursor-pointer select-none p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={fillWithDefaultStudents}
                    onChange={(e) => setFillWithDefaultStudents(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">
                      {fillWithDefaultStudents ? "Con nómina" : "Sin nómina"}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      {fillWithDefaultStudents
                        ? "Alumnos de año y secciones"
                        : "Lista vacía (electiva)"}
                    </p>
                  </div>
                </label>

                <div className="pt-1.5 flex justify-end gap-1.5 border-t border-[#E5DCD0]">
                  <button
                    type="button"
                    onClick={() => setIsAddClassOpen(false)}
                    className="chip text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingClass}
                    className="btn s text-xs disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#2B2623]" />
                    <span>{isCreatingClass ? "..." : "Registrar"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Academic Alerts Drawer */}
      <AnimatePresence>
        {isAlertsOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="font-extrabold text-sm uppercase tracking-tight">
                    Alertas
                  </h3>
                </div>
                <button
                  onClick={() => setIsAlertsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {alertStudents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    Sin alertas activas.
                  </div>
                ) : (
                  alertStudents.map((item, idx) => (
                    <div 
                      key={`${item.classId}-${item.student.id}-${idx}`}
                      onClick={() => {
                        setSelectedClassId(item.classId);
                        const key = `${item.subjectName.trim().toLowerCase()}___${item.gradeYear.trim().toLowerCase()}`;
                        setSelectedSubjectKey(key);
                        setViewMode("section_students");
                        setActiveTab("classes");
                        setSelectedStudentId(item.student.id);
                        setIsAlertsOpen(false);
                      }}
                      className="p-3.5 bg-rose-50/60 hover:bg-rose-100/70 rounded-xl border border-rose-100 flex items-center justify-between cursor-pointer transition group"
                      title={`Ir a calificar a ${item.student.firstName} en ${item.subjectName}`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {item.student.lastName}, {item.student.firstName}
                        </p>
                        <p className="text-[11px] font-semibold text-rose-800 truncate mt-0.5">
                          {item.subjectName}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {item.gradeYear} • Sección {item.sectionLetter}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md font-mono">
                          {item.score} / 20
                        </span>
                        <p className="text-[9px] text-rose-500 font-semibold mt-0.5">Bajo promedio</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications Drawer */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 text-slate-800">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-sm uppercase tracking-tight">
                    Notificaciones
                  </h3>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-slate-900">Lapso {activeLapso} Activo</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Calificaciones al día.
                  </p>
                  <span className="text-[9px] text-blue-600 font-mono mt-1 block">Sincronizado</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Save Button when there are unsaved section changes */}
      {hasUnsavedSectionChanges && saveSectionChangesFn && (
        <div className="fixed bottom-40 sm:bottom-24 right-6 z-55">
          <button
            onClick={() => saveSectionChangesFn()}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F4DFA6] to-[#E3B866] border-2 border-[#7A4B2A] shadow-[0_4px_0_#7A4B2A] flex items-center justify-center text-[#3E2514] hover:translate-y-[-2px] hover:shadow-[0_6px_0_#7A4B2A] active:translate-y-[2px] active:shadow-[0_2px_0_#7A4B2A] transition-all cursor-pointer animate-bounce"
            title="Guardar notas modificadas"
            aria-label="Guardar notas modificadas"
          >
            <SpriteObject name="libroabierto" size={32} />
          </button>
        </div>
      )}

      {/* Floating Golden Magnifying Glass Button for Student Quick Grid */}
      {currentClass && currentClass.students && currentClass.students.length > 0 && !isStudentGridOpen && (
        <div className="fixed bottom-24 sm:bottom-8 right-6 z-55">
          <button
            onClick={() => setIsStudentGridOpen(prev => !prev)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F4DFA6] to-[#E3B866] border-2 border-[#7A4B2A] shadow-[0_4px_0_#7A4B2A] flex items-center justify-center text-[#3E2514] hover:translate-y-[-2px] hover:shadow-[0_6px_0_#7A4B2A] active:translate-y-[2px] active:shadow-[0_2px_0_#7A4B2A] transition-all cursor-pointer"
            title="Buscador rápido de alumnos (N.° de lista)"
            aria-label="Buscador rápido de alumnos"
          >
            <Search className="w-6 h-6 text-[#3E2514]" />
          </button>
        </div>
      )}

      {/* Student Number Grid Bottom Sheet Dialog */}
      <AnimatePresence>
        {isStudentGridOpen && currentClass && currentClass.students && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-[#2B2623]/30 backdrop-blur-xs z-50 flex items-end justify-center"
            onClick={() => setIsStudentGridOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FBF6ED] border-t-4 border-[#7A4B2A] rounded-t-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#E5DCD0] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E3B866] flex items-center justify-center border border-[#7A4B2A] text-[#3E2514]">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base text-[#2B2623]">
                      Nómina rápida · {currentClass.subjectName} ({currentClass.gradeYear} Sec. {currentClass.sectionLetter})
                    </h3>
                    <p className="text-xs text-[#6E655F]">Selecciona un número de lista para ver y calificar al alumno</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsStudentGridOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[#E5DCD0]/50 hover:bg-[#E5DCD0] flex items-center justify-center text-[#2B2623] cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of gray engraved stone buttons without names and with smooth non-spring stagger entrance animation */}
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5 py-2">
                {currentClass.students.map((std, idx) => {
                  const listNum = idx + 1;
                  return (
                    <motion.button
                      key={std.id}
                      initial={{ opacity: 0, scale: 0.9, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        delay: idx * 0.005,
                        duration: 0.15,
                        ease: "easeOut"
                      }}
                      onClick={() => {
                        setSelectedStudentId(std.id);
                        setIsStudentGridOpen(false);
                      }}
                      className="group relative flex items-center justify-center aspect-square rounded-xl bg-gradient-to-b from-[#E5E7EB] to-[#D1D5DB] border-2 border-[#9CA3AF] shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_2px_0_#9CA3AF] hover:from-[#D1D5DB] hover:to-[#9CA3AF] hover:border-[#6B7280] active:translate-y-1 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all cursor-pointer p-1"
                      title={`${listNum}. ${std.firstName} ${std.lastName}`}
                    >
                      <span className="font-display text-xl font-bold text-[#1F2937] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                        {listNum}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
