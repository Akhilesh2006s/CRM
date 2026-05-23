/**
 * Semi-automated ScreenShell migration for *Screen.tsx files.
 * Run: node scripts/migrate-screen-shell.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENS_ROOT = path.join(__dirname, '../src/screens');

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
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith('Screen.tsx')) acc.push(p);
  }
  return acc;
}

function rel(fp) {
  return path.relative(SCREENS_ROOT, fp).replace(/\\/g, '/');
}

function uiDepth(relPath) {
  const depth = relPath.split('/').length - 1;
  return '../'.repeat(depth + 1);
}

function extractTitle(src) {
  const m =
    src.match(/headerTitle[^>]*>\s*\{?['"`]([^'"`]+)['"`]\}?\s*</) ||
    src.match(/<Text[^>]*style=\{[^}]*headerTitle[^}]*\}[^>]*>\s*\{?['"`]([^'"`]+)['"`]\}?/) ||
    src.match(/<Text[^>]*style=\{styles\.headerTitle\}[^>]*>\s*\{([^}]+)\}/);
  if (m) return m[1].replace(/['"`]/g, '').trim();
  const name = path.basename(relPath, '.tsx').replace(/Screen$/, '');
  return name.replace(/([A-Z])/g, ' $1').trim();
}

function stripLinearGradientHeader(src) {
  return src.replace(
    /<LinearGradient[\s\S]*?<\/LinearGradient>\s*/g,
    ''
  );
}

function removeImports(src) {
  let s = src;
  s = s.replace(/^import\s+.*from\s+['"]expo-linear-gradient['"];?\s*\n/gm, '');
  s = s.replace(/^import\s+.*gradients.*from\s+['"][^'"]*theme\/colors['"];?\s*\n/gm, '');
  s = s.replace(/^import\s+.*typography.*from\s+['"][^'"]*theme\/typography['"];?\s*\n/gm, '');
  s = s.replace(/^import\s+LogoutButton\s+from\s+['"][^'"]+['"];?\s*\n/gm, '');
  return s;
}

function ensureUiImports(src, prefix) {
  if (src.includes('ScreenShell')) return src;
  const shellImport = `import ScreenShell, { PageSection } from '${prefix}ui/ScreenShell';\n`;
  const primImport = `import { WebInput, WebButton, WebSelect, DataTable, WebLabel } from '${prefix}ui/WebPrimitives';\n`;
  const apiIdx = src.search(/^import\s/m);
  if (apiIdx === -1) return shellImport + primImport + src;
  const firstImportEnd = src.indexOf('\n', src.indexOf('import'));
  let insertAt = 0;
  let i = 0;
  while (i < src.length) {
    const lineStart = i;
    const lineEnd = src.indexOf('\n', i);
    const line = src.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (!line.startsWith('import ')) break;
    insertAt = lineEnd === -1 ? src.length : lineEnd + 1;
    i = insertAt;
  }
  return src.slice(0, insertAt) + shellImport + primImport + src.slice(insertAt);
}

function removeEarlyLoadingReturn(src) {
  return src.replace(
    /if\s*\(\s*loading\s*&&\s*!refreshing\s*\)\s*\{\s*return\s*\([\s\S]*?\);\s*\}\s*\n?/g,
    ''
  );
}

function wrapReturnInScreenShell(src, title) {
  if (src.includes('<ScreenShell')) return src;

  const hasRefreshing = /refreshing/.test(src) && /onRefresh/.test(src);
  const loadingProp = 'loading={loading && !refreshing}';
  const refreshProps = hasRefreshing
    ? `\n      refreshing={refreshing}\n      onRefresh={onRefresh}`
    : /\bloading\b/.test(src)
      ? `\n      loading={loading}`
      : '';

  // Replace outer View container + optional ScrollView wrapper pattern
  const returnMatch = src.match(/return\s*\(\s*\n?\s*<View style=\{styles\.container\}>/);
  if (returnMatch) {
    const start = returnMatch.index;
    // Find matching closing for ScreenShell - replace first return block
    let depth = 0;
    let i = start + 'return ('.length;
    let bodyStart = -1;
    let bodyEnd = -1;
    while (i < src.length) {
      if (src[i] === '(') depth++;
      if (src[i] === ')') {
        depth--;
        if (depth === 0) {
          bodyEnd = i;
          break;
        }
      }
      i++;
    }
    if (bodyEnd === -1) return src;

    const fullReturn = src.slice(start, bodyEnd + 2);
    // Extract inner content after header strip already done
    let inner = fullReturn
      .replace(/return\s*\(\s*\n?\s*<View style=\{styles\.container\}>\s*/s, '')
      .replace(/\s*<\/View>\s*\)\s*;?\s*$/s, '');

    // Unwrap lone ScrollView if it wraps everything
    inner = inner.replace(
      /^\s*<ScrollView[^>]*refreshControl=\{[^}]+\}[^>]*>\s*/s,
      ''
    );
    inner = inner.replace(/\s*<\/ScrollView>\s*$/s, '');

    const wrapped = `return (
    <ScreenShell
      title="${title}"${refreshProps ? refreshProps : ''}
      ${loadingProp.includes('loading') ? loadingProp : ''}
    >
      <PageSection title="${title}">
${inner.trim()}
      </PageSection>
    </ScreenShell>
  );`;

    return src.slice(0, start) + wrapped + src.slice(bodyEnd + 2);
  }

  return src;
}

function cleanupStyles(src) {
  const keys = [
    'container',
    'header',
    'headerContent',
    'backButton',
    'backIcon',
    'headerTitle',
    'placeholder',
    'loadingContainer',
    'loadingText',
  ];
  let s = src;
  for (const k of keys) {
    s = s.replace(new RegExp(`\\s*${k}:\\s*\\{[^}]*\\},?\\n`, 'g'), '');
    s = s.replace(new RegExp(`\\s*${k}:\\s*\\{[\\s\\S]*?\\},?\\n`, 'g'), '');
  }
  return s;
}

function migrateFile(fp) {
  const r = rel(fp);
  if (SKIP.has(r)) return { r, status: 'skipped' };
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('ScreenShell')) return { r, status: 'already' };

  const prefix = uiDepth(r);
  const title = extractTitle(src);
  const hadGradient = src.includes('LinearGradient');

  try {
    src = removeImports(src);
    if (hadGradient) {
      src = stripLinearGradientHeader(src);
      src = removeEarlyLoadingReturn(src);
    }
    src = ensureUiImports(src, prefix);
    if (hadGradient) {
      src = wrapReturnInScreenShell(src, title);
      src = cleanupStyles(src);
    } else {
      // Non-gradient: minimal wrap if simple ScrollView root
      if (!src.includes('<ScreenShell') && /return\s*\(\s*\n?\s*<ScrollView/.test(src)) {
        src = src.replace(
          /return\s*\(\s*\n?\s*<ScrollView([^>]*)>/,
          `return (
    <ScreenShell title="${title}" loading={loading}>
      <PageSection title="${title}">`
        );
        src = src.replace(/\s*<\/ScrollView>\s*\)\s*;/, `
      </PageSection>
    </ScreenShell>
  );`);
        src = ensureUiImports(src, prefix);
      } else {
        return { r, status: 'manual', reason: 'no gradient, complex layout' };
      }
    }

    // TextInput -> WebInput (simple)
    src = src.replace(/<TextInput(\s)/g, '<WebInput$1');
    src = src.replace(/placeholderTextColor=\{[^}]+\}\s*/g, '');

    fs.writeFileSync(fp, src);
    return { r, status: 'ok' };
  } catch (e) {
    return { r, status: 'error', reason: String(e) };
  }
}

const files = walk(SCREENS_ROOT);
const results = files.map(migrateFile);
const ok = results.filter((x) => x.status === 'ok');
const manual = results.filter((x) => x.status === 'manual');
const skipped = results.filter((x) => x.status === 'skipped' || x.status === 'already');
const errors = results.filter((x) => x.status === 'error');

console.log(JSON.stringify({ ok: ok.length, manual: manual.length, skipped: skipped.length, errors: errors.length }, null, 2));
console.log('MANUAL:', manual.map((m) => m.r).join('\n'));
console.log('ERRORS:', errors);
