import * as THREE from 'three';
import { PLANE_SIZE } from './buildCoverParticleGeometry';

// src/components/visualizer/geometric/webgl/coverParticleRipples.ts
// Bass-triggered ripple rings for Emily silk cover particles (Mineradio uRippleTex).

const RIPPLE_MAX = 12;
const BASS_THRESHOLD = 0.38;
const RIPPLE_COOLDOWN = 0.45;

type RippleSlot = {
    x: number;
    y: number;
    age: number;
    str: number;
};

const buildEmilyRippleRegions = () => Array.from({ length: 9 }, (_, index) => {
    const rx = index % 3;
    const ry = Math.floor(index / 3);
    return {
        x: (rx / 2 - 0.5) * PLANE_SIZE * 0.72,
        y: (ry / 2 - 0.5) * PLANE_SIZE * 0.72,
    };
});

const EMILY_RIPPLE_REGIONS = buildEmilyRippleRegions();

/** 管理封面粒子 bass 涟漪数据纹理。 */
export class CoverParticleRippleField {
    readonly texture: THREE.DataTexture;

    private readonly data = new Float32Array(RIPPLE_MAX * 4);

    private readonly slots: RippleSlot[] = Array.from({ length: RIPPLE_MAX }, () => ({
        x: 0,
        y: 0,
        age: -10,
        str: 0,
    }));

    private writeIndex = 0;

    private lastBassRising = false;

    private lastRippleAt = -999;

    constructor() {
        this.texture = new THREE.DataTexture(
            this.data,
            1,
            RIPPLE_MAX,
            THREE.RGBAFormat,
            THREE.FloatType,
        );
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;
        this.syncTexture();
    }

    dispose() {
        this.texture.dispose();
    }

    /** 每帧推进涟漪并在 bass 命中时生成新涟漪。 */
    tick(dt: number, elapsed: number, bass: number, emilyPreset: boolean, paused: boolean) {
        if (paused) {
            this.clear();
            return 0;
        }

        const isBassHit = bass > BASS_THRESHOLD && !this.lastBassRising;
        this.lastBassRising = bass > BASS_THRESHOLD * 0.75;

        if (emilyPreset && isBassHit && (elapsed - this.lastRippleAt) > RIPPLE_COOLDOWN) {
            this.lastRippleAt = elapsed;
            const count = 2 + (Math.random() < 0.5 ? 0 : 1);
            const used = new Set<number>();
            for (let k = 0; k < count; k += 1) {
                let idx = Math.floor(Math.random() * EMILY_RIPPLE_REGIONS.length);
                let tries = 0;
                while (used.has(idx) && tries < 12) {
                    idx = Math.floor(Math.random() * EMILY_RIPPLE_REGIONS.length);
                    tries += 1;
                }
                used.add(idx);
                const region = EMILY_RIPPLE_REGIONS[idx];
                const jx = region.x + (Math.random() - 0.5) * 0.7;
                const jy = region.y + (Math.random() - 0.5) * 0.7;
                const strength = 0.65 + bass * 1.4 + Math.random() * 0.25;
                this.trigger(jx, jy, strength);
            }
        }

        let active = 0;
        for (const slot of this.slots) {
            if (slot.str > 0.005) {
                slot.age += dt;
                if (slot.age > 2) {
                    slot.str = 0;
                    slot.age = -10;
                } else {
                    active += 1;
                }
            }
        }

        this.syncTexture();
        return active;
    }

    clear() {
        for (const slot of this.slots) {
            slot.x = 0;
            slot.y = 0;
            slot.age = -10;
            slot.str = 0;
        }
        this.syncTexture();
    }

    private trigger(x: number, y: number, strength: number) {
        const slot = this.slots[this.writeIndex];
        slot.x = x;
        slot.y = y;
        slot.age = 0;
        slot.str = strength;
        this.writeIndex = (this.writeIndex + 1) % RIPPLE_MAX;
    }

    private syncTexture() {
        for (let i = 0; i < RIPPLE_MAX; i += 1) {
            const slot = this.slots[i];
            const offset = i * 4;
            this.data[offset] = slot.x;
            this.data[offset + 1] = slot.y;
            this.data[offset + 2] = slot.age;
            this.data[offset + 3] = slot.str;
        }
        this.texture.needsUpdate = true;
    }
}
