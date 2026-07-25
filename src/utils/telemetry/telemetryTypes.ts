// src/utils/telemetry/telemetryTypes.ts
// Local telemetry event names and record shapes (no remote upload).

export type TelemetryLevel = 'debug' | 'info' | 'warn' | 'error';

export type TelemetryEventName =
    | 'play.toggle'
    | 'play.resume'
    | 'play.pause'
    | 'play.error'
    | 'audio.resolve'
    | 'audio.src_empty'
    | 'audio.src_set'
    | 'audio.waiting'
    | 'audio.stalled'
    | 'audio.rebuffered'
    | 'gpu.process_gone'
    | 'perf.fps'
    | 'perf.tier_change'
    | 'boot.splash_dismiss'
    | 'boot.ready'
    | 'search.start'
    | 'search.done'
    | 'viz.frame_cost'
    | 'settings.changed'
    | 'lyrics.load'
    | 'song.switch';

export interface TelemetryEvent {
    t: number;
    name: TelemetryEventName | string;
    level: TelemetryLevel;
    durMs?: number;
    data?: Record<string, unknown>;
}

export interface TelemetrySnapshot {
    capacity: number;
    size: number;
    dropped: number;
    events: TelemetryEvent[];
}

export const TELEMETRY_RING_CAPACITY = 500;
