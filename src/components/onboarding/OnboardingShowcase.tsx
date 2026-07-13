import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Disc3, Mic2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    SHOWCASE_ARTISTS,
    SHOWCASE_LYRICS,
    SHOWCASE_TRACKS,
    getShowcaseTrack,
    type ShowcaseTrack,
} from './onboardingShowcaseCatalog';
import type { OnboardingStageStep } from './onboardingStageTheme';

// src/components/onboarding/OnboardingShowcase.tsx
// Interactive floating covers, lyrics, and artist cards for the premiere stage.

export type OnboardingShowcaseProps = {
    step: OnboardingStageStep;
    reducedMotion: boolean;
};

const COVER_LAYOUT = [
    { x: '58%', y: '14%', size: 148, rotate: -8, depth: 28 },
    { x: '74%', y: '38%', size: 112, rotate: 10, depth: 18 },
    { x: '52%', y: '48%', size: 96, rotate: 4, depth: 14 },
    { x: '78%', y: '68%', size: 88, rotate: -6, depth: 22 },
] as const;

const ARTIST_LAYOUT = [
    { x: '8%', y: '18%' },
    { x: '18%', y: '42%' },
    { x: '6%', y: '66%' },
] as const;

/** Pointer-reactive showcase reel of tracks, lyrics, and artists. */
export function OnboardingShowcase({ step, reducedMotion }: OnboardingShowcaseProps) {
    const { t } = useTranslation();
    const [trackIndex, setTrackIndex] = useState(0);
    const [lyricIndex, setLyricIndex] = useState(0);
    const [artistIndex, setArtistIndex] = useState(0);
    const [focusedTrackId, setFocusedTrackId] = useState<string | null>(null);

    const pointerX = useMotionValue(0);
    const pointerY = useMotionValue(0);
    const springX = useSpring(pointerX, { stiffness: 90, damping: 22, mass: 0.4 });
    const springY = useSpring(pointerY, { stiffness: 90, damping: 22, mass: 0.4 });

    useEffect(() => {
        if (reducedMotion) {
            return undefined;
        }
        const trackTimer = window.setInterval(() => {
            setTrackIndex(prev => (prev + 1) % SHOWCASE_TRACKS.length);
        }, 4200);
        const lyricTimer = window.setInterval(() => {
            setLyricIndex(prev => (prev + 1) % SHOWCASE_LYRICS.length);
        }, 2600);
        const artistTimer = window.setInterval(() => {
            setArtistIndex(prev => (prev + 1) % SHOWCASE_ARTISTS.length);
        }, 3600);
        return () => {
            window.clearInterval(trackTimer);
            window.clearInterval(lyricTimer);
            window.clearInterval(artistTimer);
        };
    }, [reducedMotion]);

    useEffect(() => {
        setFocusedTrackId(null);
    }, [step]);

    const activeTrack = focusedTrackId
        ? getShowcaseTrack(focusedTrackId)
        : SHOWCASE_TRACKS[trackIndex % SHOWCASE_TRACKS.length];
    const activeLyric = SHOWCASE_LYRICS[lyricIndex % SHOWCASE_LYRICS.length];
    const lyricTrack = getShowcaseTrack(activeLyric.trackId);
    const visibleArtists = [
        SHOWCASE_ARTISTS[artistIndex % SHOWCASE_ARTISTS.length],
        SHOWCASE_ARTISTS[(artistIndex + 1) % SHOWCASE_ARTISTS.length],
        SHOWCASE_ARTISTS[(artistIndex + 2) % SHOWCASE_ARTISTS.length],
    ];
    const coverTracks = [
        activeTrack,
        SHOWCASE_TRACKS[(trackIndex + 1) % SHOWCASE_TRACKS.length],
        SHOWCASE_TRACKS[(trackIndex + 2) % SHOWCASE_TRACKS.length],
        SHOWCASE_TRACKS[(trackIndex + 3) % SHOWCASE_TRACKS.length],
    ];

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (reducedMotion) {
            return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        pointerX.set(nx);
        pointerY.set(ny);
    };

    const onPointerLeave = () => {
        pointerX.set(0);
        pointerY.set(0);
    };

    return (
        <div
            className="pointer-events-auto absolute inset-0 z-[1] overflow-hidden"
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            aria-hidden="true"
        >
            <NowPlayingChip track={activeTrack} reducedMotion={reducedMotion} label={t('onboarding.nowPlaying', 'Now playing')} />

            {coverTracks.map((track, index) => {
                const layout = COVER_LAYOUT[index];
                if (!layout) {
                    return null;
                }
                return (
                    <FloatingCover
                        key={`${track.id}-${index}`}
                        track={track}
                        x={layout.x}
                        y={layout.y}
                        size={layout.size}
                        rotate={layout.rotate}
                        depth={layout.depth}
                        springX={springX}
                        springY={springY}
                        reducedMotion={reducedMotion}
                        active={track.id === activeTrack.id}
                        onSelect={() => setFocusedTrackId(track.id)}
                    />
                );
            })}

            {visibleArtists.map((artist, index) => {
                const layout = ARTIST_LAYOUT[index];
                if (!layout) {
                    return null;
                }
                return (
                    <ArtistCard
                        key={`${artist.id}-${index}`}
                        name={artist.name}
                        role={artist.role}
                        gradient={artist.gradient}
                        initial={artist.initial}
                        x={layout.x}
                        y={layout.y}
                        springX={springX}
                        springY={springY}
                        depth={12 + index * 6}
                        reducedMotion={reducedMotion}
                        featured={index === 0}
                    />
                );
            })}

            <LyricStage
                text={activeLyric.text}
                trackTitle={lyricTrack.title}
                artist={lyricTrack.artist}
                accent={lyricTrack.accent}
                reducedMotion={reducedMotion}
                step={step}
            />

            <HintRow
                reducedMotion={reducedMotion}
                hint={t('onboarding.showcaseHint', 'Hover · click a cover · feel the stage')}
            />
        </div>
    );
}

function NowPlayingChip({
    track,
    reducedMotion,
    label,
}: {
    track: ShowcaseTrack;
    reducedMotion: boolean;
    label: string;
}) {
    return (
        <motion.div
            className="absolute left-1/2 top-6 z-10 -translate-x-1/2"
            animate={reducedMotion ? undefined : { y: [0, -4, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
            <div
                className="flex items-center gap-3 rounded-full border border-white/12 px-3 py-2 backdrop-blur-xl"
                style={{
                    background: 'rgba(12,12,16,0.55)',
                    boxShadow: `0 0 40px ${track.accent}33`,
                }}
            >
                <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ background: track.gradient }}
                >
                    <Disc3 size={15} className={reducedMotion ? '' : 'animate-spin'} style={{ animationDuration: '6s' }} />
                </span>
                <div className="min-w-0 pr-1">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={track.id}
                            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                            className="truncate text-sm font-medium text-white/90"
                        >
                            {track.title}
                            <span className="text-white/45"> · {track.artist}</span>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

function FloatingCover({
    track,
    x,
    y,
    size,
    rotate,
    depth,
    springX,
    springY,
    reducedMotion,
    active,
    onSelect,
}: {
    track: ShowcaseTrack;
    x: string;
    y: string;
    size: number;
    rotate: number;
    depth: number;
    springX: ReturnType<typeof useSpring>;
    springY: ReturnType<typeof useSpring>;
    reducedMotion: boolean;
    active: boolean;
    onSelect: () => void;
}) {
    const tx = useTransform(springX, value => (reducedMotion ? 0 : value * depth));
    const ty = useTransform(springY, value => (reducedMotion ? 0 : value * depth * 0.7));
    const transform = useMotionTemplate`translate3d(calc(-50% + ${tx}px), calc(-50% + ${ty}px), 0) rotate(${rotate}deg)`;

    return (
        <motion.button
            type="button"
            onClick={onSelect}
            className="absolute text-left outline-none"
            style={{
                left: x,
                top: y,
                width: size,
                height: size,
                transform,
            }}
            whileHover={reducedMotion ? undefined : { scale: 1.05 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        >
            <motion.div
                className="h-full w-full overflow-hidden rounded-[22px] border border-white/15 shadow-2xl"
                style={{
                    background: track.gradient,
                    opacity: active ? 1 : 0.78,
                    boxShadow: active
                        ? `0 18px 50px rgba(0,0,0,0.45), 0 0 36px ${track.accent}55`
                        : '0 16px 40px rgba(0,0,0,0.35)',
                }}
                animate={reducedMotion ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 5 + depth * 0.08, repeat: Infinity, ease: 'easeInOut' }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35),transparent_45%)]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-3 pt-8">
                    <div className="truncate text-[11px] font-semibold text-white">{track.title}</div>
                    <div className="truncate text-[10px] text-white/65">{track.artist}</div>
                </div>
            </motion.div>
        </motion.button>
    );
}

function ArtistCard({
    name,
    role,
    gradient,
    initial,
    x,
    y,
    springX,
    springY,
    depth,
    reducedMotion,
    featured,
}: {
    name: string;
    role: string;
    gradient: string;
    initial: string;
    x: string;
    y: string;
    springX: ReturnType<typeof useSpring>;
    springY: ReturnType<typeof useSpring>;
    depth: number;
    reducedMotion: boolean;
    featured: boolean;
}) {
    const tx = useTransform(springX, value => (reducedMotion ? 0 : value * -depth));
    const ty = useTransform(springY, value => (reducedMotion ? 0 : value * -depth * 0.65));
    const transform = useMotionTemplate`translate3d(${tx}px, ${ty}px, 0)`;

    return (
        <motion.div
            className="absolute flex items-center gap-3 rounded-2xl border border-white/12 px-3 py-2.5 backdrop-blur-xl"
            style={{
                left: x,
                top: y,
                transform,
                background: featured ? 'rgba(255,255,255,0.08)' : 'rgba(12,12,16,0.45)',
                boxShadow: '0 12px 36px rgba(0,0,0,0.28)',
                minWidth: 168,
            }}
            animate={reducedMotion ? undefined : { opacity: featured ? 1 : 0.72 }}
        >
            <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: gradient }}
            >
                {initial}
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium text-white/90">
                    <Mic2 size={12} className="opacity-60" />
                    <span className="truncate">{name}</span>
                </div>
                <div className="truncate text-[11px] text-white/45">{role}</div>
            </div>
        </motion.div>
    );
}

function LyricStage({
    text,
    trackTitle,
    artist,
    accent,
    reducedMotion,
    step,
}: {
    text: string;
    trackTitle: string;
    artist: string;
    accent: string;
    reducedMotion: boolean;
    step: OnboardingStageStep;
}) {
    return (
        <div className="pointer-events-none absolute inset-x-0 top-[28%] flex justify-center px-6">
            <div className="max-w-2xl text-center">
                <div className="mb-3 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40">
                    <Sparkles size={12} style={{ color: accent }} />
                    {trackTitle} · {artist}
                </div>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={`${step}-${text}`}
                        initial={reducedMotion ? false : { opacity: 0, y: 16, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={reducedMotion ? undefined : { opacity: 0, y: -12, filter: 'blur(8px)' }}
                        transition={{ duration: 0.45 }}
                        className="text-[clamp(22px,4vw,40px)] font-semibold leading-tight tracking-tight text-white"
                        style={{ textShadow: `0 0 42px ${accent}66, 0 8px 30px rgba(0,0,0,0.45)` }}
                    >
                        {text}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
}

function HintRow({ reducedMotion, hint }: { reducedMotion: boolean; hint: string }) {
    return (
        <motion.div
            className="absolute bottom-[38%] right-8 hidden rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] text-white/45 backdrop-blur-md md:block"
            animate={reducedMotion ? undefined : { opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 3.2, repeat: Infinity }}
        >
            {hint}
        </motion.div>
    );
}
