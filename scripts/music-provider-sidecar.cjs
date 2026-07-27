const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { createProviderRegistry } = require('./music-provider-plugin/discover.cjs');
const { pathToFileURL } = require('url');

// scripts/music-provider-sidecar.cjs
// Bridges Auralis's provider API to built-in + user plugin adapters (protocol v1).

let fetchWithProxyFallback = globalThis.fetch.bind(globalThis);
let neutralizeDeadEnvProxy = async () => ({ cleared: false, reason: 'unloaded' });

const loadProxyFallbackHelper = async () => {
  const helperPath = path.join(__dirname, 'music-provider-adapters', 'fetchWithProxyFallback.mjs');
  const mod = await import(pathToFileURL(helperPath).href);
  if (typeof mod.fetchWithProxyFallback === 'function') {
    fetchWithProxyFallback = mod.fetchWithProxyFallback;
  }
  if (typeof mod.neutralizeDeadEnvProxy === 'function') {
    neutralizeDeadEnvProxy = mod.neutralizeDeadEnvProxy;
  }
};

const port = Number(process.env.MUSIC_PROVIDER_SIDECAR_PORT || 3002);
const host = process.env.MUSIC_PROVIDER_SIDECAR_HOST || '127.0.0.1';
const timeoutMs = Number(process.env.MUSIC_PROVIDER_EXTRACTOR_TIMEOUT_MS || 30000);
const adapterCache = new Map();

const builtinAdaptersDir = path.join(__dirname, 'music-provider-adapters');
const userPluginsDir = (() => {
  const fromEnv = process.env.MUSIC_PROVIDER_USER_PLUGINS_DIR;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim();
  }
  // Dev fallback when Electron does not inject userData.
  return path.join(os.homedir(), '.lyra', 'music-providers');
})();

const registry = createProviderRegistry({
  builtinAdaptersDir,
  userPluginsDir,
});

const providerEnvName = (provider, action) =>
  `MUSIC_PROVIDER_${String(provider).toUpperCase().replace(/-/g, '_')}_${action.toUpperCase()}_CMD`;

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(payload));
};

const getExtractorCommand = (provider, action) => {
  const specific = process.env[providerEnvName(provider, action)];
  if (specific && specific.trim()) return specific.trim();
  const generic = process.env.MUSIC_PROVIDER_EXTRACTOR_CMD;
  return generic && generic.trim() ? generic.trim() : null;
};

const loadAdapter = async (provider) => {
  const modulePath = registry.getAdapterPath(provider);
  if (!modulePath) return null;
  const resolvedPath = path.isAbsolute(modulePath)
    ? modulePath
    : path.resolve(__dirname, modulePath);
  if (!fs.existsSync(resolvedPath)) {
    const error = new Error(`[music-provider-sidecar] adapter missing for ${provider}: ${resolvedPath}`);
    if (registry.isCuratedBuiltin(provider)) {
      throw error;
    }
    console.warn(error.message);
    return null;
  }
  const cached = adapterCache.get(resolvedPath);
  if (cached && process.env.NODE_ENV === 'production') {
    return cached.adapter;
  }

  const mtimeMs = fs.statSync(resolvedPath).mtimeMs;
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.adapter;
  }

  const mod = await import(`file://${resolvedPath}?t=${mtimeMs}`);
  const adapter = mod.default || mod;
  adapterCache.set(resolvedPath, { mtimeMs, adapter });
  return adapter;
};

const runAdapter = async (provider, action, payload) => {
  const adapter = await loadAdapter(provider);
  if (!adapter) return null;
  const handler = adapter[action];
  if (typeof handler !== 'function') {
    return null;
  }
  return handler({
    provider,
    action,
    ...payload,
  });
};

const runExtractor = (provider, action, payload) => new Promise((resolve, reject) => {
  const command = getExtractorCommand(provider, action);
  if (!command) {
    resolve(null);
    return;
  }

  const child = spawn(command, {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      MUSIC_PROVIDER_ID: provider,
      MUSIC_PROVIDER_ACTION: action,
    },
  });

  let stdout = '';
  let stderr = '';
  const timer = setTimeout(() => {
    child.kill('SIGTERM');
    reject(new Error(`Extractor timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  child.stdout.on('data', chunk => {
    stdout += chunk.toString('utf8');
  });
  child.stderr.on('data', chunk => {
    stderr += chunk.toString('utf8');
  });
  child.on('error', error => {
    clearTimeout(timer);
    reject(error);
  });
  child.on('close', code => {
    clearTimeout(timer);
    if (code !== 0) {
      reject(new Error(stderr || `Extractor exited with code ${code}`));
      return;
    }
    try {
      resolve(stdout.trim() ? JSON.parse(stdout) : {});
    } catch (error) {
      reject(new Error(`Extractor returned invalid JSON: ${error.message}`));
    }
  });

  child.stdin.end(JSON.stringify({
    provider,
    action,
    ...payload,
  }));
});

const parseProviderPath = (pathname) => {
  if (pathname === '/providers') {
    return { kind: 'catalog' };
  }
  if (pathname === '/providers/reload') {
    return { kind: 'reload' };
  }
  if (pathname === '/providers/dir') {
    return { kind: 'dir' };
  }
  const match = pathname.match(/^\/providers\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  const [, provider, endpoint] = match;
  if (!registry.hasProvider(provider)) {
    return null;
  }
  return { kind: 'action', provider, endpoint };
};

const normalizeSearchResponse = (payload) => {
  if (!payload) {
    return { songs: [], total: 0, hasMore: false };
  }
  const songs = Array.isArray(payload.songs)
    ? payload.songs
    : Array.isArray(payload.results)
      ? payload.results
      : [];
  return {
    songs,
    total: typeof payload.total === 'number' ? payload.total : songs.length,
    hasMore: Boolean(payload.hasMore),
    ...(payload.kind ? { kind: payload.kind } : {}),
    ...(payload.query ? { query: payload.query } : {}),
    ...(payload.searchMode ? { searchMode: payload.searchMode } : {}),
    ...(payload.uploader ? { uploader: payload.uploader } : {}),
  };
};

const isQishuiShareUrl = (value) =>
  typeof value === 'string' && /^https?:\/\/qishui\.douyin\.com\/s\/[A-Za-z0-9]+/.test(value.trim());

const parseQishuiUrl = async (url) => {
  if (!isQishuiShareUrl(url)) {
    return null;
  }

  const apiUrl = process.env.MUSIC_PROVIDER_QISHUI_API_BASE || 'https://api.bugpk.com/api/qsmusic';
  const requestUrl = new URL(apiUrl);
  requestUrl.searchParams.set('url', url.trim());

  const response = await fetchWithProxyFallback(requestUrl, {
    headers: {
      'User-Agent': 'Auralis/1.0',
      'Referer': 'https://www.baidu.com/',
    },
  });
  if (!response.ok) {
    throw new Error(`Qishui parser failed: ${response.status}`);
  }

  const data = await response.json();
  const raw = data?.data && typeof data.data === 'object' ? data.data : data;
  const audioUrl = raw?.url || raw?.music_url || raw?.play_url || '';
  if (!audioUrl) {
    return null;
  }

  const artist = raw?.artistsname || raw?.artist || raw?.author || '';
  const title = raw?.albumname || raw?.name || raw?.title || 'Qishui Music';
  const avatars = raw?.artistsmedium_avatar_url;
  const coverUrl = Array.isArray(avatars) ? avatars[0] : raw?.cover || raw?.pic || '';

  return {
    id: url.trim(),
    title,
    artists: artist ? [artist] : [],
    album: raw?.albumname || '',
    coverUrl,
    audioUrl,
    lyricsText: raw?.lyrics || raw?.lyric || '',
  };
};

const runBuiltInProvider = async (provider, action, payload) => {
  if (provider !== 'qishui') {
    return null;
  }

  if (action === 'search') {
    const parsed = await parseQishuiUrl(payload.query);
    return parsed
      ? { songs: [parsed], total: 1, hasMore: false }
      : { songs: [], total: 0, hasMore: false };
  }

  if (action === 'audio') {
    const url = payload.song?.providerSongId || payload.id;
    const parsed = await parseQishuiUrl(url);
    return parsed?.audioUrl ? { audioUrl: parsed.audioUrl } : null;
  }

  if (action === 'lyrics') {
    const parsed = await parseQishuiUrl(payload.id);
    return parsed?.lyricsText ? { lyricsText: parsed.lyricsText } : { lyrics: null };
  }

  return null;
};

const clearAdapterCache = () => {
  adapterCache.clear();
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`);
  const route = parseProviderPath(url.pathname);
  if (!route) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  try {
    if (route.kind === 'catalog' && req.method === 'GET') {
      sendJson(res, 200, {
        protocolVersion: 1,
        userPluginsDir: registry.getUserPluginsDir(),
        providers: registry.listProviders(),
      });
      return;
    }

    if (route.kind === 'dir' && req.method === 'GET') {
      sendJson(res, 200, {
        userPluginsDir: registry.getUserPluginsDir(),
      });
      return;
    }

    if (route.kind === 'reload' && req.method === 'POST') {
      clearAdapterCache();
      const providers = registry.rescan();
      sendJson(res, 200, {
        protocolVersion: 1,
        userPluginsDir: registry.getUserPluginsDir(),
        providers,
      });
      return;
    }

    if (route.kind !== 'action') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    if (route.endpoint === 'search' && req.method === 'GET') {
      const requestPayload = {
        query: url.searchParams.get('q') || '',
        limit: Number(url.searchParams.get('limit') || 30),
        offset: Number(url.searchParams.get('offset') || 0),
      };
      const payload = await runAdapter(route.provider, 'search', requestPayload)
        || await runBuiltInProvider(route.provider, 'search', requestPayload)
        || await runExtractor(route.provider, 'search', requestPayload);
      const normalized = normalizeSearchResponse(payload);
      normalized.songs = normalized.songs.map((song) => (
        song && typeof song === 'object'
          ? { ...song, musicProvider: song.musicProvider || route.provider }
          : song
      ));
      sendJson(res, 200, normalized);
      return;
    }

    if (route.endpoint === 'song-url' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req) || '{}');
      const payload = await runAdapter(route.provider, 'audio', body)
        || await runBuiltInProvider(route.provider, 'audio', body)
        || await runExtractor(route.provider, 'audio', body);
      const audioUrl = payload?.audioUrl || payload?.url || null;
      const videoUrl = typeof payload?.videoUrl === 'string' && payload.videoUrl.trim()
        ? payload.videoUrl.trim()
        : null;
      sendJson(
        res,
        audioUrl ? 200 : 404,
        audioUrl
          ? { audioUrl, ...(videoUrl ? { videoUrl } : {}) }
          : { error: 'Audio URL unavailable' },
      );
      return;
    }

    if (route.endpoint === 'lyrics' && (req.method === 'GET' || req.method === 'POST')) {
      const requestPayload = req.method === 'POST'
        ? JSON.parse(await readBody(req) || '{}')
        : {
          id: url.searchParams.get('id') || '',
        };
      const payload = await runAdapter(route.provider, 'lyrics', requestPayload)
        || await runBuiltInProvider(route.provider, 'lyrics', requestPayload)
        || await runExtractor(route.provider, 'lyrics', requestPayload);
      sendJson(res, 200, payload || { lyrics: null });
      return;
    }

    if (route.endpoint === 'recommend' && (req.method === 'GET' || req.method === 'POST')) {
      const requestPayload = req.method === 'POST'
        ? JSON.parse(await readBody(req) || '{}')
        : {
          limit: Number(url.searchParams.get('limit') || 20),
        };
      if (requestPayload.limit == null) {
        requestPayload.limit = Number(url.searchParams.get('limit') || 20);
      }
      const payload = await runAdapter(route.provider, 'recommend', requestPayload)
        || await runExtractor(route.provider, 'recommend', requestPayload);
      sendJson(res, 200, normalizeSearchResponse(payload));
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('[music-provider-sidecar] request failed', error);
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

const startServer = async () => {
  try {
    await loadProxyFallbackHelper();
    await neutralizeDeadEnvProxy();
    // Adapters call global fetch; wrap so a dead Clash port cannot 500 every search.
    if (typeof fetchWithProxyFallback === 'function') {
      globalThis.fetch = fetchWithProxyFallback;
    }
  } catch (error) {
    console.warn('[music-provider-sidecar] proxy fallback helper unavailable', error);
  }

  server.listen(port, host, () => {
    const loaded = registry.listProviders().map((p) => p.id).join(', ');
    console.log(`[music-provider-sidecar] listening on http://${host}:${port}`);
    console.log(`[music-provider-sidecar] user plugins: ${registry.getUserPluginsDir()}`);
    console.log(`[music-provider-sidecar] providers: ${loaded || '(none)'}`);
  });
};

startServer().catch((error) => {
  console.error('[music-provider-sidecar] failed to start', error);
  process.exit(1);
});
