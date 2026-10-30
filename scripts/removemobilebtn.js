const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');
// Remove the mobile download button block (lines 1150-1166 1-indexed)
const newContent = content.replace(
  /\{currentClass && \(\s*<button[\s\S]*?\/Download className="w-5 h-5 text-[#F6E7C8]" \/><\/button>\s*\}/,
  ''
);
if (newContent === content) {
  // fallback: remove by line numbers
  const lines = content.split('\n');
  const newLines = lines.filter((line, idx) => idx < 1149 || idx > 1165);
  fs.writeFileSync(filePath, newLines.join('\n'));
  console.log('Removed lines 1150-1166 via fallback');
} else {
  fs.writeFileSync(filePath, newContent);
  console.log('Removed mobile button via regex');
}