import React, { useState, useMemo, useEffect } from "react";
import { SubjectGroup, ClassSection } from "../types";
import { getWeightedFinalScore } from "../mockData";
import { getCurrentSchoolYear } from "../lib/adminService";
import { getSubjectTheme } from "../utils/subjectThemes";
import {
  ArrowLeft,
  Users,
  BookOpen,
  Check,
  TrendingUp,
  Award,
  Plus,
  ChevronRight,
  GraduationCap,
  Sparkles,
  School,
  Layers,
  Trash2,
  Edit2
} from "lucide-react";
import { motion } from "motion/react";

interface SubjectSectionsViewProps {
  subjectGroup: SubjectGroup;
  allSubjectGroups?: SubjectGroup[];
  onSelectSubjectGroup?: (groupKey: string) => void;
  teacherName: string;
  onBack: () => void;
  onSelectSection: (sectionId: string) => void;
  onAddNewSection?: (sectionLetter: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onUpdateSubjectEvaluations?: (subjectName: string, gradeYear: string, updatedLapsoContent: any) => void;
  activeLapso?: 1 | 2 | 3;
}

export default function SubjectSectionsView({
  subjectGroup,
  allSubjectGroups,
  onSelectSubjectGroup,
  teacherName,
  onBack,
  onSelectSection,
  onAddNewSection,
  onDeleteSection,
  onUpdateSubjectEvaluations,
  activeLapso = 1
}: SubjectSectionsViewProps) {
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSectionLetter, setNewSectionLetter] = useState("");
  const [sectionToDelete, setSectionToDelete] = useState<ClassSection | null>(null);

  const activeLapsoNum = activeLapso || subjectGroup.lapso || 1;
  const sampleStudent = subjectGroup.sections.flatMap(s => s.students || [])[0];
  const defaultLapso = {
    academic: {
      homework: { id: "hw", name: "Hoja de tarea", weight: 20, description: "Comprensión conceptual y precisión." },
      talentShow: { id: "ts", name: "Muestra de talentos", weight: 20, description: "Demostración práctica de habilidades." },
      assembly: { id: "asm", name: "Montaje", weight: 20, description: "Estructura y coherencia del proyecto." },
      essay: { id: "esy", name: "Ensayo", weight: 20, description: "Calidad y síntesis escrita." },
      performance: { id: "prf", name: "Puesta en escena", weight: 10, description: "Presentación final y expresión." },
    },
    ethical: {
      responsibility: { id: "resp", name: "Responsabilidad", weight: 5, description: "Entrega a tiempo y compromiso." },
      personalCare: { id: "pc", name: "Presentación", weight: 5, description: "Cumplimiento del orden y presentación." },
    }
  };
  const sampleGrades = sampleStudent?.grades?.[activeLapsoNum] || sampleStudent?.grades?.[1];
  const currentLapsoContent = sampleGrades || defaultLapso;

  const [isEditingEvals, setIsEditingEvals] = useState(false);
  const [editableLapso, setEditableLapso] = useState(() => JSON.parse(JSON.stringify(currentLapsoContent)));

  useEffect(() => {
    const freshStudent = subjectGroup.sections.flatMap(s => s.students || [])[0];
    const freshGrades = freshStudent?.grades?.[activeLapsoNum] || freshStudent?.grades?.[1] || defaultLapso;
    setEditableLapso(JSON.parse(JSON.stringify(freshGrades)));
  }, [subjectGroup, activeLapsoNum]);

  const totalAcademicWeight = useMemo(() => {
    const ac = editableLapso.academic || {};
    return (Number(ac.homework?.weight) || 0) +
           (Number(ac.talentShow?.weight) || 0) +
           (Number(ac.assembly?.weight) || 0) +
           (Number(ac.essay?.weight) || 0) +
           (Number(ac.performance?.weight) || 0);
  }, [editableLapso]);

  const handleSaveEvaluations = () => {
    if (onUpdateSubjectEvaluations) {
      onUpdateSubjectEvaluations(subjectGroup.subjectName, subjectGroup.gradeYear, editableLapso);
    }
    setIsEditingEvals(false);
  };

  const existingLetters = subjectGroup.sections.map(s => s.sectionLetter.toUpperCase());
  const suggestedLetters = ["A", "B", "C", "D", "E", "F", "U"].filter(l => !existingLetters.includes(l));

  // Compute stats across all sections of this subject
  const totalStudents = subjectGroup.sections.reduce((acc, s) => acc + (s.students?.length || 0), 0);
  let totalScoreSum = 0;
  let totalGradedStudents = 0;
  let totalPassing = 0;
  let totalFailing = 0;

  subjectGroup.sections.forEach(sec => {
    sec.students?.forEach(std => {
      const score = getWeightedFinalScore(std.grades);
      totalScoreSum += score;
      totalGradedStudents += 1;
      if (score >= 10) totalPassing += 1;
      else if (score > 0) totalFailing += 1;
    });
  });

  const overallAverage = totalGradedStudents > 0 
    ? (totalScoreSum / totalGradedStudents).toFixed(1) 
    : "0.0";

  const theme = getSubjectTheme(subjectGroup.subjectName);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionLetter.trim() || !onAddNewSection) return;
    onAddNewSection(newSectionLetter.trim().toUpperCase());
    setNewSectionLetter("");
    setIsAddSectionModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-24"
    >
      {/* Header and Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer group shadow-xs mt-1 sm:mt-0 text-xs font-bold"
            title="Volver a Mis Materias"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Mis Materias</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <Layers className={`w-4 h-4 ${theme.primary}`} />
              <span className="text-[11px] font-extrabold tracking-wider uppercase">
                SECCIONES ASIGNADAS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <span>{subjectGroup.subjectName}</span>
              <span className={`${theme.primary} text-lg sm:text-xl font-bold ${theme.pillBg} px-2.5 py-0.5 rounded-lg border ${theme.pillBorder}`}>
                {subjectGroup.gradeYear}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Docente Titular: <strong className="text-slate-800">{teacherName}</strong> • {subjectGroup.department} • Lapso {subjectGroup.lapso}
            </p>
          </div>
        </div>

        {onAddNewSection && (
          <button
            onClick={() => setIsAddSectionModalOpen(true)}
            className={`px-4 py-2.5 rounded-xl ${theme.btnBg} text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-sm self-start sm:self-center`}
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Sección</span>
          </button>
        )}
      </div>

      {/* Switcher between multiple assigned subjects */}
      {allSubjectGroups && allSubjectGroups.length > 1 && onSelectSubjectGroup && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
            Mis Materias:
          </span>
          {allSubjectGroups.map((grp) => {
            const isSelected = grp.key === subjectGroup.key;
            const grpTheme = getSubjectTheme(grp.subjectName);
            return (
              <button
                key={grp.key}
                onClick={() => onSelectSubjectGroup(grp.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? `${grpTheme.badgeBg} text-white shadow-xs`
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{grp.subjectName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? "bg-black/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {grp.gradeYear}
                </span>
                <span className="text-[10px] text-blue-400 font-mono">
                  ({grp.sections.length} sec)
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Secciones
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
            {subjectGroup.sections.length}
          </span>
          <span className="text-[10px] text-blue-600 font-bold">
            {subjectGroup.sections.map(s => `Sec. ${s.sectionLetter}`).join(", ")}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Alumnos
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
            {totalStudents}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            En todas las secciones
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Promedio Global
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block font-mono">
            {overallAverage} <span className="text-xs text-slate-400">/ 20</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-bold">
            {totalPassing} Aprobados
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Año Escolar
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
            {subjectGroup.gradeYear.split(" ")[0]}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {getCurrentSchoolYear()}
          </span>
        </div>
      </div>

      {/* Subject Evaluations Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg text-slate-900">
                Evaluaciones de la Materia (Lapso {activeLapsoNum})
              </h3>
              <p className="text-xs text-slate-500">
                Configura los nombres y porcentajes que se aplicarán unificadamente a todas las secciones de esta asignatura.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isEditingEvals ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                  totalAcademicWeight === 100 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}>
                  Total Académico: {totalAcademicWeight}% {totalAcademicWeight !== 100 && "(Debe ser 100%)"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingEvals(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvaluations}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingEvals(true)}
                className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar Evaluaciones</span>
              </button>
            )}
          </div>
        </div>

        {/* Academic & Ethical Evaluations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Academic */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Criterios Académicos (80%)</h4>
            {Object.entries(editableLapso.academic || {}).map(([key, item]: [string, any]) => (
              <div key={key} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                {isEditingEvals ? (
                  <>
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditableLapso((prev: any) => ({
                            ...prev,
                            academic: {
                              ...prev.academic,
                              [key]: { ...prev.academic[key], name: val }
                            }
                          }));
                        }}
                        className="w-full text-xs font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-lg focus:outline-amber-600"
                        placeholder="Nombre de evaluación"
                      />
                    </div>
                    <div className="w-24 shrink-0 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.weight}
                        onChange={(e) => {
                          const w = parseInt(e.target.value) || 0;
                          setEditableLapso((prev: any) => ({
                            ...prev,
                            academic: {
                              ...prev.academic,
                              [key]: { ...prev.academic[key], weight: w }
                            }
                          }));
                        }}
                        className="w-16 text-center text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-amber-600 font-mono"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-500 truncate block">{item.description || "Criterio académico"}</span>
                    </div>
                    <span className="text-xs font-black font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg shrink-0">
                      {item.weight}% de la nota
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Ethical */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Criterios Éticos y Formativos (20%)</h4>
            {Object.entries(editableLapso.ethical || {}).map(([key, item]: [string, any]) => (
              <div key={key} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                {isEditingEvals ? (
                  <>
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditableLapso((prev: any) => ({
                            ...prev,
                            ethical: {
                              ...prev.ethical,
                              [key]: { ...prev.ethical[key], name: val }
                            }
                          }));
                        }}
                        className="w-full text-xs font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-lg focus:outline-amber-600"
                        placeholder="Nombre ético"
                      />
                    </div>
                    <div className="w-24 shrink-0 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.weight}
                        onChange={(e) => {
                          const w = parseInt(e.target.value) || 0;
                          setEditableLapso((prev: any) => ({
                            ...prev,
                            ethical: {
                              ...prev.ethical,
                              [key]: { ...prev.ethical[key], weight: w }
                            }
                          }));
                        }}
                        className="w-16 text-center text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-amber-600 font-mono"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-500 truncate block">{item.description || "Criterio formativo"}</span>
                    </div>
                    <span className="text-xs font-black font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg shrink-0">
                      {item.weight}% de la nota
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <School className="w-4 h-4 text-blue-600" />
              <span>Secciones Asignadas ({subjectGroup.sections.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Entra a cualquier sección para consultar su nómina e ingresar calificaciones:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectGroup.sections.map((section) => {
            const studentCount = section.students?.length || 0;
            const gradedStudents = section.students?.filter(s => getWeightedFinalScore(s.grades) > 0) || [];
            const secAverage = gradedStudents.length > 0
              ? Number((gradedStudents.reduce((sum, s) => sum + getWeightedFinalScore(s.grades), 0) / gradedStudents.length).toFixed(1))
              : 0;
            const passingCount = section.students?.filter(s => getWeightedFinalScore(s.grades) >= 10).length || 0;
            const failingCount = section.students?.filter(s => {
              const score = getWeightedFinalScore(s.grades);
              return score < 10 && score > 0;
            }).length || 0;

            return (
              <div
                key={section.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.bgGradient} text-white flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform`}>
                        {section.sectionLetter}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-extrabold text-slate-900">
                            Sección {section.sectionLetter}
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Activa
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {subjectGroup.subjectName} • {subjectGroup.gradeYear}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-mono font-bold ${theme.pillBg} ${theme.pillText} px-2.5 py-1 rounded-lg border ${theme.pillBorder}`}>
                      {secAverage > 0 ? `${secAverage.toFixed(1)} / 20` : "Sin notas"}
                    </span>
                  </div>

                  {/* Metrics preview */}
                  <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Alumnos</span>
                      <strong className="text-sm font-extrabold text-slate-800 font-mono">{studentCount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase block">Aprobados</span>
                      <strong className="text-sm font-extrabold text-emerald-700 font-mono">{passingCount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-rose-500 uppercase block">Aplazados</span>
                      <strong className="text-sm font-extrabold text-rose-600 font-mono">{failingCount}</strong>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-100 items-center">
                  <button
                    onClick={() => onSelectSection(section.id)}
                    className={`flex-1 ${theme.btnBg} text-white font-bold text-xs tracking-wider uppercase py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Ver Lista de Alumnos</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {onDeleteSection && (
                    <button
                      type="button"
                      onClick={() => setSectionToDelete(section)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title={`Eliminar Sección ${section.sectionLetter}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Section Modal */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                Agregar Sección a {subjectGroup.subjectName}
              </h3>
              <button
                onClick={() => setIsAddSectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Letra o Identificador de Sección
                </label>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {suggestedLetters.slice(0, 6).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setNewSectionLetter(l)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                        newSectionLetter === l 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  maxLength={3}
                  required
                  placeholder="Ej: E, F o U"
                  value={newSectionLetter}
                  onChange={(e) => setNewSectionLetter(e.target.value.toUpperCase())}
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition uppercase"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSectionModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase shadow-sm"
                >
                  Guardar Sección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Section Modal */}
      {sectionToDelete && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  ¿Eliminar Sección {sectionToDelete.sectionLetter}?
                </h3>
                <p className="text-xs text-slate-500">
                  {subjectGroup.subjectName} • {subjectGroup.gradeYear}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
              Esta sección contiene <strong>{sectionToDelete.students?.length || 0} estudiantes</strong>. Se eliminará de la nómina y de la base de datos.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSectionToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSection && sectionToDelete) {
                    onDeleteSection(sectionToDelete.id);
                    setSectionToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase shadow-sm"
              >
                Sí, Eliminar Sección
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
