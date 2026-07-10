import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    LYRIC_COLOR_PRESETS,
    type LyricColorPreset,
    type LyricColorPresetId,
} from '../../utils/theme/lyricColorPresets';

// src/components/shared/LyricColorPresetGrid.tsx
// Compact preset chips for Douyin / Xiaohongshu inspired lyric colors.

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
}) => {
    const { t } = useTranslation();
    const defaultInactiveClass = isDaylight
        ? 'text-stone-800 hover:bg-black/[0.05]'
        : 'text-white/88 hover:bg-white/[0.08]';
    const defaultActiveClass = isDaylight
        ? 'bg-white text-stone-950 shadow-sm ring-1 ring-black/10'
        : 'bg-white/20 text-white shadow-sm ring-1 ring-white/20';

    return (
        <div
            className={`grid gap-1 ${compact ? 'grid-cols-1' : 'grid-cols-2'} ${className}`.trim()}
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
                        className={`relative rounded-lg text-left transition-all ${
                            compact ? 'px-1.5 py-1' : 'px-2.5 py-2'
                        } ${buttonClassName} ${isActive ? resolvedActive : resolvedInactive}`.trim()}
                        title={label}
                    >
                        {compact ? (
                            <span className="flex min-w-0 items-center gap-1.5">
                                <span className="flex shrink-0 gap-0.5" aria-hidden>
                                    {[preset.light.primaryColor, preset.light.accentColor, preset.dark.accentColor].map(color => (
                                        <span
                                            key={color}
                                            className="h-2 w-2 rounded-full"
                                            style={{
                                                backgroundColor: color,
                                                boxShadow: isActive ? `0 0 8px ${color}` : undefined,
                                            }}
                                        />
                                    ))}
                                </span>
                                <span className={`min-w-0 flex-1 truncate text-[10px] font-semibold leading-none ${isActive ? '' : 'opacity-95'}`}>
                                    {label}
                                </span>
                                {isActive ? (
                                    <Check size={11} strokeWidth={2.6} className="shrink-0 opacity-90" />
                                ) : null}
                            </span>
                        ) : (
                            <>
                                <span className="mb-1.5 flex items-center justify-between gap-1" aria-hidden>
                                    <span className="flex gap-1">
                                        {[preset.light.primaryColor, preset.light.accentColor, preset.dark.accentColor].map(color => (
                                            <span
                                                key={color}
                                                className="h-2.5 w-2.5 rounded-full"
                                                style={{
                                                    backgroundColor: color,
                                                    boxShadow: isActive ? `0 0 10px ${color}` : undefined,
                                                }}
                                            />
                                        ))}
                                    </span>
                                    {isActive ? (
                                        <Check size={12} strokeWidth={2.6} className="shrink-0 opacity-90" />
                                    ) : null}
                                </span>
                                <span
                                    className={`block min-w-0 truncate text-[11px] font-semibold ${isActive ? '' : 'opacity-95'}`}
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
