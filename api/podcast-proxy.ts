import { URL } from 'url';
import { PODCAST_PROXY_MAX_BYTES, isAllowedPodcastProxyUrl } from '../shared/podcastProxyHosts.mjs';

// api/podcast-proxy.ts
// GET-only Apple catalog / public RSS proxy for Vercel.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': [
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Content-Type',
  ].join(', '),
};

export default async function handler(req: any, res: any) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const targetUrlStr = req.query?.url;
  if (!targetUrlStr || typeof targetUrlStr !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
  if (!isAllowedPodcastProxyUrl(targetUrlStr)) {
    return res.status(403).json({ error: 'Forbidden: Domain not allowed' });
  }

  try {
    const targetUrl = new URL(targetUrlStr);
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/rss+xml, application/xml, text/xml, */*;q=0.8',
        'User-Agent': 'LyraPodcastCatalog/1.0',
      },
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > PODCAST_PROXY_MAX_BYTES) {
      return res.status(413).json({ error: 'Podcast catalog response exceeded size limit' });
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    return res.status(response.status).send(buffer);
  } catch (error) {
    console.error('Podcast proxy request failed:', error);
    return res.status(500).json({ error: 'Proxy request failed', details: String(error) });
  }
}
