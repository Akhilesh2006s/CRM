import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/screens');

const TARGETS = [
  'DC/DCCaptureScreen.tsx',
  'DC/DCListScreen.tsx',
  'ExecutiveManagers/ExecutiveManagerExecutivesScreen.tsx',
  'Expenses/ExpenseDetailScreen.tsx',
  'Expenses/ExpenseExecutiveManagerPendingScreen.tsx',
  'Expenses/ExpenseListScreen.tsx',
  'Expenses/ExpenseResubmitScreen.tsx',
  'Franchises/FranchiseDetailScreen.tsx',
  'Leads/LeadsRenewalListScreen.tsx',
  'Leaves/LeaveListScreen.tsx',
  'Partner/PartnerDCsScreen.tsx',
  'Partner/PartnerStocksScreen.tsx',
  'Payments/PaymentListScreen.tsx',
  'Products/DeliverablesListScreen.tsx',
  'Products/DeliverableViewScreen.tsx',
  'Products/VendorAssignCostScreen.tsx',
  'Products/VendorDetailScreen.tsx',
  'Products/VendorNewScreen.tsx',
  'Products/VendorsListScreen.tsx',
  'Settings/SettingsExpensesScreen.tsx',
];

function prefix(r) {
  const d = r.split('/').length - 1;
  return '../'.repeat(d + 1);
}

function addImports(src, p) {
  if (src.includes('ScreenShell')) return src;
  const block =
    `import ScreenShell, { PageSection } from '${p}ui/ScreenShell';\n` +
    `import { WebInput, WebButton, DataTable } from '${p}ui/WebPrimitives';\n`;
  const lastImport = src.lastIndexOf('\nimport ');
  const insertAt = src.indexOf('\n', lastImport) + 1;
  return src.slice(0, insertAt) + block + src.slice(insertAt);
}

function migrateScrollView(src, title) {
  if (src.includes('<ScreenShell')) return src;
  src = src.replace(
    /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\([\s\S]*?\);\s*\}\s*\n?/g,
    ''
  );
  const m = src.match(/return\s*\(\s*\n?\s*<ScrollView/);
  if (!m) return null;
  const start = m.index;
  let depth = 0;
  let i = start + 'return ('.length;
  for (; i < src.length; i++) {
    if (src[i] === '(') depth++;
    if (src[i] === ')') {
      if (depth === 0) {
        const end = i + 1;
        const inner = src
          .slice(start, end)
          .replace(/return\s*\(\s*\n?\s*<ScrollView[^>]*>/s, '')
          .replace(/\s*<\/ScrollView>\s*\)\s*$/s, '');
        const wrapped = `return (
    <ScreenShell title="${title}" loading={loading}>
      <PageSection title="${title}">
${inner.trim()}
      </PageSection>
    </ScreenShell>
  );`;
        return src.slice(0, start) + wrapped + src.slice(end + 1);
      }
      depth--;
    }
  }
  return null;
}

function migrateViewContainer(src, title) {
  if (src.includes('<ScreenShell')) return src;
  src = src.replace(
    /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\([\s\S]*?\);\s*\}\s*\n?/g,
    ''
  );
  const m = src.match(/return\s*\(\s*\n?\s*<View style=\{styles\.container\}>/);
  if (!m) return null;
  const start = m.index;
  let depth = 0;
  let i = start + 'return ('.length;
  for (; i < src.length; i++) {
    if (src[i] === '(') depth++;
    if (src[i] === ')') {
      if (depth === 0) {
        const end = i + 1;
        const inner = src
          .slice(start, end)
          .replace(/return\s*\(\s*\n?\s*<View style=\{styles\.container\}>\s*/s, '')
          .replace(/\s*<\/View>\s*\)\s*$/s, '');
        const hasRefresh = /\brefreshing\b/.test(src);
        const refreshProps = hasRefresh
          ? `\n      loading={loading}\n      refreshing={refreshing}\n      onRefresh={() => { setRefreshing(true); load(); }}`
          : `\n      loading={loading}`;
        const wrapped = `return (
    <ScreenShell title="${title}"${refreshProps}>
      <PageSection title="${title}">
${inner.trim()}
      </PageSection>
    </ScreenShell>
  );`;
        return src.slice(0, start) + wrapped + src.slice(end + 1);
      }
      depth--;
    }
  }
  return null;
}

function titleFromPath(r) {
  const base = path.basename(r, '.tsx').replace(/Screen$/, '');
  return base.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

const updated = [];
const failed = [];

for (const rel of TARGETS) {
  const fp = path.join(ROOT, rel);
  if (!fs.existsSync(fp)) {
    failed.push({ rel, reason: 'missing' });
    continue;
  }
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('ScreenShell')) continue;
  const p = prefix(rel);
  const title = titleFromPath(rel);
  src = addImports(src, p);
  let next = migrateScrollView(src, title);
  if (!next) next = migrateViewContainer(src, title);
  if (!next) {
    failed.push({ rel, reason: 'no matching return' });
    continue;
  }
  src = next.replace(/<TextInput/g, '<WebInput');
  src = src.replace(
    /<TouchableOpacity style=\{styles\.(btn|addBtn)[^}]*\}[^>]*>\s*<Text[^>]*>([^<]+)<\/Text>\s*<\/TouchableOpacity>/g,
    '<WebButton title="$2" onPress={...} />'
  );
  fs.writeFileSync(fp, src);
  updated.push(rel);
}

console.log('Updated', updated.length, updated);
console.log('Failed', failed);
