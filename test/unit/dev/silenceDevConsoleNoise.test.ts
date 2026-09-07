import { describe, expect, it } from 'vitest';
import { isReactDevToolsTipMessage } from '@/utils/dev/silenceDevConsoleNoise';

// Pure filter for React DevTools console tip.

describe('silenceDevConsoleNoise', () => {
    it('recognizes the React DevTools tip', () => {
        expect(isReactDevToolsTipMessage(
            'Download the React DevTools for a better development experience: https://react.dev/link/react-devtools',
        )).toBe(true);
        expect(isReactDevToolsTipMessage('keep-me')).toBe(false);
        expect(isReactDevToolsTipMessage(undefined)).toBe(false);
    });
});
