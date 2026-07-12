// src/components/shared/LyricFontPresetSelector.tsx
// 歌词字体预设选择器 - 整合我们的8种字体

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LYRIC_FONT_PRESETS } from '../../utils/lyricFontPresets';

interface LyricFontPresetSelectorProps {
    selectedPresetId?: string;
    onPresetChange: (presetId: string) => void;
    isDaylight?: boolean;
}

const LyricFontPresetSelector: React.FC<LyricFontPresetSelectorProps> = ({
    selectedPresetId,
    onPresetChange,
    isDaylight = false,
}) => {
    const { i18n } = useTranslation();
    const useChineseLabels = i18n.language?.toLowerCase().startsWith('zh');
    // 主网格展示前 9 个预设（含打包书法/标题体）
    const mainPresets = LYRIC_FONT_PRESETS.slice(0, 9);

    const optionButtonClass = (selected: boolean) => (
        selected
            ? (isDaylight ? 'bg-black/14 text-black font-semibold' : 'bg-white/22 text-white font-semibold')
            : (isDaylight ? 'text-black/85 hover:bg-black/5' : 'text-white/92 hover:bg-white/10')
    );

    return (
        <div className="grid grid-cols-3 gap-1.5">
            {mainPresets.map(preset => (
                <button
                    key={preset.id}
                    type="button"
                    onClick={() => onPresetChange(preset.id)}
                    className={`rounded-xl px-2 py-3 text-[12px] font-semibold transition-all ${optionButtonClass(selectedPresetId === preset.id)}`}
                    style={{ fontFamily: preset.fontFamily, fontWeight: preset.fontWeight }}
                    title={preset.description}
                >
                    {useChineseLabels ? preset.name : preset.nameEn}
                </button>
            ))}
        </div>
    );
};

export default LyricFontPresetSelector;
