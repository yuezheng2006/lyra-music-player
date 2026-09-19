import { describe, expect, it } from 'vitest';
import { applyUploadedLocalLyrics } from '@/utils/lyrics/localLyricsUpload';
import type { LocalSong } from '@/types';

// test/unit/lyrics/localLyricsUpload.test.ts
// Uploading a lyric file must pin lyricsSource so playback does not keep the previous source.

const baseSong = (patch: Partial<LocalSong> = {}): LocalSong => ({
    id: 'local-1',
    filePath: '/tmp/song.mp3',
    title: 'Fixture',
    ...patch,
}) as LocalSong;

describe('applyUploadedLocalLyrics', () => {
    it('pins lyricsSource to local after a main lyric upload', () => {
        const next = applyUploadedLocalLyrics(baseSong({ lyricsSource: 'online' }), {
            content: '[00:00.00]hello',
            isTranslation: false,
            fileName: 'song.lrc',
        });
        expect(next.hasLocalLyrics).toBe(true);
        expect(next.localLyricsContent).toBe('[00:00.00]hello');
        expect(next.lyricsSource).toBe('local');
    });

    it('records the explicit timed format from the file name', () => {
        const next = applyUploadedLocalLyrics(baseSong(), {
            content: 'WEBVTT',
            isTranslation: false,
            fileName: 'song.vtt',
        });
        expect(next.localLyricsFormat).toBe('vtt');
        expect(next.lyricsSource).toBe('local');
    });

    it('does not pin source when only a translation is uploaded and no main local lyrics exist', () => {
        const next = applyUploadedLocalLyrics(baseSong({ lyricsSource: 'embedded' }), {
            content: '[00:00.00]译',
            isTranslation: true,
        });
        expect(next.hasLocalTranslationLyrics).toBe(true);
        expect(next.lyricsSource).toBe('embedded');
    });

    it('keeps lyricsSource local when a translation is uploaded onto existing local lyrics', () => {
        const next = applyUploadedLocalLyrics(baseSong({
            hasLocalLyrics: true,
            localLyricsContent: '[00:00.00]hello',
            lyricsSource: 'online',
        }), {
            content: '[00:00.00]译',
            isTranslation: true,
        });
        expect(next.lyricsSource).toBe('local');
    });
});
