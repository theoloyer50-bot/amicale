const fs = require('fs');
const path = require('path');
const distPath = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(distPath)) {
  console.error(`Build output directory not found: ${distPath}`);
  process.exit(1);
}

console.log(`Build output directory exists: ${distPath}`);
console.log('Contents:', fs.readdirSync(distPath).slice(0, 50));
