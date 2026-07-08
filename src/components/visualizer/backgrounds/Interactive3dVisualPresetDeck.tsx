import React from 'react';
import type {
    Interactive3dSceneTuning,
    MineradioVisualPresetId,
    Theme,
} from '../../../types';
import { colorWithAlpha } from '../colorMix';
import {
    applyMineradioVisualPreset,
    getMineradioPresetLabelFallback,
    INTERACTIVE3D_VISUAL_PRESET_OPTIONS,
} from '../geometric/mineradioVisualPresets';
import { Interactive3dSectionLabel } from './Interactive3dSettingsPrimitives';

// src/components/visualizer/backgrounds/Interactive3dVisualPresetDeck.tsx
// Card-style selector for the shipped Mineradio WebGL visual preset bundles.

interface Interactive3dVisualPresetDeckProps {
    t: (key: string) => string;
    theme: Theme;
    isDaylight: boolean;
    tuning: Interactive3dSceneTuning;
    onTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
}

interface PresetMeta {
    subtitle: string;
    testId: string;
}

const PRESET_META: Record<MineradioVisualPresetId, PresetMeta> = {
    emily: {
        subtitle: 'Cover particles',
        testId: 'interactive3d-preset-emily',
    },
    starfield: {
        subtitle: 'Vinyl record',
        testId: 'interactive3d-preset-starfield',
    },
    tunnel: {
        subtitle: 'Neon lightflow',
        testId: 'interactive3d-preset-tunnel',
    },
};

const renderPresetPreview = (
    preset: MineradioVisualPresetId,
    theme: Theme,
    active: boolean,
) => {
    const glow = active ? colorWithAlpha(theme.primaryColor, 0.7) : colorWithAlpha(theme.secondaryColor, 0.42);
    if (preset === 'starfield') {
        return (
            <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
                <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: glow, backgroundColor: colorWithAlpha(theme.primaryColor, 0.08) }} />
                <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: colorWithAlpha(theme.secondaryColor, 0.32) }} />
                <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                <span className="absolute left-8 top-2 h-10 w-10 rounded-full border" style={{ borderColor: colorWithAlpha(theme.secondaryColor, 0.2) }} />
            </div>
        );
    }

    if (preset === 'tunnel') {
        return (
            <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
                {[0, 1, 2].map(index => (
                    <span
                        key={index}
                        className="absolute h-1 rounded-full"
                        style={{
                            left: `${6 + index * 7}px`,
                            right: `${8 + index * 5}px`,
                            top: `${13 + index * 10}px`,
                            backgroundColor: colorWithAlpha(index % 2 ? theme.primaryColor : theme.secondaryColor, active ? 0.62 - index * 0.1 : 0.28),
                            boxShadow: `0 0 14px ${glow}`,
                            transform: `rotate(${-12 + index * 10}deg)`,
                        }}
                    />
                ))}
                <span className="absolute bottom-2 left-7 h-1.5 w-24 rounded-full" style={{ backgroundColor: glow, boxShadow: `0 0 18px ${glow}` }} />
            </div>
        );
    }

    return (
        <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
            <span className="absolute left-5 top-3 h-8 w-8 rounded-lg border" style={{ borderColor: glow, backgroundColor: colorWithAlpha(theme.primaryColor, 0.1) }} />
            <span className="absolute right-5 top-4 h-6 w-6 rounded-full" style={{ backgroundColor: colorWithAlpha(theme.secondaryColor, 0.32) }} />
            <span className="absolute bottom-2 left-10 h-1.5 w-24 rounded-full" style={{ backgroundColor: colorWithAlpha(theme.primaryColor, active ? 0.48 : 0.22) }} />
        </div>
    );
};

export const Interactive3dVisualPresetDeck: React.FC<Interactive3dVisualPresetDeckProps> = ({
    t,
    theme,
    isDaylight,
    tuning,
    onTuningChange,
}) => (
    <div className="space-y-2.5">
        <Interactive3dSectionLabel theme={theme}>
            {t('options.mineradioVisualPreset') || '视觉风格'}
        </Interactive3dSectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" data-testid="interactive3d-mineradio-presets">
            {INTERACTIVE3D_VISUAL_PRESET_OPTIONS.map(preset => {
                const isActive = tuning.visualPreset === preset;
                const meta = PRESET_META[preset];

                return (
                    <button
                        key={preset}
                        type="button"
                        data-testid={meta.testId}
                        onClick={() => onTuningChange?.(applyMineradioVisualPreset(preset, tuning))}
                        className="min-w-0 rounded-2xl border p-2.5 text-left transition-all"
                        style={{
                            borderColor: isActive
                                ? colorWithAlpha(theme.secondaryColor, 0.44)
                                : colorWithAlpha(theme.secondaryColor, 0.14),
                            backgroundColor: isActive
                                ? (isDaylight ? 'rgba(255,255,255,0.92)' : colorWithAlpha(theme.secondaryColor, 0.16))
                                : colorWithAlpha(theme.backgroundColor, 0.16),
                            color: theme.primaryColor,
                        }}
                        >
                        {renderPresetPreview(preset, theme, isActive)}
                        <div className="mt-2 flex min-w-0 items-center">
                            <span className="truncate text-sm font-medium">
                                {t(`options.mineradioPreset.${preset}`) || getMineradioPresetLabelFallback(preset)}
                            </span>
                        </div>
                        <div className="mt-0.5 truncate text-[11px] opacity-60" style={{ color: theme.secondaryColor }}>
                            {meta.subtitle}
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
);
