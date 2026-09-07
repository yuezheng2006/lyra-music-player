import type { LyricData } from '../../types';
import type { LyricParseFormat } from './parserCore';
import type { LyricProcessingOptions } from './types';

// src/utils/lyrics/lyricFormatRegistry.ts
// Pluggable format parsers. Built-in LRC/YRC/awlrc register here; extras can register at runtime.

export type LyricFormatParser = (
    content: string,
    translation?: string,
    options?: LyricProcessingOptions,
    romanization?: string,
) => LyricData;

const lyricFormatParsers = new Map<LyricParseFormat, LyricFormatParser>();

export const registerLyricFormatParser = (
    format: LyricParseFormat,
    parser: LyricFormatParser,
): void => {
    lyricFormatParsers.set(format, parser);
};

export const getLyricFormatParser = (format: LyricParseFormat): LyricFormatParser | undefined => (
    lyricFormatParsers.get(format)
);

export const listRegisteredLyricFormats = (): LyricParseFormat[] => (
    Array.from(lyricFormatParsers.keys())
);
