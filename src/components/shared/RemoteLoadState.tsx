import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { RemoteLoadStatus } from '../../utils/ui/remoteLoadStatus';
import { formatDiagnosticsForCopy } from '../../utils/network';

// src/components/shared/RemoteLoadState.tsx
// Shared loading / empty / error shell with optional expandable diagnostics.

export type RemoteLoadStateProps = {
    status: RemoteLoadStatus;
    isDaylight?: boolean;
    title?: string;
    loadingLabel?: string;
    emptyLabel?: string;
    errorLabel?: string;
    authLabel?: string;
    onRetry?: () => void;
    /** Preformatted diagnostic for this failure (plus recent ring on copy). */
    diagnostic?: string | null;
    className?: string;
    children?: React.ReactNode;
};

const RemoteLoadState: React.FC<RemoteLoadStateProps> = ({
    status,
    isDaylight = false,
    title,
    loadingLabel,
    emptyLabel,
    errorLabel,
    authLabel,
    onRetry,
    diagnostic,
    className = '',
    children,
}) => {
    const { t } = useTranslation();
    const [diagOpen, setDiagOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const muted = isDaylight ? 'text-black/45' : 'text-white/45';
    const pillClass = isDaylight
        ? 'bg-black/10 text-black hover:bg-black/15'
        : 'bg-white/12 text-white hover:bg-white/18';

    if (status === 'ready') {
        return <>{children}</>;
    }

    if (status === 'loading') {
        return (
            <div
                className={`flex h-full items-center justify-center gap-2 text-sm ${muted} ${className}`}
                data-testid="remote-load-loading"
            >
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingLabel || title || t('remoteLoad.loading')}
            </div>
        );
    }

    const message = status === 'auth'
        ? (authLabel || t('remoteLoad.auth'))
        : status === 'empty'
            ? (emptyLabel || t('remoteLoad.empty'))
            : (errorLabel || title || t('remoteLoad.failed'));

    const showRetry = Boolean(onRetry) && (status === 'error' || status === 'auth' || status === 'empty');
    // Empty/auth often feel like "failures" to users — keep diagnostics reachable there too.
    const recentDiagnostics = formatDiagnosticsForCopy(15);
    const diagnosticBody = [diagnostic, recentDiagnostics].filter(text => Boolean(text && String(text).trim())).join('\n\n--- recent ---\n');
    const showDiagnostic = (
        (status === 'error' || status === 'empty' || status === 'auth')
        && Boolean(diagnosticBody.trim())
    );

    const handleCopy = async () => {
        const payload = diagnosticBody || recentDiagnostics;
        try {
            await navigator.clipboard.writeText(payload);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div
            className={`flex h-full flex-col items-center justify-center gap-3 px-6 text-sm ${muted} ${className}`}
            data-testid={`remote-load-${status}`}
        >
            <div className="text-center">{message}</div>
            <div className="flex flex-wrap items-center justify-center gap-2">
                {showRetry ? (
                    <button
                        type="button"
                        data-testid="remote-load-retry"
                        onClick={onRetry}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${pillClass}`}
                    >
                        {t('remoteLoad.retry')}
                    </button>
                ) : null}
                {showDiagnostic ? (
                    <button
                        type="button"
                        data-testid="remote-load-toggle-diagnostic"
                        onClick={() => setDiagOpen(open => !open)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${pillClass}`}
                    >
                        {t('remoteLoad.diagnostic')}
                    </button>
                ) : null}
            </div>
            {diagOpen && showDiagnostic ? (
                <div
                    className={`mt-1 w-full max-w-lg rounded-xl px-3 py-2 text-left text-[11px] leading-relaxed ${
                        isDaylight ? 'bg-black/[0.04] text-black/70' : 'bg-white/[0.08] text-white/70'
                    }`}
                    data-testid="remote-load-diagnostic"
                >
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono">
                        {diagnosticBody}
                    </pre>
                    <button
                        type="button"
                        data-testid="remote-load-copy-diagnostic"
                        onClick={() => void handleCopy()}
                        className={`mt-2 rounded-full px-2.5 py-1 text-[11px] font-medium ${pillClass}`}
                    >
                        {copied ? t('remoteLoad.copied') : t('remoteLoad.copyDiagnostic')}
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default RemoteLoadState;
