const fs = require('fs');
const path = require('path');

const contentPath = 'C:\\Users\\somul\\.gemini\\antigravity\\brain\\2b8da5d2-ae7e-4cdd-8d51-2780e0082a31\\.system_generated\\steps\\926\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

console.log("=== HEADER TAGS ===");
const headerRegex = /<header[^>]*>([\s\S]*?)<\/header>/gi;
let match;
while ((match = headerRegex.exec(content)) !== null) {
  console.log(match[0].substring(0, 1000));
}

console.log("=== CUSTOM CSS ===");
const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
while ((match = styleRegex.exec(content)) !== null) {
  const css = match[1];
  if (css.includes('header') || css.includes('nav') || css.includes('topbar') || css.includes('padding') || css.includes('menu')) {
    console.log(match[0].substring(0, 800));
  }
}
