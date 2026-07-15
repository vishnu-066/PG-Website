const fs = require('fs');
const contentPath = 'C:\\Users\\somul\\.gemini\\antigravity\\brain\\2b8da5d2-ae7e-4cdd-8d51-2780e0082a31\\.system_generated\\steps\\926\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

console.log("=== SEARCHING HTML FOR HEADER-LIKE ELEMENTS ===");
// Find lines containing ekit-menu or elementor-element
const lines = content.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('logo') || line.includes('header') || line.includes('menu-toggle') || line.includes('ekit-menu')) {
    if (line.length < 500) {
      console.log(`Line ${i}: ${line}`);
      count++;
    }
    if (count > 40) break;
  }
}
