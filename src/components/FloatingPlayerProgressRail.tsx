import React from 'react';
import { useTranslation } from 'react-i18next';
import type { MotionValue } from 'framer-motion';
import type { SongResult } from '../types';
import ProgressBar from './ProgressBar';
import { FLOATING_PLAYER_PROGRESS_INSET_PX } from './floatingPlayerDockLayout';
import { formatPlaybackNeighborLabel, resolvePlaybackNeighbors } from '../utils/playback/playbackNeighbors';

// src/components/FloatingPlayerProgressRail.tsx
// Dock-top edge scrubber with previous / next neighbor preview.

type FloatingPlayerProgressRailProps = {
    currentTime: MotionValue<number>;
    duration: number;
    onSeek: (time: number) => void;
    primaryColor: string;
    secondaryColor: string;
    trackColor?: string;
    disabled?: boolean;
    isLoading?: boolean;
    isDaylight?: boolean;
    playQueue: SongResult[];
    currentSongId: number | null | undefined;
};

const FloatingPlayerProgressRail: React.FC<FloatingPlayerProgressRailProps> = ({
    currentTime,
    duration,
    onSeek,
    primaryColor,
    secondaryColor,
    trackColor,
    disabled,
    isLoading,
    isDaylight,
    playQueue,
    currentSongId,
}) => {
    const { t } = useTranslation();
    const neighbors = resolvePlaybackNeighbors(playQueue, currentSongId);
    return (
        <div
            className="absolute top-[4px] z-20 overflow-visible"
            style={{
                left: FLOATING_PLAYER_PROGRESS_INSET_PX,
                right: FLOATING_PLAYER_PROGRESS_INSET_PX,
            }}
        >
            <ProgressBar
                currentTime={currentTime}
                duration={duration}
                onSeek={onSeek}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                trackColor={trackColor}
                disabled={disabled}
                isLoading={isLoading}
                isDaylight={isDaylight}
                variant="edge"
                previousLabel={formatPlaybackNeighborLabel(neighbors.previous, t('queue.played'))}
                nextLabel={formatPlaybackNeighborLabel(neighbors.next, t('queue.upNext'))}
            />
        </div>
    );
};

export default FloatingPlayerProgressRail;
