#!/usr/bin/env node
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const CERT_DIR = path.join(__dirname, '..', 'certificates');
const OUT_FILE = path.join(CERT_DIR, 'index.json');

async function build() {
  try {
    const files = await fsp.readdir(CERT_DIR);
    const items = files
      .filter(f => !f.startsWith('.'))
      .map(f => {
        const ext = path.extname(f).toLowerCase();
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const type = imageExts.includes(ext) ? 'image' : (ext === '.pdf' ? 'pdf' : 'file');
        return {
          name: f,
          filename: f,
          url: `certificates/${encodeURI(f)}`,
          type,
        };
      });

    await fsp.writeFile(OUT_FILE, JSON.stringify(items, null, 2), 'utf8');
    console.log(`Wrote ${OUT_FILE} (${items.length} entries)`);
  } catch (err) {
    console.error('Error building certificate index:', err.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch');

  build();

  if (watch) {
    console.log('Watching certificates folder for changes...');
    fs.watch(CERT_DIR, { persistent: true }, (eventType, filename) => {
      if (!filename) return;
      console.log('Change detected:', eventType, filename);
      // Debounce quick changes
      if (global._genTimeout) clearTimeout(global._genTimeout);
      global._genTimeout = setTimeout(() => build(), 250);
    });
  }
}
