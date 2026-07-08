import type {
    AppControllerCommandLayerResult,
    AppControllerCoreResult,
    AppControllerLibraryResult,
    AppControllerPlaybackBridgesResult,
    AppControllerPresentationShellResult,
} from './useAppController.types';

export type AppViewModelContext =
    AppControllerCoreResult
    & AppControllerLibraryResult
    & AppControllerPlaybackBridgesResult
    & AppControllerPresentationShellResult
    & AppControllerCommandLayerResult;
