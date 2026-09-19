import { describe, expect, it } from 'vitest';
import {
    resolveDefaultDisableHomeDynamicBackground,
    resolveShouldPauseVisualizerBackground,
    shouldResolveCompanionVideoForSong,
} from '@/utils/playback/playbackLoadPriorityMath';

// Guards playback-first loading: skip wasted work and pause heavy visuals.

describe('playbackLoadPriorityMath', () => {
    it('skips companion video resolve for Netease / unset provider', () => {
        expect(shouldResolveCompanionVideoForSong({ musicProvider: 'netease' })).toBe(false);
        expect(shouldResolveCompanionVideoForSong({})).toBe(false);
        expect(shouldResolveCompanionVideoForSong({ musicProvider: 'bilibili' })).toBe(true);
    });

    it('skips companion video resolve for RSS podcast enclosures', () => {
        expect(shouldResolveCompanionVideoForSong({
            musicProvider: 'rss',
            contentType: 'podcast',
            audioUrl: 'https://cdn.example/ep.mp3',
        })).toBe(false);
    });

    it('pauses visualizer while player is open without audioSrc', () => {
        expect(resolveShouldPauseVisualizerBackground({
            currentView: 'player',
            disableHomeDynamicBackground: false,
            audioSrc: null,
        })).toBe(true);

        expect(resolveShouldPauseVisualizerBackground({
            currentView: 'player',
            disableHomeDynamicBackground: false,
            audioSrc: 'https://cdn.example/a.mp3',
        })).toBe(false);
    });

    it('pauses off-player only when disableHomeDynamicBackground is on', () => {
        expect(resolveShouldPauseVisualizerBackground({
            currentView: 'home',
            disableHomeDynamicBackground: true,
            audioSrc: null,
        })).toBe(true);

        expect(resolveShouldPauseVisualizerBackground({
            currentView: 'home',
            disableHomeDynamicBackground: false,
            audioSrc: null,
        })).toBe(false);

        // Home solid shell hides the stage; keep GPU paused even with audioSrc.
        expect(resolveShouldPauseVisualizerBackground({
            currentView: 'home',
            disableHomeDynamicBackground: true,
            audioSrc: 'https://cdn.example/a.mp3',
        })).toBe(true);
    });

    it('defaults Electron home to pause heavy backgrounds', () => {
        expect(resolveDefaultDisableHomeDynamicBackground({
            isElectron: true,
            stored: null,
        })).toBe(true);
        expect(resolveDefaultDisableHomeDynamicBackground({
            isElectron: false,
            stored: null,
        })).toBe(false);
        expect(resolveDefaultDisableHomeDynamicBackground({
            isElectron: true,
            stored: false,
        })).toBe(false);
    });
});
