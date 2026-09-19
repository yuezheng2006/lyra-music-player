// src/utils/window/macNativeFullscreenTrafficLight.ts
// macOS green traffic light should enter native fullscreen, not maximize.

export const isMacNavigatorPlatform = (
    userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '',
): boolean => userAgent.toLowerCase().includes('mac');

/** Folia #389: Mac traffic-light zoom uses OS fullscreen Spaces. */
export const shouldUseNativeFullscreenTrafficLight = (isMac: boolean): boolean => isMac;
