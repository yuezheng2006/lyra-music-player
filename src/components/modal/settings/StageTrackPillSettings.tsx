import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../../types';
import type { StageTrackPillMode } from '../../../utils/settings/stageTrackPillSettingsMath';
import {
    settingsDescClass,
    settingsDescStyle,
    settingsTitleClass,
    settingsTitleStyle,
} from './settingsTextStyles';

// src/components/modal/settings/StageTrackPillSettings.tsx
// Appearance controls for the lyrics-page now-playing card.

type StageTrackPillSettingsProps = {
    theme?: Theme;
    settingsCardClass: string;
    toggleOffBackgroundClass: string;
    getAccentOptionStyle: (active: boolean) => React.CSSProperties;
    stageTrackPillMode: StageTrackPillMode;
    stageTrackPillTimeoutSec: number;
    stageTrackPillOnHome: boolean;
    onChangeStageTrackPillMode: (mode: StageTrackPillMode) => void;
    onChangeStageTrackPillTimeoutSec: (timeoutSec: number) => void;
    onToggleStageTrackPillOnHome: (enabled: boolean) => void;
};

const StageTrackPillSettings: React.FC<StageTrackPillSettingsProps> = ({
    theme,
    settingsCardClass,
    toggleOffBackgroundClass,
    getAccentOptionStyle,
    stageTrackPillMode,
    stageTrackPillTimeoutSec,
    stageTrackPillOnHome,
    onChangeStageTrackPillMode,
    onChangeStageTrackPillTimeoutSec,
    onToggleStageTrackPillOnHome,
}) => {
    const { t } = useTranslation();

    return (
        <div className={`p-3 rounded-xl border space-y-3 ${settingsCardClass}`}>
            <div className="space-y-1">
                <div className={`${settingsTitleClass} flex items-center gap-2`} style={settingsTitleStyle}>
                    {t('options.stageTrackPill')}
                </div>
                <div className={`${settingsDescClass} max-w-[360px]`} style={settingsDescStyle}>
                    {t('options.stageTrackPillDesc')}
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {(['auto', 'always', 'never'] as const).map(pillMode => (
                    <button
                        key={pillMode}
                        type="button"
                        onClick={() => onChangeStageTrackPillMode(pillMode)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border"
                        style={getAccentOptionStyle(stageTrackPillMode === pillMode)}
                    >
                        {t(`options.stageTrackPillMode_${pillMode}`)}
                    </button>
                ))}
            </div>
            {stageTrackPillMode === 'auto' && (
                <label className="flex items-center justify-between gap-4">
                    <span className={settingsTitleClass} style={settingsTitleStyle}>
                        {t('options.stageTrackPillTimeout')}
                    </span>
                    <span className="flex items-center gap-2 text-xs opacity-70">
                        <input
                            type="range"
                            min={3}
                            max={60}
                            step={1}
                            value={stageTrackPillTimeoutSec}
                            onChange={event => onChangeStageTrackPillTimeoutSec(Number(event.target.value))}
                            className="w-28"
                        />
                        {stageTrackPillTimeoutSec}s
                    </span>
                </label>
            )}
            {stageTrackPillMode !== 'never' && (
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                            {t('options.stageTrackPillOnHome')}
                        </div>
                        <div className={`${settingsDescClass} max-w-[280px]`} style={settingsDescStyle}>
                            {t('options.stageTrackPillOnHomeDesc')}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onToggleStageTrackPillOnHome(!stageTrackPillOnHome)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${!stageTrackPillOnHome ? toggleOffBackgroundClass : ''}`}
                        style={{ backgroundColor: stageTrackPillOnHome ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                        aria-pressed={stageTrackPillOnHome}
                        aria-label={t('options.stageTrackPillOnHome')}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${stageTrackPillOnHome ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default StageTrackPillSettings;
