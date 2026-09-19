import { describe, expect, it } from 'vitest';
import {
    buildYtmusicHomeRails,
    YTMUSIC_HOME_RAIL_VISIBLE_TRACKS,
} from '../../../src/utils/ytmusicHomeRailsMath';
import type { YtmHomeSection } from '../../../src/types/ytmusic';

// test/unit/utils/ytmusicHomeRailsMath.test.ts

const track = (id: string) => ({
    videoId: id,
    title: `T-${id}`,
    artist: 'A',
    durationMs: 1000,
});

describe('buildYtmusicHomeRails', () => {
    it('slices visible tracks and marks hasMore', () => {
        const sections: YtmHomeSection[] = [
            {
                title: '华语流行',
                playlistId: 'PL1',
                coverUrl: null,
                tracks: Array.from({ length: 20 }, (_, i) => track(`v${i}`)),
            },
        ];

        const rails = buildYtmusicHomeRails(sections, 16);
        expect(rails).toHaveLength(1);
        expect(rails[0].visibleTracks).toHaveLength(YTMUSIC_HOME_RAIL_VISIBLE_TRACKS);
        expect(rails[0].tracks).toHaveLength(20);
        expect(rails[0].hasMore).toBe(true);
        expect(rails[0].title).toBe('华语流行');
    });

    it('drops empty sections', () => {
        const rails = buildYtmusicHomeRails([
            { title: 'Empty', playlistId: 'PL0', tracks: [] },
            {
                title: 'Ok',
                playlistId: 'PL1',
                tracks: [track('a')],
            },
        ]);
        expect(rails.map((r) => r.playlistId)).toEqual(['PL1']);
        expect(rails[0].hasMore).toBe(false);
    });
});
