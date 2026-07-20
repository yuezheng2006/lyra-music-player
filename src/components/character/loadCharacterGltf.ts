import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { CharacterGltfLoadResult, CharacterLoadOptions } from '../../types/character';
import { normalizeClipNames } from './characterAnimationMath';

// src/components/character/loadCharacterGltf.ts
// Loads .glb / .gltf character assets via Three.js GLTFLoader.

export type CharacterGltfLoader = {
  load: (
    url: string,
    onLoad: (gltf: { scene: THREE.Group; animations: THREE.AnimationClip[] }) => void,
    onProgress?: (event: ProgressEvent<EventTarget>) => void,
    onError?: (error: unknown) => void,
  ) => void;
};

/**
 * Load a character glTF/GLB. Supports AbortSignal cancellation.
 */
export function loadCharacterGltf(
  options: CharacterLoadOptions,
  loader: CharacterGltfLoader = new GLTFLoader(),
): Promise<CharacterGltfLoadResult> {
  const { url, signal } = options;

  if (!url || !url.trim()) {
    return Promise.reject(new Error('Character model URL is empty'));
  }

  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    loader.load(
      url,
      (gltf) => {
        signal?.removeEventListener('abort', onAbort);
        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }

        const clips = gltf.animations ?? [];
        resolve({
          scene: gltf.scene,
          clips,
          clipNames: normalizeClipNames(clips.map((clip) => clip.name || 'unnamed')),
          url,
        });
      },
      undefined,
      (error) => {
        signal?.removeEventListener('abort', onAbort);
        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        const message = error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Failed to load character glTF';
        reject(new Error(message));
      },
    );
  });
}
