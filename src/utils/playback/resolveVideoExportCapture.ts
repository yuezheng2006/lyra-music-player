// src/utils/playback/resolveVideoExportCapture.ts
// Chooses window capture vs Bilibili dual-element capture for Electron export.

export type VideoExportCaptureMode = 'window' | 'bilibili-elements';

export const resolveVideoExportCaptureMode = (input: {
    isElectronWindow: boolean;
    musicProvider?: string | null;
    videoSrc?: string | null;
}): VideoExportCaptureMode => {
    if (!input.isElectronWindow) {
        return 'window';
    }
    if (input.musicProvider !== 'bilibili') {
        return 'window';
    }
    if (!input.videoSrc?.trim()) {
        return 'window';
    }
    return 'bilibili-elements';
};
