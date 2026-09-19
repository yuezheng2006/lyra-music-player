import React from 'react';
import {
    FlutedGlass,
    HalftoneDots,
    ImageDithering,
    PaperTexture,
} from '@paper-design/shaders-react';
import type { Theme } from '../../../../types';
import type { NomandBackgroundEffect, NomandBackgroundTuning } from '../../../../types/nomandBackground';
import {
    getPaperTextureOverscan,
    NOMAND_PAPER_TEXTURE_SHAPE,
    resolveDaylightInversion,
    resolveHalftoneInversion,
} from '../../../../utils/visualizer/nomandApi';

// src/components/visualizer/backgrounds/nomand/nomandEffectRenderers.tsx
// Built-in Paper shader mounts. Plugins can registerNomandEffectRenderer.

const MAX_SHADER_PIXELS = 1280 * 720;

export interface NomandEffectRenderContext {
    sourceUrl: string;
    tuning: NomandBackgroundTuning;
    theme: Theme;
    isDaylight?: boolean;
}

export type NomandEffectRenderer = (ctx: NomandEffectRenderContext) => React.ReactNode;

const commonProps = (sourceUrl: string) => ({
    width: '100%' as const,
    height: '100%' as const,
    image: sourceUrl,
    fit: 'cover' as const,
    minPixelRatio: 1,
    maxPixelCount: MAX_SHADER_PIXELS,
    style: { width: '100%', height: '100%' },
});

const renderers = new Map<string, NomandEffectRenderer>();

export const registerNomandEffectRenderer = (effect: NomandBackgroundEffect, render: NomandEffectRenderer) => {
    renderers.set(effect, render);
};

export const getNomandEffectRenderer = (effect: NomandBackgroundEffect): NomandEffectRenderer | undefined => (
    renderers.get(effect)
);

registerNomandEffectRenderer('fluted-glass', ({ sourceUrl, tuning, theme }) => (
    <FlutedGlass
        key={`${sourceUrl}:fluted-glass`}
        {...commonProps(sourceUrl)}
        colorBack={theme.backgroundColor}
        colorShadow={theme.secondaryColor}
        colorHighlight={theme.primaryColor}
        shadows={0.25}
        size={tuning.flutedGlassSize}
        distortion={tuning.flutedGlassDistortion}
        blur={tuning.flutedGlassBlur}
        shape="lines"
        distortionShape="prism"
        highlights={0.1}
        edges={0.25}
    />
));

registerNomandEffectRenderer('paper-texture', ({ sourceUrl, tuning, theme }) => (
    <PaperTexture
        key={`${sourceUrl}:paper-texture`}
        {...commonProps(sourceUrl)}
        {...NOMAND_PAPER_TEXTURE_SHAPE}
        colorFront={theme.accentColor}
        colorBack={theme.backgroundColor}
        contrast={tuning.paperTextureContrast}
        roughness={tuning.paperTextureRoughness}
        fiber={tuning.paperTextureFiber}
        scale={getPaperTextureOverscan(tuning.paperTextureRoughness, tuning.paperTextureFiber)}
    />
));

registerNomandEffectRenderer('halftone-dots', ({ sourceUrl, tuning, theme, isDaylight }) => (
    <HalftoneDots
        key={`${sourceUrl}:halftone-dots`}
        {...commonProps(sourceUrl)}
        colorBack={theme.backgroundColor}
        colorFront={theme.accentColor}
        size={tuning.halftoneDotsSize}
        radius={tuning.halftoneDotsRadius}
        contrast={tuning.halftoneDotsContrast}
        originalColors={tuning.halftoneDotsOriginalColors}
        inverted={resolveHalftoneInversion(
            tuning.halftoneDotsInverted,
            tuning.halftoneDotsOriginalColors,
            isDaylight,
        )}
        grid="hex"
        type="gooey"
        grainMixer={0.12}
        grainOverlay={0.06}
        grainSize={0.5}
    />
));

registerNomandEffectRenderer('dithering', ({ sourceUrl, tuning, theme, isDaylight }) => (
    <ImageDithering
        key={`${sourceUrl}:dithering`}
        {...commonProps(sourceUrl)}
        colorBack={theme.backgroundColor}
        colorFront={theme.accentColor}
        colorHighlight={theme.primaryColor}
        originalColors={tuning.originalColors}
        inverted={resolveDaylightInversion(tuning.inverted, tuning.originalColors, isDaylight)}
        type={tuning.ditheringType}
        size={tuning.size}
        colorSteps={tuning.colorSteps}
    />
));
