import React, { useState, useEffect, useMemo } from "react";
import { Student } from "../types";
import { getWeightedFinalScore } from "../mockData";
import {
  IluminaOwl,
  PolaroidAvatar,
  GemProgressBar,
  PerformanceBadge
} from "./BitacoraBrand";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Save,
  CheckCircle2,
  Edit2
} from "lucide-react";

interface CustomCriteriaNames {
  homework: string;
  talentShow: string;
  assembly: string;
  essay: string;
  performance: string;
}

interface GradingViewProps {
  key?: React.Key;
  student: Student;
  className: string;
  onBack: () => void;
  onSave: (studentId: string, updatedGrades: Student["grades"]) => void;
  activeLapso?: 1 | 2 | 3;
  calendarCurrentLapso?: 1 | 2 | 3;
  onSelectLapso?: (lapso: 1 | 2 | 3) => void;
  onSyncCurrentLapso?: () => void;
  termProgressPercent?: number;
  termStartDate?: string;
  termEndDate?: string;
  todayDate?: string;
}

type AcademicKey = "homework" | "talentShow" | "assembly" | "essay" | "performance";
type EthicalKey = "responsibility" | "personalCare";

export default function GradingView({
  student,
  className,
  onBack,
  onSave,
  activeLapso = 1,
  calendarCurrentLapso,
  onSelectLapso,
  onSyncCurrentLapso,
  termProgressPercent,
  termStartDate,
  termEndDate,
  todayDate
}: GradingViewProps) {
  const lapsoData = student.grades[activeLapso] || student.grades[1] || {
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

  // Local score states for active lapso
  const [hwScore, setHwScore] = useState<string>(lapsoData.academic?.homework?.score?.toString() ?? "");
  const [talentScore, setTalentScore] = useState<string>(lapsoData.academic?.talentShow?.score?.toString() ?? "");
  const [assemblyScore, setAssemblyScore] = useState<string>(lapsoData.academic?.assembly?.score?.toString() ?? "");
  const [essayScore, setEssayScore] = useState<string>(lapsoData.academic?.essay?.score?.toString() ?? "");
  const [performanceScore, setPerformanceScore] = useState<string>(lapsoData.academic?.performance?.score?.toString() ?? "");

  const [responsibilityScore, setResponsibilityScore] = useState<string>(lapsoData.ethical?.responsibility?.score?.toString() ?? "");
  const [personalCareScore, setPersonalCareScore] = useState<string>(lapsoData.ethical?.personalCare?.score?.toString() ?? "");

  // Update local score states whenever activeLapso or student changes
  useEffect(() => {
    const cur = student.grades[activeLapso] || student.grades[1];
    setHwScore(cur?.academic?.homework?.score?.toString() ?? "");
    setTalentScore(cur?.academic?.talentShow?.score?.toString() ?? "");
    setAssemblyScore(cur?.academic?.assembly?.score?.toString() ?? "");
    setEssayScore(cur?.academic?.essay?.score?.toString() ?? "");
    setPerformanceScore(cur?.academic?.performance?.score?.toString() ?? "");
    setResponsibilityScore(cur?.ethical?.responsibility?.score?.toString() ?? "");
    setPersonalCareScore(cur?.ethical?.personalCare?.score?.toString() ?? "");
  }, [activeLapso, student]);

  // Local criteria name states
  const [hwName, setHwName] = useState<string>(lapsoData.academic?.homework?.name ?? "Hoja de trabajo");
  const [talentName, setTalentName] = useState<string>(lapsoData.academic?.talentShow?.name ?? "Muestra de talentos");
  const [assemblyName, setAssemblyName] = useState<string>(lapsoData.academic?.assembly?.name ?? "Montaje");
  const [essayName, setEssayName] = useState<string>(lapsoData.academic?.essay?.name ?? "Ensayo");
  const [performanceName, setPerformanceName] = useState<string>(lapsoData.academic?.performance?.name ?? "Puesta en escena");

  // Local criteria weight states (for editing)
  const [hwWeight, setHwWeight] = useState<number>(lapsoData.academic?.homework?.weight ?? 20);
  const [talentWeight, setTalentWeight] = useState<number>(lapsoData.academic?.talentShow?.weight ?? 20);
  const [assemblyWeight, setAssemblyWeight] = useState<number>(lapsoData.academic?.assembly?.weight ?? 20);
  const [essayWeight, setEssayWeight] = useState<number>(lapsoData.academic?.essay?.weight ?? 20);
  const [performanceWeight, setPerformanceWeight] = useState<number>(lapsoData.academic?.performance?.weight ?? 10);
  const [responsibilityWeight, setResponsibilityWeight] = useState<number>(lapsoData.ethical?.responsibility?.weight ?? 5);
  const [personalCareWeight, setPersonalCareWeight] = useState<number>(lapsoData.ethical?.personalCare?.weight ?? 5);

  const [hasSaved, setHasSaved] = useState(false);
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [isEditingWeights, setIsEditingWeights] = useState(false);

  // Parse numerical scores
  const parseNum = (val: string): number | undefined => {
    if (!val || val.trim() === "") return undefined;
    const n = parseFloat(val.replace(",", "."));
    if (isNaN(n)) return undefined;
    return Math.min(20, Math.max(0, Number(n.toFixed(1))));
  };

  // Reconstruct temporary grades for real-time calculation and saving
  const currentGrades = useMemo((): Student["grades"] => {
    const updatedLapsoContent = {
      academic: {
        homework: {
          id: lapsoData.academic?.homework?.id || "homework",
          name: hwName,
          description: lapsoData.academic?.homework?.description || "Comprensión conceptual y precisión.",
          weight: hwWeight,
          score: parseNum(hwScore)
        },
        talentShow: {
          id: lapsoData.academic?.talentShow?.id || "talentShow",
          name: talentName,
          description: lapsoData.academic?.talentShow?.description || "Demostración práctica de habilidades.",
          weight: talentWeight,
          score: parseNum(talentScore)
        },
        assembly: {
          id: lapsoData.academic?.assembly?.id || "assembly",
          name: assemblyName,
          description: lapsoData.academic?.assembly?.description || "Estructura y coherencia del proyecto.",
          weight: assemblyWeight,
          score: parseNum(assemblyScore)
        },
        essay: {
          id: lapsoData.academic?.essay?.id || "essay",
          name: essayName,
          description: lapsoData.academic?.essay?.description || "Calidad y síntesis escrita.",
          weight: essayWeight,
          score: parseNum(essayScore)
        },
        performance: {
          id: lapsoData.academic?.performance?.id || "performance",
          name: performanceName,
          description: lapsoData.academic?.performance?.description || "Presentación final y expresión.",
          weight: performanceWeight,
          score: parseNum(performanceScore)
        }
      },
      ethical: {
        responsibility: {
          id: lapsoData.ethical?.responsibility?.id || "responsibility",
          name: lapsoData.ethical?.responsibility?.name || "Responsabilidad",
          description: lapsoData.ethical?.responsibility?.description || "Entrega a tiempo y compromiso.",
          weight: responsibilityWeight,
          score: parseNum(responsibilityScore)
        },
        personalCare: {
          id: lapsoData.ethical?.personalCare?.id || "personalCare",
          name: lapsoData.ethical?.personalCare?.name || "Presentación",
          description: lapsoData.ethical?.personalCare?.description || "Cumplimiento del orden y presentación.",
          weight: personalCareWeight,
          score: parseNum(personalCareScore)
        }
      }
    };

    return {
      1: student.grades[1] ? JSON.parse(JSON.stringify(student.grades[1])) : JSON.parse(JSON.stringify(updatedLapsoContent)),
      2: student.grades[2] ? JSON.parse(JSON.stringify(student.grades[2])) : JSON.parse(JSON.stringify(updatedLapsoContent)),
      3: student.grades[3] ? JSON.parse(JSON.stringify(student.grades[3])) : JSON.parse(JSON.stringify(updatedLapsoContent)),
      [activeLapso]: updatedLapsoContent
    };
  }, [hwScore, talentScore, assemblyScore, essayScore, performanceScore, responsibilityScore, personalCareScore, hwName, talentName, assemblyName, essayName, performanceName, hwWeight, talentWeight, assemblyWeight, essayWeight, performanceWeight, responsibilityWeight, personalCareWeight, student.grades, activeLapso]);

  const finalScore = useMemo(() => {
    return getWeightedFinalScore(currentGrades, activeLapso);
  }, [currentGrades, activeLapso]);

  const totalWeight = useMemo(() => {
    return (
      (Number(hwWeight) || 0) +
      (Number(talentWeight) || 0) +
      (Number(assemblyWeight) || 0) +
      (Number(essayWeight) || 0) +
      (Number(performanceWeight) || 0)
    );
  }, [hwWeight, talentWeight, assemblyWeight, essayWeight, performanceWeight]);

  const finalColor = finalScore >= 16 ? "#15803D" : finalScore >= 10 ? "#854D0E" : "#B91C1C";
  const finalBorder = finalScore >= 16 ? "#15803D" : finalScore >= 10 ? "#EAB308" : "#EF4444";

  // Render functions for editable criterion labels
  const renderEditableLabel = (item: typeof academicList[0], isEditing: boolean) => {
    if (!isEditing) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm sm:text-base text-[#2B2623] cursor-pointer" onClick={() => setIsEditingNames(true)}>
            {item.label}
          </span>
          <button
            type="button"
            onClick={() => setIsEditingNames(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#E5DCD0] rounded"
            title="Editar nombre"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#6E655F]" />
          </button>
        </div>
      );
    }

    // Edit mode
    const getNameSetter = () => {
      switch (item.key) {
        case "homework": return setHwName;
        case "talentShow": return setTalentName;
        case "assembly": return setAssemblyName;
        case "essay": return setEssayName;
        case "performance": return setPerformanceName;
      }
    };

    const setter = getNameSetter();
    const getCurrentValue = () => {
      switch (item.key) {
        case "homework": return hwName;
        case "talentShow": return talentName;
        case "assembly": return assemblyName;
        case "essay": return essayName;
        case "performance": return performanceName;
      }
    };

    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={getCurrentValue()}
          onChange={(e) => setter(e.target.value)}
          className="font-semibold text-sm sm:text-base text-[#2B2623] bg-white border-b-2 border-[#D97706] px-1 py-0.5 focus:outline-none focus:bg-[#FFF8E6] w-32 sm:w-40"
          autoFocus
        />
      </div>
    );
  };

  // Render function for editable weights
  const renderEditableWeight = (item: any, isEditing: boolean) => {
    const getWeightValue = () => {
      switch (item.key) {
        case "homework": return hwWeight;
        case "talentShow": return talentWeight;
        case "assembly": return assemblyWeight;
        case "essay": return essayWeight;
        case "performance": return performanceWeight;
        case "responsibility": return responsibilityWeight;
        case "personalCare": return personalCareWeight;
        default: return item.weight;
      }
    };

    const getWeightSetter = () => {
      switch (item.key) {
        case "homework": return setHwWeight;
        case "talentShow": return setTalentWeight;
        case "assembly": return setAssemblyWeight;
        case "essay": return setEssayWeight;
        case "performance": return setPerformanceWeight;
        case "responsibility": return setResponsibilityWeight;
        case "personalCare": return setPersonalCareWeight;
        default: return () => {};
      }
    };

    if (!isEditing) {
      return (
        <span
          className="bg cp font-semibold text-xs py-1 px-3 text-center cursor-pointer hover:bg-[#FDE68A] transition-colors flex items-center gap-1"
          style={{ background: "#FFF8E6", border: "2px solid #E3B866", borderRadius: "9999px" }}
          onClick={() => setIsEditingWeights(true)}
        >
          {item.weight}% de la nota
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1 bg-[#FFF8E6] border-2 border-[#D97706] rounded-full px-2 py-0.5">
        <input
          type="number"
          min="0"
          max="100"
          value={getWeightValue()}
          onChange={(e) => getWeightSetter()(parseInt(e.target.value) || 0)}
          className="w-8 text-center bg-transparent font-bold text-xs focus:outline-none"
          autoFocus
        />
        <span className="text-[10px] font-bold">%</span>
      </div>
    );
  };

  // Exit editing mode when clicking outside or pressing Enter
  const handleLabelBlur = () => {
    setIsEditingNames(false);
  };
  const handleScoreInput = (raw: string, setter: (val: string) => void) => {
    setHasSaved(false);
    if (raw === "") {
      setter("");
      return;
    }
    const clean = raw.replace(",", ".");
    const num = parseFloat(clean);
    if (!isNaN(num)) {
      if (num > 20) setter("20");
      else if (num < 0) setter("0");
      else setter(raw);
    } else {
      setter(raw);
    }
  };

  const handleSaveGrades = () => {
    onSave(student.id, currentGrades);
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 3000);
  };

  const activeLapsoData = currentGrades[activeLapso] || currentGrades[1];
  const academicList: { key: AcademicKey; label: string; weight: number; val: string; setter: (v: string) => void }[] = [
    { key: "homework", label: hwName, weight: hwWeight, val: hwScore, setter: setHwScore },
    { key: "talentShow", label: talentName, weight: talentWeight, val: talentScore, setter: setTalentScore },
    { key: "assembly", label: assemblyName, weight: assemblyWeight, val: assemblyScore, setter: setAssemblyScore },
    { key: "essay", label: essayName, weight: essayWeight, val: essayScore, setter: setEssayScore },
    { key: "performance", label: performanceName, weight: performanceWeight, val: performanceScore, setter: setPerformanceScore }
  ];

  const ethicalList: { key: EthicalKey; label: string; weight: number; val: string; setter: (v: string) => void }[] = [
    { key: "responsibility", label: activeLapsoData.ethical.responsibility.name, weight: responsibilityWeight, val: responsibilityScore, setter: setResponsibilityScore },
    { key: "personalCare", label: activeLapsoData.ethical.personalCare.name, weight: personalCareWeight, val: personalCareScore, setter: setPersonalCareScore }
  ];

  return (
    <div className="space-y-6">
      {/* Back chip */}
      <button 
        onClick={onBack}
        className="chip group"
        title="Volver a la nómina de la sección"
      >
        <ArrowLeft className="w-4 h-4 text-[#D97706] group-hover:-translate-x-1 transition-transform" />
        <span>{className}</span>
      </button>

      {/* Main Stitched Leather & Paper Notebook Sheet */}
      <section className="card sti co overflow-hidden bg-white" style={{ padding: 0 }}>
        {/* Leather top header band */}
        <div 
          className="text-[#F6E7C8] px-6 sm:px-8 py-3.5 font-semibold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-between"
          style={{ background: "linear-gradient(#7A4B2A, #5E3A20)", borderBottom: "2px solid #3E2514" }}
        >
          <span>Planilla de evaluación · Lapso {activeLapso}</span>
          <span className="text-[#F4DFA6] text-xs font-mono lowercase">escala 0 a 20</span>
        </div>

        {/* Student Summary Cream Band */}
        <div 
          className="row pp justify-between items-center gap-6"
          style={{ background: "#FFF8E6", borderBottom: "2px solid #E5DCD0" }}
        >
          <div className="row items-center gap-5 flex-1 min-w-[240px]">
            <PolaroidAvatar 
              avatarUrl={student.avatarUrl}
              alt={`${student.firstName} ${student.lastName}`}
              size={84}
            />

            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-[#2B2623]">
                {student.firstName} {student.lastName}
              </h1>
              <p className="sub my-1.5">
                {student.id.includes("V-") ? student.id : `C.I. ${student.id}`}
              </p>
              <PerformanceBadge score={finalScore > 0 ? finalScore : undefined} />
            </div>
          </div>

          {/* Double bordered final score seal (tilted -4deg) */}
          <div 
            className="shrink-0 text-center"
            style={{
              transform: "rotate(-4deg)",
              border: `4px double ${finalBorder}`,
              borderRadius: "16px",
              padding: "6px 22px",
              background: "#fff",
              boxShadow: "0 2px 0 rgba(0,0,0,0.05)"
            }}
          >
            <span 
              className="font-display text-4xl sm:text-5xl font-bold"
              style={{ color: finalColor }}
            >
              {finalScore > 0 ? finalScore.toFixed(1) : "0.0"}
            </span>
            <span className="text-xs text-[#6E655F] font-sans font-normal ml-1">
              /20
            </span>
          </div>
        </div>

        {/* Criteria Sections */}
        <div className="pp pb-6 space-y-6">
          {/* Academic Criteria */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg sm:text-xl text-[#6B4423]">
                Criterios académicos
              </h2>
              <div className="flex items-center gap-2">
                {(isEditingNames || isEditingWeights) && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    totalWeight === 100 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>
                    Total: {totalWeight}%
                  </span>
                )}
                {isEditingNames || isEditingWeights ? (
                  <button
                    type="button"
                    onClick={() => { setIsEditingNames(false); setIsEditingWeights(false); }}
                    className="chip text-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>Listo</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsEditingNames(true); setIsEditingWeights(true); }}
                    className="chip text-xs flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Editar</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              {academicList.map((item) => {
                const scoreNum = parseNum(item.val);
                const pct = scoreNum !== undefined ? (scoreNum / 20) * 100 : 0;
                const barCol = scoreNum === undefined ? "#E5DCD0" : scoreNum >= 16 ? "#22C55E" : scoreNum >= 10 ? "#EAB308" : "#EF4444";

                return (
                  <div key={item.key} className="cr group">
                    <label
                      className="font-semibold text-sm sm:text-base text-[#2B2623] cursor-pointer"
                    >
                      {renderEditableLabel(item, isEditingNames)}
                    </label>

                    {renderEditableWeight(item, isEditingWeights)}

                    <div className="cb">
                      <GemProgressBar
                        percent={pct}
                        barColor={barCol}
                        onChangeScore={(newScore) => handleScoreInput(newScore.toString(), item.setter)}
                      />
                    </div>

                    <input 
                      id={`input-${item.key}`}
                      type="number"
                      min={0}
                      max={20}
                      step={0.5}
                      value={item.val}
                      placeholder="—"
                      onChange={(e) => handleScoreInput(e.target.value, item.setter)}
                      className="n ci"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ethical Criteria */}
          <div className="pt-2">
            <h2 className="font-display text-lg sm:text-xl text-[#6B4423] mb-3">
              Criterios formativos y éticos · 20%
            </h2>

            <div className="space-y-1">
              {ethicalList.map((item) => {
                const scoreNum = parseNum(item.val);
                const pct = scoreNum !== undefined ? (scoreNum / 20) * 100 : 0;
                const barCol = scoreNum === undefined ? "#E5DCD0" : scoreNum >= 16 ? "#22C55E" : scoreNum >= 10 ? "#EAB308" : "#EF4444";

                return (
                  <div key={item.key} className="cr group">
                    <label
                      htmlFor={`input-${item.key}`}
                      className="font-semibold text-sm sm:text-base text-[#2B2623] cursor-pointer"
                    >
                      {item.label}
                    </label>

                    {renderEditableWeight(item, isEditingWeights)}

                    <div className="cb">
                      <GemProgressBar
                        percent={pct}
                        barColor={barCol}
                        onChangeScore={(newScore) => handleScoreInput(newScore.toString(), item.setter)}
                      />
                    </div>

                    <input 
                      id={`input-${item.key}`}
                      type="number"
                      min={0}
                      max={20}
                      step={0.5}
                      value={item.val}
                      placeholder="—"
                      onChange={(e) => handleScoreInput(e.target.value, item.setter)}
                      className="n ci"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action footer with Owl Mascot & Save Button */}
        <div 
          className="row pp justify-between items-center gap-4"
          style={{ background: "#FAF5EC", borderTop: "2px solid #E5DCD0" }}
        >
          <div className="row items-center gap-3.5 flex-1 min-w-[260px]">
            <IluminaOwl width={46} height={52} />
            <p className="sub text-xs sm:text-sm text-[#6E655F] flex-1">
              Escribe las calificaciones de cada rasgo. El promedio ponderado se calcula al instante.
            </p>
          </div>

          <div className="row items-center gap-3 full-m justify-end">
            {hasSaved && (
              <span className="sync">
                <Check className="w-4 h-4 text-[#15803D]" />
                <span>Notas guardadas</span>
              </span>
            )}

            <button 
              onClick={handleSaveGrades}
              className="btn full-m"
            >
              <Save className="w-5 h-5 text-[#2B2623]" />
              <span>Guardar notas</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
