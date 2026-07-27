// src/utils/network/invokeWithStability.ts
// Retry wrapper for non-fetch async operations (IPC, adapters).

import { recordApiDiagnostic } from './apiDiagnosticRing';
import {
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
    return `inv_${Date.now().toString(36)}_${rand}`;
};

const sleep = (ms: number) => new Promise<void>(resolve => {
    setTimeout(resolve, ms);
});

/**
 * Retries an async operation when it throws a retryable StableRequestError
 * or a transient network/timeout Error.
 */
export async function invokeWithStability<T>(
    operation: () => Promise<T>,
    meta: RequestStabilityMeta = {},
): Promise<T> {
    const requestId = createRequestId();
    const endpoint = meta.endpoint || 'invoke';
    const source = meta.source;
    const maxAttempts = Math.max(1, meta.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
    const backoffMs = meta.backoffMs ?? DEFAULT_BACKOFF_MS;
    const allowRetry = meta.retry !== false;
    const attemptRecords: RequestAttemptRecord[] = [];

    let lastCode: RequestErrorCode = 'unknown';
    let lastMessage = 'Operation failed';

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const startedAt = performance.now();
        try {
            const value = await operation();
            const durationMs = Math.round(performance.now() - startedAt);
            attemptRecords.push({ attempt, durationMs });
            recordApiDiagnostic({
                requestId,
                at: Date.now(),
                endpoint,
                method: 'INVOKE',
                ok: true,
                attempts: attemptRecords,
                source,
            });
            return value;
        } catch (error) {
            const durationMs = Math.round(performance.now() - startedAt);
            let code: RequestErrorCode;
            let message: string;

            if (error instanceof StableRequestError) {
                code = error.code;
                message = error.message;
            } else {
                code = classifyThrownError(error);
                message = error instanceof Error ? error.message : String(error);
            }

            attemptRecords.push({
                attempt,
                durationMs,
                code,
                errorMessage: message,
            });
            lastCode = code;
            lastMessage = message;

            const shouldRetry = allowRetry
                && attempt < maxAttempts
                && isRetryableRequestCode(code)
                && code !== 'aborted';

            if (!shouldRetry) {
                recordApiDiagnostic({
                    requestId,
                    at: Date.now(),
                    endpoint,
                    method: 'INVOKE',
                    ok: false,
                    code,
                    attempts: attemptRecords,
                    message,
                    source,
                });
                if (error instanceof StableRequestError) {
                    throw error;
                }
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
        await sleep(delay);
    }

    recordApiDiagnostic({
        requestId,
        at: Date.now(),
        endpoint,
        method: 'INVOKE',
        ok: false,
        code: lastCode,
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
        source,
        attemptRecords,
    });
}
