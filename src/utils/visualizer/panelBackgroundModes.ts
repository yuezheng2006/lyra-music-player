import type { VisualizerBackgroundMode } from '../../types';

// src/utils/visualizer/panelBackgroundModes.ts
// Compact panel background engines. url / sora / turntable stay in visualizer settings.

export const PANEL_PLAYER_BACKGROUND_MODES: VisualizerBackgroundMode[] = [
    'common',
    'nomand',
    'monet',
];

/** Dock popover: performance floor + one atmosphere engine. Heavier modes stay in song settings. */
export const DOCK_PLAYER_BACKGROUND_MODES: VisualizerBackgroundMode[] = [
    'common',
    'nomand',
];

const ALL_VISUALIZER_BACKGROUND_MODES: VisualizerBackgroundMode[] = [
    ...PANEL_PLAYER_BACKGROUND_MODES,
    'latent',
    'url',
    'sora',
    'turntable',
];

export const hasVisualizerBackgroundMode = (
    mode: string | null | undefined,
): mode is VisualizerBackgroundMode => (
    Boolean(mode && ALL_VISUALIZER_BACKGROUND_MODES.includes(mode as VisualizerBackgroundMode))
);

export const isPanelPlayerBackgroundMode = (
    mode: VisualizerBackgroundMode | null | undefined,
): mode is VisualizerBackgroundMode => (
    Boolean(mode && PANEL_PLAYER_BACKGROUND_MODES.includes(mode))
);

export const isDockPlayerBackgroundMode = (
    mode: VisualizerBackgroundMode | null | undefined,
): mode is VisualizerBackgroundMode => (
    Boolean(mode && DOCK_PLAYER_BACKGROUND_MODES.includes(mode))
);

/** Compact chips: keep the current engine visible when it is not in the short list. */
export const resolveDockBackgroundModes = (
    current: VisualizerBackgroundMode,
): VisualizerBackgroundMode[] => (
    isDockPlayerBackgroundMode(current)
        ? [...DOCK_PLAYER_BACKGROUND_MODES]
        : [current, ...DOCK_PLAYER_BACKGROUND_MODES]
);

export const getPanelBackgroundModeLabel = (
    mode: VisualizerBackgroundMode,
    t: (key: string) => string,
): string => {
    switch (mode) {
        case 'interactive3d':
            return t('options.visualizerBackgroundModeCommon') || 'Common';
        case 'common':
            return t('options.visualizerBackgroundModeCommon') || 'Common';
        case 'monet':
            return t('options.visualizerBackgroundModeMonet') || 'Monet';
        case 'nomand':
            return t('options.visualizerBackgroundModeNomand') || 'Nomand';
        case 'latent':
            return t('options.visualizerBackgroundModeLatent') || 'Latent';
        case 'url':
            return t('options.visualizerBackgroundModeUrl') || 'URL';
        case 'sora':
            return t('options.visualizerBackgroundModeSora') || 'Empty';
        case 'turntable':
            return t('options.visualizerBackgroundModeTurntable') || 'Turntable';
        default:
            return mode;
    }
};

export const getVisualizerBackgroundModeLabel = getPanelBackgroundModeLabel;
