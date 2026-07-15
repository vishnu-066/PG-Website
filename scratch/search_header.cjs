const fs = require('fs');
const contentPath = 'C:\\Users\\somul\\.gemini\\antigravity\\brain\\2b8da5d2-ae7e-4cdd-8d51-2780e0082a31\\.system_generated\\steps\\926\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

console.log("=== SCANNING FOR HEADER STYLES ===");
const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
let match;
while ((match = styleRegex.exec(content)) !== null) {
  const css = match[1];
  if (css.includes('#inner-header') || css.includes('header-smooth') || css.includes('header')) {
    console.log(match[0]);
    console.log("==================================================");
  }
}
