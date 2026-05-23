import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets');

/** Re-encode PNGs so Android AAPT2 accepts them (8-bit RGB/RGBA, no interlace). */
async function fixPng(file, opts = {}) {
  const input = path.join(assets, file);
  if (!fs.existsSync(input)) {
    console.warn('Skip missing', file);
    return;
  }
  const tmp = input + '.tmp.png';
  let pipeline = sharp(input);
  if (opts.maxWidth) {
    pipeline = pipeline.resize(opts.maxWidth, opts.maxWidth, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  if (opts.flatten) {
    pipeline = pipeline.flatten({ background: '#000000' });
  }
  await pipeline
    .png({ compressionLevel: 9, palette: false, effort: 10 })
    .toFile(tmp);
  fs.renameSync(tmp, input);
  const meta = await sharp(input).metadata();
  console.log(`Fixed ${file}: ${meta.width}x${meta.height} ${meta.format} ${meta.channels}ch`);
}

const src =
  process.argv[2] ||
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../assets/c__Users_Asus_AppData_Roaming_Cursor_User_workspaceStorage_46181d176259486654090e0ce54fb409_images__2AF9B6AF-159E-4598-A3CE-F61C7D3D2FBE_-a98a1669-f042-4b92-82db-f442f54fbab7.png'
  );

if (fs.existsSync(src)) {
  await sharp(src)
    .resize(800, 800, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(path.join(assets, 'logo.png'));
  await sharp(src)
    .resize(512, 512, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(path.join(assets, 'logo-login.png'));
  console.log('Wrote logo.png and logo-login.png from source');
}

await fixPng('icon.png', { maxWidth: 1024, flatten: true });
await fixPng('adaptive-icon.png', { maxWidth: 1024, flatten: true });
await fixPng('splash-icon.png', { maxWidth: 512, flatten: true });
await fixPng('logo.png', { flatten: true });
await fixPng('logo-login.png', { flatten: true });
if (fs.existsSync(path.join(assets, 'splash-full.png'))) {
  await fixPng('splash-full.png', { maxWidth: 1284, flatten: true });
}
console.log('All PNGs re-encoded for Android');
