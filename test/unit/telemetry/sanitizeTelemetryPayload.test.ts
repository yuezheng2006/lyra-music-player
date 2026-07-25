import { describe, expect, it } from 'vitest';
import { sanitizeTelemetryPayload } from '@/utils/telemetry/sanitizeTelemetryPayload';

// test/unit/telemetry/sanitizeTelemetryPayload.test.ts

describe('sanitizeTelemetryPayload', () => {
    it('redacts URL-like strings and cookie/token keys', () => {
        const sanitized = sanitizeTelemetryPayload({
            provider: 'netease',
            url: 'https://m701.music.126.net/foo.mp3',
            cookie: 'MUSIC_A=secret',
            token: 'abc',
            nested: {
                href: 'blob:http://localhost/x',
                ok: true,
            },
        });

        expect(sanitized).toEqual({
            provider: 'netease',
            url: '[redacted-url]',
            cookie: '[redacted]',
            token: '[redacted]',
            nested: {
                href: '[redacted-url]',
                ok: true,
            },
        });
    });

    it('returns undefined for empty input', () => {
        expect(sanitizeTelemetryPayload(null)).toBeUndefined();
        expect(sanitizeTelemetryPayload(undefined)).toBeUndefined();
    });
});
