import { describe, expect, it, vi } from 'vitest';
import { applyImportedAppearanceConfig, type AppearanceImportApplyStore } from '@/utils/appearanceImportApply';

// test/unit/utils/appearanceImportApply.test.ts
// Applying an import is gated by the keys the confirmation dialog selected.

const createStore = (): AppearanceImportApplyStore & { calls: Record<string, unknown[]> } => {
    const calls: Record<string, unknown[]> = {};
    const track = <T extends (...args: never[]) => void>(name: string, fn: T): T => {
        calls[name] = [];
        return ((...args: never[]) => {
            calls[name].push(args);
            fn(...args);
        }) as T;
    };

    return {
        calls,
        urlBackgroundList: [],
        handleSetVisualizerMode: track('visualizerMode', () => {}),
        handleSetLyricWordMode: track('lyricWordMode', () => {}),
        handleSetLyricFontPresetId: track('lyricFontPresetId', () => {}),
        handleSetLyricEffectPackId: track('lyricEffectPackId', () => {}),
        handleSetVisualEffectIntensity: track('visualEffectIntensity', () => {}),
        handleSetVisualizerBackgroundMode: track('visualizerBackgroundMode', () => {}),
        handleSetBackgroundOpacity: track('backgroundOpacity', () => {}),
        handleSetVisualizerOpacity: track('visualizerOpacity', () => {}),
        handleToggleHidePlayerTranslationSubtitle: track('hidePlayerTranslationSubtitle', () => {}),
        handleToggleShowSubtitleTranslation: track('showSubtitleTranslation', () => {}),
        handleSetSubtitleContentMode: track('subtitleContentMode', () => {}),
        handleToggleShowHarmonySubtitle: track('showHarmonySubtitle', () => {}),
        handleToggleHarmonySubtitleBackground: track('harmonySubtitleBackground', () => {}),
        handleSetPlaybackPresentation: track('playbackPresentation', () => {}),
        handleSetSubtitleFontScale: track('subtitleFontScale', () => {}),
        handleToggleSubtitleOverlayBackground: track('subtitleOverlayBackground', () => {}),
        handleSetSubtitleFontInheritsLyrics: track('subtitleFontInheritsLyrics', () => {}),
        handleSetSubtitleFontStyle: track('subtitleFontStyle', () => {}),
        handleSetSubtitleFontFamily: track('subtitleFontFamily', () => {}),
        handleSetLyricsFontStyle: track('lyricsFontStyle', () => {}),
        handleSetLyricsFontScale: track('lyricsFontScale', () => {}),
        handleSetClassicTuning: track('classicTuning', () => {}),
        handleSetCadenzaTuning: track('cadenzaTuning', () => {}),
        handleSetPartitaTuning: track('partitaTuning', () => {}),
        handleSetFumeTuning: track('fumeTuning', () => {}),
        handleSetCladdaghTuning: track('claddaghTuning', () => {}),
        handleSetCappellaTuning: track('cappellaTuning', () => {}),
        handleSetTiltTuning: track('tiltTuning', () => {}),
        handleSetPendoloTuning: track('pendoloTuning', () => {}),
        handleSetMonetBackgroundTuning: track('monetBackgroundTuning', () => {}),
        handleSetLatentBackgroundTuning: track('latentBackgroundTuning', () => {}),
        handleSetNomandBackgroundTuning: track('nomandBackgroundTuning', () => {}),
        handleSetInteractive3dSceneTuning: track('interactive3dSceneTuning', () => {}),
        handleSetMonetTuning: track('monetTuning', () => {}),
        handleSetUrlBackgroundList: track('urlBackgroundList', () => {}),
        handleSetUrlBackgroundSelectedId: track('urlBackgroundSelectedId', () => {}),
        handleToggleEnableSmartAtmosphere: track('enableSmartAtmosphere', () => {}),
        handleToggleEnable3dInteractiveBackground: track('enable3dInteractiveBackground', () => {}),
        handleSetStageTrackPillMode: track('stageTrackPillMode', () => {}),
        handleSetStageTrackPillTimeoutSec: track('stageTrackPillTimeoutSec', () => {}),
        handleToggleStageTrackPillOnHome: track('stageTrackPillOnHome', () => {}),
    };
};

describe('applyImportedAppearanceConfig', () => {
    it('applies only the selected keys', () => {
        const store = createStore();
        const onSaveCustomTheme = vi.fn();
        const onApplyCustomTheme = vi.fn();
        const onToggleSongThemeAutoSwitch = vi.fn();
        const onToggleSongThemeAutoGenerate = vi.fn();

        applyImportedAppearanceConfig({
            config: {
                visualizerMode: 'monet',
                backgroundOpacity: 0.2,
                lyricsFontScale: 1.4,
            },
            keys: ['visualizerMode'],
            onSaveCustomTheme,
            onApplyCustomTheme,
            onToggleSongThemeAutoSwitch,
            onToggleSongThemeAutoGenerate,
            store,
            setPerformanceMode: vi.fn(),
            setAmbientVisualEnabled: vi.fn(),
            setMagneticPullEnabled: vi.fn(),
            setEmotionScrambleEnabled: vi.fn(),
            setEmotionBeatPulseEnabled: vi.fn(),
        });

        expect(store.calls.visualizerMode).toEqual([['monet']]);
        expect(store.calls.backgroundOpacity).toEqual([]);
        expect(store.calls.lyricsFontScale).toEqual([]);
        expect(onSaveCustomTheme).not.toHaveBeenCalled();
        expect(onApplyCustomTheme).not.toHaveBeenCalled();
    });

    it('saves only the picked theme side', () => {
        const store = createStore();
        const onSaveCustomTheme = vi.fn();
        const current = {
            light: { name: 'Current Light', backgroundColor: '#fff', primaryColor: '#000', accentColor: '#111', secondaryColor: '#222' },
            dark: { name: 'Current Dark', backgroundColor: '#000', primaryColor: '#fff', accentColor: '#333', secondaryColor: '#444' },
        };
        const incoming = {
            light: { name: 'New Light', backgroundColor: '#eee', primaryColor: '#111', accentColor: '#aaa', secondaryColor: '#bbb' },
            dark: { name: 'New Dark', backgroundColor: '#010', primaryColor: '#f0f', accentColor: '#ccc', secondaryColor: '#ddd' },
        };

        applyImportedAppearanceConfig({
            config: { theme: incoming },
            keys: ['themeDark'],
            customTheme: current as never,
            onSaveCustomTheme,
            onApplyCustomTheme: vi.fn(),
            onToggleSongThemeAutoSwitch: vi.fn(),
            onToggleSongThemeAutoGenerate: vi.fn(),
            store,
            setPerformanceMode: vi.fn(),
            setAmbientVisualEnabled: vi.fn(),
            setMagneticPullEnabled: vi.fn(),
            setEmotionScrambleEnabled: vi.fn(),
            setEmotionBeatPulseEnabled: vi.fn(),
        });

        expect(onSaveCustomTheme).toHaveBeenCalledTimes(1);
        expect(onSaveCustomTheme.mock.calls[0][0]).toMatchObject({
            light: current.light,
            dark: incoming.dark,
        });
    });
});
