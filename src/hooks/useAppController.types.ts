import type { useAppControllerCore } from './useAppControllerCore';
import type { useAppControllerLibrary } from './useAppControllerLibrary';
import type { useAppControllerPlaybackBridges } from './useAppControllerPlaybackBridges';
import type { useAppControllerPresentationShell } from './useAppControllerPresentationShell';
import type { useAppControllerCommandLayer } from './useAppControllerCommandLayer';
import type { useAppViewModels } from './useAppViewModels';

export type AppControllerCoreResult = ReturnType<typeof useAppControllerCore>;
export type AppControllerLibraryResult = ReturnType<typeof useAppControllerLibrary>;
export type AppControllerPlaybackBridgesResult = ReturnType<typeof useAppControllerPlaybackBridges>;
export type AppControllerPresentationShellResult = ReturnType<typeof useAppControllerPresentationShell>;
export type AppControllerCommandLayerResult = ReturnType<typeof useAppControllerCommandLayer>;
export type AppViewModelsResult = ReturnType<typeof useAppViewModels>;
