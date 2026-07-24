// src/utils/home/resolveHomeSearchPlaceholderKey.ts
// Maps enabled home search providers to the matching placeholder i18n key.

const SINGLE_PROVIDER_PLACEHOLDER_KEYS: Readonly<Record<string, string>> = {
    qishui: 'home.searchQishuiMusic',
    bilibili: 'home.searchBilibiliMusic',
    qq: 'home.searchQQMusic',
    coco: 'home.searchCocoMusic',
    kugou: 'home.searchKugouMusic',
    kuwo: 'home.searchKuwoMusic',
};

export const resolveHomeSearchPlaceholderKey = (providers: readonly string[]): string => {
    if (providers.length > 1) {
        return 'home.searchMultiSources';
    }

    if (providers.length === 1) {
        return SINGLE_PROVIDER_PLACEHOLDER_KEYS[providers[0]] ?? 'home.searchDatabase';
    }

    return 'home.searchDatabase';
};
