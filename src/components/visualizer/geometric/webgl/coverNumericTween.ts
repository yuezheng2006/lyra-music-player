// src/components/visualizer/geometric/webgl/coverNumericTween.ts
// Small requestAnimationFrame tween used by Mineradio WebGL transition uniforms.

export class CoverNumericTween {
    private rafId: number | null = null;

    start(from: number, to: number, durationMs: number, onProgress: (value: number) => void) {
        this.cancel();
        const duration = Math.max(1, durationMs);
        const startMs = performance.now();

        const step = (now: number) => {
            const raw = Math.min(1, (now - startMs) / duration);
            const eased = raw * raw * (3 - 2 * raw);
            onProgress(from + (to - from) * eased);
            if (raw < 1) {
                this.rafId = requestAnimationFrame(step);
            } else {
                this.rafId = null;
            }
        };

        onProgress(from);
        this.rafId = requestAnimationFrame(step);
    }

    cancel() {
        if (this.rafId === null) return;
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
    }
}
