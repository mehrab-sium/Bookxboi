const fs = require('fs');
const path = 'src/components/ReaderApp.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/var\(--font-ui\)/g, 'var(--font-sans)');
content = content.replace(/var\(--font-title\)/g, 'var(--font-display)');
content = content.replace(/var\(--color-tp\)/g, 'var(--color-contrast-midnight)');
content = content.replace(/var\(--color-ts\)/g, 'rgba(28, 35, 33, 0.7)');
content = content.replace(/var\(--color-tm\)/g, 'rgba(28, 35, 33, 0.4)');
content = content.replace(/var\(--color-acc\)/g, 'var(--color-contrast-sepia)');
content = content.replace(/var\(--color-s1\)/g, 'var(--color-canvas-light)');
content = content.replace(/var\(--border\)/g, 'rgba(28, 35, 33, 0.1)');

fs.writeFileSync(path, content, 'utf8');
console.log('Replacements complete.');
