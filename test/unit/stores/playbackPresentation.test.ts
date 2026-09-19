import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    PLAYBACK_PRESENTATION_STORAGE_KEY,
    useSettingsUiStore,
} from '../../../src/stores/useSettingsUiStore';

// test/unit/stores/playbackPresentation.test.ts

describe('playbackPresentation settings', () => {
    let values: Map<string, string>;

    beforeEach(() => {
        values = new Map();
        const storage = {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => {
                values.set(key, value);
            },
            removeItem: (key: string) => {
                values.delete(key);
            },
            clear: () => {
                values.clear();
            },
        };
        vi.stubGlobal('localStorage', storage);
        vi.stubGlobal('window', { localStorage: storage });
        useSettingsUiStore.setState({
            playbackPresentation: 'default',
            autoHidePlayerChrome: false,
            harmonySubtitleBackground: false,
            subtitleOverlayBackground: false,
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it('enables speaker stage with chrome auto-hide and subtitle glows', () => {
        useSettingsUiStore.getState().handleSetPlaybackPresentation('speaker');
        const state = useSettingsUiStore.getState();
        expect(state.playbackPresentation).toBe('speaker');
        expect(state.autoHidePlayerChrome).toBe(true);
        expect(state.harmonySubtitleBackground).toBe(true);
        expect(state.subtitleOverlayBackground).toBe(true);
        expect(localStorage.getItem(PLAYBACK_PRESENTATION_STORAGE_KEY)).toBe('speaker');
    });

    it('toggles speaker stage off without clearing auto-hide sticky preference', () => {
        useSettingsUiStore.getState().handleToggleSpeakerStage(true);
        useSettingsUiStore.getState().handleToggleSpeakerStage(false);
        const state = useSettingsUiStore.getState();
        expect(state.playbackPresentation).toBe('default');
        expect(state.autoHidePlayerChrome).toBe(true);
    });
});
