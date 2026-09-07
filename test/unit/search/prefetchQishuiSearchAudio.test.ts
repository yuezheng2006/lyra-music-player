import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prefetchQishuiSearchAudio } from '@/utils/search/prefetchQishuiSearchAudio';
import type { UnifiedSong } from '@/types';

// test/unit/search/prefetchQishuiSearchAudio.test.ts

const prefetchSongAudio = vi.fn().mockResolvedValue(null);

vi.mock('@/services/prefetchService', () => ({
    prefetchSongAudio: (...args: unknown[]) => prefetchSongAudio(...args),
}));

vi.mock('@/stores/useSettingsUiStore', () => ({
    useSettingsUiStore: {
        getState: () => ({ audioQuality: 'standard' }),
    },
}));

const makeSong = (id: number, provider: UnifiedSong['musicProvider'] = 'qishui'): UnifiedSong => ({
    id,
    name: `Song ${id}`,
    artists: [],
    album: { id: 0, name: '' },
    duration: 1000,
    musicProvider: provider,
    providerSongId: String(id),
});

describe('prefetchQishuiSearchAudio', () => {
    beforeEach(() => {
        prefetchSongAudio.mockClear();
    });

    it('prefeches audio for the first three qishui hits only', () => {
        prefetchQishuiSearchAudio(
            ['qishui'],
            [makeSong(1), makeSong(2), makeSong(3), makeSong(4), makeSong(5, 'coco')],
        );

        expect(prefetchSongAudio).toHaveBeenCalledTimes(3);
        expect(prefetchSongAudio).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 1 }), 'standard', undefined);
        expect(prefetchSongAudio).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 2 }), 'standard', undefined);
        expect(prefetchSongAudio).toHaveBeenNthCalledWith(3, expect.objectContaining({ id: 3 }), 'standard', undefined);
    });

    it('no-ops when qishui is not in the provider list', () => {
        prefetchQishuiSearchAudio(['coco'], [makeSong(1)]);
        expect(prefetchSongAudio).not.toHaveBeenCalled();
    });
});
