import { describe, expect, it } from 'vitest';
import {
    COVER_ATMOSPHERE_BLUR_PX,
    COVER_ATMOSPHERE_SOURCE_SIZE_PCT,
    COVER_ATMOSPHERE_UPSCALE,
    resolveCoverAtmosphereDownsampleStyle,
} from '@/utils/visualizer/coverAtmosphereDownsample';

// test/unit/visualizer/coverAtmosphereDownsample.test.ts
// Live-blur of a full-viewport cover is too expensive next to lyric compositing.

describe('coverAtmosphereDownsample', () => {
    it('blurs a small source then upscales past the viewport', () => {
        expect(COVER_ATMOSPHERE_SOURCE_SIZE_PCT * COVER_ATMOSPHERE_UPSCALE).toBeGreaterThan(100);
        expect(COVER_ATMOSPHERE_BLUR_PX).toBeLessThan(16);
        const style = resolveCoverAtmosphereDownsampleStyle('https://example.com/cover.jpg');
        expect(style.width).toBe('16%');
        expect(String(style.transform)).toContain('scale(8)');
        expect(String(style.filter)).toContain('blur(7px)');
    });
});
