import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import { resolveInteractive3dQualityProfile } from './interactive3dSceneRegistry';
import { resolveGeometricQualityProfile } from './geometricQuality';
import MineradioPlaybackStage from './mineradio/MineradioPlaybackStage';
import {
    measureLyricColumnEndRatio,
    resolveInteractive3dStageContainmentStyle,
    shouldContainInteractive3dStageForMode,
} from './resolveInteractive3dStageContainment';
import StaticGeometricScene from './StaticGeometricScene';
import type { GeometricBackgroundProps } from './types';
import { useGeometricPointer } from './useGeometricPointer';
import { useInteractiveCameraControl } from './useInteractiveCameraControl';
import VignetteOverlay from './VignetteOverlay';

// src/components/visualizer/geometric/GeometricLayer.tsx
// Mineradio unified WebGL playback background (cover particles + stage lyrics).

const GeometricLayer: React.FC<GeometricBackgroundProps> = ({
    theme,
    audioBands,
    beatPulse,
    atmosphereEnergy,
    enableBeatBursts = true,
    interactive3dSceneTuning,
    seed,
    disableVignette = false,
    paused = false,
    staticMode = false,
    coverUrl,
    currentTime,
    lines = [],
    showLyrics = true,
    immersiveLyrics = false,
    playing = true,
    visualizerMode,
}) => {
    const { pointerX, pointerY } = useGeometricPointer();
    const fallbackMotion = useMotionValue(0);
    const stageRef = useRef<HTMLDivElement>(null);
    const interactionRef = useRef<HTMLDivElement>(null);
    const [lyricColumnEndRatio, setLyricColumnEndRatio] = useState<number | undefined>(undefined);
    const sceneTuning = interactive3dSceneTuning;
    const cameraControl = sceneTuning?.cameraControl ?? 'auto';
    const cameraControlState = useInteractiveCameraControl({
        mode: cameraControl,
        paused,
        staticMode,
        captureRef: interactionRef,
    });
    const qualityProfile = useMemo(
        () => sceneTuning
            ? resolveInteractive3dQualityProfile(sceneTuning)
            : resolveGeometricQualityProfile(),
        [sceneTuning],
    );
    const needsContainment = shouldContainInteractive3dStageForMode(visualizerMode);

    useEffect(() => {
        if (!needsContainment) {
            setLyricColumnEndRatio(undefined);
            return undefined;
        }

        const stageEl = stageRef.current;
        if (!stageEl) return undefined;

        const shellEl = stageEl.closest('[data-visualizer-shell="true"]') as HTMLElement | null;
        const measureRoot = shellEl ?? stageEl;
        const observedColumns = new WeakSet<Element>();
        let resizeObserver: ResizeObserver | null = null;

        const apply = (): HTMLElement | null => {
            const lyricColumnEl = measureRoot.querySelector('[data-monet-lyric-column="true"]') as HTMLElement | null;
            const next = measureLyricColumnEndRatio(measureRoot, lyricColumnEl);
            setLyricColumnEndRatio(prev => (
                prev === next || (prev !== undefined && next !== undefined && Math.abs(prev - next) < 0.008)
                    ? prev
                    : next
            ));
            return lyricColumnEl;
        };

        const observeColumn = (lyricColumnEl: HTMLElement | null) => {
            if (!lyricColumnEl || !resizeObserver || observedColumns.has(lyricColumnEl)) return;
            resizeObserver.observe(lyricColumnEl);
            observedColumns.add(lyricColumnEl);
        };

        const sync = () => {
            observeColumn(apply());
        };

        resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(sync)
            : null;
        resizeObserver?.observe(measureRoot);
        sync();

        const mutationObserver = typeof MutationObserver !== 'undefined'
            ? new MutationObserver(sync)
            : null;
        mutationObserver?.observe(measureRoot, { childList: true, subtree: true });

        window.addEventListener('resize', sync);
        document.addEventListener('fullscreenchange', sync);

        return () => {
            resizeObserver?.disconnect();
            mutationObserver?.disconnect();
            window.removeEventListener('resize', sync);
            document.removeEventListener('fullscreenchange', sync);
        };
    }, [needsContainment, visualizerMode, immersiveLyrics]);

    const stageContainmentStyle = useMemo(
        () => resolveInteractive3dStageContainmentStyle(visualizerMode, lyricColumnEndRatio),
        [lyricColumnEndRatio, visualizerMode],
    );

    return (
        <div
            ref={stageRef}
            className="absolute inset-0 overflow-hidden"
            style={stageContainmentStyle}
            data-interactive3d-stage="true"
        >
            {cameraControlState.isInteractive && (
                <div
                    ref={interactionRef}
                    className="absolute inset-0 z-[1] touch-none"
                    style={{ pointerEvents: 'auto' }}
                    data-testid="interactive3d-camera-capture"
                    aria-hidden
                />
            )}
            {paused ? (
                <StaticGeometricScene
                    theme={theme}
                    shapes={[]}
                    particles={[]}
                    hideShapes
                    disableVignette={disableVignette}
                />
            ) : (
                <MineradioPlaybackStage
                    theme={theme}
                    coverUrl={coverUrl}
                    sceneTuning={sceneTuning}
                    qualityProfile={qualityProfile}
                    audioBands={audioBands}
                    beatPulse={beatPulse ?? fallbackMotion}
                    atmosphereEnergy={atmosphereEnergy ?? fallbackMotion}
                    smartAtmosphereEnabled={enableBeatBursts}
                    pointerX={pointerX}
                    pointerY={pointerY}
                    currentTime={currentTime}
                    lines={lines}
                    showLyrics={showLyrics}
                    immersiveLyrics={immersiveLyrics}
                    playing={playing}
                    paused={paused}
                    cameraControlState={cameraControlState}
                />
            )}
            <VignetteOverlay disabled={disableVignette} immersive={immersiveLyrics} />
        </div>
    );
};

export default GeometricLayer;
