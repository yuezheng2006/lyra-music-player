import React from 'react';
import { useTranslation } from 'react-i18next';
import type { LyricEffectPackId } from '../../utils/lyricEffectPacks';
import { LYRIC_EFFECT_PACK_IDS } from '../../utils/lyricEffectPacks';

// src/components/shared/LyricEffectPackSelector.tsx
// Single-select lyric effect pack chips for dock / controls.

type LyricEffectPackSelectorProps = {
  selectedPackId: LyricEffectPackId;
  onPackChange: (packId: LyricEffectPackId) => void;
  isDaylight?: boolean;
  onApplySuggestion?: (packId: LyricEffectPackId) => void;
};

const LyricEffectPackSelector: React.FC<LyricEffectPackSelectorProps> = ({
  selectedPackId,
  onPackChange,
  isDaylight = false,
  onApplySuggestion,
}) => {
  const { t } = useTranslation();

  const optionButtonClass = (selected: boolean) => (
    selected
      ? (isDaylight ? 'bg-black/14 text-black font-semibold' : 'bg-white/22 text-white font-semibold')
      : (isDaylight ? 'text-black/85 hover:bg-black/5' : 'text-white/92 hover:bg-white/10')
  );

  const showSuggest = selectedPackId === 'yehuo' && Boolean(onApplySuggestion);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        {LYRIC_EFFECT_PACK_IDS.map((packId) => (
          <button
            key={packId}
            type="button"
            onClick={() => onPackChange(packId)}
            className={`rounded-xl px-2 py-2.5 text-[12px] font-semibold transition-all ${optionButtonClass(selectedPackId === packId)}`}
          >
            {t(`ui.lyricEffectPack.${packId}`, packId)}
          </button>
        ))}
      </div>
      {showSuggest ? (
        <button
          type="button"
          onClick={() => onApplySuggestion?.(selectedPackId)}
          className={`w-full rounded-xl px-2 py-2 text-[11px] font-semibold transition-all ${
            isDaylight ? 'bg-black/8 text-black/80 hover:bg-black/12' : 'bg-white/10 text-white/85 hover:bg-white/16'
          }`}
        >
          {t('ui.lyricEffectPack.applySuggestion', 'Apply suggested font & color')}
        </button>
      ) : null}
    </div>
  );
};

export default LyricEffectPackSelector;
