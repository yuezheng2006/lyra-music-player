import React, { useEffect, useState } from 'react';

// src/components/visualizer/geometric/webgl/CoverAlbumAtmosphereLayer.tsx
// Mineradio-style CSS album blur wash under WebGL cover particles (cheap atmosphere).

type CoverAlbumAtmosphereLayerProps = {
    coverUrl?: string | null;
    /** When false, layer stays unmounted so enableBackgroundWash can turn it off. */
    enabled?: boolean;
};

/**
 * Cover-forward ambient glow: vivid wash at the frame, thinner in the center so
 * particles stay crisp while the stage still "welcomes" the album color.
 */
const WASH_FILTER = 'blur(110px) brightness(0.32) saturate(2.35)';
const WASH_OPACITY = 0.62;
/** Push wash to the rim; leave the cover plane clearer. */
const WASH_MASK =
    'radial-gradient(ellipse 72% 68% at 50% 44%, transparent 12%, rgba(0,0,0,0.35) 48%, #000 86%)';
const FADE_MS = 1500;

/** Soft cover fog behind cover-particle WebGL — restores enableBackgroundWash on that path. */
const CoverAlbumAtmosphereLayer: React.FC<CoverAlbumAtmosphereLayerProps> = ({
    coverUrl = null,
    enabled = true,
}) => {
    const [visibleUrl, setVisibleUrl] = useState<string | null>(null);
    const [opaque, setOpaque] = useState(false);

    useEffect(() => {
        if (!enabled || !coverUrl) {
            setOpaque(false);
            const hideTimer = window.setTimeout(() => setVisibleUrl(null), FADE_MS);
            return () => window.clearTimeout(hideTimer);
        }

        setVisibleUrl(coverUrl);
        setOpaque(false);
        const showTimer = window.requestAnimationFrame(() => {
            setOpaque(true);
        });
        return () => window.cancelAnimationFrame(showTimer);
    }, [coverUrl, enabled]);

    if (!enabled || !visibleUrl) {
        return null;
    }

    return (
        <div
            className="absolute inset-0 overflow-hidden"
            data-testid="interactive3d-cover-album-atmosphere"
            aria-hidden
            style={{
                pointerEvents: 'none',
                zIndex: 0,
                opacity: opaque ? WASH_OPACITY : 0,
                transition: `opacity ${FADE_MS}ms ease`,
                WebkitMaskImage: WASH_MASK,
                maskImage: WASH_MASK,
            }}
        >
            <div
                className="absolute inset-[-28%]"
                style={{
                    backgroundImage: `url(${visibleUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: WASH_FILTER,
                    transform: 'scale(1.4)',
                }}
            />
        </div>
    );
};

export default CoverAlbumAtmosphereLayer;
