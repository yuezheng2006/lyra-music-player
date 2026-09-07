import React from 'react';
import type { NomandBackgroundEffect } from '../../../../types';
import { listNomandEffectIds } from '../../../../utils/visualizer/nomandApi';
import NomandDitheringSettings from './NomandDitheringSettings';
import NomandFlutedGlassSettings from './NomandFlutedGlassSettings';
import NomandHalftoneDotsSettings from './NomandHalftoneDotsSettings';
import NomandLensDistortionSettings from './NomandLensDistortionSettings';
import NomandPaperTextureSettings from './NomandPaperTextureSettings';
import { getNomandEffectPanelColors, type NomandBackgroundEffectPanelProps } from './NomandBackgroundEffectPanel';

// src/components/visualizer/backgrounds/nomand/NomandBackgroundEffectSettings.tsx
// Picks the active registered effect and mounts only its tuning panel.

const EFFECT_LABEL_KEYS: Record<string, string> = {
    dithering: 'options.nomandBackgroundEffectDithering',
    'fluted-glass': 'options.nomandBackgroundEffectFlutedGlass',
    'paper-texture': 'options.nomandBackgroundEffectPaperTexture',
    'halftone-dots': 'options.nomandBackgroundEffectHalftoneDots',
    'lens-distortion': 'options.nomandBackgroundEffectLensDistortion',
};

const NomandBackgroundEffectSettings: React.FC<NomandBackgroundEffectPanelProps> = props => {
    const { t, isDaylight, theme, tuning } = props;
    const { borderColor, selectedBg } = getNomandEffectPanelColors(theme, isDaylight);
    const effects = listNomandEffectIds();

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="text-sm" style={{ color: theme.primaryColor }}>
                    {t('options.nomandBackgroundEffect')}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {effects.map(effect => (
                        <button
                            key={effect}
                            type="button"
                            onClick={() => props.onTuningChange?.({ effect: effect as NomandBackgroundEffect })}
                            className="rounded-xl border px-2 py-2 text-xs"
                            style={{
                                borderColor: tuning.effect === effect ? theme.accentColor : borderColor,
                                backgroundColor: tuning.effect === effect ? selectedBg : 'transparent',
                                color: theme.primaryColor,
                            }}
                        >
                            {t(EFFECT_LABEL_KEYS[effect] ?? effect)}
                        </button>
                    ))}
                </div>
            </div>

            {tuning.effect === 'dithering' && <NomandDitheringSettings {...props} />}
            {tuning.effect === 'fluted-glass' && <NomandFlutedGlassSettings {...props} />}
            {tuning.effect === 'paper-texture' && <NomandPaperTextureSettings {...props} />}
            {tuning.effect === 'halftone-dots' && <NomandHalftoneDotsSettings {...props} />}
            {tuning.effect === 'lens-distortion' && <NomandLensDistortionSettings {...props} />}
            {/* lens-distortion panel stays for imported Folia configs; shader mounts after shaders-react >= 0.0.80. */}
        </div>
    );
};

export default NomandBackgroundEffectSettings;
