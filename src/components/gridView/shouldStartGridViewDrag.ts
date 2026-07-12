// src/components/gridView/shouldStartGridViewDrag.ts
// Decides whether a pointerdown on the honeycomb canvas should start panning.

type ClosestCapable = {
    closest: (selector: string) => Element | null;
    classList?: { contains: (name: string) => boolean };
    parentElement?: ClosestCapable | null;
};

const asClosestCapable = (target: EventTarget | null): ClosestCapable | null => {
    if (!target || typeof (target as unknown as ClosestCapable).closest !== 'function') {
        return null;
    }
    return target as unknown as ClosestCapable;
};

/**
 * Track cards need reliable click-to-play. Starting a Framer drag on the same
 * pointerdown swallows the subsequent click in Electron, so track polaroids
 * must not initiate drag. Empty canvas / gaps still pan normally.
 */
export function shouldStartGridViewDrag(
    target: EventTarget | null,
    mode: 'tracks' | 'collection' | string,
): boolean {
    const root = asClosestCapable(target);
    if (!root) {
        return false;
    }

    if (
        root.closest('button')
        || root.closest('input')
        || root.closest('a')
        || root.closest('textarea')
        || root.closest('.theme-glass-panel')
    ) {
        return false;
    }

    // Tracks mode: never start drag from inside a song card (or its frame chrome).
    if (
        mode === 'tracks'
        && (root.closest('.theme-polaroid-card') || root.closest('.folia-grid-card-frame'))
    ) {
        return false;
    }

    // Collection mode: allow drag from the card chrome, but not from nested
    // cursor-pointer controls (artist / album links, etc.).
    let current: ClosestCapable | null = root;
    while (current && !current.classList?.contains('theme-polaroid-card')) {
        if (current.classList?.contains('cursor-pointer')) {
            return false;
        }
        current = current.parentElement ?? null;
    }

    return true;
}
