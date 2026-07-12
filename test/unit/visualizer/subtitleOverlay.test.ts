import { describe, expect, it } from 'vitest';
import { resolveVisualizerSubtitleOverlayContent } from '@/components/visualizer/VisualizerSubtitleOverlay';
import type { Line } from '@/types';

// test/unit/visualizer/subtitleOverlay.test.ts
// Locks the split between hiding the whole subtitle overlay and hiding only translation text.

describe('VisualizerSubtitleOverlay content resolution', () => {
    const activeLine: Line = {
        startTime: 1,
        endTime: 2,
        fullText: 'Hello',
        translation: '你好',
        words: [],
    };
    const nextLine: Line = {
        startTime: 2,
        endTime: 3,
        fullText: 'World',
        words: [],
    };

    it('hides the entire overlay when the legacy hide setting is enabled', () => {
        const content = resolveVisualizerSubtitleOverlayContent({
            showText: true,
            activeLine,
            recentCompletedLine: null,
            nextLines: [nextLine],
            hideTranslationSubtitle: true,
            showSubtitleTranslation: true,
        });

        expect(content.shouldRenderOverlay).toBe(false);
        expect(content.translationText).toBeNull();
        expect(content.upcomingLines).toEqual([]);
    });

    it('keeps upcoming-line hints when only translation text is hidden in karaoke mode', () => {
        const content = resolveVisualizerSubtitleOverlayContent({
            showText: true,
            activeLine,
            recentCompletedLine: null,
            nextLines: [nextLine],
            hideTranslationSubtitle: false,
            showSubtitleTranslation: false,
            lyricWordMode: 'karaoke',
        });

        expect(content.shouldRenderOverlay).toBe(true);
        expect(content.translationText).toBeNull();
        expect(content.upcomingLines).toEqual([nextLine]);
    });

    it('shows karaoke upcoming lines even when translation is also visible', () => {
        const content = resolveVisualizerSubtitleOverlayContent({
            showText: true,
            activeLine,
            recentCompletedLine: null,
            nextLines: [nextLine, { ...nextLine, startTime: 3, fullText: 'NextNext' }],
            hideTranslationSubtitle: false,
            showSubtitleTranslation: true,
            lyricWordMode: 'karaoke',
        });

        expect(content.shouldRenderOverlay).toBe(true);
        expect(content.translationText).toBe('你好');
        expect(content.upcomingLines.map(line => line.fullText)).toEqual(['World', 'NextNext']);
    });

    it('hides upcoming-line hints in default word mode', () => {
        const content = resolveVisualizerSubtitleOverlayContent({
            showText: true,
            activeLine,
            recentCompletedLine: null,
            nextLines: [nextLine],
            hideTranslationSubtitle: false,
            showSubtitleTranslation: false,
            lyricWordMode: 'default',
        });

        expect(content.shouldRenderOverlay).toBe(false);
        expect(content.upcomingLines).toEqual([]);
    });
});
