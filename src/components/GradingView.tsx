import React, { useState, useEffect, useMemo } from "react";
import { Student } from "../types";
import { getWeightedFinalScore } from "../mockData";
import { getStudentRealCedula } from "../lib/adminService";
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
  const studentLapso = (student?.grades?.[activeLapso] || student?.grades?.[1]) as any;
  const lapsoData = {
    academic: {
      homework: studentLapso?.academic?.homework || defaultLapso.academic.homework,
      talentShow: studentLapso?.academic?.talentShow || defaultLapso.academic.talentShow,
      assembly: studentLapso?.academic?.assembly || defaultLapso.academic.assembly,
      essay: studentLapso?.academic?.essay || defaultLapso.academic.essay,
      performance: studentLapso?.academic?.performance || defaultLapso.academic.performance,
    },
    ethical: {
      responsibility: studentLapso?.ethical?.responsibility || defaultLapso.ethical.responsibility,
      personalCare: studentLapso?.ethical?.personalCare || defaultLapso.ethical.personalCare,
    }
  };

  // Local score states for active lapso
  const [hwScore, setHwScore] = useState<string>((lapsoData.academic?.homework as any)?.score?.toString() ?? "");
  const [talentScore, setTalentScore] = useState<string>((lapsoData.academic?.talentShow as any)?.score?.toString() ?? "");
  const [assemblyScore, setAssemblyScore] = useState<string>((lapsoData.academic?.assembly as any)?.score?.toString() ?? "");
  const [essayScore, setEssayScore] = useState<string>((lapsoData.academic?.essay as any)?.score?.toString() ?? "");
  const [performanceScore, setPerformanceScore] = useState<string>((lapsoData.academic?.performance as any)?.score?.toString() ?? "");

  const [responsibilityScore, setResponsibilityScore] = useState<string>((lapsoData.ethical?.responsibility as any)?.score?.toString() ?? "");
  const [personalCareScore, setPersonalCareScore] = useState<string>((lapsoData.ethical?.personalCare as any)?.score?.toString() ?? "");

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

  const [hasSaved, setHasSaved] = useState(false);

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
          ...lapsoData.academic.homework,
          score: parseNum(hwScore)
        },
        talentShow: {
          ...lapsoData.academic.talentShow,
          score: parseNum(talentScore)
        },
        assembly: {
          ...lapsoData.academic.assembly,
          score: parseNum(assemblyScore)
        },
        essay: {
          ...lapsoData.academic.essay,
          score: parseNum(essayScore)
        },
        performance: {
          ...lapsoData.academic.performance,
          score: parseNum(performanceScore)
        }
      },
      ethical: {
        responsibility: {
          ...lapsoData.ethical.responsibility,
          score: parseNum(responsibilityScore)
        },
        personalCare: {
          ...lapsoData.ethical.personalCare,
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
  }, [hwScore, talentScore, assemblyScore, essayScore, performanceScore, responsibilityScore, personalCareScore, lapsoData, student.grades, activeLapso]);

  const finalScore = useMemo(() => {
    return getWeightedFinalScore(currentGrades, activeLapso);
  }, [currentGrades, activeLapso]);

  const finalColor = finalScore >= 16 ? "#15803D" : finalScore >= 10 ? "#854D0E" : "#B91C1C";
  const finalBorder = finalScore >= 16 ? "#15803D" : finalScore >= 10 ? "#EAB308" : "#EF4444";

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
  const academicList = [
    { key: "homework", label: lapsoData.academic.homework.name, weight: lapsoData.academic.homework.weight, val: hwScore, setter: setHwScore },
    { key: "talentShow", label: lapsoData.academic.talentShow.name, weight: lapsoData.academic.talentShow.weight, val: talentScore, setter: setTalentScore },
    { key: "assembly", label: lapsoData.academic.assembly.name, weight: lapsoData.academic.assembly.weight, val: assemblyScore, setter: setAssemblyScore },
    { key: "essay", label: lapsoData.academic.essay.name, weight: lapsoData.academic.essay.weight, val: essayScore, setter: setEssayScore },
    { key: "performance", label: lapsoData.academic.performance.name, weight: lapsoData.academic.performance.weight, val: performanceScore, setter: setPerformanceScore }
  ];

  const ethicalList = [
    { key: "responsibility", label: lapsoData.ethical.responsibility.name, weight: lapsoData.ethical.responsibility.weight, val: responsibilityScore, setter: setResponsibilityScore },
    { key: "personalCare", label: lapsoData.ethical.personalCare.name, weight: lapsoData.ethical.personalCare.weight, val: personalCareScore, setter: setPersonalCareScore }
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
                {(() => {
                  const realC = getStudentRealCedula(student);
                  return realC ? (realC.startsWith("V-") || realC.startsWith("E-") ? realC : `C.I. ${realC}`) : "C.I. Pendiente";
                })()}
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
              <span className="text-[11px] font-semibold text-[#6E655F]">
                Nombres y porcentajes configurados en la tarjeta de la materia
              </span>
            </div>

            <div className="space-y-1">
              {academicList.map((item) => {
                const scoreNum = parseNum(item.val);
                const pct = scoreNum !== undefined ? (scoreNum / 20) * 100 : 0;
                const barCol = scoreNum === undefined ? "#E5DCD0" : scoreNum >= 16 ? "#22C55E" : scoreNum >= 10 ? "#EAB308" : "#EF4444";

                return (
                  <div key={item.key} className="cr group">
                    <label
                      className="font-semibold text-sm sm:text-base text-[#2B2623]"
                    >
                      {item.label}
                    </label>

                    <span
                      className="bg font-semibold text-xs py-1 px-3 text-center flex items-center gap-1"
                      style={{ background: "#FFF8E6", border: "2px solid #E3B866", borderRadius: "9999px" }}
                    >
                      {item.weight}% de la nota
                    </span>

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
                      className="font-semibold text-sm sm:text-base text-[#2B2623]"
                    >
                      {item.label}
                    </label>

                    <span
                      className="bg font-semibold text-xs py-1 px-3 text-center flex items-center gap-1"
                      style={{ background: "#FFF8E6", border: "2px solid #E3B866", borderRadius: "9999px" }}
                    >
                      {item.weight}% de la nota
                    </span>

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
