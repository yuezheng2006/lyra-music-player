import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

// test/unit/electron/desktopLyrics.test.ts
// Locks down the desktop lyrics IPC contract and payload normalization.

const require = createRequire(import.meta.url);
const {
    DESKTOP_LYRICS_IPC,
    DESKTOP_LYRICS_SETTING_KEYS,
    clampNumber,
    normalizeHotBounds,
    normalizeDesktopLyricsUpdatePayload,
} = require('../../../electron/desktopLyrics.cjs') as {
    DESKTOP_LYRICS_IPC: Record<string, string>;
    DESKTOP_LYRICS_SETTING_KEYS: Record<string, string>;
    clampNumber: (value: unknown, min: number, max: number, fallback: number) => number;
    normalizeHotBounds: (bounds: { left?: number; top?: number; right?: number; bottom?: number }) => {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
    normalizeDesktopLyricsUpdatePayload: (payload?: Record<string, unknown>) => Record<string, unknown>;
};

describe('desktopLyrics IPC contract', () => {
    it('exposes stable folia-prefixed invoke and event channels', () => {
        expect(DESKTOP_LYRICS_IPC.setEnabled).toBe('folia-desktop-lyrics-set-enabled');
        expect(DESKTOP_LYRICS_IPC.update).toBe('folia-desktop-lyrics-update');
        expect(DESKTOP_LYRICS_IPC.setLockState).toBe('folia-desktop-lyrics-set-lock-state');
        expect(DESKTOP_LYRICS_IPC.getStatus).toBe('folia-desktop-lyrics-get-status');
        expect(DESKTOP_LYRICS_IPC.stateEvent).toBe('folia-desktop-lyrics-state');
        expect(DESKTOP_LYRICS_IPC.lockStateEvent).toBe('folia-desktop-lyrics-lock-state');
        expect(DESKTOP_LYRICS_IPC.enabledStateEvent).toBe('folia-desktop-lyrics-enabled-state');
    });

    it('persists desktop lyrics preferences under dedicated store keys', () => {
        expect(DESKTOP_LYRICS_SETTING_KEYS.enabled).toBe('DESKTOP_LYRICS_ENABLED');
        expect(DESKTOP_LYRICS_SETTING_KEYS.userBounds).toBe('DESKTOP_LYRICS_USER_BOUNDS');
        expect(DESKTOP_LYRICS_SETTING_KEYS.y).toBe('DESKTOP_LYRICS_Y');
        expect(DESKTOP_LYRICS_SETTING_KEYS.opacity).toBe('DESKTOP_LYRICS_OPACITY');
    });
});

describe('desktopLyrics helpers', () => {
    it('clamps numeric overlay settings', () => {
        expect(clampNumber(2, 0, 1, 0.5)).toBe(1);
        expect(clampNumber('bad', 0, 1, 0.5)).toBe(0.5);
    });

    it('normalizes hot bounds with sane defaults', () => {
        expect(normalizeHotBounds({ left: 10, top: 20, right: 120, bottom: 80 })).toEqual({
            left: 10,
            top: 20,
            right: 120,
            bottom: 80,
        });
    });

    it('sanitizes lyric update payloads without mutating theme colors', () => {
        const payload = normalizeDesktopLyricsUpdatePayload({
            enabled: 1,
            clickThrough: 0,
            opacity: 2,
            y: 0.2,
            size: 3,
            text: '  hello   world  ',
            colors: { primary: '#ffffff', secondary: '#aabbcc', highlight: '#ffeeaa', glow: '#99ffcc' },
            playback: { time: -1, duration: 120, rate: 9 },
        });

        expect(payload.enabled).toBe(true);
        expect(payload.clickThrough).toBe(false);
        expect(payload.opacity).toBe(1);
        expect(payload.y).toBe(0.2);
        expect(payload.size).toBe(1.55);
        expect(payload.text).toBe('hello world');
        expect(payload.colors).toEqual({
            primary: '#ffffff',
            secondary: '#aabbcc',
            highlight: '#ffeeaa',
            glow: '#99ffcc',
        });
        expect(payload.playback).toEqual({
            time: 0,
            duration: 120,
            rate: 4,
        });
    });
});
