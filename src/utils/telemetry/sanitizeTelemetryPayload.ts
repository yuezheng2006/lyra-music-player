// src/utils/telemetry/sanitizeTelemetryPayload.ts
// Redact URLs / cookies / tokens before events enter the ring.

const SENSITIVE_KEY = /^(cookie|cookies|authorization|token|password|secret|auth|set-cookie)$/i;
const URL_LIKE = /^(https?:|blob:|data:)/i;

const redactValue = (value: unknown): unknown => {
    if (typeof value === 'string') {
        if (URL_LIKE.test(value.trim())) {
            return '[redacted-url]';
        }
        if (value.length > 240) {
            return `${value.slice(0, 120)}…[truncated ${value.length}]`;
        }
        return value;
    }
    if (Array.isArray(value)) {
        return value.slice(0, 20).map(redactValue);
    }
    if (value && typeof value === 'object') {
        return sanitizeTelemetryPayload(value as Record<string, unknown>);
    }
    return value;
};

/** Deep-sanitize a telemetry data bag for local diagnostics. */
export function sanitizeTelemetryPayload(
    data: Record<string, unknown> | undefined | null,
): Record<string, unknown> | undefined {
    if (!data) {
        return undefined;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_KEY.test(key)) {
            out[key] = '[redacted]';
            continue;
        }
        out[key] = redactValue(value);
    }
    return out;
}
