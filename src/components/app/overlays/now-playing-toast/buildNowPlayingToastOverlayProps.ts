import type { SongResult } from '../../../../types';
import { getPlaybackSongKey } from '../../../../utils/appPlaybackGuards';
import type { StageTrackPillMode } from '../../../../utils/settings/stageTrackPillSettingsMath';
import type { NowPlayingToastSong } from '../NowPlayingToast';
import { buildNowPlayingToastSong } from './buildNowPlayingToastSong';
import { resolveNextUpTrack } from './resolveNextUpTrack';

// src/components/app/overlays/now-playing-toast/buildNowPlayingToastOverlayProps.ts

export type NowPlayingToastOverlayProps = {
    song: NowPlayingToastSong;
    trackKey: string;
    isDaylight: boolean;
    mode: StageTrackPillMode;
    timeoutSec: number;
    nextUp: NowPlayingToastSong | null;
    isNextUp: boolean;
    onActivate: () => void;
    activateLabel: string;
};

type BuildNowPlayingToastOverlayPropsParams = {
    currentSong: SongResult | null;
    playQueue: SongResult[];
    loopMode: 'off' | 'all' | 'one';
    isFmMode: boolean;
    isStageActive: boolean;
    isDaylight: boolean;
    currentView: 'home' | 'player';
    stageTrackPillMode: StageTrackPillMode;
    stageTrackPillTimeoutSec: number;
    stageTrackPillOnHome: boolean;
    countdownActive: boolean;
    coverUrl?: string | null;
    onOpenPlayer: () => void;
    onOpenSongCard: () => void;
    openPlayerLabel: string;
    openSongCardLabel: string;
};

/** Assembles now-playing card props, or null when the surface should not mount it. */
export const buildNowPlayingToastOverlayProps = ({
    currentSong,
    playQueue,
    loopMode,
    isFmMode,
    isStageActive,
    isDaylight,
    currentView,
    stageTrackPillMode,
    stageTrackPillTimeoutSec,
    stageTrackPillOnHome,
    countdownActive,
    coverUrl,
    onOpenPlayer,
    onOpenSongCard,
    openPlayerLabel,
    openSongCardLabel,
}: BuildNowPlayingToastOverlayPropsParams): NowPlayingToastOverlayProps | null => {
    const onScreen = stageTrackPillMode !== 'never'
        && (currentView === 'player' || (currentView === 'home' && stageTrackPillOnHome));
    if (!onScreen || !currentSong) return null;

    const song = buildNowPlayingToastSong(currentSong);
    if (!song) return null;
    if (!song.coverUrl && coverUrl) {
        song.coverUrl = coverUrl;
    }

    const nextUpTrack = resolveNextUpTrack({
        playQueue,
        song: currentSong,
        loopMode,
        isFmMode,
        isStageActive,
        fallbackToQueueHead: true,
    });
    const nextUp = nextUpTrack ? buildNowPlayingToastSong(nextUpTrack) : null;
    const isNextUp = nextUp !== null && countdownActive;

    return {
        song,
        trackKey: getPlaybackSongKey(currentSong),
        isDaylight,
        mode: stageTrackPillMode,
        timeoutSec: stageTrackPillTimeoutSec,
        nextUp,
        isNextUp,
        onActivate: currentView === 'home' ? onOpenPlayer : onOpenSongCard,
        activateLabel: currentView === 'home' ? openPlayerLabel : openSongCardLabel,
    };
};
