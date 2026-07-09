import { describe, expect, it } from 'vitest';
import {
    resolveVisualizerSubtitleBottom,
    VISUALIZER_SUBTITLE_BAR_GAP_PX,
    VISUALIZER_SUBTITLE_IMMERSIVE_PADDING_PX,
} from '../../../src/components/visualizer/resolveVisualizerSubtitleBottom';

// test/unit/visualizer/resolveVisualizerSubtitleBottom.test.ts

describe('resolveVisualizerSubtitleBottom', () => {
    it('uses immersive padding when player chrome is hidden', () => {
        expect(resolveVisualizerSubtitleBottom(true)).toBe(`${VISUALIZER_SUBTITLE_IMMERSIVE_PADDING_PX}px`);
    });

    it('pads above the docked player bar so the subtitle stack can grow upward', () => {
        expect(VISUALIZER_SUBTITLE_BAR_GAP_PX).toBeGreaterThanOrEqual(28);
        expect(resolveVisualizerSubtitleBottom(false)).toBe(
            `calc(var(--app-player-bar-height, 72px) + ${VISUALIZER_SUBTITLE_BAR_GAP_PX}px + env(safe-area-inset-bottom, 0px))`,
        );
    });
});
