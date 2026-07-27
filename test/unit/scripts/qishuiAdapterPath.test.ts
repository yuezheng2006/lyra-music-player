import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// test/unit/scripts/qishuiAdapterPath.test.ts
// Packaged Electron inherits a non-app cwd; qishui must resolve via __dirname adapters dir.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sidecarPath = path.join(repoRoot, 'scripts/music-provider-sidecar.cjs');
const discoverPath = path.join(repoRoot, 'scripts/music-provider-plugin/discover.cjs');
const adapterPath = path.join(
  repoRoot,
  'scripts/music-provider-adapters/qishui-provider-adapter.mjs',
);

describe('qishui adapter path (packaged cwd)', () => {
  it('keeps adapter file next to the sidecar script', () => {
    expect(fs.existsSync(adapterPath)).toBe(true);
  });

  it('resolves qishui adapter via __dirname adapters dir + plugin registry', () => {
    const sidecarSource = fs.readFileSync(sidecarPath, 'utf8');
    const discoverSource = fs.readFileSync(discoverPath, 'utf8');
    expect(sidecarSource).toContain("path.join(__dirname, 'music-provider-adapters')");
    expect(sidecarSource).toContain("require('./music-provider-plugin/discover.cjs')");
    expect(discoverSource).toContain("qishui: 'qishui-provider-adapter.mjs'");
    expect(sidecarSource).not.toMatch(
      /provider === 'qishui'[\s\S]{0,120}process\.cwd\(\)/,
    );
  });

  it('still finds the adapter when process.cwd is outside the repo', () => {
    const previousCwd = process.cwd();
    process.chdir('/tmp');
    try {
      const viaDirname = path.join(
        path.dirname(sidecarPath),
        'music-provider-adapters',
        'qishui-provider-adapter.mjs',
      );
      const viaCwd = path.resolve(process.cwd(), 'scripts/music-provider-adapters/qishui-provider-adapter.mjs');
      expect(fs.existsSync(viaDirname)).toBe(true);
      expect(fs.existsSync(viaCwd)).toBe(false);
    } finally {
      process.chdir(previousCwd);
    }
  });

  it('caches loaded adapter modules in production and by mtime in development', () => {
    const source = fs.readFileSync(sidecarPath, 'utf8');
    expect(source).toContain('const adapterCache = new Map()');
    expect(source).toContain("process.env.NODE_ENV === 'production'");
    expect(source).toContain('adapterCache.get(resolvedPath)');
    expect(source).toContain('cached.mtimeMs === mtimeMs');
  });
});
