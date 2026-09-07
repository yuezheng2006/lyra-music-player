// src/utils/home/onlineHomeLibraryMath.ts
// Liked-songs name matching and library split for the signed-in playlist canvas.

export const isLikedPlaylistName = (name: string | null | undefined): boolean => {
    const value = String(name || '').trim();
    if (!value) return false;
    const lower = value.toLowerCase();
    return value === '我喜欢的音乐'
        || lower === 'liked songs'
        || value.includes('喜欢')
        || value.includes('红心')
        || lower.includes('favorite');
};

export const splitNamedLibraryItems = <T extends { name: string }>(
    items: readonly T[],
): { liked: T[]; library: T[] } => {
    const liked: T[] = [];
    const library: T[] = [];
    for (const item of items) {
        if (isLikedPlaylistName(item.name)) liked.push(item);
        else library.push(item);
    }
    return { liked, library };
};

export const findLikedNamedItem = <T extends { name: string }>(
    items: readonly T[],
): T | null => items.find(item => isLikedPlaylistName(item.name)) ?? null;

export const playlistCreatorUserId = (
    item: { creator?: { userId?: number } | null; raw?: { creator?: { userId?: number } | null } },
): number | null => {
    const value = item.raw?.creator?.userId ?? item.creator?.userId;
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

export const isOwnedLibraryItem = (
    item: { creator?: { userId?: number } | null; raw?: { creator?: { userId?: number } | null } },
    userId?: number | null,
): boolean => {
    if (!userId) return false;
    return playlistCreatorUserId(item) === userId;
};

export const splitOwnedLibraryItems = <T extends {
    creator?: { userId?: number } | null;
    raw?: { creator?: { userId?: number } | null };
}>(
    items: readonly T[],
    userId?: number | null,
): { created: T[]; collected: T[] } => {
    if (!userId) {
        return { created: [], collected: [...items] };
    }
    const created: T[] = [];
    const collected: T[] = [];
    for (const item of items) {
        if (isOwnedLibraryItem(item, userId)) created.push(item);
        else collected.push(item);
    }
    return { created, collected };
};

export type OnlineHomeLibraryModuleFilter = 'all' | 'created' | 'liked';

export type OnlineHomeLibrarySectionTitleKey =
    | 'likedSongs'
    | 'created'
    | 'collected'
    | 'liked'
    | 'playlists';

export type OnlineHomeLibrarySection<T> = {
    id: 'liked' | 'created' | 'collected' | 'primary';
    titleKey: OnlineHomeLibrarySectionTitleKey;
    items: T[];
};

type LibraryOwnershipItem = {
    name: string;
    creator?: { userId?: number } | null;
    raw?: { creator?: { userId?: number } | null };
};

export const resolveOnlineHomeLibraryPrimaryTitleKey = (
    createdCount: number,
    collectedCount: number,
    sawCreatorId: boolean,
): Extract<OnlineHomeLibrarySectionTitleKey, 'created' | 'collected' | 'playlists'> => {
    if (!sawCreatorId) return 'playlists';
    if (createdCount > 0 && collectedCount === 0) return 'created';
    if (collectedCount > 0 && createdCount === 0) return 'collected';
    return 'playlists';
};

export const resolveOnlineHomeLibrarySections = <T extends LibraryOwnershipItem>(
    personalItems: readonly T[],
    options: {
        moduleFilter: OnlineHomeLibraryModuleFilter;
        userId?: number | null;
    },
): Array<OnlineHomeLibrarySection<T>> => {
    const { liked, library } = splitNamedLibraryItems(personalItems);
    const { created, collected } = splitOwnedLibraryItems(library, options.userId);
    const sawCreatorId = library.some(item => playlistCreatorUserId(item) != null);
    const canSplitOwnership = Boolean(options.userId) && created.length > 0 && collected.length > 0;

    if (options.moduleFilter === 'liked') {
        return [{ id: 'primary', titleKey: 'liked', items: [...personalItems] }];
    }
    if (options.moduleFilter === 'created') {
        return [{ id: 'primary', titleKey: 'created', items: [...personalItems] }];
    }

    const sections: Array<OnlineHomeLibrarySection<T>> = [];
    if (liked.length > 0) {
        sections.push({ id: 'liked', titleKey: 'likedSongs', items: liked });
    }
    if (canSplitOwnership) {
        sections.push({ id: 'created', titleKey: 'created', items: created });
        sections.push({ id: 'collected', titleKey: 'collected', items: collected });
        return sections;
    }
    if (library.length > 0) {
        sections.push({
            id: 'primary',
            titleKey: resolveOnlineHomeLibraryPrimaryTitleKey(
                created.length,
                collected.length,
                sawCreatorId,
            ),
            items: library,
        });
    }
    return sections;
};
