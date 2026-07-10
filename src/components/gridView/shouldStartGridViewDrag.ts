// src/components/gridView/shouldStartGridViewDrag.ts
// Decides whether a pointerdown on the honeycomb canvas should start panning.

type ClosestCapable = {
    closest: (selector: string) => Element | null;
    classList?: { contains: (name: string) => boolean };
    parentElement?: ClosestCapable | null;
};

const isClosestCapable = (target: EventTarget | null): target is ClosestCapable => (
    Boolean(target)
    && typeof (target as ClosestCapable).closest === 'function'
);

/**
 * Track cards need reliable click-to-play. Starting a Framer drag on the same
 * pointerdown swallows the subsequent click in Electron, so track polaroids
 * must not initiate drag. Empty canvas / gaps still pan normally.
 */
export function shouldStartGridViewDrag(
    target: EventTarget | null,
    mode: 'tracks' | 'collection' | string,
): boolean {
    if (!isClosestCapable(target)) {
        return false;
    }

    if (
        target.closest('button')
        || target.closest('input')
        || target.closest('a')
        || target.closest('textarea')
        || target.closest('.theme-glass-panel')
    ) {
        return false;
    }

    // Tracks mode: never start drag from inside a song card.
    if (mode === 'tracks' && target.closest('.theme-polaroid-card')) {
        return false;
    }

    // Collection mode: allow drag from the card chrome, but not from nested
    // cursor-pointer controls (artist / album links, etc.).
    let current: ClosestCapable | null = target;
    while (current && !current.classList?.contains('theme-polaroid-card')) {
        if (current.classList?.contains('cursor-pointer')) {
            return false;
        }
        current = current.parentElement ?? null;
    }

    return true;
}
