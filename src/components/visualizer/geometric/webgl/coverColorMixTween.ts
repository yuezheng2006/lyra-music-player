// src/components/visualizer/geometric/webgl/coverColorMixTween.ts
// Cross-fades cover particle colors when the active cover changes.

export class CoverColorMixTween {
    private rafId: number | null = null;

    private startMs = 0;

    private durationMs = 720;

    start(onProgress: (mix: number) => void, durationMs = 720) {
        this.cancel();
        this.durationMs = Math.max(1, durationMs);
        this.startMs = performance.now();
        onProgress(0);

        const step = (now: number) => {
            const t = Math.min(1, (now - this.startMs) / this.durationMs);
            const eased = t * t * (3 - 2 * t);
            onProgress(eased);
            if (t < 1) {
                this.rafId = requestAnimationFrame(step);
            } else {
                this.rafId = null;
            }
        };

        this.rafId = requestAnimationFrame(step);
    }

    cancel() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}
