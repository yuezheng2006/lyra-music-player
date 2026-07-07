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
            if ('map' in entry && entry.map) entry.map.dispose();
            if ('uniforms' in entry && entry.uniforms?.uMap?.value instanceof THREE.Texture) {
                entry.uniforms.uMap.value.dispose();
            }
            entry.dispose();
        });
        maybeMesh.geometry?.dispose();
    });
};
