// src/utils/visualizer/turntable/bakeVinylGl.ts
// Bake vinyl/platter discs via WebGL (faithful Metal shader port).

import * as twgl from 'twgl.js';
import { VINYL_SCENE_LIGHT } from './vinylSurfaceMath';
import { VINYL_FULLSCREEN_VERT, VINYL_SURFACE_FRAG } from './vinylSurfaceShaders';

export const bakeDiscSurfaceCanvas = (
    size: number,
    mode: 'vinyl' | 'platter',
): HTMLCanvasElement | null => {
    const dim = Math.max(64, Math.floor(size));
    const canvas = document.createElement('canvas');
    canvas.width = dim;
    canvas.height = dim;
    const gl = twgl.getContext(canvas, {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
    });
    if (!gl) return null;

    const programInfo = twgl.createProgramInfo(gl, [VINYL_FULLSCREEN_VERT, VINYL_SURFACE_FRAG]);
    if (!programInfo) return null;

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
        a_position: {
            numComponents: 2,
            data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1],
        },
    });

    gl.viewport(0, 0, dim, dim);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, {
        u_light: [VINYL_SCENE_LIGHT.x, VINYL_SCENE_LIGHT.y],
        u_mode: mode === 'platter' ? 1 : 0,
    });
    twgl.drawBufferInfo(gl, bufferInfo);

    return canvas;
};
