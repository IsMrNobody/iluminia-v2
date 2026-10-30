// Descarga de la "Hoja de Actuación" en la plantilla Excel oficial.
// Rellena la hoja "AVANCE <Sección>" con los datos de notas del lapso activo,
// preservando el 100% de los estilos y las hojas de ASISTENCIA (que se
// sincronizan por fórmulas con las hojas AVANCE).
//
// Celdas de la plantilla:
//   B6  = nombre de la materia
//   B9  = nombre del docente
//   C4/E4/G4/I4/K4   = nombre de la evaluación 1..5
//   D11/F11/H11/J11/L11 = ponderación (porcentaje) de la evaluación 1..5
//   C12/E12/G12/I12/K12 = nota del alumno (fila 12 = alumno 1, y hacia abajo)
//   Q12 = nota ética 1 (Responsabilidad)  ·  R12 = nota ética 2 (Presentación)
import { ClassSection, Student } from "../types";

const TEMPLATE_URL = encodeURI('/csv/HOJAS DE ACTUACIÓN -ASISTENCIA 2026-27.xlsx');

// Extensión en filas que la plantilla reserva en las hojas AVANCE (fórmulas D12:D47).
const TEMPLATE_STUDENT_LAST_ROW = 47;

const DEFAULT_LAPSO = {
  academic: {
    homework: { name: "Hoja de tarea", weight: 20 },
    talentShow: { name: "Muestra de talentos", weight: 20 },
    assembly: { name: "Montaje", weight: 20 },
    essay: { name: "Ensayo", weight: 20 },
    performance: { name: "Puesta en escena", weight: 10 },
  },
  ethical: {
    responsibility: { name: "Responsabilidad", weight: 5 },
    personalCare: { name: "Presentación Personal", weight: 5 },
  }
};

export async function downloadHojaActuacion(opts: {
  section: ClassSection;
  students: Student[];
  teacherName?: string;
}): Promise<void> {
  const { section, students, teacherName } = opts;
  try {
    const response = await fetch(TEMPLATE_URL);
    if (!response.ok) {
      throw new Error('No se pudo cargar la plantilla Excel');
    }
    const arrayBuffer = await response.arrayBuffer();
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // La hoja 1 se llama "Avance A" para la sección A, "Avance B" para la B, etc.
    const sheetNameUpper = `AVANCE ${section.sectionLetter.toUpperCase()}`;
    const ws = workbook.worksheets.find(w => w.name.toUpperCase() === sheetNameUpper) || workbook.worksheets[0];

    if (!ws) {
      alert(`No se encontró la hoja correspondiente a la sección ${section.sectionLetter}`);
      return;
    }

    const activeLapsoNum = (section.lapso || 1) as 1 | 2 | 3;
    const sampleGrades = (students?.[0] as any)?.grades?.[activeLapsoNum] || (students?.[0] as any)?.grades?.[1];
    const evalMeta = {
      academic: {
        homework: sampleGrades?.academic?.homework || DEFAULT_LAPSO.academic.homework,
        talentShow: sampleGrades?.academic?.talentShow || DEFAULT_LAPSO.academic.talentShow,
        assembly: sampleGrades?.academic?.assembly || DEFAULT_LAPSO.academic.assembly,
        essay: sampleGrades?.academic?.essay || DEFAULT_LAPSO.academic.essay,
        performance: sampleGrades?.academic?.performance || DEFAULT_LAPSO.academic.performance,
      },
      ethical: {
        responsibility: sampleGrades?.ethical?.responsibility || DEFAULT_LAPSO.ethical.responsibility,
        personalCare: sampleGrades?.ethical?.personalCare || DEFAULT_LAPSO.ethical.personalCare,
      }
    };

    // 1. B6: nombre de la materia · B9: nombre del docente
    ws.getCell('B6').value = section.subjectName || "";
    ws.getCell('B9').value = teacherName || "";

    // 2. Evaluaciones académicas: nombre (fila 4) y ponderación (fila 11)
    const academicEvals = [
      evalMeta.academic.homework,
      evalMeta.academic.talentShow,
      evalMeta.academic.assembly,
      evalMeta.academic.essay,
      evalMeta.academic.performance
    ];
    const nameCells = ['C4', 'E4', 'G4', 'I4', 'K4'];
    const weightCells = ['D11', 'F11', 'H11', 'J11', 'L11'];
    academicEvals.forEach((ev: any, idx) => {
      if (idx >= nameCells.length) return;
      ws.getCell(nameCells[idx]).value = ev?.name || `Evaluación ${idx + 1}`;
      ws.getCell(weightCells[idx]).value = Number(ev?.weight) || 0;
    });

    // 3. Alumnos desde la fila 12: nombre, notas académicas y notas éticas
    const sortedStudents = [...(students || [])];
    const scoreCols = ['C', 'E', 'G', 'I', 'K'];
    sortedStudents.forEach((std, idx) => {
      const rowNum = 12 + idx;
      const fullName = `${std.firstName} ${std.lastName}`.toUpperCase();
      ws.getCell(`B${rowNum}`).value = fullName;

      const stdLapso = (std as any).grades?.[activeLapsoNum] || (std as any).grades?.[1] || evalMeta;
      const scores = [
        stdLapso.academic?.homework?.score,
        stdLapso.academic?.talentShow?.score,
        stdLapso.academic?.assembly?.score,
        stdLapso.academic?.essay?.score,
        stdLapso.academic?.performance?.score
      ];
      scores.forEach((sc, sIdx) => {
        if (sIdx < scoreCols.length && sc !== undefined && sc !== null && sc !== '') {
          ws.getCell(`${scoreCols[sIdx]}${rowNum}`).value = Number(sc);
        }
      });

      // Notas éticas: Q = Responsabilidad, R = Presentación/Ajuste Social
      const respScore = stdLapso.ethical?.responsibility?.score;
      if (respScore !== undefined && respScore !== null && respScore !== '') {
        ws.getCell(`Q${rowNum}`).value = Number(respScore);
      }
      const pcScore = stdLapso.ethical?.personalCare?.score;
      if (pcScore !== undefined && pcScore !== null && pcScore !== '') {
        ws.getCell(`R${rowNum}`).value = Number(pcScore);
      }
    });

    // 4. Limpia filas de alumnos históricas de la plantilla que sobren.
    //    NUNCA se tocan las fórmulas compartidas de D, F, H, J, L, N, O, S, T, U.
    for (let r = 12 + sortedStudents.length; r <= TEMPLATE_STUDENT_LAST_ROW; r++) {
      ['B', 'C', 'E', 'G', 'I', 'K', 'M', 'Q', 'R'].forEach(col => {
        ws.getCell(`${col}${r}`).value = null;
      });
    }

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
}
