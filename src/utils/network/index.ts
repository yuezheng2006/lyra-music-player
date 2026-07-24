// src/utils/network/index.ts
// Public exports for the HTTP stability layer.

export {
    configureApiDiagnosticRing,
    clearApiDiagnostics,
    recordApiDiagnostic,
    getRecentDiagnostics,
    formatDiagnosticsForCopy,
} from './apiDiagnosticRing';
export {
    classifyHttpStatus,
    classifyThrownError,
    isRetryableRequestCode,
} from './classifyRequestError';
export {
    requestWithStability,
    type RequestWithStabilityResult,
} from './requestWithStability';
export { invokeWithStability } from './invokeWithStability';
export {
    captureRequestFailure,
    type CapturedRequestFailure,
} from './captureRequestFailure';
export {
    StableRequestError,
    isStableRequestError,
    type ApiDiagnosticEntry,
    type RequestAttemptRecord,
    type RequestErrorCode,
    type RequestStabilityMeta,
} from './stableRequestTypes';
