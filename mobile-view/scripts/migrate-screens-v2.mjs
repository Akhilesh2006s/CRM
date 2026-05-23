import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/screens');
const SKIP = new Set([
  'Auth/LoginScreen.tsx',
  'Attendance/FirstTimeAttendanceScreen.tsx',
  'Dashboard/DashboardScreen.tsx',
  'Navigation/MoreHubScreen.tsx',
  'Navigation/WorkHubScreen.tsx',
  'Employees/EmployeesZonesScreen.tsx',
  'Employees/EmployeesClustersScreen.tsx',
]);

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('Screen.tsx')) acc.push(p);
  }
  return acc;
}

function rel(fp) {
  return path.relative(ROOT, fp).replace(/\\/g, '/');
}

function uiPrefix(r) {
  const d = r.split('/').length - 1;
  return '../'.repeat(d + 1);
}

function extractTitle(src) {
  const t1 = src.match(/<Text style=\{styles\.headerTitle\}>([^<]+)<\/Text>/);
  if (t1) return t1[1].trim();
  const t2 = src.match(/headerTitle\}>\s*\{([^}]+)\}/);
  if (t2) return t2[1].replace(/['"`]/g, '').trim();
  const base = path.basename(relPath, '.tsx').replace(/Screen$/, '');
  return base.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

let relPath = '';

function addImports(src, prefix) {
  if (src.includes("from '" + prefix + "ui/ScreenShell'")) return src;
  const block =
    `import ScreenShell, { PageSection } from '${prefix}ui/ScreenShell';\n` +
    `import { WebInput, WebButton, WebSelect, DataTable, WebLabel } from '${prefix}ui/WebPrimitives';\n`;
  const idx = src.lastIndexOf('\nimport ');
  if (idx === -1) return block + src;
  const end = src.indexOf('\n', idx + 1);
  let pos = idx;
  while (pos !== -1) {
    const next = src.indexOf('\nimport ', pos + 1);
    if (next === -1) break;
    pos = next;
  }
  const insertAt = src.indexOf('\n', pos) + 1;
  return src.slice(0, insertAt) + block + src.slice(insertAt);
}

function cleanImports(src) {
  return src
    .replace(/^import\s+\{[^}]*LinearGradient[^}]*\}[^;]*;\n/gm, '')
    .replace(/^import\s+\{[^}]*\}\s+from\s+['"]expo-linear-gradient['"];\n/gm, '')
    .replace(/^import\s+\{[^}]*gradients[^}]*\}\s+from\s+['"][^'"]*theme\/colors['"];\n/gm, (m) =>
      m.includes('colors') && !m.match(/colors[^,]*,\s*gradients/) ? m : m.replace(/,?\s*gradients/g, '').replace(/gradients,?\s*/g, '')
    )
    .replace(/^import\s+\{[^}]*\}\s+from\s+['"][^'"]*theme\/typography['"];\n/gm, '')
    .replace(/^import\s+LogoutButton\s+from\s+['"][^'"]+['"];\n/gm, '');
}

function stripHeader(src) {
  return src.replace(/<LinearGradient[\s\S]*?<\/LinearGradient>\s*/g, '');
}

function stripEarlyLoading(src) {
  return src.replace(
    /if\s*\(\s*loading\s*&&\s*!refreshing\s*\)\s*\{\s*return\s*\([\s\S]*?\);\s*\}\s*\n?/,
    ''
  );
}

function wrapContainerReturn(src, title) {
  if (src.includes('<ScreenShell')) return { src, ok: true };

  const re = /return\s*\(\s*\n\s*<View style=\{styles\.container\}>/g;
  const match = re.exec(src);
  if (!match) return { src, ok: false, reason: 'no container return' };

  const start = match.index;
  let depth = 0;
  let i = start + 'return ('.length;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '(') depth++;
    if (ch === ')') {
      if (depth === 0) {
        const end = i + 1;
        const full = src.slice(start, end + 1);
        let inner = full
          .replace(/^return\s*\(\s*\n\s*<View style=\{styles\.container\}>\s*/s, '')
          .replace(/\s*<\/View>\s*\)\s*$/s, '');

        const hasRefresh =
          /const onRefresh/.test(src) || /onRefresh\s*=\s*\(\)/.test(src);
        const hasRefreshing = /\brefreshing\b/.test(src);
        const hasLoading = /\bloading\b/.test(src);

        let shellProps = `title="${title}"`;
        if (hasLoading) shellProps += `\n      loading={loading && !refreshing}`;
        if (hasRefresh && hasRefreshing) {
          shellProps += `\n      refreshing={refreshing}\n      onRefresh={onRefresh}`;
        } else if (hasLoading && !hasRefresh) {
          shellProps = shellProps.replace('loading={loading && !refreshing}', 'loading={loading}');
        }

        const wrapped = `return (
    <ScreenShell
      ${shellProps}
    >
${inner.trimEnd()}
    </ScreenShell>
  )`;

        src = src.slice(0, start) + wrapped + src.slice(end + 1);
        return { src, ok: true };
      }
      depth--;
    }
  }
  return { src, ok: false, reason: 'unbalanced parens' };
}

function migrate(src) {
  const title = extractTitle(src);
  const prefix = uiPrefix(relPath);
  src = cleanImports(src);
  src = addImports(src, prefix);
  src = stripHeader(src);
  src = stripEarlyLoading(src);
  const { src: s2, ok, reason } = wrapContainerReturn(src, title);
  src = s2;
  if (!ok && !src.includes('<ScreenShell')) {
    return { ok: false, reason };
  }
  src = src.replace(/<TextInput/g, '<WebInput');
  src = src.replace(/\s*placeholderTextColor=\{[^}]+\}\s*/g, ' ');
  return { ok: true, src };
}

const files = walk(ROOT);
const updated = [];
const manual = [];

for (const fp of files) {
  relPath = rel(fp);
  if (SKIP.has(relPath)) continue;
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('ScreenShell')) continue;
  const hadGradient = src.includes('LinearGradient');
  if (!hadGradient) {
    manual.push({ relPath, reason: 'no LinearGradient' });
    continue;
  }
  const result = migrate(src);
  if (result.ok) {
    fs.writeFileSync(fp, result.src);
    updated.push(relPath);
  } else {
    manual.push({ relPath, reason: result.reason });
  }
}

console.log('Updated:', updated.length);
updated.forEach((f) => console.log('  OK', f));
console.log('Manual:', manual.length);
manual.forEach((m) => console.log('  MANUAL', m.relPath, m.reason));
