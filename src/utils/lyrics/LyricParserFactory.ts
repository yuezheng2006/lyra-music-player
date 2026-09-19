import { LyricData } from '../../types';
import { applyLyricDisplayFilter, resolveLyricProcessingOptions } from './filtering';
import { parseLyricSource } from './lyricSourceAdapterRegistry';
import { RawLyricSource } from './types';
import type { LyricProcessingOptions } from './types';

export class LyricParserFactory {
    static async parse(source: RawLyricSource, options: LyricProcessingOptions = {}): Promise<LyricData | null> {
        const resolvedOptions = resolveLyricProcessingOptions(options);
        const parsed = await parseLyricSource(source, resolvedOptions);
        return applyLyricDisplayFilter(parsed, resolvedOptions.filterPattern);
    }
}
