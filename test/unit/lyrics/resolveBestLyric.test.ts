import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveBestLyric } from '@/utils/lyrics/resolveBestLyric';
import { autoMatchBestLyric } from '@/utils/lyrics/autoMatchBestLyric';
import {
    fetchRemoteLyricsResolve,
    isLyricsResolveServiceConfigured,
} from '@/services/lyricsResolveClient';

vi.mock('@/utils/lyrics/autoMatchBestLyric', () => ({
    autoMatchBestLyric: vi.fn(),
}));

vi.mock('@/services/lyricsResolveClient', () => ({
    isLyricsResolveServiceConfigured: vi.fn(),
    fetchRemoteLyricsResolve: vi.fn(),
}));

describe('resolveBestLyric', () => {
    const autoMatchMock = vi.mocked(autoMatchBestLyric);
    const configuredMock = vi.mocked(isLyricsResolveServiceConfigured);
    const remoteMock = vi.mocked(fetchRemoteLyricsResolve);

    beforeEach(() => {
        vi.resetAllMocks();
        configuredMock.mockReturnValue(false);
        autoMatchMock.mockResolvedValue({
            lyrics: { lines: [], isWordByWord: true },
            source: 'netease',
            id: 1,
            isPureMusic: false,
        });
    });

    it('uses in-process matcher when remote service is not configured', async () => {
        const result = await resolveBestLyric('Title', 'Artist', 200000);
        expect(remoteMock).not.toHaveBeenCalled();
        expect(autoMatchMock).toHaveBeenCalledOnce();
        expect(result && 'source' in result ? result.source : null).toBe('netease');
    });

    it('returns remote matched lyrics without falling back', async () => {
        configuredMock.mockReturnValue(true);
        remoteMock.mockResolvedValue({
            status: 'matched',
            lyrics: { lines: [], isWordByWord: true },
            provenance: { source: 'amll', platformId: '99', amllPlatform: 'ncm', matchScore: 90 },
            fingerprint: 'fp',
            elapsedMs: 12,
        });

        const result = await resolveBestLyric('Title', 'Artist', 200000) as any;
        expect(result.source).toBe('amll');
        expect(result.id).toBe('99');
        expect(autoMatchMock).not.toHaveBeenCalled();
    });

    it('falls back to in-process matcher when remote returns not_found', async () => {
        configuredMock.mockReturnValue(true);
        remoteMock.mockResolvedValue({
            status: 'not_found',
            lyrics: null,
            provenance: null,
            fingerprint: 'fp',
            elapsedMs: 8,
        });

        await resolveBestLyric('Title', 'Artist', 200000);
        expect(autoMatchMock).toHaveBeenCalledOnce();
    });

    it('maps remote pure_music without in-process fallback', async () => {
        configuredMock.mockReturnValue(true);
        remoteMock.mockResolvedValue({
            status: 'pure_music',
            lyrics: null,
            provenance: { source: 'netease', platformId: '1' },
            fingerprint: 'fp',
            elapsedMs: 5,
        });

        const result = await resolveBestLyric('Title', 'Artist', 200000);
        expect(result).toEqual({ isPureMusic: true });
        expect(autoMatchMock).not.toHaveBeenCalled();
    });
});
