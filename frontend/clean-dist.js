const fs = require('fs');
const path = require('path');

const distDownloadPath = path.join(__dirname, 'dist', 'download');
if (fs.existsSync(distDownloadPath)) {
  console.log('Cleaning up dist/download folder to avoid nesting APKs/AABs inside the build...');
  fs.rmSync(distDownloadPath, { recursive: true, force: true });
}

const assetsDownloadPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'assets', 'public', 'download');
if (fs.existsSync(assetsDownloadPath)) {
  console.log('Cleaning up android assets download folder...');
  fs.rmSync(assetsDownloadPath, { recursive: true, force: true });
}

console.log('Clean-up complete!');
