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
} from './visualizer/geometric/mineradioVisualPresets';
import { VISUALIZER_REGISTRY } from './visualizer/registry';
import LyricColorPresetGrid from './shared/LyricColorPresetGrid';
import LyricWordModeToggle from './shared/LyricWordModeToggle';
import LyricVisualEffectSelector from './shared/LyricVisualEffectSelector';
import LyricFontPresetSelector from './shared/LyricFontPresetSelector';
import { FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX } from './floatingPlayerDockLayout';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import {
    resolveActiveLyricColorPresetId,
    type LyricColorPresetId,
} from '../utils/theme/lyricColorPresets';

// src/components/FloatingPlayerBackgroundMenu.tsx
// Dock popover: high-frequency 3D, lyric mode, color, and font controls.

type FloatingPlayerBackgroundMenuProps = {
    isDaylight?: boolean;
    primaryColor?: string;
    disabled?: boolean;
    visualizerBackgroundMode: VisualizerBackgroundMode | null;
    interactive3dSceneTuning: Interactive3dSceneTuning;
    onVisualizerBackgroundModeChange: (mode: VisualizerBackgroundMode) => void;
    onInteractive3dSceneTuningChange: (patch: Partial<Interactive3dSceneTuning>) => void;
    visualizerMode: VisualizerMode;
    onVisualizerModeChange: (mode: VisualizerMode) => void;
    theme?: Theme | null;
    onApplyLyricColorPreset?: (presetId: LyricColorPresetId) => void;
    onOpenChange?: (open: boolean) => void;
    backgroundMenuLabel: string;
    modeInteractive3dLabel: string;
    modeCommonLabel: string;
    modeMonetLabel: string;
    presetSectionLabel: string;
    lyricsStyleSectionLabel: string;
    lyricColorSectionLabel: string;
    getPresetLabel: (preset: MineradioVisualPresetId) => string;
    getVisualizerLabel: (mode: VisualizerMode) => string;
    buildToolButtonClass: (disabled: boolean, active?: boolean) => string;
};

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
    onOpenChange,
    backgroundMenuLabel,
    presetSectionLabel,
    lyricsStyleSectionLabel,
    lyricColorSectionLabel,
    getPresetLabel,
    getVisualizerLabel,
    buildToolButtonClass,
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const resolvedMode = resolveVisualizerBackgroundMode(visualizerBackgroundMode);
    const lyricWordMode = useSettingsUiStore(state => state.lyricWordMode);
    const lyricFontPresetId = useSettingsUiStore(state => state.lyricFontPresetId);
    const visualEffectIntensity = useSettingsUiStore(state => state.visualEffectIntensity);
    const handleSetLyricWordMode = useSettingsUiStore(state => state.handleSetLyricWordMode);
    const handleSetLyricFontPresetId = useSettingsUiStore(state => state.handleSetLyricFontPresetId);
    const handleSetLyricsCustomFont = useSettingsUiStore(state => state.handleSetLyricsCustomFont);
    const handleSetVisualEffectIntensity = useSettingsUiStore(state => state.handleSetVisualEffectIntensity);

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
                    className={`absolute right-0 z-40 w-[min(360px,92vw)] max-h-[min(82vh,720px)] overscroll-contain overflow-y-auto overflow-x-hidden rounded-2xl border p-3 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${
                        isDaylight
                            ? 'border-black/10 bg-white/92'
                            : 'border-white/12 bg-black/82'
                    }`}
                    style={{ bottom: `calc(100% + ${FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX}px)` }}
                >
                    <div className={`mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        isDaylight ? 'text-black/45' : 'text-white/45'
                    }`}>
                        {presetSectionLabel}
                    </div>
                    <div className="mb-3 grid grid-cols-4 gap-1">
                        {INTERACTIVE3D_VISUAL_PRESET_OPTIONS.map(preset => {
                            const selected = interactive3dSceneTuning.visualPreset === preset;
                            return (
                                <button
                                    key={preset}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={selected}
                                    data-testid={`floating-player-background-preset-${preset}`}
                                    onClick={() => {
                                        if (resolvedMode !== 'interactive3d') {
                                            onVisualizerBackgroundModeChange('interactive3d');
                                        }
                                        onInteractive3dSceneTuningChange(
                                            applyMineradioVisualPreset(preset, interactive3dSceneTuning),
                                        );
                                    }}
                                    className={`rounded-lg px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors ${optionButtonClass(selected, isDaylight)}`}
                                >
                                    {getPresetLabel(preset) || getMineradioPresetLabelFallback(preset)}
                                </button>
                            );
                        })}
                    </div>

                    <div className={`mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        isDaylight ? 'text-black/45' : 'text-white/45'
                    }`}>
                        {lyricsStyleSectionLabel}
                    </div>
                    <div className="mb-3 grid grid-cols-3 gap-1" data-testid="floating-player-lyrics-style-group">
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
                                    className={`rounded-lg px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors ${optionButtonClass(selected, isDaylight)}`}
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
                            wellClassName={isDaylight ? 'bg-black/[0.04]' : 'bg-white/[0.06]'}
                            buttonClassName={selected => `rounded-lg px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors ${optionButtonClass(selected, isDaylight)}`}
                            testIdPrefix="floating-player-lyric-word-mode"
                        />
                    </div>

                    {onApplyLyricColorPreset ? (
                        <>
                            <div className={`mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-[0.12em] ${
                                isDaylight ? 'text-black/55' : 'text-white/60'
                            }`}>
                                {lyricColorSectionLabel}
                            </div>
                            <div className={`rounded-xl p-1.5 ${isDaylight ? 'bg-black/[0.05]' : 'bg-white/[0.07]'}`}>
                                <LyricColorPresetGrid
                                    emphasis
                                    onSelect={onApplyLyricColorPreset}
                                    activePresetId={resolveActiveLyricColorPresetId(
                                        theme,
                                        isDaylight ? 'light' : 'dark',
                                    )}
                                    isDaylight={isDaylight}
                                    className="!grid-cols-2 gap-2"
                                    buttonClassName="w-full"
                                    inactiveButtonClassName={isDaylight
                                        ? 'text-black/90 hover:bg-black/5'
                                        : 'text-white/95 hover:bg-white/10'}
                                    activeButtonClassName={isDaylight
                                        ? 'bg-white text-stone-950 shadow-sm ring-1 ring-black/10'
                                        : 'bg-white text-zinc-950 shadow-sm ring-1 ring-white/35'}
                                />
                            </div>

                            {/* Typography block: lyric font */}
                            <div className={`mt-3 border-t pt-3 ${
                                isDaylight ? 'border-black/10' : 'border-white/10'
                            }`}>
                                <div className={`mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-[0.12em] ${
                                    isDaylight ? 'text-black/55' : 'text-white/60'
                                }`}>
                                    {t('options.lyricFontPreset') || '歌词字体'}
                                </div>
                                <div className={`rounded-xl p-1.5 ${isDaylight ? 'bg-black/[0.05]' : 'bg-white/[0.07]'}`}>
                                    <LyricFontPresetSelector
                                        selectedPresetId={lyricFontPresetId}
                                        onPresetChange={(presetId) => {
                                            handleSetLyricsCustomFont(null);
                                            handleSetLyricFontPresetId(presetId);
                                        }}
                                        isDaylight={isDaylight}
                                    />
                                </div>
                            </div>

                            {/* Effect intensity block */}
                            <div className={`mt-3 border-t pt-3 ${
                                isDaylight ? 'border-black/10' : 'border-white/10'
                            }`}>
                                <div className={`mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-[0.12em] ${
                                    isDaylight ? 'text-black/55' : 'text-white/60'
                                }`}>
                                    {t('options.visualEffectIntensity') || '效果强度'}
                                </div>
                                <div className={`rounded-xl p-1.5 ${isDaylight ? 'bg-black/[0.05]' : 'bg-white/[0.07]'}`}>
                                    <LyricVisualEffectSelector
                                        selectedIntensity={visualEffectIntensity}
                                        onIntensityChange={handleSetVisualEffectIntensity}
                                        isDaylight={isDaylight}
                                    />
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default FloatingPlayerBackgroundMenu;
