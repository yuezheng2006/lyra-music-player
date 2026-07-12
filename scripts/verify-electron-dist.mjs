import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// scripts/verify-electron-dist.mjs
// L1 gate: ELECTRON production build + electron . (file:// dist) + packaged smoke.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

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

console.log('[verify:electron:dist] building renderer with ELECTRON=true');
run('npx', ['cross-env', 'ELECTRON=true', 'vite', 'build']);

console.log('[verify:electron:dist] running packaged smoke (mode=dist)');
run('node', ['test/manual/electron_packaged_smoke.mjs', '--mode=dist']);

console.log('[verify:electron:dist] PASS');
