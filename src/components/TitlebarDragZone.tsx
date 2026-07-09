import React from 'react';

// src/components/TitlebarDragZone.tsx
// Drag region for custom Electron chrome; keeps the sidebar strip clickable.

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
                left: 'var(--app-sidebar-width, 0px)',
                WebkitAppRegion: 'drag',
            } as React.CSSProperties}
        />
    );
}
