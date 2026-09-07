import { LyricData } from '../../../types';
import { LyricAdapter } from '../LyricAdapter';
import { LyricProcessingOptions, RawEmbeddedLyric } from '../types';
import { parseLyricsAsync } from '../workerClient';
import { detectTimedLyricFormat } from '../formatDetection';
import { normalizeEmbeddedLrcText, normalizeEmbeddedUsltTags } from '../embeddedLrcNormalization';

export class EmbeddedLyricAdapter implements LyricAdapter<RawEmbeddedLyric> {
    async parse(source: RawEmbeddedLyric, options: LyricProcessingOptions = {}): Promise<LyricData | null> {
        let mainLrc = '';
        let transLrc = '';
        let romanizationLrc = '';

        if (source.usltTags && source.usltTags.length > 0) {
            const normalized = normalizeEmbeddedUsltTags(source.usltTags);
            mainLrc = normalized.mainText;
            transLrc = normalized.translationText;
            romanizationLrc = normalized.romanizationText || '';
        } else if (source.textContent) {
            const normalized = normalizeEmbeddedLrcText(source.textContent, source.translationContent);
            mainLrc = normalized.mainText;
            transLrc = normalized.translationText;
            romanizationLrc = normalized.romanizationText || '';
        }

        if (!mainLrc) return null;

        return await parseLyricsAsync(detectTimedLyricFormat(mainLrc), mainLrc, transLrc, options, romanizationLrc);
    }
}
