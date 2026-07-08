import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Line, Theme } from '../../types';
import { resolveThemeTranslationFontStack } from '../../utils/fontStacks';
import { resolveUpcomingLyricPresentation, resolveVisualizerBottomSubtitlePresentation } from './resolveUpcomingLyricPresentation';

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

    return (
        <AnimatePresence>
            {shouldRenderOverlay && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: translationText ? resolvedOpacity : 1,
                        y: 0,
                        bottom: isPlayerChromeHidden ? 32 : 112,
                    }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{
                        bottom: { type: 'spring', stiffness: 280, damping: 28 },
                        opacity: { duration: 0.24, ease: 'easeOut' },
                        y: { duration: 0.24, ease: 'easeOut' },
                    }}
                    className="absolute left-0 right-0 text-center space-y-2 px-4 z-30 pointer-events-none"
                >
                    {translationText ? (
                        <motion.div
                            key={`trans-${activeLine?.startTime || recentCompletedLine?.startTime}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            data-font-debug-target="visualizer-translation"
                            className="font-medium max-w-4xl mx-auto"
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
                                key={index}
                                data-testid={`visualizer-upcoming-line-${index}`}
                                className="truncate max-w-2xl mx-auto font-medium transition-all duration-500"
                                style={{
                                    color: upcomingPresentation.color,
                                    fontSize: upcomingFontSize,
                                    opacity: upcomingPresentation.lineOpacity,
                                    textShadow: upcomingPresentation.textShadow,
                                }}
                            >
                                {line.fullText}
                            </p>
                        ))
                    ) : null}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VisualizerSubtitleOverlay;
