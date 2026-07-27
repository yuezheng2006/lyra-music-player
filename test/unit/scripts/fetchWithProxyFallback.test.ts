import { afterEach, describe, expect, it, vi } from 'vitest';

// test/unit/scripts/fetchWithProxyFallback.test.ts
// Dead local HTTP_PROXY must not hard-fail peer provider fetch (qishui/coco/…).

const helperUrl = new URL(
  '../../../scripts/music-provider-adapters/fetchWithProxyFallback.mjs',
  import.meta.url,
).href;

const loadHelper = async () => import(`${helperUrl}?t=${Date.now()}`);

describe('fetchWithProxyFallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.http_proxy;
    delete process.env.https_proxy;
    delete process.env.ALL_PROXY;
    delete process.env.all_proxy;
    delete process.env.NODE_USE_ENV_PROXY;
  });

  it('exports isEnvProxyConnectionError that detects ECONNREFUSED to the env proxy host', async () => {
    process.env.HTTPS_PROXY = 'http://127.0.0.1:7897';
    process.env.NODE_USE_ENV_PROXY = '1';
    const helper = await loadHelper();

    const error = Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:7897'), {
        code: 'ECONNREFUSED',
        address: '127.0.0.1',
        port: 7897,
      }),
    });

    expect(helper.isEnvProxyConnectionError(error)).toBe(true);
    expect(helper.isEnvProxyConnectionError(new Error('Qishui request failed: 403'))).toBe(false);
  });

  it('retries with a direct undici Agent when the env proxy connection is refused', async () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:7897';
    process.env.HTTPS_PROXY = 'http://127.0.0.1:7897';
    process.env.NODE_USE_ENV_PROXY = '1';

    const proxyError = Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:7897'), {
        code: 'ECONNREFUSED',
        address: '127.0.0.1',
        port: 7897,
      }),
    });

    const okResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const fetchMock = vi.fn()
      .mockRejectedValueOnce(proxyError)
      .mockResolvedValueOnce(okResponse);

    const helper = await loadHelper();
    const resilientFetch = helper.createFetchWithProxyFallback(fetchMock);
    const response = await resilientFetch('https://api.qishui.com/luna/pc/search/track?q=test');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCall = fetchMock.mock.calls[1];
    expect(secondCall[1]?.dispatcher).toBe('direct');
  });

  it('does not import undici (packaged Electron sidecar has no node_modules resolution)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const helperPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../scripts/music-provider-adapters/fetchWithProxyFallback.mjs',
    );
    const source = fs.readFileSync(helperPath, 'utf8');
    expect(source).not.toMatch(/from ['"]undici['"]/);
    expect(source).toContain('directHttpFetch');
    expect(source).toContain("from 'node:http'");
  });

  it('clears unreachable loopback proxy env vars in neutralizeDeadEnvProxy', async () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:17997';
    process.env.HTTPS_PROXY = 'http://127.0.0.1:17997';
    process.env.ALL_PROXY = 'socks5://127.0.0.1:17997';
    process.env.NODE_USE_ENV_PROXY = '1';

    const helper = await loadHelper();
    const result = await helper.neutralizeDeadEnvProxy({ timeoutMs: 200 });

    expect(result.cleared).toBe(true);
    expect(process.env.HTTP_PROXY).toBeUndefined();
    expect(process.env.HTTPS_PROXY).toBeUndefined();
    expect(process.env.ALL_PROXY).toBeUndefined();
    expect(process.env.NODE_USE_ENV_PROXY).toBeUndefined();
  });
});

describe('qishui adapter / sidecar proxy resilience wiring', () => {
  it('qishui adapter uses fetchWithProxyFallback for outbound requests', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    const adapterSource = fs.readFileSync(
      path.join(repoRoot, 'scripts/music-provider-adapters/qishui-provider-adapter.mjs'),
      'utf8',
    );
    const sidecarSource = fs.readFileSync(
      path.join(repoRoot, 'scripts/music-provider-sidecar.cjs'),
      'utf8',
    );
    const electronMain = fs.readFileSync(
      path.join(repoRoot, 'electron/main.cjs'),
      'utf8',
    );

    expect(adapterSource).toContain('fetchWithProxyFallback');
    expect(sidecarSource).toContain('neutralizeDeadEnvProxy');
    expect(electronMain).toContain('neutralizeDeadEnvProxy');
  });
});
