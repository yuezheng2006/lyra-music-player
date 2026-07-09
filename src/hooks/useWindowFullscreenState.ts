import { useCallback, useEffect, useState } from 'react';
import {
    isBrowserDocumentFullscreen,
    readWindowFullscreen,
    setWindowFullscreen as applyWindowFullscreen,
} from '@/utils/windowFullscreen';

// Tracks Electron / document fullscreen and exposes a setter for fullscreen play.

export function useWindowFullscreenState() {
    const [isWindowFullscreen, setIsWindowFullscreen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const sync = async () => {
            const next = await readWindowFullscreen();
            if (!cancelled) {
                setIsWindowFullscreen(next);
            }
        };

        void sync();

        const unsubscribe = window.electron?.onWindowFullscreenChanged?.((state) => {
            setIsWindowFullscreen(Boolean(state?.isFullscreen));
        });

        const handleDocumentFullscreenChange = () => {
            if (window.electron?.isWindowFullscreen) {
                return;
            }
            setIsWindowFullscreen(isBrowserDocumentFullscreen());
        };

        document.addEventListener('fullscreenchange', handleDocumentFullscreenChange);

        return () => {
            cancelled = true;
            unsubscribe?.();
            document.removeEventListener('fullscreenchange', handleDocumentFullscreenChange);
        };
    }, []);

    const setWindowFullscreen = useCallback(async (enabled: boolean) => {
        const next = await applyWindowFullscreen(enabled);
        setIsWindowFullscreen(next);
        return next;
    }, []);

    return {
        isWindowFullscreen,
        setWindowFullscreen,
    };
}
