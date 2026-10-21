import React, { useState, useMemo } from "react";
import { ClassSection, PendingGradeTask, TeacherProfile, SubjectGroup } from "../types";
import { getWeightedFinalScore } from "../mockData";
import {
  IluminaOwl,
  MedalCounter,
  GemProgressBar
} from "./BitacoraBrand";
import {
  Users,
  Plus,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  BookOpen
} from "lucide-react";

interface DashboardViewProps {
  teacher: TeacherProfile;
  classes: ClassSection[];
  pendingTasks: PendingGradeTask[];
  activeLapso: 1 | 2 | 3;
  calendarCurrentLapso?: 1 | 2 | 3;
  termStartDate: string;
  termEndDate: string;
  currentDate?: string;
  termProgressPercent: number;
  onUpdateLapso: (lapso: 1 | 2 | 3) => void;
  onSyncCurrentLapso?: () => void;
  onUpdateDates: (dates: { start: string; end: string }) => void;
  onSelectClass: (classId: string) => void;
  onSelectSubject?: (subjectKey: string) => void;
  onQuickGrade: (studentId: string, classId: string) => void;
  onOpenNotifications: () => void;
  onOpenAlerts: () => void;
  onOpenAddClass?: () => void;
}

export default function DashboardView({
  teacher,
  classes,
  pendingTasks,
  activeLapso,
  calendarCurrentLapso = 1,
  termStartDate,
  termEndDate,
  currentDate,
  termProgressPercent,
  onUpdateLapso,
  onSyncCurrentLapso,
  onUpdateDates,
  onSelectClass,
  onSelectSubject,
  onQuickGrade,
  onOpenNotifications,
  onOpenAlerts,
  onOpenAddClass
}: DashboardViewProps) {
  // Aggregate real statistics
  const totalStudents = classes.reduce((acc, c) => acc + (c.students?.length || 0), 0);
  const allStudents = classes.flatMap(c => c.students || []);

  // Compute pending grades per class and overall for active lapso
  const pendingByClass = useMemo(() => {
    const map = new Map<string, number>();
    classes.forEach(cls => {
      let unassigned = 0;
      (cls.students || []).forEach(std => {
        const sc = getWeightedFinalScore(std.grades, activeLapso);
        if (sc === 0) {
          unassigned += 1;
        }
      });
      map.set(cls.id, unassigned);
    });
    return map;
  }, [classes, activeLapso]);

  const totalStudentsAtRisk = useMemo(() => {
    let count = 0;
    classes.forEach(cls => {
      (cls.students || []).forEach(std => {
        const sc = getWeightedFinalScore(std.grades, activeLapso);
        if (sc > 0 && sc < 10) {
          count += 1;
        }
      });
    });
    return count;
  }, [classes, activeLapso]);

  const totalPendingGrades = useMemo(() => {
    let count = 0;
    pendingByClass.forEach(val => { count += val; });
    return count;
  }, [pendingByClass]);

  // Group classes by Subject + Grade Year
  const subjectGroups = useMemo<SubjectGroup[]>(() => {
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
        const sc = getWeightedFinalScore(std.grades, activeLapso);
        if (sc > 0) {
          scoreSum += sc;
          graded += 1;
        }
      });
      group.averageScore = graded > 0 ? Number((scoreSum / graded).toFixed(1)) : 0;
      return group;
    });
  }, [classes, activeLapso]);

  // First subject with pending grades to recommend
  const firstPendingSubject = useMemo(() => {
    for (const grp of subjectGroups) {
      for (const sec of grp.sections) {
        if ((pendingByClass.get(sec.id) || 0) > 0) {
          return {
            name: grp.subjectName,
            year: grp.gradeYear,
            sectionId: sec.id,
            sectionLetter: sec.sectionLetter,
            subjectKey: grp.key
          };
        }
      }
    }
    if (classes.length > 0) {
      return {
        name: classes[0].subjectName,
        year: classes[0].gradeYear,
        sectionId: classes[0].id,
        sectionLetter: classes[0].sectionLetter,
        subjectKey: subjectGroups[0]?.key || ""
      };
    }
    return null;
  }, [subjectGroups, classes, pendingByClass]);

  const owlPoses: Record<1 | 2 | 3, string> = {
    1: "bienvenida",
    2: "orgullosa",
    3: "celebracion"
  };

  return (
    <div className="space-y-0">
      {/* Lapso Notebook Folder Tabs */}
      <div className="lt" role="tablist" aria-label="Lapsos Académicos">
        {([1, 2, 3] as const).map((lapso) => (
          <button
            key={lapso}
            onClick={() => onUpdateLapso(lapso)}
            className="tab"
            aria-current={activeLapso === lapso ? "page" : undefined}
          >
            Lapso {lapso}
            {calendarCurrentLapso === lapso && (
              <span className="ct" title="Lapso actual del calendario">
                Actual
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Parchment Sheet */}
      <section
        className="card pp"
        style={{ borderTopLeftRadius: 0, zIndex: 1 }}
      >
        {/* Lapso General Progress Bar */}
        {(() => {
          const formatDateShort = (dateStr: string): string => {
            try {
              const d = new Date(dateStr + "T00:00:00");
              if (isNaN(d.getTime())) return dateStr;
              const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
              return `${d.getDate()} ${months[d.getMonth()]}`;
            } catch {
              return dateStr;
            }
          };

          const startMs = new Date(termStartDate + "T00:00:00").getTime();
          const endMs = new Date(termEndDate + "T00:00:00").getTime();
          const todayMs = new Date((currentDate || new Date().toISOString().slice(0, 10)) + "T00:00:00").getTime();

          const totalDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
          const elapsedDays = Math.max(0, Math.min(totalDays, Math.round((todayMs - startMs) / (1000 * 60 * 60 * 24))));
          const remainingDays = Math.max(0, totalDays - elapsedDays);
          const lapsoPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

          return (
            <div className="card bg-white p-4 mb-8 border-2 border-[#E5DCD0] shadow-sm rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#854D0E] block">
                    Progreso general del lapso {activeLapso}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-display text-xl sm:text-2xl font-bold text-[#2B2623]">
                      {elapsedDays} / {totalDays} días
                    </span>
                    <span className="text-xs font-bold text-[#2F7F6F] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                      {lapsoPercent}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#6E655F] font-semibold sm:text-right">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Inicio</span>
                    <strong className="text-[#2B2623]">{formatDateShort(termStartDate)}</strong>
                  </div>
                  <div className="w-px h-6 bg-[#E5DCD0]" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Restantes</span>
                    <strong className="text-[#D97706]">Quedan {remainingDays} días</strong>
                  </div>
                  <div className="w-px h-6 bg-[#E5DCD0]" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cierre</span>
                    <strong className="text-[#2B2623]">{formatDateShort(termEndDate)}</strong>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#EFE5D2] h-3 rounded-full overflow-hidden border border-[#D5C4A5] relative">
                <div
                  className="bg-gradient-to-r from-[#2F7F6F] to-[#22C55E] h-full rounded-full transition-all duration-500"
                  style={{ width: `${lapsoPercent}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* Hero Quick Status Row */}
        <div className="row items-center justify-between gap-6 mb-8">
          <div className="row full-m flex-1 min-w-[280px] gap-4 flex-nowrap items-center">
            <IluminaOwl width={68} height={76} pose={owlPoses[activeLapso]} animated={true} />
            <div className="card sti flex-1 p-3.5 sm:p-4 bg-white">
              <b className="font-display text-lg sm:text-xl text-[#2B2623] block">
                {totalPendingGrades > 0
                  ? `Tienes ${totalPendingGrades} notas por registrar`
                  : "¡Todas las notas están al día!"}
              </b>
              <p className="sub">
                {firstPendingSubject
                  ? `¿Continuamos con ${firstPendingSubject.name} (${firstPendingSubject.year} · ${firstPendingSubject.sectionLetter})?`
                  : "Excelente trabajo en la bitácora académica."}
              </p>
            </div>
          </div>

          {firstPendingSubject && (
            <button 
              onClick={() => onSelectClass(firstPendingSubject.sectionId)}
              className="btn full-m"
            >
              Continuar
            </button>
          )}

          {/* Medals */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:gap-3 w-full sm:w-auto shrink-0 py-2">
            <MedalCounter
              value={classes.length}
              label="Materias"
              spriteName="librocerrado"
            />
            <MedalCounter
              value={totalStudents}
              label="Alumnos"
              spriteName="birrete"
            />
            <MedalCounter
              value={totalStudentsAtRisk}
              label="Rendimiento"
              spriteName="rubi"
              valueColor={totalStudentsAtRisk > 0 ? "#B91C1C" : "#15803D"}
            />
          </div>
        </div>

        {/* Section Header: Mis materias */}
        <div className="row justify-between items-center mb-5 gap-3">
          <h1 className="font-display text-2xl sm:text-3xl text-[#2B2623]">
            Mis materias
          </h1>

          {onOpenAddClass && (
            <button 
              onClick={onOpenAddClass}
              className="btn s"
            >
              <Plus className="w-4 h-4 text-[#D97706]" />
              <span>Registrar materia</span>
            </button>
          )}
        </div>

        {/* Subjects Grid - Same structure as SubjectsListView */}
        <div className="g">
          {subjectGroups.map((group) => (
            <DashboardSubjectCard
              key={group.key}
              group={group}
              pendingByClass={pendingByClass}
              onSelectSubject={onSelectSubject}
              onSelectClass={onSelectClass}
            />
          ))}

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
      </section>
    </div>
  );
}

function DashboardSubjectCard({
  group,
  pendingByClass,
  onSelectSubject,
  onSelectClass
}: {
  key?: string;
  group: SubjectGroup;
  pendingByClass: Map<string, number>;
  onSelectSubject?: (key: string) => void;
  onSelectClass: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const avgScoreDisplay = group.averageScore > 0 ? group.averageScore.toFixed(1) : "—";
  const avgColor = group.averageScore >= 16 ? "#22C55E" : group.averageScore >= 10 ? "#EAB308" : "#EF4444";
  const studentsCount = group.sections.reduce((acc, s) => acc + (s.students?.length || 0), 0);
  const isMixed = group.subjectName.toLowerCase().includes("geograf") || group.gradeYear.toLowerCase().includes("varios");

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelectSubject ? onSelectSubject(group.key) : onSelectClass(group.sections[0]?.id || "")}
      className={`card sti co p-4 cursor-pointer transition-transform hover:-translate-y-1 ${
        isMixed ? "bg-[#FBF9FF]" : ""
      }`}
      style={isMixed ? { borderColor: "#C4B5FD" } : undefined}
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
          {isMixed && (
            <span className="bg vio text-[10px] mb-1 inline-block">
              Grupo mixto
            </span>
          )}
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
                onSelectClass(sec.id);
              }}
              className={`w-7 h-7 rounded-lg font-bold text-xs border transition cursor-pointer ${
                sec.students && sec.students.length > 0 && (pendingByClass.get(sec.id) || 0) === 0
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                  : "bg-slate-100 text-[#2B2623] border-[#E5DCD0] hover:bg-[#D97706] hover:text-white hover:border-[#D97706]"
              }`}
              title={`Sec. ${sec.sectionLetter} (${sec.students?.length || 0} alumnos)`}
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

      {/* Footer: Status */}
      <div className="flex items-center justify-end pt-2 mt-2 border-t border-[#E5DCD0]/60">
        <div className="flex items-center gap-1 text-[#D97706] font-bold text-[10px] uppercase tracking-wider">
          <span>Gestionar</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
