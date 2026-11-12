import * as XLSX from 'xlsx';
import { ClassSection, Student } from '../types';

/**
 * Parsea un archivo Excel de "Hoja de Actuación" relleno (con el formato oficial)
 * y sincroniza las notas y el orden de lista de todas las secciones encontradas.
 * Adicionalmente, detecta y añade alumnos nuevos si aparecen en el Excel y no estaban registrados.
 */
export async function parseAndSyncHojaActuacion(
  file: File,
  sections: ClassSection[],
  activeLapsoNum: 1 | 2 | 3
): Promise<{
  batchEntries: Array<{ studentId: string; grades: any }>;
  updatedSectionMap: Map<string, Student[]>;
  updatedEvaluationMeta?: any;
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const batchEntries: Array<{ studentId: string; grades: any }> = [];
  const updatedSectionMap = new Map<string, Student[]>();
  let extractedEvalMeta: any = null;

  for (const section of sections) {
    const sheetName = `AVANCE ${section.sectionLetter.toUpperCase()}`;
    const ws = workbook.Sheets[sheetName];
    if (!ws) {
      console.warn(`No se encontró la hoja ${sheetName} en el archivo Excel subido.`);
      continue;
    }

    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (rows.length < 12) continue;

    // Extraer metadatos de evaluaciones de la fila 4 si están presentes
    const row4 = rows[3] || [];
    if (!extractedEvalMeta) {
      extractedEvalMeta = {
        academic: {
          homework: { name: row4[2] || "Hoja de tarea", weight: 20 },
          talentShow: { name: row4[4] || "Muestra de talentos", weight: 20 },
          assembly: { name: row4[6] || "Montaje", weight: 20 },
          essay: { name: row4[8] || "Ensayo", weight: 20 },
          performance: { name: row4[10] || "Puesta en escena", weight: 10 },
        },
        ethical: {
          responsibility: { name: rows[3]?.[16] || "Responsabilidad", weight: 5 },
          personalCare: { name: rows[3]?.[17] || "Presentación Personal", weight: 5 },
        }
      };
    }

    const existingStudents = section.students || [];
    const updatedStudents: (Student & { isNew?: boolean })[] = [];

    // Iterar desde la fila 12 (índice 11) hacia abajo hasta que la columna B esté vacía
    for (let r = 11; r < rows.length; r++) {
      const rowData = rows[r];
      if (!rowData || !rowData[1]) {
        // Si no hay nombre en la columna B, terminamos la lista de alumnos de esta hoja
        break;
      }

      const rawFullName = String(rowData[1]).trim().toUpperCase();
      if (!rawFullName || rawFullName === "APELLIDOS Y NOMBRES") continue;

      // Extraer notas de las columnas correspondientes
      // C (idx 2): hw, E (idx 4): ts, G (idx 6): asm, I (idx 8): esy, K (idx 10): prf
      const hwScore = parseScore(rowData[2]);
      const tsScore = parseScore(rowData[4]);
      const asmScore = parseScore(rowData[6]);
      const esyScore = parseScore(rowData[8]);
      const prfScore = parseScore(rowData[10]);

      // Notas éticas: Q (idx 16) y R (idx 17)
      const respScore = parseScore(rowData[16]);
      const pcScore = parseScore(rowData[17]);

      // Buscar si el estudiante ya existe en la sección comparando Apellidos + Nombres y Nombres + Apellidos
      let targetStudent = existingStudents.find(s => {
        const full1 = `${s.lastName} ${s.firstName}`.trim().toUpperCase().replace(/\s+/g, ' ');
        const full2 = `${s.firstName} ${s.lastName}`.trim().toUpperCase().replace(/\s+/g, ' ');
        const cleanRaw = rawFullName.replace(/\s+/g, ' ');
        return full1 === cleanRaw || full2 === cleanRaw;
      });

      const currentGrades = targetStudent?.grades || {};
      const currentLapso = currentGrades[activeLapsoNum] || currentGrades[1] || {
        academic: {
          homework: { id: "hw", name: "Hoja de tarea", weight: 20, score: hwScore },
          talentShow: { id: "ts", name: "Muestra de talentos", weight: 20, score: tsScore },
          assembly: { id: "asm", name: "Montaje", weight: 20, score: asmScore },
          essay: { id: "esy", name: "Ensayo", weight: 20, score: esyScore },
          performance: { id: "prf", name: "Puesta en escena", weight: 10, score: prfScore },
        },
        ethical: {
          responsibility: { id: "resp", name: "Responsabilidad", weight: 5, score: respScore },
          personalCare: { id: "pc", name: "Presentación Personal", weight: 5, score: pcScore },
        }
      };

      const newLapso = JSON.parse(JSON.stringify(currentLapso));
      if (newLapso.academic) {
        if (hwScore !== undefined && newLapso.academic.homework) newLapso.academic.homework.score = hwScore;
        if (tsScore !== undefined && newLapso.academic.talentShow) newLapso.academic.talentShow.score = tsScore;
        if (asmScore !== undefined && newLapso.academic.assembly) newLapso.academic.assembly.score = asmScore;
        if (esyScore !== undefined && newLapso.academic.essay) newLapso.academic.essay.score = esyScore;
        if (prfScore !== undefined && newLapso.academic.performance) newLapso.academic.performance.score = prfScore;
      }
      if (newLapso.ethical) {
        if (respScore !== undefined && newLapso.ethical.responsibility) newLapso.ethical.responsibility.score = respScore;
        if (pcScore !== undefined && newLapso.ethical.personalCare) newLapso.ethical.personalCare.score = pcScore;
      }

      const newGrades: any = {
        ...currentGrades,
        [activeLapsoNum]: newLapso
      };

      if (targetStudent) {
        // Actualizar estudiante existente manteniendo su ID y datos originales
        const updatedStd: Student = {
          ...targetStudent,
          grades: newGrades
        };
        batchEntries.push({ studentId: updatedStd.id, grades: newGrades });
        updatedStudents.push(updatedStd);
      } else {
        // Crear nuevo estudiante solo si realmente no existe en la sección
        const parts = rawFullName.split(/\s+/);
        const lastName = parts.slice(0, Math.max(1, Math.floor(parts.length / 2))).join(" ");
        const firstName = parts.slice(Math.max(1, Math.floor(parts.length / 2))).join(" ");
        const newId = `std-excel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const newStd: Student & { isNew?: boolean } = {
          id: newId,
          firstName: firstName || rawFullName,
          lastName: lastName || "",
          cedula: `V-${Math.floor(10000000 + Math.random() * 89999999)}`,
          gradeYear: section.gradeYear,
          sectionLetter: section.sectionLetter,
          avatarUrl: "",
          grades: newGrades,
          attendanceRate: 100,
          hasSubmittedLastQuiz: true,
          isNew: true,
        };

        batchEntries.push({ studentId: newId, grades: newGrades });
        updatedStudents.push(newStd);
      }
    }

    updatedSectionMap.set(section.id, updatedStudents);
  }

  return {
    batchEntries,
    updatedSectionMap,
    updatedEvaluationMeta: extractedEvalMeta
  };
}

function parseScore(val: any): number | undefined {
  if (val === undefined || val === null || val === "" || val === "—") return undefined;
  const num = typeof val === "number" ? val : parseFloat(val.toString().replace(",", "."));
  if (isNaN(num)) return undefined;
  return Math.min(20, Math.max(0, num));
}
