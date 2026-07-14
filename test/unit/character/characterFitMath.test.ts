import { describe, expect, it } from 'vitest';
import { Box3, BoxGeometry, Group, Mesh, Vector3 } from 'three';
import {
  applyCharacterFit,
  resolveCharacterFit,
} from '../../../src/components/character/characterFitMath';

// test/unit/character/characterFitMath.test.ts

describe('characterFitMath', () => {
  it('scales model height to the target height', () => {
    const fit = resolveCharacterFit({ x: 2, y: 8, z: 2 }, 1.6);
    expect(fit.scale).toBeCloseTo(0.2, 6);
    expect(fit.size.y).toBeCloseTo(1.6, 6);
    expect(fit.center.y).toBeCloseTo(0.8, 6);
  });

  it('guards against zero-height models', () => {
    const fit = resolveCharacterFit({ x: 1, y: 0, z: 1 }, 1.6);
    expect(fit.scale).toBeGreaterThan(0);
    expect(Number.isFinite(fit.scale)).toBe(true);
  });

  it('applyCharacterFit keeps offset-origin models in front of a +Z camera', () => {
    // Mimic Fox: large mesh whose local origin is far from AABB center.
    const root = new Group();
    const mesh = new Mesh(new BoxGeometry(25, 80, 150));
    mesh.position.set(0, 40, -20);
    root.add(mesh);

    applyCharacterFit(root, 1.6);
    root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(root);
    const center = box.getCenter(new Vector3());
    expect(box.min.y).toBeCloseTo(0, 4);
    expect(box.max.y).toBeCloseTo(1.6, 4);
    expect(Math.abs(center.x)).toBeLessThan(0.05);
    expect(Math.abs(center.z)).toBeLessThan(0.05);
    expect(box.max.z).toBeLessThan(3);
    expect(box.min.z).toBeGreaterThan(-3);
  });
});
