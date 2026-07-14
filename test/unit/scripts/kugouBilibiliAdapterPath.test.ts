import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// test/unit/scripts/kugouBilibiliAdapterPath.test.ts
// Ensures sidecar resolves built-in kugou/bilibili adapters next to the script.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sidecarPath = path.join(repoRoot, 'scripts/music-provider-sidecar.cjs');

describe('kugou/bilibili adapter path wiring', () => {
    it('keeps adapter files next to the sidecar script', () => {
        expect(fs.existsSync(path.join(repoRoot, 'scripts/music-provider-adapters/kugou-provider-adapter.mjs'))).toBe(true);
        expect(fs.existsSync(path.join(repoRoot, 'scripts/music-provider-adapters/bilibili-provider-adapter.mjs'))).toBe(true);

        const source = fs.readFileSync(sidecarPath, 'utf8');
        expect(source).toContain("provider === 'kugou'");
        expect(source).toContain("provider === 'bilibili'");
        expect(source).toContain('kugou-provider-adapter.mjs');
        expect(source).toContain('bilibili-provider-adapter.mjs');
    });
});
