// src/services/lyricsResolveClient.ts
// HTTP client for the private lyrics resolve service.

import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import type {
    LyricsResolveRequest,
    LyricsResolveResponse,
} from '../utils/lyrics/resolveSchema';

/** Temporary hardcoded key; must match services/lyrics-resolve TEMP_DEV_API_KEY. */
export const TEMP_LYRICS_RESOLVE_API_KEY = 'dev-key';

function readEnv(name: string): string {
    try {
        const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
        if (viteEnv && typeof viteEnv[name] === 'string' && viteEnv[name]) {
            return viteEnv[name];
        }
    } catch {
        // ignore
    }
    if (typeof process !== 'undefined' && typeof process.env?.[name] === 'string') {
        return process.env[name] || '';
    }
    return '';
}

export function getLyricsResolveConfig(): { baseUrl: string; apiKey: string } | null {
    const settings = useSettingsUiStore.getState();
    const baseUrl = (
        settings.lyricsResolveBaseUrl
        || readEnv('VITE_LYRICS_RESOLVE_BASE_URL')
        || (typeof localStorage !== 'undefined' ? localStorage.getItem('lyra_lyrics_resolve_base_url') || '' : '')
    ).replace(/\/$/, '');
    const apiKey = settings.lyricsResolveApiKey
        || readEnv('VITE_LYRICS_RESOLVE_API_KEY')
        || (typeof localStorage !== 'undefined' ? localStorage.getItem('lyra_lyrics_resolve_api_key') || '' : '')
        || TEMP_LYRICS_RESOLVE_API_KEY;
    if (!baseUrl) {
        return null;
    }
    return { baseUrl, apiKey };
}

export function isLyricsResolveServiceConfigured(): boolean {
    return getLyricsResolveConfig() !== null;
}

/** Calls POST /v1/lyrics/resolve; returns null on transport/config errors. */
export async function fetchRemoteLyricsResolve(
    request: LyricsResolveRequest,
    options: { signal?: AbortSignal } = {},
): Promise<LyricsResolveResponse | null> {
    const config = getLyricsResolveConfig();
    if (!config) {
        return null;
    }

    try {
        const response = await fetch(`${config.baseUrl}/v1/lyrics/resolve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
                Accept: 'application/json',
            },
            body: JSON.stringify(request),
            signal: options.signal ?? AbortSignal.timeout(request.policy?.timeoutMs ?? 8000),
        });
        if (!response.ok) {
            console.warn(`[lyricsResolveClient] resolve failed: HTTP ${response.status}`);
            return null;
        }
        return await response.json() as LyricsResolveResponse;
    } catch (error) {
        console.warn('[lyricsResolveClient] resolve request failed:', error);
        return null;
    }
}
