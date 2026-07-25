import React, { useEffect, useState } from 'react';
import {
    clearTelemetry,
    getTelemetrySnapshot,
    subscribeTelemetry,
} from '../../utils/telemetry/trackTelemetry';
import type { TelemetryEvent, TelemetrySnapshot } from '../../utils/telemetry/telemetryTypes';

// src/components/dev/TelemetryDebugPanel.tsx
// DevDebug tab: local telemetry ring preview + copy/download export.

type TelemetryDebugPanelProps = {
    isDaylight: boolean;
    panelClass: string;
};

const MAX_VISIBLE_EVENTS = 40;

const formatEventTime = (t: number): string => {
    try {
        return new Date(t).toLocaleTimeString();
    } catch {
        return String(t);
    }
};

const summarizeData = (data: TelemetryEvent['data']): string => {
    if (!data) return '';
    try {
        const raw = JSON.stringify(data);
        return raw.length > 96 ? `${raw.slice(0, 96)}…` : raw;
    } catch {
        return '';
    }
};

const buildExportPayload = (snapshot: TelemetrySnapshot) => ({
    exportedAt: new Date().toISOString(),
    capacity: snapshot.capacity,
    size: snapshot.size,
    dropped: snapshot.dropped,
    events: snapshot.events,
});

const TelemetryDebugPanel: React.FC<TelemetryDebugPanelProps> = ({
    isDaylight,
    panelClass,
}) => {
    const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(() => getTelemetrySnapshot());
    const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');

    useEffect(() => {
        const refresh = () => setSnapshot(getTelemetrySnapshot());
        refresh();
        return subscribeTelemetry(refresh);
    }, []);

    const visible = snapshot.events.slice(-MAX_VISIBLE_EVENTS).reverse();
    const buttonClass = isDaylight
        ? 'border-black/15 bg-white/70 hover:bg-white'
        : 'border-white/15 bg-white/10 hover:bg-white/15';

    const handleCopy = async () => {
        try {
            const text = JSON.stringify(buildExportPayload(snapshot), null, 2);
            await navigator.clipboard.writeText(text);
            setCopyState('ok');
        } catch {
            setCopyState('fail');
        }
        window.setTimeout(() => setCopyState('idle'), 1600);
    };

    const handleDownload = () => {
        const text = JSON.stringify(buildExportPayload(snapshot), null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `lyra-telemetry-${Date.now()}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="mt-3 grid gap-3">
            <section className={panelClass}>
                <div className="flex items-center justify-between gap-2 px-3 pt-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] opacity-60">Telemetry</div>
                    <div className="text-[10px] opacity-60">
                        {snapshot.size}/{snapshot.capacity}
                        {snapshot.dropped > 0 ? ` · dropped ${snapshot.dropped}` : ''}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 px-3 py-2">
                    <button
                        type="button"
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${buttonClass}`}
                        onClick={() => void handleCopy()}
                    >
                        {copyState === 'ok' ? 'Copied' : copyState === 'fail' ? 'Copy failed' : 'Copy JSON'}
                    </button>
                    <button
                        type="button"
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${buttonClass}`}
                        onClick={handleDownload}
                    >
                        Download
                    </button>
                    <button
                        type="button"
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${buttonClass}`}
                        onClick={() => clearTelemetry()}
                    >
                        Clear
                    </button>
                </div>
                <div className="max-h-72 overflow-y-auto px-3 pb-3">
                    {visible.length === 0 ? (
                        <div className="text-[11px] opacity-60">No events yet.</div>
                    ) : (
                        <ul className="grid gap-1.5">
                            {visible.map((event, index) => (
                                <li
                                    key={`${event.t}-${event.name}-${index}`}
                                    className={`rounded-lg border px-2 py-1.5 text-[10px] leading-4 ${
                                        isDaylight ? 'border-black/10 bg-white/50' : 'border-white/10 bg-black/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold">{event.name}</span>
                                        <span className="opacity-60 whitespace-nowrap">
                                            {formatEventTime(event.t)}
                                            {typeof event.durMs === 'number' ? ` · ${Math.round(event.durMs)}ms` : ''}
                                        </span>
                                    </div>
                                    <div className="mt-0.5 opacity-70">
                                        {event.level}
                                        {summarizeData(event.data) ? ` · ${summarizeData(event.data)}` : ''}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
};

export default TelemetryDebugPanel;
