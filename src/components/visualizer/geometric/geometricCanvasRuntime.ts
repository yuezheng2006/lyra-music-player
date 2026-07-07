// src/components/visualizer/geometric/geometricCanvasRuntime.ts
// Shared RAF loop so orbit, ripples, and beat bursts never spawn separate animation loops.

export type GeometricFrameContext = {
    timestamp: number;
    dt: number;
    hidden: boolean;
    frameIndex: number;
};

type GeometricFrameSubscriber = (context: GeometricFrameContext) => void;

let subscribers = new Set<GeometricFrameSubscriber>();
let rafHandle: number | null = null;
let lastTimestamp = 0;
let frameIndex = 0;

const emitFrame = (timestamp: number) => {
    rafHandle = null;
    const hidden = typeof document !== 'undefined' && document.hidden;
    const dt = lastTimestamp === 0
        ? 0.016
        : Math.max(0.001, Math.min(0.08, (timestamp - lastTimestamp) / 1000));
    lastTimestamp = timestamp;
    frameIndex += 1;

    const context: GeometricFrameContext = {
        timestamp,
        dt,
        hidden,
        frameIndex,
    };

    subscribers.forEach((subscriber) => {
        subscriber(context);
    });

    if (subscribers.size > 0) {
        rafHandle = requestAnimationFrame(emitFrame);
    }
};

const ensureRunning = () => {
    if (rafHandle === null && subscribers.size > 0) {
        rafHandle = requestAnimationFrame(emitFrame);
    }
};

const maybeStop = () => {
    if (subscribers.size === 0 && rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
        rafHandle = null;
        lastTimestamp = 0;
    }
};

export const subscribeGeometricCanvasFrame = (subscriber: GeometricFrameSubscriber) => {
    subscribers.add(subscriber);
    ensureRunning();
    return () => {
        subscribers.delete(subscriber);
        maybeStop();
    };
};
