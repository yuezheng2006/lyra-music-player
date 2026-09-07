import { describe, expect, it } from 'vitest';
import type { DailyRecommendSourceBucket } from '../../../src/services/dailyRecommendService';
import type { SongResult } from '../../../src/types';
import {
    flattenPeerShelfShortcuts,
    peerShelfShortcutsForProvider,
    songsForPeerProvider,
} from '../../../src/utils/ui/homePeerSourceShelfMath';

// test/unit/ui/homePeerSourceShelfMath.test.ts

const song = (id: number, provider: SongResult['musicProvider']): SongResult => ({
    id,
    name: `Song ${id}`,
    artists: [{ id: 1, name: 'Artist' }],
    album: { id: 1, name: 'Album' },
    duration: 180_000,
    musicProvider: provider,
});

describe('homePeerSourceShelfMath', () => {
    it('slices one provider bucket without mixing sources', () => {
        const sources: DailyRecommendSourceBucket[] = [
            { provider: 'qishui', songs: [song(1, 'qishui'), song(2, 'qishui')], kind: 'picks' },
            { provider: 'coco', songs: [song(9, 'coco')], kind: 'picks' },
        ];
        expect(songsForPeerProvider(sources, 'coco').map(item => item.id)).toEqual([9]);
        expect(songsForPeerProvider(sources, 'kugou')).toEqual([]);
        expect(songsForPeerProvider(sources, undefined)).toEqual([]);
    });

    it('flattens shortcut groups and drops duplicate display labels', () => {
        expect(flattenPeerShelfShortcuts([
            { id: 'song', queries: ['晴天', 'song:晴天', '起风了'] },
            { id: 'artist', queries: ['周杰伦'] },
        ], 3)).toEqual(['晴天', '起风了', '周杰伦']);
    });

    it('returns coco song and artist chips without routing prefixes', () => {
        const chips = peerShelfShortcutsForProvider('coco', 4);
        expect(chips.length).toBe(4);
        expect(chips.every(query => !query.includes(':'))).toBe(true);
    });
});
