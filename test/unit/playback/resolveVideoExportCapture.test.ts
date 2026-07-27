import { describe, expect, it } from 'vitest';
import { resolveVideoExportCaptureMode } from '../../../src/utils/playback/resolveVideoExportCapture';

// test/unit/playback/resolveVideoExportCapture.test.ts

describe('resolveVideoExportCaptureMode', () => {
    it('uses bilibili element capture when videoSrc is available in electron', () => {
        expect(resolveVideoExportCaptureMode({
            isElectronWindow: true,
            musicProvider: 'bilibili',
            videoSrc: 'https://cdn.example/video.m4s',
        })).toBe('bilibili-elements');
    });

    it('falls back to window capture for non-bilibili or missing video', () => {
        expect(resolveVideoExportCaptureMode({
            isElectronWindow: true,
            musicProvider: 'netease',
            videoSrc: null,
        })).toBe('window');

        expect(resolveVideoExportCaptureMode({
            isElectronWindow: true,
            musicProvider: 'bilibili',
            videoSrc: null,
        })).toBe('window');

        expect(resolveVideoExportCaptureMode({
            isElectronWindow: false,
            musicProvider: 'bilibili',
            videoSrc: 'https://cdn.example/video.m4s',
        })).toBe('window');
    });
});
