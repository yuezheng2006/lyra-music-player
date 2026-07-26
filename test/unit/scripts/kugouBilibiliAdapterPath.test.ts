import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// test/unit/scripts/kugouBilibiliAdapterPath.test.ts
// Ensures sidecar resolves built-in peer adapters next to the script via plugin registry.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sidecarPath = path.join(repoRoot, 'scripts/music-provider-sidecar.cjs');
const discoverPath = path.join(repoRoot, 'scripts/music-provider-plugin/discover.cjs');

describe('kugou/bilibili/kuwo adapter path wiring', () => {
    it('keeps adapter files next to the sidecar script', () => {
        expect(fs.existsSync(path.join(repoRoot, 'scripts/music-provider-adapters/kugou-provider-adapter.mjs'))).toBe(true);
        expect(fs.existsSync(path.join(repoRoot, 'scripts/music-provider-adapters/bilibili-provider-adapter.mjs'))).toBe(true);
        expect(fs.existsSync(path.join(repoRoot, 'scripts/music-provider-adapters/kuwo-provider-adapter.mjs'))).toBe(true);

        const sidecarSource = fs.readFileSync(sidecarPath, 'utf8');
        const discoverSource = fs.readFileSync(discoverPath, 'utf8');
        expect(sidecarSource).toContain("path.join(__dirname, 'music-provider-adapters')");
        expect(sidecarSource).toContain("require('./music-provider-plugin/discover.cjs')");
        expect(discoverSource).toContain("kugou: 'kugou-provider-adapter.mjs'");
        expect(discoverSource).toContain("bilibili: 'bilibili-provider-adapter.mjs'");
        expect(discoverSource).toContain("kuwo: 'kuwo-provider-adapter.mjs'");
    });
});
