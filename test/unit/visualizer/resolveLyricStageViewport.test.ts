import { describe, expect, it } from 'vitest';
import {
    LYRIC_STAGE_DEFAULT_MARGIN,
    LYRIC_STAGE_IMMERSIVE_MARGIN,
    resolveLyricStageMaxWorldWidth,
} from '@/components/visualizer/geometric/mineradio/lyrics/resolveLyricStageViewport';

// test/unit/visualizer/resolveLyricStageViewport.test.ts

describe('resolveLyricStageMaxWorldWidth', () => {
    it('allows a wider lyric plane in immersive fullscreen', () => {
        const base = resolveLyricStageMaxWorldWidth({
            aspect: 16 / 9,
            fovDeg: 45,
            cameraDistance: 4.2,
            margin: LYRIC_STAGE_DEFAULT_MARGIN,
        });
        const immersive = resolveLyricStageMaxWorldWidth({
            aspect: 16 / 9,
            fovDeg: 42,
            cameraDistance: 4.2,
            margin: LYRIC_STAGE_IMMERSIVE_MARGIN,
            immersive: true,
        });

        expect(immersive).toBeGreaterThan(base);
        expect(immersive).toBeGreaterThan(4.8);
    });
});
