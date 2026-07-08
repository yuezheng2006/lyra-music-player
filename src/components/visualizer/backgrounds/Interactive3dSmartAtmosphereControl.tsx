import React from 'react';
import { Activity, AudioLines, Sparkles } from 'lucide-react';
import type { Theme } from '../../../types';
import { colorWithAlpha } from '../colorMix';

// src/components/visualizer/backgrounds/Interactive3dSmartAtmosphereControl.tsx
// Smart atmosphere control with low-frequency visual status indicators.

interface Interactive3dSmartAtmosphereControlProps {
    label: string;
    description: string;
    checked: boolean;
    onChange?: (checked: boolean) => void;
    theme: Theme;
}

const SMART_DRIVER_ITEMS = [
    { label: 'Beat', icon: AudioLines },
    { label: 'Bass', icon: Activity },
    { label: 'Camera', icon: Sparkles },
] as const;

export const Interactive3dSmartAtmosphereControl: React.FC<Interactive3dSmartAtmosphereControlProps> = ({
    label,
    description,
    checked,
    onChange,
    theme,
}) => (
    <div
        className="rounded-2xl border p-3 space-y-3"
        data-testid="interactive3d-toggle-smart-atmosphere"
        style={{
            borderColor: colorWithAlpha(theme.secondaryColor, checked ? 0.24 : 0.12),
            backgroundColor: checked
                ? colorWithAlpha(theme.secondaryColor, 0.08)
                : colorWithAlpha(theme.backgroundColor, 0.16),
        }}
    >
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: theme.primaryColor }}>
                    <Sparkles size={15} />
                    {label}
                </div>
                <div className="max-w-[360px] text-xs leading-snug opacity-70" style={{ color: theme.secondaryColor }}>
                    {description}
                </div>
            </div>
            <button
                type="button"
                aria-pressed={checked}
                onClick={() => onChange?.(!checked)}
                className="h-7 w-14 rounded-full p-1 transition-colors shrink-0 disabled:opacity-45"
                disabled={!onChange}
                style={{
                    backgroundColor: checked ? theme.secondaryColor : colorWithAlpha(theme.secondaryColor, 0.18),
                }}
            >
                <div
                    className={`h-5 w-5 rounded-full shadow-sm transition-transform ${checked ? 'translate-x-7' : 'translate-x-0'}`}
                    style={{ backgroundColor: theme.backgroundColor }}
                />
            </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
            {SMART_DRIVER_ITEMS.map(({ label: driverLabel, icon: Icon }, index) => (
                <div
                    key={driverLabel}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                    style={{
                        borderColor: colorWithAlpha(theme.secondaryColor, checked ? 0.22 : 0.12),
                        color: checked ? theme.primaryColor : theme.secondaryColor,
                        backgroundColor: colorWithAlpha(theme.backgroundColor, checked ? 0.24 : 0.12),
                    }}
                >
                    <Icon size={11} />
                    {driverLabel}
                    <span
                        className="ml-0.5 inline-block h-1.5 rounded-full transition-all"
                        style={{
                            width: `${12 + index * 5}px`,
                            backgroundColor: checked
                                ? colorWithAlpha(theme.primaryColor, 0.72)
                                : colorWithAlpha(theme.secondaryColor, 0.24),
                        }}
                    />
                </div>
            ))}
        </div>
    </div>
);
