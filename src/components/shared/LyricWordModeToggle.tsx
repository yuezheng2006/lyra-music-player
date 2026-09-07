import React from 'react';
import type { LyricWordMode } from '../../types';

// src/components/shared/LyricWordModeToggle.tsx
// Two-way toggle: default whole-word highlight vs KTV per-grapheme progressive wipe.

export type LyricWordModeToggleProps = {
    value: LyricWordMode;
    onChange: (mode: LyricWordMode) => void;
    defaultLabel: string;
    karaokeLabel: string;
    sectionLabel?: string;
    /** Short captions under the segment (default vs KTV behavior). */
    defaultHint?: string;
    karaokeHint?: string;
    isDaylight?: boolean;
    wellClassName?: string;
    buttonClassName?: (selected: boolean) => string;
    testIdPrefix?: string;
};

const resolveDefaultButtonClass = (selected: boolean, isDaylight: boolean) => {
    if (selected) {
        return isDaylight
            ? 'rounded-md px-1 py-1.5 text-[11px] font-semibold bg-black/[0.14] text-black ring-1 ring-black/35 shadow-sm'
            : 'rounded-md px-1 py-1.5 text-[11px] font-semibold bg-white/22 text-white ring-1 ring-amber-300/70 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]';
    }
    return isDaylight
        ? 'rounded-md px-1 py-1.5 text-[11px] font-medium text-black/55 ring-1 ring-black/12 hover:bg-black/[0.05] hover:text-black/80'
        : 'rounded-md px-1 py-1.5 text-[11px] font-medium text-white/55 ring-1 ring-white/14 hover:bg-white/[0.08] hover:text-white/85';
};

const LyricWordModeToggle: React.FC<LyricWordModeToggleProps> = ({
    value,
    onChange,
    defaultLabel,
    karaokeLabel,
    sectionLabel,
    defaultHint,
    karaokeHint,
    isDaylight = false,
    wellClassName = '',
    buttonClassName,
    testIdPrefix = 'lyric-word-mode',
}) => {
    const options: Array<{ mode: LyricWordMode; label: string; hint?: string }> = [
        { mode: 'default', label: defaultLabel, hint: defaultHint },
        { mode: 'karaoke', label: karaokeLabel, hint: karaokeHint },
    ];
    const activeHint = options.find((option) => option.mode === value)?.hint;
    const mutedHint = isDaylight ? 'text-black/45' : 'text-white/45';

    return (
        <div className="space-y-1" data-testid={`${testIdPrefix}-section`}>
            {sectionLabel ? (
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    {sectionLabel}
                </label>
            ) : null}
            <div
                className={`grid grid-cols-2 gap-1 p-1 rounded-xl ${wellClassName || (isDaylight ? 'bg-black/[0.05] ring-1 ring-black/8' : 'bg-white/[0.07] ring-1 ring-white/10')}`}
                data-testid={`${testIdPrefix}-group`}
                role="radiogroup"
                aria-label={sectionLabel || 'lyric word mode'}
            >
                {options.map(({ mode, label }) => {
                    const selected = value === mode;
                    return (
                        <button
                            key={mode}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            data-testid={`${testIdPrefix}-${mode}`}
                            onClick={() => onChange(mode)}
                            className={buttonClassName?.(selected) ?? resolveDefaultButtonClass(selected, isDaylight)}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
            {activeHint ? (
                <p className={`px-0.5 text-[10px] leading-snug ${mutedHint}`} data-testid={`${testIdPrefix}-hint`}>
                    {activeHint}
                </p>
            ) : null}
        </div>
    );
};

export default LyricWordModeToggle;
