// src/utils/atmosphere/beatMapAnalyzer.ts
// Public entry for offline beat map analysis.

import { buildBeatEvents, createEmptyBeatMap } from './beatMap/buildBeatEvents';
import { detectBeatCandidates } from './beatMap/detectBeatCandidates';
import { extractEnergyFrames } from './beatMap/extractEnergyFrames';
import {
    buildPodcastDjBeatMapFromLowEnergy,
    shouldUsePodcastDjBeatMap,
} from './podcastDjBeatMap';

export { PODCAST_DJ_DURATION_THRESHOLD_SEC } from './podcastDjBeatMap';

export const analyzeBeatMapFromAudioBuffer = (
    buffer: AudioBuffer,
    options?: { contentType?: string | null },
) => {
    const duration = buffer.duration || 0;
    if (duration <= 0.5) {
        return createEmptyBeatMap(duration);
    }

    const hopSec = duration > 4200 ? 0.0125 : 0.01;
    const series = extractEnergyFrames(buffer, hopSec);

    if (shouldUsePodcastDjBeatMap(duration, options?.contentType)) {
        return buildPodcastDjBeatMapFromLowEnergy(
            series.lowEnergy,
            series.hitEnergy,
            series.hopSec,
            duration,
        );
    }

    const candidates = detectBeatCandidates(series.lowEnergy, series.hitEnergy, series.hopSec);
    return buildBeatEvents(candidates, series, duration);
};

export const decodeAudioBufferFromUrl = async (
    audioUrl: string,
    audioContext: AudioContext,
) => {
    try {
        if (audioUrl.startsWith('blob:') || /^https?:\/\//i.test(audioUrl)) {
            const response = await fetch(audioUrl);
            if (!response.ok) return null;
            const arrayBuffer = await response.arrayBuffer();
            return await audioContext.decodeAudioData(arrayBuffer.slice(0));
        }
        return null;
    } catch {
        return null;
    }
};

export const analyzeBeatMapFromUrl = async (
    audioUrl: string,
    audioContext: AudioContext,
) => {
    const buffer = await decodeAudioBufferFromUrl(audioUrl, audioContext);
    if (!buffer) return null;
    return analyzeBeatMapFromAudioBuffer(buffer);
};
