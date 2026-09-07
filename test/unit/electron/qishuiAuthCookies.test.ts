import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
    buildQishuiCookieHeader,
    isQishuiCookieDomain,
    parseQishuiUserLabel,
    qishuiCookieHasLogin,
    resolveQishuiLoginPopupAction,
} = require('../../../electron/qishuiAuthCookies.cjs') as {
    buildQishuiCookieHeader: (cookies: Array<{ name?: string; value?: string; domain?: string }>) => string;
    isQishuiCookieDomain: (domain: string) => boolean;
    parseQishuiUserLabel: (cookie: string) => string;
    qishuiCookieHasLogin: (cookie: string) => boolean;
    resolveQishuiLoginPopupAction: (url: string) => 'allow' | 'deny';
};

// test/unit/electron/qishuiAuthCookies.test.ts
// Isolated Qishui login is a Douyin web session, not a local cookie scan.

describe('qishuiAuthCookies', () => {
    it('accepts Douyin / Qishui cookie domains', () => {
        expect(isQishuiCookieDomain('.douyin.com')).toBe(true);
        expect(isQishuiCookieDomain('music.douyin.com')).toBe(true);
        expect(isQishuiCookieDomain('api.qishui.com')).toBe(true);
        expect(isQishuiCookieDomain('qq.com')).toBe(false);
    });

    it('treats sessionid or sid_tt as a logged-in session', () => {
        expect(qishuiCookieHasLogin('sessionid=abcdefgh;')).toBe(true);
        expect(qishuiCookieHasLogin('sid_tt=12345678;')).toBe(true);
        expect(qishuiCookieHasLogin('sessionid=short;')).toBe(false);
        expect(qishuiCookieHasLogin('')).toBe(false);
    });

    it('builds a cookie header from partition cookies and prefers login keys', () => {
        const header = buildQishuiCookieHeader([
            { name: 'foo', value: 'bar', domain: '.douyin.com' },
            { name: 'sessionid', value: 'abcdefghij', domain: 'www.douyin.com' },
            { name: 'sid_tt', value: 'token1234', domain: '.snssdk.com' },
            { name: 'ignored', value: 'nope', domain: 'example.com' },
        ]);
        expect(header.startsWith('sessionid=abcdefghij; sid_tt=token1234')).toBe(true);
        expect(header).toContain('foo=bar');
        expect(header).not.toContain('ignored=');
    });

    it('labels the session from uid_tt when present', () => {
        expect(parseQishuiUserLabel('uid_tt=987654321000; sessionid=abcdefghij')).toBe('987654321000');
        expect(parseQishuiUserLabel('sessionid=abcdefghij')).toBe('abcdefgh');
    });

    it('allows Passport popups instead of swallowing the login click', () => {
        expect(resolveQishuiLoginPopupAction('')).toBe('allow');
        expect(resolveQishuiLoginPopupAction('about:blank')).toBe('allow');
        expect(resolveQishuiLoginPopupAction('https://passport.douyin.com/login')).toBe('allow');
        expect(resolveQishuiLoginPopupAction('https://music.douyin.com/qishui/')).toBe('allow');
        expect(resolveQishuiLoginPopupAction('file:///tmp/x')).toBe('deny');
        expect(resolveQishuiLoginPopupAction('javascript:alert(1)')).toBe('deny');
    });
});
