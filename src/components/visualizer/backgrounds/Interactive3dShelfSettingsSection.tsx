import React from 'react';
import type { Interactive3dSceneTuning, Theme } from '../../../types';
import { colorWithAlpha } from '../colorMix';
import type {
    PlaylistShelfCameraMode,
    PlaylistShelfMode,
    PlaylistShelfPresence,
} from '../geometric/shelf/shelfTypes';

// src/components/visualizer/backgrounds/Interactive3dShelfSettingsSection.tsx
// Segmented controls for 3D playlist shelf mode, presence, and camera.

const SHELF_MODES: PlaylistShelfMode[] = ['off', 'sidebar', 'stage'];
const SHELF_PRESENCE_OPTIONS: PlaylistShelfPresence[] = ['auto', 'always'];
const SHELF_CAMERA_MODES: PlaylistShelfCameraMode[] = ['dynamic', 'static'];

interface Interactive3dShelfSettingsSectionProps {
    t: (key: string) => string;
    theme: Theme;
    isDaylight: boolean;
    tuning: Interactive3dSceneTuning;
    onTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
    compact?: boolean;
    activeOptionBg?: string;
}

const getShelfModeLabel = (mode: PlaylistShelfMode, t: (key: string) => string) => {
    switch (mode) {
        case 'off':
            return t('options.interactive3dShelfModeOff') || '关闭';
        case 'sidebar':
            return t('options.interactive3dShelfModeSidebar') || '侧栏';
        case 'stage':
            return t('options.interactive3dShelfModeStage') || '舞台';
        default:
            return mode;
    }
};

export const Interactive3dShelfSettingsSection: React.FC<Interactive3dShelfSettingsSectionProps> = ({
    t,
    theme,
    isDaylight,
    tuning,
    onTuningChange,
    compact = false,
    activeOptionBg,
}) => {
    const buttonClass = compact
        ? 'px-2 py-1 rounded-md text-[10px] transition-all'
        : 'px-3 py-2 rounded-full text-sm transition-all border';

    const renderSegment = <T extends string>(
        testId: string,
        label: string,
        options: T[],
        value: T,
        onSelect: (next: T) => void,
        getLabel: (option: T) => string,
    ) => (
        <div className={compact ? 'space-y-1' : 'space-y-2.5'} data-testid={testId}>
            <div
                className={compact ? 'text-[10px] font-medium opacity-60' : 'text-xs font-medium uppercase tracking-[0.24em] opacity-45'}
                style={{ color: compact ? undefined : theme.secondaryColor }}
            >
                {label}
            </div>
            <div className={compact ? 'flex flex-wrap gap-1' : 'flex flex-wrap gap-2'}>
                {options.map(option => {
                    const isActive = value === option;
                    return (
                        <button
                            key={option}
                            type="button"
                            data-testid={`${testId}-${option}`}
                            onClick={() => onSelect(option)}
                            className={`${buttonClass} ${compact && isActive ? activeOptionBg : compact ? 'opacity-40 hover:opacity-100' : ''}`}
                            style={compact ? undefined : {
                                borderColor: isActive
                                    ? colorWithAlpha(theme.secondaryColor, 0.45)
                                    : colorWithAlpha(theme.secondaryColor, 0.16),
                                backgroundColor: isActive
                                    ? (isDaylight ? 'rgba(255,255,255,0.92)' : colorWithAlpha(theme.secondaryColor, 0.18))
                                    : colorWithAlpha(theme.backgroundColor, 0.18),
                                color: theme.primaryColor,
                            }}
                        >
                            {getLabel(option)}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className={compact ? 'space-y-2 pt-1 border-t border-white/5' : 'space-y-4'} data-testid="interactive3d-shelf-settings">
            {renderSegment(
                'interactive3d-shelf-mode',
                t('options.interactive3dShelfMode') || '歌单架模式',
                SHELF_MODES,
                tuning.shelfMode,
                (shelfMode) => onTuningChange?.({ shelfMode }),
                (mode) => getShelfModeLabel(mode, t),
            )}

            {tuning.shelfMode !== 'off' && (
                <>
                    {renderSegment(
                        'interactive3d-shelf-presence',
                        t('options.interactive3dShelfPresence') || '显示方式',
                        SHELF_PRESENCE_OPTIONS,
                        tuning.shelfPresence,
                        (shelfPresence) => onTuningChange?.({ shelfPresence }),
                        (presence) => (
                            presence === 'auto'
                                ? (t('options.interactive3dShelfPresenceAuto') || '自动隐藏')
                                : (t('options.interactive3dShelfPresenceAlways') || '常驻')
                        ),
                    )}
                    {renderSegment(
                        'interactive3d-shelf-camera',
                        t('options.interactive3dShelfCameraMode') || '歌单架镜头',
                        SHELF_CAMERA_MODES,
                        tuning.shelfCameraMode,
                        (shelfCameraMode) => onTuningChange?.({ shelfCameraMode }),
                        (cameraMode) => (
                            cameraMode === 'dynamic'
                                ? (t('options.interactive3dShelfCameraDynamic') || '动态镜头')
                                : (t('options.interactive3dShelfCameraStatic') || '静态镜头')
                        ),
                    )}
                </>
            )}
        </div>
    );
};

export default Interactive3dShelfSettingsSection;
