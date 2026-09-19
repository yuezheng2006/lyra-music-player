import type { LyricData } from '../../types';
import { attachAlignedAlternateTrack } from './attachLyricAlternateTracks';
import { parseLrcAlternateEntries } from './parseLrcAlternateEntries';
import { getLyricFormatParser, registerLyricFormatParser } from './lyricFormatRegistry';
import type { LyricParseFormat } from './parserCore';
import type { LyricProcessingOptions } from './types';

// src/utils/lyrics/parseLyricFormat.ts
// Format dispatcher. Built-in parsers are bound once from parserCore (no import cycle).

type CoreLyricParser = (
    content: string,
    translation?: string,
    options?: LyricProcessingOptions,
) => LyricData;

type AwlrcParser = (
    content: string,
    translation?: string,
    options?: LyricProcessingOptions,
    romanization?: string,
) => LyricData;

export type BuiltinLyricFormatParsers = {
    parseLRC: CoreLyricParser;
    parseEnhancedLRC: CoreLyricParser;
    parseYRC: CoreLyricParser;
    parseQRC: CoreLyricParser;
    parseKRC: CoreLyricParser;
    parseVTT: CoreLyricParser;
    parseTTML: CoreLyricParser;
    parseAwlrc: AwlrcParser;
};

const withLrcRomanization = (
    parse: CoreLyricParser,
): AwlrcParser => (
    (content, translation = '', options = {}, romanization = '') => {
        const data = parse(content, translation, options);
        if (!romanization.trim()) return data;
        const lrcEntries = parseLrcAlternateEntries(romanization);
        const entries = lrcEntries.length > 0
            ? lrcEntries
            : parse(romanization, '', { ...options, includeInterludes: false })
                .lines
                .filter(line => line.fullText.trim())
                .map(line => ({ startTime: line.startTime, text: line.fullText }));
        return attachAlignedAlternateTrack(data, entries, 'romanization');
    }
);

let builtinsBound = false;

export const bindBuiltinLyricFormatParsers = (parsers: BuiltinLyricFormatParsers): void => {
    if (builtinsBound) return;
    builtinsBound = true;
    registerLyricFormatParser('lrc', withLrcRomanization(parsers.parseLRC));
    registerLyricFormatParser('enhanced-lrc', withLrcRomanization(parsers.parseEnhancedLRC));
    registerLyricFormatParser('yrc', withLrcRomanization(parsers.parseYRC));
    registerLyricFormatParser('qrc', withLrcRomanization(parsers.parseQRC));
    registerLyricFormatParser('krc', withLrcRomanization(parsers.parseKRC));
    registerLyricFormatParser('vtt', withLrcRomanization(parsers.parseVTT));
    registerLyricFormatParser('ttml', withLrcRomanization(parsers.parseTTML));
    registerLyricFormatParser('awlrc', parsers.parseAwlrc);
};

export const parseRegisteredLyricFormat = (
    format: LyricParseFormat,
    content: string,
    translation: string = '',
    options: LyricProcessingOptions = {},
    romanization: string = '',
    fallback?: CoreLyricParser,
): LyricData => {
    const parser = getLyricFormatParser(format) ?? getLyricFormatParser('lrc') ?? fallback;
    if (!parser) {
        throw new Error(`[parseLyricFormat] No parser registered for ${format}`);
    }
    return parser(content, translation, options, romanization);
};
