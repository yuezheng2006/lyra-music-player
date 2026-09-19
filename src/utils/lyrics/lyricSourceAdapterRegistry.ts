import type { LyricData } from '../../types';
import type { LyricAdapter } from './LyricAdapter';
import type { LyricProcessingOptions, RawLyricSource } from './types';
import { EmbeddedLyricAdapter } from './adapters/EmbeddedLyricAdapter';
import { LocalFileLyricAdapter } from './adapters/LocalFileLyricAdapter';
import { NavidromeLyricAdapter } from './adapters/NavidromeLyricAdapter';
import { NeteaseLyricAdapter } from './adapters/NeteaseLyricAdapter';
import { QrcLyricAdapter } from './adapters/QrcLyricAdapter';

// src/utils/lyrics/lyricSourceAdapterRegistry.ts
// Pluggable source adapters (embedded / netease / local / …) used by LyricParserFactory.

export type LyricSourceType = RawLyricSource['type'];

const sourceAdapters = new Map<LyricSourceType, LyricAdapter<RawLyricSource>>();

export const registerLyricSourceAdapter = <T extends RawLyricSource>(
    type: T['type'],
    adapter: LyricAdapter<T>,
): void => {
    sourceAdapters.set(type, adapter as LyricAdapter<RawLyricSource>);
};

export const getLyricSourceAdapter = (type: LyricSourceType): LyricAdapter<RawLyricSource> | undefined => (
    sourceAdapters.get(type)
);

let builtinsRegistered = false;

export const registerBuiltinLyricSourceAdapters = (): void => {
    if (builtinsRegistered) return;
    builtinsRegistered = true;
    registerLyricSourceAdapter('embedded', new EmbeddedLyricAdapter());
    registerLyricSourceAdapter('netease', new NeteaseLyricAdapter());
    registerLyricSourceAdapter('navidrome', new NavidromeLyricAdapter());
    registerLyricSourceAdapter('local', new LocalFileLyricAdapter());
    registerLyricSourceAdapter('qrc', new QrcLyricAdapter());
};

export const parseLyricSource = async (
    source: RawLyricSource,
    options: LyricProcessingOptions = {},
): Promise<LyricData | null> => {
    registerBuiltinLyricSourceAdapters();
    const adapter = getLyricSourceAdapter(source.type);
    if (!adapter) {
        console.warn('[lyricSourceAdapterRegistry] Unknown lyric source type:', source.type);
        return null;
    }
    return adapter.parse(source, options);
};
