import { describe, expect, it } from 'vitest';
import { AnimationClip, Object3D, VectorKeyframeTrack } from 'three';
import { CharacterAnimationController } from '../../../src/components/character/CharacterAnimationController';

// test/unit/character/CharacterAnimationController.test.ts

function makeClip(name: string): AnimationClip {
  const track = new VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 0, 1, 0]);
  return new AnimationClip(name, 1, [track]);
}

describe('CharacterAnimationController', () => {
  it('plays, pauses, resumes, and stops clips', () => {
    const root = new Object3D();
    const controller = new CharacterAnimationController();
    controller.bind(root, [makeClip('Survey'), makeClip('Walk')]);

    expect(controller.play('Survey')).toBe(true);
    expect(controller.getPlaybackState()).toBe('playing');
    expect(controller.getCurrentClipName()).toBe('Survey');

    controller.pause();
    expect(controller.getPlaybackState()).toBe('paused');

    controller.resume();
    expect(controller.getPlaybackState()).toBe('playing');

    expect(controller.play('Walk')).toBe(true);
    expect(controller.getCurrentClipName()).toBe('Walk');

    controller.stop();
    expect(controller.getPlaybackState()).toBe('stopped');
    expect(controller.getCurrentClipName()).toBeNull();
  });

  it('returns false for unknown clips', () => {
    const controller = new CharacterAnimationController();
    controller.bind(new Object3D(), [makeClip('Survey')]);
    expect(controller.play('Nope')).toBe(false);
  });

  it('plays preset actions and applies BPM timeScale', () => {
    const controller = new CharacterAnimationController();
    controller.bind(new Object3D(), [
      makeClip('Survey'),
      makeClip('Walk'),
      makeClip('Run'),
    ]);

    expect(controller.playAction('idle')).toBe(true);
    expect(controller.getCurrentActionId()).toBe('idle');
    expect(controller.getCurrentClipName()).toBe('Survey');

    expect(controller.playAction('dance-fast')).toBe(true);
    expect(controller.getCurrentActionId()).toBe('dance-fast');
    expect(controller.getCurrentClipName()).toBe('Run');

    controller.setBpm(60);
    // dance-fast base 1.15 * 0.5
    expect(controller.getTimeScale()).toBeCloseTo(0.575, 5);

    controller.setBpm(120);
    expect(controller.getTimeScale()).toBeCloseTo(1.15, 5);
  });

  it('supports blend weight on a secondary clip', () => {
    const controller = new CharacterAnimationController();
    controller.bind(new Object3D(), [makeClip('Survey'), makeClip('Walk')]);
    expect(controller.playAction('idle')).toBe(true);
    expect(controller.setBlendWeight('Walk', 0.4)).toBe(true);
    expect(controller.setBlendWeight('missing', 0.5)).toBe(false);
  });
});
