import { clearCacheByCategory } from '../../../services/db';
import { invalidatePrefetchedLyrics } from '../../../services/prefetchService';
import type { LyricData, StatusMessage } from '../../../types';
import type { LyricStaffAbsorbMode, LyricStaffPolicy } from '../../../utils/lyrics/staffCreditsPolicy';

// src/components/app/home/createLyricFilterPatternSaver.ts

export interface LyricFilterSaveDraft {
    pattern: string;
    staffPolicy: LyricStaffPolicy;
    staffMinDwellSeconds: number;
    staffAbsorbMode: LyricStaffAbsorbMode;
    staffPattern: string;
}

type CreateLyricFilterPatternSaverParams = {
    currentPattern: string;
    handleSetLyricFilterPattern: (pattern: string) => void;
    handleSetLyricStaffPolicy: (policy: LyricStaffPolicy) => void;
    handleSetLyricStaffMinDwellSeconds: (seconds: number) => void;
    handleSetLyricStaffAbsorbMode: (mode: LyricStaffAbsorbMode) => void;
    handleSetLyricStaffPattern: (pattern: string) => void;
    loadCurrentSongLyricPreview: () => Promise<LyricData | null>;
    setLyrics: (lyrics: LyricData | null) => void;
    setCurrentLineIndex: (index: number) => void;
    setStatusMsg: (message: StatusMessage | null) => void;
};

// Creates the Home-facing lyric filter save action without keeping the implementation in App.tsx.
export const createLyricFilterPatternSaver = ({
    currentPattern,
    handleSetLyricFilterPattern,
    handleSetLyricStaffPolicy,
    handleSetLyricStaffMinDwellSeconds,
    handleSetLyricStaffAbsorbMode,
    handleSetLyricStaffPattern,
    loadCurrentSongLyricPreview,
    setLyrics,
    setCurrentLineIndex,
    setStatusMsg,
}: CreateLyricFilterPatternSaverParams) => {
    return async (draft: LyricFilterSaveDraft) => {
        handleSetLyricFilterPattern(draft.pattern);
        handleSetLyricStaffPolicy(draft.staffPolicy);
        handleSetLyricStaffMinDwellSeconds(draft.staffMinDwellSeconds);
        handleSetLyricStaffAbsorbMode(draft.staffAbsorbMode);
        handleSetLyricStaffPattern(draft.staffPattern);

        // 逐行过滤会在解析阶段生效并写进缓存，改了就必须重新取。
        // staff 策略只是显示层变换，缓存里的原始歌词依然有效。
        if (draft.pattern !== currentPattern) {
            await clearCacheByCategory('lyrics');
            invalidatePrefetchedLyrics();
        }

        const previewLyrics = await loadCurrentSongLyricPreview();
        setLyrics(previewLyrics);
        setCurrentLineIndex(-1);
        setStatusMsg({ type: 'success', text: '歌词过滤规则已更新' });
    };
};
