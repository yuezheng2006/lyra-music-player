import { describe, expect, it } from 'vitest';
import { DEFAULT_INTERACTIVE3D_SCENE_TUNING } from '@/types';
import {
    buildPlaylistShelfItems,
    buildPlaylistShelfSignature,
} from '@/components/visualizer/geometric/shelf/buildPlaylistShelfItems';
import {
    advanceShelfSelection,
    computeShelfCardSpacing,
    computeShelfCardTransform,
    resolveDefaultShelfAngleY,
    resolveShelfLayoutProfile,
    shouldRenderPlaylistShelf,
} from '@/components/visualizer/geometric/shelf/shelfLayout';
import { resolveStoredInteractive3dSceneTuning } from '@/components/visualizer/geometric/interactive3dSceneRegistry';

describe('playlist shelf layout', () => {
    it('resolves sidebar static camera angle to -15 degrees', () => {
        expect(resolveDefaultShelfAngleY('sidebar', 'static')).toBe(-15);
        expect(resolveDefaultShelfAngleY('sidebar', 'dynamic')).toBe(0);
        expect(resolveDefaultShelfAngleY('stage', 'static')).toBe(0);
    });

    it('builds layout profile offsets for sidebar mode', () => {
        const profile = resolveShelfLayoutProfile({
            ...DEFAULT_INTERACTIVE3D_SCENE_TUNING,
            shelfMode: 'sidebar',
            shelfCameraMode: 'static',
        });

        expect(profile.mode).toBe('sidebar');
        expect(profile.offsetX).toBeGreaterThan(0.5);
        expect(profile.angleY).toBe(-15);
    });

    it('centers selected card with higher scale and opacity', () => {
        const profile = resolveShelfLayoutProfile({
            ...DEFAULT_INTERACTIVE3D_SCENE_TUNING,
            shelfMode: 'sidebar',
        });

        const center = computeShelfCardTransform({
            mode: 'sidebar',
            profile,
            index: 2,
            selectedIndex: 2,
            total: 5,
        });
        const neighbor = computeShelfCardTransform({
            mode: 'sidebar',
            profile,
            index: 1,
            selectedIndex: 2,
            total: 5,
        });

        expect(center.isCenter).toBe(true);
        expect(center.scale).toBeGreaterThan(neighbor.scale);
        expect(center.opacity).toBeGreaterThan(neighbor.opacity);
        expect(center.z).toBeGreaterThan(neighbor.z);
    });

    it('wraps shelf selection when scrolling past ends', () => {
        expect(advanceShelfSelection(0, -1, 4)).toBe(3);
        expect(advanceShelfSelection(3, 1, 4)).toBe(0);
    });

    it('scales card spacing with shelf size', () => {
        expect(computeShelfCardSpacing(1)).toBeCloseTo(0.11, 2);
        expect(computeShelfCardSpacing(2)).toBe(0.16);
    });
});

describe('playlist shelf preset resolution', () => {
    it('normalizes invalid shelf tuning values from storage', () => {
        expect(resolveStoredInteractive3dSceneTuning({
            shelfMode: 'invalid' as never,
            shelfPresence: 'invalid' as never,
            shelfCameraMode: 'invalid' as never,
        })).toMatchObject({
            shelfMode: 'off',
            shelfPresence: 'auto',
            shelfCameraMode: 'dynamic',
        });
    });

    it('only renders shelf stage when mode is not off', () => {
        expect(shouldRenderPlaylistShelf({ shelfMode: 'off' })).toBe(false);
        expect(shouldRenderPlaylistShelf({ shelfMode: 'sidebar' })).toBe(true);
    });
});

describe('playlist shelf item builder', () => {
    it('maps queue and playlists into stable shelf cards', () => {
        const items = buildPlaylistShelfItems({
            playQueue: [{ id: 1, name: 'Song A', al: { picUrl: 'https://cover/a.jpg' } } as never],
            localPlaylists: [{ id: 'lp1', name: 'Local Mix', songIds: ['a', 'b'], createdAt: 1, updatedAt: 1 }],
            neteasePlaylists: [{
                id: 99,
                name: 'Cloud',
                coverImgUrl: 'https://cover/cloud.jpg',
                trackCount: 12,
                playCount: 0,
                updateTime: 0,
                trackUpdateTime: 0,
                creator: { userId: 1, nickname: 'me', avatarUrl: '' },
            }],
        });

        expect(items.map(item => item.id)).toEqual([
            'queue:current',
            'local:lp1',
            'netease:99',
        ]);
        expect(buildPlaylistShelfSignature(items)).toContain('queue:current');
    });
});
