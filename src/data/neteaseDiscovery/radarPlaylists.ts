// Official NetEase radar playlist ids used by the home discovery shelf.

export type NeteaseRadarPlaylistId = 3136952023 | 2829883282 | 2829816518 | 2829896389;

export interface NeteaseRadarPlaylistDefinition {
    id: NeteaseRadarPlaylistId;
    fallbackTitleKey: string;
}

// Official NetEase radar family (same IDs YesPlayMusic / Kumone special-case).
export const NETEASE_RADAR_PLAYLISTS: readonly NeteaseRadarPlaylistDefinition[] = [
    { id: 3136952023, fallbackTitleKey: 'home.radarPrivate' },
    { id: 2829883282, fallbackTitleKey: 'home.radarChinese' },
    { id: 2829816518, fallbackTitleKey: 'home.radarWestern' },
    { id: 2829896389, fallbackTitleKey: 'home.radarJapanese' },
];

export const NETEASE_RADAR_PLAYLIST_IDS = NETEASE_RADAR_PLAYLISTS.map(item => item.id);
