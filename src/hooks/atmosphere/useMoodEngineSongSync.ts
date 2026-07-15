import { useEffect, useRef } from 'react';
import { useMoodEngineStore } from '../../stores/useMoodEngineStore';
import { useAtmosphereBeatMapStore } from '../../stores/useAtmosphereBeatMapStore';
import { buildMoodProfile, createCinemaTrackProfile } from '../../utils/atmosphere/moodProfile';
import type { AtmosphereSample } from '../../types/atmosphere';

// src/hooks/atmosphere/useMoodEngineSongSync.ts
// Updates mood-engine emotion when the active song / beat map changes.

const EMPTY_SAMPLE: AtmosphereSample = {
  energy: 0.42,
  low: 0.35,
  body: 0.4,
  vocal: 0.35,
  melody: 0.35,
  lowOnset: 0,
  energyOnset: 0,
};

/**
 * Keep useMoodEngineStore.currentEmotion in sync with the playing song.
 */
export function useMoodEngineSongSync(songId: number | null | undefined): void {
  const beatMap = useAtmosphereBeatMapStore((s) => s.beatMap);
  const updateCurrentEmotion = useMoodEngineStore((s) => s.updateCurrentEmotion);
  const clearCurrent = useMoodEngineStore((s) => s.clearCurrent);
  const lastSongRef = useRef<number | null>(null);
  const lastBeatMapRef = useRef<typeof beatMap>(null);

  useEffect(() => {
    if (songId == null || !(songId > 0)) {
      lastSongRef.current = null;
      lastBeatMapRef.current = null;
      clearCurrent();
      return;
    }

    // Skip duplicate work when the same song + beatMap instance is still active.
    if (lastSongRef.current === songId && lastBeatMapRef.current === beatMap) {
      return;
    }
    lastSongRef.current = songId;
    lastBeatMapRef.current = beatMap;

    const moodProfile = buildMoodProfile(
      createCinemaTrackProfile(),
      EMPTY_SAMPLE,
      beatMap,
    );

    void updateCurrentEmotion(songId, moodProfile);
  }, [beatMap, clearCurrent, songId, updateCurrentEmotion]);
}
