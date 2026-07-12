import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, type ConfigEnv, type UserConfig, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import fs from 'fs';
import { isAllowedLyricProxyHost, isAmllDbHost } from './shared/lyricProxyHosts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LYRIC_PROXY_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': [
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Date',
    'X-Api-Version',
    'KG-Rec',
    'KG-RC',
    'KG-CLIENTTIMEMS',
    'mid',
    'x-router',
    'X-Proxy-Referer',
    'X-Proxy-Cookie',
  ].join(', '),
};

const LYRIC_PROXY_IGNORED_FORWARD_HEADERS = [
  'host',
  'connection',
  'content-length',
  'origin',
  'referer',
  'cookie',
  'x-proxy-referer',
  'x-proxy-cookie',
];

/** Remap browser-safe proxy headers onto forbidden Referer/Cookie for upstream. */
function applyLyricProxyHeaderOverrides(
  headers: Headers,
  sourceHeaders: Record<string, string | string[] | undefined>,
): void {
  const readHeader = (name: string): string => {
    const value = sourceHeaders[name] ?? sourceHeaders[name.toLowerCase()];
    if (Array.isArray(value)) return value.join(', ');
    return typeof value === 'string' ? value : '';
  };
  const proxyReferer = readHeader('x-proxy-referer');
  const proxyCookie = readHeader('x-proxy-cookie');
  if (proxyReferer) headers.set('Referer', proxyReferer);
  if (proxyCookie) headers.set('Cookie', proxyCookie);
}

function setLyricProxyCorsHeaders(res: import('http').ServerResponse): void {
  Object.entries(LYRIC_PROXY_CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

function sendLyricProxyJson(res: import('http').ServerResponse, statusCode: number, body: unknown): void {
  setLyricProxyCorsHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readDevRequestBody(req: import('http').IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function devLyricProxyPlugin() {
  return {
    name: 'lyra-dev-lyric-proxy',
    apply: 'serve' as const,
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = new URL(req.url ?? '/', 'http://localhost');
        if (requestUrl.pathname !== '/api/lyric-proxy') {
          next();
          return;
        }

        if (req.method === 'OPTIONS') {
          setLyricProxyCorsHeaders(res);
          res.statusCode = 200;
          res.end();
          return;
        }

        const targetUrlStr = requestUrl.searchParams.get('url');
        if (!targetUrlStr) {
          sendLyricProxyJson(res, 400, { error: 'Missing url parameter' });
          return;
        }

        try {
          const targetUrl = new URL(targetUrlStr);
          if (!isAllowedLyricProxyHost(targetUrl.hostname)) {
            sendLyricProxyJson(res, 403, { error: 'Forbidden: Domain not allowed' });
            return;
          }

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (!LYRIC_PROXY_IGNORED_FORWARD_HEADERS.includes(key.toLowerCase()) && value) {
              headers.set(key, Array.isArray(value) ? value.join(', ') : value);
            }
          }
          applyLyricProxyHeaderOverrides(headers, req.headers as Record<string, string | string[] | undefined>);

          const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method ?? '');
          const requestBody = hasBody ? await readDevRequestBody(req) : undefined;
          const response = await fetch(targetUrl.toString(), {
            method: req.method,
            headers,
            body: requestBody ? Uint8Array.from(requestBody) : undefined,
          });

          setLyricProxyCorsHeaders(res);
          if (isAmllDbHost(targetUrl.hostname) && response.status === 404) {
            res.statusCode = 204;
            res.end();
            return;
          }

          res.statusCode = response.status;
          res.statusMessage = response.statusText;
          const contentType = response.headers.get('content-type');
          if (contentType) {
            res.setHeader('Content-Type', contentType);
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          res.end(buffer);
        } catch (error) {
          console.error('Vite lyric proxy request failed:', error);
          sendLyricProxyJson(res, 500, { error: 'Proxy request failed', details: String(error) });
        }
      });
    },
  };
}

export default async function viteConfig({ mode }: ConfigEnv): Promise<UserConfig> {
  const env = loadEnv(mode, '.', '');

  let commitHash = '';
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    commitHash = process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
  } else {
    try {
      commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) {
      console.warn('Could not get commit hash:', e);
      commitHash = 'unknown, probably dev version';
    }
  }

  let gitBranch = '';
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    gitBranch = process.env.VERCEL_GIT_COMMIT_REF;
  } else {
    try {
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    } catch (e) {
      console.warn('Could not get git branch:', e);
      gitBranch = 'unknown';
    }
  }

  let commitSuffix = '';
  if (commitHash && commitHash !== 'unknown, probably dev version') {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://namoe.izuna.top/api/namoe?hash=${commitHash}`, {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json() as { name?: string };
        if (data?.name) {
          commitSuffix = `/${data.name}`;
        }
      }
    } catch (e) {
      // Ignore errors during fetch to prevent build failure
    }
  }

  const appVersionLabel = process.env.APP_VERSION_LABEL?.trim() || 'lyra-music-player';
  const isElectronBuild = process.env.ELECTRON === 'true';

  return {
    base: isElectronBuild ? './' : '/',
    worker: {
      format: 'es'
    },
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          stageClient: 'stage-client.html',
        },
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
    },
    plugins: [
      devLyricProxyPlugin(),
      react(),
      // Electron loadFile(file://) must not register a service worker — it causes stale assets in packaged apps.
      ...(isElectronBuild
        ? []
        : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            injectRegister: 'script',
            devOptions: {
              enabled: true,
            },
            workbox: {
              maximumFileSizeToCacheInBytes: 5000000
            },
            manifest: {
              name: 'Lyra',
              short_name: 'Lyra',
              description: 'Immersive multi-source music player with 3D stage and smart atmosphere',
              theme_color: '#09090b',
              background_color: '#09090b',
              display: 'standalone',
              icons: [
                {
                  src: 'icon.svg',
                  sizes: '512x512',
                  type: 'image/svg+xml',
                  purpose: 'any maskable'
                }
              ]
            }
          }),
        ]),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__COMMIT_HASH__': JSON.stringify(commitHash + commitSuffix),
      '__GIT_BRANCH__': JSON.stringify(gitBranch),
      '__APP_VERSION__': JSON.stringify(JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')).version),
      '__APP_VERSION_LABEL__': JSON.stringify(appVersionLabel)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
}
