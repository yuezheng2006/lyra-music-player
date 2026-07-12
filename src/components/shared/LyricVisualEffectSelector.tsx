// src/components/shared/LyricVisualEffectSelector.tsx
// 歌词视觉效果选择器 - 整合到设置菜单中

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LyricVisualEffectConfig } from '../../utils/lyricVisualEffects';

interface LyricVisualEffectSelectorProps {
    selectedIntensity: LyricVisualEffectConfig['intensity'];
    onIntensityChange: (intensity: LyricVisualEffectConfig['intensity']) => void;
    isDaylight?: boolean;
}

const LyricVisualEffectSelector: React.FC<LyricVisualEffectSelectorProps> = ({
    selectedIntensity,
    onIntensityChange,
    isDaylight = false,
}) => {
    const { t } = useTranslation();
    const intensityOptions = useMemo(() => ([
        { value: 'subtle' as const, label: t('ui.visualEffectIntensitySubtle') },
        { value: 'normal' as const, label: t('ui.visualEffectIntensityNormal') },
        { value: 'strong' as const, label: t('ui.visualEffectIntensityStrong') },
        { value: 'extreme' as const, label: t('ui.visualEffectIntensityExtreme') },
    ]), [t]);

    const optionButtonClass = (selected: boolean) => (
        selected
            ? (isDaylight ? 'bg-black/14 text-black font-semibold' : 'bg-white/22 text-white font-semibold')
            : (isDaylight ? 'text-black/85 hover:bg-black/5' : 'text-white/92 hover:bg-white/10')
    );

    return (
        <div className="grid grid-cols-4 gap-1.5">
            {intensityOptions.map(option => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onIntensityChange(option.value)}
                    className={`rounded-xl px-2 py-2.5 text-[12px] font-semibold transition-all ${optionButtonClass(selectedIntensity === option.value)}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default LyricVisualEffectSelector;
