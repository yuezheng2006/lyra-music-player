import { useAppHomeAndPanelViewModels } from './useAppHomeAndPanelViewModels';
import { useAppOverlayDialogViewModels } from './useAppOverlayDialogViewModels';
import type { AppViewModelContext } from './useAppViewModels.shared';

export function useAppViewModels(core: AppViewModelContext) {
    const { homeModel, playerPanelModel } = useAppHomeAndPanelViewModels(core);
    const {
        appDialogsModel,
        appOverlaysModel,
        settingsDialog,
        showLyricMatchModal,
    } = useAppOverlayDialogViewModels(core);

    return {
        appDialogsModel,
        appOverlaysModel,
        homeModel,
        playerPanelModel,
        settingsDialog,
        showLyricMatchModal,
    };
}
