import type { CappellaAvatarImage, CappellaEmojiImage } from '../../types';

// src/utils/obs/obsCustomCssMath.ts
// Parse/serialize OBS Custom CSS asset properties. Encoding lives in buildObsCustomCss.ts.

export const OBS_CSS_BACKGROUND_VAR = '--lyra-obs-custom-bg';
export const OBS_CSS_PORTRAIT_VAR = '--lyra-obs-custom-portrait';
export const OBS_CSS_CAPPELLA_EMOJIS_VAR = '--lyra-obs-cappella-emojis';
export const OBS_CSS_CAPPELLA_AVATARS_VAR = '--lyra-obs-cappella-avatars';
export const FOLIA_CSS_BACKGROUND_VAR = '--folia-obs-custom-bg';
export const FOLIA_CSS_PORTRAIT_VAR = '--folia-obs-custom-portrait';
export const FOLIA_CSS_CAPPELLA_EMOJIS_VAR = '--folia-obs-cappella-emojis';
export const FOLIA_CSS_CAPPELLA_AVATARS_VAR = '--folia-obs-cappella-avatars';

type NamedImageAsset = { id: string; name: string; url: string };

export type ObsCustomCssAssets = {
    backgroundUrl: string | null;
    portraitUrl: string | null;
    cappellaEmojis: CappellaEmojiImage[];
    cappellaAvatars: CappellaAvatarImage[];
};

export const parseObsCssDataUrl = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const match = value.match(/url\(\s*["']?(data:[^"')]+)["']?\s*\)/);
    return match?.[1] ?? null;
};

const decodeBase64Utf8 = (value: string): string => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return new TextDecoder().decode(bytes);
};

export const encodeBase64Utf8 = (value: string): string => {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
};

export const parseObsCssImageList = (value: string | null | undefined): NamedImageAsset[] => {
    if (!value) return [];
    const stripped = value.trim().replace(/^["']|["']$/g, '');
    if (!stripped) return [];
    try {
        const parsed = JSON.parse(decodeBase64Utf8(stripped));
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((entry): entry is NamedImageAsset => Boolean(entry && typeof entry.url === 'string' && entry.url.startsWith('data:')))
            .map(entry => ({ id: String(entry.id ?? ''), name: String(entry.name ?? ''), url: entry.url }));
    } catch {
        return [];
    }
};

const firstDataUrl = (...values: Array<string | null | undefined>) => {
    for (const value of values) {
        const parsed = parseObsCssDataUrl(value);
        if (parsed) return parsed;
    }
    return null;
};

const firstImageList = (...values: Array<string | null | undefined>) => {
    for (const value of values) {
        const parsed = parseObsCssImageList(value);
        if (parsed.length > 0) return parsed;
    }
    return [];
};

export const readObsCustomCssAssetsFromStyle = (style: CSSStyleDeclaration): ObsCustomCssAssets => ({
    backgroundUrl: firstDataUrl(
        style.getPropertyValue(OBS_CSS_BACKGROUND_VAR),
        style.getPropertyValue(FOLIA_CSS_BACKGROUND_VAR),
    ),
    portraitUrl: firstDataUrl(
        style.getPropertyValue(OBS_CSS_PORTRAIT_VAR),
        style.getPropertyValue(FOLIA_CSS_PORTRAIT_VAR),
    ),
    cappellaEmojis: firstImageList(
        style.getPropertyValue(OBS_CSS_CAPPELLA_EMOJIS_VAR),
        style.getPropertyValue(FOLIA_CSS_CAPPELLA_EMOJIS_VAR),
    ),
    cappellaAvatars: firstImageList(
        style.getPropertyValue(OBS_CSS_CAPPELLA_AVATARS_VAR),
        style.getPropertyValue(FOLIA_CSS_CAPPELLA_AVATARS_VAR),
    ),
});

export const EMPTY_OBS_CUSTOM_CSS_ASSETS: ObsCustomCssAssets = {
    backgroundUrl: null,
    portraitUrl: null,
    cappellaEmojis: [],
    cappellaAvatars: [],
};

export const readObsCustomCssAssets = (): ObsCustomCssAssets => {
    if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') {
        return EMPTY_OBS_CUSTOM_CSS_ASSETS;
    }
    return readObsCustomCssAssetsFromStyle(getComputedStyle(document.documentElement));
};
