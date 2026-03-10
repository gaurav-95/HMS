'use strict';
// setup.js — Check better-sqlite3 native addon compatibility
// and download the correct prebuild for this architecture if needed.

try {
  require('better-sqlite3');
  process.exit(0);
} catch (loadErr) {
  console.log('  Downloading compatible database driver...');
  var execSync = require('child_process').execSync;
  var path = require('path');

  var bs3Dir = path.join(__dirname, 'node_modules', 'better-sqlite3');
  var piBin = path.join(__dirname, 'node_modules', 'prebuild-install', 'bin.js');

  try {
    execSync('"' + process.execPath + '" "' + piBin + '" -r napi --force', {
      cwd: bs3Dir,
      stdio: 'inherit',
      timeout: 120000
    });
  } catch (dlErr) {
    console.error('  [ERROR] Failed to download prebuild: ' + dlErr.message);
    process.exit(1);
  }

  // Clear require cache and re-test
  Object.keys(require.cache).forEach(function (key) {
    if (key.indexOf('better-sqlite3') !== -1 || key.indexOf('better_sqlite3') !== -1) {
      delete require.cache[key];
    }
  });

  try {
    require('better-sqlite3');
    console.log('  [OK] Database driver updated successfully');
    process.exit(0);
  } catch (retryErr) {
    console.error('  [ERROR] Database driver still incompatible: ' + retryErr.message);
    process.exit(1);
  }
}
