import React from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_LYRICS_Y_MIDDLE } from '../../../utils/desktopLyrics/desktopLyricsPlacementMath';
import {
    settingsDescClass,
    settingsDescStyle,
    settingsTitleClass,
    settingsTitleStyle,
} from './settingsTextStyles';

// src/components/modal/settings/DesktopLyricsPlacementSettings.tsx
// 0–1 vertical factor + snap-to-middle for the desktop lyrics overlay.

type DesktopLyricsPlacementSettingsProps = {
    yFactor: number;
    disabled?: boolean;
    onChange: (factor: number) => void;
};

const DesktopLyricsPlacementSettings: React.FC<DesktopLyricsPlacementSettingsProps> = ({
    yFactor,
    disabled = false,
    onChange,
}) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-start justify-between p-4 gap-4">
            <div className="min-w-0 space-y-0.5 text-left">
                <h4 className={settingsTitleClass} style={settingsTitleStyle}>
                    {t('options.desktopLyricsY') || 'Vertical position'}
                </h4>
                <p className={settingsDescClass} style={settingsDescStyle}>
                    {t('options.desktopLyricsYDesc') || '0 is the top of the screen, 1 is the bottom. Snap to the middle line.'}
                </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    disabled={disabled}
                    value={yFactor}
                    onChange={event => onChange(Number(event.target.value))}
                    className="w-36"
                />
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(DESKTOP_LYRICS_Y_MIDDLE)}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold opacity-70 hover:opacity-100 disabled:opacity-30"
                >
                    {t('options.desktopLyricsYCenter') || 'Center'} · {yFactor.toFixed(2)}
                </button>
            </div>
        </div>
    );
};

export default DesktopLyricsPlacementSettings;
