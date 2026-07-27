import { describe, expect, it } from 'vitest';
import {
    KEYBOARD_VOLUME_STEP,
    resolveVolumeStepAdjustment,
} from '@/utils/playback/adjustVolumeByStepMath';

describe('resolveVolumeStepAdjustment', () => {
    it('steps volume by 5% and clamps to 0–1', () => {
        expect(resolveVolumeStepAdjustment({
            volume: 0.5,
            isMuted: false,
            delta: KEYBOARD_VOLUME_STEP,
        })).toEqual({
            nextVolume: 0.55,
            volumeChanged: true,
            shouldUnmute: false,
        });

        expect(resolveVolumeStepAdjustment({
            volume: 0.02,
            isMuted: false,
            delta: -KEYBOARD_VOLUME_STEP,
        }).nextVolume).toBe(0);

        expect(resolveVolumeStepAdjustment({
            volume: 0.98,
            isMuted: false,
            delta: KEYBOARD_VOLUME_STEP,
        }).nextVolume).toBe(1);
    });

    it('unmutes on volume-up while muted', () => {
        expect(resolveVolumeStepAdjustment({
            volume: 0.4,
            isMuted: true,
            delta: KEYBOARD_VOLUME_STEP,
        })).toEqual({
            nextVolume: 0.45,
            volumeChanged: true,
            shouldUnmute: true,
        });
    });

    it('does not unmute on volume-down', () => {
        expect(resolveVolumeStepAdjustment({
            volume: 0.4,
            isMuted: true,
            delta: -KEYBOARD_VOLUME_STEP,
        }).shouldUnmute).toBe(false);
    });
});
