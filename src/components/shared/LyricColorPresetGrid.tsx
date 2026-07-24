import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    LYRIC_COLOR_PRESETS,
    resolveLyricColorPresetSwatches,
    type LyricColorPreset,
    type LyricColorPresetId,
} from '../../utils/theme/lyricColorPresets';

// src/components/shared/LyricColorPresetGrid.tsx
// Compact chips: current-mode body hue + dimmed twin (matches on-stage opacity model).

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
    /** Controls surface: color circles only (label via title/aria). */
    dotsOnly?: boolean;
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
    dotsOnly = false,
}) => {
    const { t } = useTranslation();
    const mode = isDaylight ? 'light' : 'dark';
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

    if (dotsOnly) {
        return (
            <div
                className={`flex flex-wrap items-center gap-2 ${className}`.trim()}
                data-testid="lyric-color-preset-grid"
                role="listbox"
                aria-label={t('options.lyricColorPresetTitle') || 'Lyric colors'}
            >
                {presets.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    const label = t(preset.labelKey) || preset.labelFallback;
                    const swatches = resolveLyricColorPresetSwatches(preset, mode);
                    const bodyColor = swatches[0];

                    return (
                        <button
                            key={preset.id}
                            type="button"
                            role="option"
                            data-testid={`lyric-color-preset-${preset.id}`}
                            aria-pressed={isActive}
                            aria-selected={isActive}
                            aria-label={label}
                            title={label}
                            onClick={() => onSelect(preset.id)}
                            className={`relative flex h-7 w-7 items-center justify-center rounded-full transition-transform ${
                                isActive ? 'scale-110 ring-2 ring-white/80' : 'opacity-85 hover:opacity-100 hover:scale-105'
                            } ${buttonClassName}`.trim()}
                            style={{
                                backgroundColor: bodyColor,
                                boxShadow: isActive ? `0 0 10px ${bodyColor}` : undefined,
                            }}
                        >
                            {isActive ? (
                                <Check size={12} strokeWidth={2.8} className="text-black/80 drop-shadow-sm" />
                            ) : null}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div
            className={`grid gap-1.5 ${compact && !emphasis ? 'grid-cols-1' : presets.length <= 3 ? 'grid-cols-1' : 'grid-cols-2'} ${className}`.trim()}
            data-testid="lyric-color-preset-grid"
        >
            {presets.map((preset) => {
                const isActive = activePresetId === preset.id;
                const label = t(preset.labelKey) || preset.labelFallback;
                const resolvedInactive = inactiveButtonClassName || defaultInactiveClass;
                const resolvedActive = activeButtonClassName || defaultActiveClass;
                const swatches = resolveLyricColorPresetSwatches(preset, mode);

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
                                    {swatches.map((color, index) => (
                                        <span
                                            key={`${preset.id}-${index}`}
                                            className={swatchClass}
                                            style={{
                                                backgroundColor: color,
                                                boxShadow: isActive ? `0 0 8px ${swatches[0]}` : undefined,
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
                                        {swatches.map((color, index) => (
                                            <span
                                                key={`${preset.id}-${index}`}
                                                className={swatchClass}
                                                style={{
                                                    backgroundColor: color,
                                                    boxShadow: isActive ? `0 0 10px ${swatches[0]}` : undefined,
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
