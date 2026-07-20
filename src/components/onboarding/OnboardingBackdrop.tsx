import React from 'react';

// src/components/onboarding/OnboardingBackdrop.tsx
// Plain, textured dark field behind the onboarding glass panel — no orbits, floating covers, or lyric hero.

const GRAIN_TEXTURE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export type OnboardingBackdropProps = {
    reducedMotion: boolean;
};

/** Deep base color + soft radial wash + fine grain + vignette. Grain drift pauses under reduced motion. */
export function OnboardingBackdrop({ reducedMotion }: OnboardingBackdropProps) {
    return (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#09090b' }}>
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 55% at 50% 38%, rgba(84,98,128,0.16) 0%, rgba(9,9,11,0) 60%)',
                }}
            />
            <div
                className={reducedMotion ? '' : 'onboarding-grain'}
                style={{
                    position: 'absolute',
                    inset: '-8%',
                    backgroundImage: `url("${GRAIN_TEXTURE}")`,
                    backgroundSize: '140px 140px',
                    opacity: 0.05,
                    mixBlendMode: 'overlay',
                }}
            />
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 70% at 50% 20%, transparent 0%, rgba(0,0,0,0.24) 65%, rgba(0,0,0,0.58) 100%)',
                }}
            />
        </div>
    );
}
