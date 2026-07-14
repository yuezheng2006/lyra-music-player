import type { OnlineMusicProviderId, SearchSourceId } from '../types';
import type { OnlineLibraryProviderId } from '../stores/useOnlineLibraryFilterStore';
import { ONLINE_LIBRARY_PROVIDER_IDS } from '../stores/useOnlineLibraryFilterStore';
import { isOnlineMusicProviderId, isPeerFreeProviderId } from './onlinePeerProviders';

// src/utils/onlineSearchRouting.ts
// Resolves which online provider(s) should handle a search query.

const QISHUI_SHARE_URL_RE = /^https?:\/\/qishui\.douyin\.com\/s\/[A-Za-z0-9]+/i;

export type OnlineSearchSessionAccess = {
    netease?: boolean;
    qq?: boolean;
};

export const isQishuiShareUrl = (value?: string | null) =>
    typeof value === 'string' && QISHUI_SHARE_URL_RE.test(value.trim());

/** Peer-free channels are always searchable; Netease/QQ require an active login session. */
export const isProviderSearchable = (
    id: OnlineLibraryProviderId,
    sessions: OnlineSearchSessionAccess,
): boolean => {
    if (isPeerFreeProviderId(id)) return true;
    if (id === 'netease') return Boolean(sessions.netease);
    if (id === 'qq') return Boolean(sessions.qq);
    return false;
};

/** Enabled library pills ∩ login-ready providers (peer-free always counts as ready). */
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
    if (isOnlineMusicProviderId(preferred)) {
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
    if (isProviderSearchable(fallback, sessions)) {
        return [fallback];
    }
    return ['coco'];
};

/**
 * Overlay search provider resolution.
 * - Dedicated peer channel (exactly one free peer active): stay isolated.
 * - Home aggregate (multiple actives): keep the full set.
 * - Empty active + peer sourceTab: independent entry fallback.
 */
export const resolveOverlaySearchProviders = (input: {
    query: string;
    sourceTab: SearchSourceId;
    activeProviders?: OnlineMusicProviderId[];
    enabledProviders: Partial<Record<OnlineLibraryProviderId, boolean>>;
    sessions?: OnlineSearchSessionAccess;
}): OnlineMusicProviderId[] => {
    if (isQishuiShareUrl(input.query)) {
        return ['qishui'];
    }

    const active = (input.activeProviders || []).filter(isOnlineMusicProviderId);

    // Dedicated peer channel: exactly one free peer active.
    if (active.length === 1 && isPeerFreeProviderId(active[0])) {
        return [active[0]];
    }

    // Home multi-source session — preserve peer channels together when both are active.
    if (active.length > 1) {
        return active;
    }

    // Independent peer entry before the first submit stamped searchProviders.
    if (active.length === 0 && isPeerFreeProviderId(input.sourceTab)) {
        return [input.sourceTab];
    }

    return resolveEnabledSearchProviders(
        input.query,
        input.enabledProviders,
        input.sourceTab,
        input.sessions,
    );
};
