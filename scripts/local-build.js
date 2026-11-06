#!/usr/bin/env node
const { spawnSync } = require('child_process');

console.log('[INFO] Running check-node script...');
const check = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', './scripts/check-node.ps1'], { stdio: 'inherit' });
if (check.status !== 0) {
  console.error('[ERROR] check-node failed; aborting local build.');
  process.exit(check.status);
}

console.log('[INFO] Running vercel-build...');
const build = spawnSync('node', ['./node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist'], { stdio: 'inherit' });
process.exit(build.status);
