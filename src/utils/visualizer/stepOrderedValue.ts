// src/utils/visualizer/stepOrderedValue.ts
// Walk one step through an ordered list, wrapping at both ends.

export const stepOrderedValue = <Value>(
    values: readonly Value[],
    current: Value,
    direction: -1 | 1,
): Value => {
    if (values.length === 0) return current;
    const index = values.indexOf(current);
    if (index < 0) return values[0] as Value;
    return values[(index + direction + values.length) % values.length] as Value;
};
