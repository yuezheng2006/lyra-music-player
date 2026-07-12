import * as THREE from 'three';
import {
    COVER_PARTICLE_BLOOM_FRAGMENT_SHADER,
    COVER_PARTICLE_BLOOM_VERTEX_SHADER,
    COVER_PARTICLE_FRAGMENT_SHADER,
    COVER_PARTICLE_VERTEX_SHADER,
} from './coverParticleShaders';

// src/components/visualizer/geometric/webgl/coverParticleMaterials.ts
// Shared Mineradio-style main + bloom shader materials for cover particles.

export type CoverParticleUniforms = Record<string, THREE.IUniform>;

export interface CoverParticleMaterials {
    uniforms: CoverParticleUniforms;
    mainMaterial: THREE.ShaderMaterial;
    bloomMaterial: THREE.ShaderMaterial;
}

export const createCoverParticleMaterials = (
    dotTexture: THREE.Texture,
    fallbackCoverTexture: THREE.Texture,
): CoverParticleMaterials => {
    const uniforms: CoverParticleUniforms = {
        uTime: { value: 0 },
        uSpeed: { value: 1 },
        uPreset: { value: 0 },
        uIntensity: { value: 0.85 },
        uDepth: { value: 1 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uBass: { value: 0 },
        uBeat: { value: 0 },
        uEnergy: { value: 0 },
        uBurstAmt: { value: 0 },
        uVinylSpin: { value: 0 },
        uCoverRes: { value: 1 },
        uCoverWarp: { value: 1 },
        uColorBoost: { value: 1.28 },
        uHasCover: { value: 0 },
        uPixel: { value: 1 },
        uPointScale: { value: 1 },
        uColorMixT: { value: 1 },
        uCoverTex: { value: fallbackCoverTexture },
        uPrevCoverTex: { value: fallbackCoverTexture },
        uEdgeTex: { value: fallbackCoverTexture },
        uHasDepth: { value: 0 },
        uEdgeEnabled: { value: 0 },
        uAiBoost: { value: 1 },
        uMouseXY: { value: new THREE.Vector2(0, 0) },
        uMouseActive: { value: 0 },
        uLoading: { value: 0 },
        uRippleTex: { value: null as THREE.Texture | null },
        uRippleCount: { value: 0 },
        uDotTex: { value: dotTexture },
        uAlpha: { value: 0 },
        uBloomStrength: { value: 0.62 },
        uParticleDim: { value: 1 },
        uImmersion: { value: 0 },
    };

    const mainMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: COVER_PARTICLE_VERTEX_SHADER,
        fragmentShader: COVER_PARTICLE_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
    });

    const bloomMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: COVER_PARTICLE_BLOOM_VERTEX_SHADER,
        fragmentShader: COVER_PARTICLE_BLOOM_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
    });

    return { uniforms, mainMaterial, bloomMaterial };
};
