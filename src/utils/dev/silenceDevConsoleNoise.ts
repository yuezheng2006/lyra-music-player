// src/utils/dev/silenceDevConsoleNoise.ts
// Drop known third-party / framework console tips that are not actionable in Electron.

const REACT_DEVTOOLS_TIP = 'Download the React DevTools for a better development experience';

/** True when a console argument is the React DevTools install tip. */
export function isReactDevToolsTipMessage(value: unknown): boolean {
    return typeof value === 'string' && value.includes(REACT_DEVTOOLS_TIP);
}

/** Mute React DevTools install tip in the Electron renderer console. */
export function silenceDevConsoleNoise(): void {
    if (!import.meta.env.DEV) return;

    const wrap = (method: 'info' | 'log' | 'warn') => {
        const original = console[method].bind(console);
        console[method] = (...args: unknown[]) => {
            if (isReactDevToolsTipMessage(args[0])) {
                return;
            }
            original(...args);
        };
    };

    wrap('info');
    wrap('log');
    wrap('warn');
}
