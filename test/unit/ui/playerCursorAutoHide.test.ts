import { describe, expect, it } from 'vitest';
import { shouldHidePlayerCursor } from '@/utils/ui/playerCursorAutoHide';

// test/unit/ui/playerCursorAutoHide.test.ts

describe('shouldHidePlayerCursor', () => {
    it('hides the pointer only on an immersive player stage', () => {
        expect(shouldHidePlayerCursor({
            isPlayerView: true,
            isPlayerChromeHidden: true,
            autoHideCursorWithPlayerChrome: true,
        })).toBe(true);
        expect(shouldHidePlayerCursor({
            isPlayerView: true,
            isPlayerChromeHidden: true,
            autoHideCursorWithPlayerChrome: false,
        })).toBe(false);
        expect(shouldHidePlayerCursor({
            isPlayerView: false,
            isPlayerChromeHidden: true,
            autoHideCursorWithPlayerChrome: true,
        })).toBe(false);
    });
});
