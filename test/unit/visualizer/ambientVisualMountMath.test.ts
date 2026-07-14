import { describe, expect, it } from 'vitest';
import { shouldMountAmbientVisual } from '../../../src/utils/atmosphere/ambientVisualMountMath';

// test/unit/visualizer/ambientVisualMountMath.test.ts

describe('shouldMountAmbientVisual', () => {
  it('mounts when enabled on balanced/high tiers', () => {
    expect(shouldMountAmbientVisual({ enabled: true, performanceTier: 'balanced' })).toBe(true);
    expect(shouldMountAmbientVisual({ enabled: true, performanceTier: 'high' })).toBe(true);
  });

  it('stays off when user disabled', () => {
    expect(shouldMountAmbientVisual({ enabled: false, performanceTier: 'high' })).toBe(false);
  });

  it('stays off on lite tier even when enabled', () => {
    expect(shouldMountAmbientVisual({ enabled: true, performanceTier: 'lite' })).toBe(false);
  });

  it('stays off in staticMode', () => {
    expect(shouldMountAmbientVisual({
      enabled: true,
      performanceTier: 'high',
      staticMode: true,
    })).toBe(false);
  });
});
