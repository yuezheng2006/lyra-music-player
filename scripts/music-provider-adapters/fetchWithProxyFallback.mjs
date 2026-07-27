import net from 'node:net';
import { Agent, setGlobalDispatcher } from 'undici';

// scripts/music-provider-adapters/fetchWithProxyFallback.mjs
// When Clash/V2Ray leaves HTTP(S)_PROXY pointing at a dead loopback port, Node's
// NODE_USE_ENV_PROXY fetch fails in ~0ms. Retry direct so peer providers stay usable.

const PROXY_ENV_KEYS = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'http_proxy',
  'https_proxy',
  'all_proxy',
  'NODE_USE_ENV_PROXY',
];

const directAgent = new Agent();
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
      // Env already cleared, but undici may still be dispatching via a dead local proxy.
      return true;
    }
    current = current.cause;
  }
  return false;
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
    try {
      return await doFetch(input, init);
    } catch (error) {
      if (!isEnvProxyConnectionError(error)) {
        throw error;
      }
      const proxyUrl = readConfiguredProxyUrl();
      console.warn(
        `[fetchWithProxyFallback] env proxy unreachable (${proxyUrl}); retrying direct`,
      );
      // Passing an undici Agent dispatcher bypasses NODE_USE_ENV_PROXY.
      return doFetch(input, {
        ...init,
        dispatcher: directAgent,
      });
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
  // NODE_USE_ENV_PROXY installs an EnvHttpProxyAgent as the global dispatcher;
  // clearing env alone does not uninstall it.
  try {
    setGlobalDispatcher(new Agent());
  } catch (error) {
    console.warn('[fetchWithProxyFallback] failed to reset undici dispatcher', error);
  }
  console.warn(
    `[fetchWithProxyFallback] cleared unreachable loopback proxy env (${proxyUrl})`,
  );
  return { cleared: true, reason: 'unreachable', proxyUrl };
}
