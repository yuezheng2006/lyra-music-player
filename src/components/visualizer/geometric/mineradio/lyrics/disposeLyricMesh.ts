import * as THREE from 'three';

// src/components/visualizer/geometric/mineradio/lyrics/disposeLyricMesh.ts
// Disposes Mineradio lyric mesh groups and GPU resources.

export const disposeLyricMesh = (mesh: THREE.Object3D | null | undefined) => {
    if (!mesh) return;
    mesh.parent?.remove(mesh);
    mesh.traverse((object) => {
        const maybeMesh = object as THREE.Mesh;
        const material = maybeMesh.material;
        if (!material) return;
        const materials = Array.isArray(material) ? material : [material];
        materials.forEach((entry) => {
            const mat = entry as THREE.Material & {
                map?: THREE.Texture | null;
                uniforms?: { uMap?: { value?: unknown } };
            };
            if (mat.map) mat.map.dispose();
            const uMap = mat.uniforms?.uMap?.value;
            if (uMap instanceof THREE.Texture) {
                uMap.dispose();
            }
            mat.dispose();
        });
        maybeMesh.geometry?.dispose();
    });
};
