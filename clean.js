const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Remove dist folder
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log('Removed dist folder');
}

// Remove all .css and .css.map files
const patterns = ['**/*.css', '**/*.css.map'];
patterns.forEach(pattern => {
  glob.sync(pattern, { cwd: __dirname, absolute: true, nodir: true }).forEach(file => {
    try {
      fs.unlinkSync(file);
      console.log(`Removed ${file}`);
    } catch (err) {
      console.error(`Failed to remove ${file}:`, err);
    }
  });
});
