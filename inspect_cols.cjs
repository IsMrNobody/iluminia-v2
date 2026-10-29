const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('csv/HOJAS DE ACTUACIÓN -ASISTENCIA 2026-27.xlsx');
  const ws = workbook.getWorksheet('AVANCE A');

  for(let c = 1; c <= 16; c++) {
    const colLetter = ws.getColumn(c).letter;
    console.log(`Col ${colLetter} (idx ${c}): Row 4 = ${ws.getCell(`${colLetter}4`).value}, Row 11 = ${ws.getCell(`${colLetter}11`).value}, Row 12 = ${JSON.stringify(ws.getCell(`${colLetter}12`).value)}`);
  }
}

test().catch(console.error);
