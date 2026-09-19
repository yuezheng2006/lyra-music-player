import { splitCombinedTimeline } from './timelineSplitter';

export interface EmbeddedLrcNormalizationResult {
    mainText: string;
    translationText: string;
    romanizationText?: string;
}

export interface EmbeddedUsltLikeTag {
    language?: string;
    descriptor?: string;
    text: string;
}

export interface EmbeddedStructuredLyricLine {
    start?: number;
    value?: string;
}

function formatStructuredTimestamp(totalMs: number): string {
    const safeTotalMs = Math.max(0, totalMs);
    const minutes = Math.floor(safeTotalMs / 60000);
    const seconds = Math.floor((safeTotalMs % 60000) / 1000);
    const ms = safeTotalMs % 1000;
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    const xx = Math.floor(ms / 10).toString().padStart(2, '0');
    return `[${mm}:${ss}.${xx}]`;
}

function isTranslationUsltTag(tag: EmbeddedUsltLikeTag): boolean {
    const language = tag.language?.toLowerCase();
    const descriptor = tag.descriptor?.toLowerCase() || '';

    return language === 'chi'
        || language === 'zho'
        || descriptor.includes('translation')
        || descriptor.includes('trans');
}

export function normalizeEmbeddedLrcText(
    textContent?: string,
    translationContent?: string
): EmbeddedLrcNormalizationResult {
    if (!textContent) {
        return { mainText: '', translationText: '' };
    }

    // Body may already be a combined main/translation timeline; always split first.
    // Prefer a separately timed translation track; fall back to split or plain text tags.
    const { main, trans, romanization } = splitCombinedTimeline(textContent);
    const hasTranslationTimestamp = /(?:\[\d+(?::\d+){0,2}[.:]\d+\]|<\d{2}:\d{2}[.:]\d{2,3}>)/.test(translationContent || '');
    return {
        mainText: main,
        translationText: hasTranslationTimestamp ? translationContent! : trans || translationContent || '',
        romanizationText: romanization,
    };
}

export function normalizeEmbeddedUsltTags(
    usltTags: EmbeddedUsltLikeTag[] | undefined
): EmbeddedLrcNormalizationResult {
    if (!usltTags?.length) {
        return { mainText: '', translationText: '' };
    }

    if (usltTags.length === 1) {
        return normalizeEmbeddedLrcText(usltTags[0].text);
    }

    const translationTag = usltTags.find(tag => isTranslationUsltTag(tag));
    if (translationTag) {
        return normalizeEmbeddedLrcText(
            usltTags.find(tag => tag !== translationTag)?.text,
            translationTag.text
        );
    }

    return normalizeEmbeddedLrcText(usltTags[0].text, usltTags[1].text);
}

export function normalizeEmbeddedStructuredLyrics(
    structuredLyrics: EmbeddedStructuredLyricLine[] | undefined
): EmbeddedLrcNormalizationResult {
    if (!structuredLyrics?.length) {
        return { mainText: '', translationText: '' };
    }

    const groups = new Map<number, string[]>();

    structuredLyrics.forEach(line => {
        const value = (line.value || '').trim();
        if (!value) {
            return;
        }

        const start = line.start || 0;
        const current = groups.get(start) || [];
        current.push(value);
        groups.set(start, current);
    });

    const mainLines: string[] = [];
    const translationLines: string[] = [];
    const romanizationLines: string[] = [];

    [...groups.entries()]
        .sort((a, b) => a[0] - b[0])
        .forEach(([start, values]) => {
            const prefix = formatStructuredTimestamp(start);
            if (values[0]) {
                mainLines.push(`${prefix}${values[0]}`);
            }
            if (values[1]) {
                translationLines.push(`${prefix}${values[1]}`);
            }
            if (values[2]) {
                romanizationLines.push(`${prefix}${values[2]}`);
            }
        });

    return {
        mainText: mainLines.join('\n'),
        translationText: translationLines.join('\n'),
        romanizationText: romanizationLines.join('\n'),
    };
}
