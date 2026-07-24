import { describe, expect, it } from 'vitest';
import { stripShortcutDisplayLabel } from '@/utils/onlineSearchShortcuts';

// test/unit/utils/stripShortcutDisplayLabel.test.ts

describe('stripShortcutDisplayLabel', () => {
    it('removes qishui and bilibili routing prefixes', () => {
        expect(stripShortcutDisplayLabel('cat:周杰伦')).toBe('周杰伦');
        expect(stripShortcutDisplayLabel('分类:AI歌曲')).toBe('AI歌曲');
        expect(stripShortcutDisplayLabel('up:天花板上吊着猫')).toBe('天花板上吊着猫');
        expect(stripShortcutDisplayLabel('周杰伦 晴天')).toBe('周杰伦 晴天');
    });
});
