// src/utils/network/stableRequestTypes.ts
// Shared error codes and StableRequestError for HTTP stability layer.

export type RequestErrorCode =
    | 'timeout'
    | 'network'
    | 'http_5xx'
    | 'http_429'
    | 'http_4xx'
    | 'auth'
    | 'parse'
    | 'aborted'
    | 'empty_ok'
    | 'unknown';

export type RequestAttemptRecord = {
    attempt: number;
    durationMs: number;
    status?: number;
    code?: RequestErrorCode;
    errorMessage?: string;
};

export type ApiDiagnosticEntry = {
    requestId: string;
    at: number;
    endpoint: string;
    method: string;
    ok: boolean;
    code?: RequestErrorCode;
    status?: number;
    attempts: RequestAttemptRecord[];
    message?: string;
    source?: string;
};

export type RequestStabilityMeta = {
    /** Short label for diagnostics, e.g. netease / sidecar / ytm. */
    source?: string;
    /** Logical endpoint path (query stripped) for diagnostics. */
    endpoint?: string;
    maxAttempts?: number;
    /** Backoff delays between attempts in ms (length = maxAttempts - 1). */
    backoffMs?: number[];
    /** When false, never auto-retry (still records diagnostics). */
    retry?: boolean;
};

export class StableRequestError extends Error {
    readonly code: RequestErrorCode;
    readonly endpoint: string;
    readonly attempts: number;
    readonly requestId: string;
    readonly status?: number;
    readonly source?: string;
    readonly attemptRecords: RequestAttemptRecord[];

    constructor(params: {
        code: RequestErrorCode;
        message: string;
        endpoint: string;
        attempts: number;
        requestId: string;
        status?: number;
        source?: string;
        attemptRecords?: RequestAttemptRecord[];
    }) {
        super(params.message);
        this.name = 'StableRequestError';
        this.code = params.code;
        this.endpoint = params.endpoint;
        this.attempts = params.attempts;
        this.requestId = params.requestId;
        this.status = params.status;
        this.source = params.source;
        this.attemptRecords = params.attemptRecords ?? [];
    }

    toDiagnosticSummary(): string {
        const parts = [
            `id=${this.requestId}`,
            `code=${this.code}`,
            `endpoint=${this.endpoint}`,
            `attempts=${this.attempts}`,
        ];
        if (this.status != null) parts.push(`status=${this.status}`);
        if (this.source) parts.push(`source=${this.source}`);
        if (this.message) parts.push(`msg=${this.message}`);
        return parts.join(' ');
    }
}

export const isStableRequestError = (error: unknown): error is StableRequestError =>
    error instanceof StableRequestError;
