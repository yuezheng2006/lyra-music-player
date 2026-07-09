import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Line, Theme } from '../../types';
import { resolveThemeTranslationFontStack } from '../../utils/fontStacks';
import { resolveUpcomingLyricPresentation, resolveVisualizerBottomSubtitlePresentation } from './resolveUpcomingLyricPresentation';
import { resolveVisualizerSubtitleBottom } from './resolveVisualizerSubtitleBottom';
import { VISUALIZER_SUBTITLE_PORTAL_ROOT_ID } from './visualizerSubtitlePortal';

// src/components/visualizer/VisualizerSubtitleOverlay.tsx
// Shared bottom subtitle / upcoming-line overlay for visualizer modes.

interface VisualizerSubtitleOverlayProps {
    showText: boolean;
    activeLine: Line | null;
    recentCompletedLine: Line | null;
    nextLines: Line[];
    theme: Theme;
    translationFontSize: string;
    upcomingFontSize: string;
    opacity?: number;
    subtitleOverlayOpacity?: number;
    isPlayerChromeHidden?: boolean;
    hideTranslationSubtitle?: boolean;
    showSubtitleTranslation?: boolean;
}

export const resolveVisualizerSubtitleOverlayContent = ({
    showText,
    activeLine,
    recentCompletedLine,
    nextLines,
    hideTranslationSubtitle = false,
    showSubtitleTranslation = true,
}: Pick<VisualizerSubtitleOverlayProps, 'showText' | 'activeLine' | 'recentCompletedLine' | 'nextLines' | 'hideTranslationSubtitle' | 'showSubtitleTranslation'>) => {
    if (!showText || hideTranslationSubtitle) {
        return {
            shouldRenderOverlay: false,
            translationText: null as string | null,
            upcomingLines: [] as Line[],
        };
    }

    const rawTranslationText = activeLine?.translation || recentCompletedLine?.translation || null;
    const translationText = showSubtitleTranslation ? rawTranslationText : null;

    return {
        shouldRenderOverlay: true,
        translationText,
        upcomingLines: translationText ? [] : nextLines,
    };
};

const VisualizerSubtitleOverlay: React.FC<VisualizerSubtitleOverlayProps> = ({
    showText,
    activeLine,
    recentCompletedLine,
    nextLines,
    theme,
    translationFontSize,
    upcomingFontSize,
    opacity = 0.6,
    subtitleOverlayOpacity,
    isPlayerChromeHidden = false,
    hideTranslationSubtitle = false,
    showSubtitleTranslation = true,
}) => {
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
    const { shouldRenderOverlay, translationText, upcomingLines } = resolveVisualizerSubtitleOverlayContent({
        showText,
        activeLine,
        recentCompletedLine,
        nextLines,
        hideTranslationSubtitle,
        showSubtitleTranslation,
    });
    const resolvedOpacity = subtitleOverlayOpacity ?? opacity;
    const upcomingPresentation = resolveUpcomingLyricPresentation(theme, resolvedOpacity);
    const translationPresentation = resolveVisualizerBottomSubtitlePresentation(theme, resolvedOpacity);
    const showUpcomingLines = upcomingLines.length > 0;
    const bottomPadding = resolveVisualizerSubtitleBottom(isPlayerChromeHidden);

    // Mount into the app-level host so rhythm scale / overflow-hidden cannot clip upcoming lines.
    useLayoutEffect(() => {
        setPortalRoot(document.getElementById(VISUALIZER_SUBTITLE_PORTAL_ROOT_ID));
    }, []);

    const overlay = (
        <AnimatePresence>
            {shouldRenderOverlay && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{
                        opacity: translationText ? resolvedOpacity : 1,
                        y: 0,
                    }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{
                        opacity: { duration: 0.24, ease: 'easeOut' },
                        y: { duration: 0.24, ease: 'easeOut' },
                    }}
                    className="pointer-events-none absolute inset-x-0 bottom-0 px-4 text-center"
                    data-testid="visualizer-subtitle-overlay"
                    style={{ paddingBottom: bottomPadding }}
                >
                    <div className="mx-auto flex w-full max-w-2xl flex-col justify-end gap-2">
                        {translationText ? (
                            <motion.div
                                key={`trans-${activeLine?.startTime || recentCompletedLine?.startTime}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                data-font-debug-target="visualizer-translation"
                                className="font-medium leading-snug"
                                style={{
                                    color: translationPresentation.color,
                                    fontSize: translationFontSize,
                                    fontFamily: resolveThemeTranslationFontStack(theme),
                                    textShadow: translationPresentation.textShadow,
                                    opacity: translationPresentation.opacity,
                                }}
                            >
                                {translationText}
                            </motion.div>
                        ) : showUpcomingLines ? (
                            upcomingLines.map((line, index) => (
                                <p
                                    key={`${line.startTime}-${index}`}
                                    data-testid={`visualizer-upcoming-line-${index}`}
                                    className="truncate font-medium leading-snug transition-all duration-500"
                                    style={{
                                        color: upcomingPresentation.color,
                                        fontSize: upcomingFontSize,
                                        opacity: upcomingPresentation.lineOpacity * (index === 0 ? 1 : 0.82),
                                        textShadow: upcomingPresentation.textShadow,
                                    }}
                                >
                                    {line.fullText}
                                </p>
                            ))
                        ) : null}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (!portalRoot) {
        return null;
    }

    return createPortal(overlay, portalRoot);
};

export default VisualizerSubtitleOverlay;
