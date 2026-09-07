export const NOW_PLAYING_HTTP_ORIGIN = 'http://localhost:9863';
export const NOW_PLAYING_QUERY_URL = `${NOW_PLAYING_HTTP_ORIGIN}/api/query`;
export const NOW_PLAYING_SERVICE_REPO = 'https://github.com/Widdit/now-playing-service';
export const NOW_PLAYING_PROBE_TIMEOUT_MS = 1_500;
export const NOW_PLAYING_PROBE_INTERVAL_MS = 8_000;

export type NowPlayingProbeStatus = 'idle' | 'checking' | 'reachable' | 'unreachable';

// src/utils/nowPlaying/nowPlayingServiceProbe.ts
// Lightweight localhost probe for the Widdit now-playing sidecar.

export const probeNowPlayingService = async (
    timeoutMs = NOW_PLAYING_PROBE_TIMEOUT_MS,
): Promise<boolean> => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(NOW_PLAYING_QUERY_URL, {
            cache: 'no-store',
            signal: controller.signal,
        });
        return response.ok;
    } catch {
        return false;
    } finally {
        window.clearTimeout(timer);
    }
};
