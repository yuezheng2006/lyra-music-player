import React from 'react';
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
}) => {
    const { t } = useTranslation();
    const defaultInactiveClass = isDaylight
        ? 'text-stone-800 hover:bg-black/[0.05]'
        : 'text-white/88 hover:bg-white/[0.08]';
    const defaultActiveClass = isDaylight
        ? 'bg-white text-stone-950 shadow-sm ring-1 ring-black/10'
        : 'bg-white/20 text-white shadow-sm ring-1 ring-white/20';

    return (
        <div className={`grid grid-cols-2 gap-1 ${className}`.trim()} data-testid="lyric-color-preset-grid">
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
                        onClick={() => onSelect(preset.id)}
                        className={`rounded-lg px-2.5 py-2 text-left transition-all ${buttonClassName} ${isActive ? resolvedActive : resolvedInactive}`.trim()}
                        title={label}
                    >
                        <span className="mb-1.5 flex gap-1" aria-hidden>
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
                        <span
                            className={`block min-w-0 truncate text-[11px] font-semibold ${isActive ? '' : 'opacity-95'}`}
                        >
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default LyricColorPresetGrid;
