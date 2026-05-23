import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/screens/Dashboard/DashboardScreen.tsx');
let s = fs.readFileSync(file, 'utf8');

// Fix broken gradient remnants (opening tag left, closed with </View>)
s = s.replace(
  /<LinearGradient\s+colors=\{[^}]+\}\s+start=\{\{ x: 0, y: 0 \}\}\s+end=\{\{ x: 1, y: 1 \}\}\s+style=\{styles\.cardGradient\}\s*>\s*/g,
  '<View style={[styles.cardContent, styles.cardContentWhite]}>\n'
);

s = s.replace(
  /<LinearGradient\s+colors=\{gradients\.primary\}\s+start=\{\{ x: 0, y: 0 \}\}\s+end=\{\{ x: 1, y: 1 \}\}\s+style=\{styles\.header\}\s*>\s*/,
  '<View style={styles.header}>\n'
);

s = s.replace(/cardArrowWhiteContainer/g, 'cardArrowContainer');
s = s.replace(/styles\.cardIconWhite/g, 'styles.cardIcon');

// Remove duplicate nested wrappers
s = s.replace(
  /<View style=\{styles\.cardContentWhite\}>\s*<View style=\{styles\.cardContent\}>/g,
  '<View style={[styles.cardContent, styles.cardContentWhite]}>'
);
s = s.replace(
  /<View style=\{styles\.cardContentWhite\}>\s*<View style=\{\[styles\.cardContent, styles\.cardContentWhite\]\}>/g,
  '<View style={[styles.cardContent, styles.cardContentWhite]}>'
);

// Add cardIcon style alias if missing
if (!s.includes('cardIcon:')) {
  s = s.replace(
    /cardIcon: \{/,
    'cardIcon: {\n    fontSize: 28,\n  },\n  cardIconDark: {'
  );
}

fs.writeFileSync(file, s);
console.log('Fixed', (s.match(/LinearGradient/g) || []).length, 'LinearGradient refs left');
