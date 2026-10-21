export interface GradeItem {
  id: string;
  name: string;
  weight: number; // e.g., 20 for 20%
  description: string;
  score?: number; // 0 to 20
}

export interface AcademicGrades {
  homework: GradeItem;
  talentShow: GradeItem;
  assembly: GradeItem;
  essay: GradeItem;
  performance: GradeItem;
}

export interface EthicalGrades {
  responsibility: GradeItem;
  personalCare: GradeItem;
}

export interface LapsoGrades {
  academic: AcademicGrades;
  ethical: EthicalGrades;
}

export interface StudentGrades {
  1: LapsoGrades;
  2: LapsoGrades;
  3: LapsoGrades;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  grades: StudentGrades;
  attendanceRate: number; // 0 to 100%
  hasSubmittedLastQuiz: boolean;
  cedula?: string;
  gradeYear?: string;
  sectionLetter?: string;
}

export interface ClassSection {
  id: string;
  profesorId?: string;
  subjectName: string; // e.g., Matemáticas
  gradeYear: string;  // e.g., 2do Año
  sectionLetter: string; // e.g., A
  department: string; // e.g., Dpto. Ciencias
  isActive: boolean;
  lapso: number; // 1, 2, or 3
  termPercentage: number; // progress e.g., 68%
  coverUrl?: string;
  students: Student[];
}

export interface SubjectGroup {
  key: string; // e.g. "Matemáticas__1er Año"
  subjectName: string;
  gradeYear: string;
  department: string;
  lapso: number;
  sections: ClassSection[];
  totalStudents: number;
  averageScore: number;
  coverUrl?: string;
}

export interface PendingGradeTask {
  id: string;
  classId?: string;
  title: string;
  subjectName: string;
  gradeYear: string;
  sectionLetter: string;
  type: "quiz" | "workshop" | "project";
  completed: boolean;
}

export interface TeacherProfile {
  id?: string;
  name: string;
  email: string;
  department: string;
  schoolYear: string;
  rank: string;
  status: string;
  avatarUrl: string;
  totalStudents: number;
  totalStudentsGrowthPercent: number;
  averagePerformance: number;
  termProgressPercent: number;
  isAdmin?: boolean;
}

export interface RegisteredStudent {
  id: string;
  firstName: string;
  lastName: string;
  cedula: string;
  gradeYear: string; // e.g. "1er Año", "2do Año", "3er Año", "4to Año", "5to Año"
  sectionLetter: string; // e.g. "A", "B", "C", "D", "E", "F"
  avatarUrl?: string;
  createdAt?: string;
}
