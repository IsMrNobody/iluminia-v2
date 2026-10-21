import React, { useState, useMemo, useEffect } from "react";
import { ClassSection, Student } from "../types";
import { getWeightedFinalScore } from "../mockData";
import { 
  PolaroidAvatar, 
  WaxSealNumber, 
  GemProgressBar, 
  PerformanceBadge,
  MedalCounter
} from "./BitacoraBrand";
import { 
  Search, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3,
  Users
} from "lucide-react";

interface ClassOverviewViewProps {
  section: ClassSection;
  allSiblingSections?: ClassSection[];
  onSwitchSection?: (sectionId: string) => void;
  onBack: () => void;
  onSelectStudent: (studentId: string) => void;
  onAddStudent: (className: string) => void;
  onDeleteStudent?: (studentId: string) => void;
}

type FilterType = "TODOS" | "APROBADOS" | "APLAZADOS" | "PENDIENTES";

export default function ClassOverviewView({
  section,
  allSiblingSections = [],
  onSwitchSection,
  onBack,
  onSelectStudent,
  onAddStudent,
  onDeleteStudent
}: ClassOverviewViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("TODOS");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [section.id]);

  // Compute final score for each student based on active lapso
  const studentsWithScores = useMemo(() => {
    return (section.students || []).map((std, idx) => ({
      ...std,
      listNumber: idx + 1,
      finalScore: getWeightedFinalScore(std.grades, (section.lapso || 1) as 1 | 2 | 3)
    }));
  }, [section.students, section.lapso]);

  // Filter and search students
  const filteredStudents = useMemo(() => {
    return studentsWithScores.filter((std) => {
      const fullName = `${std.firstName} ${std.lastName}`.toLowerCase();
      const idMatch = (std.id || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || idMatch;

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case "APROBADOS":
          return std.finalScore >= 10.0;
        case "APLAZADOS":
          return std.finalScore < 10.0 && std.finalScore > 0;
        case "PENDIENTES":
          return std.finalScore === 0;
        case "TODOS":
        default:
          return true;
      }
    });
  }, [studentsWithScores, searchQuery, activeFilter]);

  // Section performance stats
  const stats = useMemo(() => {
    if (studentsWithScores.length === 0) {
      return { average: 0, passing: 0, failing: 0, pending: 0 };
    }
    const graded = studentsWithScores.filter(s => s.finalScore > 0);
    const sum = graded.reduce((acc, s) => acc + s.finalScore, 0);
    const avg = graded.length > 0 ? Number((sum / graded.length).toFixed(1)) : 0;
    const passing = studentsWithScores.filter(s => s.finalScore >= 10.0).length;
    const failing = studentsWithScores.filter(s => s.finalScore < 10.0 && s.finalScore > 0).length;
    const pending = studentsWithScores.filter(s => s.finalScore === 0).length;

    return { average: avg, passing, failing, pending };
  }, [studentsWithScores]);

  // Group sections by letter for switcher
  const siblingSectionsSorted = useMemo(() => {
    if (allSiblingSections.length > 0) {
      return [...allSiblingSections].sort((a, b) => a.sectionLetter.localeCompare(b.sectionLetter));
    }
    return [section];
  }, [allSiblingSections, section]);

  return (
    <div className="space-y-6">
      {/* Back chip */}
      <button 
        onClick={onBack}
        className="chip group"
        title="Volver a la lista de materias"
      >
        <ArrowLeft className="w-4 h-4 text-[#D97706] group-hover:-translate-x-1 transition-transform" />
        <span>Clases</span>
      </button>

      {/* Top Heading Row */}
      <div className="row justify-between items-start gap-4">
        <div>
          <span className="bg adm mb-2">
            {section.department || "Materia Principal"}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-[#2B2623]">
            {section.subjectName} · {section.gradeYear}
          </h1>
          <p className="sub">
            Sección {section.sectionLetter} · {section.students.length} estudiantes en nómina
          </p>
        </div>

        <button 
          onClick={() => onAddStudent(`${section.gradeYear} • ${section.subjectName}`)}
          className="btn full-m"
        >
          <Plus className="w-5 h-5 text-[#2B2623]" />
          <span>Agregar alumnos</span>
        </button>
      </div>

      {/* Section Switcher Chips */}
      {siblingSectionsSorted.length > 1 && (
        <div className="row gap-2 my-2">
          {siblingSectionsSorted.map((sib) => {
            const isCurrent = sib.id === section.id;
            return (
              <button
                key={sib.id}
                onClick={() => onSwitchSection && onSwitchSection(sib.id)}
                className={`chip ${isCurrent ? "am" : ""}`}
              >
                <span>{sib.sectionLetter}</span>
                <span className="ct">
                  {sib.students?.length || 0}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="row gap-3 my-4">
        <label className="sr full-m">
          <Search className="w-4 h-4 text-[#6E655F]" />
          <input 
            type="text"
            placeholder="Buscar por nombre, apellido o cédula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>

        <div className="row gap-2">
          {(["TODOS", "APROBADOS", "APLAZADOS", "PENDIENTES"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`chip ${activeFilter === filter ? "on" : ""}`}
            >
              {filter === "TODOS" ? "Todos" : filter === "APROBADOS" ? "Aprobados" : filter === "APLAZADOS" ? "Aplazados" : "Sin calificar"}
            </button>
          ))}
        </div>
      </div>

      {/* Students Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="card p-12 text-center bg-white space-y-3">
          <Users className="w-10 h-10 text-[#CDB993] mx-auto" />
          <h3 className="font-display text-xl text-[#2B2623]">
            {searchQuery ? "No se encontraron estudiantes" : "Aún no hay alumnos en esta sección"}
          </h3>
          <p className="sub max-w-md mx-auto">
            {searchQuery 
              ? "Prueba cambiando el término de búsqueda o seleccionando otro filtro." 
              : "Inscribe alumnos desde el directorio central para comenzar a evaluar este lapso."}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => onAddStudent(`${section.gradeYear} • ${section.subjectName}`)}
              className="btn s mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Inscribir alumnos ahora</span>
            </button>
          )}
        </div>
      ) : (
        <div className="g" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {filteredStudents.map((std) => {
            const hasScore = std.finalScore > 0;
            const scorePercent = (std.finalScore / 20) * 100;
            const barColor = std.finalScore >= 16 ? "#22C55E" : std.finalScore >= 10 ? "#EAB308" : "#EF4444";

            return (
              <div 
                key={std.id}
                className="card sti p-5 bg-white relative group"
              >
                {/* Header: Polaroid avatar, Name, Wax seal list number */}
                <div className="flex items-center gap-3.5">
                  <PolaroidAvatar 
                    avatarUrl={std.avatarUrl}
                    alt={`${std.firstName} ${std.lastName}`}
                    size={58}
                  />

                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-lg text-[#2B2623] truncate">
                      {std.firstName} {std.lastName}
                    </h2>
                    <p className="sub truncate">
                      {std.id.includes("V-") ? std.id : `C.I. ${std.id}`}
                    </p>
                  </div>

                  <WaxSealNumber 
                    numberStr={std.listNumber} 
                    size={42} 
                  />
                </div>

                {/* Score Status */}
                <div className="flex justify-between items-center my-4">
                  <PerformanceBadge score={hasScore ? std.finalScore : undefined} />
                  
                  <div>
                    {hasScore ? (
                      <span className="font-display text-2xl font-bold" style={{ color: barColor }}>
                        {std.finalScore.toFixed(1)}
                        <span className="text-xs text-[#6E655F] font-sans font-normal"> /20</span>
                      </span>
                    ) : (
                      <span className="font-display text-2xl font-bold text-[#6E655F]">
                        — —
                      </span>
                    )}
                  </div>
                </div>

                {/* Gem Progress Bar */}
                <GemProgressBar 
                  percent={hasScore ? scorePercent : 0} 
                  barColor={hasScore ? barColor : "#E5DCD0"}
                  className="mb-3"
                />

                {/* Action Button: Calificar alumno */}
                <div className="flex items-center gap-2 mt-3">
                  <button 
                    onClick={() => onSelectStudent(std.id)}
                    className="btn s w"
                  >
                    <Edit3 className="w-4 h-4 text-[#D97706]" />
                    <span>Calificar alumno</span>
                  </button>

                  {onDeleteStudent && (
                    confirmDeleteId === std.id ? (
                      <button
                        onClick={() => { onDeleteStudent(std.id); setConfirmDeleteId(null); }}
                        className="btn danger px-3 shrink-0"
                        title="Confirmar eliminar estudiante"
                      >
                        ¿Quitar?
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(std.id)}
                        className="btn s px-3 shrink-0 text-[#B91C1C] hover:bg-red-50"
                        title="Quitar estudiante de la sección"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Class Overall Performance Banner at bottom */}
      <div 
        className="card co mt-8 p-6 sm:p-7 text-[#FBF6ED]"
        style={{
          background: "linear-gradient(#7A4B2A, #5E3A20)",
          borderColor: "#3E2514"
        }}
      >
        <div className="row justify-between items-center gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F4DFA6] font-mono">
              Rendimiento de la sección
            </span>
            <div className="num text-4xl sm:text-5xl mt-1.5 text-white">
              {stats.average > 0 ? stats.average.toFixed(1) : "—"}
              <span className="text-lg sm:text-xl font-normal text-[#F4DFA6]/80 ml-2">
                promedio /20
              </span>
            </div>
          </div>

          <div className="row gap-3">
            <MedalCounter 
              value={stats.passing} 
              label="Aprobados" 
              valueColor="#15803D"
              size={94}
            />
            <MedalCounter 
              value={stats.failing} 
              label="Aplazados" 
              valueColor="#B91C1C"
              size={94}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
