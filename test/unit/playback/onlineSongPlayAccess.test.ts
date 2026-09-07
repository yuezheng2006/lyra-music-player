import { describe, expect, it } from 'vitest';
import type { SongResult } from '../../../src/types';
import {
    canOpenOnlineSong,
    hasProviderSessionForSong,
    isPermissionPreviewStream,
    shouldRejectPermissionPreviewStream,
    type OnlinePlaySessions,
} from '../../../src/utils/playback/onlineSongPlayAccess';

// test/unit/playback/onlineSongPlayAccess.test.ts

const song = (extras: Partial<SongResult> = {}): SongResult => ({
    id: 1,
    name: '布拉格广场',
    artists: [{ id: 1, name: '蔡依林' }],
    album: { id: 1, name: '看我72变' },
    duration: 294_000,
    musicProvider: 'qishui',
    ...extras,
});

const guest: OnlinePlaySessions = { netease: false, qq: false };
const netease: OnlinePlaySessions = { netease: true, qq: false };

describe('hasProviderSessionForSong', () => {
    it('blocks NetEase and QQ for guests', () => {
        expect(hasProviderSessionForSong(song({ musicProvider: 'netease' }), guest)).toBe(false);
        expect(hasProviderSessionForSong(song({ musicProvider: 'qq' }), guest)).toBe(false);
        expect(hasProviderSessionForSong(song({ musicProvider: 'qishui' }), guest)).toBe(true);
        expect(hasProviderSessionForSong(song({ musicProvider: 'coco' }), guest)).toBe(true);
    });

    it('allows NetEase after that platform is signed in', () => {
        expect(hasProviderSessionForSong(song({ musicProvider: 'netease' }), netease)).toBe(true);
        expect(hasProviderSessionForSong(song({ musicProvider: 'qq' }), netease)).toBe(false);
    });
});

describe('canOpenOnlineSong', () => {
    it('does not open guest NetEase chart tracks', () => {
        expect(canOpenOnlineSong(song({ musicProvider: 'netease' }), guest)).toBe(false);
    });

    it('drops titled preview clips even on free peers', () => {
        expect(canOpenOnlineSong(song({ name: '晴天 试听', musicProvider: 'coco' }), guest)).toBe(false);
    });

    it('keeps full peer listings for guests', () => {
        expect(canOpenOnlineSong(song({ musicProvider: 'qishui' }), guest)).toBe(true);
        expect(canOpenOnlineSong(song({ musicProvider: 'rss', contentType: 'podcast' }), guest)).toBe(true);
    });
});

describe('isPermissionPreviewStream', () => {
    it('flags a 30s stream against a 4:54 catalog', () => {
        expect(isPermissionPreviewStream(30, 294)).toBe(true);
        expect(isPermissionPreviewStream(30.08, 294)).toBe(true);
    });

    it('keeps real short songs and matching full streams', () => {
        expect(isPermissionPreviewStream(30, 30)).toBe(false);
        expect(isPermissionPreviewStream(185, 185)).toBe(false);
        expect(isPermissionPreviewStream(45, 50)).toBe(false);
    });
});

describe('shouldRejectPermissionPreviewStream', () => {
    it('rejects peer 30s trials for everyone', () => {
        expect(shouldRejectPermissionPreviewStream(song(), 30, netease)).toBe(true);
        expect(shouldRejectPermissionPreviewStream(song(), 30, guest)).toBe(true);
    });

    it('rejects NetEase 30s trials only when that account is missing', () => {
        const neteaseSong = song({ musicProvider: 'netease' });
        expect(shouldRejectPermissionPreviewStream(neteaseSong, 30, guest)).toBe(true);
        expect(shouldRejectPermissionPreviewStream(neteaseSong, 30, netease)).toBe(false);
    });
});
