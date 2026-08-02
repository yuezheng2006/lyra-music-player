// services/lyrics-resolve/src/server.ts
// Private HTTP server: POST /v1/lyrics/resolve (+ debug search / by-id).

import http from 'node:http';
import { URL } from 'node:url';
import { ApiKeyGate, TEMP_DEV_API_KEY } from './auth';
import { LyricsResolveCache } from './cache';
import { createDefaultProviders } from './providers/createDefaultProviders';
import { createAmllProvider } from './providers/amllProvider';
import { fetchNeteaseLyricsById } from './providers/neteaseProvider';
import { resolveLyrics } from './resolve/resolveLyrics';
import {
    buildLyricsResolveFingerprint,
    normalizeLyricsResolveRequest,
} from './schema';
import { selectBestCandidate } from './resolve/selectCandidate';
import { buildLyricSearchQuery } from '@lyra/utils/lyrics/searchQuery';
import { normalizeLyricMatchDurationMs } from '@lyra/utils/lyrics/duration';

const PORT = Number(process.env.LYRICS_RESOLVE_PORT || process.env.PORT || 3010);
const ENABLE_DEBUG_ROUTES = process.env.LYRICS_RESOLVE_DEBUG === '1';

const gate = ApiKeyGate.fromEnv(process.env.LYRICS_RESOLVE_API_KEYS);
const cache = new LyricsResolveCache();
const defaults = createDefaultProviders();

if (!process.env.LYRICS_RESOLVE_API_KEYS?.trim()) {
    console.warn(`[lyrics-resolve] LYRICS_RESOLVE_API_KEYS unset; using temporary key "${TEMP_DEV_API_KEY}"`);
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    });
    res.end(payload);
}

function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}

function authorize(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    const auth = gate.authorize(req.headers.authorization);
    if (auth.ok) {
        return true;
    }
    sendJson(res, auth.status, { error: auth.error });
    return false;
}

async function handleResolve(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    if (!authorize(req, res)) return;
    let parsed: unknown;
    try {
        const raw = await readBody(req);
        parsed = raw ? JSON.parse(raw) : {};
    } catch {
        sendJson(res, 400, { error: 'Invalid JSON body' });
        return;
    }

    try {
        const request = normalizeLyricsResolveRequest(parsed);
        const response = await resolveLyrics(request, {
            providers: defaults.providers,
            amll: defaults.amll,
            lrclib: defaults.lrclib,
            cache,
        });
        console.log(
            `[lyrics-resolve] resolve status=${response.status} source=${response.provenance?.source ?? '-'} ` +
            `cache=${response.provenance?.cacheHit ? 'hit' : 'miss'} elapsed=${response.elapsedMs}ms ` +
            `fp=${response.fingerprint}`,
        );
        sendJson(res, 200, response);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Resolve failed';
        sendJson(res, message.startsWith('Invalid resolve request') ? 400 : 500, { error: message });
    }
}

async function handleSearch(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    if (!authorize(req, res)) return;
    if (!ENABLE_DEBUG_ROUTES) {
        sendJson(res, 404, { error: 'Not found' });
        return;
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(await readBody(req) || '{}');
    } catch {
        sendJson(res, 400, { error: 'Invalid JSON body' });
        return;
    }
    const request = normalizeLyricsResolveRequest(parsed);
    const query = buildLyricSearchQuery(request.title, request.artist, request.album);
    const target = {
        title: request.title,
        artist: request.artist || '',
        album: request.album,
        durationMs: normalizeLyricMatchDurationMs(request.durationMs),
    };
    const source = request.hints?.preferredSource || 'netease';
    const port = source === 'amll' ? defaults.providers.netease : defaults.providers[source === 'netease' || source === 'qq' || source === 'kugou' ? source : 'netease'];
    const songs = port ? await port.search(query, 10) : [];
    const ranked = songs.map(song => {
        const best = selectBestCandidate([song], target);
        return { song, score: best?.score ?? 0 };
    }).sort((a, b) => b.score - a.score);
    sendJson(res, 200, {
        query,
        fingerprint: buildLyricsResolveFingerprint(request),
        candidates: ranked,
    });
}

async function handleById(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<void> {
    if (!authorize(req, res)) return;
    if (!ENABLE_DEBUG_ROUTES) {
        sendJson(res, 404, { error: 'Not found' });
        return;
    }
    const source = url.searchParams.get('source') || '';
    const id = url.searchParams.get('id') || '';
    const platform = (url.searchParams.get('platform') || 'ncm') as 'ncm' | 'qq';
    if (!id) {
        sendJson(res, 400, { error: 'id is required' });
        return;
    }
    if (source === 'amll') {
        const lyrics = await createAmllProvider().fetchByPlatformId(platform, id);
        sendJson(res, 200, { lyrics, source: 'amll', platform, id });
        return;
    }
    if (source === 'netease') {
        const payload = await fetchNeteaseLyricsById(id);
        sendJson(res, 200, { ...payload, source: 'netease', id });
        return;
    }
    sendJson(res, 400, { error: 'source must be amll or netease' });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    try {
        if (req.method === 'GET' && url.pathname === '/health') {
            sendJson(res, 200, { ok: true, keysConfigured: gate.size > 0 });
            return;
        }
        if (req.method === 'POST' && url.pathname === '/v1/lyrics/resolve') {
            await handleResolve(req, res);
            return;
        }
        if (req.method === 'POST' && url.pathname === '/v1/lyrics/search') {
            await handleSearch(req, res);
            return;
        }
        if (req.method === 'GET' && url.pathname === '/v1/lyrics/by-id') {
            await handleById(req, res, url);
            return;
        }
        if (req.method === 'DELETE' && url.pathname === '/v1/lyrics/cache') {
            if (!authorize(req, res)) return;
            const fp = url.searchParams.get('fingerprint');
            if (fp) {
                sendJson(res, 200, { deleted: cache.delete(fp) });
            } else {
                cache.clear();
                sendJson(res, 200, { cleared: true });
            }
            return;
        }
        sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
        console.error('[lyrics-resolve] unhandled error:', error);
        sendJson(res, 500, { error: 'Internal server error' });
    }
});

if (gate.size === 0) {
    console.warn('[lyrics-resolve] LYRICS_RESOLVE_API_KEYS is empty; all authenticated routes will return 503');
}

server.listen(PORT, () => {
    console.log(`[lyrics-resolve] listening on http://127.0.0.1:${PORT}`);
});
