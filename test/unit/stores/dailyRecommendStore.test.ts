import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/dailyRecommendService', () => ({
    fetchAggregatedDailyRecommend: vi.fn(),
}));

const playlistProvidersState = {
    playlistProviders: {
        netease: true,
        qq: true,
        qishui: true,
        coco: true,
        kugou: false,
        bilibili: false,
        kuwo: false,
    } as Record<string, boolean>,
};

vi.mock('../../../src/stores/useOnlineLibraryFilterStore', async () => {
    const actual = await vi.importActual<typeof import('../../../src/stores/useOnlineLibraryFilterStore')>(
        '../../../src/stores/useOnlineLibraryFilterStore',
    );
    return {
        ...actual,
        useOnlineLibraryFilterStore: {
            getState: () => playlistProvidersState,
        },
    };
});

import { fetchAggregatedDailyRecommend } from '../../../src/services/dailyRecommendService';
import {
    serializeDailyRecommendProviderKey,
    useDailyRecommendStore,
} from '../../../src/stores/useDailyRecommendStore';

describe('useDailyRecommendStore error mapping', () => {
    beforeEach(() => {
        playlistProvidersState.playlistProviders = {
            netease: true,
            qq: true,
            qishui: true,
            coco: true,
            kugou: false,
            bilibili: false,
            kuwo: false,
        };
        useDailyRecommendStore.setState({
            providerKey: '',
            sources: [],
            songs: [],
            loading: false,
            settled: false,
            error: null,
            errorCode: null,
            diagnostic: null,
            needsAuth: false,
            fetchedAt: 0,
            inflight: null,
        });
        vi.mocked(fetchAggregatedDailyRecommend).mockReset();
    });

    it('changes cache key when peer toggles change', () => {
        const withQq = serializeDailyRecommendProviderKey({
            netease: true,
            qq: true,
            qishui: false,
            coco: false,
            kugou: false,
            bilibili: false,
            kuwo: false,
        });
        const withCoco = serializeDailyRecommendProviderKey({
            netease: true,
            qq: false,
            qishui: false,
            coco: true,
            kugou: false,
            bilibili: false,
            kuwo: false,
        });
        expect(withQq).toContain('today-picks-v1');
        expect(withQq).not.toEqual(withCoco);
        expect(withQq).toContain('qq');
        expect(withCoco).toContain('coco');
    });

    it('does not treat timeout as empty — stores errorCode and diagnostic', async () => {
        vi.mocked(fetchAggregatedDailyRecommend).mockResolvedValue({
            songs: [],
            needLoginNetease: false,
            sources: [{
                provider: 'qq',
                songs: [],
                kind: 'picks',
                error: 'timeout',
                errorCode: 'timeout',
                diagnostic: 'source=qq code=timeout',
            }],
        });

        await useDailyRecommendStore.getState().ensureLoaded({ force: true });
        const state = useDailyRecommendStore.getState();

        expect(state.songs).toHaveLength(0);
        expect(state.error).toBe('timeout');
        expect(state.errorCode).toBe('timeout');
        expect(state.diagnostic).toContain('timeout');
        expect(state.needsAuth).toBe(false);
    });

    it('never promotes NetEase login auth gate for Today Picks', async () => {
        vi.mocked(fetchAggregatedDailyRecommend).mockResolvedValue({
            songs: [],
            needLoginNetease: false,
            sources: [],
        });

        await useDailyRecommendStore.getState().ensureLoaded({ force: true });
        const state = useDailyRecommendStore.getState();
        expect(state.needsAuth).toBe(false);
        expect(state.errorCode).toBe('empty');
        expect(state.diagnostic).toContain('no peer sources');
    });

    it('attaches diagnostic summary for empty settled results', async () => {
        vi.mocked(fetchAggregatedDailyRecommend).mockResolvedValue({
            songs: [],
            needLoginNetease: false,
            sources: [{
                provider: 'coco',
                songs: [],
                kind: 'picks',
                errorCode: 'empty',
            }],
        });

        await useDailyRecommendStore.getState().ensureLoaded({ force: true });
        const state = useDailyRecommendStore.getState();
        expect(state.error).toBeNull();
        expect(state.diagnostic).toContain('source=coco');
        expect(state.diagnostic).toContain('songs=0');
    });

    it('does not treat empty settled cache as fresh', async () => {
        vi.mocked(fetchAggregatedDailyRecommend).mockResolvedValue({
            songs: [],
            needLoginNetease: false,
            sources: [{
                provider: 'coco',
                songs: [],
                kind: 'picks',
                errorCode: 'empty',
            }],
        });

        await useDailyRecommendStore.getState().ensureLoaded({ force: true });
        expect(fetchAggregatedDailyRecommend).toHaveBeenCalledTimes(1);

        vi.mocked(fetchAggregatedDailyRecommend).mockResolvedValue({
            songs: [{
                id: 1,
                name: '回填',
                musicProvider: 'coco',
                artists: [],
                album: { id: 0, name: 'a' },
                duration: 180000,
            }],
            needLoginNetease: false,
            sources: [{
                provider: 'coco',
                songs: [{
                    id: 1,
                    name: '回填',
                    musicProvider: 'coco',
                    artists: [],
                    album: { id: 0, name: 'a' },
                    duration: 180000,
                }],
                kind: 'picks',
            }],
        });

        await useDailyRecommendStore.getState().ensureLoaded();
        expect(fetchAggregatedDailyRecommend).toHaveBeenCalledTimes(2);
        expect(useDailyRecommendStore.getState().songs).toHaveLength(1);
    });
});
