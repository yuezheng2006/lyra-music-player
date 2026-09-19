import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { URL } from 'node:url';

// scripts/music-provider-adapters/fetchWithProxyFallback.mjs
// When Clash/V2Ray leaves HTTP(S)_PROXY pointing at a dead loopback port, Node's
// NODE_USE_ENV_PROXY fetch fails in ~0ms. Retry direct so peer providers stay usable.
// Intentionally avoids `undici` so packaged Electron sidecars (asar.unpacked) resolve.

const PROXY_ENV_KEYS = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'http_proxy',
  'https_proxy',
  'all_proxy',
  'NODE_USE_ENV_PROXY',
];

// Captured at module load so sidecar can safely assign this helper to globalThis.fetch.
const nativeFetch = globalThis.fetch.bind(globalThis);
// Remember last-seen proxy URL so retries still work after neutralize clears env.
let lastSeenProxyUrl = '';

/** Read the first configured HTTP(S)/ALL proxy URL from process env. */
export const readConfiguredProxyUrl = () => {
  for (const key of ['HTTPS_PROXY', 'HTTP_PROXY', 'https_proxy', 'http_proxy', 'ALL_PROXY', 'all_proxy']) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      lastSeenProxyUrl = value.trim();
      return lastSeenProxyUrl;
    }
  }
  return lastSeenProxyUrl;
};

const isLoopbackHost = (hostname) => {
  const host = String(hostname || '').toLowerCase();
  return host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '0.0.0.0';
};

const parseProxyEndpoint = (proxyUrl) => {
  try {
    const normalized = /^(?:https?|socks5?):\/\//i.test(proxyUrl)
      ? proxyUrl
      : `http://${proxyUrl}`;
    const parsed = new URL(normalized);
    const port = Number(parsed.port)
      || (parsed.protocol.startsWith('https') ? 443 : 80);
    return {
      hostname: parsed.hostname,
      port,
    };
  } catch {
    return null;
  }
};

/** True when undici/node fetch failed because the env proxy itself is unreachable. */
export const isEnvProxyConnectionError = (error) => {
  const proxyUrl = readConfiguredProxyUrl();
  const endpoint = proxyUrl ? parseProxyEndpoint(proxyUrl) : null;

  let current = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const code = current.code || current.cause?.code;
    const address = current.address || current.cause?.address;
    const port = current.port || current.cause?.port;
    if (!(code === 'ECONNREFUSED' || code === 'ECONNRESET' || code === 'ETIMEDOUT')) {
      current = current.cause;
      continue;
    }
    if (endpoint) {
      if (
        (
          address === endpoint.hostname
          || (isLoopbackHost(endpoint.hostname) && isLoopbackHost(address))
        )
        && (port == null || Number(port) === endpoint.port)
      ) {
        return true;
      }
    } else if (isLoopbackHost(address) && Number(port) > 0) {
      // Env already cleared, but Node may still be dispatching via a dead local proxy.
      return true;
    }
    current = current.cause;
  }
  return false;
};

const normalizeHeaders = (headers) => {
  if (!headers) return {};
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
};

/** Proxy-free fetch via node:http(s) — works in packaged Electron sidecars. */
export const directHttpFetch = (input, init = {}) => new Promise((resolve, reject) => {
  const url = new URL(typeof input === 'string' ? input : String(input?.url || input));
  const lib = url.protocol === 'http:' ? http : https;
  const method = typeof init.method === 'string' ? init.method : 'GET';
  const headers = normalizeHeaders(init.headers);
  const req = lib.request(url, {
    method,
    headers,
    // Explicitly omit agent so HTTP(S)_PROXY is not applied.
    agent: false,
  }, (res) => {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const body = Buffer.concat(chunks);
      resolve(new Response(body, {
        status: res.statusCode || 0,
        statusText: res.statusMessage || '',
        headers: res.headers,
      }));
    });
  });
  req.on('error', reject);
  if (init.signal) {
    if (init.signal.aborted) {
      req.destroy(new Error('Aborted'));
      return;
    }
    init.signal.addEventListener('abort', () => req.destroy(new Error('Aborted')), { once: true });
  }
  if (init.body != null) {
    req.write(init.body);
  }
  req.end();
});

/** Hosts that often stall behind a live local Clash route — race direct in parallel. */
const PREFER_DIRECT_HOSTS = new Set([
  'api.qishui.com',
  'music.douyin.com',
  'qishui.douyin.com',
]);

export const shouldPreferDirectForUrl = (input) => {
  try {
    const raw = typeof input === 'string' ? input : String(input?.url || input);
    const hostname = new URL(raw).hostname.toLowerCase();
    return PREFER_DIRECT_HOSTS.has(hostname);
  } catch {
    return false;
  }
};

/** True when env points at a loopback proxy (Clash/V2Ray style). */
export const hasLoopbackProxyConfigured = () => {
  const proxyUrl = readConfiguredProxyUrl();
  if (!proxyUrl) return false;
  const endpoint = parseProxyEndpoint(proxyUrl);
  return Boolean(endpoint && isLoopbackHost(endpoint.hostname));
};

const firstSettledOk = async (tasks) => {
  const errors = [];
  return new Promise((resolve, reject) => {
    let settled = false;
    let pending = tasks.length;
    if (pending === 0) {
      reject(new Error('No fetch candidates'));
      return;
    }
    for (const task of tasks) {
      Promise.resolve()
        .then(task)
        .then((value) => {
          if (settled) return;
          settled = true;
          resolve(value);
        }, (error) => {
          errors.push(error);
          pending -= 1;
          if (!settled && pending === 0) {
            reject(errors[0] || new Error('All fetch candidates failed'));
          }
        });
    }
  });
};

/**
 * Build a fetch wrapper around `baseFetch`.
 * Sidecar may install the default export as globalThis.fetch; tests inject a mock.
 */
export const createFetchWithProxyFallback = (baseFetch) => {
  const fetchWithProxyFallback = async (input, init = {}) => {
    const doFetch = typeof baseFetch === 'function'
      ? baseFetch
      // Prefer the current global fetch (vitest stubs) unless we replaced it with ourselves.
      : (globalThis.fetch && globalThis.fetch !== fetchWithProxyFallback
        ? globalThis.fetch.bind(globalThis)
        : nativeFetch);

    // Live loopback proxies can reach the proxy yet stall on Qishui/Douyin —
    // race a direct request so search/audition is not blocked by Clash routing.
    if (shouldPreferDirectForUrl(input) && hasLoopbackProxyConfigured()) {
      if (typeof baseFetch === 'function') {
        return firstSettledOk([
          () => baseFetch(input, { ...init, dispatcher: 'direct' }),
          () => doFetch(input, init),
        ]);
      }
      return firstSettledOk([
        () => directHttpFetch(input, init),
        () => doFetch(input, init),
      ]);
    }

    try {
      return await doFetch(input, init);
    } catch (error) {
      if (!isEnvProxyConnectionError(error)) {
        throw error;
      }
      const proxyUrl = readConfiguredProxyUrl();
      console.warn(
        `[fetchWithProxyFallback] env proxy unreachable (${proxyUrl || 'loopback'}); retrying direct`,
      );
      if (typeof baseFetch === 'function') {
        // Test inject path — second call signals direct retry.
        return baseFetch(input, { ...init, dispatcher: 'direct' });
      }
      return directHttpFetch(input, init);
    }
  };
  return fetchWithProxyFallback;
};

export const fetchWithProxyFallback = createFetchWithProxyFallback();

const probeTcp = (hostname, port, timeoutMs) => new Promise((resolve) => {
  const socket = net.connect({ host: hostname, port });
  let settled = false;
  const finish = (ok) => {
    if (settled) return;
    settled = true;
    socket.destroy();
    resolve(ok);
  };
  socket.setTimeout(timeoutMs);
  socket.once('connect', () => finish(true));
  socket.once('timeout', () => finish(false));
  socket.once('error', () => finish(false));
});

/** Clear dead loopback proxy env so subsequent fetches do not hard-fail. */
export async function neutralizeDeadEnvProxy({ timeoutMs = 250 } = {}) {
  const proxyUrl = readConfiguredProxyUrl();
  if (!proxyUrl) {
    return { cleared: false, reason: 'no-proxy' };
  }
  const endpoint = parseProxyEndpoint(proxyUrl);
  if (!endpoint || !isLoopbackHost(endpoint.hostname)) {
    return { cleared: false, reason: 'non-loopback' };
  }

  const reachable = await probeTcp(endpoint.hostname, endpoint.port, timeoutMs);
  if (reachable) {
    return { cleared: false, reason: 'reachable', proxyUrl };
  }

  lastSeenProxyUrl = proxyUrl;
  for (const key of PROXY_ENV_KEYS) {
    delete process.env[key];
  }
  console.warn(
    `[fetchWithProxyFallback] cleared unreachable loopback proxy env (${proxyUrl})`,
  );
  return { cleared: true, reason: 'unreachable', proxyUrl };
}
