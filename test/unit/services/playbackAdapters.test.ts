import { describe, expect, it } from 'vitest';
import { buildLocalQueue } from '@/services/playbackAdapters';
import type { LocalSong } from '@/types';

// test/unit/services/playbackAdapters.test.ts

const makeLocalSong = (overrides: Partial<LocalSong> = {}): LocalSong => ({
    id: 'local-track-1',
    fileName: '7613671922827905074.mp3',
    filePath: '/music/7613671922827905074.mp3',
    duration: 180000,
    fileSize: 1024,
    mimeType: 'audio/mpeg',
    addedAt: 1,
    title: '7613671922827905074',
    artist: 'Imported artist',
    album: 'Imported album',
    embeddedTitle: '失眠了',
    embeddedArtist: '莫斯科',
    embeddedAlbum: '失眠了',
    matchedCoverUrl: 'https://example.com/cover.jpg',
    ...overrides,
});

describe('buildLocalQueue', () => {
    it('uses embedded local metadata and matched cover for queue rows', () => {
        const [song] = buildLocalQueue([makeLocalSong()]);

        expect(song).toMatchObject({
            name: '失眠了',
            ar: [{ id: 0, name: '莫斯科' }],
            al: {
                id: 0,
                name: '失眠了',
                picUrl: 'https://example.com/cover.jpg',
            },
        });
    });

    it('uses the artist as a title fallback when imported title is only a numeric file id', () => {
        const [song] = buildLocalQueue([makeLocalSong({
            embeddedTitle: undefined,
            title: '7613671922827905074',
            artist: '天亮了（烟嗓男版）',
        })]);

        expect(song.name).toBe('天亮了（烟嗓男版）');
    });
});
