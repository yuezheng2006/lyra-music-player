// src/utils/visualizer/turntable/bakeVinylSpinLayer.ts
// Asymmetric dust / lead-in / smudges that rotate so RPM is readable on a static groove disc.

const materialNoise = (index: number, salt: number): number => {
    const raw = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
    return raw - Math.floor(raw);
};

/** Paint rotating surface cues onto an existing square canvas (transparent outside disc). */
export const paintVinylSpinLayer = (
    ctx: CanvasRenderingContext2D,
    size: number,
): void => {
    const d = size;
    const c = d * 0.5;
    ctx.clearRect(0, 0, d, d);

    // Bright radial lead-in locked to disc angle — primary RPM cue.
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(-0.35);
    const lead = ctx.createLinearGradient(0, 0, d * 0.48, 0);
    lead.addColorStop(0, 'rgba(255,255,255,0)');
    lead.addColorStop(0.35, 'rgba(230,235,240,0.10)');
    lead.addColorStop(0.72, 'rgba(245,248,255,0.22)');
    lead.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = lead;
    ctx.lineWidth = Math.max(1.2, d * 0.0045);
    ctx.beginPath();
    ctx.moveTo(d * 0.12, 0);
    ctx.lineTo(d * 0.46, 0);
    ctx.stroke();
    ctx.restore();

    // Handling smudge arcs.
    for (let smudge = 0; smudge < 3; smudge += 1) {
        const radius = d * (0.30 + materialNoise(smudge, 51.3) * 0.16);
        const start = materialNoise(smudge, 52.9) * Math.PI * 2;
        const sweep = (16 + materialNoise(smudge, 53.7) * 24) * (Math.PI / 180);
        ctx.strokeStyle = 'rgba(255,255,255,0.028)';
        ctx.lineWidth = d * 0.035;
        ctx.beginPath();
        ctx.arc(c, c, radius, start, start + sweep);
        ctx.stroke();
    }

    // Dust specks.
    for (let dust = 0; dust < 28; dust += 1) {
        const angle = materialNoise(dust, 8.1) * Math.PI * 2;
        const radius = d * (0.20 + materialNoise(dust, 9.2) * 0.27);
        const x = c + Math.cos(angle) * radius;
        const y = c + Math.sin(angle) * radius;
        const w = 0.5 + materialNoise(dust, 10.2) * 1.4;
        const h = 0.3 + materialNoise(dust, 11.3) * 0.7;
        ctx.fillStyle = `rgba(255,255,255,${0.03 + materialNoise(dust, 12.2) * 0.08})`;
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, angle, 0, Math.PI * 2);
        ctx.fill();
    }
};
