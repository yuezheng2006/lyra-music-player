import type { AtmosphereThemeHints } from '../../types';
import {
    TRACK_ATMOSPHERE_LIGHT_PLAN_VERSION,
    type TrackAtmosphereLabel,
    type TrackAtmosphereLightDeviceProtocol,
    type TrackAtmosphereLightMode,
    type TrackAtmosphereLightPlan,
    type TrackAtmosphereLightZone,
    type TrackAtmospherePaletteSource,
    type TrackAtmosphereSongMeta,
    type TrackAtmosphereSource,
} from '../../types/trackAtmosphereLightPlan';

// src/utils/atmosphere/trackAtmosphereLightPlanMath.ts
// Fingerprint, match, sanitize, and plan→hints helpers for track light plans.

const LABEL_SET = new Set<TrackAtmosphereLabel>([
    'intimate',
    'dreamy',
    'melancholy',
    'warm',
    'energetic',
    'aggressive',
    'nightlife',
    'cinematic',
    'acoustic',
    'ambient',
]);

const SOURCE_SET = new Set<TrackAtmosphereSource>([
    'essentia',
    'spotify-features',
    'cover+lyrics',
    'hybrid',
    'manual',
]);

const MODE_SET = new Set<TrackAtmosphereLightMode>([
    'ambient',
    'pulse',
    'spectrum',
    'bass-boost',
    'cinematic',
]);

const PALETTE_FROM_SET = new Set<TrackAtmospherePaletteSource>([
    'cover',
    'mood-map',
    'ai-theme',
    'hybrid',
    'manual',
]);

const DEVICE_PROTOCOL_SET = new Set<TrackAtmosphereLightDeviceProtocol>([
    'hue',
    'wled',
    'none',
]);

const ZONE_ROLE_SET = new Set<TrackAtmosphereLightZone['role']>(['wash', 'accent', 'reactive']);

const isLightZoneRole = (value: string | null): value is TrackAtmosphereLightZone['role'] => (
    Boolean(value) && ZONE_ROLE_SET.has(value as TrackAtmosphereLightZone['role'])
);

const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const asRecord = (value: unknown): Record<string, unknown> | null => (
    value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null
);

const pickFinite = (value: unknown): number | undefined => (
    typeof value === 'number' && Number.isFinite(value) ? value : undefined
);

const pickUnit = (value: unknown): number | undefined => {
    const n = pickFinite(value);
    return n === undefined ? undefined : clamp(n, 0, 1);
};

const pickString = (value: unknown): string | undefined => (
    typeof value === 'string' && value.trim() ? value.trim() : undefined
);

const pickHex = (value: unknown): string | undefined => {
    const s = pickString(value);
    return s && HEX_COLOR_RE.test(s) ? s : undefined;
};

const normalizeText = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, ' ');

/** Builds a stable artist::title fingerprint for catalog matching. */
export const buildTrackAtmosphereFingerprint = (
    artist: string | null | undefined,
    title: string | null | undefined,
): string | null => {
    const a = artist ? normalizeText(artist) : '';
    const t = title ? normalizeText(title) : '';
    if (!a && !t) return null;
    return `${a}::${t}`;
};

export const buildTrackAtmosphereSongMeta = (
    song: {
        id?: string | number | null;
        name?: string | null;
        ar?: Array<{ name?: string | null }> | null;
        artists?: Array<{ name?: string | null } | string> | null;
        localData?: {
            matchedArtists?: string | null;
            artist?: string | null;
        } | null;
    } | null | undefined,
): TrackAtmosphereSongMeta | null => {
    if (!song) return null;
    const fromAr = song.ar?.map((a) => a?.name).filter(Boolean).join(', ') || '';
    const fromArtists = song.artists?.map((a) => (
        typeof a === 'string' ? a : a?.name
    )).filter(Boolean).join(', ') || '';
    const fromLocal = song.localData?.matchedArtists || song.localData?.artist || '';
    const artist = fromAr || fromArtists || fromLocal || null;
    const title = song.name?.trim() || null;
    if (song.id == null && !title && !artist) return null;
    return {
        songId: song.id ?? null,
        title,
        artist,
    };
};

const songIdKey = (songId: string | number | null | undefined): string | null => {
    if (songId == null) return null;
    const key = String(songId).trim().toLowerCase();
    return key && key !== 'unknown' ? key : null;
};

const collectMatchKeys = (plan: TrackAtmosphereLightPlan): string[] => {
    const keys = new Set<string>();
    for (const id of plan.match.songIds ?? []) {
        const key = songIdKey(id);
        if (key) keys.add(`id:${key}`);
    }
    for (const fp of plan.match.fingerprints ?? []) {
        const normalized = normalizeText(fp);
        if (normalized) keys.add(`fp:${normalized}`);
    }
    for (const alias of plan.match.aliases ?? []) {
        const normalized = normalizeText(alias);
        if (normalized) keys.add(`fp:${normalized}`);
    }
    return [...keys];
};

/** True when song meta hits any plan match key (id, fingerprint, or alias). */
export const trackAtmosphereLightPlanMatches = (
    plan: TrackAtmosphereLightPlan,
    meta: TrackAtmosphereSongMeta | null | undefined,
): boolean => {
    if (!meta) return false;
    const id = songIdKey(meta.songId);
    if (id && (plan.match.songIds ?? []).some((candidate) => songIdKey(candidate) === id)) {
        return true;
    }
    const fingerprint = buildTrackAtmosphereFingerprint(meta.artist, meta.title);
    if (!fingerprint) return false;
    const needles = [
        ...(plan.match.fingerprints ?? []),
        ...(plan.match.aliases ?? []),
    ].map(normalizeText).filter(Boolean);
    return needles.includes(fingerprint);
};

const sanitizeLabels = (value: unknown): TrackAtmosphereLabel[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is TrackAtmosphereLabel => (
        typeof item === 'string' && LABEL_SET.has(item as TrackAtmosphereLabel)
    ));
};

const sanitizeStringList = (
    value: unknown,
    mode: 'id' | 'fingerprint' = 'fingerprint',
): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const list = value
        .map((item) => {
            if (typeof item !== 'string') return '';
            return mode === 'id' ? songIdKey(item) ?? '' : normalizeText(item);
        })
        .filter(Boolean);
    return list.length ? list : undefined;
};

const sanitizeAtmosphereHints = (value: unknown): AtmosphereThemeHints => {
    const raw = asRecord(value) ?? {};
    const hints: AtmosphereThemeHints = {};
    const rhythmIntensity = pickFinite(raw.rhythmIntensity);
    const cinemaShake = pickFinite(raw.cinemaShake);
    const atmosphereSensitivity = pickFinite(raw.atmosphereSensitivity);
    const cameraPunchStrength = pickFinite(raw.cameraPunchStrength);
    if (rhythmIntensity !== undefined) {
        hints.rhythmIntensity = clamp(rhythmIntensity, 0.55, 1.2);
    }
    if (cinemaShake !== undefined) {
        hints.cinemaShake = clamp(cinemaShake, 0.18, 1.2);
    }
    if (atmosphereSensitivity !== undefined) {
        hints.atmosphereSensitivity = clamp(atmosphereSensitivity, 0.55, 1.5);
    }
    if (cameraPunchStrength !== undefined) {
        hints.cameraPunchStrength = clamp(cameraPunchStrength, 0.5, 1.5);
    }
    return hints;
};

/**
 * Soft-sanitize a plan. Returns null only when core identity / lighting / match
 * cannot be recovered; bad optional fields are dropped.
 */
export const sanitizeTrackAtmosphereLightPlan = (
    value: unknown,
): TrackAtmosphereLightPlan | null => {
    const raw = asRecord(value);
    if (!raw) return null;

    const id = pickString(raw.id);
    if (!id) return null;

    const version = pickFinite(raw.version);
    if (version !== TRACK_ATMOSPHERE_LIGHT_PLAN_VERSION) return null;

    const matchRaw = asRecord(raw.match) ?? {};
    const songIds = sanitizeStringList(matchRaw.songIds, 'id');
    const fingerprints = sanitizeStringList(matchRaw.fingerprints, 'fingerprint');
    const aliases = sanitizeStringList(matchRaw.aliases, 'fingerprint');
    if (!songIds?.length && !fingerprints?.length && !aliases?.length) return null;

    const atmosphereRaw = asRecord(raw.atmosphere);
    if (!atmosphereRaw) return null;
    const source = pickString(atmosphereRaw.source);
    if (!source || !SOURCE_SET.has(source as TrackAtmosphereSource)) return null;

    const valence = pickUnit(atmosphereRaw.valence) ?? 0.5;
    const energy = pickUnit(atmosphereRaw.energy) ?? 0.5;
    const arousal = pickUnit(atmosphereRaw.arousal) ?? 0.5;
    const brightnessBias = pickUnit(atmosphereRaw.brightnessBias) ?? 0.5;
    const warmth = pickUnit(atmosphereRaw.warmth) ?? 0.5;
    const confidence = pickUnit(atmosphereRaw.confidence) ?? 0.5;
    const danceability = pickUnit(atmosphereRaw.danceability);
    const tempoBpm = pickFinite(atmosphereRaw.tempoBpm);

    const lightingRaw = asRecord(raw.lighting);
    if (!lightingRaw) return null;
    const mode = pickString(lightingRaw.mode);
    if (!mode || !MODE_SET.has(mode as TrackAtmosphereLightMode)) return null;

    const paletteRaw = asRecord(lightingRaw.palette);
    const primary = pickHex(paletteRaw?.primary);
    const secondary = pickHex(paletteRaw?.secondary);
    const accent = pickHex(paletteRaw?.accent);
    const from = pickString(paletteRaw?.from);
    if (!primary || !secondary || !from || !PALETTE_FROM_SET.has(from as TrackAtmospherePaletteSource)) {
        return null;
    }

    const staticRaw = asRecord(lightingRaw.static) ?? {};
    const dynamicsRaw = asRecord(lightingRaw.dynamics) ?? {};

    const zonesRaw = Array.isArray(lightingRaw.zones) ? lightingRaw.zones : [];
    const zones = zonesRaw.flatMap((zoneValue) => {
        const zone = asRecord(zoneValue);
        if (!zone) return [];
        const zoneId = pickString(zone.id);
        const role = pickString(zone.role);
        const color = pickHex(zone.color);
        const brightness = pickUnit(zone.brightness);
        if (!zoneId || !color || brightness === undefined || !isLightZoneRole(role)) return [];
        return [{ id: zoneId, role, color, brightness }];
    });

    const deviceRaw = asRecord(lightingRaw.deviceHints);
    let deviceHints: TrackAtmosphereLightPlan['lighting']['deviceHints'];
    if (deviceRaw) {
        const protocol = pickString(deviceRaw.protocol);
        if (protocol && DEVICE_PROTOCOL_SET.has(protocol as TrackAtmosphereLightDeviceProtocol)) {
            deviceHints = {
                protocol: protocol as TrackAtmosphereLightDeviceProtocol,
                ...(typeof deviceRaw.entertainmentMode === 'boolean'
                    ? { entertainmentMode: deviceRaw.entertainmentMode }
                    : {}),
                ...(pickString(deviceRaw.effectId)
                    ? { effectId: pickString(deviceRaw.effectId) }
                    : {}),
            };
        }
    }

    const appBridgeRaw = asRecord(raw.appBridge);
    const atmosphereHints = sanitizeAtmosphereHints(appBridgeRaw?.atmosphereHints);

    const plan: TrackAtmosphereLightPlan = {
        version: TRACK_ATMOSPHERE_LIGHT_PLAN_VERSION,
        id,
        match: {
            ...(songIds ? { songIds } : {}),
            ...(fingerprints ? { fingerprints } : {}),
            ...(aliases ? { aliases } : {}),
        },
        atmosphere: {
            labels: sanitizeLabels(atmosphereRaw.labels),
            valence,
            energy,
            arousal,
            brightnessBias,
            warmth,
            confidence,
            source: source as TrackAtmosphereSource,
            ...(danceability !== undefined ? { danceability } : {}),
            ...(tempoBpm !== undefined ? { tempoBpm } : {}),
        },
        lighting: {
            mode: mode as TrackAtmosphereLightMode,
            palette: {
                primary,
                secondary,
                from: from as TrackAtmospherePaletteSource,
                ...(accent ? { accent } : {}),
            },
            static: {
                brightness: pickUnit(staticRaw.brightness) ?? 0.4,
                saturation: pickUnit(staticRaw.saturation) ?? 0.5,
                transitionMs: Math.max(0, pickFinite(staticRaw.transitionMs) ?? 1800),
                ...(pickFinite(staticRaw.colorTempK) !== undefined
                    ? { colorTempK: clamp(pickFinite(staticRaw.colorTempK)!, 2000, 6500) }
                    : {}),
            },
            dynamics: {
                beatSensitivity: clamp(pickFinite(dynamicsRaw.beatSensitivity) ?? 1, 0, 1.5),
                bassGain: pickUnit(dynamicsRaw.bassGain) ?? 0.5,
                strobeAllowed: dynamicsRaw.strobeAllowed === true,
                maxFlashHz: Math.max(0, pickFinite(dynamicsRaw.maxFlashHz) ?? 0),
                idleDrift: pickUnit(dynamicsRaw.idleDrift) ?? 0.3,
            },
            ...(zones.length ? { zones } : {}),
            ...(deviceHints ? { deviceHints } : {}),
        },
        appBridge: {
            atmosphereHints,
        },
    };

    return plan;
};

/** Intensity hints from a plan; never includes visualPreset. */
export const atmosphereHintsFromTrackPlan = (
    plan: TrackAtmosphereLightPlan,
): AtmosphereThemeHints => {
    const fromBridge = sanitizeAtmosphereHints(plan.appBridge.atmosphereHints);
    if (
        fromBridge.rhythmIntensity !== undefined
        || fromBridge.cinemaShake !== undefined
        || fromBridge.atmosphereSensitivity !== undefined
        || fromBridge.cameraPunchStrength !== undefined
    ) {
        return fromBridge;
    }

    // Fallback: derive intensity from atmosphere profile when appBridge is empty.
    const energy = clamp(plan.atmosphere.energy, 0, 1);
    const arousal = clamp(plan.atmosphere.arousal, 0, 1);
    const mix = clamp(energy * 0.55 + arousal * 0.45, 0, 1);
    return {
        rhythmIntensity: clamp(0.72 + mix * 0.38, 0.55, 1.2),
        cinemaShake: clamp(0.28 + mix * 0.55, 0.18, 1.2),
        atmosphereSensitivity: clamp(
            plan.lighting.dynamics.beatSensitivity || (0.75 + mix * 0.45),
            0.55,
            1.5,
        ),
        cameraPunchStrength: clamp(0.7 + mix * 0.5, 0.5, 1.5),
    };
};

/** Merge theme-derived hints with plan hints; plan fields win. Strips visualPreset. */
export const mergeAtmosphereHintsWithTrackPlan = (
    themeHints: AtmosphereThemeHints,
    plan: TrackAtmosphereLightPlan | null,
): AtmosphereThemeHints => {
    const { visualPreset: _themePreset, ...themeIntensity } = themeHints;
    if (!plan) return themeIntensity;
    const planHints = atmosphereHintsFromTrackPlan(plan);
    return {
        ...themeIntensity,
        ...planHints,
    };
};

export const listTrackAtmosphereLightPlanMatchKeys = collectMatchKeys;

export const findMatchingTrackAtmosphereLightPlan = (
    plans: TrackAtmosphereLightPlan[],
    meta: TrackAtmosphereSongMeta | null | undefined,
): TrackAtmosphereLightPlan | null => {
    for (const plan of plans) {
        if (trackAtmosphereLightPlanMatches(plan, meta)) return plan;
    }
    return null;
};
