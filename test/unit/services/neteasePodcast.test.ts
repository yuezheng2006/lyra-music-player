import { describe, expect, it, vi } from 'vitest';
import { mapPodcastProgram, mapPodcastRadio, fetchDailyRecommendSongs } from '@/services/neteasePodcast';
import { neteaseApi } from '@/services/netease';

// test/unit/services/neteasePodcast.test.ts
// Covers Mineradio-style podcast radio/program mapping.

vi.mock('@/services/netease', () => ({
    neteaseApi: {
        normalizeSongResult: (raw: any) => ({
            id: Number(raw?.id || 0),
            name: raw?.name || '',
            artists: raw?.ar || [],
            album: raw?.al || { id: 0, name: '' },
            duration: Number(raw?.dt || 0),
        }),
        getDailyRecommendSongs: vi.fn(),
    },
}));

describe('neteasePodcast mappers', () => {
    it('maps a dj radio card', () => {
        const radio = mapPodcastRadio({
            id: 336355127,
            name: '代码时间',
            picUrl: 'http://example.com/cover.jpg',
            dj: { nickname: 'Host' },
            programCount: 12,
        });
        expect(radio).toMatchObject({
            id: 336355127,
            name: '代码时间',
            cover: 'https://example.com/cover.jpg',
            djName: 'Host',
            programCount: 12,
        });
    });

    it('maps a program to a playable podcast SongResult', () => {
        const song = mapPodcastProgram({
            id: 2061034798,
            name: 'Episode 1',
            serialNum: 1,
            duration: 3600000,
            mainSong: { id: 478446370, name: 'Episode 1', fee: 0 },
            radio: { id: 336355127, name: '代码时间', picUrl: 'https://cdn/x.jpg' },
        });
        expect(song).toMatchObject({
            id: 478446370,
            name: 'Episode 1',
            contentType: 'podcast',
            programId: 2061034798,
            radioId: 336355127,
            radioName: '代码时间',
            serialNum: 1,
            musicProvider: 'netease',
        });
    });

    it('parses dailySongs from data.dailySongs', async () => {
        vi.mocked(neteaseApi.getDailyRecommendSongs).mockResolvedValueOnce({
            code: 200,
            data: {
                dailySongs: [
                    { id: 1, name: 'A', ar: [{ id: 1, name: 'X' }], al: { id: 1, name: 'AL' }, dt: 1000 },
                ],
            },
        });
        const result = await fetchDailyRecommendSongs();
        expect(result.needLogin).toBe(false);
        expect(result.songs).toHaveLength(1);
        expect(result.songs[0]?.name).toBe('A');
    });

    it('flags login required for code 301', async () => {
        vi.mocked(neteaseApi.getDailyRecommendSongs).mockResolvedValueOnce({ code: 301 });
        const result = await fetchDailyRecommendSongs();
        expect(result.needLogin).toBe(true);
        expect(result.songs).toEqual([]);
    });
});
