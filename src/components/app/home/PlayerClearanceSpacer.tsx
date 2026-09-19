import React from 'react';

// src/components/app/home/PlayerClearanceSpacer.tsx
// Spacer so the last list row can scroll above the floating player dock.

const PlayerClearanceSpacer: React.FC = () => (
    <div
        aria-hidden
        data-testid="player-clearance-spacer"
        className="pointer-events-none shrink-0"
        style={{ height: 'calc(var(--app-player-bar-height, 90px) + 20px)' }}
    />
);

export default PlayerClearanceSpacer;
