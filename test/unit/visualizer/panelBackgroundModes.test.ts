import { describe, expect, it } from 'vitest';
import {
    getPanelBackgroundModeLabel,
    isPanelPlayerBackgroundMode,
    PANEL_PLAYER_BACKGROUND_MODES,
    resolveDockBackgroundModes,
} from '@/utils/visualizer/panelBackgroundModes';
import { stepOrderedValue } from '@/utils/visualizer/stepOrderedValue';
import { APP_OVERLAY_MOBILE_PLAYER_CLEARANCE_CLASS } from '@/components/app/home/homeSurfaceStyles';

// test/unit/visualizer/panelBackgroundModes.test.ts
// Compact panel engines include Nomand; overlay lists track the player-bar height.

describe('panelBackgroundModes', () => {
    it('includes nomand in the compact player-panel list', () => {
        expect(PANEL_PLAYER_BACKGROUND_MODES).toEqual(['common', 'nomand', 'monet']);
        expect(PANEL_PLAYER_BACKGROUND_MODES).toContain('nomand');
        expect(isPanelPlayerBackgroundMode('nomand')).toBe(true);
        expect(isPanelPlayerBackgroundMode('url')).toBe(false);
        expect(getPanelBackgroundModeLabel('nomand', key => key)).toBe('options.visualizerBackgroundModeNomand');
    });

    it('wraps background engines in panel order', () => {
        expect(stepOrderedValue(PANEL_PLAYER_BACKGROUND_MODES, 'monet', 1)).toBe('common');
        expect(stepOrderedValue(PANEL_PLAYER_BACKGROUND_MODES, 'common', -1)).toBe('monet');
    });

    it('keeps the current dock engine visible when it is not a compact preset', () => {
        expect(resolveDockBackgroundModes('common')).toEqual(['common', 'nomand']);
        expect(resolveDockBackgroundModes('turntable')).toEqual(['turntable', 'common', 'nomand']);
    });
});

describe('overlay player clearance', () => {
    it('tracks the floating player bar height on mobile overlays', () => {
        expect(APP_OVERLAY_MOBILE_PLAYER_CLEARANCE_CLASS).toContain('--app-player-bar-height');
        expect(APP_OVERLAY_MOBILE_PLAYER_CLEARANCE_CLASS).toContain('md:pb-8');
    });
});
