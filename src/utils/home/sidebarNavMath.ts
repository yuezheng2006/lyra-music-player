export type SidebarNavGroupId = 'discover' | 'mine';

export type SidebarNavItemId =
    | 'charts'
    | 'library'
    | 'radio'
    | 'podcast'
    | 'history'
    | 'local'
    | 'navidrome'
    | 'ytmusic';

export type SidebarNavGroup = {
    id: SidebarNavGroupId;
    titleKey: 'app.sidebarDiscover' | 'app.sidebarMine';
    items: SidebarNavItemId[];
};

// src/utils/home/sidebarNavMath.ts
// Discover vs Yours matches iMusic column IA without adding a guest Discover tab.

export const resolveSidebarNavGroups = (flags: {
    hasPersonalLibrary: boolean;
    hasRadio: boolean;
    hasHistory: boolean;
    hasNavidrome: boolean;
    hasYtmusic: boolean;
}): SidebarNavGroup[] => {
    const discover: SidebarNavItemId[] = ['charts'];
    if (flags.hasPersonalLibrary) discover.push('library');
    if (flags.hasRadio) discover.push('radio');
    discover.push('podcast');

    const mine: SidebarNavItemId[] = [];
    if (flags.hasHistory) mine.push('history');
    mine.push('local');
    if (flags.hasNavidrome) mine.push('navidrome');
    if (flags.hasYtmusic) mine.push('ytmusic');

    return [
        { id: 'discover', titleKey: 'app.sidebarDiscover', items: discover },
        { id: 'mine', titleKey: 'app.sidebarMine', items: mine },
    ];
};
