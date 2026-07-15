const fs = require('fs');
const contentPath = 'C:\\Users\\somul\\.gemini\\antigravity\\brain\\2b8da5d2-ae7e-4cdd-8d51-2780e0082a31\\.system_generated\\steps\\926\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

console.log("=== LINK TAGS ===");
const linkRegex = /<link[^>]*rel=['"]stylesheet['"][^>]*>/gi;
let match;
while ((match = linkRegex.exec(content)) !== null) {
  console.log(match[0]);
}
