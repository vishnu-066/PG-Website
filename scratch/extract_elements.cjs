const fs = require('fs');
const contentPath = 'C:\\Users\\somul\\.gemini\\antigravity\\brain\\2b8da5d2-ae7e-4cdd-8d51-2780e0082a31\\.system_generated\\steps\\926\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

console.log("=== SCANNING FOR CLASS ATTRIBUTES ===");
const regex = /class=['"]([^'"]*(header|logo|menu|topbar|navigation)[^'"]*)['"]/gi;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  console.log(`Match ${count}: ${match[0]}`);
  count++;
  if (count > 40) break;
}
