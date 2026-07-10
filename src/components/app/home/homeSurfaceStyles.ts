// src/components/app/home/homeSurfaceStyles.ts
// Opaque home surface colors so interactive3d / particle stage never shows through.

export const resolveHomeSolidBackgroundClass = (isDaylight: boolean): string => (
    isDaylight ? 'bg-[#f3f1ec]' : 'bg-[#121214]'
);
