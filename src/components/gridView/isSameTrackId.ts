// src/components/gridView/isSameTrackId.ts
// Loose track-id equality for GridView now-playing chrome (number vs string safe).

export const isSameTrackId = (
    left: string | number | null | undefined,
    right: string | number | null | undefined,
): boolean => {
    if (left == null || right == null) return false;
    return String(left) === String(right);
};
