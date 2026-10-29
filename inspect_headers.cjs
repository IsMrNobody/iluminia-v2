const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('csv/HOJAS DE ACTUACIÓN -ASISTENCIA 2026-27.xlsx');
  const ws = workbook.getWorksheet('AVANCE A');

  for(let c = 1; c <= 25; c++) {
    const colLetter = ws.getColumn(c).letter;
    console.log(`Col ${colLetter}: R3=${ws.getCell(`${colLetter}3`).value}, R4=${ws.getCell(`${colLetter}4`).value}, R10=${ws.getCell(`${colLetter}10`).value}, R11=${ws.getCell(`${colLetter}11`).value}`);
  }
}

test().catch(console.error);
