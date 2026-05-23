import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assets = path.join(root, 'assets');

const src =
  process.argv[2] ||
  path.join(
    root,
    '..',
    'assets',
    'c__Users_Asus_AppData_Roaming_Cursor_User_workspaceStorage_46181d176259486654090e0ce54fb409_images_1796317c-ddf1-4193-a147-f0892a84e2df-8eb9ecbf-6034-4f68-8fda-dfea091167bf.png'
  );

if (!fs.existsSync(src)) {
  console.error('Source logo not found:', src);
  process.exit(1);
}

fs.mkdirSync(assets, { recursive: true });

const black = { r: 0, g: 0, b: 0, alpha: 1 };

async function writeIcon(out, size, padding = 0.12) {
  const pad = Math.round(size * padding);
  const inner = size - pad * 2;
  await sharp(src)
    .resize(inner, inner, { fit: 'contain', background: black })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: black,
    })
    .png()
    .toFile(out);
  console.log('Wrote', out);
}

await writeIcon(path.join(assets, 'icon.png'), 1024, 0.1);
await writeIcon(path.join(assets, 'adaptive-icon.png'), 1024, 0.14);
await writeIcon(path.join(assets, 'splash-icon.png'), 512, 0.08);
await sharp(src)
  .resize(1284, 1284, { fit: 'contain', background: black })
  .png()
  .toFile(path.join(assets, 'splash-full.png'));
console.log('Wrote splash-full.png');
await fs.promises.copyFile(src, path.join(assets, 'logo-source.png'));
console.log('Done');
