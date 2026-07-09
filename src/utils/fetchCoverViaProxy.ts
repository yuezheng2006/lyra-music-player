import { resolveCoverProxyReferer } from './lyricProxyHosts';

// src/utils/fetchCoverViaProxy.ts
// Fetch cover bytes through Electron IPC or /api/lyric-proxy for WebGL-safe textures.

const decodeBase64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const responseFromElectronProxy = (proxied: ElectronLyricProxyResponse): Response => {
  const headers = new Headers(proxied.headers || {});
  if (proxied.bodyEncoding === 'base64' && proxied.bodyBase64) {
    const bytes = decodeBase64ToUint8Array(proxied.bodyBase64);
    const contentType = headers.get('content-type') || 'application/octet-stream';
    return new Response(bytes, {
      status: proxied.status,
      statusText: proxied.statusText,
      headers: {
        ...Object.fromEntries(headers.entries()),
        'content-type': contentType,
      },
    });
  }

  return new Response(proxied.bodyText ?? '', {
    status: proxied.status,
    statusText: proxied.statusText,
    headers,
  });
};

/** Fetch a remote cover URL as a CORS-safe Response (blob-capable). */
export const fetchCoverViaProxy = async (url: string): Promise<Response> => {
  const referer = resolveCoverProxyReferer(url);
  const electronBridge = typeof window !== 'undefined' ? window.electron : undefined;

  if (electronBridge?.fetchLyricProxy) {
    const proxied = await electronBridge.fetchLyricProxy(url, {
      method: 'GET',
      headers: {
        Referer: referer,
        Accept: 'image/*,*/*;q=0.8',
      },
    });
    return responseFromElectronProxy(proxied);
  }

  return fetch(`/api/lyric-proxy?url=${encodeURIComponent(url)}`, {
    credentials: 'omit',
    headers: {
      'X-Proxy-Referer': referer,
      Accept: 'image/*,*/*;q=0.8',
    },
  });
};
