import { LyricData } from '../../../types';
import { LyricAdapter } from '../LyricAdapter';
import { LyricProcessingOptions, RawLocalFileLyric } from '../types';
import { parseLyricsAsync } from '../workerClient';
import { splitCombinedTimeline } from '../timelineSplitter';
import { detectTimedLyricFormat } from '../formatDetection';
import { extractAwlrcContainer } from '../awlrcContainer';

export class LocalFileLyricAdapter implements LyricAdapter<RawLocalFileLyric> {
    async parse(source: RawLocalFileLyric, options: LyricProcessingOptions = {}): Promise<LyricData | null> {
        if (!source.lrcContent) return null;

        const container = extractAwlrcContainer(source.lrcContent);
        if (container?.awlrc || container?.lrc) {
            const translation = source.tLrcContent || container.tlrc || '';
            return container.awlrc
                ? await parseLyricsAsync('awlrc', container.awlrc, translation, options, container.rlrc || '')
                : await parseLyricsAsync('lrc', container.lrc!, translation, options, container.rlrc || '');
        }

        let mainLrc = source.lrcContent;
        let transLrc = source.tLrcContent || '';
        let romanizationLrc = '';
        let format = source.formatHint || detectTimedLyricFormat(mainLrc);

        if (format !== 'ttml') {
            const { main, trans, romanization } = splitCombinedTimeline(mainLrc);
            mainLrc = main;
            transLrc ||= trans;
            romanizationLrc = romanization;
            format = source.formatHint || detectTimedLyricFormat(mainLrc);
        }

        return await parseLyricsAsync(format, mainLrc, transLrc, options, romanizationLrc);
    }
}
