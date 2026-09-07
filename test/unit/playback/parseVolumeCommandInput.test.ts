import { describe, expect, it } from 'vitest';
import { parseVolumeCommandInput } from '../../../src/utils/playback/parseVolumeCommandInput';

// test/unit/playback/parseVolumeCommandInput.test.ts

describe('parseVolumeCommandInput', () => {
    it('parses percent and 0–1 values', () => {
        expect(parseVolumeCommandInput('50')).toBe(0.5);
        expect(parseVolumeCommandInput('50%')).toBe(0.5);
        expect(parseVolumeCommandInput('0.3')).toBe(0.3);
        expect(parseVolumeCommandInput('100')).toBe(1);
        expect(parseVolumeCommandInput('')).toBeNull();
    });
});
