import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    LYRIC_COLOR_PRESETS,
    type LyricColorPreset,
    type LyricColorPresetId,
} from '../../utils/theme/lyricColorPresets';

// src/components/shared/LyricColorPresetGrid.tsx
// Compact style chips pairing lyric colors with built-in typography.

interface LyricColorPresetGridProps {
    onSelect: (presetId: LyricColorPresetId) => void;
    presets?: readonly LyricColorPreset[];
    className?: string;
    buttonClassName?: string;
    inactiveButtonClassName?: string;
    activeButtonClassName?: string;
    activePresetId?: LyricColorPresetId | null;
    isDaylight?: boolean;
    /** Dock / tight panels: one-line chips instead of tall cards. */
    compact?: boolean;
    /** Larger type and color dots for floating player readability. */
    emphasis?: boolean;
}

const LyricColorPresetGrid: React.FC<LyricColorPresetGridProps> = ({
    onSelect,
    presets = LYRIC_COLOR_PRESETS,
    className = '',
    buttonClassName = '',
    inactiveButtonClassName = '',
    activeButtonClassName = '',
    activePresetId = null,
    isDaylight = false,
    compact = false,
    emphasis = false,
}) => {
    const { t } = useTranslation();
    const defaultInactiveClass = isDaylight
        ? 'text-stone-900 hover:bg-black/[0.06]'
        : 'text-white/95 hover:bg-white/[0.1]';
    const defaultActiveClass = isDaylight
        ? 'bg-white text-stone-950 shadow-sm ring-1 ring-black/10'
        : 'bg-white text-zinc-950 shadow-sm ring-1 ring-white/35';
    const labelClass = emphasis
        ? 'text-[12px] font-semibold leading-snug'
        : compact
            ? 'text-[10px] font-semibold leading-none'
            : 'text-[11px] font-semibold';
    const swatchClass = emphasis
        ? 'h-3 w-3 rounded-full'
        : compact
            ? 'h-2 w-2 rounded-full'
            : 'h-2.5 w-2.5 rounded-full';
    const padClass = emphasis
        ? 'px-2.5 py-2'
        : compact
            ? 'px-1.5 py-1'
            : 'px-2.5 py-2';

    return (
        <div
            className={`grid gap-1.5 ${compact && !emphasis ? 'grid-cols-1' : 'grid-cols-2'} ${className}`.trim()}
            data-testid="lyric-color-preset-grid"
        >
            {presets.map((preset) => {
                const isActive = activePresetId === preset.id;
                const label = t(preset.labelKey) || preset.labelFallback;
                const resolvedInactive = inactiveButtonClassName || defaultInactiveClass;
                const resolvedActive = activeButtonClassName || defaultActiveClass;

                return (
                    <button
                        key={preset.id}
                        type="button"
                        data-testid={`lyric-color-preset-${preset.id}`}
                        aria-pressed={isActive}
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => onSelect(preset.id)}
                        className={`relative rounded-xl text-left transition-all ${padClass} ${buttonClassName} ${isActive ? resolvedActive : resolvedInactive}`.trim()}
                        title={label}
                    >
                        {compact && !emphasis ? (
                            <span className="flex min-w-0 items-center gap-1.5">
                                <span className="flex shrink-0 gap-0.5" aria-hidden>
                                    {[preset.light.primaryColor, preset.light.accentColor, preset.dark.accentColor].map(color => (
                                        <span
                                            key={color}
                                            className={swatchClass}
                                            style={{
                                                backgroundColor: color,
                                                boxShadow: isActive ? `0 0 8px ${color}` : undefined,
                                            }}
                                        />
                                    ))}
                                </span>
                                <span className={`min-w-0 flex-1 truncate ${labelClass} ${isActive ? '' : 'opacity-95'}`}>
                                    {label}
                                </span>
                                {isActive ? (
                                    <Check size={11} strokeWidth={2.6} className="shrink-0 opacity-90" />
                                ) : null}
                            </span>
                        ) : (
                            <>
                                <span className="mb-1.5 flex items-center justify-between gap-1" aria-hidden>
                                    <span className="flex gap-1.5">
                                        {[preset.light.primaryColor, preset.light.accentColor, preset.dark.accentColor].map(color => (
                                            <span
                                                key={color}
                                                className={swatchClass}
                                                style={{
                                                    backgroundColor: color,
                                                    boxShadow: isActive ? `0 0 10px ${color}` : undefined,
                                                }}
                                            />
                                        ))}
                                    </span>
                                    {isActive ? (
                                        <Check size={14} strokeWidth={2.6} className="shrink-0 opacity-90" />
                                    ) : null}
                                </span>
                                <span
                                    className={`block min-w-0 ${emphasis ? 'line-clamp-2 break-words' : 'truncate'} ${labelClass} ${isActive ? '' : 'opacity-95'}`}
                                >
                                    {label}
                                </span>
                            </>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default LyricColorPresetGrid;
