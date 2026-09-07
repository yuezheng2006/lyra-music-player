import { describe, expect, it } from 'vitest';
import {
    getLyricFormatParser,
    listRegisteredLyricFormats,
    parseLyricsByFormat,
    registerLyricFormatParser,
} from '@/utils/lyrics/lyricParseApi';

// test/unit/lyrics/lyricFormatRegistry.test.ts

describe('lyricFormatRegistry', () => {
    it('exposes built-in parsers after the first parse', () => {
        parseLyricsByFormat('lrc', '[00:01.00]hello', '', { includeInterludes: false });
        expect(listRegisteredLyricFormats()).toEqual(expect.arrayContaining(['lrc', 'awlrc', 'yrc']));
        expect(getLyricFormatParser('awlrc')).toBeTypeOf('function');
    });

    it('lets a custom format parser register independently', () => {
        registerLyricFormatParser('plugin-demo', (content) => ({
            lines: [{
                words: [{ text: content, startTime: 0, endTime: 1 }],
                startTime: 0,
                endTime: 1,
                fullText: `custom:${content}`,
            }],
        }));

        expect(parseLyricsByFormat('plugin-demo', 'ping', '', { includeInterludes: false }).lines[0].fullText)
            .toBe('custom:ping');
    });
});
