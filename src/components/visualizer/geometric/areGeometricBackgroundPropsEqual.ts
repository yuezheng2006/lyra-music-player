import type { GeometricBackgroundProps } from './types';
import { buildPlaylistShelfSignature } from './shelf/buildPlaylistShelfItems';

// src/components/visualizer/geometric/areGeometricBackgroundPropsEqual.ts
// Memo comparator for GeometricBackground to avoid unnecessary rerenders.

export const areGeometricBackgroundPropsEqual = (
    prevProps: GeometricBackgroundProps,
    nextProps: GeometricBackgroundProps,
) => {
    if (prevProps.seed !== nextProps.seed) return false;
    if (prevProps.audioPower !== nextProps.audioPower) return false;
    if (prevProps.beatPulse !== nextProps.beatPulse) return false;
    if (prevProps.cinemaScale !== nextProps.cinemaScale) return false;
    if (prevProps.cameraPunch !== nextProps.cameraPunch) return false;
    if (prevProps.sceneParallaxX !== nextProps.sceneParallaxX) return false;
    if (prevProps.sceneParallaxY !== nextProps.sceneParallaxY) return false;
    if (prevProps.sceneRoll !== nextProps.sceneRoll) return false;
    if (prevProps.enableBeatBursts !== nextProps.enableBeatBursts) return false;
    if (prevProps.hideShapes !== nextProps.hideShapes) return false;
    if (prevProps.disableVignette !== nextProps.disableVignette) return false;
    if (prevProps.paused !== nextProps.paused) return false;
    if (prevProps.staticMode !== nextProps.staticMode) return false;
    if (prevProps.coverUrl !== nextProps.coverUrl) return false;
    if (prevProps.visualizerMode !== nextProps.visualizerMode) return false;
    if (prevProps.currentTime !== nextProps.currentTime) return false;
    if (prevProps.lines !== nextProps.lines) return false;
    if (prevProps.showLyrics !== nextProps.showLyrics) return false;
    if (prevProps.immersiveLyrics !== nextProps.immersiveLyrics) return false;
    if (prevProps.playing !== nextProps.playing) return false;
    if (prevProps.atmosphereEnergy !== nextProps.atmosphereEnergy) return false;

    const prevShelfSignature = buildPlaylistShelfSignature(prevProps.playlistShelfItems ?? []);
    const nextShelfSignature = buildPlaylistShelfSignature(nextProps.playlistShelfItems ?? []);
    if (prevShelfSignature !== nextShelfSignature) return false;

    const previousTuning = prevProps.interactive3dSceneTuning;
    const nextTuning = nextProps.interactive3dSceneTuning;
    if (previousTuning !== nextTuning) {
        if (!previousTuning || !nextTuning) return false;
        const tuningKeys = Object.keys(previousTuning) as (keyof typeof previousTuning)[];
        if (tuningKeys.some((key) => previousTuning[key] !== nextTuning[key])) return false;
    }

    const previousBands = prevProps.audioBands;
    const nextBands = nextProps.audioBands;

    if (!previousBands !== !nextBands) return false;

    let bandsEqual = true;
    if (previousBands && nextBands) {
        bandsEqual =
            previousBands.bass === nextBands.bass &&
            previousBands.lowMid === nextBands.lowMid &&
            previousBands.mid === nextBands.mid &&
            previousBands.vocal === nextBands.vocal &&
            previousBands.treble === nextBands.treble;
    }
    if (!bandsEqual) return false;

    const previousTheme = prevProps.theme;
    const nextTheme = nextProps.theme;

    const colorsEqual =
        previousTheme.backgroundColor === nextTheme.backgroundColor &&
        previousTheme.primaryColor === nextTheme.primaryColor &&
        previousTheme.secondaryColor === nextTheme.secondaryColor &&
        previousTheme.accentColor === nextTheme.accentColor;

    const iconsEqual =
        previousTheme.lyricsIcons === nextTheme.lyricsIcons ||
        (previousTheme.lyricsIcons?.length === nextTheme.lyricsIcons?.length &&
            previousTheme.lyricsIcons?.every((value, index) => value === nextTheme.lyricsIcons?.[index]));

    return colorsEqual && iconsEqual;
};
