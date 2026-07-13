// src/utils/ytmusicHomeChips.ts
// Default quick-search chips for YTM empty state (CN-first discovery).

/** Domestic / Mandarin-first quick search labels shown under the YTM search box. */
export const YTMUSIC_HOME_CHIPS_CN = [
    '周杰伦',
    '林俊杰',
    '邓紫棋',
    '华语流行',
    '古风',
    '粤语',
    '民谣',
    'R&B',
] as const;

export type YtmusicHomeChip = (typeof YTMUSIC_HOME_CHIPS_CN)[number];

/** Empty-state recommendation sections — search seeds (same IPC path as chips; reliable in CN). */
export const YTMUSIC_HOME_SEED_QUERIES = YTMUSIC_HOME_CHIPS_CN.slice(0, 3);

export const YTMUSIC_HOME_SEED_TRACK_LIMIT = 8;
