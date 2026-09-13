import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmbeddedLyricAdapter } from '@/utils/lyrics/adapters/EmbeddedLyricAdapter';
import { parseLyricsAsync } from '@/utils/lyrics/workerClient';

// test/unit/lyrics/embeddedLyricAdapter.test.ts
// Embedded USLT/text must unwrap LX `[awlrc:]` and keep bilingual / romanization tracks.

vi.mock('@/utils/lyrics/workerClient', () => ({
    parseLyricsAsync: vi.fn(),
}));

const encode = (text: string) => Buffer.from(text, 'utf8').toString('base64');
const awlrcTrack = '[00:01.000]<0,400>原<400,600>文';
const lrcTrack = '[00:01.000]原文';
const tlrcTrack = '[00:01.000]翻译';
const rlrcTrack = '[00:01.000]romanization';
const container = `[awlrc:lrc:${encode(lrcTrack)},tlrc:${encode(tlrcTrack)},awlrc:${encode(awlrcTrack)}]`;
const containerWithRoma = `[awlrc:lrc:${encode(lrcTrack)},tlrc:${encode(tlrcTrack)},rlrc:${encode(rlrcTrack)},awlrc:${encode(awlrcTrack)}]`;
const redundantBody = '[00:01.000]原文\n[00:01.000]翻译\n';

describe('EmbeddedLyricAdapter', () => {
    beforeEach(() => {
        vi.mocked(parseLyricsAsync).mockReset();
        vi.mocked(parseLyricsAsync).mockResolvedValue({ lines: [] });
    });

    it('parses the awlrc track from a trailing container in embedded text', async () => {
        await new EmbeddedLyricAdapter().parse({
            type: 'embedded',
            textContent: `${redundantBody}${container}`,
        });

        expect(parseLyricsAsync).toHaveBeenCalledWith(
            'awlrc',
            awlrcTrack,
            tlrcTrack,
            {},
            '',
        );
    });

    it('prefers container rlrc over empty body romanization', async () => {
        await new EmbeddedLyricAdapter().parse({
            type: 'embedded',
            textContent: `${redundantBody}${containerWithRoma}`,
        });

        expect(parseLyricsAsync).toHaveBeenCalledWith(
            'awlrc',
            awlrcTrack,
            tlrcTrack,
            {},
            rlrcTrack,
        );
    });

    it('parses the awlrc track from a USLT tag the same way', async () => {
        await new EmbeddedLyricAdapter().parse({
            type: 'embedded',
            usltTags: [{ language: 'chi', text: `${redundantBody}${container}` }],
        });

        expect(parseLyricsAsync).toHaveBeenCalledWith(
            'awlrc',
            awlrcTrack,
            tlrcTrack,
            {},
            '',
        );
    });

    it('falls back to the lrc track when the container has no awlrc', async () => {
        const lrcOnly = `[awlrc:lrc:${encode(lrcTrack)},tlrc:${encode(tlrcTrack)}]`;
        await new EmbeddedLyricAdapter().parse({
            type: 'embedded',
            textContent: `${redundantBody}${lrcOnly}`,
        });

        expect(parseLyricsAsync).toHaveBeenCalledWith(
            'lrc',
            lrcTrack,
            tlrcTrack,
            {},
            '',
        );
    });

    it('splits a combined bilingual body even when a separate plain translation tag exists', async () => {
        const body = [
            '[00:03.49]「一瞬のクオリア」',
            '[00:03.49]一瞬的感质',
            '[00:18.25]埋もれた鉄くずから',
            '[00:18.25]在积埋的金属废墟中',
        ].join('\n');
        const translationTag = ['一瞬的感质', '在积埋的金属废墟中'].join('\n');

        await new EmbeddedLyricAdapter().parse({
            type: 'embedded',
            textContent: body,
            translationContent: translationTag,
        });

        const [, mainText, translationText] = vi.mocked(parseLyricsAsync).mock.calls[0];
        expect(mainText).toBe([
            '[00:03.49]「一瞬のクオリア」',
            '[00:18.25]埋もれた鉄くずから',
        ].join('\n'));
        expect(translationText).toBe([
            '[00:03.49]一瞬的感质',
            '[00:18.25]在积埋的金属废墟中',
        ].join('\n'));
    });

    it('keeps plain embedded lyrics on the timed-format path', async () => {
        await new EmbeddedLyricAdapter().parse({
            type: 'embedded',
            textContent: '[00:01.000]just a normal lrc',
        });

        expect(parseLyricsAsync).toHaveBeenCalledWith(
            expect.any(String),
            '[00:01.000]just a normal lrc',
            '',
            {},
            '',
        );
        expect(vi.mocked(parseLyricsAsync).mock.calls[0][0]).not.toBe('awlrc');
    });
});
