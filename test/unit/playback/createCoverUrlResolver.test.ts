import { describe, expect, it } from 'vitest';
import { createCoverUrlResolver } from '@/components/app/playback/createCoverUrlResolver';
import type { SongResult } from '@/types';

// test/unit/playback/createCoverUrlResolver.test.ts

const makeSong = (overrides: Partial<SongResult> = {}): SongResult => ({
    id: 1,
    name: '刀马旦',
    artists: [{ id: 1, name: '周杰伦' }],
    album: { id: 1, name: 'Album', picUrl: undefined },
    duration: 0,
    ar: [{ id: 1, name: '周杰伦' }],
    al: { id: 1, name: 'Album', picUrl: undefined },
    dt: 0,
    ...overrides,
});

describe('createCoverUrlResolver', () => {
    it('prefers cached cover url', () => {
        const resolve = createCoverUrlResolver('https://cdn.example/cover.jpg', makeSong());
        expect(resolve()).toBe('https://cdn.example/cover.jpg');
    });

    it('uses album picUrl when available', () => {
        const resolve = createCoverUrlResolver(null, makeSong({
            al: { id: 1, name: 'Album', picUrl: 'https://cdn.example/album.jpg' },
        }));
        expect(resolve()).toBe('https://cdn.example/album.jpg');
    });

    it('uses matched cover url when playback song carries matched metadata', () => {
        const resolve = createCoverUrlResolver(null, {
            ...makeSong(),
            matchedCoverUrl: 'https://cdn.example/matched.jpg',
        } as SongResult & { matchedCoverUrl: string });

        expect(resolve()).toBe('https://cdn.example/matched.jpg');
    });

    it('uses provider cover url fields before generating a placeholder', () => {
        const resolve = createCoverUrlResolver(null, {
            ...makeSong(),
            coverUrl: 'https://cdn.example/provider.jpg',
        } as SongResult & { coverUrl: string });

        expect(resolve()).toBe('https://cdn.example/provider.jpg');
    });

    it('creates an object url for embedded local cover blobs', () => {
        const coverBlob = new Blob(['cover-bytes'], { type: 'image/jpeg' });
        const resolve = createCoverUrlResolver(null, {
            ...makeSong(),
            isLocal: true,
            localData: {
                id: 'local-1',
                fileName: 'song.mp3',
                filePath: '/music/song.mp3',
                duration: 180000,
                fileSize: 1024,
                mimeType: 'audio/mpeg',
                addedAt: 1,
                embeddedCover: coverBlob,
            },
        } as SongResult & {
            isLocal: true;
            localData: {
                id: string;
                fileName: string;
                filePath: string;
                duration: number;
                fileSize: number;
                mimeType: string;
                addedAt: number;
                embeddedCover: Blob;
            };
        });

        const first = resolve();
        const second = resolve();
        expect(first?.startsWith('blob:')).toBe(true);
        expect(second).toBe(first);
    });

    it('uses navidrome cover art url from playback carrier', () => {
        const resolve = createCoverUrlResolver(null, {
            ...makeSong(),
            isNavidrome: true,
            navidromeData: {
                id: 'navi-1',
                streamUrl: 'https://music.example/stream',
                coverArtUrl: 'https://music.example/cover',
                albumId: 'album-1',
                artistId: 'artist-1',
                path: '/music/song.flac',
                suffix: 'flac',
            },
        } as SongResult & {
            isNavidrome: true;
            navidromeData: {
                id: string;
                streamUrl: string;
                coverArtUrl: string;
                albumId: string;
                artistId: string;
                path: string;
                suffix: string;
            };
        });

        expect(resolve()).toBe('https://music.example/cover');
    });

    it('falls back to a generated song placeholder when cover is missing', () => {
        const resolve = createCoverUrlResolver(null, makeSong());
        const url = resolve();
        expect(url).toBeTruthy();
        expect(String(url).startsWith('data:image/svg+xml')).toBe(true);
        expect(decodeURIComponent(String(url))).toContain('刀');
    });

    it('returns null when there is no current song', () => {
        const resolve = createCoverUrlResolver(null, null);
        expect(resolve()).toBeNull();
    });
});
