import { getPalette } from 'colorthief';
import { rankCoverPalette, type CoverPaletteCandidate } from './coverPaletteScore';
import { fetchCoverViaProxy } from './fetchCoverViaProxy';

// src/utils/colorExtractor.ts
// Extract ranked cover palette colors via Color Thief + moderate-sat scoring.

const colorCache = new Map<string, { colors: string[]; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100;

const pendingExtractions = new Map<string, Promise<string[]>>();

const getExtractionCacheKey = (imageUrl: string, count: number) => `${imageUrl}::${count}`;

const shouldUseElectronCoverProxy = (imageUrl: string) => (
    Boolean(window.electron?.fetchLyricProxy)
    && !imageUrl.startsWith('blob:')
    && !imageUrl.startsWith('data:')
);

const toPaletteCandidates = (
    palette: Array<{
        hex: () => string;
        rgb: () => { r: number; g: number; b: number };
        proportion: number;
        population: number;
    }>,
): CoverPaletteCandidate[] => {
    const populationTotal = palette.reduce((sum, color) => sum + Math.max(0, color.population), 0);

    return palette.map((color) => {
        const { r, g, b } = color.rgb();
        const proportion = color.proportion > 0
            ? color.proportion
            : populationTotal > 0
                ? color.population / populationTotal
                : 0;

        return {
            hex: color.hex(),
            r,
            g,
            b,
            proportion,
        };
    });
};

export const extractColors = async (imageUrl: string, count: number = 5): Promise<string[]> => {
    const cacheKey = getExtractionCacheKey(imageUrl, count);
    const cached = colorCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.colors;
    }

    const pending = pendingExtractions.get(cacheKey);
    if (pending) {
        return pending;
    }

    const extractionPromise = extractColorsInternal(imageUrl, count);
    pendingExtractions.set(cacheKey, extractionPromise);

    try {
        const colors = await extractionPromise;
        colorCache.set(cacheKey, { colors, timestamp: Date.now() });

        if (colorCache.size > MAX_CACHE_SIZE) {
            const entries = Array.from(colorCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            for (let i = 0; i < 20 && i < entries.length; i++) {
                colorCache.delete(entries[i][0]);
            }
        }

        return colors;
    } finally {
        pendingExtractions.delete(cacheKey);
    }
};

const loadCoverImage = async (imageUrl: string): Promise<{ img: HTMLImageElement; release: () => void }> => {
    let proxiedImageUrl: string | null = null;

    const release = () => {
        if (!proxiedImageUrl) return;
        URL.revokeObjectURL(proxiedImageUrl);
        proxiedImageUrl = null;
    };

    let resolvedUrl = imageUrl;
    if (shouldUseElectronCoverProxy(imageUrl)) {
        try {
            const response = await fetchCoverViaProxy(imageUrl);
            if (!response.ok) {
                throw new Error(`cover proxy fetch failed: ${response.status}`);
            }
            const blob = await response.blob();
            if (!blob.size) {
                throw new Error('cover proxy returned an empty image');
            }
            proxiedImageUrl = URL.createObjectURL(blob);
            resolvedUrl = proxiedImageUrl;
        } catch {
            // Preserve browser/direct-image behavior if the Electron bridge is unavailable.
            resolvedUrl = imageUrl;
        }
    }

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.onload = () => resolve(image);
        image.onerror = (event) => reject(event);
        image.src = resolvedUrl;
    });

    return { img, release };
};

const extractColorsInternal = async (imageUrl: string, count: number = 5): Promise<string[]> => {
    let release: (() => void) | null = null;

    try {
        const loaded = await loadCoverImage(imageUrl);
        release = loaded.release;

        const palette = await getPalette(loaded.img, {
            colorCount: Math.max(count, 8),
            colorSpace: 'oklch',
            quality: 5,
            ignoreWhite: true,
        });

        if (!palette || palette.length === 0) {
            return [];
        }

        return rankCoverPalette(toPaletteCandidates(palette), count);
    } catch (error) {
        console.warn('Failed to extract cover colors', error);
        return [];
    } finally {
        release?.();
    }
};
