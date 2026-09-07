import { LyricParserFactory } from './lyrics/LyricParserFactory';
import type { LyricData } from '../types';
import type { NavidromeConfig, NavidromeSong, StructuredLyric } from '../types/navidrome';
import { navidromeApi } from '../services/navidromeService';
import { hasRenderableLyrics } from './appPlaybackHelpers';
import {
    hasCachedNavidromeStructuredLyrics,
    hasEnhancedNavidromeStructuredLyrics,
    isNavidromeStructuredLyricCollection,
    selectPreferredNavidromeStructuredLyric,
} from './lyrics/navidromeStructuredLyrics';

// src/utils/appNavidromeLyrics.ts
// Navidrome lyric selection and hydration helpers kept outside App.tsx.

export const selectPreferredStructuredLyric = (items: StructuredLyric[] | null | undefined): StructuredLyric | null => (
    selectPreferredNavidromeStructuredLyric(items)
);

const getCachedMainStructuredLyric = (
    cachedStructuredLyrics: NavidromeSong['cachedStructuredLyrics'],
): StructuredLyric | null => {
    if (isNavidromeStructuredLyricCollection(cachedStructuredLyrics)) {
        return selectPreferredNavidromeStructuredLyric(cachedStructuredLyrics);
    }

    return Array.isArray(cachedStructuredLyrics) ? null : cachedStructuredLyrics ?? null;
};

export const resolvePreferredNavidromeLyrics = async (
    navidromeSong: Pick<NavidromeSong, 'cachedStructuredLyrics' | 'cachedPlainLyrics'>,
): Promise<LyricData | null> => {
    const cachedStructuredLyrics = navidromeSong.cachedStructuredLyrics;
    const structuredLyrics = Array.isArray(cachedStructuredLyrics) && !isNavidromeStructuredLyricCollection(cachedStructuredLyrics)
        ? cachedStructuredLyrics.filter(line => (line.value || '').trim().length > 0)
        : cachedStructuredLyrics;
    const cachedMainStructuredLyric = getCachedMainStructuredLyric(cachedStructuredLyrics);
    const shouldPreferPlainLyrics = Boolean(cachedMainStructuredLyric && !hasEnhancedNavidromeStructuredLyrics(cachedMainStructuredLyric));
    let parsedStructuredLyrics: LyricData | null = null;

    const hasStructuredPayload = structuredLyrics && (
        Array.isArray(structuredLyrics)
            ? structuredLyrics.length > 0
            : structuredLyrics.line.length > 0 || Boolean(structuredLyrics.cueLine?.length)
    );

    if (hasStructuredPayload) {
        parsedStructuredLyrics = await LyricParserFactory.parse({ type: 'navidrome', structuredLyrics });
        if (hasRenderableLyrics(parsedStructuredLyrics) && !shouldPreferPlainLyrics) {
            return parsedStructuredLyrics;
        }
    }

    const plainLyrics = navidromeSong.cachedPlainLyrics?.trim();
    if (plainLyrics) {
        const parsedPlainLyrics = await LyricParserFactory.parse({ type: 'navidrome', plainLyrics });
        if (hasRenderableLyrics(parsedPlainLyrics)) {
            return parsedPlainLyrics;
        }
    }

    return hasRenderableLyrics(parsedStructuredLyrics) ? parsedStructuredLyrics : null;
};

export const hydrateNavidromeLyricPayload = async (config: NavidromeConfig, navidromeSong: NavidromeSong): Promise<void> => {
    const navidromeId = navidromeSong.navidromeData?.id;
    if (!navidromeId) {
        return;
    }

    const cachedStructuredLyrics = navidromeSong.cachedStructuredLyrics;
    const hasCurrentStructuredLyrics = hasCachedNavidromeStructuredLyrics(cachedStructuredLyrics);
    const cachedMainStructuredLyric = getCachedMainStructuredLyric(cachedStructuredLyrics);
    const needsPlainLyrics = !navidromeSong.cachedPlainLyrics
        && (!cachedMainStructuredLyric || !hasEnhancedNavidromeStructuredLyrics(cachedMainStructuredLyric));
    if (!hasCurrentStructuredLyrics || needsPlainLyrics) {
        try {
            const structuredLyrics = hasCurrentStructuredLyrics
                ? null
                : await navidromeApi.getLyricsBySongId(config, navidromeId);
            const preferredStructuredLyrics = structuredLyrics
                ? selectPreferredStructuredLyric(structuredLyrics)
                : cachedMainStructuredLyric;

            if (preferredStructuredLyrics?.line?.length || preferredStructuredLyrics?.cueLine?.length) {
                navidromeSong.cachedStructuredLyrics = structuredLyrics ?? navidromeSong.cachedStructuredLyrics;
            }
            if ((!preferredStructuredLyrics || !hasEnhancedNavidromeStructuredLyrics(preferredStructuredLyrics)) && !navidromeSong.cachedPlainLyrics) {
                const artistName = navidromeSong.ar?.[0]?.name || navidromeSong.artists?.[0]?.name || '';
                const plainLyrics = await navidromeApi.getLyrics(config, artistName, navidromeSong.name);
                if (plainLyrics?.trim()) {
                    navidromeSong.cachedPlainLyrics = plainLyrics;
                }
            }
        } catch (e) {
            console.warn('[App] Failed to fetch Navidrome lyrics:', e);
        }
    }
};
