// src/utils/ui/remoteLoadStatus.ts
// Derive remote list UI status from loading / error / item counts.

export type RemoteLoadStatus = 'loading' | 'ready' | 'empty' | 'error' | 'auth';

export type ResolveRemoteLoadStatusInput = {
    loading: boolean;
    settled?: boolean;
    itemCount: number;
    error?: string | null;
    /** When true, treat as login required rather than generic error. */
    needsAuth?: boolean;
    /** Keep showing ready while refreshing if items already exist. */
    keepPreviousOnRefresh?: boolean;
};

export const resolveRemoteLoadStatus = ({
    loading,
    settled = true,
    itemCount,
    error,
    needsAuth = false,
    keepPreviousOnRefresh = true,
}: ResolveRemoteLoadStatusInput): RemoteLoadStatus => {
    if (needsAuth && itemCount === 0) {
        return 'auth';
    }

    if (loading && !(keepPreviousOnRefresh && itemCount > 0)) {
        return 'loading';
    }

    if (!settled && itemCount === 0) {
        return 'loading';
    }

    if (error && itemCount === 0) {
        return needsAuth ? 'auth' : 'error';
    }

    if (itemCount === 0) {
        return 'empty';
    }

    return 'ready';
};

export const resolveRemoteLoadMessageKey = (
    status: RemoteLoadStatus,
    errorCode?: string | null,
): string => {
    if (status === 'auth') return 'remoteLoad.auth';
    if (status === 'empty') return 'remoteLoad.empty';
    if (status !== 'error') return 'remoteLoad.failed';

    switch (errorCode) {
        case 'timeout':
            return 'remoteLoad.timeout';
        case 'network':
            return 'remoteLoad.network';
        case 'http_5xx':
        case 'http_429':
            return 'remoteLoad.server';
        case 'auth':
            return 'remoteLoad.auth';
        case 'parse':
            return 'remoteLoad.parse';
        default:
            return 'remoteLoad.failed';
    }
};
