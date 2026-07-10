import type { Theme } from '../../../types';

export const LOCAL_MUSIC_UPDATED_EVENT = 'folia-local-music-updated';
export const DEV_DEBUG_SHORTCUT_LABEL = 'Alt+Shift+D';
export const ONLINE_AUDIO_URL_TTL_MS = 1200 * 1000;
export const ONLINE_AUDIO_URL_REFRESH_BUFFER_MS = 60 * 1000;
export const PLAYER_CHROME_HIDDEN_STORAGE_KEY = 'player_chrome_hidden';
export const LOCAL_TAIL_DECODE_ERROR_TOLERANCE_SEC = 3;

/** 午夜墨染 — dark 文字层级对齐 Mineradio：主文近纯白，次级银灰可读 */
export const DEFAULT_THEME: Theme = {
    name: 'Midnight Default',
    backgroundColor: '#09090b',
    primaryColor: '#fafafa',
    accentColor: '#ffffff',
    secondaryColor: '#b8b8c2',
    fontStyle: 'sans',
    animationIntensity: 'normal',
};

/** 日光素白 */
export const DAYLIGHT_THEME: Theme = {
    name: 'Daylight Default',
    backgroundColor: '#f5f5f4',
    primaryColor: '#1c1917',
    accentColor: '#ea580c',
    secondaryColor: '#44403c',
    fontStyle: 'sans',
    animationIntensity: 'normal',
};
