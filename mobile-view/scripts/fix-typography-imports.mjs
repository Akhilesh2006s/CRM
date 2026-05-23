import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/screens');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('Screen.tsx')) acc.push(p);
  }
  return acc;
}

function depthPrefix(fp) {
  const r = path.relative(ROOT, fp).replace(/\\/g, '/');
  const d = r.split('/').length - 1;
  return '../'.repeat(d + 1);
}

let fixed = 0;
for (const fp of walk(ROOT)) {
  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes('...typography')) continue;
  if (src.includes('theme/typography')) continue;
  const prefix = depthPrefix(fp);
  const imp = `import { typography } from '${prefix}theme/typography';\n`;
  const colorsMatch = src.match(/^import\s+\{[^}]+\}\s+from\s+['"][^'"]*theme\/colors['"];?\n/m);
  if (colorsMatch) {
    const idx = src.indexOf(colorsMatch[0]) + colorsMatch[0].length;
    src = src.slice(0, idx) + imp + src.slice(idx);
  } else {
    src = imp + src;
  }
  fs.writeFileSync(fp, src);
  fixed++;
}
console.log('Fixed typography imports:', fixed);
