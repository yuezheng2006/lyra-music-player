import { describe, expect, it } from 'vitest';
import {
    buildGridViewCardCoords,
    buildNeatGridCoords,
    forEachCubeInRadius,
    pixelToCubeCenter,
    resolveVisibleGridIndexes,
    resolveVisibleHexIndexes,
    roundCube,
    toCubeKey,
    type HexGridCoord,
} from '../../../src/components/folia-grid/hexViewport';

// Unit coverage for GridView hex viewport math.
const buildCoords = (radius: number, spacingX = 250, spacingY = 320): HexGridCoord[] => {
    const coords: HexGridCoord[] = [];
    forEachCubeInRadius({ x: 0, y: 0, z: 0 }, radius, (cube) => {
        coords.push({
            index: coords.length,
            cube,
            baseX: cube.x * spacingX + (cube.z * spacingX) / 2,
            baseY: cube.z * spacingY,
        });
    });
    return coords;
};

describe('hexViewport', () => {
    it('rounds fractional cube coordinates while preserving x + y + z = 0', () => {
        expect(roundCube({ x: 1.2, y: -2.1, z: 0.9 })).toEqual({ x: 1, y: -2, z: 1 });
        expect(roundCube({ x: -1.49, y: 0.52, z: 0.97 })).toEqual({ x: -2, y: 1, z: 1 });
    });

    it('round-trips pixel centers back to cube coordinates', () => {
        const spacingX = 285;
        const spacingY = 365;
        const cubes = [
            { x: 0, y: 0, z: 0 },
            { x: 2, y: -3, z: 1 },
            { x: -4, y: 2, z: 2 },
        ];

        for (const cube of cubes) {
            const baseX = cube.x * spacingX + (cube.z * spacingX) / 2;
            const baseY = cube.z * spacingY;
            expect(pixelToCubeCenter(baseX, baseY, spacingX, spacingY)).toEqual(cube);
        }
    });

    it('enumerates the expected number of hexes in a radius', () => {
        for (const radius of [0, 1, 2, 4]) {
            let count = 0;
            forEachCubeInRadius({ x: 0, y: 0, z: 0 }, radius, () => {
                count++;
            });
            expect(count).toBe(1 + 3 * radius * (radius + 1));
        }
    });

    it('resolves only existing indexes within the pixel radius', () => {
        const coords = buildCoords(3);
        const coordByKey = new Map(coords.map((coord) => [toCubeKey(coord.cube), coord.index]));
        const indexes = resolveVisibleHexIndexes(
            { x: 0, y: 0, z: 0 },
            3,
            coordByKey,
            coords,
            0,
            0,
            330
        );
        const centerIndex = coordByKey.get(toCubeKey({ x: 0, y: 0, z: 0 }));

        expect(indexes.length).toBeGreaterThan(1);
        expect(indexes).toContain(centerIndex);
        for (const index of indexes) {
            const coord = coords[index]!;
            expect(coord.baseX * coord.baseX + coord.baseY * coord.baseY).toBeLessThanOrEqual(330 * 330);
        }
    });

    it('builds a centered row/column grid that maximizes cards per row', () => {
        const viewportWidth = 1440;
        const cardWidth = 220;
        const cardHeight = 330;
        const coords = buildNeatGridCoords(10, viewportWidth, cardWidth, cardHeight);
        const spacingX = cardWidth + 12;
        const expectedColumns = Math.max(1, Math.floor(viewportWidth / spacingX));

        expect(coords).toHaveLength(10);
        expect(expectedColumns).toBeGreaterThan(1);

        for (let index = 0; index < coords.length; index++) {
            const coord = coords[index]!;
            const col = index % expectedColumns;
            const row = Math.floor(index / expectedColumns);
            const rows = Math.ceil(10 / expectedColumns);
            const gridWidth = (expectedColumns - 1) * spacingX;
            const gridHeight = (rows - 1) * (cardHeight + 16);
            const expectedX = -gridWidth / 2 + col * spacingX;
            const expectedY = -gridHeight / 2 + row * (cardHeight + 16);

            expect(coord.baseX).toBeCloseTo(expectedX, 4);
            expect(coord.baseY).toBeCloseTo(expectedY, 4);
            expect(coord.rotationDeg).toBeUndefined();
        }
    });

    it('uses neat grid layout and casual scatter layout in buildGridViewCardCoords', () => {
        const neat = buildGridViewCardCoords(8, 250, 320, 'neat', 1200, 220, 330);
        const casual = buildGridViewCardCoords(8, 250, 320, 'casual');

        expect(neat[0]?.rotationDeg).toBeUndefined();
        expect(casual.some((coord) => coord.rotationDeg !== undefined)).toBe(true);
        expect(neat[1]?.baseX).not.toBe(casual[1]?.baseX);
    });

    it('resolves visible grid indexes within the pixel radius', () => {
        const coords = buildNeatGridCoords(12, 1200, 220, 330);
        const indexes = resolveVisibleGridIndexes(coords, 0, 0, 360);

        expect(indexes.length).toBeGreaterThan(0);
        for (const index of indexes) {
            const coord = coords[index]!;
            expect(coord.baseX * coord.baseX + coord.baseY * coord.baseY).toBeLessThanOrEqual(360 * 360);
        }
    });
});
