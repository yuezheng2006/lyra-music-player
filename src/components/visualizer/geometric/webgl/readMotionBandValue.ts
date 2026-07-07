import type { MotionValue } from 'framer-motion';

// src/components/visualizer/geometric/webgl/readMotionBandValue.ts
// Reads numeric audio band values from MotionValue or plain numbers.

export const readMotionBandValue = (
    value: MotionValue<number> | number | undefined,
): number => {
    if (typeof value === 'number') return value;
    return value?.get() ?? 0;
};
