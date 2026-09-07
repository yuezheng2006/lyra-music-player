import { describe, expect, it } from 'vitest';
import {
    buildLyricsResolveFingerprint,
    normalizeLyricsResolveRequest,
} from '../src/schema';

describe('lyrics resolve schema', () => {
    it('normalizes a valid resolve request', () => {
        const request = normalizeLyricsResolveRequest({
            title: '  Song  ',
            artist: 'Artist',
            album: 'Album',
            durationMs: 210000,
            hints: { preferredSource: 'qq', neteaseId: 42 },
            policy: { requireWordByWord: true, timeoutMs: 5000 },
        });
        expect(request.title).toBe('Song');
        expect(request.hints?.preferredSource).toBe('qq');
        expect(request.hints?.neteaseId).toBe(42);
        expect(request.policy?.timeoutMs).toBe(5000);
    });

    it('rejects missing title', () => {
        expect(() => normalizeLyricsResolveRequest({ artist: 'A' })).toThrow(/title/i);
    });

    it('builds stable fingerprints for equivalent metadata', () => {
        const a = buildLyricsResolveFingerprint({
            title: '夜曲',
            artist: '周杰伦',
            album: '十一月的萧邦',
            durationMs: 226500,
        });
        const b = buildLyricsResolveFingerprint({
            title: '夜曲',
            artist: '周杰伦',
            album: '十一月的萧邦',
            durationMs: 226800,
        });
        expect(a).toBe(b);
        expect(a.includes('|')).toBe(true);
    });
});
