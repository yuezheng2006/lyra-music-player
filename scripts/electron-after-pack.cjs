'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8' }).trim();
}

/** Ad-hoc codesign + verify macOS .app; logs authority for CI diagnosis. */
module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`afterPack: missing app bundle at ${appPath}`);
  }

  // Replace electron-builder's unsigned/null-identity state with a local ad-hoc seal.
  execFileSync(
    'codesign',
    ['--force', '--deep', '--sign', '-', '--timestamp=none', appPath],
    { stdio: 'inherit' },
  );

  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], {
    stdio: 'inherit',
  });

  const details = run('codesign', ['-dv', '--verbose=2', appPath]);
  const authority = /Authority=(.+)/.exec(details)?.[1] ?? '(none / ad-hoc)';
  const team = /TeamIdentifier=(.+)/.exec(details)?.[1] ?? 'not set';
  const runtime = /flags=.*(runtime)/.test(details) ? 'hardened-runtime' : 'no-hardened-runtime';

  console.log('[afterPack:macos-sign]');
  console.log(`  app=${appPath}`);
  console.log(`  authority=${authority}`);
  console.log(`  team=${team}`);
  console.log(`  runtime=${runtime}`);
  console.log(
    '  note=ad-hoc seal only; Gatekeeper still blocks Chrome-quarantined downloads until Developer ID + notarization',
  );
};
