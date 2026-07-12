import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// scripts/pack-mac-local.mjs
// Build Electron mac .app for the current (or VERIFY_MAC_ARCH) architecture only.

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

const findAppBundle = (releaseDir, arch) => {
  const candidates = [
    path.join(releaseDir, `mac-${arch}`, 'Lyra.app'),
    path.join(releaseDir, 'mac', 'Lyra.app'),
    path.join(releaseDir, 'mac-arm64', 'Lyra.app'),
    path.join(releaseDir, 'mac-x64', 'Lyra.app'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
};

if (process.platform !== 'darwin') {
  console.error('[pack:mac:local] macOS only');
  process.exit(1);
}

const arch = resolveArch();
console.log(`[pack:mac:local] arch=${arch}`);

console.log('[pack:mac:local] vite build ELECTRON=true');
run('npx', ['cross-env', 'ELECTRON_DEV=false', 'ELECTRON=true', 'vite', 'build']);

console.log('[pack:mac:local] electron-builder --mac dir');
run('npx', [
  'cross-env',
  'CSC_IDENTITY_AUTO_DISCOVERY=false',
  'electron-builder',
  '--mac',
  'dir',
  `--${arch}`,
  '--publish',
  'never',
]);

const releaseDir = path.join(repoRoot, 'release');
const builtApp = findAppBundle(releaseDir, arch);
if (!builtApp) {
  console.error('[pack:mac:local] Lyra.app not found under release/');
  process.exit(1);
}

const verifyRoot = path.join(releaseDir, 'verify-mac', arch);
fs.mkdirSync(verifyRoot, { recursive: true });
const stagedApp = path.join(verifyRoot, 'Lyra.app');
fs.rmSync(stagedApp, { recursive: true, force: true });

const ditto = spawnSync('ditto', [builtApp, stagedApp], { stdio: 'inherit' });
if (ditto.status !== 0) {
  process.exit(ditto.status ?? 1);
}

console.log(`[pack:mac:local] staged ${stagedApp}`);
console.log(JSON.stringify({ arch, builtApp, stagedApp }, null, 2));
