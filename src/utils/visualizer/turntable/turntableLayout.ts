// src/utils/visualizer/turntable/turntableLayout.ts
// Floating hero disc + tonearm; no aluminum chassis plate.

export type TurntableLayout = Readonly<{
    width: number;
    height: number;
    unit: number;
    deckW: number;
    deckH: number;
    deckCx: number;
    deckCy: number;
    /** Always 0 — sleeve removed. */
    sleeveSide: number;
    sleeveCx: number;
    sleeveCy: number;
    platterD: number;
    recordD: number;
    platterCx: number;
    platterCy: number;
    pivotX: number;
    pivotY: number;
}>;

/** Centered vinyl + dark mat; pivot sits upper-right of the disc. */
export const resolveTurntableLayout = (width: number, height: number): TurntableLayout => {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const recordD = Math.min(w, h) * 0.76;
    const platterD = recordD * 1.08;
    const platterCx = w * 0.48;
    const platterCy = h * 0.50;
    const pivotX = platterCx + recordD * 0.54;
    const pivotY = platterCy - recordD * 0.42;
    // Legacy deck fields kept for callers; unused for chassis draw.
    const deckH = recordD * 1.05;
    const deckW = deckH * 1.32;
    const deckCx = platterCx + recordD * 0.12;
    const deckCy = platterCy;

    return {
        width: w,
        height: h,
        unit: recordD,
        deckW,
        deckH,
        deckCx,
        deckCy,
        sleeveSide: 0,
        sleeveCx: platterCx,
        sleeveCy: platterCy,
        platterD,
        recordD,
        platterCx,
        platterCy,
        pivotX,
        pivotY,
    };
};
