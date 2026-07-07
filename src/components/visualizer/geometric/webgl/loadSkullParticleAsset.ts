import * as THREE from 'three';

// src/components/visualizer/geometric/webgl/loadSkullParticleAsset.ts
// Loads Mineradio skull decimation point cloud binary.

const SKULL_ASSET_URL = '/assets/mineradio/skull-decimation-points.bin';

let cachedData: Float32Array | null = null;
let loadPromise: Promise<Float32Array | null> | null = null;
let loadFailed = false;

export const loadSkullParticleAsset = (): Promise<Float32Array | null> => {
    if (cachedData) return Promise.resolve(cachedData);
    if (loadFailed) return Promise.resolve(null);
    if (loadPromise) return loadPromise;

    loadPromise = fetch(SKULL_ASSET_URL, { cache: 'force-cache' })
        .then((response) => {
            if (!response.ok) throw new Error(`skull asset ${response.status}`);
            return response.arrayBuffer();
        })
        .then((buffer) => {
            if (!buffer || buffer.byteLength < 20 || buffer.byteLength % 20 !== 0) {
                throw new Error('invalid skull asset');
            }
            cachedData = new Float32Array(buffer);
            loadPromise = null;
            return cachedData;
        })
        .catch((error) => {
            console.warn('[mineradio-webgl] skull asset load failed:', error);
            loadFailed = true;
            loadPromise = null;
            return null;
        });

    return loadPromise;
};

export const buildSkullGeometryFromAsset = (asset: Float32Array): THREE.BufferGeometry => {
    const stride = 5;
    const count = asset.length / stride;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const kinds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
        const base = i * stride;
        positions[i * 3] = asset[base];
        positions[i * 3 + 1] = asset[base + 1];
        positions[i * 3 + 2] = asset[base + 2];
        seeds[i] = asset[base + 3];
        kinds[i] = asset[base + 4];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('kind', new THREE.BufferAttribute(kinds, 1));
    return geometry;
};
