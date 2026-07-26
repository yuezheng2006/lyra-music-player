import type { BuiltInOnlineMusicProviderId, OnlineMusicProviderId } from '../types';
import {
    BUILTIN_ONLINE_PROVIDER_IDS,
    FIRST_CLASS_RESERVED_IDS,
    PROVIDER_ID_RE,
    isBuiltInOnlineMusicProviderId,
} from './musicProviders/providerManifestMath';

// src/utils/onlinePeerProviders.ts
// No-login peer channels that always count as searchable when their pill is on.

export const PEER_FREE_PROVIDER_IDS = ['coco', 'qishui', 'kugou', 'bilibili', 'kuwo'] as const;

export type PeerFreeProviderId = (typeof PEER_FREE_PROVIDER_IDS)[number];

export const BUILTIN_PROVIDER_SEED_IDS: BuiltInOnlineMusicProviderId[] = [...BUILTIN_ONLINE_PROVIDER_IDS];

export const isBuiltInOnlineProviderId = (
    id?: string | null,
): id is BuiltInOnlineMusicProviderId => isBuiltInOnlineMusicProviderId(id);

/** True for built-in sources or open-mode plugin ids — never home/UI surface ids. */
export const isOnlineMusicProviderId = (
    id?: string | null,
): id is OnlineMusicProviderId => {
    if (!id) return false;
    if (isBuiltInOnlineMusicProviderId(id)) return true;
    if (!PROVIDER_ID_RE.test(id)) return false;
    // 'playlist' / 'albums' / … match PROVIDER_ID_RE but are HomeViewTab search surfaces.
    return !(FIRST_CLASS_RESERVED_IDS as readonly string[]).includes(id);
};

/** Curated no-login peer channels shipped in-app (excludes open-mode plugins). */
export const isCuratedPeerFreeProviderId = (
    id?: string | null,
): id is PeerFreeProviderId =>
    id === 'coco'
    || id === 'qishui'
    || id === 'kugou'
    || id === 'bilibili'
    || id === 'kuwo';

/** Peer-free curated channels, plus open-mode plugins (no in-app login session). */
export const isPeerFreeProviderId = (id?: string | null): boolean => {
    if (!id) return false;
    if (isCuratedPeerFreeProviderId(id)) {
        return true;
    }
    // Dynamic sidecar plugins: searchable without Netease/QQ session.
    return !isBuiltInOnlineMusicProviderId(id) && isOnlineMusicProviderId(id);
};
