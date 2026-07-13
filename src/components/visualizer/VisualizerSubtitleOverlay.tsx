import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Line, LyricWordMode, Theme } from '../../types';
import { resolveThemeTranslationFontStack } from '../../utils/fontStacks';
import { resolveUpcomingLyricLines } from '../../utils/lyrics/lyricWordMode';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
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
    lyricWordMode?: LyricWordMode;
}

export const resolveVisualizerSubtitleOverlayContent = ({
    showText,
    activeLine,
    recentCompletedLine,
    nextLines,
    hideTranslationSubtitle = false,
    showSubtitleTranslation = true,
    lyricWordMode = 'default',
}: Pick<VisualizerSubtitleOverlayProps, 'showText' | 'activeLine' | 'recentCompletedLine' | 'nextLines' | 'hideTranslationSubtitle' | 'showSubtitleTranslation' | 'lyricWordMode'>) => {
    if (!showText || hideTranslationSubtitle) {
        return {
            shouldRenderOverlay: false,
            translationText: null as string | null,
            upcomingLines: [] as Line[],
        };
    }

    const rawTranslationText = activeLine?.translation || recentCompletedLine?.translation || null;
    const translationText = showSubtitleTranslation ? rawTranslationText : null;
    const gatedNextLines = resolveUpcomingLyricLines(nextLines, lyricWordMode);

    // K歌：预告行必须始终可见；翻译与预告可并存，不能因有翻译就清空下一句。
    return {
        shouldRenderOverlay: Boolean(translationText) || gatedNextLines.length > 0,
        translationText,
        upcomingLines: gatedNextLines,
    };
};

/** Floats the translation caption under the main lyric zone instead of pinning it to the dock. */
const resolveTranslationCaptionBottom = (isPlayerChromeHidden: boolean): string => (
    isPlayerChromeHidden
        ? 'max(20vh, 120px)'
        : `max(22vh, calc(var(--app-player-bar-height, 72px) + 108px + env(safe-area-inset-bottom, 0px)))`
);

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
    lyricWordMode: lyricWordModeProp,
}) => {
    const storeLyricWordMode = useSettingsUiStore(state => state.lyricWordMode);
    const lyricWordMode = lyricWordModeProp ?? storeLyricWordMode;
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
    const { shouldRenderOverlay, translationText, upcomingLines } = resolveVisualizerSubtitleOverlayContent({
        showText,
        activeLine,
        recentCompletedLine,
        nextLines,
        hideTranslationSubtitle,
        showSubtitleTranslation,
        lyricWordMode,
    });
    const resolvedOpacity = subtitleOverlayOpacity ?? opacity;
    const upcomingPresentation = resolveUpcomingLyricPresentation(theme, resolvedOpacity);
    const translationPresentation = resolveVisualizerBottomSubtitlePresentation(theme, resolvedOpacity);
    const showUpcomingLines = upcomingLines.length > 0;
    const bottomPadding = resolveVisualizerSubtitleBottom(isPlayerChromeHidden);
    const translationCaptionBottom = resolveTranslationCaptionBottom(isPlayerChromeHidden);

    // Mount into the app-level host so rhythm scale / overflow-hidden cannot clip upcoming lines.
    useLayoutEffect(() => {
        setPortalRoot(document.getElementById(VISUALIZER_SUBTITLE_PORTAL_ROOT_ID));
    }, []);

    const overlay = (
        <AnimatePresence>
            {shouldRenderOverlay && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ opacity: { duration: 0.24, ease: 'easeOut' } }}
                    className="pointer-events-none absolute inset-0"
                    data-testid="visualizer-subtitle-overlay"
                >
                    {translationText ? (
                        <motion.div
                            key={`trans-${activeLine?.startTime || recentCompletedLine?.startTime}`}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: translationPresentation.opacity, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                            className="absolute inset-x-0 px-5 text-center"
                            style={{ bottom: translationCaptionBottom }}
                        >
                            <div className="mx-auto inline-flex max-w-3xl flex-col items-center gap-2.5">
                                <span
                                    aria-hidden="true"
                                    className="h-px w-11 shrink-0 rounded-full"
                                    style={{ backgroundColor: translationPresentation.accentRuleColor }}
                                />
                                <div
                                    data-font-debug-target="visualizer-translation"
                                    className="leading-snug"
                                    style={{
                                        color: translationPresentation.color,
                                        fontSize: translationFontSize,
                                        fontFamily: resolveThemeTranslationFontStack(theme),
                                        fontWeight: translationPresentation.fontWeight,
                                        letterSpacing: translationPresentation.letterSpacing,
                                        textShadow: translationPresentation.textShadow,
                                    }}
                                >
                                    {translationText}
                                </div>
                            </div>
                        </motion.div>
                    ) : null}

                    {showUpcomingLines ? (
                        <div
                            className="absolute inset-x-0 bottom-0 px-4 text-center"
                            style={{ paddingBottom: bottomPadding }}
                        >
                            <div className="mx-auto flex w-full max-w-2xl flex-col justify-end gap-2">
                                {upcomingLines.map((line, index) => (
                                    <p
                                        key={`${line.startTime}-${index}`}
                                        data-testid={`visualizer-upcoming-line-${index}`}
                                        className="font-medium leading-snug transition-all duration-500"
                                        style={{
                                            color: upcomingPresentation.color,
                                            fontSize: upcomingFontSize,
                                            opacity: upcomingPresentation.lineOpacity * (index === 0 ? 1 : 0.82),
                                            textShadow: upcomingPresentation.textShadow,
                                        }}
                                    >
                                        {line.fullText}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ) : null}
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
