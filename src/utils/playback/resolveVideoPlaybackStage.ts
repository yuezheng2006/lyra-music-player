// src/utils/playback/resolveVideoPlaybackStage.ts
// Shared gate for dual-stream video stage (muted <video> under lyric shell).

const LOCAL_VIDEO_EXTENSION_RE = /\.(mp4|webm|mkv|mov|m4v)(?:$|[?#])/i;

export const normalizePlaybackVideoSrc = (videoSrc?: string | null): string | null => {
    if (typeof videoSrc !== 'string') {
        return null;
    }
    const trimmed = videoSrc.trim();
    return trimmed || null;
};

/** Player view + non-empty videoSrc → show video under lyrics and suppress opaque layers. */
export const isVideoPlaybackStageActive = (
    currentView: string | null | undefined,
    videoSrc: string | null | undefined,
): boolean => currentView === 'player' && Boolean(normalizePlaybackVideoSrc(videoSrc));

/** Local / file carriers that should share the muted video stage with lyrics. */
export const isVideoPlaybackCarrier = (input: {
    mimeType?: string | null;
    fileName?: string | null;
    isVideo?: boolean | null;
} | null | undefined): boolean => {
    if (!input) {
        return false;
    }
    if (input.isVideo === true) {
        return true;
    }
    const mime = typeof input.mimeType === 'string' ? input.mimeType.trim().toLowerCase() : '';
    if (mime.startsWith('video/')) {
        return true;
    }
    const fileName = typeof input.fileName === 'string' ? input.fileName.trim() : '';
    return Boolean(fileName && LOCAL_VIDEO_EXTENSION_RE.test(fileName));
};
