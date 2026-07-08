import React from 'react';
import { Hand, Keyboard, Orbit, WandSparkles } from 'lucide-react';
import type {
    Interactive3dCameraControlMode,
    Interactive3dSceneTuning,
    Theme,
} from '../../../types';
import { colorWithAlpha } from '../colorMix';
import { INTERACTIVE3D_CAMERA_CONTROL_OPTIONS } from '../geometric/interactive3dSceneRegistry';
import { Interactive3dSectionLabel } from './Interactive3dSettingsPrimitives';

// src/components/visualizer/backgrounds/Interactive3dCameraControlSelector.tsx
// Camera interaction mode selector for the interactive 3D background.

interface Interactive3dCameraControlSelectorProps {
    t: (key: string) => string;
    theme: Theme;
    isDaylight: boolean;
    tuning: Interactive3dSceneTuning;
    onTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
}

const CAMERA_ICON_MAP: Record<Interactive3dCameraControlMode, typeof WandSparkles> = {
    auto: WandSparkles,
    orbit: Orbit,
    wasd: Keyboard,
    gesture: Hand,
};

const getCameraControlLabel = (
    mode: Interactive3dCameraControlMode,
    t: (key: string) => string,
) => {
    switch (mode) {
        case 'auto':
            return t('options.interactive3dCameraControlAuto') || '自动';
        case 'orbit':
            return t('options.interactive3dCameraControlOrbit') || '轨道拖拽';
        case 'wasd':
            return t('options.interactive3dCameraControlWasd') || 'WASD 自由';
        case 'gesture':
            return t('options.interactive3dCameraControlGesture') || '手势旋转';
        default:
            return mode;
    }
};

export const Interactive3dCameraControlSelector: React.FC<Interactive3dCameraControlSelectorProps> = ({
    t,
    theme,
    isDaylight,
    tuning,
    onTuningChange,
}) => (
    <div className="space-y-2.5">
        <Interactive3dSectionLabel theme={theme}>
            {t('options.interactive3dCameraControl') || '镜头交互'}
        </Interactive3dSectionLabel>
        <div className="text-xs opacity-70 max-w-[360px]" style={{ color: theme.secondaryColor }}>
            {t('options.interactive3dCameraControlDesc') || '控制 3D 背景的拖拽轨道、WASD 自由镜头或手势式粒子旋转。'}
        </div>
        <div className="grid grid-cols-2 gap-2" data-testid="interactive3d-camera-control-group">
            {INTERACTIVE3D_CAMERA_CONTROL_OPTIONS.map(mode => {
                const isActive = tuning.cameraControl === mode;
                const Icon = CAMERA_ICON_MAP[mode];
                return (
                    <button
                        key={mode}
                        type="button"
                        data-testid={`interactive3d-camera-control-${mode}`}
                        onClick={() => onTuningChange?.({ cameraControl: mode })}
                        className="inline-flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-all"
                        style={{
                            borderColor: isActive
                                ? colorWithAlpha(theme.secondaryColor, 0.45)
                                : colorWithAlpha(theme.secondaryColor, 0.16),
                            backgroundColor: isActive
                                ? (isDaylight ? 'rgba(255,255,255,0.92)' : colorWithAlpha(theme.secondaryColor, 0.18))
                                : colorWithAlpha(theme.backgroundColor, 0.18),
                            color: theme.primaryColor,
                        }}
                    >
                        <Icon size={14} className="shrink-0" />
                        <span className="truncate">{getCameraControlLabel(mode, t)}</span>
                    </button>
                );
            })}
        </div>
    </div>
);
