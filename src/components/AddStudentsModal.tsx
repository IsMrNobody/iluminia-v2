import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserPlus, 
  Search, 
  X, 
  Check, 
  Filter, 
  GraduationCap, 
  CheckSquare, 
  Square, 
  Users, 
  AlertCircle,
  Plus,
  RefreshCw,
  BadgeCheck,
  Sparkles
} from "lucide-react";
import { ClassSection, Student, RegisteredStudent } from "../types";
import { getRegisteredStudents, fetchRegisteredStudentsFromDatabase, normalizeYear } from "../lib/adminService";

export interface StudentCandidate {
  id: string;
  firstName: string;
  lastName: string;
  cedula: string;
  gradeYear: string;
  sectionLetter: string;
  avatarUrl?: string;
  source: "registered" | "class";
}

interface AddStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassSection;
  allClasses: ClassSection[];
  onAddExistingStudents: (candidates: StudentCandidate[]) => Promise<void>;
  onAddNewManualStudent: (studentData: {
    firstName: string;
    lastName: string;
    cedula: string;
    gradeYear: string;
    sectionLetter: string;
  }) => Promise<void>;
}

export function AddStudentsModal({
  isOpen,
  onClose,
  currentClass,
  allClasses,
  onAddExistingStudents,
  onAddNewManualStudent,
}: AddStudentsModalProps) {
  // Modal active tab: 'directory' (search & pick) or 'manual' (create brand new)
  const [activeTab, setActiveTab] = useState<"directory" | "manual">("directory");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("ALL");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("ALL");
  const [onlyNonEnrolled, setOnlyNonEnrolled] = useState<boolean>(true);

  // Selected students IDs for bulk enrolling
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());

  // Manual new student fields
  const [manualFirstName, setManualFirstName] = useState("");
  const [manualLastName, setManualLastName] = useState("");
  const [manualCedula, setManualCedula] = useState("");
  const [manualYear, setManualYear] = useState(currentClass?.gradeYear || "1er Año");
  const [manualSection, setManualSection] = useState(currentClass?.sectionLetter || "A");

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [rawRegistered, setRawRegistered] = useState<RegisteredStudent[]>([]);

  // Load registered students
  const loadDirectory = async () => {
    setIsLoadingDirectory(true);
    try {
      const cached = getRegisteredStudents();
      setRawRegistered(cached);
      const fresh = await fetchRegisteredStudentsFromDatabase();
      if (fresh && fresh.length > 0) {
        setRawRegistered(fresh);
      }
    } catch {
      // Fallback to cache
      setRawRegistered(getRegisteredStudents());
    } finally {
      setIsLoadingDirectory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDirectory();
      setSelectedCandidateIds(new Set());
      setSearchQuery("");
      setActiveTab("directory");
    }
  }, [isOpen, currentClass?.id]);

  // Set of student names or cédulas already enrolled in current class
  const enrolledStudentSet = useMemo(() => {
    const set = new Set<string>();
    if (!currentClass || !currentClass.students) return set;
    
    currentClass.students.forEach((s) => {
      if (s.id) set.add(s.id.toLowerCase());
      if (s.cedula) set.add(s.cedula.toLowerCase().trim());
      // Match by normalized full name
      const nameKey = `${s.firstName.toLowerCase().trim()}_${s.lastName.toLowerCase().trim()}`;
      set.add(nameKey);
    });
    return set;
  }, [currentClass]);

  // Build the complete list of candidate students from both RegisteredStudent directory & other classes
  const allCandidates = useMemo<StudentCandidate[]>(() => {
    const map = new Map<string, StudentCandidate>();

    // 1. Add from rawRegistered
    rawRegistered.forEach((reg) => {
      const key = reg.cedula?.trim() 
        ? `ced_${reg.cedula.trim().toLowerCase()}` 
        : `id_${reg.id || reg.firstName}_${reg.lastName}`;
      map.set(key, {
        id: reg.id,
        firstName: reg.firstName,
        lastName: reg.lastName,
        cedula: reg.cedula || "",
        gradeYear: reg.gradeYear || "1er Año",
        sectionLetter: reg.sectionLetter || "A",
        avatarUrl: reg.avatarUrl,
        source: "registered",
      });
    });

    // 2. Add from existing classes in school if not present
    allClasses.forEach((cls) => {
      (cls.students || []).forEach((std) => {
        const cedKey = std.cedula?.trim() ? `ced_${std.cedula.trim().toLowerCase()}` : "";
        const nameKey = `name_${std.firstName.toLowerCase().trim()}_${std.lastName.toLowerCase().trim()}`;
        const key = cedKey || nameKey;

        if (!map.has(key)) {
          map.set(key, {
            id: std.id,
            firstName: std.firstName,
            lastName: std.lastName,
            cedula: std.cedula || "",
            gradeYear: std.gradeYear || cls.gradeYear,
            sectionLetter: std.sectionLetter || cls.sectionLetter,
            avatarUrl: std.avatarUrl,
            source: "class",
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      const compLast = a.lastName.localeCompare(b.lastName);
      if (compLast !== 0) return compLast;
      return a.firstName.localeCompare(b.firstName);
    });
  }, [rawRegistered, allClasses]);

  // Check if a candidate is already enrolled in the current class
  const isCandidateEnrolled = (candidate: StudentCandidate): boolean => {
    if (candidate.id && enrolledStudentSet.has(candidate.id.toLowerCase())) return true;
    if (candidate.cedula && enrolledStudentSet.has(candidate.cedula.toLowerCase().trim())) return true;
    const nameKey = `${candidate.firstName.toLowerCase().trim()}_${candidate.lastName.toLowerCase().trim()}`;
    return enrolledStudentSet.has(nameKey);
  };

  // Filter candidates according to user input
  const filteredCandidates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filterYear = selectedYearFilter !== "ALL" ? normalizeYear(selectedYearFilter) : null;
    const filterSec = selectedSectionFilter !== "ALL" ? selectedSectionFilter.toUpperCase().trim() : null;

    return allCandidates.filter((cand) => {
      const isEnrolled = isCandidateEnrolled(cand);
      if (onlyNonEnrolled && isEnrolled) return false;

      // Filter by search query (name or cédula)
      if (q) {
        const fullName = `${cand.firstName} ${cand.lastName}`.toLowerCase();
        const reverseName = `${cand.lastName} ${cand.firstName}`.toLowerCase();
        const ced = (cand.cedula || "").toLowerCase();
        const matchesQuery = fullName.includes(q) || reverseName.includes(q) || ced.includes(q);
        if (!matchesQuery) return false;
      }

      // Filter by Year
      if (filterYear) {
        if (normalizeYear(cand.gradeYear) !== filterYear) return false;
      }

      // Filter by Section
      if (filterSec) {
        if ((cand.sectionLetter || "A").toUpperCase().trim() !== filterSec) return false;
      }

      return true;
    });
  }, [allCandidates, searchQuery, selectedYearFilter, selectedSectionFilter, onlyNonEnrolled, enrolledStudentSet]);

  // Toggle single candidate selection
  const handleToggleCandidate = (candidate: StudentCandidate) => {
    if (isCandidateEnrolled(candidate)) return;
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      const idKey = candidate.id || `${candidate.firstName}_${candidate.lastName}`;
      if (next.has(idKey)) {
        next.delete(idKey);
      } else {
        next.add(idKey);
      }
      return next;
    });
  };

  // Select all visible candidates
  const handleSelectAllVisible = () => {
    const available = filteredCandidates.filter((c) => !isCandidateEnrolled(c));
    setSelectedCandidateIds(new Set(available.map((c) => c.id || `${c.firstName}_${c.lastName}`)));
  };

  // Clear all selections
  const handleClearSelections = () => {
    setSelectedCandidateIds(new Set());
  };

  // Submit enrollment
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (activeTab === "directory") {
      if (selectedCandidateIds.size === 0) return;
      setIsSubmitting(true);
      try {
        const toAdd = allCandidates.filter((c) => {
          const idKey = c.id || `${c.firstName}_${c.lastName}`;
          return selectedCandidateIds.has(idKey) && !isCandidateEnrolled(c);
        });
        await onAddExistingStudents(toAdd);
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Manual form
      if (!manualFirstName.trim() || !manualLastName.trim()) return;
      setIsSubmitting(true);
      try {
        await onAddNewManualStudent({
          firstName: manualFirstName.trim(),
          lastName: manualLastName.trim().toUpperCase(),
          cedula: manualCedula.trim(),
          gradeYear: manualYear,
          sectionLetter: manualSection,
        });
        setManualFirstName("");
        setManualLastName("");
        setManualCedula("");
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen || !currentClass) return null;

  const selectedCount = selectedCandidateIds.size;

  return (
    <div className="fixed inset-0 bg-[#2B2623]/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        className="card sti co bg-white max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        style={{ padding: 0 }}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5DCD0] flex items-center justify-between bg-[#FFF8E6] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-[#D97706] text-[#2B2623] rounded-xl shrink-0 font-bold">
              <UserPlus className="w-5 h-5 text-[#2B2623]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg text-[#2B2623] tracking-tight flex items-center gap-2 truncate">
                <span>Inscribir Alumnos a la Clase</span>
                <span className="bg vio shrink-0">
                  Nómina
                </span>
              </h3>
              <p className="sub text-xs truncate mt-0.5">
                Destino: <strong className="text-[#6B4423]">{currentClass.subjectName}</strong> • {currentClass.gradeYear} (Sec. {currentClass.sectionLetter}) • {currentClass.students.length} actuales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#FBF6ED] text-[#6E655F] hover:text-[#2B2623] transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-4 sm:px-5 pt-3 border-b border-[#E5DCD0] bg-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("directory")}
              className={`chip ${activeTab === "directory" ? "am" : ""}`}
            >
              <Users className="w-4 h-4" />
              <span>Nómina Escolar ({allCandidates.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`chip ${activeTab === "manual" ? "am" : ""}`}
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Manual</span>
            </button>
          </div>

          {activeTab === "directory" && (
            <button
              type="button"
              onClick={loadDirectory}
              disabled={isLoadingDirectory}
              className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 pb-2 cursor-pointer disabled:opacity-50"
              title="Recargar nómina"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDirectory ? "animate-spin text-blue-600" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          )}
        </div>

        {/* Main Form content */}
        <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {activeTab === "directory" ? (
            <div className="flex flex-col flex-1 min-h-0 p-4 sm:p-5 space-y-3">
              {/* Search bar & Filters */}
              <div className="space-y-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar alumno por nombre, apellido o cédula..."
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold placeholder-slate-400 focus:bg-white focus:outline-blue-600 transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filters Row: Año & Sección */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Filtrar por Año:
                    </label>
                    <select
                      value={selectedYearFilter}
                      onChange={(e) => setSelectedYearFilter(e.target.value)}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 cursor-pointer"
                    >
                      <option value="ALL">Todos los Años</option>
                      <option value="1er Año">1er Año</option>
                      <option value="2do Año">2do Año</option>
                      <option value="3er Año">3er Año</option>
                      <option value="4to Año">4to Año</option>
                      <option value="5to Año">5to Año</option>
                      <option value="6to Grado">6to Grado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Filtrar Sección:
                    </label>
                    <select
                      value={selectedSectionFilter}
                      onChange={(e) => setSelectedSectionFilter(e.target.value)}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 cursor-pointer"
                    >
                      <option value="ALL">Todas las Secciones</option>
                      <option value="A">Sección A</option>
                      <option value="B">Sección B</option>
                      <option value="C">Sección C</option>
                      <option value="D">Sección D</option>
                      <option value="E">Sección E</option>
                      <option value="F">Sección F</option>
                      <option value="U">Sección Única (U)</option>
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex items-end">
                    <label className="flex items-center gap-1.5 cursor-pointer py-1.5 select-none">
                      <input
                        type="checkbox"
                        checked={onlyNonEnrolled}
                        onChange={(e) => setOnlyNonEnrolled(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                      <span className="text-[11px] font-bold text-slate-700">Solo no inscritos</span>
                    </label>
                  </div>
                </div>

                {/* Bulk selection buttons & counter */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-blue-700 text-xs">
                      {selectedCount} seleccionados
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 text-[11px]">
                      {filteredCandidates.length} encontrados
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {filteredCandidates.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllVisible}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Seleccionar todos
                      </button>
                    )}
                    {selectedCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelections}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Limpiar ({selectedCount})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Students List */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => {
                    const idKey = candidate.id || `${candidate.firstName}_${candidate.lastName}`;
                    const isEnrolled = isCandidateEnrolled(candidate);
                    const isChecked = selectedCandidateIds.has(idKey);

                    return (
                      <div
                        key={idKey}
                        onClick={() => !isEnrolled && handleToggleCandidate(candidate)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all select-none ${
                          isEnrolled
                            ? "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
                            : isChecked
                            ? "bg-blue-50 border-blue-400 shadow-2xs cursor-pointer ring-1 ring-blue-300"
                            : "bg-white hover:bg-slate-50 border-slate-200 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox icon */}
                          <div className="shrink-0">
                            {isEnrolled ? (
                              <div className="w-5 h-5 rounded bg-slate-200 text-slate-500 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : isChecked ? (
                              <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded border-2 border-slate-300 hover:border-blue-400 bg-white" />
                            )}
                          </div>

                          {/* Student Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {candidate.lastName}, {candidate.firstName}
                              </span>
                              {candidate.cedula && (
                                <span className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  {candidate.cedula}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 text-[10px]">
                                {candidate.gradeYear} • Sec. {candidate.sectionLetter}
                              </span>
                              {candidate.source === "registered" && (
                                <span className="text-[10px] text-slate-400">
                                  • Nómina Escolar
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 ml-2">
                          {isEnrolled ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                              ✓ Ya en esta clase
                            </span>
                          ) : isChecked ? (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Seleccionado
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center px-4 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      No se encontraron alumnos con los filtros seleccionados
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Intenta buscar por otro término o cambiar los filtros de Año/Sección.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("manual")}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Inscribir un nuevo alumno manualmente
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Manual Registration Form */
            <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto">
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Inscripción manual directa</strong>
                  <span>
                    Utiliza este formulario si el estudiante es nuevo o aún no está en el directorio del colegio. Quedará matriculado directamente en esta clase.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Nombres del Alumno *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: David Alejandro"
                  value={manualFirstName}
                  onChange={(e) => setManualFirstName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Apellidos del Alumno *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: PÉREZ ROJAS"
                  value={manualLastName}
                  onChange={(e) => setManualLastName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Cédula de Identidad (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: V-32.890.123"
                  value={manualCedula}
                  onChange={(e) => setManualCedula(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Año de Procedencia
                  </label>
                  <select
                    value={manualYear}
                    onChange={(e) => setManualYear(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 cursor-pointer"
                  >
                    <option value="1er Año">1er Año</option>
                    <option value="2do Año">2do Año</option>
                    <option value="3er Año">3er Año</option>
                    <option value="4to Año">4to Año</option>
                    <option value="5to Año">5to Año</option>
                    <option value="6to Grado">6to Grado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Sección de Procedencia
                  </label>
                  <select
                    value={manualSection}
                    onChange={(e) => setManualSection(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 cursor-pointer"
                  >
                    <option value="A">Sección A</option>
                    <option value="B">Sección B</option>
                    <option value="C">Sección C</option>
                    <option value="D">Sección D</option>
                    <option value="E">Sección E</option>
                    <option value="F">Sección F</option>
                    <option value="U">Sección Única (U)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-[#E5DCD0] bg-[#FFF8E6] flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs font-semibold text-[#6E655F] truncate">
              {activeTab === "directory" ? (
                <span>
                  {selectedCount > 0 ? (
                    <strong className="text-[#D97706]">{selectedCount} {selectedCount === 1 ? "alumno listo" : "alumnos listos"} para agregar</strong>
                  ) : (
                    "Marca los alumnos que deseas agregar"
                  )}
                </span>
              ) : (
                <span>El alumno se agregará a esta clase</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="chip"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting || (activeTab === "directory" && selectedCount === 0)}
                className="btn s disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4 text-[#2B2623]" />
                <span>
                  {isSubmitting
                    ? "Inscribiendo..."
                    : activeTab === "directory"
                    ? `Agregar ${selectedCount > 0 ? `(${selectedCount}) ` : ""}a la Clase`
                    : "Guardar e Inscribir"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
