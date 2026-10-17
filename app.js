/**
 * Standalone Production Entry Point for cPanel / Phusion Passenger / Afrihost
 * Automatically detects and executes the pre-compiled production server or tsx runtime.
 */
const path = require('path');
const fs = require('fs');

const distServer = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(distServer)) {
  console.log('[Afrihost Boot] Launching compiled production server from dist/server.cjs...');
  require(distServer);
} else {
  console.log('[Afrihost Boot] dist/server.cjs not found, launching TypeScript server via tsx...');
  try {
    require('tsx/cjs');
    require('./server.ts');
  } catch (err) {
    console.error('[Afrihost Boot Error] Failed to launch server:', err.message);
    throw err;
  }
}
