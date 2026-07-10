import React, { forwardRef, useState } from 'react';
import { AnimatePresence, motion, MotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { AudioBands, Theme, type UrlBackgroundItem } from '../../types';
import { resolveThemeFontStack } from '../../utils/fontStacks';
import { type VisualizerSharedProps } from './definition';
import FluidBackground from './FluidBackground';
import GeometricInteractiveBackground from './geometric/GeometricInteractiveBackground';
import MonetBackgroundLayer from './backgrounds/MonetBackgroundLayer';
import UrlBackgroundLayer from './backgrounds/UrlBackgroundLayer';
import SoraBackground from './SoraBackground';
import LyricRhythmStage from './shared/LyricRhythmStage';
import { shouldEnableInteractive3dWebGlLyrics } from './resolveInteractive3dFumeLayering';

// Shared outer shell for all visualizers.
type VisualizerShellSharedProps = Pick<
    VisualizerSharedProps,
    | 'coverUrl'
    | 'isDaylight'
    | 'useCoverColorBg'
    | 'seed'
    | 'backgroundOpacity'
    | 'visualizerOpacity'
    | 'transparentBackground'
    | 'disableGeometricBackground'
    | 'disableVignette'
    | 'resolvedVisualizerBackgroundMode'
    | 'monetBackgroundTuning'
    | 'interactive3dSceneTuning'
    | 'monetBackgroundImage'
    | 'urlBackgroundList'
    | 'urlBackgroundSelectedId'
    | 'beatPulse'
    | 'cinemaScale'
    | 'atmosphereEnergy'
    | 'atmosphereGroove'
    | 'cameraPunch'
    | 'sceneParallaxX'
    | 'sceneParallaxY'
    | 'sceneRoll'
    | 'enableAtmosphereLayer'
    | 'enableBeatBursts'
    | 'staticMode'
    | 'paused'
    | 'onBack'
    | 'playlistShelfItems'
    | 'visualizerMode'
    | 'mineradioStageActive'
    | 'currentTime'
    | 'lines'
    | 'showText'
    | 'audioPlaying'
>;

interface VisualizerShellProps {
    theme: Theme;
    audioPower: MotionValue<number>;
    audioBands: AudioBands;
    sharedProps?: VisualizerShellSharedProps;
    coverUrl?: string | null;
    useCoverColorBg?: boolean;
    seed?: string | number;
    backgroundOpacity?: number;
    visualizerOpacity?: number;
    transparentBackground?: boolean;
    disableVignette?: boolean;
    staticMode?: boolean;
    disableGeometricBackground?: boolean;
    paused?: boolean;
    onBack?: () => void;
    urlBackgroundList?: UrlBackgroundItem[];
    urlBackgroundSelectedId?: string | null;
    playlistShelfItems?: import('./geometric/shelf/shelfTypes').PlaylistShelfItem[];
    children: React.ReactNode;
    className?: string;
}

const VisualizerShell = forwardRef<HTMLDivElement, VisualizerShellProps>(({
    theme,
    audioPower,
    audioBands,
    sharedProps,
    coverUrl,
    useCoverColorBg = false,
    seed,
    backgroundOpacity = 0.75,
    visualizerOpacity = 1,
    transparentBackground = false,
    disableVignette = false,
    staticMode = false,
    disableGeometricBackground = false,
    paused = false,
    onBack,
    urlBackgroundList,
    urlBackgroundSelectedId,
    playlistShelfItems,
    children,
    className = '',
}, ref) => {
    const { t } = useTranslation();
    const [showBackButton, setShowBackButton] = useState(false);
    const resolvedCoverUrl = sharedProps?.coverUrl ?? coverUrl;
    const resolvedIsDaylight = sharedProps?.isDaylight ?? true;
    const resolvedUseCoverColorBg = sharedProps?.useCoverColorBg ?? useCoverColorBg;
    const resolvedSeed = sharedProps?.seed ?? seed;
    const resolvedBackgroundOpacity = sharedProps?.backgroundOpacity ?? backgroundOpacity;
    const resolvedVisualizerOpacity = sharedProps?.visualizerOpacity ?? visualizerOpacity;
    const resolvedTransparentBackground = sharedProps?.transparentBackground ?? transparentBackground;
    const resolvedDisableGeometricBackground = sharedProps?.disableGeometricBackground ?? disableGeometricBackground;
    const resolvedDisableVignette = sharedProps?.disableVignette ?? disableVignette;
    const resolvedBackgroundMode = sharedProps?.resolvedVisualizerBackgroundMode ?? 'interactive3d';
    const resolvedMonetBackgroundTuning = sharedProps?.monetBackgroundTuning;
    const resolvedInteractive3dSceneTuning = sharedProps?.interactive3dSceneTuning;
    const resolvedMonetBackgroundImage = sharedProps?.monetBackgroundImage;
    const resolvedUrlBackgroundList = sharedProps?.urlBackgroundList ?? urlBackgroundList;
    const resolvedUrlBackgroundSelectedId = sharedProps?.urlBackgroundSelectedId ?? urlBackgroundSelectedId;
    const resolvedPlaylistShelfItems = sharedProps?.playlistShelfItems ?? playlistShelfItems ?? [];
    const resolvedBeatPulse = sharedProps?.beatPulse;
    const resolvedCinemaScale = sharedProps?.cinemaScale;
    const resolvedAtmosphereEnergy = sharedProps?.atmosphereEnergy;
    const resolvedCameraPunch = sharedProps?.cameraPunch;
    const resolvedSceneParallaxX = sharedProps?.sceneParallaxX;
    const resolvedSceneParallaxY = sharedProps?.sceneParallaxY;
    const resolvedSceneRoll = sharedProps?.sceneRoll;
    const resolvedEnableBeatBursts = sharedProps?.enableBeatBursts ?? sharedProps?.enableAtmosphereLayer ?? true;
    const resolvedStaticMode = sharedProps?.staticMode ?? staticMode;
    const resolvedPaused = sharedProps?.paused ?? paused;
    const resolvedOnBack = sharedProps?.onBack ?? onBack;
    const resolvedVisualizerMode = sharedProps?.visualizerMode;
    const resolvedCurrentTime = sharedProps?.currentTime;
    const resolvedLines = sharedProps?.lines ?? [];
    const resolvedShowText = sharedProps?.showText ?? true;
    const resolvedAudioPlaying = sharedProps?.audioPlaying ?? !resolvedPaused;
    const shouldRenderCommonBackground = !resolvedTransparentBackground && resolvedBackgroundMode === 'common';
    const shouldRenderInteractive3dBackground = !resolvedTransparentBackground
        && resolvedBackgroundMode === 'interactive3d'
        && !resolvedStaticMode
        && !resolvedDisableGeometricBackground;
    const shouldRenderMonetBackground = !resolvedTransparentBackground && resolvedBackgroundMode === 'monet';
    const shouldRenderUrlBackground = !resolvedTransparentBackground && resolvedBackgroundMode === 'url';
    const shouldRenderSoraBackground = !resolvedTransparentBackground && resolvedBackgroundMode === 'sora';

    const fontClassName = theme.fontStyle === 'mono'
        ? 'font-mono'
        : theme.fontStyle === 'serif'
            ? 'font-serif'
            : 'font-sans';

    return (
        <div
            ref={ref}
            className={`w-full h-full flex flex-col items-center justify-center overflow-hidden relative ${fontClassName} transition-colors duration-1000 ${className}`.trim()}
            style={{
                backgroundColor: 'transparent',
                fontFamily: resolveThemeFontStack(theme),
                opacity: resolvedVisualizerOpacity,
            }}
            onMouseMove={(event) => {
                const nearBackArea = event.clientX <= 120 && event.clientY <= 120;
                if (nearBackArea !== showBackButton) {
                    setShowBackButton(nearBackArea);
                }
            }}
            onMouseLeave={() => {
                if (showBackButton) {
                    setShowBackButton(false);
                }
            }}
        >
            {resolvedOnBack && (
                <motion.button
                    type="button"
                    aria-label={t('ui.backToHome')}
                    initial={false}
                    animate={{
                        opacity: showBackButton ? 1 : 0,
                        scale: showBackButton ? 1 : 0.92,
                        x: showBackButton ? 0 : -6,
                    }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onClick={(event) => {
                        event.stopPropagation();
                        resolvedOnBack();
                    }}
                    className="absolute top-6 left-6 z-30 h-10 w-10 rounded-full flex items-center justify-center transition-colors backdrop-blur-md bg-black/20 hover:bg-white/10 text-white/60 pointer-events-auto"
                    style={{ pointerEvents: showBackButton ? 'auto' : 'none' }}
                >
                    <ChevronLeft size={20} />
                </motion.button>
            )}

            <AnimatePresence>
                {shouldRenderCommonBackground && resolvedUseCoverColorBg && (
                    <motion.div
                        key="fluid-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 z-0"
                    >
                        <FluidBackground
                            coverUrl={resolvedCoverUrl}
                            theme={theme}
                            cinemaScale={resolvedCinemaScale}
                            atmosphereEnergy={resolvedAtmosphereEnergy}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {shouldRenderCommonBackground && (
                <div
                    className="absolute inset-0 z-0 transition-all duration-1000"
                    style={{
                        backgroundColor: theme.backgroundColor,
                        opacity: resolvedUseCoverColorBg ? resolvedBackgroundOpacity : 1,
                    }}
                />
            )}

            {shouldRenderInteractive3dBackground && (
                <>
                    <div
                        className="absolute inset-0 z-0 transition-all duration-1000"
                        style={{ backgroundColor: '#071922', opacity: 1 }}
                    />
                    <div className="absolute inset-0 z-0 isolate pointer-events-auto">
                        <GeometricInteractiveBackground
                            theme={theme}
                            audioPower={audioPower}
                            audioBands={audioBands}
                            beatPulse={resolvedBeatPulse}
                            cinemaScale={resolvedCinemaScale}
                            cameraPunch={resolvedCameraPunch}
                            sceneParallaxX={resolvedSceneParallaxX}
                            sceneParallaxY={resolvedSceneParallaxY}
                            sceneRoll={resolvedSceneRoll}
                            atmosphereEnergy={resolvedAtmosphereEnergy}
                            enableBeatBursts={resolvedEnableBeatBursts}
                            interactive3dSceneTuning={resolvedInteractive3dSceneTuning}
                            seed={resolvedSeed}
                            disableVignette={resolvedDisableVignette}
                            paused={resolvedPaused}
                            coverUrl={resolvedCoverUrl}
                            playlistShelfItems={resolvedPlaylistShelfItems}
                            visualizerMode={resolvedVisualizerMode}
                            currentTime={resolvedCurrentTime}
                            lines={resolvedLines}
                            showLyrics={shouldEnableInteractive3dWebGlLyrics(resolvedBackgroundMode) && resolvedShowText}
                            playing={resolvedAudioPlaying}
                        />
                    </div>
                </>
            )}

            {shouldRenderMonetBackground && (
                <MonetBackgroundLayer
                    coverUrl={resolvedCoverUrl}
                    monetBackgroundImage={resolvedMonetBackgroundImage}
                    theme={theme}
                    isDaylight={resolvedIsDaylight}
                    tuning={resolvedMonetBackgroundTuning}
                    transparentBackground={resolvedTransparentBackground}
                />
            )}

            {shouldRenderUrlBackground && (
                <UrlBackgroundLayer
                    urlBackgroundList={resolvedUrlBackgroundList}
                    urlBackgroundSelectedId={resolvedUrlBackgroundSelectedId}
                />
            )}

            {shouldRenderSoraBackground && (
                <div className="absolute inset-0 z-0">
                    <SoraBackground
                        theme={theme}
                        isDaylight={resolvedIsDaylight}
                        paused={resolvedPaused}
                    />
                </div>
            )}

            <div className="relative z-30 isolate w-full h-full pointer-events-none">
                {shouldRenderInteractive3dBackground ? (
                    <LyricRhythmStage
                        audioPower={audioPower}
                        beatPulse={resolvedBeatPulse}
                        cameraPunch={resolvedCameraPunch}
                        cinemaScale={resolvedCinemaScale}
                        atmosphereEnergy={resolvedAtmosphereEnergy}
                        scaleMultiplier={theme.lyricRhythmScaleMultiplier}
                        glowColor={theme.lyricGlowUsesAccent ? theme.accentColor : null}
                        className="w-full h-full"
                    >
                        {children}
                    </LyricRhythmStage>
                ) : children}
            </div>
        </div>
    );
});

VisualizerShell.displayName = 'VisualizerShell';

export default VisualizerShell;
