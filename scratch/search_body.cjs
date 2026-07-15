const fs = require('fs');
const contentPath = 'C:\\Users\\somul\\.gemini\\antigravity\\brain\\2b8da5d2-ae7e-4cdd-8d51-2780e0082a31\\.system_generated\\steps\\926\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

console.log("=== CHECKING FOR DIV OR BODY ===");
console.log("Contains <body>?", content.includes('<body'));
console.log("Contains <div?", content.includes('<div'));
console.log("Contains <header?", content.includes('<header'));
console.log("Contains <nav?", content.includes('<nav'));
