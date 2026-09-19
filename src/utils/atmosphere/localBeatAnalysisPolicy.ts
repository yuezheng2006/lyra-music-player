// src/utils/atmosphere/localBeatAnalysisPolicy.ts
// Local offline beat analysis: silent-by-default prompt policy.

/** When to show the local-track beat-analysis dialog. */
export type LocalBeatAnalysisPromptPolicy = 'auto' | 'ask';

/** Default: analyze in the background — never interrupt playback with a dialog. */
export const DEFAULT_LOCAL_BEAT_ANALYSIS_PROMPT_POLICY: LocalBeatAnalysisPromptPolicy = 'auto';

/** True only when Settings explicitly ask before analyzing local tracks. */
export const shouldPromptLocalBeatAnalysis = (
    policy: LocalBeatAnalysisPromptPolicy | null | undefined,
): boolean => policy === 'ask';
