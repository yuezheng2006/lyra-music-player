import type { CommandPaletteCommand } from './types';
import { describeSleepTimerQuery, parseSleepTimerQuery } from './sleepTimerQuery';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';

// src/components/command-palette/sleepTimerCommands.ts
// Arm or cancel the sleep timer from the command palette (`30`, `--on 90`, `--off`).

const configuredTotalMinutes = () => {
    const { sleepTimerHours, sleepTimerMinutes } = useSettingsUiStore.getState();
    return sleepTimerHours * 60 + sleepTimerMinutes;
};

export const SLEEP_TIMER_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'sleep-timer',
        group: 'settings',
        title: 'Sleep timer',
        description: 'Pause playback after a chosen duration, or close the desktop app',
        keywords: [
            'sleep timer',
            'auto close',
            'auto quit',
            'shutdown timer',
            '定时关闭',
            '睡眠定时',
            '自动关闭',
            '到时关闭',
            '倒计时退出',
            'dingshiguanbi',
            'shuimiandingshi',
            'zidongguanbi',
            'daoshiguanbi',
            'dsgb',
            'smds',
            'zdgb',
        ],
        placeholder: '30  |  --on 90  |  --off',
        requiresInput: true,
        syntax: {
            flags: [
                {
                    name: 'on',
                    aliases: ['enable'],
                    descriptionKey: 'commandPalette.syntaxSleepTimerOn',
                    descriptionFallback: 'Start the timer',
                },
                {
                    name: 'off',
                    aliases: ['disable'],
                    descriptionKey: 'commandPalette.syntaxSleepTimerOff',
                    descriptionFallback: 'Cancel the timer',
                },
            ],
        },
        getPreview: (input, context) => describeSleepTimerQuery(
            parseSleepTimerQuery(input, configuredTotalMinutes()),
            context.t,
        ).text,
        execute: (input, context) => {
            const result = parseSleepTimerQuery(input, configuredTotalMinutes());
            if (!result.ok) {
                useSettingsUiStore.getState().statusSetter?.({
                    type: 'error',
                    text: describeSleepTimerQuery(result, context.t).text,
                });
                return false;
            }

            const {
                handleToggleSleepTimer,
                handleSetSleepTimerHours,
                handleSetSleepTimerMinutes,
            } = useSettingsUiStore.getState();

            if (result.action === 'disable') {
                handleToggleSleepTimer(false);
                return true;
            }

            handleSetSleepTimerHours(Math.floor(result.totalMinutes / 60));
            handleSetSleepTimerMinutes(result.totalMinutes % 60);
            handleToggleSleepTimer(true);
            return true;
        },
    },
];
