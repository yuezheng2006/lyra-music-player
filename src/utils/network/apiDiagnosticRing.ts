// src/utils/network/apiDiagnosticRing.ts
// In-memory ring buffer of recent API call diagnostics for copy/debug UX.

import type { ApiDiagnosticEntry } from './stableRequestTypes';

const DEFAULT_CAPACITY = 100;
const entries: ApiDiagnosticEntry[] = [];
let capacity = DEFAULT_CAPACITY;

export const configureApiDiagnosticRing = (nextCapacity: number) => {
    capacity = Math.max(1, Math.floor(nextCapacity));
    while (entries.length > capacity) {
        entries.shift();
    }
};

export const clearApiDiagnostics = () => {
    entries.length = 0;
};

export const recordApiDiagnostic = (entry: ApiDiagnosticEntry) => {
    entries.push(entry);
    while (entries.length > capacity) {
        entries.shift();
    }
};

export const getRecentDiagnostics = (limit = capacity): ApiDiagnosticEntry[] => {
    if (limit >= entries.length) {
        return [...entries];
    }
    return entries.slice(entries.length - limit);
};

export const formatDiagnosticsForCopy = (limit = 20): string => {
    const recent = getRecentDiagnostics(limit);
    if (recent.length === 0) {
        return 'No API diagnostics recorded.';
    }

    return recent.map(entry => {
        const attemptSummary = entry.attempts
            .map(attempt => {
                const status = attempt.status != null ? `status=${attempt.status}` : 'status=-';
                const code = attempt.code ? `code=${attempt.code}` : 'code=-';
                return `#${attempt.attempt} ${attempt.durationMs}ms ${status} ${code}`;
            })
            .join(' | ');
        return [
            `[${new Date(entry.at).toISOString()}]`,
            entry.ok ? 'OK' : 'FAIL',
            entry.source || 'api',
            entry.method,
            entry.endpoint,
            entry.code ? `code=${entry.code}` : '',
            entry.status != null ? `http=${entry.status}` : '',
            `id=${entry.requestId}`,
            entry.message || '',
            attemptSummary ? `attempts: ${attemptSummary}` : '',
        ].filter(Boolean).join(' ');
    }).join('\n');
};
