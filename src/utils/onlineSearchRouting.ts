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

/** Coco / Qishui are always searchable; Netease/QQ require an active login session. */
export const isProviderSearchable = (
    id: OnlineLibraryProviderId,
    sessions: OnlineSearchSessionAccess,
): boolean => {
    if (id === 'coco' || id === 'qishui') return true;
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

const isPeerFreeProvider = (
    id?: string | null,
): id is Extract<OnlineMusicProviderId, 'coco' | 'qishui'> =>
    id === 'coco' || id === 'qishui';

/**
 * Overlay search provider resolution.
 * - Dedicated peer channel (exactly one free peer active): stay isolated.
 * - Home aggregate (multiple actives): keep the full set, including coco + qishui together.
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

    const active = (input.activeProviders || []).filter(
        (id): id is OnlineMusicProviderId => (
            id === 'netease' || id === 'qq' || id === 'qishui' || id === 'coco'
        ),
    );

    // Dedicated peer channel: exactly one free peer active.
    if (active.length === 1 && isPeerFreeProvider(active[0])) {
        return [active[0]];
    }

    // Home multi-source session — preserve coco + qishui together when both are active.
    if (active.length > 1) {
        return active;
    }

    // Independent peer entry before the first submit stamped searchProviders.
    if (active.length === 0 && isPeerFreeProvider(input.sourceTab)) {
        return [input.sourceTab];
    }

    return resolveEnabledSearchProviders(
        input.query,
        input.enabledProviders,
        input.sourceTab,
        input.sessions,
    );
};
