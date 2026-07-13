import { beforeEach, describe, expect, it } from 'vitest';
import { useYtmusicBrowseStore } from '../../../src/stores/useYtmusicBrowseStore';

// test/unit/stores/ytmusicBrowseStore.test.ts

describe('useYtmusicBrowseStore', () => {
    beforeEach(() => {
        useYtmusicBrowseStore.setState({
            query: '',
            tracks: [],
            searched: false,
            loading: false,
            error: null,
            activePlaylist: null,
            playlistSection: null,
            playlistLoading: false,
            playlistError: null,
            listScrollTop: 0,
        });
    });

    it('keeps search results after begin/finish for remount restore', () => {
        const { beginSearch, finishSearch } = useYtmusicBrowseStore.getState();
        beginSearch('周杰伦');
        finishSearch([
            {
                videoId: 'abc',
                title: '晴天',
                artist: '周杰伦',
                durationMs: 120000,
            },
        ]);

        const state = useYtmusicBrowseStore.getState();
        expect(state.searched).toBe(true);
        expect(state.query).toBe('周杰伦');
        expect(state.tracks).toHaveLength(1);
        expect(state.listScrollTop).toBe(0);
    });

    it('preserves scroll offset independently of search content', () => {
        useYtmusicBrowseStore.getState().setListScrollTop(420);
        expect(useYtmusicBrowseStore.getState().listScrollTop).toBe(420);
    });
});
