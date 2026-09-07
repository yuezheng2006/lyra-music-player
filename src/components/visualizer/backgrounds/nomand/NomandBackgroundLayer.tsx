import React from 'react';
import { DEFAULT_NOMAND_BACKGROUND_TUNING, type MonetBackgroundImage, type NomandBackgroundTuning, type Theme } from '../../../../types';
import { resolveNomandImageSource, resolveStoredNomandBackgroundTuning } from '../../../../utils/visualizer/nomandApi';
import { getNomandEffectRenderer } from './nomandEffectRenderers';

// src/components/visualizer/backgrounds/nomand/NomandBackgroundLayer.tsx
// Mounts the registered Paper image effect over cover or uploaded art.

interface NomandBackgroundLayerProps {
    coverUrl?: string | null;
    monetBackgroundImage?: MonetBackgroundImage | null;
    tuning?: NomandBackgroundTuning;
    theme: Theme;
    isDaylight?: boolean;
}

const NomandBackgroundLayer: React.FC<NomandBackgroundLayerProps> = ({
    coverUrl,
    monetBackgroundImage,
    tuning: tuningOverride,
    theme,
    isDaylight,
}) => {
    const tuning = resolveStoredNomandBackgroundTuning({
        ...DEFAULT_NOMAND_BACKGROUND_TUNING,
        ...tuningOverride,
    });
    const sourceUrl = resolveNomandImageSource({
        imageSource: tuning.imageSource,
        coverUrl,
        uploadedUrl: monetBackgroundImage?.url,
    });

    if (!sourceUrl) {
        return (
            <div
                className="absolute inset-0 z-0"
                style={{ backgroundColor: theme.backgroundColor }}
            />
        );
    }

    const renderEffect = getNomandEffectRenderer(tuning.effect) ?? getNomandEffectRenderer('dithering');

    return (
        <div
            className="absolute inset-0 z-0 overflow-hidden"
            style={{ backgroundColor: theme.backgroundColor, pointerEvents: 'none' }}
        >
            {renderEffect?.({ sourceUrl, tuning, theme, isDaylight })}
            {tuning.overlayEnabled && tuning.overlayOpacity > 0 && (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundColor: theme.backgroundColor,
                        opacity: tuning.overlayOpacity,
                    }}
                />
            )}
        </div>
    );
};

export default React.memo(NomandBackgroundLayer);
