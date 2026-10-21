import { ClassSection, PendingGradeTask, TeacherProfile, StudentGrades, Student } from "./types";

export function createEmptyGrades(): StudentGrades {
  return {
    1: {
      academic: {
        homework: {
          id: "hw",
          name: "Hoja de tarea",
          weight: 20,
          description: "Comprensión conceptual y precisión en tareas.",
        },
        talentShow: {
          id: "ts",
          name: "Muestra de talentos",
          weight: 20,
          description: "Demostración práctica de habilidades adquiridas.",
        },
        assembly: {
          id: "asm",
          name: "Montaje",
          weight: 20,
          description: "Ensamblaje, estructura y coherencia del proyecto.",
        },
        essay: {
          id: "esy",
          name: "Ensayo",
          weight: 20,
          description: "Calidad de preparación y repetición técnica.",
        },
        performance: {
          id: "prf",
          name: "Puesta en escena",
          weight: 10,
          description: "Presentación final y expresión creativa.",
        },
      },
      ethical: {
        responsibility: {
          id: "resp",
          name: "Responsabilidad",
          weight: 5,
          description: "Entrega a tiempo y compromiso con los plazos.",
        },
        personalCare: {
          id: "pc",
          name: "Presentación Personal",
          weight: 5,
          description: "Cumplimiento del uniforme y estándares de higiene.",
        },
      },
    },
    2: {
      academic: {
        homework: {
          id: "hw",
          name: "Hoja de tarea",
          weight: 20,
          description: "Comprensión conceptual y precisión en tareas.",
        },
        talentShow: {
          id: "ts",
          name: "Muestra de talentos",
          weight: 20,
          description: "Demostración práctica de habilidades adquiridas.",
        },
        assembly: {
          id: "asm",
          name: "Montaje",
          weight: 20,
          description: "Ensamblaje, estructura y coherencia del proyecto.",
        },
        essay: {
          id: "esy",
          name: "Ensayo",
          weight: 20,
          description: "Calidad de preparación y repetición técnica.",
        },
        performance: {
          id: "prf",
          name: "Puesta en escena",
          weight: 10,
          description: "Presentación final y expresión creativa.",
        },
      },
      ethical: {
        responsibility: {
          id: "resp",
          name: "Responsabilidad",
          weight: 5,
          description: "Entrega a tiempo y compromiso con los plazos.",
        },
        personalCare: {
          id: "pc",
          name: "Presentación Personal",
          weight: 5,
          description: "Cumplimiento del uniforme y estándares de higiene.",
        },
      },
    },
    3: {
      academic: {
        homework: {
          id: "hw",
          name: "Hoja de tarea",
          weight: 20,
          description: "Comprensión conceptual y precisión en tareas.",
        },
        talentShow: {
          id: "ts",
          name: "Muestra de talentos",
          weight: 20,
          description: "Demostración práctica de habilidades adquiridas.",
        },
        assembly: {
          id: "asm",
          name: "Montaje",
          weight: 20,
          description: "Ensamblaje, estructura y coherencia del proyecto.",
        },
        essay: {
          id: "esy",
          name: "Ensayo",
          weight: 20,
          description: "Calidad de preparación y repetición técnica.",
        },
        performance: {
          id: "prf",
          name: "Puesta en escena",
          weight: 10,
          description: "Presentación final y expresión creativa.",
        },
      },
      ethical: {
        responsibility: {
          id: "resp",
          name: "Responsabilidad",
          weight: 5,
          description: "Entrega a tiempo y compromiso con los plazos.",
        },
        personalCare: {
          id: "pc",
          name: "Presentación Personal",
          weight: 5,
          description: "Cumplimiento del uniforme y estándares de higiene.",
        },
      },
    },
  };
}

export function getWeightedFinalScore(gradesPerLapso: StudentGrades, lapso: 1 | 2 | 3 = 1): number {
  const grades = gradesPerLapso[lapso];
  if (!grades) return 0;

  const academicItems = grades.academic ? Object.values(grades.academic) : [];
  const ethicalItems = grades.ethical ? Object.values(grades.ethical) : [];
  const allItems = [...academicItems, ...ethicalItems];

  let weightedSum = 0;
  let filledWeight = 0;
  let simpleSum = 0;
  let filledCount = 0;

  for (const item of allItems) {
    if (!item) continue;
    const score = item.score;
    if (score !== undefined && score !== null && !isNaN(score)) {
      const clampedScore = Math.max(0, Math.min(20, Number(score)));
      const weight = Number(item.weight) || 0;
      weightedSum += clampedScore * weight;
      filledWeight += weight;
      simpleSum += clampedScore;
      filledCount += 1;
    }
  }

  if (filledCount === 0) return 0;

  // Real weighted average calculation: sum(score * weight) / sum(weight)
  const result = filledWeight > 0 ? (weightedSum / filledWeight) : (simpleSum / filledCount);
  return Number(Math.max(0, Math.min(20, result)).toFixed(2));
}

// Percent completion based on criteria filled
export function getGradingProgressPercent(gradesPerLapso: StudentGrades, lapso: 1 | 2 | 3 = 1): number {
  const grades = gradesPerLapso[lapso];
  if (!grades) return 0;

  const academicItems = grades.academic ? Object.values(grades.academic) : [];
  const ethicalItems = grades.ethical ? Object.values(grades.ethical) : [];
  const allItems = [...academicItems, ...ethicalItems];

  let filledWeight = 0;
  let totalWeight = 0;

  for (const item of allItems) {
    if (!item) continue;
    const w = Number(item.weight) || 0;
    totalWeight += w;
    if (item.score !== undefined && item.score !== null && !isNaN(item.score)) {
      filledWeight += w;
    }
  }

  if (totalWeight <= 0) totalWeight = 100;
  return Math.min(100, Math.round((filledWeight / totalWeight) * 100));
}

// Helper to fill scores to get exact final score outcomes
function buildGradesWithScore(finalDest: number): StudentGrades {
  const lapsoData = {
    academic: {
      homework: { id: "hw", name: "Hoja de tarea", weight: 20, description: "Comprensión conceptual y precisión en tareas.", score: Math.round(finalDest * 10) / 10 },
      talentShow: { id: "ts", name: "Muestra de talentos", weight: 20, description: "Demostración práctica de habilidades adquiridas.", score: Math.round(finalDest * 10) / 10 },
      assembly: { id: "asm", name: "Montaje", weight: 20, description: "Ensamblaje, estructura y coherencia del proyecto.", score: Math.round(finalDest * 10) / 10 },
      essay: { id: "esy", name: "Ensayo", weight: 20, description: "Calidad de preparación y repetición técnica.", score: Math.round(finalDest * 10) / 10 },
      performance: { id: "prf", name: "Puesta en escena", weight: 10, description: "Presentación final y expresión creativa.", score: Math.round(finalDest * 10) / 10 },
    },
    ethical: {
      responsibility: { id: "resp", name: "Responsabilidad", weight: 5, description: "Entrega a tiempo y compromiso con los plazos.", score: Math.round(finalDest * 10) / 10 },
      personalCare: { id: "pc", name: "Presentación Personal", weight: 5, description: "Cumplimiento del uniforme y estándares de higiene.", score: Math.round(finalDest * 10) / 10 },
    }
  };

  return {
    1: JSON.parse(JSON.stringify(lapsoData)),
    2: JSON.parse(JSON.stringify(lapsoData)),
    3: JSON.parse(JSON.stringify(lapsoData))
  };
}

export const initialPendingTasks: PendingGradeTask[] = [
  {
    id: "task-1",
    title: "Matemáticas - Quiz 4",
    subjectName: "Matemáticas",
    gradeYear: "2do Año",
    sectionLetter: "A",
    type: "quiz",
    completed: false,
  },
  {
    id: "task-2",
    title: "CRP - Taller",
    subjectName: "CRP",
    gradeYear: "3er Año",
    sectionLetter: "C",
    type: "workshop",
    completed: false,
  },
];

const currentYear = new Date().getFullYear();

export const initialTeacherProfile: TeacherProfile = {
  name: "Carmen C. Moya",
  email: "carmen.moya@ilumina.edu",
  department: "CRP / Matemáticas",
  schoolYear: `${currentYear}-${currentYear + 1}`,
  rank: "DOCENTE SENIOR",
  status: "ACTIVO",
  avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCODeDyOYX0lfZ9qj4a6BRtotV3UcIsDNvvgicsnY9VD1lUVA4OV7eGtZFVn-Biak23fvBAD9adtOHxPG_kXrOJx7TyHTsvzmECbmW_hz_X2JARBxZqc5t7kAcQkxmdhpvVpy6PrR9WbpD5OMJyVMk0SEE1zzMuIpnQtXuiGiUJCggH2nnoJdQd4NVKG2h6FT8Zf85UyRFiITotQwec1Uhvn22GddqOYgaIxlyMI5Xq3s9L72VeX4TeQYojZAOguuQYX40lJSNPwRo",
  totalStudents: 142,
  totalStudentsGrowthPercent: 5,
  averagePerformance: 17.4,
  termProgressPercent: 78,
};

export const initialClassSections: ClassSection[] = [
  {
    id: "class-math-2a",
    subjectName: "Matemáticas",
    gradeYear: "2do Año",
    sectionLetter: "A",
    department: "Dpto. Ciencias",
    isActive: true,
    lapso: 2,
    termPercentage: 68,
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAH4f-D5f8oQhIRScgpba7QYZALfGlmzeUtrORkEA6Zdsdp24VH-bvM_5CqxhovTK2qD1rr39W5rL6g1gaxJ-5MUEUKtmu1mn8kE42eUW6ifK0me-YkJTxSfiuKI_71MuzVeKLFuY0KFjSY4spVvtDv09FgbZFAQX3Vmm52S84mqTWl7F_yc36XqkkUh5oX4lcdJMWUq908mv9ZFJnoY03Z9G2slcluVwOoj34mcxLXg2ifqFMhCbPCksQ__Kdbp9xFoxGJGLp03Eg",
    students: [
      {
        id: "std-1",
        firstName: "Alejandro",
        lastName: "SÁNCHEZ ÁLVAREZ",
        avatarUrl: undefined,
        grades: buildGradesWithScore(18.5),
        attendanceRate: 98,
        hasSubmittedLastQuiz: true,
      },
      {
        id: "std-2",
        firstName: "Isabella",
        lastName: "LLOVERA AGOSTINI",
        avatarUrl: undefined,
        grades: buildGradesWithScore(16.2),
        attendanceRate: 95,
        hasSubmittedLastQuiz: true,
      },
      {
        id: "std-3",
        firstName: "Carlos",
        lastName: "MENDOZA GUTIERREZ",
        avatarUrl: undefined,
        grades: buildGradesWithScore(8.4),
        attendanceRate: 72,
        hasSubmittedLastQuiz: false,
      },
      {
        id: "std-4",
        firstName: "Mariana",
        lastName: "RODRIGUEZ CASTRO",
        avatarUrl: undefined,
        grades: buildGradesWithScore(14.0),
        attendanceRate: 92,
        hasSubmittedLastQuiz: true,
      },
      {
        id: "std-5",
        firstName: "Gabriel",
        lastName: "PEREZ BOLIVAR",
        avatarUrl: undefined,
        grades: buildGradesWithScore(12.0),
        attendanceRate: 88,
        hasSubmittedLastQuiz: true,
      },
      {
        id: "std-v",
        firstName: "VALERIA SOFÍA",
        lastName: "SÁNCHEZ ÁLVAREZ",
        avatarUrl: undefined,
        grades: buildGradesWithScore(0),
        attendanceRate: 100,
        hasSubmittedLastQuiz: true,
      },
      {
        id: "std-6",
        firstName: "Camila",
        lastName: "GÓMEZ PANTIN",
        avatarUrl: undefined,
        grades: buildGradesWithScore(15.5),
        attendanceRate: 94,
        hasSubmittedLastQuiz: true,
      },
      {
        id: "std-7",
        firstName: "Sebastián",
        lastName: "MIRANDA SILVA",
        avatarUrl: undefined,
        grades: buildGradesWithScore(9.8),
        attendanceRate: 80,
        hasSubmittedLastQuiz: false,
      },
      {
        id: "std-8",
        firstName: "Sofía",
        lastName: "HERRERA BARRIOS",
        avatarUrl: undefined,
        grades: buildGradesWithScore(19.2),
        attendanceRate: 100,
        hasSubmittedLastQuiz: true,
      }
    ],
  },
  {
    id: "class-crp-3c",
    subjectName: "CRP",
    gradeYear: "3er Año",
    sectionLetter: "C",
    department: "Electiva",
    isActive: true,
    lapso: 3,
    termPercentage: 45,
    coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoZLaap7of8Yg_pfaDR7uAHaZ327V2M0NZN2F7tTtcbYCQJSMMtOql-BVqs1wIkNMZMeGjAwvPw4XQZ7fSOJi1SDoAm51dQqWS8V4M8vQqqWmZiPNruosyYBR8UTy4oIHv7SI9AIuLeWOCSc5OU-wBeAD8DHFK9n6jEwUa5rpcI2IAH-G0CYDgSNeUhntSnNKO1djCDyA-5CuG2blvxLl4etAuwTYRmCTCqr8cuntEo-3UZstX_bs1Em5Kbylo77M_jh_GqPAL0KY",
    students: [
      {
        id: "std-301",
        firstName: "Daniela",
        lastName: "MENDOZA ALCOSER",
        avatarUrl: undefined,
        grades: buildGradesWithScore(16.5),
        attendanceRate: 96,
        hasSubmittedLastQuiz: true,
      },
      {
        id: "std-302",
        firstName: "Enrique",
        lastName: "CARRASQUERO RUIZ",
        avatarUrl: undefined,
        grades: buildGradesWithScore(11.2),
        attendanceRate: 85,
        hasSubmittedLastQuiz: true,
      },
      {
        id: "std-303",
        firstName: "Lucía",
        lastName: "AVENDAÑO CASTILLO",
        avatarUrl: undefined,
        grades: buildGradesWithScore(17.8),
        attendanceRate: 99,
        hasSubmittedLastQuiz: true,
      },
      {
        id: "std-304",
        firstName: "José Manuel",
        lastName: "ROJAS GIL",
        avatarUrl: undefined,
        grades: buildGradesWithScore(7.5),
        attendanceRate: 65,
        hasSubmittedLastQuiz: false,
      }
    ],
  }
];
