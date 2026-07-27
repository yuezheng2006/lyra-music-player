import { describe, expect, it } from 'vitest';
import {
  computeMagneticPullGoal,
  isMagneticPullIdle,
  stepMagneticPull,
} from '../../../src/utils/ui/magneticPullMath';

// test/unit/ui/magneticPullMath.test.ts

describe('magneticPullMath', () => {
  it('pulls toward the pointer within maxPull', () => {
    const goal = computeMagneticPullGoal(60, 40, 0, 0, 40, 40, 0.2, 10);
    expect(goal.x).toBeGreaterThan(0);
    expect(goal.y).toBeGreaterThan(0);
    expect(Math.abs(goal.x)).toBeLessThanOrEqual(10);
    expect(Math.abs(goal.y)).toBeLessThanOrEqual(10);
  });

  it('returns near-zero far from the host', () => {
    const goal = computeMagneticPullGoal(800, 800, 0, 0, 40, 40, 0.2, 10);
    expect(Math.abs(goal.x)).toBeLessThan(0.5);
    expect(Math.abs(goal.y)).toBeLessThan(0.5);
  });

  it('steps toward the goal and detects idle', () => {
    const next = stepMagneticPull({ x: 0, y: 0 }, { x: 10, y: -8 }, 0.5);
    expect(next.x).toBe(5);
    expect(next.y).toBe(-4);
    expect(isMagneticPullIdle({ x: 0.01, y: -0.01 }, { x: 0, y: 0 })).toBe(true);
    expect(isMagneticPullIdle({ x: 2, y: 0 }, { x: 0, y: 0 })).toBe(false);
  });
});
