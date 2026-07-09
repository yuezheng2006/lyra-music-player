// src/components/app/presentation/buildHomeSurfacePresentation.ts

type BuildHomeSurfacePresentationInput = {
    currentView: string;
    isSettingsModalOpen: boolean;
    isPanelOpen: boolean;
    /** Keep GridView mounted under player so nested card history survives listening mode. */
    hasActiveGridView?: boolean;
};

// Derives independent mount and visibility state for the Home surface.
export const buildHomeSurfacePresentation = ({
    currentView,
    isSettingsModalOpen,
    isPanelOpen,
    hasActiveGridView = false,
}: BuildHomeSurfacePresentationInput) => {
    const shouldKeepHomeMounted = currentView === 'home'
        || isSettingsModalOpen
        || isPanelOpen
        || (currentView === 'player' && hasActiveGridView);
    const shouldShowHomeSurface = currentView === 'home' && !isSettingsModalOpen && !isPanelOpen;

    return {
        shouldKeepHomeMounted,
        shouldShowHomeSurface,
    };
};
