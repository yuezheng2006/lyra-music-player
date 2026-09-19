const {
  PODCAST_PROXY_MAX_BYTES,
  isAllowedPodcastProxyUrl,
} = require('../shared/podcastProxyHosts.cjs');

// electron/podcastProxyIpc.cjs
// GET-only Apple catalog / public RSS proxy with SSRF host guards.

const PODCAST_PROXY_HEADERS = {
  Accept: 'application/json, application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.8',
  'User-Agent': 'LyraPodcastCatalog/1.0',
};

async function proxyPodcastRequest(targetUrlStr, { fetchUpstream }) {
  if (!isAllowedPodcastProxyUrl(targetUrlStr)) {
    throw new Error(`Forbidden podcast proxy url: ${targetUrlStr}`);
  }

  const response = await fetchUpstream(targetUrlStr, {
    method: 'GET',
    headers: PODCAST_PROXY_HEADERS,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > PODCAST_PROXY_MAX_BYTES) {
    throw new Error('Podcast catalog response exceeded size limit');
  }

  const normalizedHeaders = {};
  for (const [key, value] of response.headers.entries()) {
    normalizedHeaders[key] = value;
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: normalizedHeaders,
    bodyText: buffer.toString('utf8'),
    bodyBase64: '',
    bodyEncoding: 'text',
  };
}

function registerPodcastProxyIpc(ipcMain, { isTrustedSender, fetchUpstream }) {
  ipcMain.handle('podcast-proxy-fetch', async (event, url) => {
    if (!isTrustedSender(event.sender)) {
      throw new Error('Untrusted renderer attempted to fetch podcast catalog data.');
    }
    if (typeof url !== 'string' || !url) {
      throw new Error('Missing podcast proxy url.');
    }
    return proxyPodcastRequest(url, { fetchUpstream });
  });
}

module.exports = { registerPodcastProxyIpc };
