import { describe, expect, it } from 'vitest';
import {
    isVideoPlaybackCarrier,
    isVideoPlaybackStageActive,
    normalizePlaybackVideoSrc,
} from '../../../src/utils/playback/resolveVideoPlaybackStage';

// test/unit/playback/resolveVideoPlaybackStage.test.ts

describe('resolveVideoPlaybackStage', () => {
    it('normalizes empty video urls to null', () => {
        expect(normalizePlaybackVideoSrc(null)).toBeNull();
        expect(normalizePlaybackVideoSrc('')).toBeNull();
        expect(normalizePlaybackVideoSrc('  ')).toBeNull();
        expect(normalizePlaybackVideoSrc('https://cdn.example/v.m4s')).toBe('https://cdn.example/v.m4s');
    });

    it('activates video stage only on player view with a video src', () => {
        expect(isVideoPlaybackStageActive('player', 'https://cdn.example/v.m4s')).toBe(true);
        expect(isVideoPlaybackStageActive('home', 'https://cdn.example/v.m4s')).toBe(false);
        expect(isVideoPlaybackStageActive('player', null)).toBe(false);
    });

    it('detects local / navidrome video carriers by flag, mime, or extension', () => {
        expect(isVideoPlaybackCarrier(null)).toBe(false);
        expect(isVideoPlaybackCarrier({})).toBe(false);
        expect(isVideoPlaybackCarrier({ isVideo: true })).toBe(true);
        expect(isVideoPlaybackCarrier({ mimeType: 'video/mp4' })).toBe(true);
        expect(isVideoPlaybackCarrier({ mimeType: 'audio/mpeg' })).toBe(false);
        expect(isVideoPlaybackCarrier({ fileName: 'clip.mkv' })).toBe(true);
        expect(isVideoPlaybackCarrier({ fileName: 'track.mp3' })).toBe(false);
        expect(isVideoPlaybackCarrier({ fileName: '/library/foo/bar.webm?token=1' })).toBe(true);
        expect(isVideoPlaybackCarrier({ fileName: '.mp4' })).toBe(true);
    });
});
