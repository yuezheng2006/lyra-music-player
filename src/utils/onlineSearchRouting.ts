import type { OnlineMusicProviderId, SearchSourceId } from '../types';
import type { OnlineLibraryProviderId } from '../stores/useOnlineLibraryFilterStore';
import { ONLINE_LIBRARY_PROVIDER_IDS } from '../stores/useOnlineLibraryFilterStore';

// src/utils/onlineSearchRouting.ts
// Resolves which online provider(s) should handle a search query.

const QISHUI_SHARE_URL_RE = /^https?:\/\/qishui\.douyin\.com\/s\/[A-Za-z0-9]+/i;

export type OnlineSearchSessionAccess = {
    netease?: boolean;
    qq?: boolean;
};

export const isQishuiShareUrl = (value?: string | null) =>
    typeof value === 'string' && QISHUI_SHARE_URL_RE.test(value.trim());

/** Coco is always searchable; Netease/QQ require an active login session. */
export const isProviderSearchable = (
    id: OnlineLibraryProviderId,
    sessions: OnlineSearchSessionAccess,
): boolean => {
    if (id === 'coco') return true;
    if (id === 'netease') return Boolean(sessions.netease);
    if (id === 'qq') return Boolean(sessions.qq);
    return false;
};

/** Enabled library pills ∩ login-ready providers (Coco always counts as ready). */
export const resolveSearchableLibraryProviders = (
    enabledProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
    sessions: OnlineSearchSessionAccess,
): OnlineLibraryProviderId[] =>
    ONLINE_LIBRARY_PROVIDER_IDS.filter(id => enabledProviders[id] && isProviderSearchable(id, sessions));

/** Prefer explicit qishui share-link parsing; otherwise keep the selected channel. */
export const resolveOnlineSearchProvider = (
    query: string,
    preferred: OnlineMusicProviderId | SearchSourceId,
): OnlineMusicProviderId => {
    if (isQishuiShareUrl(query)) {
        return 'qishui';
    }
    if (preferred === 'qq' || preferred === 'coco' || preferred === 'qishui' || preferred === 'netease') {
        return preferred;
    }
    return 'netease';
};

/**
 * Keyword search fans out to checked + login-ready sources.
 * Unauthenticated Netease/QQ are excluded even if their pills are on.
 * Qishui share links still force the dedicated link parser.
 */
export const resolveEnabledSearchProviders = (
    query: string,
    enabledProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
    preferred?: OnlineMusicProviderId | SearchSourceId,
    sessions: OnlineSearchSessionAccess = {},
): OnlineMusicProviderId[] => {
    if (isQishuiShareUrl(query)) {
        return ['qishui'];
    }

    const searchable = resolveSearchableLibraryProviders(enabledProviders, sessions);
    if (searchable.length > 0) {
        return searchable;
    }

    const fallback = resolveOnlineSearchProvider(query, preferred || 'coco');
    if (fallback === 'qishui') {
        return ['qishui'];
    }
    if (
        (fallback === 'netease' || fallback === 'qq' || fallback === 'coco')
        && isProviderSearchable(fallback, sessions)
    ) {
        return [fallback];
    }
    return ['coco'];
};
