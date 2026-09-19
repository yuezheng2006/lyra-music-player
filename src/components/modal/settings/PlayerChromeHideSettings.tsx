import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../../types';
import {
    settingsDescClass,
    settingsDescStyle,
    settingsTitleClass,
    settingsTitleStyle,
} from './settingsTextStyles';

// src/components/modal/settings/PlayerChromeHideSettings.tsx
// Player-page idle hide for chrome and the lyric-stage cursor.

export function PlayerChromeHideSettings(props: {
    theme?: Theme;
    settingsCardClass: string;
    toggleOffBackgroundClass: string;
    autoHidePlayerChrome: boolean;
    autoHideCursorWithPlayerChrome: boolean;
    onToggleAutoHidePlayerChrome: (enabled: boolean) => void;
    onToggleAutoHideCursorWithPlayerChrome: (enabled: boolean) => void;
}) {
    const { t } = useTranslation();
    const {
        theme,
        settingsCardClass,
        toggleOffBackgroundClass,
        autoHidePlayerChrome,
        autoHideCursorWithPlayerChrome,
        onToggleAutoHidePlayerChrome,
        onToggleAutoHideCursorWithPlayerChrome,
    } = props;

    const renderToggle = (enabled: boolean, onToggle: () => void) => (
        <button
            type="button"
            onClick={onToggle}
            className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${!enabled ? toggleOffBackgroundClass : ''}`}
            style={{ backgroundColor: enabled ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );

    return (
        <>
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${settingsCardClass}`}>
                <div className="space-y-1">
                    <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                        {t('options.autoHidePlayerChrome')}
                    </div>
                    <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                        {t('options.autoHidePlayerChromeDesc')}
                    </div>
                </div>
                {renderToggle(autoHidePlayerChrome, () => onToggleAutoHidePlayerChrome(!autoHidePlayerChrome))}
            </div>
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${settingsCardClass}`}>
                <div className="space-y-1">
                    <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                        {t('options.autoHideCursorWithPlayerChrome')}
                    </div>
                    <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                        {t('options.autoHideCursorWithPlayerChromeDesc')}
                    </div>
                </div>
                {renderToggle(
                    autoHideCursorWithPlayerChrome,
                    () => onToggleAutoHideCursorWithPlayerChrome(!autoHideCursorWithPlayerChrome),
                )}
            </div>
        </>
    );
}
