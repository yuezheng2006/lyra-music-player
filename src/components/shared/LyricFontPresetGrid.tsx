import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../types';

// src/components/shared/LyricFontPresetGrid.tsx
// Compact built-in font choices for the floating player’s high-frequency lyric controls.

const FONT_STYLES: Theme['fontStyle'][] = ['sans', 'serif', 'mono'];

type LyricFontPresetGridProps = {
    activeFontStyle: Theme['fontStyle'];
    isDaylight?: boolean;
    onSelect: (fontStyle: Theme['fontStyle']) => void;
};

const LyricFontPresetGrid: React.FC<LyricFontPresetGridProps> = ({
    activeFontStyle,
    isDaylight = false,
    onSelect,
}) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-3 gap-0.5" data-testid="lyric-font-preset-grid">
            {FONT_STYLES.map(fontStyle => {
                const active = activeFontStyle === fontStyle;
                const label = t(`options.font${fontStyle[0].toUpperCase()}${fontStyle.slice(1)}`);

                return (
                    <button
                        key={fontStyle}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSelect(fontStyle)}
                        className={`flex min-w-0 items-center justify-center gap-1 rounded-md px-1 py-1 text-[10px] font-semibold transition-colors ${
                            active
                                ? (isDaylight ? 'bg-white text-stone-950 shadow-sm ring-1 ring-black/10' : 'bg-white text-zinc-950 shadow-sm ring-1 ring-white/35')
                                : (isDaylight ? 'text-black/65 hover:bg-black/5' : 'text-white/82 hover:bg-white/10')
                        }`}
                    >
                        <span className="truncate">{label}</span>
                        {active ? <Check size={10} strokeWidth={2.5} className="shrink-0" /> : null}
                    </button>
                );
            })}
        </div>
    );
};

export default LyricFontPresetGrid;
