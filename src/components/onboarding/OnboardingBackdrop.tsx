import React from 'react';

// src/components/onboarding/OnboardingBackdrop.tsx
// Quiet dark field for the minimal onboarding screen.

export type OnboardingBackdropProps = {
    reducedMotion?: boolean;
};

/** Solid base with a soft center wash — no grain animation or decorative layers. */
export function OnboardingBackdrop(_props: OnboardingBackdropProps) {
    return (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#09090b' }}>
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 55% 40% at 50% 42%, rgba(84,98,128,0.10) 0%, rgba(9,9,11,0) 70%)',
                }}
            />
        </div>
    );
}
