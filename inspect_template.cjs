const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('csv/HOJAS DE ACTUACIÓN -ASISTENCIA 2026-27.xlsx');
  const ws = workbook.getWorksheet('AVANCE A');

  console.log('Row 4:', [ws.getCell('C4').value, ws.getCell('E4').value, ws.getCell('G4').value, ws.getCell('I4').value, ws.getCell('K4').value]);
  console.log('Row 11:', [ws.getCell('C11').value, ws.getCell('D11').value, ws.getCell('E11').value, ws.getCell('F11').value, ws.getCell('G11').value, ws.getCell('H11').value, ws.getCell('I11').value, ws.getCell('J11').value, ws.getCell('K11').value, ws.getCell('L11').value]);
  console.log('Row 12 headers/cells:', [ws.getCell('C12').value, ws.getCell('D12').value, ws.getCell('E12').value, ws.getCell('F12').value, ws.getCell('G12').value, ws.getCell('H12').value, ws.getCell('I12').value, ws.getCell('J12').value, ws.getCell('K12').value, ws.getCell('L12').value]);
}

test().catch(console.error);
