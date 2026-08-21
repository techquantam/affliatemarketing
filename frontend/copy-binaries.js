const fs = require('fs');
const path = require('path');

const frontendDir = __dirname;
const rootDir = path.join(frontendDir, '..');

const paths = {
  apkDebug: path.join(frontendDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
  apkRelease: path.join(frontendDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  aabDebug: path.join(frontendDir, 'android', 'app', 'build', 'outputs', 'bundle', 'debug', 'app-debug.aab'),
  aabRelease: path.join(frontendDir, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')
};

const targets = [
  path.join(rootDir, 'build-output'),
  path.join(frontendDir, 'public', 'download')
];

// Ensure targets exist
targets.forEach(targetDir => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Created target directory: ${targetDir}`);
  }
});

function copyFileIfExists(src, destName) {
  if (fs.existsSync(src)) {
    targets.forEach(targetDir => {
      const dest = path.join(targetDir, destName);
      fs.copyFileSync(src, dest);
      console.log(`Copied: ${path.basename(src)} -> ${dest}`);
    });
  } else {
    console.warn(`Warning: Source file not found: ${src}`);
  }
}

console.log('Copying generated binaries to build-output and frontend public download folder...');
copyFileIfExists(paths.apkDebug, 'LIO_MART_debug.apk');
copyFileIfExists(paths.apkRelease, 'LIO_MART_release.apk');
copyFileIfExists(paths.aabDebug, 'LIO_MART_debug.aab');
copyFileIfExists(paths.aabRelease, 'LIO_MART_release.aab');

console.log('Update of binary locations complete!');
