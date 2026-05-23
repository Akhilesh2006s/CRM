import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/screens/Dashboard/DashboardScreen.tsx');
let s = fs.readFileSync(file, 'utf8');

// Remove stray </View> left from LinearGradient unwrap (cardArrow then double-close)
s = s.replace(
  /(<View style={styles\.cardArrowContainer}><Text style={styles\.cardArrowWhite}>›<\/Text><\/View>)\s*<\/View>\s*(<\/View>\s*<\/TouchableOpacity>)/g,
  '$1\n          $2'
);

// Same for multi-line cardArrow blocks
s = s.replace(
  /(<\/View>\s*<Text style={styles\.cardArrowWhite}>›<\/Text>\s*<\/View>)\s*<\/View>\s*(<\/View>\s*<\/TouchableOpacity>)/g,
  '$1\n          $2'
);

fs.writeFileSync(file, s);
console.log('Done');
