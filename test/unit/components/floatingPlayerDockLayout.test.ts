import { describe, expect, it } from 'vitest';
import {
    FLOATING_PLAYER_DOCK_BOTTOM_INSET_PX,
    FLOATING_PLAYER_DOCK_HEIGHT_PX,
    FLOATING_PLAYER_DOCK_MAX_WIDTH_PX,
    FLOATING_PLAYER_DOCK_SIDE_INSET_PX,
    FLOATING_PLAYER_PROGRESS_INSET_PX,
    resolveFloatingPlayerBarReserve,
    resolveFloatingPlayerDockFrameStyle,
} from '../../../src/components/floatingPlayerDockLayout';

// test/unit/components/floatingPlayerDockLayout.test.ts

describe('floatingPlayerDockLayout', () => {
    it('reserves dock height plus bottom inset for content clearance', () => {
        expect(resolveFloatingPlayerBarReserve(false)).toBe(
            `${FLOATING_PLAYER_DOCK_HEIGHT_PX + FLOATING_PLAYER_DOCK_BOTTOM_INSET_PX}px`,
        );
        expect(resolveFloatingPlayerBarReserve(true)).toBe('0px');
    });

    it('caps dock width so ultrawide windows do not stretch the control strip', () => {
        expect(FLOATING_PLAYER_DOCK_MAX_WIDTH_PX).toBeLessThanOrEqual(1080);
        expect(FLOATING_PLAYER_PROGRESS_INSET_PX).toBeGreaterThanOrEqual(16);
    });

    it('anchors the outer frame to the content column with side insets', () => {
        const style = resolveFloatingPlayerDockFrameStyle(false);
        expect(style.left).toContain('var(--app-sidebar-width');
        expect(style.right).toBe(`${FLOATING_PLAYER_DOCK_SIDE_INSET_PX}px`);
        expect(style.height).toBe(`${FLOATING_PLAYER_DOCK_HEIGHT_PX}px`);
    });

    it('keeps the outer frame pointer-transparent so side overlays stay clickable', () => {
        expect(resolveFloatingPlayerDockFrameStyle(false).pointerEvents).toBe('none');
        expect(resolveFloatingPlayerDockFrameStyle(true).pointerEvents).toBe('none');
    });
});
