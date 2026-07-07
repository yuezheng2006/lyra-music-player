import { createSeededRandom } from './seededRandom';
import type { Theme } from '../../../types';
import type { BackgroundParticle, BackgroundShape, ShapeType } from './types';

// src/components/visualizer/geometric/buildGeometricLayout.ts
// Generates deterministic shape and particle layouts from theme + seed.

export const buildGeometricShapes = (
    theme: Theme,
    seed?: string | number,
    shapeCount = 15,
): BackgroundShape[] => {
    if (shapeCount <= 0) {
        return [];
    }

    const shapeTypes: Array<Exclude<ShapeType, 'icon'>> = ['circle', 'square', 'triangle', 'cross'];
    const availableIcons = theme.lyricsIcons || [];
    const rand = createSeededRandom(seed ?? theme.primaryColor);

    let iconCount = 0;
    return Array.from({ length: shapeCount }).map((_, index) => {
        const wantIcon = availableIcons.length > 0 && rand() > 0.7;
        const useIcon = wantIcon && iconCount < 6;
        if (useIcon) {
            iconCount += 1;
        }

        const iconName = useIcon ? availableIcons[Math.floor(rand() * availableIcons.length)] : null;

        return {
            id: index,
            type: useIcon ? 'icon' : shapeTypes[Math.floor(rand() * shapeTypes.length)],
            iconName,
            initialX: rand() * 100,
            initialY: rand() * 100,
            size: 40 + rand() * 100,
            duration: useIcon ? 20 + rand() * 20 : 30 + rand() * 30,
            delay: rand() * 5,
            opacity: 0.11 + rand() * 0.08,
            reverse: rand() > 0.5,
            filled: rand() < 0.3,
            initialRotation: rand() * 360,
            depth: 0.2 + rand() * 0.8,
        };
    });
};

export const buildGeometricParticles = (seed?: string | number): BackgroundParticle[] => {
    const rand = createSeededRandom(`particles:${String(seed ?? 'default')}`);
    return Array.from({ length: 20 }).map((_, index) => ({
        id: index,
        size: rand() * 4 + 1,
        left: rand() * 100,
        top: rand() * 100,
        opacity: rand() * 0.3,
        duration: 15 + rand() * 20,
        delay: rand() * 10,
    }));
};
