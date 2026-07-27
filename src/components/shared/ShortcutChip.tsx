import React from 'react';

// src/components/shared/ShortcutChip.tsx
// Text-only shortcut pill for search hints without real cover art.

type ShortcutChipProps = {
    label: string;
    isDaylight: boolean;
    disabled?: boolean;
    onSelect: () => void;
};

const chipClass = (isDaylight: boolean) => (
    isDaylight
        ? 'border-black/10 bg-white/90 text-slate-700 hover:bg-slate-50 hover:border-black/16'
        : 'border-white/12 bg-white/8 text-white/85 hover:bg-white/14 hover:border-white/20'
);

export const ShortcutChip: React.FC<ShortcutChipProps> = ({
    label,
    isDaylight,
    disabled = false,
    onSelect,
}) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className={`inline-flex items-center min-h-9 rounded-full border px-3.5 py-1.5 text-sm transition-colors touch-manipulation active:scale-[0.98] disabled:opacity-50 ${chipClass(isDaylight)}`}
    >
        {label}
    </button>
);

export default ShortcutChip;
