// services/lyrics-resolve/src/providers/createDefaultProviders.ts
// Wire Node-native lyric source adapters for the resolve service.

import { createAmllProvider } from './amllProvider';
import { createKugouProvider } from './kugouProvider';
import { createLrclibProvider, type LrclibSourcePort } from './lrclibProvider';
import { createNeteaseProvider } from './neteaseProvider';
import { createQqProvider } from './qqProvider';
import type { AmllSourcePort, LyricSourcePort } from './types';

export type DefaultProviderBundle = {
    providers: Partial<Record<'netease' | 'qq' | 'kugou', LyricSourcePort>>;
    amll: AmllSourcePort;
    lrclib: LrclibSourcePort;
};

export function createDefaultProviders(): DefaultProviderBundle {
    return {
        providers: {
            netease: createNeteaseProvider(),
            qq: createQqProvider(),
            kugou: createKugouProvider(),
        },
        amll: createAmllProvider(),
        lrclib: createLrclibProvider(),
    };
}
