import { describe, expect, it } from 'vitest';
import {
    formatCompactPlayCount,
    mapPersonalizedPlaylistResult,
    personalizedItemToPlaylist,
} from '@/utils/home/personalizedPlaylistMath';

// test/unit/home/personalizedPlaylistMath.test.ts

describe('personalizedPlaylistMath', () => {
    it('maps NetEase personalized payloads and drops invalid rows', () => {
        const items = mapPersonalizedPlaylistResult({
            result: [
                { id: 11, name: '夜色', picUrl: 'https://example.com/a.jpg', playCount: 22000, copywriter: '睡前' },
                { id: 0, name: 'bad' },
                { id: 12, name: '  ' },
                { name: 'no-id' },
            ],
        });
        expect(items).toEqual([
            {
                id: 11,
                name: '夜色',
                coverUrl: 'https://example.com/a.jpg',
                playCount: 22000,
                trackCount: 0,
                copywriter: '睡前',
            },
        ]);
    });

    it('builds a playlist the existing home overlay can open', () => {
        const playlist = personalizedItemToPlaylist({
            id: 11,
            name: '夜色',
            coverUrl: 'https://example.com/a.jpg',
            playCount: 9,
            trackCount: 3,
            copywriter: '睡前',
        }, null);
        expect(playlist.id).toBe(11);
        expect(playlist.musicProvider).toBe('netease');
        expect(playlist.description).toBe('睡前');
    });

    it('formats compact play counts and hides zeros', () => {
        expect(formatCompactPlayCount(0)).toBe('');
        expect(formatCompactPlayCount(22000).length).toBeGreaterThan(0);
    });
});
