import { describe, expect, it } from 'vitest';
import { Group, AnimationClip } from 'three';
import { loadCharacterGltf } from '../../../src/components/character/loadCharacterGltf';
import type { CharacterGltfLoader } from '../../../src/components/character/loadCharacterGltf';

// test/unit/character/loadCharacterGltf.test.ts

describe('loadCharacterGltf', () => {
  it('rejects empty URLs', async () => {
    await expect(loadCharacterGltf({ url: '  ' })).rejects.toThrow(/empty/i);
  });

  it('resolves scene and clip names from the loader', async () => {
    const scene = new Group();
    const clips = [new AnimationClip('Survey', 1, []), new AnimationClip('Walk', 1, [])];
    const loader: CharacterGltfLoader = {
      load: (_url, onLoad) => {
        onLoad({ scene, animations: clips });
      },
    };

    const result = await loadCharacterGltf({ url: '/assets/character/lyra-fox.glb' }, loader);
    expect(result.scene).toBe(scene);
    expect(result.clipNames).toEqual(['Survey', 'Walk']);
    expect(result.url).toContain('lyra-fox.glb');
  });

  it('rejects on loader error', async () => {
    const loader: CharacterGltfLoader = {
      load: (_url, _onLoad, _onProgress, onError) => {
        onError?.(new Error('network fail'));
      },
    };

    await expect(loadCharacterGltf({ url: '/missing.glb' }, loader)).rejects.toThrow(/network fail/);
  });

  it('aborts when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      loadCharacterGltf({ url: '/assets/character/lyra-fox.glb', signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('aborts an in-flight load', async () => {
    const controller = new AbortController();
    const loader: CharacterGltfLoader = {
      load: () => {
        // never calls back — abort wins
      },
    };

    const promise = loadCharacterGltf(
      { url: '/assets/character/lyra-fox.glb', signal: controller.signal },
      loader,
    );
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
