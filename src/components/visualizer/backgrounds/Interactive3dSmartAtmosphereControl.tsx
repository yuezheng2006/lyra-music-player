import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Interactive3dSceneTuning, Theme } from '../../../types';
import { colorWithAlpha } from '../colorMix';
import { Interactive3dAtmosphereTuningSliders } from './Interactive3dAtmosphereTuningSliders';

// src/components/visualizer/backgrounds/Interactive3dSmartAtmosphereControl.tsx
// Smart atmosphere master toggle with optional sensitivity sliders.

interface Interactive3dSmartAtmosphereControlProps {
    label: string;
    description: string;
    checked: boolean;
    onChange?: (checked: boolean) => void;
    theme: Theme;
    t: (key: string) => string;
    tuning?: Interactive3dSceneTuning;
    onTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
}

export const Interactive3dSmartAtmosphereControl: React.FC<Interactive3dSmartAtmosphereControlProps> = ({
    label,
    description,
    checked,
    onChange,
    theme,
    t,
    tuning,
    onTuningChange,
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

        {tuning && (
            <Interactive3dAtmosphereTuningSliders
                t={t}
                theme={theme}
                tuning={tuning}
                enabled={checked}
                onTuningChange={onTuningChange}
            />
        )}
    </div>
);
