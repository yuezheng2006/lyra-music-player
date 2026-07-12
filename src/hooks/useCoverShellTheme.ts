import { useEffect, useMemo, useRef, useState } from 'react';
import { extractColors } from '../utils/colorExtractor';
import { createCoverShellTheme, type CoverShellTheme } from '../utils/coverShellTheme';

// src/hooks/useCoverShellTheme.ts
// Applies palette extraction only while the resolved cover URL remains current.

export function useCoverShellTheme(coverUrl: string | null | undefined, isDaylight: boolean): CoverShellTheme {
    const fallbackTheme = useMemo(
        () => createCoverShellTheme([], isDaylight),
        [isDaylight],
    );
    const [theme, setTheme] = useState<CoverShellTheme>(fallbackTheme);
    const latestRequestRef = useRef(0);

    useEffect(() => {
        const requestId = latestRequestRef.current + 1;
        latestRequestRef.current = requestId;

        if (!coverUrl) {
            setTheme(fallbackTheme);
            return;
        }

        setTheme(fallbackTheme);
        void extractColors(coverUrl, 5).then((colors) => {
            if (latestRequestRef.current !== requestId) {
                return;
            }
            setTheme(createCoverShellTheme(colors, isDaylight));
        });
    }, [coverUrl, fallbackTheme, isDaylight]);

    return theme;
}
