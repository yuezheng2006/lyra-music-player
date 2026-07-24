// src/utils/network/requestWithStability.ts
// Fetch wrapper with transient retries and diagnostic recording.

import { recordApiDiagnostic } from './apiDiagnosticRing';
import {
    classifyHttpStatus,
    classifyThrownError,
    isRetryableRequestCode,
} from './classifyRequestError';
import {
    StableRequestError,
    type RequestAttemptRecord,
    type RequestErrorCode,
    type RequestStabilityMeta,
} from './stableRequestTypes';

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = [300, 900];

const createRequestId = () => {
    const rand = Math.random().toString(36).slice(2, 8);
    return `req_${Date.now().toString(36)}_${rand}`;
};

const resolveEndpoint = (input: RequestInfo | URL, meta?: RequestStabilityMeta): string => {
    if (meta?.endpoint) return meta.endpoint;
    const raw = typeof input === 'string'
        ? input
        : input instanceof URL
            ? input.toString()
            : input.url;
    try {
        const url = new URL(raw, typeof location !== 'undefined' ? location.origin : 'http://localhost');
        return `${url.pathname}${url.search}`;
    } catch {
        return raw;
    }
};

const sleep = (ms: number, signal?: AbortSignal | null) => new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
    }
    const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
    }, ms);
    const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
});

const isAbortSignalAborted = (signal?: AbortSignal | null) => Boolean(signal?.aborted);

export type RequestWithStabilityResult = {
    response: Response;
    requestId: string;
    attempts: number;
};

/**
 * Runs fetch with bounded retries for transient network/HTTP failures.
 * Non-retryable responses (4xx except 429) are returned to the caller.
 * Exhausted retryable failures throw StableRequestError.
 */
export async function requestWithStability(
    input: RequestInfo | URL,
    init: RequestInit = {},
    meta: RequestStabilityMeta = {},
): Promise<RequestWithStabilityResult> {
    const requestId = createRequestId();
    const endpoint = resolveEndpoint(input, meta);
    const method = (init.method || 'GET').toUpperCase();
    const source = meta.source;
    const maxAttempts = Math.max(1, meta.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
    const backoffMs = meta.backoffMs ?? DEFAULT_BACKOFF_MS;
    const allowRetry = meta.retry !== false;
    const attemptRecords: RequestAttemptRecord[] = [];

    let lastCode: RequestErrorCode = 'unknown';
    let lastStatus: number | undefined;
    let lastMessage = 'Request failed';

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (isAbortSignalAborted(init.signal)) {
            throw new StableRequestError({
                code: 'aborted',
                message: 'Request aborted',
                endpoint,
                attempts: attempt - 1,
                requestId,
                source,
                attemptRecords,
            });
        }

        const startedAt = performance.now();
        try {
            const response = await fetch(input, init);
            const durationMs = Math.round(performance.now() - startedAt);
            const status = response.status;

            if (response.ok || (status >= 200 && status < 400)) {
                attemptRecords.push({ attempt, durationMs, status });
                recordApiDiagnostic({
                    requestId,
                    at: Date.now(),
                    endpoint,
                    method,
                    ok: true,
                    status,
                    attempts: attemptRecords,
                    source,
                });
                return { response, requestId, attempts: attempt };
            }

            const code = classifyHttpStatus(status);
            attemptRecords.push({ attempt, durationMs, status, code });
            lastCode = code;
            lastStatus = status;
            lastMessage = `HTTP ${status}`;

            const shouldRetry = allowRetry
                && attempt < maxAttempts
                && isRetryableRequestCode(code);

            if (!shouldRetry) {
                if (code === 'auth' || code === 'http_4xx') {
                    // Let domain layer inspect body / status.
                    recordApiDiagnostic({
                        requestId,
                        at: Date.now(),
                        endpoint,
                        method,
                        ok: false,
                        code,
                        status,
                        attempts: attemptRecords,
                        message: lastMessage,
                        source,
                    });
                    return { response, requestId, attempts: attempt };
                }

                recordApiDiagnostic({
                    requestId,
                    at: Date.now(),
                    endpoint,
                    method,
                    ok: false,
                    code,
                    status,
                    attempts: attemptRecords,
                    message: lastMessage,
                    source,
                });
                throw new StableRequestError({
                    code,
                    message: lastMessage,
                    endpoint,
                    attempts: attempt,
                    requestId,
                    status,
                    source,
                    attemptRecords,
                });
            }
        } catch (error) {
            if (error instanceof StableRequestError) {
                throw error;
            }

            const durationMs = Math.round(performance.now() - startedAt);
            const code = classifyThrownError(error);
            const message = error instanceof Error ? error.message : String(error);
            attemptRecords.push({
                attempt,
                durationMs,
                code,
                errorMessage: message,
            });
            lastCode = code;
            lastMessage = message;

            if (code === 'aborted') {
                recordApiDiagnostic({
                    requestId,
                    at: Date.now(),
                    endpoint,
                    method,
                    ok: false,
                    code,
                    attempts: attemptRecords,
                    message,
                    source,
                });
                throw new StableRequestError({
                    code: 'aborted',
                    message: 'Request aborted',
                    endpoint,
                    attempts: attempt,
                    requestId,
                    source,
                    attemptRecords,
                });
            }

            const shouldRetry = allowRetry
                && attempt < maxAttempts
                && isRetryableRequestCode(code);

            if (!shouldRetry) {
                recordApiDiagnostic({
                    requestId,
                    at: Date.now(),
                    endpoint,
                    method,
                    ok: false,
                    code,
                    attempts: attemptRecords,
                    message,
                    source,
                });
                throw new StableRequestError({
                    code,
                    message,
                    endpoint,
                    attempts: attempt,
                    requestId,
                    source,
                    attemptRecords,
                });
            }
        }

        const delay = backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 300;
        try {
            await sleep(delay, init.signal);
        } catch {
            throw new StableRequestError({
                code: 'aborted',
                message: 'Request aborted during backoff',
                endpoint,
                attempts: attempt,
                requestId,
                source,
                attemptRecords,
            });
        }
    }

    recordApiDiagnostic({
        requestId,
        at: Date.now(),
        endpoint,
        method,
        ok: false,
        code: lastCode,
        status: lastStatus,
        attempts: attemptRecords,
        message: lastMessage,
        source,
    });

    throw new StableRequestError({
        code: lastCode,
        message: lastMessage,
        endpoint,
        attempts: maxAttempts,
        requestId,
        status: lastStatus,
        source,
        attemptRecords,
    });
}
