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
    wellBg: isDaylight ? 'bg-black/5' : 'bg-white/[0.06]',
    // Dark 选中态用白底黑字，贴近 Mineradio 控制台的高对比 pill。
    activeOptionClass: isDaylight
        ? 'bg-white text-stone-900 shadow-sm hover:bg-white/90'
        : 'bg-white text-zinc-950 shadow-sm hover:bg-white/92',
    inactiveOptionClass: isDaylight
        ? 'text-stone-700 hover:bg-black/[0.04] hover:text-stone-950'
        : 'text-white/88 hover:bg-white/[0.08] hover:text-white',
    disabledOptionClass: isDaylight
        ? 'text-stone-400 cursor-not-allowed'
        : 'text-white/34 cursor-not-allowed',
    sectionHintClass: isDaylight ? 'text-stone-500' : 'text-white/58',
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
