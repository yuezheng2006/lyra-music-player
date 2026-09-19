import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Line } from '../../types';
import { resolveThemeTranslationFontStack } from '../../utils/fontStacks';
import { colorWithAlpha } from './colorMix';
import {
    resolveVisualizerCaptionBottom,
    resolveVisualizerCaptionRows,
    type VisualizerCaptionRowKind,
} from './resolveVisualizerCaptionOverlay';
import { VISUALIZER_SUBTITLE_PORTAL_ROOT_ID } from './visualizerSubtitlePortal';

// src/components/visualizer/VisualizerCaptionOverlay.tsx
// Multi-line podcast caption stack: current cue highlighted, neighbors stay readable.

interface VisualizerCaptionOverlayProps {
    showText: boolean;
    lines: Line[];
    currentLineIndex: number;
    isPlayerChromeHidden?: boolean;
}

const CAPTION_FONT_THEME = {
    fontStyle: 'sans' as const,
    fontFamily: undefined,
    fontFamilyStack: undefined,
};

const ROW_TONE: Record<VisualizerCaptionRowKind, { opacity: number; fontWeight: number; size: string }> = {
    past: {
        opacity: 0.34,
        fontWeight: 400,
        size: 'clamp(0.82rem, 1.45vw, 1.02rem)',
    },
    current: {
        opacity: 1,
        fontWeight: 600,
        size: 'clamp(0.98rem, 1.8vw, 1.22rem)',
    },
    upcoming: {
        opacity: 0.5,
        fontWeight: 400,
        size: 'clamp(0.86rem, 1.5vw, 1.06rem)',
    },
};

const VisualizerCaptionOverlay: React.FC<VisualizerCaptionOverlayProps> = ({
    showText,
    lines,
    currentLineIndex,
    isPlayerChromeHidden = false,
}) => {
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
    const rows = showText ? resolveVisualizerCaptionRows(lines, currentLineIndex) : [];
    const bottom = resolveVisualizerCaptionBottom(isPlayerChromeHidden);
    const fontFamily = resolveThemeTranslationFontStack(CAPTION_FONT_THEME);

    useLayoutEffect(() => {
        setPortalRoot(document.getElementById(VISUALIZER_SUBTITLE_PORTAL_ROOT_ID));
    }, []);

    const overlay = (
        <AnimatePresence>
            {rows.length > 0 ? (
                <motion.div
                    key="visualizer-caption-stack"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-x-0 z-[125] flex justify-center px-6 sm:px-10"
                    style={{ bottom }}
                    data-testid="visualizer-caption-overlay"
                >
                    <div
                        className="w-full max-w-[min(44rem,94%)] rounded-lg px-4 py-3 text-left shadow-lg"
                        style={{
                            backgroundColor: colorWithAlpha('#000000', 0.72),
                            boxShadow: `0 8px 28px ${colorWithAlpha('#000000', 0.35)}`,
                        }}
                    >
                        <div className="flex flex-col gap-1.5">
                            {rows.map((row) => {
                                const tone = ROW_TONE[row.kind];
                                return (
                                    <p
                                        key={row.index}
                                        data-caption-kind={row.kind}
                                        className="m-0 max-w-full leading-snug tracking-normal transition-[opacity,color] duration-200"
                                        style={{
                                            color: '#f8fafc',
                                            fontFamily,
                                            fontSize: tone.size,
                                            fontWeight: tone.fontWeight,
                                            opacity: tone.opacity,
                                            textShadow: row.kind === 'current'
                                                ? `0 1px 2px ${colorWithAlpha('#000000', 0.8)}`
                                                : 'none',
                                        }}
                                    >
                                        {row.text}
                                    </p>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    if (portalRoot) {
        return createPortal(overlay, portalRoot);
    }
    return overlay;
};

export default VisualizerCaptionOverlay;
