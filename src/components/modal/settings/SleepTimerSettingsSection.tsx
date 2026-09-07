import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import { formatSleepTimerRemaining } from '../../../utils/settings/sleepTimerSettingsMath';
import {
    settingsDescClass,
    settingsDescStyle,
    settingsSectionTitleClass,
    settingsSectionTitleStyle,
    settingsTitleClass,
    settingsTitleStyle,
} from './settingsTextStyles';

// src/components/modal/settings/SleepTimerSettingsSection.tsx
// Playback sleep timer: hours/minutes fields, arm toggle, and remaining countdown.

type SleepTimerSettingsSectionProps = {
    isDaylight: boolean;
    settingsCardClass: string;
    renderToggle: (checked: boolean, onChange: () => void) => React.ReactNode;
};

type NumberFieldProps = {
    isDaylight: boolean;
    label: string;
    max: number;
    value: number;
    onChange: (next: number) => void;
};

const SleepTimerNumberField: React.FC<NumberFieldProps> = ({ isDaylight, label, max, value, onChange }) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const digits = event.currentTarget.value.replace(/\D/g, '');
        if (digits === '') {
            onChange(0);
            return;
        }
        const next = Number(digits);
        if (next > max) {
            return;
        }
        onChange(next);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            maxLength={max > 99 ? 3 : 2}
            value={String(value)}
            onChange={handleChange}
            onFocus={(event) => event.currentTarget.select()}
            aria-label={label}
            className={`w-16 rounded-lg border px-3 py-2 text-center text-sm outline-none transition-colors ${isDaylight
                ? 'border-black/10 bg-white/60 text-zinc-900'
                : 'border-white/10 bg-black/40 text-white'
                }`}
        />
    );
};

const SleepTimerSettingsSection: React.FC<SleepTimerSettingsSectionProps> = ({
    isDaylight,
    settingsCardClass,
    renderToggle,
}) => {
    const { t } = useTranslation();
    const {
        enabled,
        hours,
        minutes,
        deadlineMs,
        onEnabledChange,
        onHoursChange,
        onMinutesChange,
    } = useSettingsUiStore(useShallow(state => ({
        enabled: state.sleepTimerEnabled,
        hours: state.sleepTimerHours,
        minutes: state.sleepTimerMinutes,
        deadlineMs: state.sleepTimerDeadlineMs,
        onEnabledChange: state.handleToggleSleepTimer,
        onHoursChange: state.handleSetSleepTimerHours,
        onMinutesChange: state.handleSetSleepTimerMinutes,
    })));
    const [nowMs, setNowMs] = useState(() => Date.now());

    useEffect(() => {
        if (!enabled || deadlineMs === null) {
            return;
        }
        setNowMs(Date.now());
        const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [deadlineMs, enabled]);

    const remainingMs = enabled && deadlineMs !== null ? Math.max(0, deadlineMs - nowMs) : null;
    const canQuit = Boolean(typeof window !== 'undefined' && window.electron?.quitApp);
    const hint = !enabled
        ? t('commandPalette.sleepTimerDisabledHint')
        : hours === 0 && minutes === 0
            ? t('commandPalette.sleepTimerZeroHint')
            : t(
                canQuit ? 'commandPalette.sleepTimerCountdownHint' : 'commandPalette.sleepTimerPauseCountdownHint',
            ).replace(
                '{{time}}',
                formatSleepTimerRemaining(remainingMs ?? (hours * 3600 + minutes * 60) * 1000),
            );

    return (
        <section>
            <h3 className={settingsSectionTitleClass} style={settingsSectionTitleStyle}>
                <Timer size={14} /> {t('options.sleepTimer')}
            </h3>
            <div className={`p-4 rounded-xl border space-y-4 ${settingsCardClass}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <div className={settingsTitleClass} style={settingsTitleStyle}>
                            {t('options.sleepTimer')}
                        </div>
                        <div className={`${settingsDescClass} max-w-[420px]`} style={settingsDescStyle}>
                            {t('options.sleepTimerDesc')}
                        </div>
                        <div
                            className={`${settingsDescClass} tabular-nums`}
                            style={settingsDescStyle}
                            aria-live="polite"
                        >
                            {hint}
                        </div>
                    </div>
                    {renderToggle(enabled, () => onEnabledChange(!enabled))}
                </div>
                <div className="flex items-center gap-3">
                    <SleepTimerNumberField
                        isDaylight={isDaylight}
                        label={t('commandPalette.sleepTimerHoursLabel')}
                        max={999}
                        value={hours}
                        onChange={onHoursChange}
                    />
                    <span className={`text-sm font-semibold ${isDaylight ? 'text-black/50' : 'text-white/50'}`}>
                        {t('commandPalette.sleepTimerHoursLabel')}
                    </span>
                    <SleepTimerNumberField
                        isDaylight={isDaylight}
                        label={t('commandPalette.sleepTimerMinutesLabel')}
                        max={59}
                        value={minutes}
                        onChange={onMinutesChange}
                    />
                    <span className={`text-sm font-semibold ${isDaylight ? 'text-black/50' : 'text-white/50'}`}>
                        {t('commandPalette.sleepTimerMinutesLabel')}
                    </span>
                </div>
            </div>
        </section>
    );
};

export default SleepTimerSettingsSection;
