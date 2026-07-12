import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// scripts/verify-mac-packaged.mjs
// L2 gate: pack current-arch mac .app, optionally install to /Applications, run packaged smoke.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const resolveArch = () => {
  const override = process.env.VERIFY_MAC_ARCH?.trim();
  if (override === 'arm64' || override === 'x64') return override;
  return process.arch === 'arm64' ? 'arm64' : 'x64';
};

const run = (command, args, env = {}) => {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

if (process.platform !== 'darwin') {
  console.error('[verify:mac:packaged] macOS only');
  process.exit(1);
}

const arch = resolveArch();
console.log('[verify:mac:packaged] packing…');
run('node', ['scripts/pack-mac-local.mjs']);

const stagedApp = path.join(repoRoot, 'release', 'verify-mac', arch, 'Lyra.app');
if (!fs.existsSync(stagedApp)) {
  console.error(`[verify:mac:packaged] missing staged app: ${stagedApp}`);
  process.exit(1);
}

let appUnderTest = stagedApp;
if (process.env.VERIFY_INSTALL_APPLICATIONS === '1') {
  const applicationsApp = '/Applications/Lyra.app';
  console.log(`[verify:mac:packaged] installing to ${applicationsApp}`);
  fs.rmSync(applicationsApp, { recursive: true, force: true });
  const ditto = spawnSync('ditto', [stagedApp, applicationsApp], { stdio: 'inherit' });
  if (ditto.status !== 0) {
    process.exit(ditto.status ?? 1);
  }
  // Clear quarantine so unsigned local builds can launch.
  spawnSync('xattr', ['-dr', 'com.apple.quarantine', applicationsApp], { stdio: 'ignore' });
  appUnderTest = applicationsApp;
}

console.log(`[verify:mac:packaged] smoke against ${appUnderTest}`);
run('node', [
  'test/manual/electron_packaged_smoke.mjs',
  '--mode=app',
  `--app=${appUnderTest}`,
]);

console.log('[verify:mac:packaged] PASS');
