import React from 'react';
import type { LyricWordMode } from '../../types';

// src/components/shared/LyricWordModeToggle.tsx
// Two-way toggle for default vs karaoke upcoming-lyric policy.

export type LyricWordModeToggleProps = {
    value: LyricWordMode;
    onChange: (mode: LyricWordMode) => void;
    defaultLabel: string;
    karaokeLabel: string;
    sectionLabel?: string;
    isDaylight?: boolean;
    wellClassName?: string;
    buttonClassName?: (selected: boolean) => string;
    testIdPrefix?: string;
};

const LyricWordModeToggle: React.FC<LyricWordModeToggleProps> = ({
    value,
    onChange,
    defaultLabel,
    karaokeLabel,
    sectionLabel,
    wellClassName = '',
    buttonClassName,
    testIdPrefix = 'lyric-word-mode',
}) => {
    const options: Array<{ mode: LyricWordMode; label: string }> = [
        { mode: 'default', label: defaultLabel },
        { mode: 'karaoke', label: karaokeLabel },
    ];

    return (
        <div className="space-y-1" data-testid={`${testIdPrefix}-section`}>
            {sectionLabel ? (
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    {sectionLabel}
                </label>
            ) : null}
            <div className={`grid grid-cols-2 gap-0.5 p-0.5 rounded-lg ${wellClassName}`} data-testid={`${testIdPrefix}-group`}>
                {options.map(({ mode, label }) => {
                    const selected = value === mode;
                    return (
                        <button
                            key={mode}
                            type="button"
                            role="menuitemradio"
                            aria-checked={selected}
                            data-testid={`${testIdPrefix}-${mode}`}
                            onClick={() => onChange(mode)}
                            className={buttonClassName?.(selected) ?? (
                                selected
                                    ? 'rounded-md px-0.5 py-1 text-[10px] font-semibold bg-white/15'
                                    : 'rounded-md px-0.5 py-1 text-[10px] font-semibold opacity-70 hover:opacity-100'
                            )}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default LyricWordModeToggle;
