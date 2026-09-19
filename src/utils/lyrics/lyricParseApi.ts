// src/utils/lyrics/lyricParseApi.ts
// Public, pluggable lyric-parse surface. Visualizers and providers should import from here.

export { extractAwlrcContainer } from './awlrcContainer';
export { alignLyricAlternateTracks } from './alignLyricAlternateTracks';
export { attachAlignedAlternateTrack } from './attachLyricAlternateTracks';
export { parseLrcAlternateEntries } from './parseLrcAlternateEntries';
export { LyricParserFactory } from './LyricParserFactory';
export {
    getLyricFormatParser,
    listRegisteredLyricFormats,
    registerLyricFormatParser,
} from './lyricFormatRegistry';
export {
    getLyricSourceAdapter,
    parseLyricSource,
    registerLyricSourceAdapter,
} from './lyricSourceAdapterRegistry';
export { parseLyricsByFormat } from './parserCore';
export type { LyricParseFormat } from './parserCore';
export type { LyricFormatParser } from './lyricFormatRegistry';
export type { LyricProcessingOptions, RawLyricSource } from './types';
export {
    hasCachedNavidromeStructuredLyrics,
    hasEnhancedNavidromeStructuredLyrics,
    parseNavidromeStructuredLyrics,
    parseNavidromeStructuredLyricsCollection,
    selectPreferredNavidromeStructuredLyric,
} from './navidromeStructuredLyrics';
