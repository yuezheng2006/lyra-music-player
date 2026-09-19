import { describe, expect, it } from 'vitest';
import {
    isMacNavigatorPlatform,
    shouldUseNativeFullscreenTrafficLight,
} from '@/utils/window/macNativeFullscreenTrafficLight';

// test/unit/window/macNativeFullscreenTrafficLight.test.ts

describe('macNativeFullscreenTrafficLight', () => {
    it('detects macOS user agents', () => {
        expect(isMacNavigatorPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(true);
        expect(isMacNavigatorPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
    });

    it('uses native fullscreen only on Mac', () => {
        expect(shouldUseNativeFullscreenTrafficLight(true)).toBe(true);
        expect(shouldUseNativeFullscreenTrafficLight(false)).toBe(false);
    });
});
