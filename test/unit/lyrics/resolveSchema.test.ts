import { describe, expect, it } from 'vitest';
import { buildLyricsResolveFingerprint } from '@/utils/lyrics/resolveFingerprint';
import { normalizeLyricsResolveRequest } from '@/utils/lyrics/resolveSchema';

describe('lyrics resolve schema (player)', () => {
    it('normalizes request bodies', () => {
        const request = normalizeLyricsResolveRequest({
            title: 'Title',
            artist: 'Artist',
            durationMs: 180000,
        });
        expect(request.title).toBe('Title');
        expect(request.durationMs).toBe(180000);
    });

    it('fingerprints nearby durations into the same bucket', () => {
        const a = buildLyricsResolveFingerprint({
            title: 'A',
            artist: 'B',
            durationMs: 200100,
        });
        const b = buildLyricsResolveFingerprint({
            title: 'A',
            artist: 'B',
            durationMs: 200400,
        });
        expect(a).toBe(b);
    });
});
