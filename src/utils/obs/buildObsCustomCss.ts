import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import {
    encodeBase64Utf8,
    OBS_CSS_BACKGROUND_VAR,
    OBS_CSS_CAPPELLA_AVATARS_VAR,
    OBS_CSS_CAPPELLA_EMOJIS_VAR,
    OBS_CSS_PORTRAIT_VAR,
} from './obsCustomCssMath';

// src/utils/obs/buildObsCustomCss.ts
// Build an OBS Custom CSS snippet that carries uploaded visualizer assets as data URLs.

const BACKGROUND_MAX_SIZE = 1280;
const PORTRAIT_MAX_SIZE = 640;
const CAPPELLA_MAX_SIZE = 256;

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:/i.test(src)) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
});

const encodeBoundedDataUrl = async (
    sourceUrl: string,
    maxSize: number,
    mimeType: 'image/jpeg' | 'image/png',
    quality?: number,
): Promise<string | null> => {
    const image = await loadImage(sourceUrl);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    if (!naturalWidth || !naturalHeight) return null;
    const scale = Math.min(1, maxSize / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL(mimeType, quality);
};

const safeEncode = async (sourceUrl: string | undefined, maxSize: number, mime: 'image/jpeg' | 'image/png', quality?: number) => {
    if (!sourceUrl) return null;
    try {
        return await encodeBoundedDataUrl(sourceUrl, maxSize, mime, quality);
    } catch (error) {
        console.warn('[OBS CSS] failed to encode asset', error);
        return null;
    }
};

export type BuildObsCustomCssResult = {
    css: string;
    hasUploadedAssets: boolean;
};

export const buildObsCustomCss = async (): Promise<BuildObsCustomCssResult> => {
    const store = useSettingsUiStore.getState();
    const usesUploadedBackground = store.monetBackgroundTuning.backgroundSource === 'uploaded-global'
        || store.nomandBackgroundTuning.imageSource === 'uploaded-global';
    const usesCustomPortrait = store.monetTuning.portraitSource === 'custom';
    const usesCustomEmojis = store.cappellaTuning.emojiPackSource === 'custom' && store.cappellaCustomEmojiImages.length > 0;
    const usesCustomAvatars = store.cappellaTuning.avatarSource === 'custom' && store.cappellaCustomAvatarImages.length > 0;

    const [background, portrait, emojiUrls, avatarUrls] = await Promise.all([
        usesUploadedBackground ? safeEncode(store.monetBackgroundImage?.url, BACKGROUND_MAX_SIZE, 'image/jpeg', 0.82) : null,
        usesCustomPortrait ? safeEncode(store.monetPortraitImage?.url, PORTRAIT_MAX_SIZE, 'image/png') : null,
        usesCustomEmojis
            ? Promise.all(store.cappellaCustomEmojiImages.map(async image => ({
                id: image.id,
                name: image.name,
                url: await safeEncode(image.url, CAPPELLA_MAX_SIZE, 'image/png'),
            })))
            : [],
        usesCustomAvatars
            ? Promise.all(store.cappellaCustomAvatarImages.map(async image => ({
                id: image.id,
                name: image.name,
                url: await safeEncode(image.url, CAPPELLA_MAX_SIZE, 'image/png'),
            })))
            : [],
    ]);

    const declarations: string[] = [];
    if (background) declarations.push(`  ${OBS_CSS_BACKGROUND_VAR}: url("${background}");`);
    if (portrait) declarations.push(`  ${OBS_CSS_PORTRAIT_VAR}: url("${portrait}");`);
    const emojiList = emojiUrls.filter(entry => entry.url).map(entry => ({ id: entry.id, name: entry.name, url: entry.url }));
    if (emojiList.length > 0) {
        declarations.push(`  ${OBS_CSS_CAPPELLA_EMOJIS_VAR}: "${encodeBase64Utf8(JSON.stringify(emojiList))}";`);
    }
    const avatarList = avatarUrls.filter(entry => entry.url).map(entry => ({ id: entry.id, name: entry.name, url: entry.url }));
    if (avatarList.length > 0) {
        declarations.push(`  ${OBS_CSS_CAPPELLA_AVATARS_VAR}: "${encodeBase64Utf8(JSON.stringify(avatarList))}";`);
    }

    const css = [
        '/* Lyra OBS custom assets. Paste into OBS Browser Source → Custom CSS. */',
        'body { background-color: rgba(0, 0, 0, 0); margin: 0; overflow: hidden; }',
        ...(declarations.length > 0 ? [':root {', ...declarations, '}'] : []),
        '',
    ].join('\n');

    return { css, hasUploadedAssets: declarations.length > 0 };
};
