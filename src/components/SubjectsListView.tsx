import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Users,
  Plus,
  Search,
  Trash2,
  CheckSquare,
  Check,
  AlertTriangle,
  X,
  Loader2,
  ChevronRight
} from "lucide-react";
import { SubjectGroup } from "../types";
import { getSubjectTheme } from "../utils/subjectThemes";
import { IluminaOwl } from "./BitacoraBrand";

interface SubjectsListViewProps {
  subjectGroups: SubjectGroup[];
  teacherName: string;
  onSelectSubject: (groupKey: string) => void;
  onSelectSection: (sectionId: string, groupKey: string) => void;
  onOpenAddClass: () => void;
  onDeleteSubjectGroups?: (groupKeys: string[]) => Promise<void> | void;
}

export default function SubjectsListView({
  subjectGroups,
  teacherName,
  onSelectSubject,
  onSelectSection,
  onOpenAddClass,
  onDeleteSubjectGroups
}: SubjectsListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDeleteKeys, setPendingDeleteKeys] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredGroups = subjectGroups.filter(g => 
    g.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.gradeYear.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSections = subjectGroups.reduce((acc, g) => acc + g.sections.length, 0);
  const totalStudents = subjectGroups.reduce((acc, g) => acc + g.totalStudents, 0);
  const gradedGroups = subjectGroups.filter(g => g.averageScore > 0);
  const overallAvg = gradedGroups.length > 0
    ? (gradedGroups.reduce((acc, g) => acc + g.averageScore, 0) / gradedGroups.length).toFixed(1)
    : "0.0";

  // Toggle single card selection
  const handleToggleSelect = (groupKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  // Toggle all filtered cards
  const handleToggleSelectAll = () => {
    const allFilteredSelected = filteredGroups.length > 0 && filteredGroups.every(g => selectedKeys.has(g.key));
    if (allFilteredSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredGroups.map(g => g.key)));
    }
  };

  // Prompt delete for selected cards
  const handlePromptDeleteSelected = () => {
    if (selectedKeys.size === 0) return;
    setPendingDeleteKeys(Array.from(selectedKeys));
    setShowConfirmModal(true);
  };

  // Prompt delete for a single card directly
  const handlePromptDeleteSingle = (groupKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteKeys([groupKey]);
    setShowConfirmModal(true);
  };

  // Confirm and execute deletion
  const handleConfirmDelete = async () => {
    if (!onDeleteSubjectGroups || pendingDeleteKeys.length === 0) return;
    try {
      setIsDeleting(true);
      await onDeleteSubjectGroups(pendingDeleteKeys);
      // Clean selection
      setSelectedKeys(prev => {
        const next = new Set(prev);
        pendingDeleteKeys.forEach(k => next.delete(k));
        return next;
      });
      if (selectedKeys.size <= pendingDeleteKeys.length) {
        setIsSelectionMode(false);
      }
      setShowConfirmModal(false);
      setPendingDeleteKeys([]);
    } catch (err) {
      console.error("Error deleting subjects:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const allFilteredSelected = filteredGroups.length > 0 && filteredGroups.every(g => selectedKeys.has(g.key));
  const groupsToDisplayInModal = subjectGroups.filter(g => pendingDeleteKeys.includes(g.key));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-24"
    >
      {/* Header Banner */}
      <div className="card pp p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg adm">
                Plan de Estudios
              </span>
              <span className="text-[#A38F79]">•</span>
              <span className="text-xs font-semibold text-[#6E655F]">
                Docente: <strong className="text-[#2B2623]">{teacherName}</strong>
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-[#2B2623] tracking-tight">
              Mis Asignaturas
            </h2>
            <p className="sub mt-1 max-w-xl">
              Selecciona una materia para acceder a sus secciones, planillas de notas y nómina de estudiantes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#E5DCD0]">
          <div className="card sti p-3 bg-white">
            <span className="text-[10px] font-bold text-[#6E655F] uppercase block tracking-wider">
              Materias
            </span>
            <strong className="font-display text-lg font-black text-[#2B2623]">
              {subjectGroups.length}
            </strong>
          </div>
          <div className="card sti p-3 bg-white">
            <span className="text-[10px] font-bold text-[#6E655F] uppercase block tracking-wider">
              Secciones
            </span>
            <strong className="font-display text-lg font-black text-[#D97706]">
              {totalSections}
            </strong>
          </div>
          <div className="card sti p-3 bg-white">
            <span className="text-[10px] font-bold text-[#6E655F] uppercase block tracking-wider">
              Estudiantes
            </span>
            <strong className="font-display text-lg font-black text-[#2B2623]">
              {totalStudents}
            </strong>
          </div>
          <div className="card sti p-3 bg-white">
            <span className="text-[10px] font-bold text-[#6E655F] uppercase block tracking-wider">
              Promedio
            </span>
            <strong className="font-display text-lg font-black text-[#15803D]">
              {overallAvg} / 20
            </strong>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar when selection mode or items selected */}
      {(isSelectionMode || selectedKeys.size > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-4 z-20"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                allFilteredSelected 
                  ? "bg-blue-600 border-blue-600 text-white" 
                  : "border-slate-400 bg-transparent"
              }`}>
                {allFilteredSelected && <Check className="w-3 h-3" />}
              </div>
              <span>
                {allFilteredSelected ? "Deseleccionar todas" : "Seleccionar todas"}
              </span>
            </button>

            <span className="text-xs font-semibold text-slate-300">
              <strong className="text-white font-bold">{selectedKeys.size}</strong> {selectedKeys.size === 1 ? "materia seleccionada" : "materias seleccionadas"}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedKeys(new Set());
                setIsSelectionMode(false);
              }}
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={selectedKeys.size === 0}
              onClick={handlePromptDeleteSelected}
              className={`font-bold text-xs tracking-wider uppercase px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                selectedKeys.size > 0
                  ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar seleccionadas ({selectedKeys.size})</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por materia, año o departamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-blue-600 focus:bg-white transition"
          />
        </div>

        {/* Action buttons in a single row on mobile */}
        <div className="flex flex-row items-center gap-2 w-full sm:w-auto shrink-0">
          {subjectGroups.length > 0 && onDeleteSubjectGroups && (
            <button
              type="button"
              onClick={() => {
                if (isSelectionMode) {
                  setIsSelectionMode(false);
                  setSelectedKeys(new Set());
                } else {
                  setIsSelectionMode(true);
                }
              }}
              className={`btn s text-xs flex-1 sm:flex-initial py-2 px-3 ${isSelectionMode ? "bg-[#3E2514] text-white" : ""}`}
              title={isSelectionMode ? "Salir del modo de selección" : "Activar modo para seleccionar y eliminar materias"}
            >
              <CheckSquare className="w-4 h-4 text-[#D97706]" />
              <span>{isSelectionMode ? "Cancelar" : "Seleccionar"}</span>
            </button>
          )}

          <button
            onClick={onOpenAddClass}
            className="btn text-xs flex-1 sm:flex-initial py-2 px-3"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            <span>Nueva Materia</span>
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <span className="text-xs font-bold text-slate-500">
          Mostrando {filteredGroups.length} de {subjectGroups.length} {subjectGroups.length === 1 ? "materia" : "materias"}
        </span>
      </div>

      {/* Subjects Grid */}
      {filteredGroups.length > 0 ? (
        <div className="g">
          {filteredGroups.map((group) => {
            const isSelectionModeActive = isSelectionMode && selectedKeys.has(group.key);
            return (
              <SubjectCardItem
                key={group.key}
                group={group}
                isSelectionMode={isSelectionMode}
                isSelectionModeActive={isSelectionModeActive}
                onToggleSelect={handleToggleSelect}
                onSelectSubject={onSelectSubject}
                onSelectSection={onSelectSection}
              />
            );
          })}

          {/* Add Subject Card */}
          {onOpenAddClass && (
            <div
              onClick={onOpenAddClass}
              className="add"
              role="button"
              tabIndex={0}
              aria-label="Registrar nueva materia"
            >
              <Plus className="w-7 h-7 mx-auto text-[#D97706]" />
              <span className="font-display text-base text-[#2B2623]">
                Nueva materia
              </span>
              <span className="text-xs text-[#6E655F] font-normal">
                Añadir asignatura
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">
            {searchQuery ? "No se encontraron materias" : "Sin materias asignadas"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm">
            {searchQuery 
              ? `No hay materias que coincidan con "${searchQuery}".` 
              : "Registra tu primera asignatura para gestionar secciones, estudiantes y cargar calificaciones."}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          ) : (
            <button
              onClick={onOpenAddClass}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase px-5 py-3 rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Asignatura</span>
            </button>
          )}
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
            >
              {/* Header */}
              <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {groupsToDisplayInModal.length === 1
                      ? "¿Eliminar esta materia?"
                      : `¿Eliminar ${groupsToDisplayInModal.length} materias seleccionadas?`}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Esta acción retirará la materia y sus secciones de tu plan docente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isDeleting) {
                      setShowConfirmModal(false);
                      setPendingDeleteKeys([]);
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-rose-100/50 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    {groupsToDisplayInModal.length === 1 ? "Materia que se eliminará:" : "Materias a eliminar:"}
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {groupsToDisplayInModal.map((grp) => {
                      const theme = getSubjectTheme(grp.subjectName);
                      return (
                        <div
                          key={grp.key}
                          className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-slate-900 truncate">
                              {grp.subjectName}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
                              <span className="font-semibold text-slate-700">{grp.gradeYear}</span>
                              <span>•</span>
                              <span>{grp.sections.length} {grp.sections.length === 1 ? "sección" : "secciones"} ({grp.sections.map(s => `Sec. ${s.sectionLetter}`).join(", ")})</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-600 font-mono bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                            {grp.totalStudents} alumnos
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    <strong>Atención:</strong> Se eliminarán las secciones vinculadas y los registros de notas cargados para esta materia.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingDeleteKeys([]);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wider uppercase px-5 py-2.5 rounded-xl transition shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>
                        {groupsToDisplayInModal.length === 1
                          ? "Eliminar Materia"
                          : `Eliminar ${groupsToDisplayInModal.length} Materias`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SubjectCardItem({
  group,
  isSelectionMode,
  isSelectionModeActive,
  onToggleSelect,
  onSelectSubject,
  onSelectSection
}: {
  key?: string;
  group: SubjectGroup;
  isSelectionMode: boolean;
  isSelectionModeActive: boolean;
  onToggleSelect: (key: string, e?: React.MouseEvent) => void;
  onSelectSubject: (key: string) => void;
  onSelectSection: (secId: string, groupKey: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const avgScoreDisplay = group.averageScore > 0 ? group.averageScore.toFixed(1) : "—";
  const avgColor = group.averageScore >= 16 ? "#22C55E" : group.averageScore >= 10 ? "#EAB308" : "#EF4444";
  const studentsCount = group.sections.reduce((acc, s) => acc + (s.students?.length || 0), 0);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelect(group.key);
        } else {
          onSelectSubject(group.key);
        }
      }}
      className={`card sti co p-4 cursor-pointer transition-transform hover:-translate-y-1 ${
        isSelectionModeActive ? "ring-2 ring-blue-600 bg-blue-50" : ""
      }`}
    >
      {/* Students count badge in top right */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#FBF6ED] border border-[#E5DCD0] px-2 py-0.5 rounded-full shadow-sm z-10">
        <Users className="w-3 h-3 text-[#6E655F]" />
        <span className="text-[10px] font-bold text-[#6B4423]">{studentsCount}</span>
      </div>

      {/* Header: Owl and Title */}
      <div className="flex items-start gap-3 mb-3">
        <IluminaOwl width={52} height={56} pose="right" animated={isHovered} />
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg text-[#2B2623] truncate leading-tight">
            {group.subjectName}
          </h2>
          <p className="sub text-xs mt-0.5">
            {group.gradeYear}
          </p>
        </div>
      </div>

      {/* Sections and Stats Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {group.sections.slice(0, 4).map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSection(sec.id, group.key);
              }}
              className="w-7 h-7 rounded-lg bg-slate-100 text-[#2B2623] font-bold text-xs border border-[#E5DCD0] hover:bg-[#D97706] hover:text-white hover:border-[#D97706] transition cursor-pointer"
              title={`Sec. ${sec.sectionLetter}`}
            >
              {sec.sectionLetter}
            </button>
          ))}
          {group.sections.length > 4 && (
            <span className="w-7 h-7 rounded-lg bg-[#EDE9FE] text-[#5B21B6] font-bold text-xs flex items-center justify-center border border-[#C4B5FD]">
              +{group.sections.length - 4}
            </span>
          )}
        </div>

        {/* Average Score */}
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Promedio</span>
          <span className="font-display text-xl font-bold" style={{ color: avgColor }}>
            {avgScoreDisplay}
          </span>
        </div>
      </div>

      {/* Footer: Action */}
      {isSelectionMode ? (
        <div className="flex items-center justify-end pt-2 mt-2 border-t border-[#E5DCD0]/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(group.key);
            }}
            className={`btn s text-xs py-1.5 px-3 ${isSelectionModeActive ? "active" : ""}`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSelectionModeActive ? "Ok" : "Selecc."}</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end pt-2 mt-2 border-t border-[#E5DCD0]/60">
          <div className="flex items-center gap-1 text-[#D97706] font-bold text-[10px] uppercase tracking-wider">
            <span>Gestionar</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  );
}
