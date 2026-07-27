import React from 'react';
import { useTranslation } from 'react-i18next';
import { readGpuUnstableFlag } from '../../utils/performance/gpuUnstableStorage';

// src/components/shared/GpuBackgroundFallbackNote.tsx
// Single UI module for GPU→common fallback copy (dock menu + controls).

type GpuBackgroundFallbackNoteProps = {
    visible: boolean;
    isDaylight?: boolean;
    variant?: 'menu' | 'controls';
    testId?: string;
};

const GpuBackgroundFallbackNote: React.FC<GpuBackgroundFallbackNoteProps> = ({
    visible,
    isDaylight = false,
    variant = 'menu',
    testId = 'floating-player-background-gpu-fallback-note',
}) => {
    const { t } = useTranslation();
    if (!visible) return null;

    const text = t('options.visualizerBackgroundGpuFallbackHint')
        || 'GPU was unstable — temporarily using Common. Tap any 3D preset to retry in safe mode.';

    if (variant === 'controls') {
        return (
            <p className="text-[11px] leading-snug opacity-70" data-testid={testId}>
                {text}
            </p>
        );
    }

    return (
        <div
            className={`mb-2 rounded-xl px-2.5 py-2 text-[11px] leading-snug ${
                isDaylight ? 'bg-black/[0.06] text-black/70' : 'bg-white/[0.08] text-white/75'
            }`}
            data-testid={testId}
        >
            {text}
        </div>
    );
};

/** True when menu/controls should show the GPU fallback hint. */
export const shouldShowGpuBackgroundFallbackNote = (input: {
    resolvedMode: string;
    storage?: Pick<Storage, 'getItem'> | null;
}): boolean => (
    input.resolvedMode === 'common'
    && readGpuUnstableFlag(input.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null))
);

export default GpuBackgroundFallbackNote;
