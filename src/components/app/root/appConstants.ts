import type { Theme } from '../../../types';

export const LOCAL_MUSIC_UPDATED_EVENT = 'folia-local-music-updated';
export const DEV_DEBUG_SHORTCUT_LABEL = 'Alt+Shift+D';
export const ONLINE_AUDIO_URL_TTL_MS = 1200 * 1000;
export const ONLINE_AUDIO_URL_REFRESH_BUFFER_MS = 60 * 1000;
export const PLAYER_CHROME_HIDDEN_STORAGE_KEY = 'player_chrome_hidden';
export const LOCAL_TAIL_DECODE_ERROR_TOLERANCE_SEC = 3;

/** 午夜墨染 — dark 默认对齐霜色歌词墨 */
export const DEFAULT_THEME: Theme = {
    name: 'Midnight Default',
    backgroundColor: '#09090b',
    primaryColor: '#E8F4F8',
    accentColor: '#E8F4F8',
    secondaryColor: '#C1C8D6',
    fontStyle: 'sans',
    animationIntensity: 'normal',
};

/** 日光素白 — 页面主色保持深墨可读；歌词可再切明亮白预设 */
export const DAYLIGHT_THEME: Theme = {
    name: 'Daylight Default',
    backgroundColor: '#f5f5f4',
    primaryColor: '#1c1917',
    accentColor: '#ea580c',
    secondaryColor: '#44403c',
    fontStyle: 'sans',
    animationIntensity: 'normal',
};
