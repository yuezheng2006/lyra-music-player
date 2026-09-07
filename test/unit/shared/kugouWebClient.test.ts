import { createRequire } from 'module';
import { createHash } from 'crypto';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const {
    buildKugouCookieHeader,
    createKugouWebClient,
    kugouCookieHasLogin,
    signatureWebParams,
} = require('../../../shared/kugouWebClient.cjs') as {
    buildKugouCookieHeader: (parts: { token?: string; userid?: string }) => string;
    createKugouWebClient: (deps?: { fetchImpl?: typeof fetch }) => {
        checkQr: (key: string) => Promise<{ status: number; cookie?: string }>;
        createQrKey: () => Promise<{ qrcode: string; qrUrl: string }>;
        fetchAuthenticatedAudioUrl: (input: {
            hash: string;
            cookie: string;
            quality?: number;
        }) => Promise<string>;
    };
    kugouCookieHasLogin: (cookie: string) => boolean;
    signatureWebParams: (params: Record<string, string | number>, data?: string) => string;
};

// test/unit/shared/kugouWebClient.test.ts
// Web MD5 signature and QR / tracker JSON parsing without hitting Kugou.

describe('kugouWebClient', () => {
    it('signs web params with the KuGouMusicApi salt', () => {
        const params = { appid: 1001, clienttime: 1700000000 };
        const joined = 'appid=1001clienttime=1700000000';
        const expected = createHash('md5')
            .update(`NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt${joined}NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt`)
            .digest('hex');
        expect(signatureWebParams(params)).toBe(expected);
    });

    it('builds a login cookie and rejects missing userid', () => {
        const cookie = buildKugouCookieHeader({ token: 'abcdefghij', userid: '99' });
        expect(cookie).toBe('token=abcdefghij; userid=99');
        expect(kugouCookieHasLogin(cookie)).toBe(true);
        expect(kugouCookieHasLogin('token=abcdefghij')).toBe(false);
    });

    it('maps QR check status 4 to a cookie header', async () => {
        const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
            status: 1,
            data: { status: 4, token: 'tokentoken', userid: 42, dfid: 'device-dfid' },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        const client = createKugouWebClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        const result = await client.checkQr('qr-key');
        expect(result.status).toBe(4);
        expect(result.cookie).toContain('token=tokentoken');
        expect(result.cookie).toContain('userid=42');
        expect(result.cookie).toContain('dfid=device-dfid');
    });

    it('returns an authenticated tracker URL without upgrading http', async () => {
        const fetchImpl = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify({
            status: 1,
            url: 'http://tracker.kugou.com/demo.mp3',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        const client = createKugouWebClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        const url = await client.fetchAuthenticatedAudioUrl({
            hash: 'ABC',
            cookie: 'token=abcdefghij; userid=1',
        });
        expect(url).toBe('http://tracker.kugou.com/demo.mp3');
        expect(String(fetchImpl.mock.calls[0]?.[0])).toContain('gateway.kugou.com/v5/url');
    });
});
