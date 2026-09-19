import { describe, expect, it } from 'vitest';
import { resolveHomeViewTabForSession } from '../../../src/utils/home/resolveLandingHomeViewTab';

// test/unit/home/resolveLandingHomeViewTab.test.ts

describe('resolveHomeViewTabForSession', () => {
    it('sends guests away from the playlist home onto search', () => {
        expect(resolveHomeViewTabForSession('playlist', false)).toBe('charts');
    });

    it('keeps playlists when a personal library exists', () => {
        expect(resolveHomeViewTabForSession('playlist', true)).toBe('playlist');
    });

    it('does not steal other browse tabs from guests', () => {
        expect(resolveHomeViewTabForSession('local', false)).toBe('local');
        expect(resolveHomeViewTabForSession('charts', false)).toBe('charts');
        expect(resolveHomeViewTabForSession('history', true)).toBe('history');
    });
});
