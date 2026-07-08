import type { MotionValue } from 'framer-motion';
import type { AudioBands, Interactive3dSceneTuning, Line, Theme } from '../../../types';
import type { PlaylistShelfItem } from './shelf/shelfTypes';

// src/components/visualizer/geometric/types.ts
// Shared geometric background contracts.

export interface GeometricBackgroundProps {
    theme: Theme;
    audioPower: MotionValue<number>;
    audioBands?: AudioBands;
    beatPulse?: MotionValue<number>;
    cinemaScale?: MotionValue<number>;
    cameraPunch?: MotionValue<number>;
    sceneParallaxX?: MotionValue<number>;
    sceneParallaxY?: MotionValue<number>;
    sceneRoll?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    /** Whether the beat-map / atmosphere director layer should drive WebGL rhythm. */
    enableBeatBursts?: boolean;
    interactive3dSceneTuning?: Interactive3dSceneTuning;
    seed?: string | number;
    hideShapes?: boolean;
    disableVignette?: boolean;
    paused?: boolean;
    staticMode?: boolean;
    coverUrl?: string | null;
    playlistShelfItems?: PlaylistShelfItem[];
    visualizerMode?: import('../../../types').VisualizerMode;
    currentTime?: MotionValue<number>;
    lines?: Line[];
    showLyrics?: boolean;
    playing?: boolean;
}

export type ShapeType = 'circle' | 'square' | 'triangle' | 'cross' | 'icon';

export type ScaleKey = 'bass' | 'lowMid' | 'mid' | 'vocal' | 'treble' | 'default';

export interface BackgroundShape {
    id: number;
    type: ShapeType;
    iconName: string | null;
    initialX: number;
    initialY: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
    reverse: boolean;
    filled: boolean;
    initialRotation: number;
    depth: number;
}

export interface BackgroundParticle {
    id: number;
    size: number;
    left: number;
    top: number;
    opacity: number;
    duration: number;
    delay: number;
}

export interface GeometricSceneProps {
    theme: Theme;
    shapes: BackgroundShape[];
    particles: BackgroundParticle[];
    hideShapes: boolean;
    disableVignette: boolean;
}
