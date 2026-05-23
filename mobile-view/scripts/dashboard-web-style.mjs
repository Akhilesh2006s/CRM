import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/screens/Dashboard/DashboardScreen.tsx');
let s = fs.readFileSync(file, 'utf8');

// Remove LinearGradient import if unused after
s = s.replace(
  /import \{ LinearGradient \} from 'expo-linear-gradient';\n/,
  ''
);
s = s.replace(/import \{ colors, gradients \}/, 'import { colors }');

// Unwrap <LinearGradient ... style={styles.cardGradient}> ... </LinearGradient> -> inner only with white wrapper
s = s.replace(
  /<LinearGradient[\s\S]*?style=\{styles\.cardGradient\}>\s*/g,
  '<View style={styles.cardContentWhite}>\n'
);
s = s.replace(/<\/LinearGradient>/g, '</View>');

// Header: gradient -> white bar
s = s.replace(
  /<LinearGradient\s+colors=\{gradients\.primary\}[\s\S]*?style=\{styles\.header\}>\s*/,
  '<View style={styles.header}>\n'
);
// fix header text colors for light bg
s = s.replace(/color: colors\.textLight/g, 'color: colors.textPrimary');

// role badge on light header
s = s.replace(
  "backgroundColor: 'rgba(255, 255, 255, 0.2)'",
  "backgroundColor: colors.successLight"
);
s = s.replace(
  "borderColor: 'rgba(255, 255, 255, 0.35)'",
  'borderColor: colors.border'
);
s = s.replace(
  "backgroundColor: 'rgba(255, 255, 255, 0.15)'",
  'backgroundColor: colors.backgroundMuted'
);
s = s.replace(
  "borderColor: 'rgba(255, 255, 255, 0.25)'",
  'borderColor: colors.border'
);
s = s.replace(
  "backgroundColor: 'rgba(255, 255, 255, 0.1)'",
  'backgroundColor: colors.backgroundLight'
);

// card titles inside former gradients should use white variant styles
s = s.replace(/styles\.cardTitle(?!White)/g, 'styles.cardTitleWhite');
s = s.replace(/styles\.cardSubtitle(?!White)/g, 'styles.cardSubtitleWhite');
s = s.replace(/styles\.cardArrow(?!White)/g, 'styles.cardArrowWhite');
s = s.replace(/styles\.cardIcon(?!White|Container)/g, 'styles.cardIconWhite');

s = s.replace(/styles\.header,\n/, 'styles.header,\n');
s = s.replace(
  /header: \{[\s\S]*?elevation: 12,\n  \},/,
  `header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 20,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },`
);

fs.writeFileSync(file, s);
console.log('Dashboard updated');
