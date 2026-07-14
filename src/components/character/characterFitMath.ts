import * as THREE from 'three';

// src/components/character/characterFitMath.ts
// Fit a loaded character into the camera frustum without mutating camera FOV.

export type CharacterFitResult = {
  scale: number;
  center: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
};

/**
 * Compute uniform scale so the model height matches targetHeight.
 */
export function resolveCharacterFit(
  size: { x: number; y: number; z: number },
  targetHeight = 1.6,
): CharacterFitResult {
  const height = Math.max(size.y, 1e-4);
  const scale = targetHeight / height;
  return {
    scale,
    center: {
      x: 0,
      y: (size.y * scale) / 2,
      z: 0,
    },
    size: {
      x: size.x * scale,
      y: size.y * scale,
      z: size.z * scale,
    },
  };
}

/**
 * Measure an Object3D bounding box size in world units (before fit scaling).
 */
export function measureObjectSize(object: THREE.Object3D): { x: number; y: number; z: number } {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  return { x: size.x, y: size.y, z: size.z };
}

/**
 * Scale first, then re-center. Scaling before recentering avoids Khronos Fox-style
 * local-origin offsets throwing the mesh behind the camera.
 */
export function applyCharacterFit(
  root: THREE.Object3D,
  targetHeight = 1.6,
): CharacterFitResult {
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);

  const rawBox = new THREE.Box3().setFromObject(root);
  const rawSize = new THREE.Vector3();
  rawBox.getSize(rawSize);

  const fit = resolveCharacterFit(
    { x: rawSize.x, y: rawSize.y, z: rawSize.z },
    targetHeight,
  );
  root.scale.setScalar(fit.scale);
  root.updateMatrixWorld(true);

  const fittedBox = new THREE.Box3().setFromObject(root);
  const fittedSize = new THREE.Vector3();
  const fittedCenter = new THREE.Vector3();
  fittedBox.getSize(fittedSize);
  fittedBox.getCenter(fittedCenter);

  // Center on XZ; plant feet on y = 0.
  root.position.x += -fittedCenter.x;
  root.position.z += -fittedCenter.z;
  root.position.y += -fittedBox.min.y;
  root.updateMatrixWorld(true);

  return {
    scale: fit.scale,
    center: { x: 0, y: fittedSize.y / 2, z: 0 },
    size: { x: fittedSize.x, y: fittedSize.y, z: fittedSize.z },
  };
}
