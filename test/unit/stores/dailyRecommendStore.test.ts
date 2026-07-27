import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/dailyRecommendService', () => ({
    fetchAggregatedDailyRecommend: vi.fn(),
}));

vi.mock('../../../src/stores/useOnlineLibraryFilterStore', () => ({
    ONLINE_LIBRARY_PROVIDER_IDS: ['netease', 'qq', 'qishui', 'coco', 'kugou', 'kuwo', 'bilibili'],
    useOnlineLibraryFilterStore: {
        getState: () => ({
            playlistProviders: { netease: true },
        }),
    },
}));

import { fetchAggregatedDailyRecommend } from '../../../src/services/dailyRecommendService';
import { useDailyRecommendStore } from '../../../src/stores/useDailyRecommendStore';

describe('useDailyRecommendStore error mapping', () => {
    beforeEach(() => {
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

    it('does not treat timeout as empty — stores errorCode and diagnostic', async () => {
        vi.mocked(fetchAggregatedDailyRecommend).mockResolvedValue({
            songs: [],
            needLoginNetease: false,
            sources: [{
                provider: 'netease',
                songs: [],
                kind: 'personalized',
                error: 'timeout',
                errorCode: 'timeout',
                diagnostic: 'source=netease code=timeout',
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

    it('maps need-login without promoting fake empty content', async () => {
        vi.mocked(fetchAggregatedDailyRecommend).mockResolvedValue({
            songs: [],
            needLoginNetease: true,
            sources: [{
                provider: 'netease',
                songs: [],
                kind: 'personalized',
                error: 'need-login',
                errorCode: 'need-login',
            }],
        });

        await useDailyRecommendStore.getState().ensureLoaded({ force: true });
        const state = useDailyRecommendStore.getState();
        expect(state.needsAuth).toBe(true);
        expect(state.errorCode).toBe('need-login');
    });

    it('attaches diagnostic summary for empty settled results', async () => {
        vi.mocked(fetchAggregatedDailyRecommend).mockResolvedValue({
            songs: [],
            needLoginNetease: false,
            sources: [{
                provider: 'netease',
                songs: [],
                kind: 'personalized',
                errorCode: 'empty',
            }],
        });

        await useDailyRecommendStore.getState().ensureLoaded({ force: true });
        const state = useDailyRecommendStore.getState();
        expect(state.error).toBeNull();
        expect(state.diagnostic).toContain('source=netease');
        expect(state.diagnostic).toContain('songs=0');
    });

    it('does not treat empty settled cache as fresh', async () => {
        vi.mocked(fetchAggregatedDailyRecommend).mockResolvedValue({
            songs: [],
            needLoginNetease: false,
            sources: [{
                provider: 'netease',
                songs: [],
                kind: 'personalized',
                errorCode: 'empty',
            }],
        });

        await useDailyRecommendStore.getState().ensureLoaded({ force: true });
        expect(fetchAggregatedDailyRecommend).toHaveBeenCalledTimes(1);

        vi.mocked(fetchAggregatedDailyRecommend).mockResolvedValue({
            songs: [{
                id: 1,
                name: '回填',
                musicProvider: 'netease',
                artists: [],
                album: { id: 0, name: 'a' },
                duration: 180000,
            }],
            needLoginNetease: false,
            sources: [{
                provider: 'netease',
                songs: [{
                    id: 1,
                    name: '回填',
                    musicProvider: 'netease',
                    artists: [],
                    album: { id: 0, name: 'a' },
                    duration: 180000,
                }],
                kind: 'personalized',
            }],
        });

        await useDailyRecommendStore.getState().ensureLoaded();
        expect(fetchAggregatedDailyRecommend).toHaveBeenCalledTimes(2);
        expect(useDailyRecommendStore.getState().songs).toHaveLength(1);
    });
});
