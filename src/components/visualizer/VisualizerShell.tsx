import React, { forwardRef, useMemo } from 'react';
import { AnimatePresence, motion, MotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { AudioBands, Theme, type UrlBackgroundItem } from '../../types';
import { resolveThemeFontStack } from '../../utils/fontStacks';
import { resolveSpeakerParticleYield } from '../../utils/visualizer/speakerStageShellMath';
import { resolveVisualizerBackgroundMode, useSettingsUiStore } from '../../stores/useSettingsUiStore';
import { usePerformanceMonitorStore } from '../../stores/usePerformanceMonitorStore';
import { type VisualizerSharedProps } from './definition';
import FluidBackground from './FluidBackground';
import LatentBackground from './backgrounds/latent/LatentBackground';
import NomandBackgroundLayer from './backgrounds/nomand/NomandBackgroundLayer';
import MonetBackgroundLayer from './backgrounds/MonetBackgroundLayer';
import TurntableBackgroundLayer from './backgrounds/turntable/TurntableBackgroundLayer';
import UrlBackgroundLayer from './backgrounds/UrlBackgroundLayer';
import SoraBackground from './SoraBackground';
import SpeakerStageShell from './speaker/SpeakerStageShell';

// Shared outer shell for all visualizers.
type VisualizerShellSharedProps = Pick<
    VisualizerSharedProps,
    | 'coverUrl'
    | 'shellCanvasBackground'
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
    | 'latentBackgroundTuning'
    | 'nomandBackgroundTuning'
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
    | 'particlesYielded'
    | 'onBack'
    | 'isPlayerChromeHidden'
    | 'playlistShelfItems'
    | 'visualizerMode'
    | 'mineradioStageActive'
    | 'currentTime'
    | 'lines'
    | 'showText'
    | 'audioPlaying'
    | 'immersiveLyrics'
    | 'isPreviewMode'
>;

interface VisualizerShellProps {
    theme: Theme;
    audioPower: MotionValue<number>;
    audioBands: AudioBands;
    sharedProps?: VisualizerShellSharedProps;
    coverUrl?: string | null;
    shellCanvasBackground?: string;
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
    /** When false, skip cover/3D/Monet background layers (Still and other low-power modes). */
    renderBackground?: boolean;
}

const VisualizerShell = forwardRef<HTMLDivElement, VisualizerShellProps>(({
    theme,
    audioPower,
    audioBands,
    sharedProps,
    coverUrl,
    shellCanvasBackground,
    useCoverColorBg = false,
    seed: _seed,
    backgroundOpacity = 0.75,
    visualizerOpacity = 1,
    transparentBackground = false,
    disableVignette: _disableVignette = false,
    staticMode = false,
    disableGeometricBackground: _disableGeometricBackground = false,
    paused = false,
    onBack,
    urlBackgroundList,
    urlBackgroundSelectedId,
    playlistShelfItems: _playlistShelfItems,
    children,
    className = '',
    renderBackground = true,
}, ref) => {
    const { t } = useTranslation();
    const playbackPresentation = useSettingsUiStore(state => state.playbackPresentation);
    const speakerActive = playbackPresentation === 'speaker';
    const performanceMode = usePerformanceMonitorStore(state => state.mode);
    const isElectronRenderer = typeof window !== 'undefined' && Boolean(window.electron);
    const reducedMotion = typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resolvedCoverUrl = sharedProps?.coverUrl ?? coverUrl;
    const resolvedShellCanvasBackground = sharedProps?.shellCanvasBackground ?? shellCanvasBackground;
    const resolvedIsDaylight = sharedProps?.isDaylight ?? true;
    const resolvedUseCoverColorBg = sharedProps?.useCoverColorBg ?? useCoverColorBg;
    const resolvedBackgroundOpacity = sharedProps?.backgroundOpacity ?? backgroundOpacity;
    const resolvedVisualizerOpacity = sharedProps?.visualizerOpacity ?? visualizerOpacity;
    const resolvedTransparentBackground = sharedProps?.transparentBackground ?? transparentBackground;
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(
        sharedProps?.resolvedVisualizerBackgroundMode,
    );
    const resolvedMonetBackgroundTuning = sharedProps?.monetBackgroundTuning;
    const resolvedLatentBackgroundTuning = sharedProps?.latentBackgroundTuning;
    const resolvedNomandBackgroundTuning = sharedProps?.nomandBackgroundTuning;
    const baseInteractive3dSceneTuning = sharedProps?.interactive3dSceneTuning;
    const resolvedInteractive3dSceneTuning = useMemo(() => {
        if (!baseInteractive3dSceneTuning) return baseInteractive3dSceneTuning;
        const yieldTuning = resolveSpeakerParticleYield({
            speakerActive,
            bloomStrength: baseInteractive3dSceneTuning.bloomStrength,
            rhythmIntensity: baseInteractive3dSceneTuning.rhythmIntensity,
        });
        if (!speakerActive) return baseInteractive3dSceneTuning;
        return {
            ...baseInteractive3dSceneTuning,
            bloomStrength: yieldTuning.bloomStrength,
            rhythmIntensity: yieldTuning.rhythmIntensity,
        };
    }, [baseInteractive3dSceneTuning, speakerActive]);
    const resolvedIsPreviewMode = sharedProps?.isPreviewMode ?? false;
    const resolvedMonetBackgroundImage = sharedProps?.monetBackgroundImage;
    const resolvedUrlBackgroundList = sharedProps?.urlBackgroundList ?? urlBackgroundList;
    const resolvedUrlBackgroundSelectedId = sharedProps?.urlBackgroundSelectedId ?? urlBackgroundSelectedId;
    const resolvedCinemaScale = sharedProps?.cinemaScale;
    const resolvedAtmosphereEnergy = sharedProps?.atmosphereEnergy;
    const resolvedStaticMode = sharedProps?.staticMode ?? staticMode;
    const resolvedPaused = sharedProps?.paused ?? paused;
    const resolvedOnBack = sharedProps?.onBack ?? onBack;
    const hideBackButton = Boolean(sharedProps?.isPlayerChromeHidden);
    const resolvedCurrentTime = sharedProps?.currentTime;
    const resolvedAudioPlaying = sharedProps?.audioPlaying ?? !resolvedPaused;
    const shouldRenderCommonBackground = renderBackground && !resolvedTransparentBackground && resolvedBackgroundMode === 'common';
    const shouldRenderMonetBackground = renderBackground && !resolvedTransparentBackground && resolvedBackgroundMode === 'monet';
    const shouldRenderLatentBackground = renderBackground && !resolvedTransparentBackground && resolvedBackgroundMode === 'latent';
    const shouldRenderNomandBackground = renderBackground && !resolvedTransparentBackground && resolvedBackgroundMode === 'nomand';
    const shouldRenderUrlBackground = renderBackground && !resolvedTransparentBackground && resolvedBackgroundMode === 'url';
    const shouldRenderSoraBackground = renderBackground && !resolvedTransparentBackground && resolvedBackgroundMode === 'sora';
    const shouldRenderTurntableBackground = renderBackground && !resolvedTransparentBackground && resolvedBackgroundMode === 'turntable';
    // Turntable floats on the same stage wash as Common (no wooden table fill).
    const shouldRenderStageWash = shouldRenderCommonBackground || shouldRenderTurntableBackground;
    const latentStaticMode = resolvedStaticMode
        || Boolean(resolvedLatentBackgroundTuning?.dynamicOnlyInPlayer && resolvedIsPreviewMode);

    const fontClassName = theme.fontStyle === 'mono'
        ? 'font-mono'
        : theme.fontStyle === 'serif'
            ? 'font-serif'
            : 'font-sans';

    return (
        <div
            ref={ref}
            data-visualizer-shell="true"
            className={`w-full h-full flex flex-col items-center justify-center overflow-hidden relative ${fontClassName} transition-colors duration-1000 ${className}`.trim()}
            style={{
                backgroundColor: 'transparent',
                fontFamily: resolveThemeFontStack(theme),
                opacity: resolvedVisualizerOpacity,
            }}
        >
            {resolvedOnBack && !hideBackButton && (
                <button
                    type="button"
                    aria-label={t('ui.backToHome')}
                    onClick={(event) => {
                        event.stopPropagation();
                        resolvedOnBack();
                    }}
                    className="absolute top-5 left-5 z-40 h-10 w-10 rounded-full flex items-center justify-center transition-colors backdrop-blur-md bg-black/45 hover:bg-black/60 text-white/90 pointer-events-auto border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                >
                    <ChevronLeft size={20} />
                </button>
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

            {shouldRenderStageWash && (
                <div
                    className="absolute inset-0 z-0 transition-all duration-1000"
                    style={{
                        backgroundColor: theme.backgroundColor,
                        backgroundImage: resolvedShellCanvasBackground,
                        opacity: shouldRenderCommonBackground && resolvedUseCoverColorBg
                            ? resolvedBackgroundOpacity
                            : 1,
                    }}
                />
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

            {shouldRenderLatentBackground && (
                <LatentBackground
                    theme={theme}
                    coverUrl={resolvedCoverUrl}
                    audioPower={audioPower}
                    audioBands={audioBands}
                    staticMode={latentStaticMode}
                    paused={resolvedPaused}
                    tuning={resolvedLatentBackgroundTuning}
                />
            )}

            {shouldRenderNomandBackground && (
                <NomandBackgroundLayer
                    coverUrl={resolvedCoverUrl}
                    monetBackgroundImage={resolvedMonetBackgroundImage}
                    theme={theme}
                    isDaylight={resolvedIsDaylight}
                    tuning={resolvedNomandBackgroundTuning}
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

            {shouldRenderTurntableBackground && (
                <div className="absolute inset-0 z-[1]">
                    <TurntableBackgroundLayer
                        coverUrl={resolvedCoverUrl}
                        paused={resolvedPaused}
                        playing={resolvedAudioPlaying}
                        currentTime={resolvedCurrentTime}
                    />
                </div>
            )}

            <SpeakerStageShell
                theme={theme}
                speakerActive={speakerActive}
                isElectron={isElectronRenderer}
                qualityTier={performanceMode === 'lite' ? 'lite' : (resolvedInteractive3dSceneTuning?.qualityTier ?? 'auto')}
                reducedMotion={reducedMotion}
            />

            <div
                className="relative z-30 isolate w-full h-full overflow-hidden pointer-events-none"
                data-lyric-stage={shouldRenderSoraBackground ? 'sora' : undefined}
                data-speaker-stage={speakerActive ? 'true' : undefined}
                style={shouldRenderSoraBackground ? {
                    // Extra lift so DOM lyrics read as the hero of the starfield stage.
                    filter: 'drop-shadow(0 0 18px rgba(0,0,0,0.55)) drop-shadow(0 2px 10px rgba(0,0,0,0.4))',
                } : speakerActive ? {
                    filter: 'drop-shadow(0 0 28px rgba(0,0,0,0.62)) drop-shadow(0 8px 22px rgba(0,0,0,0.4))',
                } : undefined}
            >
                {children}
            </div>
        </div>
    );
});

VisualizerShell.displayName = 'VisualizerShell';

export default VisualizerShell;
