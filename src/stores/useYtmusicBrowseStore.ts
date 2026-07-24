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
    diagnostic: string | null;
    activePlaylist: YtmHomePlaylist | null;
    playlistSection: YtmHomeSection | null;
    playlistLoading: boolean;
    playlistError: string | null;
    playlistDiagnostic: string | null;
    listScrollTop: number;
    setQuery: (query: string) => void;
    beginSearch: (query: string) => void;
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

export const useYtmusicBrowseStore = create<YtmusicBrowseState>((set) => ({
    query: '',
    tracks: [],
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

    setQuery: (query) => set({ query }),

    beginSearch: (query) => set({
        query,
        loading: true,
        error: null,
        diagnostic: null,
        searched: true,
        activePlaylist: null,
        playlistSection: null,
        playlistError: null,
        playlistDiagnostic: null,
        playlistLoading: false,
        listScrollTop: 0,
    }),

    finishSearch: (tracks) => set({
        tracks,
        loading: false,
        error: null,
        diagnostic: null,
    }),

    failSearch: (message, diagnostic = null) => set({
        tracks: [],
        loading: false,
        error: message,
        diagnostic,
    }),

    clearSearch: () => set({
        query: '',
        tracks: [],
        searched: false,
        loading: false,
        error: null,
        diagnostic: null,
        listScrollTop: 0,
    }),

    openPlaylist: (playlist) => set({
        searched: false,
        tracks: [],
        error: null,
        diagnostic: null,
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
