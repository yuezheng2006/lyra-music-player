// src/utils/network/captureRequestFailure.ts
// Normalize thrown errors into short UI message + copyable diagnostic.

import { recordApiDiagnostic } from './apiDiagnosticRing';
import { classifyThrownError } from './classifyRequestError';
import {
    isStableRequestError,
    type RequestErrorCode,
} from './stableRequestTypes';

export type CapturedRequestFailure = {
    message: string;
    code: RequestErrorCode;
    diagnostic: string;
    requestId?: string;
};

export const captureRequestFailure = (
    error: unknown,
    context: string,
): CapturedRequestFailure => {
    if (isStableRequestError(error)) {
        console.warn(`[${context}]`, error.toDiagnosticSummary());
        return {
            message: error.message,
            code: error.code,
            diagnostic: error.toDiagnosticSummary(),
            requestId: error.requestId,
        };
    }

    const message = error instanceof Error ? error.message : String(error);
    const code = classifyThrownError(error);
    const requestId = `cap_${Date.now().toString(36)}`;
    const diagnostic = `id=${requestId} code=${code} context=${context} msg=${message}`;
    recordApiDiagnostic({
        requestId,
        at: Date.now(),
        endpoint: context,
        method: 'CAPTURE',
        ok: false,
        code,
        attempts: [{ attempt: 1, durationMs: 0, code, errorMessage: message }],
        message,
        source: context,
    });
    console.warn(`[${context}]`, diagnostic, error);
    return { message, code, diagnostic, requestId };
};
