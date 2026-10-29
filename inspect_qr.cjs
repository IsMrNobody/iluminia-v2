const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('csv/HOJAS DE ACTUACIÓN -ASISTENCIA 2026-27.xlsx');
  const ws = workbook.getWorksheet('AVANCE A');

  console.log('Col Q (idx 17): R4=', ws.getCell('Q4').value, 'R11=', ws.getCell('Q11').value, 'R12=', ws.getCell('Q12').value);
  console.log('Col R (idx 18): R4=', ws.getCell('R4').value, 'R11=', ws.getCell('R11').value, 'R12=', ws.getCell('R12').value);
}

test().catch(console.error);
