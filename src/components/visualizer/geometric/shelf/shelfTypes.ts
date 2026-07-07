import type {
    Interactive3dSceneTuning,
    LocalPlaylist,
    NeteasePlaylist,
    SongResult,
} from '../../../../types';

// src/components/visualizer/geometric/shelf/shelfTypes.ts
// Shared contracts for the Mineradio-style 3D playlist shelf MVP.

export type PlaylistShelfMode = 'off' | 'sidebar' | 'stage';

export type PlaylistShelfPresence = 'auto' | 'always';

export type PlaylistShelfCameraMode = 'dynamic' | 'static';

export interface PlaylistShelfItem {
    id: string;
    title: string;
    subtitle?: string;
    coverUrl?: string | null;
    trackCount?: number;
    source: 'queue' | 'local' | 'netease';
}

export interface ShelfLayoutProfile {
    mode: PlaylistShelfMode;
    presence: PlaylistShelfPresence;
    cameraMode: PlaylistShelfCameraMode;
    size: number;
    offsetX: number;
    offsetY: number;
    offsetZ: number;
    angleY: number;
    opacity: number;
    bgOpacity: number;
}

export interface ShelfCardTransform {
    x: number;
    y: number;
    z: number;
    rotateY: number;
    scale: number;
    opacity: number;
    isCenter: boolean;
}

export interface BuildPlaylistShelfItemsInput {
    playQueue?: SongResult[];
    localPlaylists?: LocalPlaylist[];
    neteasePlaylists?: NeteasePlaylist[];
}

export type PlaylistShelfTuningSlice = Pick<
    Interactive3dSceneTuning,
    'shelfMode' | 'shelfPresence' | 'shelfCameraMode'
>;
