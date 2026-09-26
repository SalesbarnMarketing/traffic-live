const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outJpg = path.join(process.cwd(), 'public', 'ads', 'banner-ad-1789199776018.jpg');
const distAdsDir = path.join(process.cwd(), 'dist', 'ads');
const distJpg = path.join(distAdsDir, 'banner-ad-1789199776018.jpg');

const cmd = [
  'convert',
  '-size 1200x630',
  'gradient:"#0b1528"-"#050811"',
  // Top bright amber/sky accent stripe
  '-fill "#f59e0b" -draw "rectangle 0,0 1200,8"',
  // Sponsor Badge
  '-fill "#0f172a" -stroke "#f59e0b" -strokewidth 2 -draw "roundrectangle 60,40 320,78 12,12"',
  '-stroke none -fill "#f59e0b" -font "Helvetica-Bold" -pointsize 15 -annotate +78+65 "⚡ OFFICIAL SPONSOR"',
  // Main Title
  '-fill "#ffffff" -font "Helvetica-Bold" -pointsize 54 -annotate +60+155 "PROSTAR ELECTRICAL"',
  // Subtitle
  '-fill "#38bdf8" -font "Helvetica-Bold" -pointsize 22 -annotate +60+198 "Certified Residential, Commercial & Industrial Solutions"',
  // Service Highlights Card
  '-fill "#101d36" -stroke "#1e293b" -strokewidth 2 -draw "roundrectangle 60,230 1140,320 14,14"',
  '-stroke none -fill "#38bdf8" -font "Helvetica-Bold" -pointsize 16 -annotate +85+282 "✓ COC Certificates"',
  '-fill "#38bdf8" -font "Helvetica-Bold" -pointsize 16 -annotate +330+282 "✓ Solar & Inverters"',
  '-fill "#38bdf8" -font "Helvetica-Bold" -pointsize 16 -annotate +590+282 "✓ Faults & Rewiring"',
  '-fill "#f59e0b" -font "Helvetica-Bold" -pointsize 16 -annotate +840+282 "✓ 24/7 Emergency Callout"',
  // Action / Contact Box
  '-fill "#0a1020" -stroke "#334155" -strokewidth 2 -draw "roundrectangle 60,350 1140,510 16,16"',
  '-stroke none -fill "#ffffff" -font "Helvetica-Bold" -pointsize 26 -annotate +95+405 "Fast, Reliable & Licensed Electricians in Gauteng"',
  '-fill "#94a3b8" -font "Helvetica" -pointsize 18 -annotate +95+445 "Compliance certificates, backup power, distribution boards & repairs."',
  // Contact details
  '-fill "#38bdf8" -font "Helvetica-Bold" -pointsize 17 -annotate +95+485 "📞 Phone: 072 107 4388    ✉️ Email: sales@prostarelectrical.co.za"',
  // CTA Button
  '-fill "#f59e0b" -draw "roundrectangle 880,410 1110,470 12,12"',
  '-fill "#0f172a" -font "Helvetica-Bold" -pointsize 17 -annotate +910+447 "VISIT WEBSITE ➔"',
  // Footer text
  '-fill "#64748b" -font "Helvetica-Bold" -pointsize 14 -annotate +60+570 "🌐 https://prostarelectrical.co.za  •  South Africa"',
  '-quality 92',
  `"${outJpg}"`
].join(' ');

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Successfully created Prostar Electrical JPEG banner with Helvetica!');
  if (!fs.existsSync(distAdsDir)) fs.mkdirSync(distAdsDir, { recursive: true });
  fs.copyFileSync(outJpg, distJpg);
  console.log('Mirrored to dist/ads/banner-ad-1789199776018.jpg');
} catch (e) {
  console.error('Error creating banner:', e.message);
}
