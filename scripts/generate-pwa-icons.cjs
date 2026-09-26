const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  const masterImagePath = path.join(publicDir, 'traffic-logo.png');
  const svgPath = path.join(publicDir, 'icon.svg');
  
  // Use traffic-logo.png if present, fallback to icon.svg
  const imageSource = fs.existsSync(masterImagePath) ? masterImagePath : svgPath;
  const imageBuffer = fs.readFileSync(imageSource);

  console.log(`Generating PWA Icons from ${path.basename(imageSource)}...`);

  // 1. 192x192 Standard PWA Icon
  await sharp(imageBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 5, g: 8, b: 14, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 2. 512x512 Standard PWA Icon
  await sharp(imageBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 5, g: 8, b: 14, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 3. 512x512 Maskable Icon (Centered with safe 10-15% padding so Android circles/squircles don't clip)
  const innerIcon = await sharp(imageBuffer)
    .resize(400, 400, { fit: 'contain', background: { r: 5, g: 8, b: 14, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 5, g: 8, b: 14, alpha: 1 } // #05080E matching background
    }
  })
    .composite([{ input: innerIcon, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 4. Apple Touch Icon (180x180 for iOS Safari)
  await sharp(imageBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 5, g: 8, b: 14, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 5. Favicon 64x64 / 32x32
  await sharp(imageBuffer)
    .resize(64, 64, { fit: 'contain', background: { r: 5, g: 8, b: 14, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');

  console.log('All PWA Icons generated successfully!');
}

generateIcons().catch(err => {
  console.warn('Notice generating icons (using existing static icons):', err.message);
  process.exit(0);
});
