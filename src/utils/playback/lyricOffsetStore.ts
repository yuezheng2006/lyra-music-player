// src/utils/playback/lyricOffsetStore.ts
// Per-song lyric timeline offset persistence, so a calibrated offset survives song switches and restarts.

const STORAGE_KEY = 'lyric_timeline_offsets_v1';
export const MAX_LYRIC_OFFSET_ENTRIES = 200;

type StoredOffsetEntry = [songId: string, offsetMs: number];

/** Stable per-song key; provider prefix avoids id collisions across sources. */
export const buildLyricOffsetSongKey = (
    song: {
        id: number | string;
        name?: string;
        musicProvider?: string;
        localData?: { id: string; filePath?: string; fileName?: string };
    } | null | undefined,
): string | null => {
    if (!song) {
        return null;
    }
    // Local playback SongResult ids are generated per session; the LocalSong UUID
    // is the only identity that is stable across song switches and restarts.
    // Path/name disambiguates two imports that somehow share a UUID.
    if (song.localData?.id) {
        const localIdentity = [
            song.localData.filePath,
            song.localData.fileName,
            song.name,
        ].map(value => value?.trim()).find(Boolean) || '';
        return localIdentity
            ? `localfile:${song.localData.id}:${localIdentity}`
            : `localfile:${song.localData.id}`;
    }
    if (song.localData?.filePath) {
        return `localfile:${song.localData.filePath}`;
    }
    return `${song.musicProvider ?? 'local'}:${song.id}`;
};

export const readLyricTimelineOffsetMsForSong = (
    song: Parameters<typeof buildLyricOffsetSongKey>[0],
): number => readLyricTimelineOffsetMs(buildLyricOffsetSongKey(song));

const parseEntries = (value: string | null): StoredOffsetEntry[] => {
    if (!value) {
        return [];
    }
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter((entry): entry is StoredOffsetEntry => (
            Array.isArray(entry)
            && typeof entry[0] === 'string'
            && typeof entry[1] === 'number'
            && Number.isFinite(entry[1])
        ));
    } catch {
        return [];
    }
};

const readEntries = (): StoredOffsetEntry[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        return parseEntries(window.localStorage.getItem(STORAGE_KEY));
    } catch {
        return [];
    }
};

const writeEntries = (entries: StoredOffsetEntry[]) => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(entries.slice(-MAX_LYRIC_OFFSET_ENTRIES)),
        );
    } catch {
        // Storage full or unavailable — the offset just won't survive this session.
    }
};

/** Saved offset for a song, or 0 when none was calibrated. */
export const readLyricTimelineOffsetMs = (songId: string | null | undefined): number => {
    if (!songId) {
        return 0;
    }
    const entry = readEntries().find(([id]) => id === songId);
    return entry ? entry[1] : 0;
};

/** Persist a calibrated offset; 0 removes the entry. Most-recent entries win eviction. */
export const persistLyricTimelineOffsetMs = (songId: string | null | undefined, offsetMs: number) => {
    if (!songId) {
        return;
    }
    const others = readEntries().filter(([id]) => id !== songId);
    writeEntries(offsetMs === 0 ? others : [...others, [songId, offsetMs]]);
};
