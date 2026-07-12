import { describe, expect, it } from 'vitest';
import { resolveVisualizerSubtitleOverlayContent } from '@/components/visualizer/VisualizerSubtitleOverlay';
import {
    resolveUpcomingLyricPresentation,
    resolveVisualizerBottomSubtitlePresentation,
} from '@/components/visualizer/resolveUpcomingLyricPresentation';
import { parseColorChannels } from '@/components/visualizer/colorMix';

const DAYLIGHT_THEME = {
    name: 'Daylight Default',
    backgroundColor: '#f5f5f4',
    primaryColor: '#1c1917',
    accentColor: '#ea580c',
    secondaryColor: '#44403c',
    highlightColor: '#ea580c',
} as const;

const estimateLuminance = (color: string) => {
    const channels = parseColorChannels(color);
    if (!channels) {
        return 0;
    }

    return (channels.r * 0.2126 + channels.g * 0.7152 + channels.b * 0.0722) / 255;
};

describe('resolveUpcomingLyricPresentation', () => {
    it('uses a light fill on daylight themes so lines stay readable over dark particles', () => {
        const presentation = resolveUpcomingLyricPresentation(DAYLIGHT_THEME as never, 0.35);

        expect(presentation.lineOpacity).toBeGreaterThanOrEqual(0.88);
        expect(estimateLuminance(presentation.color)).toBeGreaterThan(0.72);
        expect(presentation.textShadow).toContain('0 0 1px');
        expect(presentation.textShadow).toContain('0 0 6px');
    });

    it('keeps dark-theme overlays readable with halo shadows', () => {
        const presentation = resolveUpcomingLyricPresentation({
            primaryColor: '#f4f4f5',
            secondaryColor: '#71717a',
            backgroundColor: '#09090b',
            highlightColor: '#fff2b0',
        } as never, 0.35);

        expect(presentation.lineOpacity).toBeGreaterThanOrEqual(0.88);
        expect(estimateLuminance(presentation.color)).toBeGreaterThan(0.7);
        expect(presentation.textShadow).toContain('0 1px 2px');
    });
});

describe('resolveVisualizerBottomSubtitlePresentation', () => {
    it('reuses overlay contrast styling for translation subtitles', () => {
        const presentation = resolveVisualizerBottomSubtitlePresentation(DAYLIGHT_THEME as never, 0.4);

        expect(presentation.opacity).toBeGreaterThanOrEqual(0.86);
        expect(estimateLuminance(presentation.color)).toBeGreaterThan(0.72);
        expect(presentation.textShadow).toContain('0 0 14px');
    });
});

describe('resolveVisualizerSubtitleOverlayContent', () => {
    it('shows upcoming lines before the first active line when translation is hidden', () => {
        const content = resolveVisualizerSubtitleOverlayContent({
            showText: true,
            activeLine: null,
            recentCompletedLine: null,
            nextLines: [{ fullText: '下一句', startTime: 10 } as never],
            lyricWordMode: 'karaoke',
        });

        expect(content.upcomingLines).toHaveLength(1);
    });
});
