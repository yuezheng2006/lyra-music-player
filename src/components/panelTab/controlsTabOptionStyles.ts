// src/components/panelTab/controlsTabOptionStyles.ts
// Shared pill styles for the player controls tab option groups.

export type ControlsTabOptionStyles = {
    wellBg: string;
    activeOptionClass: string;
    inactiveOptionClass: string;
    disabledOptionClass: string;
    sectionHintClass: string;
};

export const getControlsTabOptionStyles = (isDaylight: boolean): ControlsTabOptionStyles => ({
    wellBg: isDaylight ? 'bg-black/5' : 'bg-black/20',
    activeOptionClass: isDaylight
        ? 'bg-white text-stone-900 shadow-sm hover:bg-white/90'
        : 'bg-white/20 text-white shadow-sm hover:bg-white/30',
    inactiveOptionClass: isDaylight
        ? 'text-stone-600 hover:bg-black/[0.04] hover:text-stone-900'
        : 'text-white/58 hover:bg-white/[0.06] hover:text-white/92',
    disabledOptionClass: isDaylight
        ? 'text-stone-400 cursor-not-allowed'
        : 'text-white/28 cursor-not-allowed',
    sectionHintClass: isDaylight ? 'text-stone-500' : 'text-white/45',
});

export const getControlsTabOptionButtonClass = (
    isActive: boolean,
    styles: ControlsTabOptionStyles,
    disabled = false,
) => {
    const baseClass = 'rounded-lg text-[10px] font-medium transition-all';

    if (disabled) {
        return `${baseClass} ${styles.disabledOptionClass}`;
    }

    return `${baseClass} ${isActive ? styles.activeOptionClass : styles.inactiveOptionClass}`;
};
