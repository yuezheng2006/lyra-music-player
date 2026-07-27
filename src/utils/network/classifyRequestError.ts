// src/utils/network/classifyRequestError.ts
// Classify fetch failures / HTTP statuses into retryable codes.

import type { RequestErrorCode } from './stableRequestTypes';

export const classifyHttpStatus = (status: number): RequestErrorCode => {
    if (status === 401 || status === 403) return 'auth';
    if (status === 429) return 'http_429';
    if (status >= 500) return 'http_5xx';
    if (status >= 400) return 'http_4xx';
    return 'unknown';
};

export const classifyThrownError = (error: unknown): RequestErrorCode => {
    if (error instanceof DOMException && error.name === 'AbortError') {
        return 'aborted';
    }
    if (error instanceof Error) {
        const name = error.name.toLowerCase();
        const message = error.message.toLowerCase();
        if (name === 'aborterror' || message.includes('aborted')) {
            return 'aborted';
        }
        if (
            name === 'timeouterror'
            || message.includes('timeout')
            || message.includes('timed out')
        ) {
            return 'timeout';
        }
        if (
            name === 'typeerror'
            || message.includes('failed to fetch')
            || message.includes('network')
            || message.includes('load failed')
        ) {
            return 'network';
        }
    }
    return 'unknown';
};

/** Transient failures worth automatic retry. */
export const isRetryableRequestCode = (code: RequestErrorCode): boolean => (
    code === 'network'
    || code === 'timeout'
    || code === 'http_429'
    || code === 'http_5xx'
);
