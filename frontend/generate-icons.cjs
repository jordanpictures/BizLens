const fs = require('fs');
const sharp = require('sharp');

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/favicon.svg');
  
  await sharp(svgBuffer)
    .resize(192, 192)
    .toFile('public/pwa-192x192.png');
    
  await sharp(svgBuffer)
    .resize(512, 512)
    .toFile('public/pwa-512x512.png');
    
  console.log('Icons generated successfully.');
}

generateIcons().catch(console.error);
