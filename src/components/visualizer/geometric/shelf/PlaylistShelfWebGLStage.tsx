import React, { useRef } from 'react';
import type { Interactive3dSceneTuning, Theme } from '../../../../types';
import { shouldRenderPlaylistShelf } from './shelfLayout';
import PlaylistShelfDetailStub from './PlaylistShelfDetailStub';
import type { PlaylistShelfItem } from './shelfTypes';
import { usePlaylistShelfRuntime } from './usePlaylistShelfRuntime';

// src/components/visualizer/geometric/shelf/PlaylistShelfWebGLStage.tsx
// WebGL stage wrapper for the interactive 3D playlist shelf MVP.

interface PlaylistShelfWebGLStageProps {
    items: PlaylistShelfItem[];
    sceneTuning?: Interactive3dSceneTuning;
    theme: Theme;
    paused?: boolean;
}

const PlaylistShelfWebGLStage: React.FC<PlaylistShelfWebGLStageProps> = ({
    items,
    sceneTuning,
    theme,
    paused = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { selectedIndex, detailItem, closeDetail } = usePlaylistShelfRuntime({
        containerRef,
        items,
        sceneTuning,
        theme,
        paused,
    });

    if (!shouldRenderPlaylistShelf(sceneTuning)) return null;

    return (
        <>
            <div
                ref={containerRef}
                className="absolute inset-0 overflow-hidden pointer-events-auto"
                data-testid="interactive3d-playlist-shelf-stage"
                aria-hidden
            />
            <PlaylistShelfDetailStub
                item={detailItem}
                selectedIndex={selectedIndex}
                total={items.length}
                theme={theme}
                onClose={closeDetail}
            />
        </>
    );
};

export default PlaylistShelfWebGLStage;
