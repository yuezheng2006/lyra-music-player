// src/components/visualizer/geometric/webgl/coverColorMixTween.ts
// Cross-fades cover particle colors when the active cover changes.

/** Mineradio Emily track-change color mix (CHANGELOG 1.0.1). */
export const EMILY_COVER_COLOR_MIX_MS = 520;

/** Default mix for non-Emily cover-particle presets. */
export const DEFAULT_COVER_COLOR_MIX_MS = 720;

export class CoverColorMixTween {
    private rafId: number | null = null;

    private startMs = 0;

    private durationMs = DEFAULT_COVER_COLOR_MIX_MS;

    start(onProgress: (mix: number) => void, durationMs = DEFAULT_COVER_COLOR_MIX_MS) {
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
