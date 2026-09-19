import { PODCAST_PROXY_MAX_BYTES } from '../../utils/podcastProxyHosts';

// src/services/podcast/fetchPodcastRemote.ts
// Fetch Apple catalog JSON / RSS XML through Electron IPC or the web podcast proxy.

const responseFromElectronProxy = (proxied: ElectronLyricProxyResponse): Response => {
    const headers = new Headers(proxied.headers || {});
    return new Response(proxied.bodyText ?? '', {
        status: proxied.status,
        statusText: proxied.statusText,
        headers,
    });
};

const throwIfTooLarge = (text: string) => {
    if (text.length > PODCAST_PROXY_MAX_BYTES) {
        throw new Error('Podcast catalog response exceeded size limit');
    }
};

export const fetchPodcastRemoteText = async (url: string): Promise<string> => {
    const electronBridge = typeof window !== 'undefined' ? window.electron : undefined;
    if (electronBridge?.fetchPodcastProxy) {
        const proxied = await electronBridge.fetchPodcastProxy(url);
        const response = responseFromElectronProxy(proxied);
        const text = await response.text();
        throwIfTooLarge(text);
        if (!response.ok) {
            throw new Error(`Podcast catalog failed: ${response.status}`);
        }
        return text;
    }

    const response = await fetch(`/api/podcast-proxy?url=${encodeURIComponent(url)}`, {
        credentials: 'omit',
        headers: { Accept: 'application/json, application/rss+xml, application/xml, text/xml, */*' },
    });
    const text = await response.text();
    throwIfTooLarge(text);
    if (!response.ok) {
        throw new Error(`Podcast catalog failed: ${response.status}`);
    }
    return text;
};

export const fetchPodcastRemoteJson = async <T>(url: string): Promise<T> => {
    const text = await fetchPodcastRemoteText(url);
    return JSON.parse(text) as T;
};
