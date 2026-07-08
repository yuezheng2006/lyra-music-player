import { useEffect, useState } from 'react';
import { buildHomeSurfacePresentation } from '@/components/app/presentation/buildHomeSurfacePresentation';

interface UseAppHomeSurfaceVisibilityParams {
    currentView: string;
    isSettingsModalOpen: boolean;
    isPanelOpen: boolean;
}

/** 控制 Home 表面在播放器视图下的挂载与可见性延迟卸载。 */
export function useAppHomeSurfaceVisibility({
    currentView,
    isSettingsModalOpen,
    isPanelOpen,
}: UseAppHomeSurfaceVisibilityParams) {
    const [isHomeFullyHidden, setIsHomeFullyHidden] = useState(false);
    const { shouldKeepHomeMounted, shouldShowHomeSurface } = buildHomeSurfacePresentation({
        currentView,
        isSettingsModalOpen,
        isPanelOpen,
    });

    useEffect(() => {
        if (shouldKeepHomeMounted) {
            setIsHomeFullyHidden(false);
        } else {
            const timer = setTimeout(() => setIsHomeFullyHidden(true), 350);
            return () => clearTimeout(timer);
        }
    }, [shouldKeepHomeMounted]);

    return {
        isHomeFullyHidden,
        setIsHomeFullyHidden,
        shouldKeepHomeMounted,
        shouldShowHomeSurface,
    };
}
