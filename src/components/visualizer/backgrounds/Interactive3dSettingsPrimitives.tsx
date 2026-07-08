import React from 'react';
import { Monitor } from 'lucide-react';
import type { Theme } from '../../../types';
import { colorWithAlpha } from '../colorMix';

// src/components/visualizer/backgrounds/Interactive3dSettingsPrimitives.tsx
// Shared low-level controls for the interactive 3D settings panel.

interface Interactive3dSectionLabelProps {
    children: React.ReactNode;
    theme: Theme;
}

export interface Interactive3dToggleRowProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange?: (checked: boolean) => void;
    theme: Theme;
    testId?: string;
}

export const Interactive3dSectionLabel: React.FC<Interactive3dSectionLabelProps> = ({
    children,
    theme,
}) => (
    <div className="text-xs font-medium uppercase tracking-[0.24em] opacity-45" style={{ color: theme.secondaryColor }}>
        {children}
    </div>
);

export const Interactive3dToggleRow: React.FC<Interactive3dToggleRowProps> = ({
    label,
    description,
    checked,
    onChange,
    theme,
    testId,
}) => (
    <div className="flex items-center justify-between gap-4" data-testid={testId}>
        <div className="space-y-1">
            <div className="text-sm font-medium flex items-center gap-2" style={{ color: theme.primaryColor }}>
                <Monitor size={14} />
                {label}
            </div>
            {description && (
                <div className="text-xs opacity-70 max-w-[320px]" style={{ color: theme.secondaryColor }}>
                    {description}
                </div>
            )}
        </div>
        <button
            type="button"
            aria-pressed={checked}
            onClick={() => onChange?.(!checked)}
            className="w-12 h-6 rounded-full p-1 transition-colors shrink-0 disabled:opacity-45"
            disabled={!onChange}
            style={{
                backgroundColor: checked ? theme.secondaryColor : colorWithAlpha(theme.secondaryColor, 0.18),
            }}
        >
            <div
                className={`w-4 h-4 rounded-full shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}
                style={{ backgroundColor: theme.backgroundColor }}
            />
        </button>
    </div>
);
