import { describe, expect, it, vi } from 'vitest';
import {
  advanceAmbientTransitionProgress,
  DEFAULT_AMBIENT_TRANSITION_DURATION,
  resolveAmbientCrossFade,
} from '../../../src/utils/atmosphere/ambientVisualTransition';
import { getVisualStrategyForEmotion } from '../../../src/types/moodEngine';
import { VisualStrategyManager } from '../../../src/components/visualizer/strategies/VisualStrategyManager';
import type { VisualStrategy, VisualStrategyType } from '../../../src/types/visualStrategy';
import type { BeatEvent } from '../../../src/types/atmosphere';
import * as THREE from 'three';

// test/unit/visualizer/visualStrategyManager.test.ts
// Strategy switching, cross-fade, and emotion mapping for Ticket 05.

function createMockStrategy(name: VisualStrategyType): VisualStrategy & {
  opacity: number;
  disposed: boolean;
} {
  const mock = {
    name,
    opacity: 1,
    disposed: false,
    init: vi.fn(),
    onBeat: vi.fn(),
    onBar: vi.fn(),
    onPhrase: vi.fn(),
    update: vi.fn(),
    dispose: vi.fn(() => {
      mock.disposed = true;
    }),
    setOpacity: vi.fn((opacity: number) => {
      mock.opacity = opacity;
    }),
  };
  return mock;
}

describe('ambient visual transition math', () => {
  it('uses a 2–3s default duration', () => {
    expect(DEFAULT_AMBIENT_TRANSITION_DURATION).toBeGreaterThanOrEqual(2);
    expect(DEFAULT_AMBIENT_TRANSITION_DURATION).toBeLessThanOrEqual(3);
  });

  it('cross-fades linearly', () => {
    expect(resolveAmbientCrossFade(0)).toEqual({ fadeOut: 1, fadeIn: 0 });
    expect(resolveAmbientCrossFade(0.5)).toEqual({ fadeOut: 0.5, fadeIn: 0.5 });
    expect(resolveAmbientCrossFade(1)).toEqual({ fadeOut: 0, fadeIn: 1 });
  });

  it('advances progress by delta / duration', () => {
    expect(advanceAmbientTransitionProgress(0, 1, 2)).toBe(0.5);
    expect(advanceAmbientTransitionProgress(0.9, 1, 2)).toBe(1);
  });
});

describe('emotion → strategy mapping', () => {
  it('maps happy/energetic to particle, calm/sad to wave, neutral to geometry', () => {
    expect(getVisualStrategyForEmotion('happy')).toBe('particle');
    expect(getVisualStrategyForEmotion('energetic')).toBe('particle');
    expect(getVisualStrategyForEmotion('uplifting')).toBe('particle');
    expect(getVisualStrategyForEmotion('sad')).toBe('wave');
    expect(getVisualStrategyForEmotion('calm')).toBe('wave');
    expect(getVisualStrategyForEmotion('neutral')).toBe('geometry');
    expect(getVisualStrategyForEmotion('romantic')).toBe('geometry');
  });
});

describe('VisualStrategyManager', () => {
  it('preloads all three strategy factories', () => {
    const manager = new VisualStrategyManager();
    expect(manager.preload().sort()).toEqual(['geometry', 'particle', 'wave']);
    expect(manager.isPreloaded()).toBe(true);
  });

  it('activates the first strategy immediately, then cross-fades on switch', () => {
    const particle = createMockStrategy('particle');
    const wave = createMockStrategy('wave');
    const geometry = createMockStrategy('geometry');

    const manager = new VisualStrategyManager({
      particle: () => particle,
      wave: () => wave,
      geometry: () => geometry,
    });

    const scene = new THREE.Scene();
    manager.init(scene);
    manager.setTransitionDuration(2);

    manager.switchStrategy('particle');
    expect(manager.getCurrentStrategyType()).toBe('particle');
    expect(manager.getIsTransitioning()).toBe(false);
    expect(particle.setOpacity).toHaveBeenCalledWith(1);

    manager.switchStrategy('wave');
    expect(manager.getIsTransitioning()).toBe(true);
    expect(wave.setOpacity).toHaveBeenCalledWith(0);

    manager.update(1);
    expect(manager.getTransitionProgress()).toBe(0.5);
    expect(particle.setOpacity).toHaveBeenCalledWith(0.5);
    expect(wave.setOpacity).toHaveBeenCalledWith(0.5);

    manager.update(1);
    expect(manager.getIsTransitioning()).toBe(false);
    expect(manager.getCurrentStrategyType()).toBe('wave');
    expect(particle.disposed).toBe(true);
    expect(wave.setOpacity).toHaveBeenCalledWith(1);
  });

  it('switchByEmotion selects particle for happy', () => {
    const particle = createMockStrategy('particle');
    const wave = createMockStrategy('wave');
    const geometry = createMockStrategy('geometry');

    const manager = new VisualStrategyManager({
      particle: () => particle,
      wave: () => wave,
      geometry: () => geometry,
    });
    manager.init(new THREE.Scene());
    manager.switchByEmotion('happy');
    expect(manager.getCurrentStrategyType()).toBe('particle');
  });

  it('routes rhythm events to the active strategy', () => {
    const particle = createMockStrategy('particle');
    const manager = new VisualStrategyManager({
      particle: () => particle,
      wave: () => createMockStrategy('wave'),
      geometry: () => createMockStrategy('geometry'),
    });
    manager.init(new THREE.Scene());
    manager.switchStrategy('particle');

    const event: BeatEvent = {
      time: 1,
      strength: 0.8,
      confidence: 1,
      combo: 'drop',
    };
    manager.onRhythmEvent(event);
    expect(particle.onBeat).toHaveBeenCalledWith(event);
    expect(particle.onBar).toHaveBeenCalledWith(event);
    expect(particle.onPhrase).toHaveBeenCalledWith(event);
  });
});
