const fs = require('fs');
const path = require('path');

const baseConfig = JSON.parse(fs.readFileSync('./.electronbuildrc', 'utf8'));

module.exports = {
  ...baseConfig,
  publish: {
    provider: 'github',
    owner: 'jamaljsr',
    repo: 'polar',
    private: false,
  },
  afterAllArtifactBuild: async context => {
    // Delete blockmap files before publishing
    const distDir = context.outDir || 'dist';
    if (!fs.existsSync(distDir)) {
      return;
    }
    const files = fs.readdirSync(distDir);
    files.forEach(file => {
      if (file.endsWith('.blockmap')) {
        const filePath = path.join(distDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted blockmap file: ${file}`);
        } catch (err) {
          console.warn(`Failed to delete ${file}:`, err.message);
        }
      }
    });
  },
};
