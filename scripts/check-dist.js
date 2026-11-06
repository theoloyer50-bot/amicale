const fs = require('fs');
const path = require('path');
const distPath = path.resolve(__dirname, '..', 'dist');
const buildPath = path.resolve(__dirname, '..', 'build');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const target = fs.readlinkSync(srcPath);
      try { fs.symlinkSync(target, destPath); } catch (e) { fs.copyFileSync(srcPath, destPath); }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function listAndExit(dir, label) {
  console.log(`${label} directory exists: ${dir}`);
  const files = fs.readdirSync(dir);
  console.log('Contents:', files.slice(0, 50));
  process.exit(0);
}

// If both exist - all good
if (fs.existsSync(distPath) && fs.existsSync(buildPath)) {
  console.log('Both dist and build exist.');
  listAndExit(distPath, 'dist');
}

// If dist exists but build missing, copy dist -> build so Vercel expecting 'build' will find it
if (fs.existsSync(distPath) && !fs.existsSync(buildPath)) {
  console.warn(`build not found, but found dist at ${distPath}. Copying dist -> build...`);
  try {
    copyDir(distPath, buildPath);
    listAndExit(buildPath, 'build');
  } catch (err) {
    console.error('Failed to copy dist to build:', err);
    process.exit(1);
  }
}

// If build exists but dist missing, copy build -> dist
if (fs.existsSync(buildPath) && !fs.existsSync(distPath)) {
  console.warn(`dist not found, but found build at ${buildPath}. Copying build -> dist...`);
  try {
    copyDir(buildPath, distPath);
    listAndExit(distPath, 'dist');
  } catch (err) {
    console.error('Failed to copy build to dist:', err);
    process.exit(1);
  }
}

console.error(`\nERROR: Neither 'dist' nor 'build' directories were found after the build. Please ensure the build step generates one of them.`);
process.exit(1);
