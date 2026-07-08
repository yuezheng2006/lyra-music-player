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
}

const LyricColorPresetGrid: React.FC<LyricColorPresetGridProps> = ({
    onSelect,
    presets = LYRIC_COLOR_PRESETS,
    className = '',
    buttonClassName = '',
    inactiveButtonClassName = '',
    activeButtonClassName = '',
    activePresetId = null,
}) => {
    const { t } = useTranslation();

    return (
        <div className={`grid grid-cols-2 gap-1 ${className}`.trim()} data-testid="lyric-color-preset-grid">
            {presets.map((preset) => {
                const isActive = activePresetId === preset.id;
                const label = t(preset.labelKey) || preset.labelFallback;

                return (
                    <button
                        key={preset.id}
                        type="button"
                        data-testid={`lyric-color-preset-${preset.id}`}
                        onClick={() => onSelect(preset.id)}
                        className={`rounded-lg px-2 py-1.5 text-center transition-all ${buttonClassName} ${isActive ? activeButtonClassName : inactiveButtonClassName}`.trim()}
                        title={label}
                    >
                        <span className="block min-w-0 truncate text-[10px] font-semibold">{label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default LyricColorPresetGrid;
