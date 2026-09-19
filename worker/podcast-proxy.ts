import { PODCAST_PROXY_MAX_BYTES, isAllowedPodcastProxyUrl } from '../shared/podcastProxyHosts.mjs';

// worker/podcast-proxy.ts
// GET-only Apple catalog / public RSS proxy for Cloudflare.

export async function handlePodcastProxy(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type, X-Requested-With',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const targetUrlStr = new URL(request.url).searchParams.get('url');
  if (!targetUrlStr) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!isAllowedPodcastProxyUrl(targetUrlStr)) {
    return new Response(JSON.stringify({ error: 'Forbidden: Domain not allowed' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(targetUrlStr, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/rss+xml, application/xml, text/xml, */*;q=0.8',
        'User-Agent': 'LyraPodcastCatalog/1.0',
      },
    });
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > PODCAST_PROXY_MAX_BYTES) {
      return new Response(JSON.stringify({ error: 'Podcast catalog response exceeded size limit' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const headers = new Headers(corsHeaders);
    const contentType = response.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    return new Response(buffer, { status: response.status, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy request failed', details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
