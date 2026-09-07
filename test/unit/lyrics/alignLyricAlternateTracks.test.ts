import { describe, expect, it } from 'vitest';
import { alignLyricAlternateTracks } from '@/utils/lyrics/alignLyricAlternateTracks';
import { attachAlignedAlternateTrack } from '@/utils/lyrics/attachLyricAlternateTracks';
import { parseLyricsByFormat } from '@/utils/lyrics/lyricParseApi';

// test/unit/lyrics/alignLyricAlternateTracks.test.ts

describe('alignLyricAlternateTracks', () => {
    it('keeps exact millisecond hits and does not borrow a neighbour', () => {
        const aligned = alignLyricAlternateTracks(
            [0, 1.097],
            [{ startTime: 1.097, text: 'romaji' }],
        );
        expect(aligned).toEqual([undefined, 'romaji']);
    });

    it('falls back to nearest neighbour when no exact hit exists', () => {
        const aligned = alignLyricAlternateTracks(
            [1.0],
            [{ startTime: 1.4, text: 'near' }],
        );
        expect(aligned).toEqual(['near']);
    });
});

describe('parseLyricsByFormat romanization', () => {
    it('attaches a romanization LRC track onto standard LRC lines', () => {
        const data = parseLyricsByFormat(
            'lrc',
            '[00:01.00]原文一\n[00:03.00]原文二',
            '[00:01.00]翻译一',
            { includeInterludes: false },
            '[00:01.00]ge n bu n i chi\n[00:03.00]ge n bu n ni',
        );

        expect(data.lines[0].fullText).toBe('原文一');
        expect(data.lines[0].translation).toBe('翻译一');
        expect(data.lines[0].romanization).toBe('ge n bu n i chi');
        expect(data.lines[1].romanization).toBe('ge n bu n ni');
    });

    it('does not overwrite an existing romanization field', () => {
        const base = parseLyricsByFormat('lrc', '[00:01.00]原文', '', { includeInterludes: false });
        const seeded = {
            ...base,
            lines: base.lines.map(line => ({ ...line, romanization: 'kept' })),
        };
        const next = attachAlignedAlternateTrack(
            seeded,
            [{ startTime: 1, text: 'replacement' }],
            'romanization',
        );
        expect(next.lines[0].romanization).toBe('kept');
    });
});
