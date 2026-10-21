import React, { useState, useEffect, useMemo } from "react";
import { 
  TeacherProfile, 
  RegisteredStudent, 
  ClassSection 
} from "../types";
import { 
  getAllTeachers, 
  createTeacherByAdmin, 
  updateTeacherByAdmin, 
  deleteTeacherByAdmin,
  getRegisteredStudents,
  fetchRegisteredStudentsFromDatabase,
  saveRegisteredStudent,
  deleteRegisteredStudent,
  syncRegisteredStudentsWithClasses,
  formatGradeYear,
  fetchStudentCountsByYear,
  normalizeYear,
  getCurrentSchoolYear
} from "../lib/adminService";
import { 
  IluminaOwl, 
  MedalCounter, 
  PolaroidAvatar 
} from "./BitacoraBrand";
import {
  ShieldCheck,
  ArrowLeft,
  Users,
  GraduationCap,
  Search,
  Plus,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  Sparkles,
  BookOpen,
  Mail,
  IdCard,
  Key,
  RefreshCw,
  School,
  X,
  Filter,
  Calendar,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelViewProps {
  currentTeacher: TeacherProfile;
  classes: ClassSection[];
  onBack: () => void;
  onUpdateClasses?: (updatedClasses: ClassSection[]) => void;
  onCurrentTeacherUpdated?: (updatedTeacher: TeacherProfile) => void;
}

const GRADE_YEAR_OPTIONS = [
  "1er Año",
  "2do Año",
  "3er Año",
  "4to Año",
  "5to Año"
];

const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F"];

const DEPARTMENT_OPTIONS = [
  "Ciencias Exactas",
  "Ciencias Naturales",
  "Humanidades y Arte",
  "Idiomas Modernos",
  "Educación Física y Deportes",
  "Tecnología e Informática"
];

const RANK_OPTIONS = [
  "DOCENTE TITULAR",
  "DOCENTE ASOCIADO",
  "DOCENTE ADJUNTO",
  "COORDINADOR DE ÁREA",
  "DIRECTOR ACADÉMICO"
];

export default function AdminPanelView({
  currentTeacher,
  classes,
  onBack,
  onUpdateClasses,
  onCurrentTeacherUpdated
}: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState<"teachers" | "students" | "calendar">("teachers");

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // ==================== TEACHERS STATE ====================
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState("");

  // Modals for Teachers
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherProfile | null>(null);

  // New Teacher Form
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [newTeacherDept, setNewTeacherDept] = useState("Ciencias Exactas");
  const [newTeacherRank, setNewTeacherRank] = useState("DOCENTE TITULAR");
  const [newTeacherYear, setNewTeacherYear] = useState(getCurrentSchoolYear());
  const [newTeacherIsAdmin, setNewTeacherIsAdmin] = useState(false);
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);

  // Edit Teacher Form
  const [editTeacherName, setEditTeacherName] = useState("");
  const [editTeacherEmail, setEditTeacherEmail] = useState("");
  const [editTeacherDept, setEditTeacherDept] = useState("");
  const [editTeacherRank, setEditTeacherRank] = useState("");
  const [editTeacherYear, setEditTeacherYear] = useState("");
  const [editTeacherIsAdmin, setEditTeacherIsAdmin] = useState(false);
  const [editTeacherNewPassword, setEditTeacherNewPassword] = useState("");

  // ==================== STUDENTS STATE ====================
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentYearFilter, setStudentYearFilter] = useState("1er Año");
  const [studentSectionFilter, setStudentSectionFilter] = useState("ALL");
  const [studentsByYear, setStudentsByYear] = useState<Record<string, number>>({
    "1er Año": 0,
    "2do Año": 0,
    "3er Año": 0,
    "4to Año": 0,
    "5to Año": 0,
  });

  // Modals for Students
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<RegisteredStudent | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<RegisteredStudent | null>(null);

  // New Student Form
  const [newStudentFirst, setNewStudentFirst] = useState("");
  const [newStudentLast, setNewStudentLast] = useState("");
  const [newStudentCedula, setNewStudentCedula] = useState("");
  const [newStudentYear, setNewStudentYear] = useState("1er Año");
  const [newStudentSection, setNewStudentSection] = useState("A");

  // Edit Student Form
  const [editStudentFirst, setEditStudentFirst] = useState("");
  const [editStudentLast, setEditStudentLast] = useState("");
  const [editStudentCedula, setEditStudentCedula] = useState("");
  const [editStudentYear, setEditStudentYear] = useState("1er Año");
  const [editStudentSection, setEditStudentSection] = useState("A");

  // ==================== LAPSO DATES STATE ====================
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
  const [isSavingLapsos, setIsSavingLapsos] = useState(false);

  const handleSaveLapsoDates = () => {
    setIsSavingLapsos(true);
    localStorage.setItem("ilumina_lapso_dates", JSON.stringify(lapsoDates));
    setTimeout(() => {
      setIsSavingLapsos(false);
      showToast("Fechas de lapsos actualizadas correctamente");
    }, 800);
  };

  // Helper functions
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} días`;
  };

  const isLapsoActive = (lapso: 1 | 2 | 3) => {
    const today = new Date().toISOString().split("T")[0];
    const dates = lapsoDates[lapso];
    return today >= dates.start && today <= dates.end;
  };

  const isLapsoPassed = (lapso: 1 | 2 | 3) => {
    const today = new Date().toISOString().split("T")[0];
    const dates = lapsoDates[lapso];
    return today > dates.end;
  };

  const updateLapsoDate = (lapso: 1 | 2 | 3, type: "start" | "end", value: string) => {
    setLapsoDates(prev => ({
      ...prev,
      [lapso]: { ...prev[lapso], [type]: value }
    }));
  };

  // Load Initial Data
  useEffect(() => {
    loadTeachers();
    initializeStudents();
  }, []);

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const list = await getAllTeachers();
      setTeachers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const [loadingStudents, setLoadingStudents] = useState(false);

  const initializeStudents = async () => {
    setLoadingStudents(true);
    try {
      const counts = await fetchStudentCountsByYear();
      setStudentsByYear(counts);

      let initialYear = "1er Año";
      // If 1er Año has 0 students in DB, auto-select the first year that has registered students
      if ((counts["1er Año"] || 0) === 0) {
        const yearWithStudents = GRADE_YEAR_OPTIONS.find(y => (counts[y] || 0) > 0);
        if (yearWithStudents) {
          initialYear = yearWithStudents;
          setStudentYearFilter(yearWithStudents);
        }
      }

      const list = await fetchRegisteredStudentsFromDatabase(initialYear);
      setRegisteredStudents(list);
    } catch (e) {
      console.error(e);
      setRegisteredStudents(getRegisteredStudents());
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadStudents = async (targetYear?: string) => {
    const yearToFetch = (typeof targetYear === "string" && targetYear.trim()) ? targetYear.trim() : studentYearFilter;
    setLoadingStudents(true);
    try {
      const [list, counts] = await Promise.all([
        fetchRegisteredStudentsFromDatabase(yearToFetch),
        fetchStudentCountsByYear()
      ]);
      setRegisteredStudents(list);
      setStudentsByYear(counts);
    } catch (e) {
      console.error(e);
      setRegisteredStudents(getRegisteredStudents());
    } finally {
      setLoadingStudents(false);
    }
  };

  // ==================== TEACHER HANDLERS ====================
  const handleOpenAddTeacher = () => {
    setNewTeacherName("");
    setNewTeacherEmail("");
    setNewTeacherPassword("");
    setNewTeacherDept("Ciencias Exactas");
    setNewTeacherRank("DOCENTE TITULAR");
    setNewTeacherYear(getCurrentSchoolYear());
    setNewTeacherIsAdmin(false);
    setIsAddTeacherOpen(true);
  };

  const handleCreateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherEmail.trim()) {
      showToast("Por favor ingresa nombre y correo.");
      return;
    }

    setIsSavingTeacher(true);
    const res = await createTeacherByAdmin({
      name: newTeacherName.trim(),
      email: newTeacherEmail.trim(),
      password: newTeacherPassword.trim(),
      department: newTeacherDept,
      rank: newTeacherRank,
      schoolYear: newTeacherYear,
      isAdmin: newTeacherIsAdmin,
    });
    setIsSavingTeacher(false);

    if (res.success) {
      showToast(res.message);
      setIsAddTeacherOpen(false);
      loadTeachers();
    } else {
      showToast("Error al crear docente.");
    }
  };

  const handleOpenEditTeacher = (t: TeacherProfile) => {
    setEditingTeacher(t);
    setEditTeacherName(t.name);
    setEditTeacherEmail(t.email);
    setEditTeacherDept(t.department);
    setEditTeacherRank(t.rank);
    setEditTeacherYear(t.schoolYear || getCurrentSchoolYear());
    setEditTeacherIsAdmin(Boolean(t.isAdmin));
    setEditTeacherNewPassword("");
  };

  const handleUpdateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    const updated: TeacherProfile = {
      ...editingTeacher,
      name: editTeacherName.trim(),
      email: editTeacherEmail.trim(),
      department: editTeacherDept,
      rank: editTeacherRank,
      schoolYear: editTeacherYear,
      isAdmin: editTeacherIsAdmin,
      status: editTeacherIsAdmin ? "ADMIN" : "ACTIVO",
    };

    setIsSavingTeacher(true);
    const res = await updateTeacherByAdmin(updated, editTeacherNewPassword);
    setIsSavingTeacher(false);

    if (res.success) {
      showToast(res.message);
      setEditingTeacher(null);
      loadTeachers();
      if (currentTeacher.email?.toLowerCase() === updated.email.toLowerCase()) {
        onCurrentTeacherUpdated?.(updated);
      }
    } else {
      showToast("Error al actualizar docente.");
    }
  };

  const handleDeleteTeacherConfirm = async () => {
    if (!teacherToDelete) return;
    const res = await deleteTeacherByAdmin(teacherToDelete.id || teacherToDelete.email);
    setTeacherToDelete(null);
    showToast(res.message);
    loadTeachers();
  };

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter(t => 
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q) ||
      t.rank.toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  // ==================== STUDENT HANDLERS ====================
  const handleOpenAddStudent = () => {
    setNewStudentFirst("");
    setNewStudentLast("");
    setNewStudentCedula(`V-${31000000 + Math.floor(Math.random() * 8999999)}`);
    setNewStudentYear("1er Año");
    setNewStudentSection("A");
    setIsAddStudentOpen(true);
  };

  const handleCreateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentFirst.trim() || !newStudentLast.trim()) {
      showToast("Ingresa nombre y apellido del estudiante.");
      return;
    }

    const created = await saveRegisteredStudent({
      firstName: newStudentFirst.trim(),
      lastName: newStudentLast.trim(),
      cedula: newStudentCedula.trim() || `V-${Date.now().toString().slice(-8)}`,
      gradeYear: newStudentYear,
      sectionLetter: newStudentSection,
    });

    setIsAddStudentOpen(false);
    setStudentYearFilter(created.gradeYear);
    await loadStudents(created.gradeYear);
    showToast(`¡Alumno ${created.firstName} ${created.lastName} registrado en ${created.gradeYear} (${created.sectionLetter})!`);

    // Retroactively update matching classes loaded in app if any
    if (onUpdateClasses && classes.length > 0) {
      const { updatedClasses, addedCount } = syncRegisteredStudentsWithClasses(classes);
      if (addedCount > 0) {
        onUpdateClasses(updatedClasses);
      }
    }
  };

  const handleOpenEditStudent = (s: RegisteredStudent) => {
    setEditingStudent(s);
    setEditStudentFirst(s.firstName);
    setEditStudentLast(s.lastName);
    setEditStudentCedula(s.cedula);
    setEditStudentYear(s.gradeYear);
    setEditStudentSection(s.sectionLetter);
  };

  const handleUpdateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    await saveRegisteredStudent({
      id: editingStudent.id,
      firstName: editStudentFirst.trim(),
      lastName: editStudentLast.trim(),
      cedula: editStudentCedula.trim(),
      gradeYear: editStudentYear,
      sectionLetter: editStudentSection,
      avatarUrl: editingStudent.avatarUrl,
      createdAt: editingStudent.createdAt,
    });

    setEditingStudent(null);
    setStudentYearFilter(editStudentYear);
    await loadStudents(editStudentYear);
    showToast("¡Datos del alumno actualizados!");
  };

  const handleDeleteStudentConfirm = async () => {
    if (!studentToDelete) return;
    await deleteRegisteredStudent(studentToDelete.id);
    setStudentToDelete(null);
    await loadStudents(studentYearFilter);
    showToast("Alumno eliminado del padrón escolar.");
  };

  const handleSyncClassesWithStudents = () => {
    if (!onUpdateClasses) return;
    const { updatedClasses, addedCount } = syncRegisteredStudentsWithClasses(classes);
    onUpdateClasses(updatedClasses);
    if (addedCount > 0) {
      showToast(`¡Sincronización completa! Se incorporaron ${addedCount} alumnos a las asignaturas.`);
    } else {
      showToast("Todas las materias ya cuentan con los alumnos registrados.");
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return registeredStudents.filter(s => {
      const q = studentSearch.toLowerCase().trim();
      const matchSearch = !q || 
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.cedula.toLowerCase().includes(q);

      const matchYear = formatGradeYear(s.gradeYear) === formatGradeYear(studentYearFilter);
      const matchSec = studentSectionFilter === "ALL" || 
        s.sectionLetter.trim().toUpperCase() === studentSectionFilter.trim().toUpperCase();

      return matchSearch && matchYear && matchSec;
    });
  }, [registeredStudents, studentSearch, studentYearFilter, studentSectionFilter]);

  // Aggregate stats: total student count across all years
  const totalStudentsCount = useMemo(() => {
    return (Object.values(studentsByYear) as number[]).reduce((acc: number, count: number) => acc + (count || 0), 0);
  }, [studentsByYear]);

  return (
    <div className="space-y-6 pb-28 text-slate-900 animate-fade-in">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 15, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-bold text-xs tracking-wider uppercase px-6 py-3 shadow-2xl rounded-full flex items-center gap-2 border border-slate-700"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button Chip */}
      <button
        onClick={onBack}
        className="chip group mb-2"
        title="Volver a Mi Perfil"
      >
        <ArrowLeft className="w-4 h-4 text-[#D97706] group-hover:-translate-x-1 transition-transform" />
        <span>Volver a Mi Perfil</span>
      </button>

      {/* Header Row */}
      <div className="row gap-4 items-start justify-between mb-2">
        <div className="row gap-4 items-center flex-1 min-w-[240px]">
          <span 
            className="ib" 
            style={{ 
              display: "grid", 
              placeContent: "center", 
              width: "64px", 
              height: "64px", 
              borderRadius: "16px", 
              background: "#2B2623", 
              color: "#F4DFA6", 
              flex: "none" 
            }}
          >
            <ShieldCheck className="w-8 h-8" />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl text-[#2B2623]">
              Panel de Administrador
            </h1>
            <p className="sub">
              Gestión de nómina de docentes y padrón institucional de alumnos
            </p>
          </div>
        </div>

        <button 
          onClick={activeTab === "teachers" ? handleOpenAddTeacher : handleOpenAddStudent}
          className="btn full-m"
        >
          <Plus className="w-5 h-5 text-[#2B2623]" />
          <span>{activeTab === "teachers" ? "Registrar docente" : "Registrar alumno"}</span>
        </button>
      </div>

      {/* Stats Row with Medals & Owl Advice */}
      <div className="row gap-4 my-6 items-center justify-start">
        <MedalCounter value={teachers.length} label="Docentes" />
        <MedalCounter value={teachers.filter(t => t.isAdmin).length} label="Admins" valueColor="#D97706" />
        <MedalCounter value={totalStudentsCount} label="Alumnos" />
        <div className="row hide-m flex-1 ml-3 items-center gap-3">
          <IluminaOwl width={54} height={60} />
          <p className="sub text-xs max-w-sm">
            Revisa los permisos con cuidado: los administradores gestionan toda la institución.
          </p>
        </div>
      </div>

      {/* Folder Tabs */}
      <div className="lt flex-wrap gap-y-2" role="tablist">
        <button
          onClick={() => setActiveTab("teachers")}
          className="tab"
          aria-current={activeTab === "teachers" ? "page" : undefined}
        >
          <Users className="w-4 h-4" />
          Docentes <span className="ct">{teachers.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className="tab"
          aria-current={activeTab === "students" ? "page" : undefined}
        >
          <GraduationCap className="w-4 h-4" />
          Alumnos <span className="ct">{totalStudentsCount}</span>
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className="tab"
          aria-current={activeTab === "calendar" ? "page" : undefined}
        >
          <Calendar className="w-4 h-4" />
          Calendario
        </button>
      </div>

      {activeTab === "teachers" && (
        <div className="space-y-6">
          {/* Search Bar & Actions */}
          <div className="card sti p-4 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#6E655F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar docente por nombre, email o área..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FBF6ED] border border-[#E5DCD0] text-xs font-semibold text-[#2B2623] placeholder-[#6E655F] focus:outline-hidden focus:border-[#7A4B2A] transition"
              />
              {teacherSearch && (
                <button
                  onClick={() => setTeacherSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E655F] hover:text-[#2B2623]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadTeachers}
                title="Refrescar lista"
                className="p-2.5 rounded-xl border border-[#E5DCD0] text-[#6E655F] hover:bg-[#FBF6ED] hover:text-[#2B2623] transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingTeachers ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleOpenAddTeacher}
                className="btn text-xs py-2.5 px-4"
              >
                <Plus className="w-4 h-4 text-[#D97706]" />
                <span>Crear Docente</span>
              </button>
            </div>
          </div>

          {/* Teachers Grid/List */}
          <div className="card sti bg-white overflow-hidden">
            <div className="p-4 bg-[#FBF6ED] border-b border-[#E5DCD0] flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-widest text-[#6E655F] uppercase">
                Plantilla de Docentes ({filteredTeachers.length})
              </span>
            </div>

            {filteredTeachers.length === 0 ? (
              <div className="p-12 text-center text-[#6E655F]">
                <Users className="w-10 h-10 mx-auto mb-2 text-[#CDB993]" />
                <p className="text-sm font-bold text-[#2B2623]">No se encontraron docentes</p>
                <p className="text-xs text-[#6E655F] mt-1">Prueba con otro término de búsqueda o crea un nuevo docente.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5DCD0]/60">
                {filteredTeachers.map((t) => (
                  <div
                    key={t.id || t.email}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#FBF6ED]/60 transition group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={t.avatarUrl}
                          alt={t.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#7A4B2A]"
                          referrerPolicy="no-referrer"
                        />
                        {t.isAdmin && (
                          <div
                            className="absolute -top-1 -right-1 bg-[#D97706] text-white rounded-full p-0.5 shadow-sm"
                            title="Administrador"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#2B2623] group-hover:text-[#D97706] transition">
                            {t.name}
                          </h4>
                          {t.isAdmin && (
                            <span className="bg adm text-[9px] px-2 py-0.5 uppercase">
                              Admin
                            </span>
                          )}
                          <span className="bg ok text-[9px] px-2 py-0.5 uppercase">
                            {t.rank}
                          </span>
                        </div>
                        <p className="text-xs text-[#6E655F] mt-0.5 flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-[#6E655F] shrink-0" />
                          {t.email}
                        </p>
                        <p className="text-[11px] font-semibold text-[#6E655F] mt-1">
                          Área: <span className="text-[#2B2623] font-bold">{t.department}</span> • Año Escolar: <span className="text-[#2B2623]">{t.schoolYear}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleOpenEditTeacher(t)}
                        className="btn s text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#D97706]" />
                        Editar
                      </button>

                      <button
                        onClick={() => setTeacherToDelete(t)}
                        className="btn s text-xs py-1.5 px-3 text-[#B91C1C] hover:bg-red-50"
                        title="Eliminar docente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GESTIÓN DE ALUMNOS (PADRÓN ESCOLAR)                                */}
      {/* ========================================================================= */}
      {activeTab === "students" && (
        <div className="space-y-6">
          {/* Informative Banner */}
          <div className="card p-5 bg-[#F4EFE6] border border-[#E5DCD0] flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#7A4B2A] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black text-[#2B2623] uppercase tracking-wider">
                Relleno e Inscripción Automática en Cátedras
              </h4>
              <p className="text-xs text-[#6E655F] mt-1 leading-relaxed">
                Cada estudiante registrado con su <strong>Año</strong> y <strong>Sección</strong> se incorporará automáticamente a la lista de alumnos cuando cualquier docente cree su materia para ese año. No tendrás que inscribirlos manualmente uno a uno en cada clase.
              </p>
            </div>
          </div>

          {/* Quick Metrics by Year */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {GRADE_YEAR_OPTIONS.map((yr) => (
              <button
                key={yr}
                onClick={() => {
                  setStudentYearFilter(yr);
                  loadStudents(yr);
                }}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  studentYearFilter === yr
                    ? "bg-[#7A4B2A] text-white border-[#3E2514] shadow-sm"
                    : "card sti bg-white text-[#2B2623] border-[#E5DCD0] hover:border-[#7A4B2A]"
                }`}
              >
                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${studentYearFilter === yr ? "text-[#F4DFA6]" : "text-[#6E655F]"}`}>
                  {yr}
                </span>
                <p className="font-display text-xl font-black mt-1">
                  {studentsByYear[yr] || 0}
                </p>
                <span className={`text-[10px] font-semibold ${studentYearFilter === yr ? "text-[#F4DFA6]/80" : "text-[#6E655F]"}`}>
                  alumnos
                </span>
              </button>
            ))}
          </div>

          {/* Search, Filter & Action Bar */}
          <div className="card sti p-4 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#6E655F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o cédula..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FBF6ED] border border-[#E5DCD0] text-xs font-semibold text-[#2B2623] placeholder-[#6E655F] focus:outline-hidden focus:border-[#7A4B2A] transition"
                />
                {studentSearch && (
                  <button
                    onClick={() => setStudentSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E655F] hover:text-[#2B2623]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Year filter select */}
              <select
                value={studentYearFilter}
                onChange={(e) => {
                  const yr = e.target.value;
                  setStudentYearFilter(yr);
                  loadStudents(yr);
                }}
                className="px-3 py-2.5 bg-[#FBF6ED] border border-[#E5DCD0] rounded-xl text-xs font-bold text-[#2B2623] focus:outline-hidden cursor-pointer"
              >
                {GRADE_YEAR_OPTIONS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              {/* Section filter select */}
              <select
                value={studentSectionFilter}
                onChange={(e) => setStudentSectionFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#FBF6ED] border border-[#E5DCD0] rounded-xl text-xs font-bold text-[#2B2623] focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Todas las Secciones</option>
                {SECTION_OPTIONS.map(s => (
                  <option key={s} value={s}>Sección {s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadStudents(studentYearFilter)}
                title="Refrescar lista desde la base de datos"
                className="p-2.5 rounded-xl border border-[#E5DCD0] text-[#6E655F] hover:bg-[#FBF6ED] hover:text-[#2B2623] transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStudents ? "animate-spin" : ""}`} />
              </button>

              {classes.length > 0 && onUpdateClasses && (
                <button
                  onClick={handleSyncClassesWithStudents}
                  title="Sincronizar alumnos registrados con las clases existentes"
                  className="px-3 py-2.5 rounded-xl border border-[#E5DCD0] hover:bg-[#FBF6ED] text-[#2B2623] font-extrabold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#D97706]" />
                  <span className="hidden sm:inline">Sincronizar Materias</span>
                </button>
              )}

              <button
                onClick={() => {
                  setNewStudentYear(studentYearFilter);
                  handleOpenAddStudent();
                }}
                className="btn text-xs py-2.5 px-4"
              >
                <Plus className="w-4 h-4 text-[#D97706]" />
                <span>Registrar Alumno</span>
              </button>
            </div>
          </div>

          {/* Students Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase">
                Padrón Estudiantil • {studentYearFilter} ({filteredStudents.length} {filteredStudents.length === 1 ? "alumno" : "alumnos"})
              </span>
              {loadingStudents && (
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                  Consultando base de datos...
                </span>
              )}
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                {totalStudentsCount === 0 ? (
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="text-sm font-bold text-slate-700">Sin alumnos en la base de datos</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      El padrón escolar no tiene alumnos registrados en la base de datos de Supabase. Los alumnos de ejemplo han sido removidos.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setNewStudentYear(studentYearFilter);
                          handleOpenAddStudent();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Registrar Primer Alumno</span>
                      </button>
                    </div>
                  </div>
                ) : registeredStudents.length === 0 ? (
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="text-sm font-bold text-slate-700">No hay alumnos registrados en {studentYearFilter}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Actualmente no hay estudiantes registrados en la base de datos para {studentYearFilter}.
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setNewStudentYear(studentYearFilter);
                          handleOpenAddStudent();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase px-4 py-2 rounded-xl transition shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Inscribir en {studentYearFilter}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-700">No se encontraron alumnos coincidentes</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando el término de búsqueda o el filtro de sección.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5DCD0] text-[10px] font-extrabold text-[#6E655F] uppercase tracking-wider bg-[#FBF6ED]/50">
                      <th className="p-4">Estudiante</th>
                      <th className="p-4">Cédula</th>
                      <th className="p-4">Año Escolar</th>
                      <th className="p-4">Sección</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DCD0]/60 text-xs">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-[#FBF6ED]/60 transition">
                        <td className="p-4 font-bold text-[#2B2623]">
                          <div className="flex items-center gap-3">
                            <img
                              src={s.avatarUrl}
                              alt={s.firstName}
                              className="w-8 h-8 rounded-full object-cover border border-[#7A4B2A]"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-bold text-[#2B2623]">{s.firstName} {s.lastName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-semibold text-[#6E655F]">
                          <span className="bg-[#FBF6ED] border border-[#E5DCD0] px-2 py-0.5 rounded-md text-[11px]">
                            {s.cedula}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[#2B2623]">
                          <span className="bg adm text-[10px] uppercase font-extrabold">
                            {s.gradeYear}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-[#2B2623]">
                          <span className="bg ok text-xs">
                            Sección {s.sectionLetter}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditStudent(s)}
                              className="btn s text-xs p-1.5"
                              title="Editar alumno"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#D97706]" />
                            </button>
                            <button
                              onClick={() => setStudentToDelete(s)}
                              className="btn s text-xs p-1.5 text-[#B91C1C] hover:bg-red-50"
                              title="Eliminar alumno"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CALENDARIO ACADÉMICO - GESTIÓN DE LAPSOS                            */}
      {/* ========================================================================= */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">
                Calendario Académico
              </h4>
              <p className="text-xs text-blue-800/85 mt-1 leading-relaxed">
                Define las fechas de inicio y cierre de cada Lapso. Estas fechas determinan qué Lapso está activo automáticamente según la fecha actual del sistema.
              </p>
            </div>
          </div>

          {/* Lapsos Configuration Cards */}
          <div className="grid gap-4">
            {[1, 2, 3].map((lapso) => {
              const dates = lapsoDates[lapso] || { start: "", end: "" };
              const today = new Date().toISOString().split("T")[0];
              const isActive = dates.start && dates.end && today >= dates.start && today <= dates.end;
              const isPassed = dates.end && today > dates.end;

              return (
                <div
                  key={lapso}
                  className="card sti p-5 bg-white"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-lg ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                          : "bg-slate-100 text-slate-600 border-2 border-slate-200"
                      }`}>
                        {lapso}
                      </div>
                      <div>
                        <h3 className="font-display text-lg text-[#2B2623]">
                          Lapso {lapso}
                        </h3>
                        <p className="sub text-xs">
                          {dates.start && dates.end
                            ? `${formatDate(dates.start)} - ${formatDate(dates.end)}`
                            : "Sin definir"
                          }
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isActive ? (
                      <span className="bg ok text-xs">
                        <Check className="w-3 h-3" />
                        Activo
                      </span>
                    ) : isPassed ? (
                      <span className="bg pl text-xs">Concluido</span>
                    ) : (
                      <span className="bg mid text-xs">Próximo</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Fecha de Inicio
                      </label>
                      <input
                        type="date"
                        value={dates.start}
                        onChange={(e) => setLapsoDates(prev => ({
                          ...prev,
                          [lapso]: { ...prev[lapso as 1|2|3], start: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Fecha de Cierre
                      </label>
                      <input
                        type="date"
                        value={dates.end}
                        onChange={(e) => setLapsoDates(prev => ({
                          ...prev,
                          [lapso]: { ...prev[lapso as 1|2|3], end: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  {/* Duration indicator */}
                  {dates.start && dates.end && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        Duración: {calculateDuration(dates.start, dates.end)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : isPassed
                            ? "bg-slate-100 text-slate-500"
                            : "bg-blue-100 text-blue-700"
                      }`}>
                        {isActive ? "En curso" : isPassed ? "Finalizado" : "Próximo"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveLapsoDates}
              disabled={isSavingLapsos}
              className="btn"
            >
              <Check className="w-4 h-4 text-[#D97706]" />
              <span>{isSavingLapsos ? "Guardando..." : "Guardar Fechas"}</span>
            </button>
          </div>

          {/* Current Date Info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase mb-2">
              <Clock className="w-4 h-4" />
              Fecha del Sistema
            </div>
            <p className="font-display text-lg text-[#2B2623]">
              {new Date().toLocaleDateString("es-VE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR DOCENTE                                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddTeacherOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Registrar Nuevo Docente
                </h3>
                <button
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTeacherSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Prof. Roberto Méndez"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Correo Institucional
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="docente@ilumina.edu"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Contraseña Temporal
                    </label>
                    <input
                      type="text"
                      placeholder="Mínimo 6 caracteres"
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Departamento / Área
                    </label>
                    <select
                      value={newTeacherDept}
                      onChange={(e) => setNewTeacherDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      {DEPARTMENT_OPTIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Rango / Cargo
                    </label>
                    <select
                      value={newTeacherRank}
                      onChange={(e) => setNewTeacherRank(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      {RANK_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Año Escolar
                  </label>
                  <input
                    type="text"
                    value={newTeacherYear}
                    onChange={(e) => setNewTeacherYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                {/* Admin Status Toggle */}
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-950">
                        Rol de Administrador (admin true)
                      </p>
                      <p className="text-[11px] text-amber-800/80">
                        Permite ver este panel administrativo y gestionar docentes y alumnos.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newTeacherIsAdmin}
                    onChange={(e) => setNewTeacherIsAdmin(e.target.checked)}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddTeacherOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTeacher}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    {isSavingTeacher ? "Guardando..." : "Crear Docente"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR DOCENTE                                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingTeacher && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  Editar Docente
                </h3>
                <button
                  onClick={() => setEditingTeacher(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTeacherSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={editTeacherName}
                    onChange={(e) => setEditTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={editTeacherEmail}
                      onChange={(e) => setEditTeacherEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Nueva Contraseña (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Dejar en blanco para mantener"
                      value={editTeacherNewPassword}
                      onChange={(e) => setEditTeacherNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Departamento
                    </label>
                    <select
                      value={editTeacherDept}
                      onChange={(e) => setEditTeacherDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {DEPARTMENT_OPTIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Rango / Cargo
                    </label>
                    <select
                      value={editTeacherRank}
                      onChange={(e) => setEditTeacherRank(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {RANK_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Año Escolar
                  </label>
                  <input
                    type="text"
                    value={editTeacherYear}
                    onChange={(e) => setEditTeacherYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                {/* Admin Status Toggle */}
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-950">
                        Estado Administrador (admin true)
                      </p>
                      <p className="text-[11px] text-amber-800/80">
                        Habilita el botón del panel de administrador en el perfil de este docente.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editTeacherIsAdmin}
                    onChange={(e) => setEditTeacherIsAdmin(e.target.checked)}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingTeacher(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTeacher}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    {isSavingTeacher ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ELIMINAR DOCENTE (CONFIRMACIÓN)                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {teacherToDelete && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-extrabold text-slate-900">
                  ¿Eliminar Docente?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ¿Estás seguro de que deseas eliminar a <strong>{teacherToDelete.name}</strong> ({teacherToDelete.email})? Esta acción removerá el acceso institucional.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setTeacherToDelete(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteTeacherConfirm}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-rose-600/20 transition cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR ALUMNO                                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddStudentOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  Registrar Alumno en Padrón Escolar
                </h3>
                <button
                  onClick={() => setIsAddStudentOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos Eduardo"
                      value={newStudentFirst}
                      onChange={(e) => setNewStudentFirst(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Gómez Silva"
                      value={newStudentLast}
                      onChange={(e) => setNewStudentLast(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Cédula de Identidad
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="V-32.450.891"
                    value={newStudentCedula}
                    onChange={(e) => setNewStudentCedula(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Año Académico
                    </label>
                    <select
                      value={newStudentYear}
                      onChange={(e) => setNewStudentYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                    >
                      {GRADE_YEAR_OPTIONS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Sección Asignada
                    </label>
                    <select
                      value={newStudentSection}
                      onChange={(e) => setNewStudentSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                    >
                      {SECTION_OPTIONS.map(s => (
                        <option key={s} value={s}>Sección {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 leading-relaxed">
                  ℹ️ Una vez creado, este alumno aparecerá de forma inmediata en las materias que los docentes creen para <strong>{newStudentYear}</strong> (Sección <strong>{newStudentSection}</strong>).
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    Registrar Alumno
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR ALUMNO                                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-600" />
                  Editar Alumno
                </h3>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      required
                      value={editStudentFirst}
                      onChange={(e) => setEditStudentFirst(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      required
                      value={editStudentLast}
                      onChange={(e) => setEditStudentLast(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Cédula de Identidad
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentCedula}
                    onChange={(e) => setEditStudentCedula(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Año Académico
                    </label>
                    <select
                      value={editStudentYear}
                      onChange={(e) => setEditStudentYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {GRADE_YEAR_OPTIONS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Sección Asignada
                    </label>
                    <select
                      value={editStudentSection}
                      onChange={(e) => setEditStudentSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {SECTION_OPTIONS.map(s => (
                        <option key={s} value={s}>Sección {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ELIMINAR ALUMNO (CONFIRMACIÓN)                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-extrabold text-slate-900">
                  ¿Eliminar Alumno?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ¿Estás seguro de que deseas eliminar a <strong>{studentToDelete.firstName} {studentToDelete.lastName}</strong> ({studentToDelete.cedula}) del padrón escolar?
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteStudentConfirm}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-rose-600/20 transition cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
