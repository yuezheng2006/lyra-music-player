import { describe, expect, it } from 'vitest';
import {
    HOME_PLAYLIST_COVER_MAX_PX,
    HOME_PLAYLIST_COVER_MIN_PX,
    HOME_PLAYLIST_SHELF_GRID_CLASS,
    HOME_RECENT_LISTEN_HERO_CARD_CLASS,
    HOME_RECENT_LISTEN_HERO_GRID_CLASS,
    HOME_RECENT_LISTEN_SHELF_GRID_CLASS,
    resolveDiscoveryRailColumns,
    SIGNED_IN_DISCOVERY_RAIL_COLUMNS,
} from '../../../src/utils/home/discoveryRailMath';

// test/unit/home/discoveryRailMath.test.ts

describe('resolveDiscoveryRailColumns', () => {
    it('keeps guests on the listening-desk stage instead of a discover portal', () => {
        expect(resolveDiscoveryRailColumns({ signedIn: false, hasInvite: false })).toEqual([
            'desk-stage',
        ]);
        expect(resolveDiscoveryRailColumns({ signedIn: false, hasInvite: true })).toEqual([
            'desk-stage',
            'invite',
        ]);
    });

    it('orders signed-in 歌单 as browse: greeting, recommended playlists, charts', () => {
        expect(resolveDiscoveryRailColumns({ signedIn: true, hasInvite: true })).toEqual([
            'hero',
            'personalized',
            'charts',
        ]);
        expect(SIGNED_IN_DISCOVERY_RAIL_COLUMNS).not.toContain('radar');
        expect(SIGNED_IN_DISCOVERY_RAIL_COLUMNS).not.toContain('desk-strip');
        expect(SIGNED_IN_DISCOVERY_RAIL_COLUMNS.indexOf('hero')).toBeLessThan(
            SIGNED_IN_DISCOVERY_RAIL_COLUMNS.indexOf('personalized'),
        );
        expect(SIGNED_IN_DISCOVERY_RAIL_COLUMNS.indexOf('personalized')).toBeLessThan(
            SIGNED_IN_DISCOVERY_RAIL_COLUMNS.indexOf('charts'),
        );
    });

    it('caps playlist and greeting covers so they cannot stretch into posters', () => {
        expect(HOME_PLAYLIST_COVER_MIN_PX).toBe(80);
        expect(HOME_PLAYLIST_COVER_MAX_PX).toBe(88);
        expect(HOME_PLAYLIST_SHELF_GRID_CLASS).toContain('minmax(80px,88px)');
        expect(HOME_RECENT_LISTEN_HERO_GRID_CLASS).toContain('grid-cols-4');
        expect(HOME_RECENT_LISTEN_HERO_CARD_CLASS).toBe('max-w-[18rem]');
        expect(HOME_RECENT_LISTEN_SHELF_GRID_CLASS).toContain('grid-cols-4');
        expect(HOME_RECENT_LISTEN_HERO_GRID_CLASS).not.toContain('grid-cols-2');
    });
});
