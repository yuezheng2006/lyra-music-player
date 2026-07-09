import { create } from 'zustand';
import { useSearchNavigationStore } from './useSearchNavigationStore';

// src/stores/useOnlineGuestStore.ts
// Tracks whether a QQ-only guest has entered the online library surface.

const ONLINE_GUEST_ENTERED_KEY = 'folia_online_guest_entered';

const readEntered = (): boolean => {
    if (typeof sessionStorage === 'undefined') {
        return false;
    }
    return sessionStorage.getItem(ONLINE_GUEST_ENTERED_KEY) === '1';
};

type OnlineGuestState = {
    entered: boolean;
    enter: () => void;
    reset: () => void;
};

export const useOnlineGuestStore = create<OnlineGuestState>((set) => ({
    entered: readEntered(),
    enter: () => {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(ONLINE_GUEST_ENTERED_KEY, '1');
        }
        useSearchNavigationStore.getState().setHomeViewTab('playlist');
        set({ entered: true });
    },
    reset: () => {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(ONLINE_GUEST_ENTERED_KEY);
        }
        set({ entered: false });
    },
}));
