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

let fixed = 0;
for (const fp of walk(ROOT)) {
  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes('</ScreenShell>')) continue;
  const before = src;
  // Broken pattern from codemod: closes old View return then ScreenShell outside
  src = src.replace(/\s*<\/View>\s*\);\s*\n\s*<\/ScreenShell>\s*\)\s*\n/g, '\n    </ScreenShell>\n  );\n');
  src = src.replace(/\s*\);\s*\n\s*<\/ScreenShell>\s*\)\s*\n/g, '\n  );\n');
  if (src !== before) {
    fs.writeFileSync(fp, src);
    fixed++;
    console.log('fixed', path.relative(ROOT, fp));
  }
}
console.log('Total fixed:', fixed);
