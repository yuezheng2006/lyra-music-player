import type { OnlineMusicProviderId } from '../types';

// src/utils/onlinePeerProviders.ts
// No-login peer channels that always count as searchable when their pill is on.

export const PEER_FREE_PROVIDER_IDS = ['coco', 'qishui', 'kugou', 'bilibili'] as const;

export type PeerFreeProviderId = (typeof PEER_FREE_PROVIDER_IDS)[number];

export const isPeerFreeProviderId = (
    id?: string | null,
): id is PeerFreeProviderId =>
    id === 'coco'
    || id === 'qishui'
    || id === 'kugou'
    || id === 'bilibili';

export const isOnlineMusicProviderId = (
    id?: string | null,
): id is OnlineMusicProviderId =>
    id === 'netease'
    || id === 'qq'
    || id === 'qishui'
    || id === 'coco'
    || id === 'kugou'
    || id === 'bilibili';
