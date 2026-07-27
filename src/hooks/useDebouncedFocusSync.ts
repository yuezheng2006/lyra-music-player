import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Creates a locally fast-updating state that debounces synchronization to a parent.
 * This prevents heavy top-level re-renders from interrupting smooth scroll animations
 * when the user rapidly navigates through a grid.
 */
export function useDebouncedFocusSync(
    propValue: number,
    onChange: (val: number) => void,
    delayMs = 400
) {
    const [localValue, setLocalValueState] = useState(propValue);
    // Only user edits may push upstream. Without this flag, an external prop change
    // (e.g. per-song offset restore) races the debounce timer and can write the stale
    // local value back to the parent under the new context.
    const dirtyRef = useRef(false);

    // Sync from props if the parent changes it externally (e.g., initial load, restored state)
    useEffect(() => {
        dirtyRef.current = false;
        setLocalValueState(propValue);
    }, [propValue]);

    const setLocalValue = useCallback((value: number) => {
        dirtyRef.current = true;
        setLocalValueState(value);
    }, []);

    // Debounced sync to parent
    useEffect(() => {
        if (!dirtyRef.current || localValue === propValue) return;

        const timeout = setTimeout(() => {
            dirtyRef.current = false;
            onChange(localValue);
        }, delayMs);

        return () => clearTimeout(timeout);
    }, [localValue, propValue, onChange, delayMs]);

    return [localValue, setLocalValue] as const;
}
