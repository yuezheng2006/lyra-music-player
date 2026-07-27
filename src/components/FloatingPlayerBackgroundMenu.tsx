import React, { useEffect, useRef, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
    Interactive3dSceneTuning,
    MineradioVisualPresetId,
    Theme,
    VisualizerBackgroundMode,
    VisualizerMode,
} from '../types';
import { resolveVisualizerBackgroundMode } from '../stores/useSettingsUiStore';
import {
    applyMineradioVisualPreset,
    getMineradioPresetLabelFallback,
    INTERACTIVE3D_VISUAL_PRESET_OPTIONS,
    normalizeInteractive3dVisualPreset,
} from './visualizer/geometric/mineradioVisualPresets';
import { VISUALIZER_REGISTRY } from './visualizer/registry';
import LyricColorPresetGrid from './shared/LyricColorPresetGrid';
import LyricWordModeToggle from './shared/LyricWordModeToggle';
import { FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX } from './floatingPlayerDockLayout';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import {
    resolveActiveLyricColorPresetId,
    type LyricColorPresetId,
} from '../utils/theme/lyricColorPresets';
import { readGpuUnstableFlag } from '../utils/performance/gpuUnstableStorage';
import { LYRICS_FONT_SCALE_QUICK_OPTIONS } from '../utils/lyrics/lyricsFontScaleMath';
import GpuBackgroundFallbackNote, {
    shouldShowGpuBackgroundFallbackNote,
} from './shared/GpuBackgroundFallbackNote';

// src/components/FloatingPlayerBackgroundMenu.tsx
// Dock popover: lightweight presets + open song settings. Full editors live in ControlsTab.

type FloatingPlayerBackgroundMenuProps = {
    isDaylight?: boolean;
    disabled?: boolean;
    visualizerBackgroundMode: VisualizerBackgroundMode | null;
    interactive3dSceneTuning: Interactive3dSceneTuning;
    onVisualizerBackgroundModeChange: (mode: VisualizerBackgroundMode) => void;
    onInteractive3dSceneTuningChange: (patch: Partial<Interactive3dSceneTuning>) => void;
    visualizerMode: VisualizerMode;
    onVisualizerModeChange: (mode: VisualizerMode) => void;
    theme?: Theme | null;
    onApplyLyricColorPreset?: (presetId: LyricColorPresetId) => void;
    onOpenSongSettings?: () => void;
    onOpenChange?: (open: boolean) => void;
    /** Enter player view so heavy backgrounds are visible (home shell covers the stage). */
    onEnsurePlayerView?: () => void;
    backgroundMenuLabel: string;
    /** Label for the flat/common background chip (default engine). */
    backgroundModeCommonLabel: string;
    presetSectionLabel: string;
    lyricsStyleSectionLabel: string;
    lyricColorSectionLabel: string;
    openSongSettingsLabel: string;
    getPresetLabel: (preset: MineradioVisualPresetId) => string;
    getVisualizerLabel: (mode: VisualizerMode) => string;
    buildToolButtonClass: (disabled: boolean, active?: boolean) => string;
};

const nearScale = (left: number, right: number) => Math.abs(left - right) < 0.02;

const optionButtonClass = (selected: boolean, isDaylight?: boolean) => (
    selected
        ? (isDaylight ? 'bg-black/12 text-black font-semibold' : 'bg-white/20 text-white font-semibold')
        : (isDaylight ? 'text-black/85 hover:bg-black/5' : 'text-white/92 hover:bg-white/10')
);

const FloatingPlayerBackgroundMenu: React.FC<FloatingPlayerBackgroundMenuProps> = ({
    isDaylight,
    disabled = false,
    visualizerBackgroundMode,
    interactive3dSceneTuning,
    onVisualizerBackgroundModeChange,
    onInteractive3dSceneTuningChange,
    visualizerMode,
    onVisualizerModeChange,
    theme = null,
    onApplyLyricColorPreset,
    onOpenSongSettings,
    onOpenChange,
    onEnsurePlayerView,
    backgroundMenuLabel,
    backgroundModeCommonLabel,
    presetSectionLabel,
    lyricsStyleSectionLabel,
    lyricColorSectionLabel,
    openSongSettingsLabel,
    getPresetLabel,
    getVisualizerLabel,
    buildToolButtonClass,
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [gpuUnstable, setGpuUnstable] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const resolvedMode = resolveVisualizerBackgroundMode(visualizerBackgroundMode);
    const activeInteractive3dPreset = normalizeInteractive3dVisualPreset(
        interactive3dSceneTuning.visualPreset,
    );
    const lyricWordMode = useSettingsUiStore(state => state.lyricWordMode);
    const lyricsFontScale = useSettingsUiStore(state => state.lyricsFontScale);
    const handleSetLyricWordMode = useSettingsUiStore(state => state.handleSetLyricWordMode);
    const handleSetLyricsFontScale = useSettingsUiStore(state => state.handleSetLyricsFontScale);

    // Heavy backgrounds paint on the player page (home solid shell covers the stage).
    // Selecting interactive3d clears GPU lockout in the store — then enter player.
    const selectPlayerBackground = (mode: VisualizerBackgroundMode) => {
        onVisualizerBackgroundModeChange(mode);
        const locked = readGpuUnstableFlag(
            typeof localStorage !== 'undefined' ? localStorage : null,
        );
        setGpuUnstable(locked);
        if (mode === 'interactive3d' || (mode !== 'common' && !locked)) {
            onEnsurePlayerView?.();
        }
    };

    useEffect(() => {
        onOpenChange?.(open);
        return () => {
            if (open) onOpenChange?.(false);
        };
    }, [onOpenChange, open]);

    useEffect(() => {
        if (!open) return;
        setGpuUnstable(readGpuUnstableFlag(typeof localStorage !== 'undefined' ? localStorage : null));
        const handlePointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        window.addEventListener('mousedown', handlePointerDown);
        return () => window.removeEventListener('mousedown', handlePointerDown);
    }, [open]);

    const sectionLabelClass = `mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
        isDaylight ? 'text-black/45' : 'text-white/45'
    }`;
    const chipClass = (selected: boolean) => (
        `rounded-lg px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors ${optionButtonClass(selected, isDaylight)}`
    );

    return (
        <div className="relative shrink-0" ref={rootRef}>
            <button
                type="button"
                data-testid="floating-player-background-menu-trigger"
                onClick={() => {
                    if (disabled) return;
                    setOpen(value => !value);
                }}
                disabled={disabled}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-180 ${buildToolButtonClass(disabled, open)}`}
                title={backgroundMenuLabel}
                aria-label={backgroundMenuLabel}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <Settings2 size={16} strokeWidth={1.9} />
            </button>

            {open ? (
                <div
                    role="menu"
                    data-testid="floating-player-background-menu"
                    data-app-ui-surface="true"
                    className={`absolute right-0 z-40 w-[min(360px,94vw)] max-h-[min(85vh,720px)] overscroll-contain overflow-y-auto overflow-x-hidden rounded-2xl border p-3 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${
                        isDaylight
                            ? 'border-black/10 bg-white/92'
                            : 'border-white/12 bg-black/82'
                    }`}
                    style={{ bottom: `calc(100% + ${FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX}px)` }}
                >
                    <div className={sectionLabelClass}>
                        {presetSectionLabel}
                    </div>
                    <GpuBackgroundFallbackNote
                        visible={shouldShowGpuBackgroundFallbackNote({
                            resolvedMode,
                            storage: typeof localStorage !== 'undefined' ? localStorage : null,
                        })}
                        isDaylight={isDaylight}
                        variant="menu"
                    />
                    <div className="mb-3 grid grid-cols-6 gap-1">
                        <button
                            type="button"
                            role="menuitemradio"
                            aria-checked={resolvedMode === 'common'}
                            data-testid="floating-player-background-preset-common"
                            onClick={() => selectPlayerBackground('common')}
                            className={chipClass(resolvedMode === 'common')}
                        >
                            {backgroundModeCommonLabel
                                || t('options.visualizerBackgroundModeCommon')
                                || 'Common'}
                        </button>
                        {INTERACTIVE3D_VISUAL_PRESET_OPTIONS.map(preset => {
                            // Match via normalized id so legacy stored presets still highlight.
                            const selected = resolvedMode === 'interactive3d'
                                && activeInteractive3dPreset === preset;
                            return (
                                <button
                                    key={preset}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={selected}
                                    data-testid={`floating-player-background-preset-${preset}`}
                                    onClick={() => {
                                        if (resolvedMode !== 'interactive3d') {
                                            selectPlayerBackground('interactive3d');
                                        } else if (!readGpuUnstableFlag(
                                            typeof localStorage !== 'undefined' ? localStorage : null,
                                        )) {
                                            onEnsurePlayerView?.();
                                        }
                                        onInteractive3dSceneTuningChange(
                                            applyMineradioVisualPreset(preset, interactive3dSceneTuning),
                                        );
                                    }}
                                    className={chipClass(selected)}
                                >
                                    {getPresetLabel(preset) || getMineradioPresetLabelFallback(preset)}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            role="menuitemradio"
                            aria-checked={resolvedMode === 'latent'}
                            data-testid="floating-player-background-preset-latent"
                            onClick={() => selectPlayerBackground('latent')}
                            className={chipClass(resolvedMode === 'latent')}
                        >
                            {t('options.visualizerBackgroundModeLatent') || 'Latent'}
                        </button>
                    </div>

                    <div className={sectionLabelClass}>
                        {lyricsStyleSectionLabel}
                    </div>
                    <div className="mb-3 grid grid-cols-4 gap-1" data-testid="floating-player-lyrics-style-group">
                        {VISUALIZER_REGISTRY.map(entry => {
                            const selected = entry.mode === visualizerMode;
                            return (
                                <button
                                    key={entry.mode}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={selected}
                                    data-testid={`floating-player-lyrics-style-${entry.mode}`}
                                    onClick={() => onVisualizerModeChange(entry.mode)}
                                    className={chipClass(selected)}
                                >
                                    {getVisualizerLabel(entry.mode) || entry.labelFallback}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mb-3">
                        <LyricWordModeToggle
                            value={lyricWordMode}
                            onChange={handleSetLyricWordMode}
                            sectionLabel={t('ui.lyricWordMode') || 'Word mode'}
                            defaultLabel={t('ui.lyricWordModeDefault') || 'Default'}
                            karaokeLabel={t('ui.lyricWordModeKaraoke') || t('ui.visualizerKaraoke') || 'Karaoke'}
                            ktvLabel={t('ui.lyricWordModeKtv') || 'KTV'}
                            wellClassName={isDaylight ? 'bg-black/[0.04]' : 'bg-white/[0.06]'}
                            buttonClassName={selected => chipClass(selected)}
                            testIdPrefix="floating-player-lyric-word-mode"
                        />
                    </div>

                    {onApplyLyricColorPreset ? (
                        <>
                            <div className={sectionLabelClass}>
                                {lyricColorSectionLabel}
                            </div>
                            <div className={`mb-3 rounded-xl p-1.5 ${isDaylight ? 'bg-black/[0.05]' : 'bg-white/[0.07]'}`}>
                                <LyricColorPresetGrid
                                    tile
                                    onSelect={onApplyLyricColorPreset}
                                    activePresetId={resolveActiveLyricColorPresetId(
                                        theme,
                                        isDaylight ? 'light' : 'dark',
                                    )}
                                    isDaylight={isDaylight}
                                    buttonClassName="w-full"
                                    inactiveButtonClassName={isDaylight
                                        ? 'text-black/90 hover:bg-black/5'
                                        : 'text-white/95 hover:bg-white/10'}
                                    activeButtonClassName={isDaylight
                                        ? 'bg-white text-stone-950 shadow-sm ring-1 ring-black/10'
                                        : 'bg-white text-zinc-950 shadow-sm ring-1 ring-white/35'}
                                />
                            </div>
                        </>
                    ) : null}

                    <div className={sectionLabelClass}>
                        {t('options.fontSize') || '字号'}
                        <span className="ml-2 font-mono normal-case tracking-normal opacity-55">
                            {Math.round(lyricsFontScale * 100)}%
                        </span>
                    </div>
                    <div
                        className={`mb-3 grid grid-cols-4 gap-1 rounded-xl p-1 ${isDaylight ? 'bg-black/[0.05]' : 'bg-white/[0.07]'}`}
                        data-testid="floating-player-font-scale-group"
                    >
                        {LYRICS_FONT_SCALE_QUICK_OPTIONS.map(option => {
                            const selected = nearScale(lyricsFontScale, option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={selected}
                                    data-testid={`floating-player-font-scale-${option.value}`}
                                    onClick={() => handleSetLyricsFontScale(option.value)}
                                    className={chipClass(selected)}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>

                    {onOpenSongSettings ? (
                        <button
                            type="button"
                            role="menuitem"
                            data-testid="floating-player-open-song-settings"
                            onClick={() => {
                                onOpenSongSettings();
                                setOpen(false);
                            }}
                            className={`w-full rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold transition-colors ${
                                isDaylight
                                    ? 'bg-black/[0.06] text-black/85 hover:bg-black/[0.1]'
                                    : 'bg-white/[0.08] text-white/90 hover:bg-white/[0.14]'
                            }`}
                        >
                            {openSongSettingsLabel}
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default FloatingPlayerBackgroundMenu;
