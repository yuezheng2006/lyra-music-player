import { getMusicProviderForSong } from './musicProviders/registry';
import { lyricDataToSidecarLrc } from '../utils/lyrics/lyricDataToSidecarLrc';
import type { SongResult } from '../types';

// src/services/songDownloadLyricSidecar.ts
// After a playable-session download, write same-stem .lrc sidecars for local library.

type SidecarKind = 'lyric' | 'translation';

const writeSidecar = async (
    audioPath: string,
    kind: SidecarKind,
    text: string,
): Promise<void> => {
    const writer = window.electron?.writeDownloadSidecarFile;
    if (!writer || !text.trim()) return;
    await writer({ audioPath, kind, text });
};

/** Best-effort lyric sidecars; never fail the audio download. */
export const maybeWriteDownloadLyricSidecars = async (
    song: SongResult,
    audioPath: string,
): Promise<void> => {
    if (!audioPath || !window.electron?.writeDownloadSidecarFile) return;

    try {
        const lyrics = await getMusicProviderForSong(song).getLyrics(song);
        const { lrc, translationLrc } = lyricDataToSidecarLrc(lyrics);
        if (lrc) {
            await writeSidecar(audioPath, 'lyric', lrc);
        }
        if (translationLrc) {
            await writeSidecar(audioPath, 'translation', translationLrc);
        }
    } catch (error) {
        console.warn('[Download] Lyric sidecar skipped', error);
    }
};
