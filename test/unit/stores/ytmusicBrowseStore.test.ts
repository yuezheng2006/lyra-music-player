import { beforeEach, describe, expect, it } from 'vitest';
import { useYtmusicBrowseStore } from '../../../src/stores/useYtmusicBrowseStore';

// test/unit/stores/ytmusicBrowseStore.test.ts

describe('useYtmusicBrowseStore', () => {
    beforeEach(() => {
        useYtmusicBrowseStore.setState({
            query: '',
            tracks: [],
            playlists: [],
            searchTab: 'songs',
            songsFetched: false,
            playlistsFetched: false,
            searched: false,
            loading: false,
            error: null,
            diagnostic: null,
            activePlaylist: null,
            playlistSection: null,
            playlistLoading: false,
            playlistError: null,
            playlistDiagnostic: null,
            listScrollTop: 0,
        });
    });

    it('keeps search results after begin/finish for remount restore', () => {
        const { beginSearch, finishSongSearch } = useYtmusicBrowseStore.getState();
        beginSearch('周杰伦', 'songs');
        finishSongSearch([
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
        expect(state.songsFetched).toBe(true);
        expect(state.searchTab).toBe('songs');
        expect(state.listScrollTop).toBe(0);
    });

    it('keeps song results when playlist search finishes for the same query', () => {
        const store = useYtmusicBrowseStore.getState();
        store.beginSearch('华语流行', 'songs');
        store.finishSongSearch([
            { videoId: 's1', title: 'Song', artist: 'A', durationMs: 1000 },
        ]);
        store.beginSearch('华语流行', 'playlists');
        store.finishPlaylistSearch([
            { playlistId: 'PL1', title: 'Playlist', coverUrl: null },
        ]);

        const state = useYtmusicBrowseStore.getState();
        expect(state.tracks).toHaveLength(1);
        expect(state.playlists).toHaveLength(1);
        expect(state.songsFetched).toBe(true);
        expect(state.playlistsFetched).toBe(true);
        expect(state.searchTab).toBe('playlists');
    });

    it('resets typed caches when the query changes', () => {
        const store = useYtmusicBrowseStore.getState();
        store.beginSearch('a', 'songs');
        store.finishSongSearch([
            { videoId: 's1', title: 'Song', artist: 'A', durationMs: 1000 },
        ]);
        store.beginSearch('b', 'songs');

        const state = useYtmusicBrowseStore.getState();
        expect(state.tracks).toEqual([]);
        expect(state.songsFetched).toBe(false);
        expect(state.playlistsFetched).toBe(false);
        expect(state.loading).toBe(true);
    });

    it('switches search tab without clearing results', () => {
        useYtmusicBrowseStore.setState({
            tracks: [{ videoId: 's1', title: 'Song', artist: 'A', durationMs: 1000 }],
            songsFetched: true,
            searched: true,
            searchTab: 'songs',
        });
        useYtmusicBrowseStore.getState().setSearchTab('playlists');
        expect(useYtmusicBrowseStore.getState().searchTab).toBe('playlists');
        expect(useYtmusicBrowseStore.getState().tracks).toHaveLength(1);
        expect(useYtmusicBrowseStore.getState().listScrollTop).toBe(0);
    });

    it('preserves scroll offset independently of search content', () => {
        useYtmusicBrowseStore.getState().setListScrollTop(420);
        expect(useYtmusicBrowseStore.getState().listScrollTop).toBe(420);
    });
});
