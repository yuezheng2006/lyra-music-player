import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
    Interactive3dSceneTuning,
    MineradioVisualPresetId,
    Theme,
    VisualizerBackgroundMode,
    VisualizerMode,
} from '../types';
import { resolveVisualizerBackgroundMode, useSettingsUiStore } from '../stores/useSettingsUiStore';
import { getVisualizerModeLabel, VISUALIZER_REGISTRY } from './visualizer/registry';
import { FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX } from './floatingPlayerDockLayout';
import { readGpuUnstableFlag } from '../utils/performance/gpuUnstableStorage';
import { LYRICS_FONT_SCALE_QUICK_OPTIONS } from '../utils/lyrics/lyricsFontScaleMath';
import GpuBackgroundFallbackNote, {
    shouldShowGpuBackgroundFallbackNote,
} from './shared/GpuBackgroundFallbackNote';
import {
    getPanelBackgroundModeLabel,
    resolveDockBackgroundModes,
} from '../utils/visualizer/panelBackgroundModes';
import { useVisualizerModeStepper } from '../hooks/useVisualizerModeStepper';
import ModeStepperRow from './panelTab/controls/ModeStepperRow';
import { VisualizerModeGlyph } from './panelTab/controls/modeGlyphs';

// src/components/FloatingPlayerBackgroundMenu.tsx
// Dock popover: background + lyric stepper + type size. Full editors live in song settings.

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
    onApplyLyricColorPreset?: (presetId: unknown) => void;
    onOpenSongSettings?: () => void;
    onOpenChange?: (open: boolean) => void;
    onEnsurePlayerView?: () => void;
    backgroundMenuLabel: string;
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
    interactive3dSceneTuning: _interactive3dSceneTuning,
    onVisualizerBackgroundModeChange,
    onInteractive3dSceneTuningChange: _onInteractive3dSceneTuningChange,
    visualizerMode,
    onVisualizerModeChange,
    theme = null,
    onOpenSongSettings,
    onOpenChange,
    onEnsurePlayerView,
    backgroundMenuLabel,
    backgroundModeCommonLabel,
    presetSectionLabel,
    lyricsStyleSectionLabel,
    openSongSettingsLabel,
    getPresetLabel: _getPresetLabel,
    getVisualizerLabel,
    buildToolButtonClass,
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const resolvedMode = resolveVisualizerBackgroundMode(visualizerBackgroundMode);
    const lyricsFontScale = useSettingsUiStore(state => state.lyricsFontScale);
    const handleSetLyricsFontScale = useSettingsUiStore(state => state.handleSetLyricsFontScale);
    const dockBackgroundModes = useMemo(() => resolveDockBackgroundModes(resolvedMode), [resolvedMode]);
    const visualizerOptions = useMemo(() => VISUALIZER_REGISTRY.map(entry => ({
        value: entry.mode,
        label: getVisualizerLabel(entry.mode) || getVisualizerModeLabel(entry.mode, t) || entry.labelFallback,
    })), [getVisualizerLabel, t]);
    const stepVisualizerMode = useVisualizerModeStepper(visualizerOptions.map(option => option.value));
    const primaryColor = theme?.primaryColor || (isDaylight ? '#171717' : '#f4f4f5');

    const selectPlayerBackground = (mode: VisualizerBackgroundMode) => {
        onVisualizerBackgroundModeChange(mode);
        const locked = readGpuUnstableFlag(
            typeof localStorage !== 'undefined' ? localStorage : null,
        );
        if (mode !== 'common' && !locked) {
            onEnsurePlayerView?.();
        }
    };

    const openSongSettings = () => {
        onOpenSongSettings?.();
        setOpen(false);
    };

    useEffect(() => {
        onOpenChange?.(open);
        return () => {
            if (open) onOpenChange?.(false);
        };
    }, [onOpenChange, open]);

    useEffect(() => {
        if (!open) return;
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
        `shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold leading-tight whitespace-nowrap transition-colors ${optionButtonClass(selected, isDaylight)}`
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
                    className={`absolute right-0 z-40 w-[min(300px,94vw)] max-h-[min(70vh,520px)] overscroll-contain overflow-y-auto overflow-x-hidden rounded-2xl border p-3 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${
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
                    <div className="mb-3 flex flex-wrap gap-1">
                        {dockBackgroundModes.map(mode => (
                            <button
                                key={mode}
                                type="button"
                                role="menuitemradio"
                                aria-checked={resolvedMode === mode}
                                data-testid={`floating-player-background-preset-${mode}`}
                                onClick={() => selectPlayerBackground(mode)}
                                className={chipClass(resolvedMode === mode)}
                            >
                                {mode === 'common'
                                    ? (backgroundModeCommonLabel
                                        || t('options.visualizerBackgroundModeCommon')
                                        || 'Common')
                                    : getPanelBackgroundModeLabel(mode, t)}
                            </button>
                        ))}
                    </div>

                    <div className={sectionLabelClass}>
                        {lyricsStyleSectionLabel}
                    </div>
                    <div className="mb-3" data-testid="floating-player-lyrics-style-group">
                        <ModeStepperRow
                            value={visualizerMode}
                            options={visualizerOptions}
                            onSelect={onVisualizerModeChange}
                            onStep={stepVisualizerMode}
                            renderGlyph={mode => <VisualizerModeGlyph mode={mode} />}
                            ariaLabel={lyricsStyleSectionLabel}
                            moreLabel={openSongSettingsLabel}
                            onOpenMore={openSongSettings}
                            isDaylight={Boolean(isDaylight)}
                            primaryColor={primaryColor}
                            testIdPrefix="floating-player-lyrics-style"
                        />
                    </div>

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
                            onClick={openSongSettings}
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
