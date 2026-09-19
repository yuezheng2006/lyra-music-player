import { describe, expect, it } from 'vitest';
import { parseLyricsByFormat } from '@/utils/lyrics/parserCore';
import { parseLrcAlternateEntries } from '@/utils/lyrics/parseLrcAlternateEntries';

describe('parseLrcAlternateEntries', () => {
    it('reads LRC-timed romanization lines', () => {
        expect(parseLrcAlternateEntries('[00:01.00]kimi no namae\n[00:04.50]sora')).toEqual([
            { startTime: 1, text: 'kimi no namae' },
            { startTime: 4.5, text: 'sora' },
        ]);
    });

    it('attaches romalrc onto YRC without parsing roma as YRC', () => {
        const data = parseLyricsByFormat(
            'yrc',
            '[1000,2000](1000,500,0)君(1500,500,0)の',
            '',
            {},
            '[00:01.00]kimi no',
        );
        expect(data.lines[0]?.romanization).toBe('kimi no');
    });
});
