import type { CSSProperties } from 'react';
import type { PerformanceMode } from '../../types/performance';

// src/utils/chrome/floatingPlayerDockGlass.ts
// Floating dock glass: one live backdrop pass max; popovers never stack a second blur.

export type FloatingDockGlassTier = 'live' | 'soft' | 'solid';

export interface ResolveFloatingDockGlassInput {
    performanceMode: PerformanceMode;
    /** Resolved quality ladder from performance monitor (high/balanced/lite/…). */
    effectiveTier: string;
    reducedMotion?: boolean;
    isDaylight?: boolean;
}

export interface FloatingDockGlassStyle {
    tier: FloatingDockGlassTier;
    /** Dock shell className — never includes backdrop-blur-* (filter lives in style only). */
    dockClassName: string;
    dockStyle: CSSProperties;
    /** Shared fill/border/shadow tokens — menus add their own size/radius. */
    popoverClassName: string;
    popoverStyle: CSSProperties;
}

const LIVE_FILTER = 'blur(24px) saturate(1.8) brightness(1.12)';
const SOFT_FILTER = 'blur(12px) saturate(1.45) brightness(1.06)';

const resolveTier = (input: ResolveFloatingDockGlassInput): FloatingDockGlassTier => {
    if (input.reducedMotion) return 'solid';
    if (input.performanceMode === 'lite' || input.effectiveTier === 'lite') return 'solid';
    if (input.performanceMode === 'balanced' || input.effectiveTier === 'balanced') return 'soft';
    return 'live';
};

/** Picks dock + popover glass so Chromium only pays for one live backdrop sample on the hot path. */
export const resolveFloatingDockGlassStyle = (
    input: ResolveFloatingDockGlassInput,
): FloatingDockGlassStyle => {
    const tier = resolveTier(input);
    const isDaylight = Boolean(input.isDaylight);

    const dockTintClass = isDaylight ? 'bg-white/55' : 'bg-black/10';
    const solidDockTintClass = isDaylight ? 'bg-white/92' : 'bg-zinc-950/88';
    const softDockTintClass = isDaylight ? 'bg-white/72' : 'bg-black/45';

    const popoverTintClass = isDaylight
        ? 'border border-black/10 bg-white/95 shadow-[0_18px_48px_rgba(0,0,0,0.38)]'
        : 'border border-white/10 bg-black/88 shadow-[0_18px_48px_rgba(0,0,0,0.38)]';

    if (tier === 'solid') {
        return {
            tier,
            dockClassName: `pointer-events-auto relative h-full w-full overflow-visible rounded-[50px] border-0 transition-colors duration-300 ${solidDockTintClass}`,
            dockStyle: {
                backgroundColor: 'var(--shell-dock-glass)',
                borderColor: 'var(--shell-border)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
            },
            popoverClassName: popoverTintClass,
            popoverStyle: {
                backgroundColor: 'var(--shell-popover)',
                borderColor: 'var(--shell-border)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
            },
        };
    }

    const filter = tier === 'soft' ? SOFT_FILTER : LIVE_FILTER;
    const dockTint = tier === 'soft' ? softDockTintClass : dockTintClass;

    return {
        tier,
        dockClassName: `pointer-events-auto relative h-full w-full overflow-visible rounded-[50px] border-0 transition-colors duration-300 ${dockTint}`,
        dockStyle: {
            backgroundColor: 'var(--shell-dock-glass)',
            borderColor: 'var(--shell-border)',
            backdropFilter: filter,
            WebkitBackdropFilter: filter,
        },
        // Popovers sit above the stage too, but stacking a second live backdrop with the dock
        // doubles Chromium cost for little gain — keep them as dense fills (gpui "one blur" spirit).
        popoverClassName: popoverTintClass,
        popoverStyle: {
            backgroundColor: 'var(--shell-popover)',
            borderColor: 'var(--shell-border)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
        },
    };
};
