import { LyricData } from '../../../types';
import { LyricAdapter } from '../LyricAdapter';
import { LyricProcessingOptions, RawNavidromeLyric } from '../types';
import { parseLyricsAsync } from '../workerClient';
import { detectTimedLyricFormat } from '../formatDetection';
import {
    normalizeEmbeddedLrcText,
    normalizeEmbeddedStructuredLyrics,
    type EmbeddedStructuredLyricLine,
} from '../embeddedLrcNormalization';
import {
    isNavidromeStructuredLyricCollection,
    parseNavidromeStructuredLyrics,
    parseNavidromeStructuredLyricsCollection,
    selectPreferredNavidromeStructuredLyric,
} from '../navidromeStructuredLyrics';
import { splitCombinedTimeline } from '../timelineSplitter';

// src/utils/lyrics/adapters/NavidromeLyricAdapter.ts
// Prefers OpenSubsonic cue timing; falls back to embedded LRC / plain text.

export class NavidromeLyricAdapter implements LyricAdapter<RawNavidromeLyric> {
    async parse(source: RawNavidromeLyric, options: LyricProcessingOptions = {}): Promise<LyricData | null> {
        if (source.structuredLyrics && isNavidromeStructuredLyricCollection(source.structuredLyrics)) {
            const parsedStructuredLyrics = parseNavidromeStructuredLyricsCollection(source.structuredLyrics, options);
            if (parsedStructuredLyrics) {
                return parsedStructuredLyrics;
            }

            const mainLyrics = selectPreferredNavidromeStructuredLyric(source.structuredLyrics);
            const translationLyrics = selectPreferredNavidromeStructuredLyric(source.structuredLyrics, 'translation');
            const pronunciationLyrics = selectPreferredNavidromeStructuredLyric(source.structuredLyrics, 'pronunciation');
            const normalizedMainLyrics = normalizeEmbeddedStructuredLyrics(mainLyrics?.line);
            const normalizedTranslationLyrics = translationLyrics
                ? normalizeEmbeddedStructuredLyrics(translationLyrics.line).mainText
                : normalizedMainLyrics.translationText;
            const normalizedRomanization = pronunciationLyrics
                ? normalizeEmbeddedStructuredLyrics(pronunciationLyrics.line).mainText
                : normalizedMainLyrics.romanizationText || '';
            return await parseLyricsAsync(
                detectTimedLyricFormat(normalizedMainLyrics.mainText),
                normalizedMainLyrics.mainText,
                normalizedTranslationLyrics,
                options,
                normalizedRomanization,
            );
        }

        if (source.structuredLyrics && !Array.isArray(source.structuredLyrics)) {
            const parsedStructuredLyrics = parseNavidromeStructuredLyrics(source.structuredLyrics, options);
            if (parsedStructuredLyrics) {
                return parsedStructuredLyrics;
            }

            const normalized = normalizeEmbeddedStructuredLyrics(source.structuredLyrics.line);
            return await parseLyricsAsync(
                detectTimedLyricFormat(normalized.mainText),
                normalized.mainText,
                normalized.translationText,
                options,
                normalized.romanizationText || '',
            );
        }

        if (
            Array.isArray(source.structuredLyrics)
            && source.structuredLyrics.length > 0
            && !isNavidromeStructuredLyricCollection(source.structuredLyrics)
        ) {
            const normalized = normalizeEmbeddedStructuredLyrics(
                source.structuredLyrics as EmbeddedStructuredLyricLine[],
            );
            return await parseLyricsAsync(
                detectTimedLyricFormat(normalized.mainText),
                normalized.mainText,
                normalized.translationText,
                options,
                normalized.romanizationText || '',
            );
        }

        if (source.plainLyrics) {
            const normalized = normalizeEmbeddedLrcText(source.plainLyrics);
            if (normalized.mainText) {
                return await parseLyricsAsync(
                    detectTimedLyricFormat(normalized.mainText),
                    normalized.mainText,
                    normalized.translationText,
                    options,
                    normalized.romanizationText || '',
                );
            }

            const { main, trans, romanization } = splitCombinedTimeline(source.plainLyrics);
            return await parseLyricsAsync(
                detectTimedLyricFormat(main),
                main,
                trans,
                options,
                romanization,
            );
        }

        return null;
    }
}
