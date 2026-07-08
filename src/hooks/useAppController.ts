import { useEffect } from 'react';
import { useAppControllerCore } from './useAppControllerCore';
import { useAppControllerLibrary } from './useAppControllerLibrary';
import { useAppControllerPlaybackBridges } from './useAppControllerPlaybackBridges';
import { useAppControllerPresentationShell } from './useAppControllerPresentationShell';
import { useAppControllerCommandLayer } from './useAppControllerCommandLayer';
import { useAppViewModels } from './useAppViewModels';
import { useAppHomeSurfaceVisibility } from './useAppHomeSurfaceVisibility';

export function useAppController() {
    const core = useAppControllerCore();
    const library = useAppControllerLibrary(core);
    const bridges = useAppControllerPlaybackBridges({ ...core, ...library });
    const shell = useAppControllerPresentationShell({ ...core, ...library, ...bridges });
    const command = useAppControllerCommandLayer({ ...core, ...library, ...bridges, ...shell });
    const viewModels = useAppViewModels({ ...core, ...library, ...bridges, ...shell, ...command });
    const homeSurface = useAppHomeSurfaceVisibility({
        currentView: core.currentView,
        isSettingsModalOpen: shell.isSettingsModalOpen,
        isPanelOpen: core.isPanelOpen,
    });

    useEffect(() => {
        core.isNowPlayingControlDisabledRef.current = shell.isNowPlayingControlDisabled;
    }, [core.isNowPlayingControlDisabledRef, shell.isNowPlayingControlDisabled]);

    return {
        ...core,
        ...library,
        ...bridges,
        ...shell,
        ...command,
        ...viewModels,
        ...homeSurface,
    };
}

export type AppControllerResult = ReturnType<typeof useAppController>;
