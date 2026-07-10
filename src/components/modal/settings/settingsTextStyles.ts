import type { CSSProperties } from 'react';

// Shared settings typography — avoid stacking opacity on --text-secondary in dark mode.

export const settingsSectionTitleClass =
    'text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2';

export const settingsSectionTitleStyle: CSSProperties = {
    color: 'var(--text-secondary)',
};

export const settingsTitleClass = 'text-sm font-medium';

export const settingsTitleStyle: CSSProperties = {
    color: 'var(--text-primary)',
};

export const settingsDescClass = 'text-xs leading-relaxed';

export const settingsDescStyle: CSSProperties = {
    color: 'var(--text-secondary)',
};

export const settingsFootnoteClass = 'text-[10px] leading-relaxed';

export const settingsFootnoteStyle: CSSProperties = {
    color: 'var(--text-secondary)',
    opacity: 0.72,
};
