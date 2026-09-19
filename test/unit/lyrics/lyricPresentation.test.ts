import { describe, expect, it } from 'vitest';
import {
    resolveLyricPresentation,
    resolveVisualizerLyricStageLines,
} from '@/utils/lyrics/lyricPresentation';
import { splitPodcastCaptionCues } from '@/utils/lyrics/splitPodcastCaptionCues';
import {
    resolveVisualizerCaptionBottom,
    resolveVisualizerCaptionRows,
    resolveVisualizerCaptionText,
} from '@/components/visualizer/resolveVisualizerCaptionOverlay';

// test/unit/lyrics/lyricPresentation.test.ts
// Podcast captions must not occupy the lyric visualizer rail.

describe('splitPodcastCaptionCues', () => {
    it('keeps short paragraphs intact', () => {
        expect(splitPodcastCaptionCues('如蜉蝣般短暂，并无宏观意义。')).toEqual([
            '如蜉蝣般短暂，并无宏观意义。',
        ]);
    });

    it('breaks long shownotes into subtitle-length cues', () => {
        const cues = splitPodcastCaptionCues(
            '11岁时走进围棋训练班，芮迺伟很快显露出一种天赋：坐得住。围棋给了那个戴眼镜的孤僻女孩一个可以安放专注力的地方，也让她从赢棋中一点点长出了自信。直至进入国家队，她突然感受到男女棋手机会的悬殊，于是只能说服自己忘掉性别去拼。',
        );
        expect(cues.length).toBeGreaterThan(2);
        expect(cues.every((cue) => Array.from(cue).length <= 48)).toBe(true);
    });
});

describe('resolveLyricPresentation', () => {
    it('prefers an explicit caption stamp and falls back for podcast songs', () => {
        expect(resolveLyricPresentation({ presentation: 'captions' })).toBe('captions');
        expect(resolveLyricPresentation({ presentation: 'lyrics' }, { contentType: 'podcast' })).toBe('lyrics');
        expect(resolveLyricPresentation(null, { contentType: 'podcast' })).toBe('captions');
        expect(resolveLyricPresentation(null, { musicProvider: 'rss' })).toBe('captions');
        expect(resolveLyricPresentation(null, { contentType: 'music' })).toBe('lyrics');
    });

    it('clears lyric-stage lines when presenting captions', () => {
        const lines = [{
            fullText: 'cue',
            startTime: 0,
            endTime: 4,
            words: [],
        }];
        expect(resolveVisualizerLyricStageLines(lines, 'captions')).toEqual([]);
        expect(resolveVisualizerLyricStageLines(lines, 'lyrics')).toEqual(lines);
    });
});

describe('resolveVisualizerCaptionText', () => {
    it('uses the active caption cue and ignores empty indexes', () => {
        const lines = [
            { fullText: '第一句字幕', startTime: 0, endTime: 4, words: [] },
            { fullText: '第二句字幕', startTime: 4, endTime: 8, words: [] },
        ];
        expect(resolveVisualizerCaptionText(lines, 1)).toBe('第二句字幕');
        expect(resolveVisualizerCaptionText(lines, -1)).toBeNull();
        expect(resolveVisualizerCaptionText([], 0)).toBeNull();
    });

    it('sits above the docked player bar', () => {
        expect(resolveVisualizerCaptionBottom(true)).toContain('10vh');
        expect(resolveVisualizerCaptionBottom(false)).toContain('--app-player-bar-height');
    });
});

describe('resolveVisualizerCaptionRows', () => {
    it('windows past, current, and upcoming cues around the active line', () => {
        const lines = [
            { fullText: '上一句甲', startTime: 0, endTime: 4, words: [] },
            { fullText: '上一句乙', startTime: 4, endTime: 8, words: [] },
            { fullText: '当前字幕', startTime: 8, endTime: 12, words: [] },
            { fullText: '下一句甲', startTime: 12, endTime: 16, words: [] },
            { fullText: '下一句乙', startTime: 16, endTime: 20, words: [] },
            { fullText: '下一句丙', startTime: 20, endTime: 24, words: [] },
        ];
        expect(resolveVisualizerCaptionRows(lines, 2)).toEqual([
            { index: 0, text: '上一句甲', kind: 'past' },
            { index: 1, text: '上一句乙', kind: 'past' },
            { index: 2, text: '当前字幕', kind: 'current' },
            { index: 3, text: '下一句甲', kind: 'upcoming' },
            { index: 4, text: '下一句乙', kind: 'upcoming' },
            { index: 5, text: '下一句丙', kind: 'upcoming' },
        ]);
        expect(resolveVisualizerCaptionRows(lines, -1)).toEqual([]);
    });
});
