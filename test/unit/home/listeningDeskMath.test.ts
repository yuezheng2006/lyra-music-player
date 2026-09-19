import { describe, expect, it } from 'vitest';
import type { SongResult } from '../../../src/types';
import {
    isListeningDeskFullTrack,
    LISTENING_DESK_STRIP,
    listeningDeskFieldClass,
    listeningDeskTileClass,
    splitListeningDeskSongs,
} from '../../../src/utils/home/listeningDeskMath';
import { orderListeningDeskFallbackProviders } from '../../../src/services/listeningDeskFallback';

// test/unit/home/listeningDeskMath.test.ts

const song = (id: number, extras: Partial<SongResult> = {}): SongResult => ({
    id,
    name: `Song ${id}`,
    artists: [{ id: 1, name: 'Artist' }],
    album: { id: 1, name: 'Album' },
    duration: 180_000,
    ...extras,
});

describe('isListeningDeskFullTrack', () => {
    it('drops 30-second clip titles even when catalog duration is missing', () => {
        expect(isListeningDeskFullTrack(song(1, {
            name: '海屿你 (30秒鼓手 翟架子鼓版片段)',
            duration: 0,
        }))).toBe(false);
        expect(isListeningDeskFullTrack(song(2, { name: '晴天 试听' }))).toBe(false);
        expect(isListeningDeskFullTrack(song(3, { name: 'Preview clip' }))).toBe(false);
    });

    it('drops tracks whose known duration is a preview clip', () => {
        expect(isListeningDeskFullTrack(song(1, { name: '海屿你', duration: 30_000 }))).toBe(false);
        expect(isListeningDeskFullTrack(song(2, { name: '海屿你', duration: 30 }))).toBe(false);
    });

    it('keeps full-length songs without clip labels', () => {
        expect(isListeningDeskFullTrack(song(1, { name: '海屿你' }))).toBe(true);
        expect(isListeningDeskFullTrack(song(2, { name: '失眠', duration: 0 }))).toBe(true);
    });
});

describe('splitListeningDeskSongs', () => {
    it('returns an empty mosaic when there are no songs', () => {
        expect(splitListeningDeskSongs([])).toEqual({
            hero: null,
            mosaic: [],
        });
    });

    it('keeps mixed picks as one cover field instead of grouping by source', () => {
        const songs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(id => song(id));
        const desk = splitListeningDeskSongs(songs);
        expect(desk.hero?.id).toBe(1);
        expect(desk.mosaic.map(item => item.id)).toEqual(songs.map(item => item.id));
        expect(splitListeningDeskSongs(songs, LISTENING_DESK_STRIP).mosaic).toHaveLength(10);
    });

    it('skips clip tracks so the mosaic is not filled with 30-second trials', () => {
        const songs = [
            song(1, { name: '海屿你 (30秒…' }),
            song(2, { name: '甲乙丙丁' }),
            song(3, { name: '罗生门', duration: 32_000 }),
            song(4, { name: '碎碎念' }),
        ];
        expect(splitListeningDeskSongs(songs).mosaic.map(item => item.name)).toEqual([
            '甲乙丙丁',
            '碎碎念',
        ]);
    });
});

describe('listening desk field layout', () => {
    it('keeps the signed-in strip as compact cover tiles instead of five full-width squares', () => {
        expect(listeningDeskFieldClass('strip')).toContain('minmax(80px,88px)');
        expect(listeningDeskFieldClass('strip')).not.toContain('grid-cols-5');
        expect(listeningDeskTileClass('strip', 0)).toBe('aspect-square');
    });
});

describe('orderListeningDeskFallbackProviders', () => {
    it('searches qishui/kugou/kuwo before slower coco and bilibili', () => {
        expect(orderListeningDeskFallbackProviders([
            'coco', 'bilibili', 'qishui', 'kugou', 'kuwo',
        ])).toEqual(['qishui', 'kugou', 'kuwo', 'coco', 'bilibili']);
    });
});
