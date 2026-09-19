import { describe, expect, it } from 'vitest';
import { resolveSidebarNavGroups } from '../../../src/utils/home/sidebarNavMath';

// test/unit/home/sidebarNavMath.test.ts

describe('resolveSidebarNavGroups', () => {
    it('puts search, playlists, radio, and podcast under Discover', () => {
        const [discover] = resolveSidebarNavGroups({
            hasPersonalLibrary: true,
            hasRadio: true,
            hasHistory: true,
            hasNavidrome: false,
            hasYtmusic: false,
        });
        expect(discover).toEqual({
            id: 'discover',
            titleKey: 'app.sidebarDiscover',
            items: ['charts', 'library', 'radio', 'podcast'],
        });
    });

    it('puts history and local under Yours without a guest Discover tab', () => {
        const groups = resolveSidebarNavGroups({
            hasPersonalLibrary: false,
            hasRadio: false,
            hasHistory: true,
            hasNavidrome: true,
            hasYtmusic: true,
        });
        expect(groups[0]?.items).toEqual(['charts', 'podcast']);
        expect(groups[1]).toEqual({
            id: 'mine',
            titleKey: 'app.sidebarMine',
            items: ['history', 'local', 'navidrome', 'ytmusic'],
        });
    });
});
