import type { AtmosphereThemeHints } from '../types';

// src/types/trackAtmosphereLightPlan.ts
// Curated / pre-extracted per-track atmosphere + lighting recipe contracts.

export const TRACK_ATMOSPHERE_LIGHT_PLAN_VERSION = 1 as const;

export type TrackAtmosphereLabel =
    | 'intimate'
    | 'dreamy'
    | 'melancholy'
    | 'warm'
    | 'energetic'
    | 'aggressive'
    | 'nightlife'
    | 'cinematic'
    | 'acoustic'
    | 'ambient';

export type TrackAtmosphereSource =
    | 'essentia'
    | 'spotify-features'
    | 'cover+lyrics'
    | 'hybrid'
    | 'manual';

export type TrackAtmosphereLightMode =
    | 'ambient'
    | 'pulse'
    | 'spectrum'
    | 'bass-boost'
    | 'cinematic';

export type TrackAtmospherePaletteSource =
    | 'cover'
    | 'mood-map'
    | 'ai-theme'
    | 'hybrid'
    | 'manual';

export type TrackAtmosphereLightDeviceProtocol = 'hue' | 'wled' | 'none';

export interface TrackAtmosphereLightPlanMatch {
    songIds?: string[];
    fingerprints?: string[];
    aliases?: string[];
}

export interface TrackAtmosphereProfile {
    labels: TrackAtmosphereLabel[];
    valence: number;
    energy: number;
    arousal: number;
    danceability?: number;
    tempoBpm?: number;
    brightnessBias: number;
    warmth: number;
    confidence: number;
    source: TrackAtmosphereSource;
}

export interface TrackAtmosphereLightPalette {
    primary: string;
    secondary: string;
    accent?: string;
    from: TrackAtmospherePaletteSource;
}

export interface TrackAtmosphereLightStatic {
    brightness: number;
    saturation: number;
    colorTempK?: number;
    transitionMs: number;
}

export interface TrackAtmosphereLightDynamics {
    beatSensitivity: number;
    bassGain: number;
    strobeAllowed: boolean;
    maxFlashHz: number;
    idleDrift: number;
}

export interface TrackAtmosphereLightZone {
    id: 'back' | 'side' | 'desk' | 'ceiling' | string;
    role: 'wash' | 'accent' | 'reactive';
    color: string;
    brightness: number;
}

/** Reserved for future Hue/WLED adapters — never sent at runtime in v1. */
export interface TrackAtmosphereLightDeviceHints {
    protocol: TrackAtmosphereLightDeviceProtocol;
    entertainmentMode?: boolean;
    effectId?: string;
}

export interface TrackAtmosphereLighting {
    mode: TrackAtmosphereLightMode;
    palette: TrackAtmosphereLightPalette;
    static: TrackAtmosphereLightStatic;
    dynamics: TrackAtmosphereLightDynamics;
    zones?: TrackAtmosphereLightZone[];
    deviceHints?: TrackAtmosphereLightDeviceHints;
}

export interface TrackAtmosphereLightPlanAppBridge {
    atmosphereHints: AtmosphereThemeHints;
}

export interface TrackAtmosphereLightPlan {
    version: typeof TRACK_ATMOSPHERE_LIGHT_PLAN_VERSION;
    id: string;
    match: TrackAtmosphereLightPlanMatch;
    atmosphere: TrackAtmosphereProfile;
    lighting: TrackAtmosphereLighting;
    appBridge: TrackAtmosphereLightPlanAppBridge;
}

/** Lookup inputs for matching a playing song to a plan. */
export interface TrackAtmosphereSongMeta {
    songId?: string | number | null;
    title?: string | null;
    artist?: string | null;
}
