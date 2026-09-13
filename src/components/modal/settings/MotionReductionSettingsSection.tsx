import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../../types';
import {
    MOTION_SURFACE_IDS,
    useMotionSettingsStore,
    type MotionSurfaceId,
} from '../../../stores/useMotionSettingsStore';

// src/components/modal/settings/MotionReductionSettingsSection.tsx
// Lab + command-palette shared controls for explicit reduce-motion surfaces.

type MotionReductionSettingsSectionProps = {
    settingsCardClass: string;
    toggleOffBackgroundClass: string;
    theme?: Theme;
};

const SURFACE_LABEL_KEYS: Record<MotionSurfaceId, { label: string; desc: string }> = {
    visualizerStage: { label: 'options.reduceMotionVisualizerStage', desc: 'options.reduceMotionVisualizerStageDesc' },
    transitionOverlay: { label: 'options.reduceMotionTransitionOverlay', desc: 'options.reduceMotionTransitionOverlayDesc' },
    monetBackground: { label: 'options.reduceMotionMonetBackground', desc: 'options.reduceMotionMonetBackgroundDesc' },
    uiMicroMotion: { label: 'options.reduceMotionUiMicroMotion', desc: 'options.reduceMotionUiMicroMotionDesc' },
    settingsScroll: { label: 'options.reduceMotionSettingsScroll', desc: 'options.reduceMotionSettingsScrollDesc' },
};

const MotionReductionSettingsSection: React.FC<MotionReductionSettingsSectionProps> = ({
    settingsCardClass,
    toggleOffBackgroundClass,
    theme,
}) => {
    const { t } = useTranslation();
    const surfaces = useMotionSettingsStore(state => state.reducedMotionSurfaces);
    const followSystem = useMotionSettingsStore(state => state.followSystemReducedMotion);
    const systemPrefers = useMotionSettingsStore(state => state.systemPrefersReducedMotion);
    const toggleSurface = useMotionSettingsStore(state => state.handleToggleReducedMotionSurface);
    const toggleFollowSystem = useMotionSettingsStore(state => state.handleToggleFollowSystemReducedMotion);
    const forcedBySystem = followSystem && systemPrefers;

    const renderToggleRow = (
        label: string,
        description: string,
        active: boolean,
        onChange: (next: boolean) => void,
        showForcedHint = false,
    ) => (
        <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
                <div className="max-w-[360px] text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>
                    {description}
                </div>
                {showForcedHint ? (
                    <div className="max-w-[360px] text-[11px] opacity-40" style={{ color: 'var(--text-secondary)' }}>
                        {t('options.reduceMotionForcedBySystem')}
                    </div>
                ) : null}
            </div>
            <button
                type="button"
                onClick={() => onChange(!active)}
                className={`h-6 w-12 shrink-0 rounded-full p-1 transition-colors ${!active ? toggleOffBackgroundClass : ''}`}
                style={{ backgroundColor: active ? theme?.secondaryColor || 'rgba(114, 119, 134, 1)' : undefined }}
                aria-pressed={active}
                aria-label={label}
            >
                <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    );

    return (
        <div className={`space-y-4 rounded-xl border p-4 ${settingsCardClass}`} data-testid="motion-reduction-settings">
            <div className="max-w-[420px] text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>
                {t('options.reduceMotionSectionDesc')}
            </div>

            <div className="border-t border-black/5 pt-4 dark:border-white/5">
                {renderToggleRow(
                    t('options.reduceMotionFollowSystem'),
                    t('options.reduceMotionFollowSystemDesc'),
                    followSystem,
                    toggleFollowSystem,
                )}
            </div>

            <div className="space-y-4 border-t border-black/5 pt-4 dark:border-white/5">
                {MOTION_SURFACE_IDS.map(surface => (
                    <React.Fragment key={surface}>
                        {renderToggleRow(
                            t(SURFACE_LABEL_KEYS[surface].label),
                            t(SURFACE_LABEL_KEYS[surface].desc),
                            surfaces[surface] || forcedBySystem,
                            (next) => toggleSurface(surface, next),
                            forcedBySystem && !surfaces[surface],
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default MotionReductionSettingsSection;
