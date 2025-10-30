const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');
const png2icons = require('png2icons');

// Source PNG path: prefer public/logo.png if present, otherwise fallback to images-removebg-preview.png
const preferred = path.resolve(__dirname, '../public/logo.png');
const fallback = path.resolve(__dirname, '../public/images-removebg-preview.png');
let src = preferred;
if (!fs.existsSync(src)) {
  if (fs.existsSync(fallback)) {
    src = fallback;
  } else {
    console.error('No source image found. Checked:', preferred, fallback);
    process.exit(1);
  }
}
if (!fs.existsSync(src)) {
  console.error('Source image not found:', src);
  process.exit(1);
}

const outDir = path.resolve(__dirname, '../build');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async () => {
  try {
    // Create ICO containing multiple sizes
    const icoBuf = await pngToIco(src);
    fs.writeFileSync(path.join(outDir, 'icon.ico'), icoBuf);
    console.log('Wrote', path.join(outDir, 'icon.ico'));

    // Create ICNS
    const pngBuf = fs.readFileSync(src);
    const icnsBuf = png2icons.createICNS(pngBuf, png2icons.B256);
    if (icnsBuf) {
      fs.writeFileSync(path.join(outDir, 'icon.icns'), icnsBuf);
      console.log('Wrote', path.join(outDir, 'icon.icns'));
    } else {
      console.warn('Failed to create ICNS (png2icons returned null)');
    }

    // Also write several sized PNGs for Linux/icon sets
    const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
    const sharp = require('sharp');
    const iconsPngDir = path.join(outDir, 'icons');
    if (!fs.existsSync(iconsPngDir)) fs.mkdirSync(iconsPngDir, { recursive: true });
    for (const s of sizes) {
      const outPath = path.join(iconsPngDir, `icon_${s}x${s}.png`);
      await sharp(src).resize(s, s).toFile(outPath);
      console.log('Wrote', outPath);
    }

    console.log('\nIcon generation complete.');
    console.log('Place the resulting files under your build/ directory; electron-builder will pick up icon.ico and icon.icns.');
  } catch (err) {
    console.error('Icon generation failed:', err);
    process.exit(1);
  }     
})();
