import React from 'react';
import { WINDOW_TRAFFIC_LIGHTS_WIDTH_PX } from './WindowControls';

// src/components/TitlebarDragZone.tsx
// Drag region for custom Electron chrome; clears sidebar + left traffic lights.

export default function TitlebarDragZone({
    active,
}: {
    active: boolean;
}) {
    if (!active) return null;

    return (
        <div
            className="absolute top-0 right-0 bottom-0 pointer-events-auto"
            style={{
                left: `max(var(--app-sidebar-width, 0px), ${WINDOW_TRAFFIC_LIGHTS_WIDTH_PX}px)`,
                WebkitAppRegion: 'drag',
            } as React.CSSProperties}
        />
    );
}
