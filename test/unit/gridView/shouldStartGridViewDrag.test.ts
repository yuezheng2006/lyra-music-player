import { describe, expect, it } from 'vitest';
import { shouldStartGridViewDrag } from '@/components/gridView/shouldStartGridViewDrag';

// test/unit/gridView/shouldStartGridViewDrag.test.ts
// Ensures track-card clicks are not treated as honeycomb drag starts.

type FakeElement = {
    tag: string;
    classNames: Set<string>;
    parentElement: FakeElement | null;
    classList: { contains: (name: string) => boolean };
    closest: (selector: string) => FakeElement | null;
};

const createElement = (
    classNames: string[] = [],
    options: { tag?: string; parent?: FakeElement | null } = {},
): FakeElement => {
    const element: FakeElement = {
        tag: options.tag || 'div',
        classNames: new Set(classNames),
        parentElement: options.parent ?? null,
        classList: {
            contains: (name: string) => element.classNames.has(name),
        },
        closest: (selector: string) => {
            let current: FakeElement | null = element;
            while (current) {
                if (selector.startsWith('.')) {
                    if (current.classNames.has(selector.slice(1))) return current;
                } else if (current.tag === selector) {
                    return current;
                }
                current = current.parentElement;
            }
            return null;
        },
    };
    return element;
};

describe('shouldStartGridViewDrag', () => {
    it('blocks drag when pointerdown lands on a tracks-mode polaroid card', () => {
        const card = createElement(['theme-polaroid-card']);
        const cover = createElement(['cover'], { parent: card });
        expect(shouldStartGridViewDrag(cover as unknown as EventTarget, 'tracks')).toBe(false);
    });

    it('allows drag on empty canvas in tracks mode', () => {
        const canvas = createElement(['canvas']);
        expect(shouldStartGridViewDrag(canvas as unknown as EventTarget, 'tracks')).toBe(true);
    });

    it('blocks drag on buttons even outside cards', () => {
        const button = createElement([], { tag: 'button' });
        expect(shouldStartGridViewDrag(button as unknown as EventTarget, 'tracks')).toBe(false);
    });

    it('still allows collection-mode drag from polaroid chrome', () => {
        const card = createElement(['theme-polaroid-card']);
        const cover = createElement(['cover'], { parent: card });
        expect(shouldStartGridViewDrag(cover as unknown as EventTarget, 'collection')).toBe(true);
    });
});
