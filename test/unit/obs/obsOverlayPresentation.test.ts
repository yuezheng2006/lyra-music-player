import { describe, expect, it } from 'vitest';
import { parseObsOverlayQuery } from '../../../src/utils/obs/parseObsOverlayQuery';
import { applyObsOverlayPresentation } from '../../../src/utils/obs/applyObsOverlayPresentation';
import { encodeBase64Utf8, parseObsCssDataUrl, parseObsCssImageList } from '../../../src/utils/obs/obsCustomCssMath';
import type { ObsBrowserSourceConfig } from '../../../src/types/obsBrowserSource';

// test/unit/obs/obsOverlayPresentation.test.ts

const baseConfig = (): ObsBrowserSourceConfig => ({
    activePlaybackContext: 'main',
    stageSource: null,
    hasTrack: true,
    song: { id: 1, name: 'Song' },
    songArtist: 'A',
    songAlbum: 'B',
    coverUrl: null,
    lyrics: null,
    theme: { primaryColor: '#fff', secondaryColor: '#ccc', accentColor: '#f00', backgroundColor: '#000', fontFamily: 'sans-serif', fontStyle: 'normal' } as never,
    isDaylight: false,
    visualizerMode: 'classic',
    visualizerBackgroundMode: 'common',
    lyricsFontScale: 1,
    backgroundOpacity: 1,
    visualizerOpacity: 1,
    subtitleOverlayOpacity: 1,
    transparentBackground: false,
    useCoverColorBg: false,
    staticMode: false,
    disableGeometricBackground: false,
    disableVignette: false,
    hideTranslationSubtitle: false,
    seed: 's',
    updatedAt: 0,
});

describe('parseObsOverlayQuery', () => {
    it('parses mode, font scale, offset, and flags', () => {
        const parsed = parseObsOverlayQuery('mode=still&fontScale=1.2&offsetMs=200&transparent=1&hideBg=1');
        expect(parsed.mode).toBe('still');
        expect(parsed.fontScale).toBe(1.2);
        expect(parsed.offsetMs).toBe(200);
        expect(parsed.transparent).toBe(true);
        expect(parsed.hideBackground).toBe(true);
    });
});

describe('applyObsOverlayPresentation', () => {
    it('applies URL overrides and CSS background', () => {
        const next = applyObsOverlayPresentation(
            baseConfig(),
            parseObsOverlayQuery('mode=still&transparent=1'),
            { backgroundUrl: 'data:image/png;base64,abc', portraitUrl: null, cappellaEmojis: [], cappellaAvatars: [] },
        );
        expect(next.visualizerMode).toBe('still');
        expect(next.transparentBackground).toBe(true);
        expect(next.monetBackgroundImage?.url).toBe('data:image/png;base64,abc');
    });
});

describe('obsCustomCssMath', () => {
    it('parses a data URL custom property', () => {
        expect(parseObsCssDataUrl('url("data:image/png;base64,abc")')).toBe('data:image/png;base64,abc');
    });

    it('parses a packed image list', () => {
        const packed = encodeBase64Utf8(JSON.stringify([{ id: '1', name: 'e', url: 'data:image/png;base64,x' }]));
        expect(parseObsCssImageList(packed)[0]?.id).toBe('1');
    });
});
