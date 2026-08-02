// src/utils/visualizer/turntable/drawTurntableHardware.ts
// Photographic spindle / tonearm / deck controls (composition informed by vinylformac).

import { VINYL_SCENE_LIGHT, type VinylLightDir } from './vinylSurfaceMath';

const shadowOffset = (distance: number, light: VinylLightDir = VINYL_SCENE_LIGHT) => ({
    x: -light.x * distance,
    y: -light.y * distance,
});

const roundRectPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
) => {
    const radius = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
};

const drawCylinderRim = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    lineWidth: number,
    brightness = 0.6,
    darkness = 0.45,
) => {
    const g = ctx.createLinearGradient(
        cx + VINYL_SCENE_LIGHT.x * radius,
        cy + VINYL_SCENE_LIGHT.y * radius,
        cx - VINYL_SCENE_LIGHT.x * radius,
        cy - VINYL_SCENE_LIGHT.y * radius,
    );
    g.addColorStop(0, `rgba(255,255,255,${brightness})`);
    g.addColorStop(0.42, `rgba(200,198,190,${brightness * 0.25})`);
    g.addColorStop(1, `rgba(0,0,0,${darkness})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0.5, radius - lineWidth * 0.5), 0, Math.PI * 2);
    ctx.stroke();
};

const paintBrushedStreaks = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    seed = 7,
) => {
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, x, y, w, h, h * 0.04);
    ctx.clip();
    for (let i = 0; i < 48; i += 1) {
        const n = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
        const t = n - Math.floor(n);
        const yy = y + t * h;
        const alpha = 0.02 + (Math.sin(i * 3.1 + seed) * 0.5 + 0.5) * 0.045;
        ctx.strokeStyle = i % 3 === 0 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 0.6 + (i % 4) * 0.25;
        ctx.beginPath();
        ctx.moveTo(x - w * 0.05, yy);
        ctx.lineTo(x + w * 1.05, yy + (t - 0.5) * 1.5);
        ctx.stroke();
    }
    ctx.restore();
};

/** Champagne aluminum deck plate under the arm / controls (right of disc). */
export const drawTurntableDeckPlate = (
    ctx: CanvasRenderingContext2D,
    discCx: number,
    discCy: number,
    disc: number,
): void => {
    const deckW = disc * 1.18;
    const deckH = disc * 0.92;
    const deckX = discCx + disc * 0.08;
    const deckY = discCy - deckH * 0.48;
    const corner = deckH * 0.045;
    const sh = shadowOffset(deckH * 0.035);

    ctx.save();
    // Ambient + contact shadows.
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    roundRectPath(ctx, deckX + sh.x * 1.4, deckY + sh.y * 1.4, deckW, deckH, corner);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    roundRectPath(ctx, deckX + sh.x * 0.35, deckY + sh.y * 0.35, deckW, deckH, corner);
    ctx.fill();

    // Chassis side edge (thickness away from light).
    ctx.fillStyle = 'rgb(88, 84, 78)';
    roundRectPath(ctx, deckX + disc * 0.012, deckY + disc * 0.014, deckW, deckH, corner);
    ctx.fill();

    const face = ctx.createLinearGradient(deckX, deckY, deckX + deckW, deckY + deckH);
    face.addColorStop(0, 'rgb(226, 218, 201)');
    face.addColorStop(0.38, 'rgb(201, 193, 177)');
    face.addColorStop(0.74, 'rgb(170, 162, 147)');
    face.addColorStop(1, 'rgb(144, 138, 125)');
    ctx.fillStyle = face;
    roundRectPath(ctx, deckX, deckY, deckW, deckH, corner);
    ctx.fill();

    paintBrushedStreaks(ctx, deckX, deckY, deckW, deckH, 7);

    // Lamp bloom on face.
    const bloom = ctx.createRadialGradient(
        deckX + deckW * 0.12,
        deckY + deckH * 0.08,
        0,
        deckX + deckW * 0.12,
        deckY + deckH * 0.08,
        deckW * 0.55,
    );
    bloom.addColorStop(0, 'rgba(255, 235, 200, 0.28)');
    bloom.addColorStop(1, 'rgba(255, 235, 200, 0)');
    ctx.fillStyle = bloom;
    roundRectPath(ctx, deckX, deckY, deckW, deckH, corner);
    ctx.fill();

    // Far-edge occlusion.
    const falloff = ctx.createLinearGradient(deckX, deckY, deckX + deckW, deckY + deckH);
    falloff.addColorStop(0, 'rgba(0,0,0,0)');
    falloff.addColorStop(0.55, 'rgba(0,0,0,0)');
    falloff.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = falloff;
    roundRectPath(ctx, deckX, deckY, deckW, deckH, corner);
    ctx.fill();

    // Machined rim.
    const rim = ctx.createLinearGradient(deckX, deckY, deckX + deckW, deckY + deckH);
    rim.addColorStop(0, 'rgba(255,255,255,0.55)');
    rim.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.1;
    roundRectPath(ctx, deckX + 0.5, deckY + 0.5, deckW - 1, deckH - 1, corner);
    ctx.stroke();

    // Platter well ring (recess cue around the disc).
    ctx.strokeStyle = 'rgba(0,0,0,0.38)';
    ctx.lineWidth = disc * 0.018;
    ctx.beginPath();
    ctx.arc(discCx, discCy, disc * 0.508, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
};

/** Machined aluminum platter rim peeking outside the vinyl. */
export const drawPlatterRim = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    disc: number,
): void => {
    const outer = disc * 0.535;
    const inner = disc * 0.498;
    const g = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
    g.addColorStop(0, 'rgba(70, 68, 64, 0)');
    g.addColorStop(0.55, 'rgba(90, 86, 80, 0.85)');
    g.addColorStop(0.82, 'rgba(168, 162, 150, 0.95)');
    g.addColorStop(1, 'rgba(40, 38, 34, 0.7)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, Math.PI * 2);
    ctx.arc(cx, cy, inner, 0, Math.PI * 2, true);
    ctx.fillStyle = g;
    ctx.fill('evenodd');
    drawCylinderRim(ctx, cx, cy, outer, disc * 0.006, 0.45, 0.35);
    ctx.restore();
};

export const drawVinylSpindle = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    disc: number,
): void => {
    const d = disc * 0.034;
    const sh = shadowOffset(d * 0.22);

    ctx.save();
    // Soft contact under pin.
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(cx + sh.x, cy + sh.y, d * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Raised collar on the label (static boss).
    const collar = ctx.createRadialGradient(
        cx + VINYL_SCENE_LIGHT.x * d * 0.2,
        cy + VINYL_SCENE_LIGHT.y * d * 0.2,
        0,
        cx,
        cy,
        d * 1.15,
    );
    collar.addColorStop(0, 'rgba(220,220,220,0.55)');
    collar.addColorStop(0.55, 'rgba(90,90,90,0.35)');
    collar.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = collar;
    ctx.beginPath();
    ctx.arc(cx, cy, d * 1.15, 0, Math.PI * 2);
    ctx.fill();

    const body = ctx.createRadialGradient(
        cx + VINYL_SCENE_LIGHT.x * d * 0.5,
        cy + VINYL_SCENE_LIGHT.y * d * 0.5,
        0,
        cx,
        cy,
        d * 0.55,
    );
    body.addColorStop(0, 'rgb(252, 252, 252)');
    body.addColorStop(0.45, 'rgb(198, 198, 196)');
    body.addColorStop(1, 'rgb(92, 92, 90)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, d * 0.52, 0, Math.PI * 2);
    ctx.fill();
    drawCylinderRim(ctx, cx, cy, d * 0.52, Math.max(0.7, d * 0.1), 0.7, 0.5);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(
        cx + VINYL_SCENE_LIGHT.x * d * 0.2,
        cy + VINYL_SCENE_LIGHT.y * d * 0.2,
        d * 0.1,
        0,
        Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
};

const drawPivotTower = (
    ctx: CanvasRenderingContext2D,
    pivotX: number,
    pivotY: number,
    unit: number,
) => {
    const flangeR = unit * 0.058;
    const ringR = unit * 0.038;
    const capR = unit * 0.022;
    const sh = shadowOffset(unit * 0.016);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.arc(pivotX + sh.x, pivotY + sh.y, flangeR * 1.05, 0, Math.PI * 2);
    ctx.fill();

    const flange = ctx.createLinearGradient(
        pivotX - flangeR,
        pivotY - flangeR,
        pivotX + flangeR,
        pivotY + flangeR,
    );
    flange.addColorStop(0, 'rgb(220, 216, 206)');
    flange.addColorStop(1, 'rgb(138, 134, 126)');
    ctx.fillStyle = flange;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, flangeR, 0, Math.PI * 2);
    ctx.fill();
    drawCylinderRim(ctx, pivotX, pivotY, flangeR, flangeR * 0.08, 0.55, 0.4);

    const ringSh = shadowOffset(unit * 0.008);
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath();
    ctx.arc(pivotX + ringSh.x, pivotY + ringSh.y, ringR * 1.12, 0, Math.PI * 2);
    ctx.fill();

    const ring = ctx.createLinearGradient(
        pivotX - ringR,
        pivotY - ringR,
        pivotX + ringR,
        pivotY + ringR,
    );
    ring.addColorStop(0, 'rgb(236, 236, 234)');
    ring.addColorStop(1, 'rgb(120, 120, 118)');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, ringR, 0, Math.PI * 2);
    ctx.fill();
    drawCylinderRim(ctx, pivotX, pivotY, ringR, ringR * 0.14, 0.7, 0.5);

    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = unit * 0.003;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, capR * 1.18, 0, Math.PI * 2);
    ctx.stroke();

    const capSh = shadowOffset(unit * 0.004);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.arc(pivotX + capSh.x, pivotY + capSh.y, capR * 1.05, 0, Math.PI * 2);
    ctx.fill();

    const cap = ctx.createRadialGradient(
        pivotX + VINYL_SCENE_LIGHT.x * capR * 0.55,
        pivotY + VINYL_SCENE_LIGHT.y * capR * 0.55,
        0,
        pivotX,
        pivotY,
        capR,
    );
    cap.addColorStop(0, 'rgb(250, 250, 250)');
    cap.addColorStop(0.35, 'rgb(190, 190, 188)');
    cap.addColorStop(0.75, 'rgb(95, 95, 93)');
    cap.addColorStop(1, 'rgb(40, 40, 38)');
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, capR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(
        pivotX + VINYL_SCENE_LIGHT.x * capR * 0.35,
        pivotY + VINYL_SCENE_LIGHT.y * capR * 0.35,
        capR * 0.18,
        0,
        Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
};

const drawSpeedKnob = (
    ctx: CanvasRenderingContext2D,
    kx: number,
    ky: number,
    d: number,
) => {
    const sh = shadowOffset(d * 0.04);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.arc(kx - sh.x * 0.4, ky - sh.y * 0.4, d * 0.48, 0, Math.PI * 2);
    ctx.fill();

    const body = ctx.createLinearGradient(kx - d * 0.4, ky - d * 0.4, kx + d * 0.4, ky + d * 0.4);
    body.addColorStop(0, 'rgb(224, 222, 215)');
    body.addColorStop(1, 'rgb(148, 145, 140)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(kx, ky, d * 0.38, 0, Math.PI * 2);
    ctx.fill();

    const rim = ctx.createLinearGradient(kx - d * 0.4, ky - d * 0.4, kx + d * 0.4, ky + d * 0.4);
    rim.addColorStop(0, 'rgba(255,255,255,0.7)');
    rim.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(kx, ky, d * 0.38, 0, Math.PI * 2);
    ctx.stroke();

    const dome = ctx.createRadialGradient(
        kx + VINYL_SCENE_LIGHT.x * d * 0.2,
        ky + VINYL_SCENE_LIGHT.y * d * 0.2,
        0,
        kx,
        ky,
        d * 0.38,
    );
    dome.addColorStop(0, 'rgba(255,255,255,0.28)');
    dome.addColorStop(0.55, 'rgba(255,255,255,0)');
    dome.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.arc(kx, ky, d * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Indicator groove at ~33.
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate((-36 * Math.PI) / 180);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRectPath(ctx, -d * 0.012, -d * 0.30, d * 0.024, d * 0.20, d * 0.01);
    ctx.fill();
    ctx.restore();
    ctx.restore();
};

export const drawVinylTonearm = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    disc: number,
    opts?: { pivotX?: number; pivotY?: number; unit?: number; showDeckControls?: boolean },
): void => {
    const recordR = disc * 0.5;
    const pivotX = opts?.pivotX ?? (cx + disc * 0.52);
    const pivotY = opts?.pivotY ?? (cy - disc * 0.34);
    const stylusAngle = (68 * Math.PI) / 180;
    const stylusX = cx + Math.cos(stylusAngle) * recordR * 0.72;
    const stylusY = cy + Math.sin(stylusAngle) * recordR * 0.72;
    const dx = stylusX - pivotX;
    const dy = stylusY - pivotY;
    const armLen = Math.hypot(dx, dy) || 1;
    const ux = dx / armLen;
    const uy = dy / armLen;
    const armAngle = Math.atan2(dy, dx);
    const unit = opts?.unit ?? disc;
    const showDeckControls = opts?.showDeckControls ?? true;
    const headshellLength = unit * 0.105;
    const tubeEndX = stylusX - ux * headshellLength * 0.45;
    const tubeEndY = stylusY - uy * headshellLength * 0.45;
    const collarX = stylusX - ux * headshellLength * 0.86;
    const collarY = stylusY - uy * headshellLength * 0.86;
    const cwX = pivotX - ux * unit * 0.115;
    const cwY = pivotY - uy * unit * 0.115;
    const stubX = pivotX - ux * unit * 0.145;
    const stubY = pivotY - uy * unit * 0.145;

    // Dual arm shadows (floating height).
    const paintArmShadow = (opacity: number, width: number, distance: number) => {
        const sh = shadowOffset(distance);
        ctx.save();
        ctx.strokeStyle = `rgba(0,0,0,${opacity})`;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pivotX + sh.x, pivotY + sh.y);
        ctx.lineTo(stylusX + sh.x, stylusY + sh.y);
        ctx.stroke();
        ctx.restore();
    };
    paintArmShadow(0.18, unit * 0.028, unit * 0.034);
    paintArmShadow(0.28, unit * 0.014, unit * 0.014);

    // Rear stub.
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = unit * 0.016;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(stubX, stubY);
    ctx.stroke();
    const stubGrad = ctx.createLinearGradient(pivotX, pivotY, stubX, stubY);
    stubGrad.addColorStop(0, 'rgb(200, 198, 192)');
    stubGrad.addColorStop(1, 'rgb(70, 70, 68)');
    ctx.strokeStyle = stubGrad;
    ctx.lineWidth = unit * 0.0125;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(stubX, stubY);
    ctx.stroke();
    ctx.restore();

    // Counterweight cylinder with knurl.
    const cwW = unit * 0.068;
    const cwH = unit * 0.050;
    const cwSh = shadowOffset(unit * 0.012);
    ctx.save();
    ctx.translate(cwX + cwSh.x, cwY + cwSh.y);
    ctx.rotate(armAngle);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    roundRectPath(ctx, -cwW / 2, -cwH / 2, cwW, cwH, unit * 0.012);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cwX, cwY);
    ctx.rotate(armAngle);
    const cwBody = ctx.createLinearGradient(0, -cwH / 2, 0, cwH / 2);
    cwBody.addColorStop(0, 'rgb(32, 32, 32)');
    cwBody.addColorStop(0.28, 'rgb(92, 92, 92)');
    cwBody.addColorStop(0.62, 'rgb(214, 214, 214)');
    cwBody.addColorStop(0.88, 'rgb(140, 140, 140)');
    cwBody.addColorStop(1, 'rgb(70, 70, 70)');
    ctx.fillStyle = cwBody;
    roundRectPath(ctx, -cwW / 2, -cwH / 2, cwW, cwH, unit * 0.011);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    roundRectPath(ctx, -cwW * 0.4, cwH * 0.14, cwW * 0.8, Math.max(1.2, unit * 0.004), 1);
    ctx.fill();
    for (let i = 0; i < 5; i += 1) {
        const xx = -cwW * 0.32 + i * cwW * 0.16;
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(xx, -cwH * 0.28, unit * 0.0028, cwH * 0.56);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.7;
    roundRectPath(ctx, -cwW / 2, -cwH / 2, cwW, cwH, unit * 0.011);
    ctx.stroke();
    ctx.restore();

    // Chrome tube: underside, body, specular hairline.
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.42)';
    ctx.lineWidth = unit * 0.019;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(tubeEndX, tubeEndY);
    ctx.stroke();

    const tubeGrad = ctx.createLinearGradient(pivotX, pivotY, tubeEndX, tubeEndY);
    tubeGrad.addColorStop(0, 'rgb(236, 232, 224)');
    tubeGrad.addColorStop(0.45, 'rgb(180, 178, 172)');
    tubeGrad.addColorStop(1, 'rgb(118, 116, 112)');
    ctx.strokeStyle = tubeGrad;
    ctx.lineWidth = unit * 0.0145;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(tubeEndX, tubeEndY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = unit * 0.0038;
    ctx.beginPath();
    ctx.moveTo(
        pivotX + VINYL_SCENE_LIGHT.x * unit * 0.0035,
        pivotY + VINYL_SCENE_LIGHT.y * unit * 0.0035,
    );
    ctx.lineTo(
        tubeEndX + VINYL_SCENE_LIGHT.x * unit * 0.0035,
        tubeEndY + VINYL_SCENE_LIGHT.y * unit * 0.0035,
    );
    ctx.stroke();
    ctx.restore();

    // Headshell.
    const hsL = headshellLength;
    const hsH = unit * 0.052;
    const hsCx = stylusX - ux * hsL * 0.35;
    const hsCy = stylusY - uy * hsL * 0.35;
    const hsSh = shadowOffset(unit * 0.01);
    ctx.save();
    ctx.translate(hsCx + hsSh.x, hsCy + hsSh.y);
    ctx.rotate(armAngle);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    const taper = hsH * 0.14;
    ctx.beginPath();
    ctx.moveTo(-hsL * 0.5, -hsH * 0.5);
    ctx.lineTo(hsL * 0.5, -hsH * 0.5 + taper);
    ctx.lineTo(hsL * 0.5, hsH * 0.5 - taper);
    ctx.lineTo(-hsL * 0.5, hsH * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(hsCx, hsCy);
    ctx.rotate(armAngle);
    ctx.beginPath();
    ctx.moveTo(-hsL * 0.5, -hsH * 0.5);
    ctx.lineTo(hsL * 0.5, -hsH * 0.5 + taper);
    ctx.lineTo(hsL * 0.5, hsH * 0.5 - taper);
    ctx.lineTo(-hsL * 0.5, hsH * 0.5);
    ctx.closePath();
    const hsGrad = ctx.createLinearGradient(-hsL * 0.5, -hsH * 0.5, hsL * 0.5, hsH * 0.5);
    hsGrad.addColorStop(0, 'rgb(72, 72, 70)');
    hsGrad.addColorStop(0.5, 'rgb(36, 36, 34)');
    hsGrad.addColorStop(1, 'rgb(12, 12, 12)');
    ctx.fillStyle = hsGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // Cartridge block.
    const cartGrad = ctx.createLinearGradient(0, -hsH * 0.35, 0, hsH * 0.35);
    cartGrad.addColorStop(0, 'rgb(56, 56, 54)');
    cartGrad.addColorStop(1, 'rgb(8, 8, 8)');
    ctx.fillStyle = cartGrad;
    roundRectPath(ctx, hsL * 0.05, -hsH * 0.32, hsL * 0.30, hsH * 0.64, hsH * 0.08);
    ctx.fill();

    ctx.fillStyle = 'rgb(168, 32, 24)';
    roundRectPath(ctx, hsL * 0.34, hsH * 0.02, hsL * 0.1, hsH * 0.28, 1);
    ctx.fill();
    ctx.restore();

    // Collar.
    ctx.save();
    ctx.translate(collarX, collarY);
    ctx.rotate(armAngle);
    const collarGrad = ctx.createLinearGradient(0, -unit * 0.016, 0, unit * 0.016);
    collarGrad.addColorStop(0, 'rgb(220, 220, 218)');
    collarGrad.addColorStop(1, 'rgb(68, 68, 66)');
    ctx.fillStyle = collarGrad;
    roundRectPath(ctx, -unit * 0.009, -unit * 0.016, unit * 0.018, unit * 0.032, unit * 0.004);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.5;
    roundRectPath(ctx, -unit * 0.009, -unit * 0.016, unit * 0.018, unit * 0.032, unit * 0.004);
    ctx.stroke();
    ctx.restore();

    drawPivotTower(ctx, pivotX, pivotY, unit);

    // Stylus contact ellipse.
    const tipSh = shadowOffset(unit * 0.004);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(
        stylusX + tipSh.x,
        stylusY + tipSh.y,
        unit * 0.012,
        unit * 0.0065,
        armAngle,
        0,
        Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();

    if (showDeckControls) {
        drawSpeedKnob(ctx, pivotX + disc * 0.02, cy + disc * 0.28, disc * 0.13);
        ctx.save();
        const lampX = pivotX + disc * 0.09;
        const lampY = cy - disc * 0.02;
        ctx.fillStyle = 'rgb(107, 173, 79)';
        ctx.shadowColor = 'rgba(128, 209, 87, 0.45)';
        ctx.shadowBlur = disc * 0.012;
        ctx.beginPath();
        ctx.arc(lampX, lampY, disc * 0.007, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(lampX, lampY, disc * 0.007, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
};

/** Deck plate → platter rim → tonearm/controls → spindle (topmost). */
export const drawTurntableHardware = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    disc: number,
): void => {
    drawTurntableDeckPlate(ctx, cx, cy, disc);
    drawPlatterRim(ctx, cx, cy, disc);
};

export const drawTurntableHardwareOverlay = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    disc: number,
): void => {
    drawVinylTonearm(ctx, cx, cy, disc);
    drawVinylSpindle(ctx, cx, cy, disc);
};

/** Tonearm/spindle for floating-disc layout (no chassis controls). */
export const drawTurntableHardwareOverlayForLayout = (
    ctx: CanvasRenderingContext2D,
    layout: import('./turntableLayout').TurntableLayout,
): void => {
    drawVinylTonearm(ctx, layout.platterCx, layout.platterCy, layout.recordD, {
        pivotX: layout.pivotX,
        pivotY: layout.pivotY,
        unit: layout.recordD,
        showDeckControls: false,
    });
    drawVinylSpindle(ctx, layout.platterCx, layout.platterCy, layout.recordD);
};
