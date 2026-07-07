import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_INTERACTIVE3D_SCENE_TUNING, type Interactive3dSceneTuning, type Theme } from '../../../../types';
import { buildPlaylistShelfSignature } from './buildPlaylistShelfItems';
import { advanceShelfSelection, resolveShelfLayoutProfile, shouldRenderPlaylistShelf } from './shelfLayout';
import { PlaylistShelfRuntime } from './playlistShelfRuntime';
import type { PlaylistShelfItem } from './shelfTypes';

// src/components/visualizer/geometric/shelf/usePlaylistShelfRuntime.ts
// React hook mounting playlist shelf WebGL runtime with wheel selection and detail stub state.

interface UsePlaylistShelfRuntimeOptions {
    containerRef: React.RefObject<HTMLElement | null>;
    items: PlaylistShelfItem[];
    sceneTuning?: Interactive3dSceneTuning;
    theme: Theme;
    paused?: boolean;
}

export const usePlaylistShelfRuntime = ({
    containerRef,
    items,
    sceneTuning,
    theme,
    paused = false,
}: UsePlaylistShelfRuntimeOptions) => {
    const runtimeRef = useRef<PlaylistShelfRuntime | null>(null);
    const selectedIndexRef = useRef(0);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [detailItem, setDetailItem] = useState<PlaylistShelfItem | null>(null);
    const signature = buildPlaylistShelfSignature(items);

    const syncSelection = useCallback((index: number) => {
        selectedIndexRef.current = index;
        setSelectedIndex(index);
        runtimeRef.current?.setSelectedIndex(index);
    }, []);

    const closeDetail = useCallback(() => {
        setDetailItem(null);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || paused || !shouldRenderPlaylistShelf(sceneTuning)) return undefined;

        const runtime = new PlaylistShelfRuntime();
        runtimeRef.current = runtime;
        runtime.setAccentColor(theme.secondaryColor);
        runtime.setCallbacks({
            onCardSelect: (_index, item) => {
                setDetailItem(item);
            },
        });
        runtime.mount(container);
        runtime.setLayoutProfile(resolveShelfLayoutProfile(sceneTuning ?? DEFAULT_INTERACTIVE3D_SCENE_TUNING));
        runtime.setItems(items);
        runtime.setSelectedIndex(selectedIndexRef.current);

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            runtime.resize(entry.contentRect.width, entry.contentRect.height);
        });
        observer.observe(container);

        const handleWheel = (event: WheelEvent) => {
            if (items.length === 0) return;
            event.preventDefault();
            const nextIndex = advanceShelfSelection(
                selectedIndexRef.current,
                event.deltaY,
                items.length,
            );
            if (nextIndex !== selectedIndexRef.current) {
                syncSelection(nextIndex);
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
            observer.disconnect();
            runtime.dispose();
            runtimeRef.current = null;
        };
    }, [
        containerRef,
        items,
        paused,
        sceneTuning?.shelfMode,
        sceneTuning?.shelfPresence,
        sceneTuning?.shelfCameraMode,
        signature,
        syncSelection,
        theme.secondaryColor,
    ]);

    useEffect(() => {
        runtimeRef.current?.setAccentColor(theme.secondaryColor);
    }, [theme.secondaryColor]);

    useEffect(() => {
        if (!runtimeRef.current || !sceneTuning) return;
        runtimeRef.current.setLayoutProfile(resolveShelfLayoutProfile(sceneTuning));
    }, [sceneTuning?.shelfMode, sceneTuning?.shelfPresence, sceneTuning?.shelfCameraMode]);

    useEffect(() => {
        runtimeRef.current?.setItems(items);
    }, [items, signature]);

    return {
        selectedIndex,
        detailItem,
        closeDetail,
    };
};
