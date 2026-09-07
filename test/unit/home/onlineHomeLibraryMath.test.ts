import { describe, expect, it } from 'vitest';
import {
    isLikedPlaylistName,
    splitNamedLibraryItems,
    findLikedNamedItem,
    splitOwnedLibraryItems,
    resolveOnlineHomeLibrarySections,
} from '../../../src/utils/home/onlineHomeLibraryMath';

describe('onlineHomeLibraryMath', () => {
    it('recognizes liked-songs playlist names', () => {
        expect(isLikedPlaylistName('我喜欢的音乐')).toBe(true);
        expect(isLikedPlaylistName('Liked Songs')).toBe(true);
        expect(isLikedPlaylistName('红心歌单')).toBe(true);
        expect(isLikedPlaylistName('My Favorites')).toBe(true);
        expect(isLikedPlaylistName('自建华语')).toBe(false);
        expect(isLikedPlaylistName('')).toBe(false);
    });

    it('pins liked items ahead of the personal library split', () => {
        const split = splitNamedLibraryItems([
            { name: '自建', id: 2 },
            { name: '我喜欢的音乐', id: 1 },
            { name: '收藏的华语', id: 3 },
        ]);
        expect(split.liked.map(item => item.id)).toEqual([1]);
        expect(split.library.map(item => item.id)).toEqual([2, 3]);
    });

    it('does not fall back to a created playlist when liked-songs is missing', () => {
        expect(findLikedNamedItem([
            { name: '自建', id: 2 },
            { name: '华语精选', id: 3 },
        ])).toBeNull();
        expect(findLikedNamedItem([
            { name: '自建', id: 2 },
            { name: '我喜欢的音乐', id: 1 },
        ])?.id).toBe(1);
    });

    it('splits created vs collected playlists by creator userId', () => {
        const split = splitOwnedLibraryItems([
            { name: '自建', raw: { creator: { userId: 7 } } },
            { name: '别人的', raw: { creator: { userId: 9 } } },
            { name: '无主', raw: {} },
        ], 7);
        expect(split.created.map(item => item.name)).toEqual(['自建']);
        expect(split.collected.map(item => item.name)).toEqual(['别人的', '无主']);
    });

    it('keeps a single collected bucket when the owner id is unknown', () => {
        const items = [{ name: '自建', raw: { creator: { userId: 7 } } }];
        expect(splitOwnedLibraryItems(items, null).created).toEqual([]);
        expect(splitOwnedLibraryItems(items, null).collected).toEqual(items);
    });

    it('splits the all-filter canvas into liked, created, and collected like iMusic library columns', () => {
        const sections = resolveOnlineHomeLibrarySections([
            { name: '我喜欢的音乐', raw: { creator: { userId: 7 } } },
            { name: '自建华语', raw: { creator: { userId: 7 } } },
            { name: '收藏的欧美', raw: { creator: { userId: 9 } } },
        ], { moduleFilter: 'all', userId: 7 });
        expect(sections.map(section => [section.id, section.titleKey, section.items.map(item => item.name)])).toEqual([
            ['liked', 'likedSongs', ['我喜欢的音乐']],
            ['created', 'created', ['自建华语']],
            ['collected', 'collected', ['收藏的欧美']],
        ]);
    });

    it('does not relabel a library as collected when playlists have no creator ids', () => {
        const sections = resolveOnlineHomeLibrarySections([
            { name: 'Daily Mix', raw: {} },
            { name: 'Late Night Drive', raw: {} },
        ], { moduleFilter: 'all', userId: 1001 });
        expect(sections).toEqual([
            {
                id: 'primary',
                titleKey: 'playlists',
                items: [
                    { name: 'Daily Mix', raw: {} },
                    { name: 'Late Night Drive', raw: {} },
                ],
            },
        ]);
    });

    it('uses a single created title when every remaining playlist is owned', () => {
        const sections = resolveOnlineHomeLibrarySections([
            { name: '我喜欢的音乐', raw: { creator: { userId: 7 } } },
            { name: '自建华语', raw: { creator: { userId: 7 } } },
        ], { moduleFilter: 'all', userId: 7 });
        expect(sections.map(section => section.titleKey)).toEqual(['likedSongs', 'created']);
    });

    it('keeps module-filter views as one section', () => {
        const created = resolveOnlineHomeLibrarySections([
            { name: '自建华语', raw: { creator: { userId: 7 } } },
        ], { moduleFilter: 'created', userId: 7 });
        const liked = resolveOnlineHomeLibrarySections([
            { name: '我喜欢的音乐', raw: { creator: { userId: 7 } } },
        ], { moduleFilter: 'liked', userId: 7 });
        expect(created).toEqual([{
            id: 'primary',
            titleKey: 'created',
            items: [{ name: '自建华语', raw: { creator: { userId: 7 } } }],
        }]);
        expect(liked[0]?.titleKey).toBe('liked');
    });
});
