import React, { useState, useMemo, useEffect } from "react";
import { ClassSection, Student } from "../types";
import { getWeightedFinalScore } from "../mockData";
import { getStudentRealCedula } from "../lib/adminService";
import {
  PolaroidAvatar,
  WaxSealNumber,
  GemProgressBar,
  PerformanceBadge,
  MedalCounter,
  SpriteObject
} from "./BitacoraBrand";
import {
  Search,
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Edit2,
  Users,
  BookOpen,
  Check,
  ChevronRight,
  Download
} from "lucide-react";

interface ClassOverviewViewProps {
  section: ClassSection;
  allSiblingSections?: ClassSection[];
  teacherName?: string;
  onSwitchSection?: (sectionId: string) => void;
  onBack: () => void;
  onSelectStudent: (studentId: string) => void;
  onAddStudent: (className: string) => void;
  onDeleteStudent?: (studentId: string) => void;
  onSaveStudentGrades?: (studentId: string, updatedGrades: any) => void;
  onSaveStudentsGradesBatch?: (entries: Array<{ studentId: string; grades: any }>) => void;
  onPendingChangesChange?: (hasChanges: boolean, saveFn: () => void) => void;
  onUpdateSubjectEvaluations?: (subjectName: string, gradeYear: string, updatedLapsoContent: any) => void;
}

type FilterType = "TODOS" | "APROBADOS" | "APLAZADOS" | "PENDIENTES";

export default function ClassOverviewView({
  section,
  allSiblingSections = [],
  teacherName,
  onSwitchSection,
  onBack,
  onSelectStudent,
  onAddStudent,
  onDeleteStudent,
  onSaveStudentGrades,
  onSaveStudentsGradesBatch,
  onPendingChangesChange,
  onUpdateSubjectEvaluations
}: ClassOverviewViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("TODOS");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Local student grades state for buffering changes without immediate DB saves on every slider move
  const [localStudents, setLocalStudents] = useState<Student[]>(() => [...(section.students || [])]);
  const [modifiedStudentIds, setModifiedStudentIds] = useState<Set<string>>(new Set());

  // Handle Excel download using template with ExcelJS to preserve 100% styles and asistencia sheets
  const handleDownloadExcel = async () => {
    try {
      const response = await fetch('/csv/HOJAS DE ACTUACIÓN -ASISTENCIA 2026-27.xlsx');
      if (!response.ok) {
        throw new Error('No se pudo cargar la plantilla Excel');
      }
      const arrayBuffer = await response.arrayBuffer();
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const sheetNameUpper = `AVANCE ${section.sectionLetter.toUpperCase()}`;
      const sheetNameTitle = `Avance ${section.sectionLetter.toUpperCase()}`;
      const ws = workbook.worksheets.find(w => w.name.toUpperCase() === sheetNameUpper || w.name.toUpperCase() === sheetNameTitle.toUpperCase()) || workbook.worksheets[0];

      if (!ws) {
        alert(`No se encontró la hoja correspondiente a la sección ${section.sectionLetter}`);
        return;
      }

      // 1. Set B6: Subject name & grade year
      ws.getCell('B6').value = `${section.subjectName} · ${section.gradeYear}`;

      // 2. Set B9: Teacher name
      ws.getCell('B9').value = teacherName ? `Prof. ${teacherName}` : "Prof. Titular";

      // 3. Set Evaluation Names in row 4 (C4, E4, G4, I4, K4)
      ws.getCell('C4').value = lapsoData.academic.homework?.name || 'Evaluación 1';
      ws.getCell('E4').value = lapsoData.academic.talentShow?.name || 'Evaluación 2';
      ws.getCell('G4').value = lapsoData.academic.assembly?.name || 'Evaluación 3';
      ws.getCell('I4').value = lapsoData.academic.essay?.name || 'Evaluación 4';
      ws.getCell('K4').value = lapsoData.academic.performance?.name || 'Evaluación 5';

      // 4. Set percentages in row 11 (D11, F11, H11, J11, L11)
      const academicEvals = [
        lapsoData.academic.homework,
        lapsoData.academic.talentShow,
        lapsoData.academic.assembly,
        lapsoData.academic.essay,
        lapsoData.academic.performance
      ];

      const weightCells = ['D11', 'F11', 'H11', 'J11', 'L11'];
      academicEvals.forEach((ev, idx) => {
        if (idx < weightCells.length && ev) {
          ws.getCell(weightCells[idx]).value = ev.weight;
        }
      });

      // 5. Use students in original registration order
      const sortedStudents = [...localStudents];

      // 6. Fill student names, academic scores, and ethical grades starting at row 12
      sortedStudents.forEach((std, idx) => {
        const rowNum = 12 + idx;
        const fullName = `${std.firstName} ${std.lastName}`.toUpperCase();

        ws.getCell(`B${rowNum}`).value = fullName;

        const stdLapso = std.grades?.[activeLapsoNum] || std.grades?.[1] || lapsoData;
        const scores = [
          stdLapso.academic?.homework?.score,
          stdLapso.academic?.talentShow?.score,
          stdLapso.academic?.assembly?.score,
          stdLapso.academic?.essay?.score,
          stdLapso.academic?.performance?.score
        ];

        const scoreCols = ['C', 'E', 'G', 'I', 'K'];
        scores.forEach((sc, sIdx) => {
          if (sIdx < scoreCols.length && sc !== undefined && sc !== null && sc !== '') {
            ws.getCell(`${scoreCols[sIdx]}${rowNum}`).value = Number(sc);
          }
        });

        // Ethical scores (Q for Responsabilidad, R for Ajuste Social)
        const respScore = stdLapso.ethical?.responsibility?.score;
        if (respScore !== undefined && respScore !== null && respScore !== '') {
          ws.getCell(`Q${rowNum}`).value = Number(respScore);
        }

        const pcScore = stdLapso.ethical?.personalCare?.score;
        if (pcScore !== undefined && pcScore !== null && pcScore !== '') {
          ws.getCell(`R${rowNum}`).value = Number(pcScore);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'HOJAS DE ACTUACIÓN -ASISTENCIA 2026-27.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading excel:', err);
      alert('Hubo un error al rellenar el archivo Excel. Por favor intenta de nuevo.');
    }
  };

  useEffect(() => {
    setLocalStudents([...(section.students || [])]);
    setModifiedStudentIds(new Set());
  }, [section.id, section.students]);

  const saveAllPendingChanges = () => {
    const hasPending = modifiedStudentIds.size > 0;
    const hasBatchHandler = typeof onSaveStudentsGradesBatch === "function";
    const hasSingleHandler = typeof onSaveStudentGrades === "function";

    if (!hasPending || (!hasBatchHandler && !hasSingleHandler)) return;

    if (hasBatchHandler) {
      const entries: Array<{ studentId: string; grades: any }> = [];
      modifiedStudentIds.forEach(stdId => {
        const std = localStudents.find(s => s.id === stdId);
        if (std) {
          entries.push({ studentId: stdId, grades: std.grades });
        }
      });
      // ONE DB round-trip + ONE toast for the whole batch
      onSaveStudentsGradesBatch!(entries);
    } else if (hasSingleHandler) {
      modifiedStudentIds.forEach(stdId => {
        const std = localStudents.find(s => s.id === stdId);
        if (std) {
          onSaveStudentGrades!(stdId, std.grades);
        }
      });
    }

    setModifiedStudentIds(new Set());
    if (onPendingChangesChange) {
      onPendingChangesChange(false, () => {});
    }
  };

  useEffect(() => {
    if (onPendingChangesChange) {
      onPendingChangesChange(modifiedStudentIds.size > 0, saveAllPendingChanges);
    }
  }, [modifiedStudentIds, localStudents]);

  useEffect(() => {
    return () => {
      if (onPendingChangesChange) {
        onPendingChangesChange(false, () => {});
      }
    };
  }, []);

  const handleSafeBack = () => {
    saveAllPendingChanges();
    onBack();
  };

  const handleSafeSwitchSection = (sibId: string) => {
    saveAllPendingChanges();
    if (onSwitchSection) onSwitchSection(sibId);
  };

  const handleSafeSelectStudent = (stdId: string) => {
    saveAllPendingChanges();
    onSelectStudent(stdId);
  };

  // New states for evaluations view and batch grading
  const [activeViewMode, setActiveViewMode] = useState<"students" | "evaluations">("students");
  const [selectedEvaluationKey, setSelectedEvaluationKey] = useState<string | null>(null);
  const [editingEvalKey, setEditingEvalKey] = useState<string | null>(null);
  const [editEvalName, setEditEvalName] = useState("");
  const [editEvalWeight, setEditEvalWeight] = useState(20);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [section.id, activeViewMode, selectedEvaluationKey]);

  const activeLapsoNum = (section.lapso || 1) as 1 | 2 | 3;
  const sampleStudent = localStudents?.[0];
  const defaultLapso = {
    academic: {
      homework: { id: "hw", name: "Hoja de tarea", weight: 20, description: "" },
      talentShow: { id: "ts", name: "Muestra de talentos", weight: 20, description: "" },
      assembly: { id: "asm", name: "Montaje", weight: 20, description: "" },
      essay: { id: "esy", name: "Ensayo", weight: 20, description: "" },
      performance: { id: "prf", name: "Puesta en escena", weight: 10, description: "" },
    },
    ethical: {
      responsibility: { id: "resp", name: "Responsabilidad", weight: 5, description: "" },
      personalCare: { id: "pc", name: "Presentación Personal", weight: 5, description: "" },
    }
  };
  const sampleGrades = sampleStudent?.grades?.[activeLapsoNum] || sampleStudent?.grades?.[1];
  const lapsoData = {
    academic: {
      homework: sampleGrades?.academic?.homework || defaultLapso.academic.homework,
      talentShow: sampleGrades?.academic?.talentShow || defaultLapso.academic.talentShow,
      assembly: sampleGrades?.academic?.assembly || defaultLapso.academic.assembly,
      essay: sampleGrades?.academic?.essay || defaultLapso.academic.essay,
      performance: sampleGrades?.academic?.performance || defaultLapso.academic.performance,
    },
    ethical: {
      responsibility: sampleGrades?.ethical?.responsibility || defaultLapso.ethical.responsibility,
      personalCare: sampleGrades?.ethical?.personalCare || defaultLapso.ethical.personalCare,
    }
  };

  const evaluationItems = [
    { key: "homework", category: "Académica", ...lapsoData.academic.homework },
    { key: "talentShow", category: "Académica", ...lapsoData.academic.talentShow },
    { key: "assembly", category: "Académica", ...lapsoData.academic.assembly },
    { key: "essay", category: "Académica", ...lapsoData.academic.essay },
    { key: "performance", category: "Académica", ...lapsoData.academic.performance },
    { key: "responsibility", category: "Ética", ...lapsoData.ethical.responsibility },
    { key: "personalCare", category: "Ética", ...lapsoData.ethical.personalCare },
  ];

  const selectedEvaluationItem = evaluationItems.find(e => e.key === selectedEvaluationKey);

  const handleUpdateEvaluationMeta = (evalKey: string, newName: string, newWeight: number) => {
    let updatedLapso = JSON.parse(JSON.stringify(lapsoData));

    if (updatedLapso.academic && updatedLapso.academic[evalKey]) {
      updatedLapso.academic[evalKey].name = newName;
      updatedLapso.academic[evalKey].weight = newWeight;
    } else if (updatedLapso.ethical && updatedLapso.ethical[evalKey]) {
      updatedLapso.ethical[evalKey].name = newName;
      updatedLapso.ethical[evalKey].weight = newWeight;
    }

    if (onUpdateSubjectEvaluations) {
      onUpdateSubjectEvaluations(section.subjectName, section.gradeYear, updatedLapso);
    }

    setLocalStudents(prev => prev.map(std => {
      const currentStdGrades = std.grades || {};
      const newGrades = {
        1: currentStdGrades[1] ? JSON.parse(JSON.stringify(currentStdGrades[1])) : JSON.parse(JSON.stringify(updatedLapso)),
        2: currentStdGrades[2] ? JSON.parse(JSON.stringify(currentStdGrades[2])) : JSON.parse(JSON.stringify(updatedLapso)),
        3: currentStdGrades[3] ? JSON.parse(JSON.stringify(currentStdGrades[3])) : JSON.parse(JSON.stringify(updatedLapso)),
        [activeLapsoNum]: updatedLapso
      };

      return {
        ...std,
        grades: newGrades
      };
    }));

    setEditingEvalKey(null);
  };

  const handleUpdateStudentEvalScore = (stdId: string, evalKey: string, scoreVal: string) => {
    const std = localStudents.find(s => s.id === stdId);
    if (!std) return;

    const currentStdGrades = std.grades || {};
    const currentLapso = currentStdGrades[activeLapsoNum] || currentStdGrades[1] || lapsoData;

    const numScore = scoreVal.trim() === "" ? undefined : Math.min(20, Math.max(0, parseFloat(scoreVal.replace(",", "."))));

    let updatedLapso = JSON.parse(JSON.stringify(currentLapso));
    if (updatedLapso.academic && updatedLapso.academic[evalKey]) {
      updatedLapso.academic[evalKey].score = numScore;
    } else if (updatedLapso.ethical && updatedLapso.ethical[evalKey]) {
      updatedLapso.ethical[evalKey].score = numScore;
    }

    const newGrades = {
      1: currentStdGrades[1] ? JSON.parse(JSON.stringify(currentStdGrades[1])) : JSON.parse(JSON.stringify(updatedLapso)),
      2: currentStdGrades[2] ? JSON.parse(JSON.stringify(currentStdGrades[2])) : JSON.parse(JSON.stringify(updatedLapso)),
      3: currentStdGrades[3] ? JSON.parse(JSON.stringify(currentStdGrades[3])) : JSON.parse(JSON.stringify(updatedLapso)),
      [activeLapsoNum]: updatedLapso
    };

    setLocalStudents(prev => prev.map(s => s.id === stdId ? { ...s, grades: newGrades } : s));
    setModifiedStudentIds(prev => new Set(prev).add(stdId));
  };

  // Compute final score for each student based on active lapso
  const studentsWithScores = useMemo(() => {
    const sorted = [...localStudents];
    return sorted.map((std, idx) => ({
      ...std,
      listNumber: idx + 1,
      finalScore: getWeightedFinalScore(std.grades, (section.lapso || 1) as 1 | 2 | 3)
    }));
  }, [localStudents, section.lapso]);

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
        onClick={handleSafeBack}
        className="chip group"
        title="Volver a la lista de materias"
      >
        <ArrowLeft className="w-4 h-4 text-[#D97706] group-hover:-translate-x-1 transition-transform" />
        <span>Clases</span>
      </button>

      {/* Top Heading Row with Evaluations / Students Toggle & Add Students */}
      <div className="row justify-between items-start gap-4">
        <div>
          <span className="bg adm mb-2">
            {section.department || "Materia Principal"}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-[#2B2623]">
            {section.subjectName} · {section.gradeYear}
          </h1>
          <p className="sub">
            Sección {section.sectionLetter} · {localStudents.length} estudiantes en nómina • Lapso {activeLapsoNum}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">

          {/* Button with open book icon */}
          <button
            onClick={() => {
              setActiveViewMode(activeViewMode === "students" ? "evaluations" : "students");
              setSelectedEvaluationKey(null);
            }}
            className={`btn s flex items-center gap-2 ${activeViewMode === "evaluations" ? "!bg-[#D97706] text-white !border-[#B45309]" : ""}`}
            title={activeViewMode === "students" ? "Ver evaluaciones de la materia" : "Ver lista de alumnos"}
          >
            <BookOpen className={`w-4 h-4 ${activeViewMode === "evaluations" ? "text-white" : "text-[#D97706]"}`} />
            <span>{activeViewMode === "students" ? "Evaluaciones" : "Alumnos"}</span>
          </button>

          {/* Download Excel Template Button */}
          <button
            onClick={handleDownloadExcel}
            className="btn s flex items-center gap-2"
            title="Descargar hoja de actuación y notas en plantilla Excel"
          >
            <Download className="w-4 h-4 text-[#D97706]" />
            <span>Descargar Hoja</span>
          </button>

          {section.isDefault === false && (
            <button
              onClick={() => onAddStudent(`${section.gradeYear} • ${section.subjectName}`)}
              className="btn full-m"
            >
              <Plus className="w-5 h-5 text-[#2B2623]" />
              <span>Agregar alumnos</span>
            </button>
          )}
        </div>
      </div>

      {/* Section Switcher Chips */}
      {siblingSectionsSorted.length > 1 && (
        <div className="row gap-2 my-2">
          {siblingSectionsSorted.map((sib) => {
            const isCurrent = sib.id === section.id;
            return (
              <button
                key={sib.id}
                onClick={() => handleSafeSwitchSection(sib.id)}
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

      {/* CONDITIONAL VIEWS: Students vs Evaluations vs Batch Grading */}
      {activeViewMode === "evaluations" ? (
        selectedEvaluationKey && selectedEvaluationItem ? (
          /* BATCH GRADING VIEW FOR SELECTED EVALUATION */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedEvaluationKey(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                  title="Volver a lista de evaluaciones"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                    Evaluación {selectedEvaluationItem.category} • Ponderación: {selectedEvaluationItem.weight}%
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {selectedEvaluationItem.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Modifica la nota (0 a 20) para cada alumno de la Sección {section.sectionLetter}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl">
                {localStudents.length} Estudiantes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {localStudents.map((std, idx) => {
                const lapsoData = std.grades?.[activeLapsoNum] || std.grades?.[1];
                const currentScore = lapsoData?.academic?.[selectedEvaluationKey]?.score ?? lapsoData?.ethical?.[selectedEvaluationKey]?.score ?? "";
                const scoreNum = typeof currentScore === "number" ? currentScore : (currentScore !== "" ? parseFloat(currentScore) || 0 : 0);
                const scorePercent = (scoreNum / 20) * 100;
                const barColor = scoreNum >= 16 ? "#22C55E" : scoreNum >= 10 ? "#EAB308" : scoreNum > 0 ? "#EF4444" : "#E5DCD0";

                return (
                  <div key={std.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <PolaroidAvatar avatarUrl={std.avatarUrl} alt={`${std.firstName} ${std.lastName}`} size={46} />
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-slate-400 font-bold block">N.° {idx + 1}</span>
                          <h4 className="font-display text-sm text-slate-900 truncate">
                            {std.firstName} {std.lastName}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-mono truncate">
                            {(() => {
                              const realC = getStudentRealCedula(std);
                              return realC ? (realC.startsWith("V-") || realC.startsWith("E-") ? realC : `C.I. ${realC}`) : "C.I. Pendiente";
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            placeholder="—"
                            value={currentScore}
                            onChange={(e) => handleUpdateStudentEvalScore(std.id, selectedEvaluationKey, e.target.value)}
                            className="w-16 text-center text-sm font-black py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 font-mono"
                          />
                          <span className="text-xs text-slate-400 font-bold">/20</span>
                        </div>
                      </div>
                    </div>

                    {/* Gem Progress Bar for this evaluation */}
                    <GemProgressBar
                      percent={scoreNum > 0 ? scorePercent : 0}
                      barColor={barColor}
                      onChangeScore={(newScore) => handleUpdateStudentEvalScore(std.id, selectedEvaluationKey, newScore.toString())}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* EVALUATIONS GRID VIEW */
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Evaluaciones del Lapso {activeLapsoNum} ({evaluationItems.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona una evaluación (como "Hoja de tarea") para consultar y modificar las notas de todos los alumnos de la sección:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evaluationItems.map((ev) => {
                let sum = 0;
                let count = 0;
                localStudents?.forEach(std => {
                  const lapsoData = std.grades?.[activeLapsoNum] || std.grades?.[1];
                  const sc = lapsoData?.academic?.[ev.key]?.score ?? lapsoData?.ethical?.[ev.key]?.score;
                  if (sc !== undefined && sc > 0) {
                    sum += sc;
                    count += 1;
                  }
                });
                const avgEv = count > 0 ? (sum / count).toFixed(1) : "—";

                return (
                  <div
                    key={ev.key}
                    onClick={() => {
                      if (editingEvalKey !== ev.key) setSelectedEvaluationKey(ev.key);
                    }}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group relative"
                  >
                    {editingEvalKey === ev.key ? (
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-600 uppercase">Editar evaluación</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{ev.category}</span>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nombre</label>
                          <input
                            type="text"
                            value={editEvalName}
                            onChange={(e) => setEditEvalName(e.target.value)}
                            className="w-full text-sm font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-amber-600"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ponderación (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editEvalWeight}
                            onChange={(e) => setEditEvalWeight(parseInt(e.target.value) || 0)}
                            className="w-full text-sm font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-amber-600"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => setEditingEvalKey(null)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleUpdateEvaluationMeta(ev.key, editEvalName, editEvalWeight)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Guardar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                              ev.category === "Académica"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}>
                              {ev.category} • {ev.weight}%
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingEvalKey(ev.key);
                                  setEditEvalName(ev.name);
                                  setEditEvalWeight(ev.weight);
                                }}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                                title="Editar nombre y ponderación"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg">
                                Prom: {avgEv}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-display text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
                            {ev.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {ev.description || "Criterio de evaluación configurado para este lapso."}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-600">
                            Calificar sección
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        /* STUDENTS LIST VIEW (Default) */
        <div className="space-y-6">
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
              {!searchQuery && section.isDefault === false && (
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
                          {(() => {
                            const realC = getStudentRealCedula(std);
                            return realC ? (realC.startsWith("V-") || realC.startsWith("E-") ? realC : `C.I. ${realC}`) : "C.I. Pendiente";
                          })()}
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
                        onClick={() => handleSafeSelectStudent(std.id)}
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
      )}
    </div>
  );
}
