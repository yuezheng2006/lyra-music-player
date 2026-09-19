import type { BeatEvent, BeatMap } from '../../types/atmosphere';

// src/utils/atmosphere/localBeatMapCache.ts
// Persists offline BeatMaps by song persist-key + cinema/pulse mode.

/** Internal cache keys. UI labels are cinema / strong-beat — never surface vendor names. */
export type LocalBeatAnalysisMode = 'mr' | 'dj';

const STORE_KEY = 'lyra-local-beatmap-v1';
const PREF_KEY = 'lyra-local-beatmap-prefs-v1';
const MAX_ENTRIES = 48;

type StoredBeatMapV1 = {
    v: 1;
    duration: number;
    gridStep?: number;
    tempoSource: string;
    visualBeatCount: number;
    analyzedAt: number;
    cameraBeats: BeatEvent[];
    pulseBeats: BeatEvent[];
};

type CacheFile = Record<string, {
    updatedAt: number;
    mr?: StoredBeatMapV1;
    dj?: StoredBeatMapV1;
}>;

export const resolveLocalBeatPersistKey = (songKey: string | null | undefined) => {
    if (!songKey) return null;
    const idPart = String(songKey).split('::')[0]?.trim();
    if (!idPart || idPart === 'unknown') return String(songKey);
    return idPart;
};

export const isLocalBeatPromptSource = (audioSrc: string | null | undefined) => {
    if (!audioSrc) return false;
    return audioSrc.startsWith('blob:')
        || audioSrc.startsWith('file:')
        || audioSrc.startsWith('local-media:')
        || audioSrc.startsWith('atom:');
};

const packBeatMap = (map: BeatMap): StoredBeatMapV1 => ({
    v: 1,
    duration: map.duration || 0,
    gridStep: map.gridStep,
    tempoSource: map.tempoSource || 'local',
    visualBeatCount: map.visualBeatCount || (map.cameraBeats?.length ?? 0),
    analyzedAt: map.analyzedAt || Date.now(),
    cameraBeats: map.cameraBeats || map.beats || [],
    pulseBeats: map.pulseBeats || [],
});

const unpackBeatMap = (stored: StoredBeatMapV1): BeatMap => {
    const cameraBeats = Array.isArray(stored.cameraBeats) ? stored.cameraBeats : [];
    const pulseBeats = Array.isArray(stored.pulseBeats) ? stored.pulseBeats : [];
    return {
        kicks: cameraBeats.map((beat) => (typeof beat === 'number' ? beat : beat.time)),
        beats: cameraBeats,
        pulseBeats,
        cameraBeats,
        duration: stored.duration || 0,
        visualBeatCount: stored.visualBeatCount || cameraBeats.length,
        tempoSource: stored.tempoSource || 'local',
        analyzedAt: stored.analyzedAt || Date.now(),
        gridStep: stored.gridStep,
    };
};

const readCacheFile = (): CacheFile => {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as CacheFile;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const writeCacheFile = (file: CacheFile) => {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(file));
    } catch {
        // Quota or private mode — ignore persistence failures.
    }
};

const trimCacheFile = (file: CacheFile): CacheFile => {
    const keys = Object.keys(file);
    if (keys.length <= MAX_ENTRIES) return file;
    const ranked = keys
        .map((key) => ({ key, updatedAt: file[key]?.updatedAt || 0 }))
        .sort((a, b) => a.updatedAt - b.updatedAt);
    const next = { ...file };
    for (let i = 0; i < ranked.length - MAX_ENTRIES; i += 1) {
        delete next[ranked[i].key];
    }
    return next;
};

export const getLocalBeatMap = (
    persistKey: string,
    mode: LocalBeatAnalysisMode,
): BeatMap | null => {
    const entry = readCacheFile()[persistKey];
    const packed = entry?.[mode];
    return packed ? unpackBeatMap(packed) : null;
};

export const setLocalBeatMap = (
    persistKey: string,
    mode: LocalBeatAnalysisMode,
    map: BeatMap,
) => {
    const file = readCacheFile();
    const prev = file[persistKey] || { updatedAt: 0 };
    file[persistKey] = {
        ...prev,
        updatedAt: Date.now(),
        [mode]: packBeatMap(map),
    };
    writeCacheFile(trimCacheFile(file));
};

export const getPreferredLocalBeatMode = (persistKey: string): LocalBeatAnalysisMode => {
    try {
        const raw = JSON.parse(localStorage.getItem(PREF_KEY) || '{}') as Record<string, string>;
        return raw[persistKey] === 'dj' ? 'dj' : 'mr';
    } catch {
        return 'mr';
    }
};

export const setPreferredLocalBeatMode = (
    persistKey: string,
    mode: LocalBeatAnalysisMode,
) => {
    try {
        const raw = JSON.parse(localStorage.getItem(PREF_KEY) || '{}') as Record<string, string>;
        raw[persistKey] = mode;
        localStorage.setItem(PREF_KEY, JSON.stringify(raw));
    } catch {
        // ignore
    }
};

export const clearLocalBeatMapCache = () => {
    try {
        localStorage.removeItem(STORE_KEY);
        localStorage.removeItem(PREF_KEY);
    } catch {
        // ignore
    }
};
