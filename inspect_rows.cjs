const XLSX = require('xlsx');
const wb = XLSX.readFile('csv/HOJAS DE ACTUACIÓN -ASISTENCIA 2026-27.xlsx');
const ws = wb.Sheets['AVANCE A'];
for(let r = 10; r <= 25; r++) {
  const cellB = ws[XLSX.utils.encode_cell({r: r-1, c: 1})];
  const cellC = ws[XLSX.utils.encode_cell({r: r-1, c: 2})];
  if(cellB || cellC) {
    console.log(`Row ${r}: B=${cellB?.v}, C=${cellC?.v}`);
  }
}
