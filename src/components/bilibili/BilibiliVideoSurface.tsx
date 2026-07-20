import React from 'react';

// src/components/bilibili/BilibiliVideoSurface.tsx
// Muted video stage for Bilibili tracks; audio element remains the master clock.

type BilibiliVideoSurfaceProps = {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    videoSrc: string;
    visible: boolean;
};

export const BilibiliVideoSurface: React.FC<BilibiliVideoSurfaceProps> = ({
    videoRef,
    videoSrc,
    visible,
}) => {
    if (!visible || !videoSrc) {
        return null;
    }

    return (
        <div
            className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden bg-black"
            data-app-ui-surface="bilibili-video"
            aria-hidden="true"
        >
            <video
                ref={videoRef}
                src={videoSrc}
                className="h-full w-full object-contain"
                muted
                playsInline
                preload="metadata"
                disablePictureInPicture
                disableRemotePlayback
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20" />
        </div>
    );
};

export default BilibiliVideoSurface;
