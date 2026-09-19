import { prefetchSongAudio } from '../../services/prefetchService';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import type { OnlineMusicProviderId, UnifiedSong } from '../../types';

// src/utils/search/prefetchQishuiSearchAudio.ts
// Warm audition URLs for the first Qishui hits so click-to-play skips the share-page hop.

const PREFETCH_HIT_COUNT = 3;

/** Fire-and-forget audio prefetch for top Qishui search rows. */
export const prefetchQishuiSearchAudio = (
    providers: OnlineMusicProviderId[],
    results: UnifiedSong[] | null | undefined,
    signal?: AbortSignal,
) => {
    if (!providers.includes('qishui') || !results?.length || signal?.aborted) {
        return;
    }

    const audioQuality = useSettingsUiStore.getState().audioQuality;
    const targets = results
        .filter(song => (song.musicProvider || 'qishui') === 'qishui')
        .slice(0, PREFETCH_HIT_COUNT);

    for (const song of targets) {
        void prefetchSongAudio(song, audioQuality, signal).catch(() => {
            // Prefetch must never surface errors to search UX.
        });
    }
};
