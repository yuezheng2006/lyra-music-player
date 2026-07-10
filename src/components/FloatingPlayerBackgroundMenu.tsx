import React, { useEffect, useRef, useState } from 'react';
import { Settings2 } from 'lucide-react';
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
import { FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX } from './floatingPlayerDockLayout';
import {
    resolveActiveLyricColorPresetId,
    type LyricColorPresetId,
} from '../utils/theme/lyricColorPresets';

// src/components/FloatingPlayerBackgroundMenu.tsx
// Dock popover: background mode, 3D preset, lyric walk, and lyric color presets.

const DOCK_BACKGROUND_MODES: VisualizerBackgroundMode[] = ['interactive3d', 'common', 'monet'];

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

const getModeLabel = (
    mode: VisualizerBackgroundMode,
    labels: Pick<
        FloatingPlayerBackgroundMenuProps,
        'modeInteractive3dLabel' | 'modeCommonLabel' | 'modeMonetLabel'
    >,
) => {
    switch (mode) {
        case 'interactive3d':
            return labels.modeInteractive3dLabel;
        case 'common':
            return labels.modeCommonLabel;
        case 'monet':
            return labels.modeMonetLabel;
        default:
            return mode;
    }
};

const optionButtonClass = (selected: boolean, isDaylight?: boolean) => (
    selected
        ? (isDaylight ? 'bg-black/12 text-black' : 'bg-white/18 text-white')
        : (isDaylight ? 'text-black/65 hover:bg-black/5' : 'text-white/78 hover:bg-white/10')
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
    modeInteractive3dLabel,
    modeCommonLabel,
    modeMonetLabel,
    presetSectionLabel,
    lyricsStyleSectionLabel,
    lyricColorSectionLabel,
    getPresetLabel,
    getVisualizerLabel,
    buildToolButtonClass,
}) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const resolvedMode = resolveVisualizerBackgroundMode(visualizerBackgroundMode);
    const isInteractive3d = resolvedMode === 'interactive3d';
    const modeLabels = { modeInteractive3dLabel, modeCommonLabel, modeMonetLabel };

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
                    className={`absolute right-0 z-40 w-[256px] max-h-[min(72vh,460px)] overflow-y-auto overflow-x-hidden rounded-2xl border p-1.5 pb-2 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${
                        isDaylight
                            ? 'border-black/10 bg-white/92'
                            : 'border-white/12 bg-black/82'
                    }`}
                    style={{ bottom: `calc(100% + ${FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX}px)` }}
                >
                    <div className={`mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        isDaylight ? 'text-black/45' : 'text-white/45'
                    }`}>
                        {backgroundMenuLabel}
                    </div>
                    <div className={`mb-1.5 grid grid-cols-3 gap-0.5 rounded-xl p-0.5 ${
                        isDaylight ? 'bg-black/[0.04]' : 'bg-white/[0.06]'
                    }`}>
                        {DOCK_BACKGROUND_MODES.map(mode => {
                            const selected = resolvedMode === mode;
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={selected}
                                    data-testid={`floating-player-background-mode-${mode}`}
                                    onClick={() => onVisualizerBackgroundModeChange(mode)}
                                    className={`rounded-lg px-1 py-1 text-[11px] font-semibold transition-colors ${optionButtonClass(selected, isDaylight)}`}
                                >
                                    {getModeLabel(mode, modeLabels)}
                                </button>
                            );
                        })}
                    </div>

                    {isInteractive3d ? (
                        <>
                            <div className={`mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                isDaylight ? 'text-black/45' : 'text-white/45'
                            }`}>
                                {presetSectionLabel}
                            </div>
<div className="mb-1.5 grid grid-cols-3 gap-0.5">
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
                                                // Selecting a 3D style also locks background mode to interactive3d
                                                // so the choice is active and persisted together.
                                                if (resolvedMode !== 'interactive3d') {
                                                    onVisualizerBackgroundModeChange('interactive3d');
                                                }
                                                onInteractive3dSceneTuningChange(
                                                    applyMineradioVisualPreset(preset, interactive3dSceneTuning),
                                                );
                                            }}
                                            className={`rounded-lg px-1 py-1 text-[11px] font-semibold transition-colors ${optionButtonClass(selected, isDaylight)}`}
                                        >
                                            {getPresetLabel(preset) || getMineradioPresetLabelFallback(preset)}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    ) : null}

                    <div className={`mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        isDaylight ? 'text-black/45' : 'text-white/45'
                    }`}>
                        {lyricsStyleSectionLabel}
                    </div>
                    <div className="mb-1.5 grid grid-cols-4 gap-0.5" data-testid="floating-player-lyrics-style-group">
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
                                    className={`rounded-lg px-0.5 py-1 text-[10px] font-semibold transition-colors ${optionButtonClass(selected, isDaylight)}`}
                                >
                                    {getVisualizerLabel(entry.mode) || entry.labelFallback}
                                </button>
                            );
                        })}
                    </div>

                    {onApplyLyricColorPreset ? (
                        <>
                            <div className={`mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                isDaylight ? 'text-black/45' : 'text-white/45'
                            }`}>
                                {lyricColorSectionLabel}
                            </div>
                            <div className={`rounded-xl p-0.5 ${isDaylight ? 'bg-black/[0.04]' : 'bg-white/[0.06]'}`}>
                                <LyricColorPresetGrid
                                    compact
                                    onSelect={onApplyLyricColorPreset}
                                    activePresetId={resolveActiveLyricColorPresetId(
                                        theme,
                                        isDaylight ? 'light' : 'dark',
                                    )}
                                    isDaylight={isDaylight}
                                    className="!grid-cols-2 gap-0.5"
                                    buttonClassName="w-full rounded-md px-1.5 py-1"
                                    inactiveButtonClassName={isDaylight
                                        ? 'text-black/65 hover:bg-black/5'
                                        : 'text-white/88 hover:bg-white/10'}
                                    activeButtonClassName={isDaylight
                                        ? 'bg-white text-stone-950 shadow-sm ring-1 ring-black/10'
                                        : 'bg-white text-zinc-950 shadow-sm ring-1 ring-white/35'}
                                />
                            </div>
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default FloatingPlayerBackgroundMenu;
