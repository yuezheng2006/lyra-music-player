import { create } from 'zustand';

// src/stores/useAddToPlaylistStore.ts
// Open state for "add current song to a playlist". Lives outside UnifiedPanel so a command
// can open the picker from home or fullscreen, not only while the player panel is mounted.
// Availability is published by AddToPlaylistHost (it owns the Navidrome fetch).

export type AddToPlaylistAvailability = {
    /** Current song is a kind that can go in a playlist at all. */
    isApplicable: boolean;
    /** There is somewhere to put it, or the source can create one. */
    canAdd: boolean;
    /** Why not, when `canAdd` is false and the answer is worth stating. */
    disabledReason?: string;
};

export const ADD_TO_PLAYLIST_UNAVAILABLE: AddToPlaylistAvailability = {
    isApplicable: false,
    canAdd: false,
};

type AddToPlaylistState = {
    isOpen: boolean;
    availability: AddToPlaylistAvailability;
    open: () => void;
    close: () => void;
    setAvailability: (availability: AddToPlaylistAvailability) => void;
};

export const useAddToPlaylistStore = create<AddToPlaylistState>((set) => ({
    isOpen: false,
    availability: ADD_TO_PLAYLIST_UNAVAILABLE,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    setAvailability: (availability) => set({ availability }),
}));

export const openAddToPlaylist = () => useAddToPlaylistStore.getState().open();
