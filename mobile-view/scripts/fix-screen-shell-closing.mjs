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
  if (!src.includes('ScreenShell')) continue;
  const before = src;
  // Remove stray container </View> immediately before </ScreenShell>
  src = src.replace(/\n\s*<\/View>\s*\n(\s*<\/ScreenShell>)/g, '\n$1');
  if (src !== before) {
    fs.writeFileSync(fp, src);
    fixed++;
  }
}
console.log('Fixed', fixed, 'files');
