import { describe, expect, it } from 'vitest';
import {
    DEFAULT_LOCAL_BEAT_ANALYSIS_PROMPT_POLICY,
    shouldPromptLocalBeatAnalysis,
} from '@/utils/atmosphere/localBeatAnalysisPolicy';

// Local beat analysis stays silent by default so playback is not interrupted.

describe('localBeatAnalysisPolicy', () => {
    it('defaults to silent auto analysis', () => {
        expect(DEFAULT_LOCAL_BEAT_ANALYSIS_PROMPT_POLICY).toBe('auto');
        expect(shouldPromptLocalBeatAnalysis('auto')).toBe(false);
        expect(shouldPromptLocalBeatAnalysis(undefined)).toBe(false);
        expect(shouldPromptLocalBeatAnalysis(null)).toBe(false);
    });

    it('only prompts when policy is ask', () => {
        expect(shouldPromptLocalBeatAnalysis('ask')).toBe(true);
    });
});
