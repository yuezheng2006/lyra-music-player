import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import VisualizerRenderer from '../visualizer/VisualizerRenderer';
import { PlayerState } from '../../types';
import type { ObsBrowserSourceAudio, ObsBrowserSourceClock, ObsBrowserSourceConfig } from '../../types/obsBrowserSource';
import { findLatestActiveLineIndex } from '../../utils/appPlaybackHelpers';
import { resolveLyricPresentation } from '../../utils/lyrics/lyricPresentation';
import { resolveObsBrowserSourceClockTime } from '../../utils/obsBrowserSource';
import { parseObsOverlayQuery } from '../../utils/obs/parseObsOverlayQuery';
import { applyObsOverlayPresentation } from '../../utils/obs/applyObsOverlayPresentation';
import { readObsCustomCssAssets } from '../../utils/obs/obsCustomCssMath';

// src/components/obs/ObsBrowserSourceApp.tsx
// Read-only OBS browser source renderer driven by Lyra's main playback clock.

const EMPTY_SPECTRUM = new Uint8Array(0);

const buildEventSourceUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') ?? '';
    const devPort = params.get('obsPort');
    const baseUrl = devPort ? `http://127.0.0.1:${devPort}` : window.location.origin;
    const url = new URL('/obs/events', baseUrl);
    url.searchParams.set('token', token);
    return url.toString();
};

const ObsBrowserSourceApp: React.FC = () => {
    const { t } = useTranslation();
    const [config, setConfig] = useState<ObsBrowserSourceConfig | null>(null);
    const [connected, setConnected] = useState(false);
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [playbackState, setPlaybackState] = useState<PlayerState>(PlayerState.IDLE);
    const [obsScale, setObsScale] = useState(1);
    const [obsDimensions, setObsDimensions] = useState({ width: '100vw', height: '100vh' });
    const currentLineIndexRef = useRef(-1);
    const clockRef = useRef<ObsBrowserSourceClock | null>(null);
    const configRef = useRef<ObsBrowserSourceConfig | null>(null);
    const overlayQuery = useMemo(() => parseObsOverlayQuery(window.location.search), []);
    const cssAssets = useMemo(() => readObsCustomCssAssets(), []);
    const presentedConfig = useMemo(
        () => (config ? applyObsOverlayPresentation(config, overlayQuery, cssAssets) : null),
        [config, cssAssets, overlayQuery],
    );
    const currentTime = useMotionValue(0);
    const audioPower = useMotionValue(0);
    const bass = useMotionValue(0);
    const lowMid = useMotionValue(0);
    const mid = useMotionValue(0);
    const vocal = useMotionValue(0);
    const treble = useMotionValue(0);
    const spectrum = useMotionValue(EMPTY_SPECTRUM);
    const audioBands = useMemo(() => ({
        bass,
        lowMid,
        mid,
        vocal,
        treble,
        spectrum,
    }), [bass, lowMid, mid, spectrum, treble, vocal]);

    useEffect(() => {
        document.body.style.backgroundColor = 'transparent';
        document.documentElement.style.backgroundColor = 'transparent';
        document.body.style.overflow = 'hidden';
        document.title = 'Lyra OBS';
    }, []);

    useEffect(() => {
        configRef.current = presentedConfig;
    }, [presentedConfig]);

    useEffect(() => {
        let isHandlingResize = false;
        
        const handleResize = () => {
            if (isHandlingResize) return;
            isHandlingResize = true;
            
            try {
                const isPortrait = window.innerHeight > window.innerWidth;
                const baseWidth = isPortrait ? 1080 : 1920;
                
                // Read the physical dimensions from documentElement to avoid infinite loops when mocking innerWidth
                const realWidth = window.document.documentElement.clientWidth;
                const realHeight = window.document.documentElement.clientHeight;
                
                const scale = Math.max(1, realWidth / baseWidth);
                setObsScale(scale);
                setObsDimensions({
                    width: `${realWidth / scale}px`,
                    height: `${realHeight / scale}px`
                });

                // Globally override devicePixelRatio and window size for the OBS browser source.
                // This forces all child components to naturally render and layout exactly
                // as if they were in a 1920x1080 screen, while natively maintaining 4K text rasterization.
                try {
                    Object.defineProperty(window, 'devicePixelRatio', { get: () => scale, configurable: true });
                    Object.defineProperty(window, 'innerWidth', { get: () => realWidth / scale, configurable: true });
                    Object.defineProperty(window, 'innerHeight', { get: () => realHeight / scale, configurable: true });
                } catch {
                    // Ignore
                }
                
                // Force an event so any visualizer that caches window dimensions updates to the mocked size
                if (scale > 1.0) {
                    window.dispatchEvent(new Event('resize'));
                }
            } finally {
                isHandlingResize = false;
            }
        };
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const eventSource = new EventSource(buildEventSourceUrl());

        eventSource.onopen = () => setConnected(true);
        eventSource.onerror = () => setConnected(false);
        eventSource.addEventListener('config', event => {
            const nextConfig = JSON.parse((event as MessageEvent).data) as ObsBrowserSourceConfig;
            setConfig(nextConfig);
        });
        eventSource.addEventListener('clock', event => {
            const nextClock = JSON.parse((event as MessageEvent).data) as ObsBrowserSourceClock;
            clockRef.current = nextClock;
            setPlaybackState(prev => (
                prev === nextClock.playerState ? prev : nextClock.playerState
            ));
        });
        eventSource.addEventListener('audio', event => {
            const nextAudio = JSON.parse((event as MessageEvent).data) as ObsBrowserSourceAudio;
            audioPower.set(nextAudio.audioPower);
            bass.set(nextAudio.bands.bass);
            lowMid.set(nextAudio.bands.lowMid);
            mid.set(nextAudio.bands.mid);
            vocal.set(nextAudio.bands.vocal);
            treble.set(nextAudio.bands.treble);
            spectrum.set(new Uint8Array(nextAudio.spectrum));
        });

        return () => {
            eventSource.close();
        };
    }, [audioPower, bass, lowMid, mid, spectrum, treble, vocal]);

    useEffect(() => {
        let frameId = 0;
        const tick = () => {
            const lyricTime = resolveObsBrowserSourceClockTime(clockRef.current) - overlayQuery.offsetMs / 1000;
            
            currentTime.set(lyricTime);

            const lines = configRef.current?.lyrics?.lines ?? [];
            const nextLineIndex = lines.length > 0 ? findLatestActiveLineIndex(lines, lyricTime) : -1;
            if (nextLineIndex !== currentLineIndexRef.current) {
                currentLineIndexRef.current = nextLineIndex;
                setCurrentLineIndex(nextLineIndex);
            }

            frameId = window.requestAnimationFrame(tick);
        };

        frameId = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(frameId);
    }, [currentTime, overlayQuery.offsetMs]);

    if (!presentedConfig) {
        return (
            <div className="h-screen w-screen bg-transparent grid place-items-center text-white/70 text-sm">
                {connected ? t('obs.waitingForPlayback', 'Waiting for Lyra playback') : t('obs.connecting', 'Connecting to Lyra')}
            </div>
        );
    }

    return (
        <div
            className="overflow-hidden"
            style={{
                width: obsDimensions.width,
                height: obsDimensions.height,
                zoom: obsScale,
                backgroundColor: presentedConfig.transparentBackground ? 'transparent' : presentedConfig.theme.backgroundColor,
                color: presentedConfig.theme.primaryColor,
            }}
        >
            <VisualizerRenderer
                mode={presentedConfig.visualizerMode}
                currentTime={currentTime}
                currentLineIndex={currentLineIndex}
                lines={presentedConfig.lyrics?.lines ?? []}
                lyricPresentation={resolveLyricPresentation(presentedConfig.lyrics, presentedConfig.song)}
                theme={presentedConfig.theme}
                isDaylight={presentedConfig.isDaylight}
                audioPower={audioPower}
                audioBands={audioBands}
                songTitle={presentedConfig.song?.name}
                songArtist={presentedConfig.songArtist}
                songAlbum={presentedConfig.songAlbum}
                coverUrl={presentedConfig.coverUrl}
                showText={true}
                useCoverColorBg={presentedConfig.useCoverColorBg}
                seed={presentedConfig.seed}
                staticMode={presentedConfig.staticMode}
                paused={playbackState !== PlayerState.PLAYING}
                backgroundOpacity={presentedConfig.backgroundOpacity}
                visualizerOpacity={presentedConfig.visualizerOpacity}
                transparentBackground={presentedConfig.transparentBackground}
                disableGeometricBackground={presentedConfig.disableGeometricBackground}
                disableVignette={presentedConfig.disableVignette}
                visualizerBackgroundMode={presentedConfig.visualizerBackgroundMode}
                lyricsFontScale={presentedConfig.lyricsFontScale}
                subtitleOverlayOpacity={presentedConfig.subtitleOverlayOpacity}
                isPlayerChromeHidden={true}
                hideTranslationSubtitle={presentedConfig.hideTranslationSubtitle}
                showSubtitleTranslation={presentedConfig.showSubtitleTranslation ?? true}
                classicTuning={presentedConfig.classicTuning}
                cadenzaTuning={presentedConfig.cadenzaTuning}
                partitaTuning={presentedConfig.partitaTuning}
                fumeTuning={presentedConfig.fumeTuning}
                claddaghTuning={presentedConfig.claddaghTuning}
                cappellaTuning={presentedConfig.cappellaTuning}
                cappellaCustomEmojiImages={presentedConfig.cappellaCustomEmojiImages}
                cappellaCustomAvatarImages={presentedConfig.cappellaCustomAvatarImages}
                tiltTuning={presentedConfig.tiltTuning}
                monetBackgroundTuning={presentedConfig.monetBackgroundTuning}
                interactive3dSceneTuning={presentedConfig.interactive3dSceneTuning}
                monetTuning={presentedConfig.monetTuning}
                monetBackgroundImage={presentedConfig.monetBackgroundImage}
                monetPortraitImage={presentedConfig.monetPortraitImage}
                urlBackgroundList={presentedConfig.urlBackgroundList}
                urlBackgroundSelectedId={presentedConfig.urlBackgroundSelectedId}
            />
        </div>
    );
};

export default ObsBrowserSourceApp;
