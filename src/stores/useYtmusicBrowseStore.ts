import { create } from 'zustand';
import type { YtmHomePlaylist, YtmHomeSection, YtmSearchTrack } from '../types/ytmusic';

// src/stores/useYtmusicBrowseStore.ts
// Session-only YTM browse state so player navigation does not wipe search/playlist UI.

type YtmusicBrowseState = {
    query: string;
    tracks: YtmSearchTrack[];
    searched: boolean;
    loading: boolean;
    error: string | null;
    activePlaylist: YtmHomePlaylist | null;
    playlistSection: YtmHomeSection | null;
    playlistLoading: boolean;
    playlistError: string | null;
    listScrollTop: number;
    setQuery: (query: string) => void;
    beginSearch: (query: string) => void;
    finishSearch: (tracks: YtmSearchTrack[]) => void;
    failSearch: (message: string) => void;
    clearSearch: () => void;
    openPlaylist: (playlist: YtmHomePlaylist) => void;
    setPlaylistCached: (section: YtmHomeSection) => void;
    beginPlaylistLoad: () => void;
    finishPlaylistLoad: (section: YtmHomeSection) => void;
    failPlaylistLoad: (message: string) => void;
    closePlaylist: () => void;
    setListScrollTop: (scrollTop: number) => void;
};

export const useYtmusicBrowseStore = create<YtmusicBrowseState>((set) => ({
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

    setQuery: (query) => set({ query }),

    beginSearch: (query) => set({
        query,
        loading: true,
        error: null,
        searched: true,
        activePlaylist: null,
        playlistSection: null,
        playlistError: null,
        playlistLoading: false,
        listScrollTop: 0,
    }),

    finishSearch: (tracks) => set({
        tracks,
        loading: false,
        error: null,
    }),

    failSearch: (message) => set({
        tracks: [],
        loading: false,
        error: message,
    }),

    clearSearch: () => set({
        query: '',
        tracks: [],
        searched: false,
        loading: false,
        error: null,
        listScrollTop: 0,
    }),

    openPlaylist: (playlist) => set({
        searched: false,
        tracks: [],
        error: null,
        activePlaylist: playlist,
        playlistError: null,
        listScrollTop: 0,
    }),

    setPlaylistCached: (section) => set({
        playlistSection: section,
        playlistLoading: false,
        playlistError: null,
    }),

    beginPlaylistLoad: () => set({
        playlistSection: null,
        playlistLoading: true,
        playlistError: null,
    }),

    finishPlaylistLoad: (section) => set({
        playlistSection: section,
        playlistLoading: false,
        playlistError: null,
    }),

    failPlaylistLoad: (message) => set({
        playlistLoading: false,
        playlistError: message,
    }),

    closePlaylist: () => set({
        activePlaylist: null,
        playlistSection: null,
        playlistError: null,
        playlistLoading: false,
        listScrollTop: 0,
    }),

    setListScrollTop: (scrollTop) => set({ listScrollTop: Math.max(0, scrollTop) }),
}));
