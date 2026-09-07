import React from 'react';
import type { VisualizerMode } from '../../../types';

// src/components/panelTab/controls/modeGlyphs.tsx
// 14px line glyphs that sketch lyric layouts and background engines. Unknown modes fall back.

const GLYPH_FRAME = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};

const FALLBACK_GLYPH = (
    <>
        <path d="M5 8h14" />
        <path d="M5 12h9" opacity="0.5" />
        <path d="M5 16h12" opacity="0.5" />
    </>
);

const VISUALIZER_MODE_GLYPHS: Record<string, React.ReactNode> = {
    still: (
        <>
            <path d="M5 7.5h14" opacity="0.35" />
            <path d="M3 12h18" />
            <path d="M6 16.5h12" opacity="0.35" />
        </>
    ),
    classic: (
        <>
            <path d="M3 12h18" opacity="0.35" />
            <path d="M3 12h8" />
        </>
    ),
    cadenza: (
        <>
            <circle cx="9.5" cy="12.5" r="3.5" />
            <path d="M4 6.5h3.5" opacity="0.45" />
            <path d="M16 8h4" opacity="0.45" />
            <path d="M15 17h4.5" opacity="0.45" />
        </>
    ),
    partita: (
        <>
            <path d="M4 7h7" />
            <path d="M8.5 12h7" opacity="0.7" />
            <path d="M13 17h7" opacity="0.45" />
        </>
    ),
    fume: (
        <>
            <path d="M6 7.5h9" opacity="0.3" />
            <path d="M1 12h22" />
            <path d="M9 16.5h9" opacity="0.3" />
        </>
    ),
    dazibao: (
        <>
            <path d="M5 12h14" strokeWidth="2.4" />
            <path d="M8 7.5h8" opacity="0.4" />
            <path d="M8 16.5h8" opacity="0.4" />
        </>
    ),
    monet: (
        <>
            <path d="M3 9.5h7" />
            <path d="M3 13.5h5" opacity="0.55" />
            <rect x="14" y="5" width="7" height="14" rx="1.5" opacity="0.55" />
        </>
    ),
    cappella: (
        <>
            <rect x="3" y="5" width="12" height="6" rx="3" />
            <rect x="9" y="13.5" width="12" height="6" rx="3" opacity="0.5" />
        </>
    ),
    tilt: (
        <>
            <path d="M4 9h16" />
            <path d="M5 16.5l14-3" opacity="0.55" />
        </>
    ),
    claddagh: (
        <>
            <ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-18 12 12)" />
            <circle cx="18" cy="9" r="1.5" fill="currentColor" stroke="none" />
        </>
    ),
    pendolo: (
        <>
            <circle cx="8" cy="12" r="5" />
            <circle cx="8" cy="12" r="1.4" fill="currentColor" stroke="none" />
            <path d="M16 10h5" opacity="0.55" />
            <path d="M16 14h4" opacity="0.55" />
        </>
    ),
};

type ModeGlyphProps = {
    mode: VisualizerMode;
    size?: number;
};

export const VisualizerModeGlyph: React.FC<ModeGlyphProps> = ({ mode, size = 14 }) => (
    <svg width={size} height={size} {...GLYPH_FRAME} aria-hidden="true" focusable="false">
        {VISUALIZER_MODE_GLYPHS[mode] ?? FALLBACK_GLYPH}
    </svg>
);

const BACKGROUND_MODE_GLYPHS: Record<string, React.ReactNode> = {
    common: (
        <>
            <path d="M4 17l5-8 5 8z" />
            <circle cx="17.5" cy="8.5" r="3" opacity="0.55" />
        </>
    ),
    interactive3d: (
        <>
            <path d="M12 4l8 4.5v7L12 20l-8-4.5v-7z" />
            <path d="M12 20v-7.5M4 8.5l8 4.5 8-4.5" opacity="0.55" />
        </>
    ),
    monet: (
        <>
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
            <path d="M20.5 8.5L8 19.5" opacity="0.55" />
        </>
    ),
    nomand: (
        <>
            <rect x="4" y="4" width="6.5" height="6.5" rx="0.8" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="0.8" opacity="0.45" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="0.8" opacity="0.45" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="0.8" />
        </>
    ),
    latent: (
        <>
            <path d="M4.5 7.5h.01M9 7.5h.01M13.5 7.5h.01M18 7.5h.01" strokeWidth="2.2" opacity="0.55" />
            <path d="M3 15c3-3.5 6-3.5 9 0s6 3.5 9 0" />
        </>
    ),
    url: (
        <>
            <rect x="3.5" y="5" width="17" height="14" rx="2" />
            <path d="M3.5 9.5h17" opacity="0.55" />
        </>
    ),
    sora: (
        <>
            <path d="M12 5.5l1.2 2.9 2.9 1.2-2.9 1.2L12 13.7l-1.2-2.9-2.9-1.2 2.9-1.2z" />
            <path d="M5.5 16.5h.01M18 15.5h.01M7 7h.01" strokeWidth="2.2" opacity="0.5" />
        </>
    ),
    turntable: (
        <>
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="2.2" />
            <path d="M12 4v3" opacity="0.55" />
        </>
    ),
};

type BackgroundGlyphProps = {
    mode: string;
    size?: number;
};

export const BackgroundModeGlyph: React.FC<BackgroundGlyphProps> = ({ mode, size = 14 }) => (
    <svg width={size} height={size} {...GLYPH_FRAME} aria-hidden="true" focusable="false">
        {BACKGROUND_MODE_GLYPHS[mode] ?? FALLBACK_GLYPH}
    </svg>
);
