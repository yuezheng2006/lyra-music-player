import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearApiDiagnostics,
    classifyHttpStatus,
    classifyThrownError,
    formatDiagnosticsForCopy,
    getRecentDiagnostics,
    isRetryableRequestCode,
    requestWithStability,
    StableRequestError,
} from '../../../src/utils/network';

describe('classifyRequestError', () => {
    it('classifies HTTP statuses', () => {
        expect(classifyHttpStatus(401)).toBe('auth');
        expect(classifyHttpStatus(403)).toBe('auth');
        expect(classifyHttpStatus(429)).toBe('http_429');
        expect(classifyHttpStatus(500)).toBe('http_5xx');
        expect(classifyHttpStatus(404)).toBe('http_4xx');
    });

    it('classifies thrown errors', () => {
        expect(classifyThrownError(new DOMException('Aborted', 'AbortError'))).toBe('aborted');
        expect(classifyThrownError(new TypeError('Failed to fetch'))).toBe('network');
        expect(classifyThrownError(new Error('Timeout waiting'))).toBe('timeout');
    });

    it('marks only transient codes retryable', () => {
        expect(isRetryableRequestCode('network')).toBe(true);
        expect(isRetryableRequestCode('timeout')).toBe(true);
        expect(isRetryableRequestCode('http_429')).toBe(true);
        expect(isRetryableRequestCode('http_5xx')).toBe(true);
        expect(isRetryableRequestCode('auth')).toBe(false);
        expect(isRetryableRequestCode('http_4xx')).toBe(false);
        expect(isRetryableRequestCode('aborted')).toBe(false);
    });
});

describe('requestWithStability', () => {
    beforeEach(() => {
        clearApiDiagnostics();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        clearApiDiagnostics();
    });

    it('returns on first success and records a diagnostic', async ({ skip }) => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const resultPromise = requestWithStability('/api/ping', {}, { source: 'test', endpoint: '/api/ping' });
        const result = await resultPromise;

        expect(result.attempts).toBe(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(getRecentDiagnostics()).toHaveLength(1);
        expect(getRecentDiagnostics()[0]?.ok).toBe(true);
        void skip;
    });

    it('retries transient network errors then succeeds', async () => {
        const fetchMock = vi.fn()
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValueOnce(new Response('ok', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const resultPromise = requestWithStability('/api/retry', {}, {
            source: 'test',
            endpoint: '/api/retry',
            backoffMs: [10, 10],
        });
        const resultSettled = resultPromise.then(value => value);
        await vi.advanceTimersByTimeAsync(20);
        const result = await resultSettled;

        expect(result.attempts).toBe(2);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(getRecentDiagnostics()[0]?.ok).toBe(true);
    });

    it('retries 503 then throws StableRequestError when exhausted', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('down', { status: 503 }));
        vi.stubGlobal('fetch', fetchMock);

        const resultPromise = requestWithStability('/api/down', {}, {
            source: 'test',
            endpoint: '/api/down',
            maxAttempts: 3,
            backoffMs: [5, 5],
        });
        const expectation = expect(resultPromise).rejects.toMatchObject({
            name: 'StableRequestError',
            code: 'http_5xx',
            attempts: 3,
        });
        await vi.advanceTimersByTimeAsync(20);
        await expectation;
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(getRecentDiagnostics()[0]?.ok).toBe(false);
    });

    it('does not retry aborted requests', async () => {
        const controller = new AbortController();
        controller.abort();
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        await expect(requestWithStability('/api/x', { signal: controller.signal }, {
            endpoint: '/api/x',
        })).rejects.toBeInstanceOf(StableRequestError);

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns 404 responses without retry for caller inspection', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('missing', { status: 404 }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await requestWithStability('/api/missing', {}, { endpoint: '/api/missing' });
        expect(result.response.status).toBe(404);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('formats diagnostics for copy', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);
        await requestWithStability('/api/a', {}, { source: 'netease', endpoint: '/api/a' });

        const text = formatDiagnosticsForCopy(5);
        expect(text).toContain('OK');
        expect(text).toContain('netease');
        expect(text).toContain('/api/a');
    });
});
