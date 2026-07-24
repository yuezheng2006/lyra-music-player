import * as THREE from 'three';
import { PLANE_SIZE } from './buildCoverParticleGeometry';
import {
    COVER_PARTICLE_RIPPLE_BANDS,
    COVER_PARTICLE_RIPPLE_MAX,
    COVER_PARTICLE_RIPPLE_SLOTS_PER_BAND,
    createCoverParticleBandTracker,
    resolveCoverParticleRippleSlotIndex,
    stepCoverParticleBandTracker,
    type CoverParticleBandTracker,
} from '../../../../utils/visualizer/coverParticleBandTrackerMath';

// src/components/visualizer/geometric/webgl/coverParticleRipples.ts
// Band-slotted ripple rings for Emily silk cover particles (Mineradio uRippleTex).

type RippleSlot = {
    x: number;
    y: number;
    age: number;
    str: number;
};

const buildEmilyRippleRegions = (regionScale: number) => Array.from({ length: 9 }, (_, index) => {
    const rx = index % 3;
    const ry = Math.floor(index / 3);
    return {
        x: (rx / 2 - 0.5) * PLANE_SIZE * 0.72 * regionScale,
        y: (ry / 2 - 0.5) * PLANE_SIZE * 0.72 * regionScale,
    };
});

const EMILY_RIPPLE_REGIONS = COVER_PARTICLE_RIPPLE_BANDS.map(band => (
    buildEmilyRippleRegions(band.regionScale)
));

/** 管理封面粒子频段涟漪数据纹理（bass / mid / treble 各占私有槽位）。 */
export class CoverParticleRippleField {
    readonly texture: THREE.DataTexture;

    private readonly data = new Float32Array(COVER_PARTICLE_RIPPLE_MAX * 4);

    private readonly slots: RippleSlot[] = Array.from({ length: COVER_PARTICLE_RIPPLE_MAX }, () => ({
        x: 0,
        y: 0,
        age: -10,
        str: 0,
    }));

    private readonly bandTrackers: CoverParticleBandTracker[] = COVER_PARTICLE_RIPPLE_BANDS.map(
        () => createCoverParticleBandTracker(),
    );

    private readonly bandCursors = COVER_PARTICLE_RIPPLE_BANDS.map(() => 0);

    constructor() {
        this.texture = new THREE.DataTexture(
            this.data,
            1,
            COVER_PARTICLE_RIPPLE_MAX,
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

    /** 每帧推进涟漪；各频段 onset 只写入本频段私有槽位。 */
    tick(
        dt: number,
        _elapsed: number,
        bass: number,
        mid: number,
        treble: number,
        emilyPreset: boolean,
        paused: boolean,
    ) {
        if (paused) {
            this.clear();
            return 0;
        }

        const levels = [bass, mid, treble];
        if (emilyPreset) {
            for (let bandIndex = 0; bandIndex < COVER_PARTICLE_RIPPLE_BANDS.length; bandIndex += 1) {
                const signal = stepCoverParticleBandTracker(
                    this.bandTrackers[bandIndex],
                    levels[bandIndex] ?? 0,
                    dt,
                );
                if (!signal.onset) continue;
                const band = COVER_PARTICLE_RIPPLE_BANDS[bandIndex];
                const regions = EMILY_RIPPLE_REGIONS[bandIndex];
                const region = regions[Math.floor(Math.random() * regions.length)];
                const jx = region.x + (Math.random() - 0.5) * 0.55 * band.regionScale;
                const jy = region.y + (Math.random() - 0.5) * 0.55 * band.regionScale;
                const strength = (
                    0.42
                    + signal.transient * 1.15
                    + (levels[bandIndex] ?? 0) * 0.55
                    + Math.random() * 0.18
                ) * band.strength;
                this.triggerBand(bandIndex, jx, jy, strength);
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
        for (let i = 0; i < this.bandTrackers.length; i += 1) {
            this.bandTrackers[i] = createCoverParticleBandTracker();
            this.bandCursors[i] = 0;
        }
        this.syncTexture();
    }

    private triggerBand(bandIndex: number, x: number, y: number, strength: number) {
        const cursor = this.bandCursors[bandIndex];
        const slotIndex = resolveCoverParticleRippleSlotIndex(
            bandIndex,
            cursor,
            COVER_PARTICLE_RIPPLE_SLOTS_PER_BAND,
        );
        this.bandCursors[bandIndex] = (cursor + 1) % COVER_PARTICLE_RIPPLE_SLOTS_PER_BAND;
        const slot = this.slots[slotIndex];
        slot.x = x;
        slot.y = y;
        slot.age = 0;
        slot.str = strength;
    }

    private syncTexture() {
        for (let i = 0; i < COVER_PARTICLE_RIPPLE_MAX; i += 1) {
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
