import { create } from 'zustand';
import type { YtmHomePlaylist, YtmHomeSection, YtmSearchTrack } from '../types/ytmusic';

// src/stores/useYtmusicBrowseStore.ts
// Session-only YTM browse state so player navigation does not wipe search/playlist UI.

export type YtmusicSearchTab = 'songs' | 'playlists';

type YtmusicBrowseState = {
    query: string;
    tracks: YtmSearchTrack[];
    playlists: YtmHomePlaylist[];
    searchTab: YtmusicSearchTab;
    /** Which typed searches already completed for the current query. */
    songsFetched: boolean;
    playlistsFetched: boolean;
    searched: boolean;
    loading: boolean;
    error: string | null;
    diagnostic: string | null;
    activePlaylist: YtmHomePlaylist | null;
    playlistSection: YtmHomeSection | null;
    playlistLoading: boolean;
    playlistError: string | null;
    playlistDiagnostic: string | null;
    listScrollTop: number;
    setQuery: (query: string) => void;
    setSearchTab: (tab: YtmusicSearchTab) => void;
    beginSearch: (query: string, tab?: YtmusicSearchTab) => void;
    finishSongSearch: (tracks: YtmSearchTrack[]) => void;
    finishPlaylistSearch: (playlists: YtmHomePlaylist[]) => void;
    /** @deprecated Prefer finishSongSearch. */
    finishSearch: (tracks: YtmSearchTrack[]) => void;
    failSearch: (message: string, diagnostic?: string | null) => void;
    clearSearch: () => void;
    openPlaylist: (playlist: YtmHomePlaylist) => void;
    setPlaylistCached: (section: YtmHomeSection) => void;
    beginPlaylistLoad: () => void;
    finishPlaylistLoad: (section: YtmHomeSection) => void;
    failPlaylistLoad: (message: string, diagnostic?: string | null) => void;
    closePlaylist: () => void;
    setListScrollTop: (scrollTop: number) => void;
};

const EMPTY_SEARCH = {
    tracks: [] as YtmSearchTrack[],
    playlists: [] as YtmHomePlaylist[],
    songsFetched: false,
    playlistsFetched: false,
    searched: false,
    loading: false,
    error: null as string | null,
    diagnostic: null as string | null,
    listScrollTop: 0,
};

export const useYtmusicBrowseStore = create<YtmusicBrowseState>((set) => ({
    query: '',
    searchTab: 'songs',
    ...EMPTY_SEARCH,
    activePlaylist: null,
    playlistSection: null,
    playlistLoading: false,
    playlistError: null,
    playlistDiagnostic: null,

    setQuery: (query) => set({ query }),

    setSearchTab: (tab) => set({ searchTab: tab, listScrollTop: 0, error: null, diagnostic: null }),

    beginSearch: (query, tab) => set((state) => {
        const nextTab = tab ?? state.searchTab;
        const sameQuery = state.query.trim() === query.trim() && state.searched;
        return {
            query,
            searchTab: nextTab,
            loading: true,
            error: null,
            diagnostic: null,
            searched: true,
            // New query resets typed result caches; tab switch refetch keeps the other tab.
            ...(sameQuery
                ? {}
                : {
                    tracks: [],
                    playlists: [],
                    songsFetched: false,
                    playlistsFetched: false,
                }),
            activePlaylist: null,
            playlistSection: null,
            playlistError: null,
            playlistDiagnostic: null,
            playlistLoading: false,
            listScrollTop: 0,
        };
    }),

    finishSongSearch: (tracks) => set({
        tracks,
        songsFetched: true,
        loading: false,
        error: null,
        diagnostic: null,
    }),

    finishPlaylistSearch: (playlists) => set({
        playlists,
        playlistsFetched: true,
        loading: false,
        error: null,
        diagnostic: null,
    }),

    finishSearch: (tracks) => set({
        tracks,
        songsFetched: true,
        loading: false,
        error: null,
        diagnostic: null,
    }),

    failSearch: (message, diagnostic = null) => set({
        loading: false,
        error: message,
        diagnostic,
    }),

    clearSearch: () => set({
        query: '',
        searchTab: 'songs',
        ...EMPTY_SEARCH,
    }),

    openPlaylist: (playlist) => set({
        activePlaylist: playlist,
        playlistError: null,
        playlistDiagnostic: null,
        listScrollTop: 0,
    }),

    setPlaylistCached: (section) => set({
        playlistSection: section,
        playlistLoading: false,
        playlistError: null,
        playlistDiagnostic: null,
    }),

    beginPlaylistLoad: () => set({
        playlistSection: null,
        playlistLoading: true,
        playlistError: null,
        playlistDiagnostic: null,
    }),

    finishPlaylistLoad: (section) => set({
        playlistSection: section,
        playlistLoading: false,
        playlistError: null,
        playlistDiagnostic: null,
    }),

    failPlaylistLoad: (message, diagnostic = null) => set({
        playlistLoading: false,
        playlistError: message,
        playlistDiagnostic: diagnostic,
    }),

    closePlaylist: () => set({
        activePlaylist: null,
        playlistSection: null,
        playlistError: null,
        playlistDiagnostic: null,
        playlistLoading: false,
        listScrollTop: 0,
    }),

    setListScrollTop: (scrollTop) => set({ listScrollTop: Math.max(0, scrollTop) }),
}));
