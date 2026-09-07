import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LyricData, LyricPresentation, Theme } from '../../types';
import { resolveLyricAlternateText, resolveSubtitleContentMode } from '../../utils/lyrics/alternateText';
import { isCaptionLyricPresentation } from '../../utils/lyrics/lyricPresentation';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import VisualizerCaptionOverlay from '../visualizer/VisualizerCaptionOverlay';

// src/components/obs/ObsBrowserSourceLyrics.tsx
// OBS lyric stack for songs; podcast captions use a bottom subtitle plate instead.

export type ObsBrowserSourceLyricsProps = {
    lyrics: LyricData | null;
    currentLineIndex: number;
    lyricPresentation?: LyricPresentation;
    visualizerTheme: Theme;
    lyricsFontScale: number;
    shouldHidePlayerTranslationSubtitle: boolean;
    isDaylight: boolean;
    navigateToHome: () => void;
};

export const ObsBrowserSourceLyrics: React.FC<ObsBrowserSourceLyricsProps> = ({
    lyrics,
    currentLineIndex,
    lyricPresentation,
    visualizerTheme,
    lyricsFontScale,
    shouldHidePlayerTranslationSubtitle,
    isDaylight,
    navigateToHome,
}) => {
    const { t } = useTranslation();
    const subtitleContentMode = useSettingsUiStore(state => state.subtitleContentMode);
    const showSubtitleTranslation = useSettingsUiStore(state => state.showSubtitleTranslation);
    const resolvedSubtitleMode = resolveSubtitleContentMode(subtitleContentMode, showSubtitleTranslation);

    const [effectiveIndex, setEffectiveIndex] = React.useState(() => Math.max(0, currentLineIndex));

    React.useEffect(() => {
        if (currentLineIndex !== -1) {
            setEffectiveIndex(currentLineIndex);
        } else if (effectiveIndex >= (lyrics?.lines.length || 0)) {
            // Edge case: song changed, effectiveIndex is out of bounds
            setEffectiveIndex(0);
        }
    }, [currentLineIndex, lyrics]);

    const isCaptions = isCaptionLyricPresentation(lyricPresentation ?? lyrics?.presentation);
    const captionLineIndex = currentLineIndex >= 0 ? currentLineIndex : effectiveIndex;

    return (
        <>
            <div className="absolute left-0 top-0 z-30 h-[120px] w-[120px] pointer-events-auto group">
                <button
                    type="button"
                    aria-label={t('ui.backToHome')}
                    onClick={(event) => {
                        event.stopPropagation();
                        navigateToHome();
                    }}
                    className="absolute top-6 left-6 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ease-out backdrop-blur-md bg-black/20 hover:bg-white/10 text-white/60 opacity-0 scale-[0.92] -translate-x-1.5 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 group-hover:pointer-events-auto"
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* 静态暗角 (Static Vignette) */}
            <div
                className={`absolute inset-0 z-0 pointer-events-none ${isDaylight ? 'opacity-30 mix-blend-multiply' : 'opacity-[0.65]'} bg-[radial-gradient(ellipse_at_center,transparent_0%,#000_100%)]`}
            />

            {isCaptions ? (
                <VisualizerCaptionOverlay
                    showText
                    lines={lyrics?.lines ?? []}
                    currentLineIndex={captionLineIndex}
                    isPlayerChromeHidden
                />
            ) : (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none px-12 pb-16 gap-8">
                    {[-1, 0, 1].map((offset) => {
                        const lineIndex = effectiveIndex + offset;
                        const line = lyrics?.lines[lineIndex];
                        if (!line) {
                            return <div key={`empty-${offset}`} className="h-20" />;
                        }
                        const isCurrent = offset === 0;
                        const subtitle = shouldHidePlayerTranslationSubtitle
                            ? null
                            : resolveLyricAlternateText(line, resolvedSubtitleMode);
                        return (
                            <div key={lineIndex} className="flex flex-col items-center w-full max-w-4xl">
                                {line.fullText && (
                                    <div
                                        className={`drop-shadow-md text-center tracking-[0.02em] ${isCurrent ? 'text-[2.5rem] font-bold opacity-100 leading-tight' : 'text-3xl font-semibold opacity-30'}`}
                                        style={{
                                            color: visualizerTheme.primaryColor,
                                            fontFamily: visualizerTheme.fontFamily || 'inherit',
                                            scale: lyricsFontScale,
                                        }}
                                    >
                                        {line.fullText}
                                    </div>
                                )}
                                {subtitle ? (
                                    <div
                                        className={`drop-shadow-sm text-center tracking-wide ${isCurrent ? 'text-2xl font-medium opacity-80 mt-3' : 'text-xl opacity-30 mt-2'}`}
                                        style={{
                                            color: visualizerTheme.secondaryColor,
                                            fontFamily: visualizerTheme.fontFamily || 'inherit',
                                            scale: lyricsFontScale,
                                        }}
                                    >
                                        {subtitle}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};
