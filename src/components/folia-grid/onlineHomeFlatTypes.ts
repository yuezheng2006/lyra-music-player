import type { NeteasePlaylist, OnlineMusicProviderId } from '../../types';

// src/components/folia-grid/onlineHomeFlatTypes.ts
// Shared card shape for the flat online home library.

export type OnlineHomeFlatItem = {
    id: string | number;
    name: string;
    coverUrl?: string;
    trackCount?: number;
    playCount?: number;
    description?: string;
    musicProvider?: OnlineMusicProviderId;
    raw: NeteasePlaylist;
};
