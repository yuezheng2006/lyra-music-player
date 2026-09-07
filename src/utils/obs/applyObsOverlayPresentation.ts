import type { ObsBrowserSourceConfig } from '../../types/obsBrowserSource';
import type { ObsOverlayQueryOverrides } from './parseObsOverlayQuery';
import type { ObsCustomCssAssets } from './obsCustomCssMath';

// src/utils/obs/applyObsOverlayPresentation.ts
// Merge OBS URL overrides and Custom CSS assets onto the live overlay config.

export const applyObsOverlayPresentation = (
    config: ObsBrowserSourceConfig,
    overrides: ObsOverlayQueryOverrides,
    cssAssets: ObsCustomCssAssets,
): ObsBrowserSourceConfig => {
    const next: ObsBrowserSourceConfig = { ...config };

    if (overrides.mode) next.visualizerMode = overrides.mode;
    if (overrides.fontScale != null) next.lyricsFontScale = overrides.fontScale;
    if (overrides.transparent != null) next.transparentBackground = overrides.transparent;
    if (overrides.hideBackground != null) next.disableGeometricBackground = overrides.hideBackground;
    if (overrides.hideSubtitle != null) next.hideTranslationSubtitle = overrides.hideSubtitle;

    if (cssAssets.backgroundUrl) {
        next.monetBackgroundImage = { id: 'obs-css-bg', name: 'OBS CSS', url: cssAssets.backgroundUrl };
        if (next.monetBackgroundTuning) {
            next.monetBackgroundTuning = { ...next.monetBackgroundTuning, backgroundSource: 'uploaded-global' };
        }
    }
    if (cssAssets.portraitUrl) {
        next.monetPortraitImage = { id: 'obs-css-portrait', name: 'OBS CSS', url: cssAssets.portraitUrl };
        if (next.monetTuning) {
            next.monetTuning = { ...next.monetTuning, portraitSource: 'custom' };
        }
    }
    if (cssAssets.cappellaEmojis.length > 0) {
        next.cappellaCustomEmojiImages = cssAssets.cappellaEmojis;
        if (next.cappellaTuning) {
            next.cappellaTuning = { ...next.cappellaTuning, emojiPackSource: 'custom' };
        }
    }
    if (cssAssets.cappellaAvatars.length > 0) {
        next.cappellaCustomAvatarImages = cssAssets.cappellaAvatars;
        if (next.cappellaTuning) {
            next.cappellaTuning = { ...next.cappellaTuning, avatarSource: 'custom' };
        }
    }

    return next;
};
