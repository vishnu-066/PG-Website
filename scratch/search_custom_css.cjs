const fs = require('fs');
const contentPath = 'C:\\Users\\somul\\.gemini\\antigravity\\brain\\2b8da5d2-ae7e-4cdd-8d51-2780e0082a31\\.system_generated\\steps\\926\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

console.log("=== CUSTOM CSS BLOCKS WITH HEADER ===");
const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
let match;
while ((match = styleRegex.exec(content)) !== null) {
  const css = match[1];
  if (css.includes('.header')) {
    // Find all CSS rules containing .header
    const ruleRegex = /(\.[a-zA-Z0-9\-\.\#\_\>\:\s\,]+)\{([^\}]*)\}/g;
    let ruleMatch;
    while ((ruleMatch = ruleRegex.exec(css)) !== null) {
      const selector = ruleMatch[1].trim();
      const body = ruleMatch[2].trim();
      if (selector.includes('.header') || selector.includes('.logo') || selector.includes('.topbar')) {
        console.log(`${selector} { ${body} }`);
      }
    }
  }
}
