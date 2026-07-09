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
        subtitle: 'Cover bloom',
        testId: 'interactive3d-preset-emily',
    },
    starfield: {
        subtitle: 'Legacy cube',
        testId: 'interactive3d-preset-starfield',
    },
    tunnel: {
        subtitle: 'Legacy aurora',
        testId: 'interactive3d-preset-tunnel',
    },
    nebula: {
        subtitle: 'Fluid nebula',
        testId: 'interactive3d-preset-nebula',
    },
    terrain: {
        subtitle: 'Audio terrain',
        testId: 'interactive3d-preset-terrain',
    },
    quantumCube: {
        subtitle: 'Quantum box',
        testId: 'interactive3d-preset-quantum-cube',
    },
    aurora: {
        subtitle: 'Aurora ribbons',
        testId: 'interactive3d-preset-aurora',
    },
    mineradioTunnel: {
        subtitle: 'Mineradio tunnel',
        testId: 'interactive3d-preset-mineradio-tunnel',
    },
    mineradioOrbit: {
        subtitle: 'Mineradio orbit',
        testId: 'interactive3d-preset-mineradio-orbit',
    },
    mineradioVoid: {
        subtitle: 'Minimal void',
        testId: 'interactive3d-preset-mineradio-void',
    },
    mineradioVinyl: {
        subtitle: 'Mineradio vinyl',
        testId: 'interactive3d-preset-mineradio-vinyl',
    },
    mineradioGalaxy: {
        subtitle: 'Mineradio galaxy',
        testId: 'interactive3d-preset-mineradio-galaxy',
    },
};

const renderPresetPreview = (
    preset: MineradioVisualPresetId,
    theme: Theme,
    active: boolean,
) => {
    const glow = active ? colorWithAlpha(theme.primaryColor, 0.7) : colorWithAlpha(theme.secondaryColor, 0.42);
    if (preset === 'starfield' || preset === 'quantumCube') {
        return (
            <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
                <span
                    className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 border"
                    style={{
                        borderColor: glow,
                        boxShadow: `0 0 18px ${glow}, inset 0 0 14px ${colorWithAlpha(theme.secondaryColor, active ? 0.38 : 0.18)}`,
                        transform: 'translate(-50%, -50%) rotate(45deg) skew(-8deg, -8deg)',
                    }}
                />
                <span className="absolute left-[34%] top-[24%] h-7 w-7 border" style={{ borderColor: colorWithAlpha(theme.secondaryColor, active ? 0.58 : 0.24), transform: 'skewY(-24deg)' }} />
                <span className="absolute right-[26%] top-[28%] h-7 w-7 border" style={{ borderColor: colorWithAlpha(theme.primaryColor, active ? 0.52 : 0.22), transform: 'skewY(24deg)' }} />
                <span className="absolute bottom-2 left-6 h-1 w-20 rounded-full" style={{ backgroundColor: colorWithAlpha(theme.primaryColor, active ? 0.44 : 0.18), boxShadow: `0 0 16px ${glow}` }} />
            </div>
        );
    }

    if (preset === 'aurora' || preset === 'tunnel' || preset === 'mineradioGalaxy') {
        return (
            <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
                {[0, 1, 2].map(index => (
                    <span
                        key={index}
                        className="absolute h-1 rounded-full"
                        style={{
                            left: `${4 + index * 8}px`,
                            right: `${10 + index * 8}px`,
                            top: `${14 + index * 9}px`,
                            backgroundColor: colorWithAlpha(index % 2 ? theme.primaryColor : theme.secondaryColor, active ? 0.46 - index * 0.06 : 0.2),
                            boxShadow: `0 0 16px ${glow}`,
                            transform: `rotate(${-7 + index * 5}deg)`,
                        }}
                    />
                ))}
                <span className="absolute inset-x-6 top-1/2 h-px rounded-full" style={{ backgroundColor: colorWithAlpha(theme.primaryColor, active ? 0.34 : 0.14) }} />
            </div>
        );
    }

    if (preset === 'mineradioTunnel') {
        return (
            <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
                {[0, 1, 2].map(index => (
                    <span
                        key={index}
                        className="absolute rounded-full border"
                        style={{
                            inset: `${6 + index * 8}px ${18 + index * 12}px`,
                            borderColor: colorWithAlpha(index % 2 ? theme.secondaryColor : theme.primaryColor, active ? 0.54 : 0.22),
                            boxShadow: `0 0 ${18 - index * 2}px ${glow}`,
                        }}
                    />
                ))}
                <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: glow }} />
            </div>
        );
    }

    if (preset === 'mineradioOrbit') {
        return (
            <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
                <span className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: glow, boxShadow: `0 0 20px ${glow}` }} />
                <span className="absolute left-[24%] right-[24%] top-1/2 h-px rounded-full" style={{ backgroundColor: colorWithAlpha(theme.primaryColor, active ? 0.52 : 0.2), transform: 'rotate(-16deg)' }} />
                <span className="absolute left-[20%] right-[20%] top-1/2 h-px rounded-full" style={{ backgroundColor: colorWithAlpha(theme.secondaryColor, active ? 0.44 : 0.18), transform: 'rotate(18deg)' }} />
            </div>
        );
    }

    if (preset === 'mineradioVinyl') {
        return (
            <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
                <span className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: colorWithAlpha(theme.secondaryColor, active ? 0.5 : 0.2), boxShadow: `0 0 18px ${glow}` }} />
                <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: colorWithAlpha(theme.primaryColor, active ? 0.38 : 0.16) }} />
                <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: colorWithAlpha(theme.secondaryColor, active ? 0.7 : 0.3) }} />
            </div>
        );
    }

    if (preset === 'mineradioVoid') {
        return (
            <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
                <span className="absolute left-4 right-4 top-1/2 h-px rounded-full opacity-50" style={{ backgroundColor: colorWithAlpha(theme.secondaryColor, active ? 0.48 : 0.18) }} />
                <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed" style={{ borderColor: colorWithAlpha(theme.primaryColor, active ? 0.42 : 0.18) }} />
            </div>
        );
    }

    if (preset === 'nebula') {
        return (
            <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
                {[0, 1, 2, 3].map(index => (
                    <span
                        key={index}
                        className="absolute rounded-full blur-[1px]"
                        style={{
                            left: `${8 + index * 16}px`,
                            top: `${7 + (index % 2) * 16}px`,
                            width: `${22 - index * 2}px`,
                            height: `${22 - index * 2}px`,
                            backgroundColor: colorWithAlpha(index % 2 ? theme.primaryColor : theme.secondaryColor, active ? 0.42 : 0.22),
                            boxShadow: `0 0 ${16 + index * 4}px ${glow}`,
                        }}
                    />
                ))}
                <span className="absolute inset-x-5 top-1/2 h-px rounded-full" style={{ backgroundColor: colorWithAlpha(theme.primaryColor, active ? 0.46 : 0.2) }} />
            </div>
        );
    }

    if (preset === 'terrain') {
        return (
            <div className="relative h-14 overflow-hidden rounded-xl" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}>
                {[0, 1, 2, 3].map(index => (
                    <span
                        key={index}
                        className="absolute h-px rounded-full"
                        style={{
                            left: `${4 + index * 4}px`,
                            right: `${4 + index * 6}px`,
                            bottom: `${9 + index * 8}px`,
                            backgroundColor: colorWithAlpha(index % 2 ? theme.secondaryColor : theme.primaryColor, active ? 0.58 : 0.25),
                            boxShadow: `0 0 12px ${glow}`,
                            transform: `skewX(${-18 + index * 9}deg)`,
                        }}
                    />
                ))}
                <span className="absolute bottom-2 left-2 h-2 w-24 rounded-full" style={{ backgroundColor: colorWithAlpha(theme.secondaryColor, active ? 0.32 : 0.14) }} />
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" data-testid="interactive3d-mineradio-presets">
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
                                ? (isDaylight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.94)')
                                : colorWithAlpha(theme.backgroundColor, 0.16),
                            color: isActive && !isDaylight ? '#09090b' : theme.primaryColor,
                        }}
                        >
                        {renderPresetPreview(preset, theme, isActive)}
                        <div className="mt-2 flex min-w-0 items-center">
                            <span className="truncate text-sm font-medium">
                                {t(`options.mineradioPreset.${preset}`) || getMineradioPresetLabelFallback(preset)}
                            </span>
                        </div>
                        <div
                            className="mt-0.5 truncate text-[11px]"
                            style={{
                                color: isActive && !isDaylight ? 'rgba(9,9,11,0.62)' : theme.secondaryColor,
                                opacity: isActive && !isDaylight ? 1 : 0.78,
                            }}
                        >
                            {meta.subtitle}
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
);
