import React from 'react';

// src/components/visualizer/geometric/VignetteOverlay.tsx
// Optional edge darkening for geometric background scenes.

const VignetteOverlay: React.FC<{ disabled?: boolean; immersive?: boolean }> = ({
    disabled = false,
    immersive = false,
}) => (
    disabled ? null : (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${immersive ? 0.36 : 0.46}) 100%)`,
            }}
        />
    )
);

export default VignetteOverlay;
