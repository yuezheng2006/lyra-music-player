import {
    resolveSongThemeAutoGenerateChange,
    resolveSongThemeAutoSwitchChange,
    type ThemePreferenceSwitchState,
} from '../services/themePreferences';
import { mergeUrlBackgroundList } from './urlBackground';
import type { UrlBackgroundItem } from '../types';

// src/utils/appearanceImportPlan.ts
// What an imported config would actually change, computed before anything is applied. Pure: the
// caller passes the incoming config and a snapshot of the current one, both in the shape
// decompressConfig/buildCurrentConfig already speak, so the diff is a field-by-field compare.
//
// The point of doing this up front is the derived changes. The three song-theme switches are
// mutually exclusive by construction (see themePreferences resolvers), so accepting an incoming
// auto-switch value can also flip "prefer custom theme" — a setting that is not in the config at
// all and would otherwise change with no warning.

export type ImportGroup = 'theme' | 'visualizer' | 'fonts' | 'background' | 'songTheme';

export const IMPORT_GROUPS: ImportGroup[] = ['theme', 'visualizer', 'fonts', 'background', 'songTheme'];

export interface ImportChange {
    group: ImportGroup;
    key: string;
    from: unknown;
    to: unknown;
    derived?: boolean;
    causedBy?: string[];
    forces?: string[];
    note?: 'fontUnavailable' | 'listMerged';
    children?: ImportChange[];
}

export interface ImportPlan {
    changes: ImportChange[];
    unchanged: ImportChange[];
    groups: ImportGroup[];
}

export const THEME_LIGHT_KEY = 'themeLight';
export const THEME_DARK_KEY = 'themeDark';
export const ACTIVATE_CUSTOM_THEME_KEY = 'activateCustomTheme';

// Every config field the import path actually applies, mapped to the group it is presented under.
const FIELD_GROUPS: Record<string, ImportGroup> = {
    visualizerMode: 'visualizer',
    lyricWordMode: 'visualizer',
    lyricFontPresetId: 'visualizer',
    lyricEffectPackId: 'visualizer',
    visualEffectIntensity: 'visualizer',
    visualizerOpacity: 'visualizer',
    hidePlayerTranslationSubtitle: 'visualizer',
    showSubtitleTranslation: 'visualizer',
    subtitleContentMode: 'visualizer',
    showHarmonySubtitle: 'visualizer',
    harmonySubtitleBackground: 'visualizer',
    playbackPresentation: 'visualizer',
    classicTuning: 'visualizer',
    cadenzaTuning: 'visualizer',
    partitaTuning: 'visualizer',
    fumeTuning: 'visualizer',
    claddaghTuning: 'visualizer',
    cappellaTuning: 'visualizer',
    tiltTuning: 'visualizer',
    monetTuning: 'visualizer',
    pendoloTuning: 'visualizer',

    lyricsFontStyle: 'fonts',
    lyricsFontScale: 'fonts',
    subtitleFontInheritsLyrics: 'fonts',
    subtitleFontScale: 'fonts',
    subtitleFontStyle: 'fonts',
    subtitleFontFamily: 'fonts',
    subtitleOverlayBackground: 'fonts',
    lyricColorPresetId: 'fonts',
    lyricBodyColor: 'fonts',

    visualizerBackgroundMode: 'background',
    backgroundOpacity: 'background',
    monetBackgroundTuning: 'background',
    nomandBackgroundTuning: 'background',
    latentBackgroundTuning: 'background',
    interactive3dSceneTuning: 'background',
    urlBackgroundList: 'background',
    urlBackgroundSelectedId: 'background',
    enableSmartAtmosphere: 'background',
    enable3dInteractiveBackground: 'background',
    performanceMode: 'background',
    ambientVisualEnabled: 'background',
    magneticPullEnabled: 'background',
    emotionScrambleEnabled: 'background',
    emotionBeatPulseEnabled: 'background',

    stageTrackPillMode: 'visualizer',
    stageTrackPillTimeoutSec: 'visualizer',
    stageTrackPillOnHome: 'visualizer',

    songThemeAutoSwitchEnabled: 'songTheme',
    songThemeAutoGenerateEnabled: 'songTheme',
};

const TRUTHY_GUARDED_FIELDS = new Set([
    'visualizerMode',
    'lyricWordMode',
    'lyricFontPresetId',
    'lyricEffectPackId',
    'visualEffectIntensity',
    'visualizerBackgroundMode',
    'subtitleContentMode',
    'playbackPresentation',
    'lyricsFontStyle',
    'subtitleFontStyle',
    'lyricColorPresetId',
    'classicTuning',
    'cadenzaTuning',
    'partitaTuning',
    'fumeTuning',
    'claddaghTuning',
    'cappellaTuning',
    'tiltTuning',
    'monetTuning',
    'pendoloTuning',
    'monetBackgroundTuning',
    'nomandBackgroundTuning',
    'latentBackgroundTuning',
    'interactive3dSceneTuning',
    'urlBackgroundSelectedId',
    'stageTrackPillMode',
]);

const isSameValue = (a: unknown, b: unknown): boolean => {
    if (a === b) return true;
    if (a === undefined || b === undefined || a === null || b === null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch {
        return false;
    }
};

const THEME_SIDE_FIELDS = [
    'backgroundColor',
    'primaryColor',
    'accentColor',
    'secondaryColor',
    'fontStyle',
    'fontFamily',
    'wordColors',
    'lyricsIcons',
] as const;

const isEmptyish = (value: unknown) =>
    value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

const isSameThemeSide = (a: unknown, b: unknown): boolean => {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
    return THEME_SIDE_FIELDS.every((field) => {
        const left = (a as Record<string, unknown>)[field];
        const right = (b as Record<string, unknown>)[field];
        if (isEmptyish(left) && isEmptyish(right)) return true;
        return isSameValue(left, right);
    });
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const leafBelongsTo = (ownerField: string, leafPath: string, renderer: string) =>
    ownerField === `${renderer}Tuning` || leafPath.startsWith(`${renderer}.`);

export interface LocalAssetAvailability {
    hasCappellaEmojiPack?: boolean;
    hasMonetBackgroundImage?: boolean;
    hasMonetPortraitImage?: boolean;
}

const isPinnedLeaf = (
    ownerField: string,
    leafPath: string,
    to: unknown,
    assets: LocalAssetAvailability,
): boolean => {
    const leaf = leafPath.split('.').pop();

    if (leaf === 'beamIntensity' && leafBelongsTo(ownerField, leafPath, 'cadenza')) return true;

    if (leaf === 'emojiPackSource' && to === 'custom' && !assets.hasCappellaEmojiPack
        && leafBelongsTo(ownerField, leafPath, 'cappella')) return true;

    if (leaf === 'backgroundSource' && to === 'uploaded-global' && !assets.hasMonetBackgroundImage
        && ownerField === 'monetBackgroundTuning') return true;

    if (leaf === 'portraitSource' && to === 'custom' && !assets.hasMonetPortraitImage
        && leafBelongsTo(ownerField, leafPath, 'monet')) return true;

    return false;
};

const diffLeaves = (from: unknown, to: unknown, group: ImportGroup, prefix = ''): ImportChange[] => {
    if (!isPlainObject(to)) return [];
    const base = isPlainObject(from) ? from : {};
    const leaves: ImportChange[] = [];

    for (const key of Object.keys(to)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const left = base[key];
        const right = to[key];
        if (isSameValue(left, right)) continue;
        if (isPlainObject(right)) {
            leaves.push(...diffLeaves(left, right, group, path));
            continue;
        }
        leaves.push({ group, key: path, from: left, to: right });
    }

    return leaves;
};

export interface ImportPlanInput {
    incoming: Record<string, unknown>;
    current: Record<string, unknown>;
    switches: ThemePreferenceSwitchState;
    isCustomThemeActive?: boolean;
    assets?: LocalAssetAvailability;
}

/** Older exports stored karaoke as a visualizer mode; apply writes lyricWordMode instead. */
export function normalizeImportedAppearanceConfig(
    incoming: Record<string, unknown>,
): Record<string, unknown> {
    if (incoming.visualizerMode !== 'karaoke') return incoming;
    const next = { ...incoming };
    if (next.lyricWordMode === undefined) next.lyricWordMode = 'karaoke';
    delete next.visualizerMode;
    return next;
}

export function buildImportPlan({
    incoming,
    current,
    switches,
    isCustomThemeActive,
    assets = {},
}: ImportPlanInput): ImportPlan {
    const source = normalizeImportedAppearanceConfig(incoming);
    const changes: ImportChange[] = [];
    const unchanged: ImportChange[] = [];
    const record = (change: ImportChange, same: boolean) => (same ? unchanged : changes).push(change);

    if (source.theme) {
        const incomingTheme = source.theme as { light?: unknown; dark?: unknown };
        const currentTheme = (current.theme ?? null) as { light?: unknown; dark?: unknown } | null;
        for (const [key, side] of [[THEME_LIGHT_KEY, 'light'], [THEME_DARK_KEY, 'dark']] as const) {
            const from = currentTheme?.[side] ?? null;
            const to = incomingTheme[side];
            if (to === undefined) continue;
            record({ group: 'theme', key, from, to }, isSameThemeSide(from, to));
        }

        if (!isCustomThemeActive) {
            changes.push({ group: 'theme', key: ACTIVATE_CUSTOM_THEME_KEY, from: false, to: true });
            for (const change of changes) {
                if (change.key === THEME_LIGHT_KEY || change.key === THEME_DARK_KEY) {
                    change.forces = [ACTIVATE_CUSTOM_THEME_KEY];
                }
            }
        }
    }

    const mergedUrlList = source.urlBackgroundList !== undefined
        ? mergeUrlBackgroundList((current.urlBackgroundList as UrlBackgroundItem[] | undefined) ?? [], source.urlBackgroundList)
        : null;

    for (const [key, group] of Object.entries(FIELD_GROUPS)) {
        if (source[key] === undefined) continue;
        if (TRUTHY_GUARDED_FIELDS.has(key) && !source[key]) continue;

        if (key === 'urlBackgroundList' && mergedUrlList) {
            const change: ImportChange = { group, key, from: current[key], to: mergedUrlList };
            const same = isSameValue(mergedUrlList, current[key]);
            if (!same) change.note = 'listMerged';
            record(change, same);
            continue;
        }

        if (key === 'urlBackgroundSelectedId') {
            const currentList = (current.urlBackgroundList as UrlBackgroundItem[] | undefined) ?? [];
            const inCurrent = currentList.some(item => item.id === source[key]);
            if (!(mergedUrlList ?? currentList).some(item => item.id === source[key])) continue;

            const change: ImportChange = { group, key, from: current[key], to: source[key] };
            if (!inCurrent) change.forces = ['urlBackgroundList'];
            record(change, isSameValue(source[key], current[key]));
            continue;
        }

        const change: ImportChange = { group, key, from: current[key], to: source[key] };
        let same = isSameValue(source[key], current[key]);

        if (isPlainObject(source[key])) {
            const children = diffLeaves(current[key], source[key], group)
                .filter(child => !isPinnedLeaf(key, child.key, child.to, assets));
            same = children.length === 0;
            if (!same) change.children = children;
        }

        record(change, same);
    }

    const wantsSwitch = source.songThemeAutoSwitchEnabled;
    const wantsGenerate = source.songThemeAutoGenerateEnabled;
    if (wantsSwitch !== undefined || wantsGenerate !== undefined) {
        let next = switches;
        if (wantsSwitch !== undefined) next = resolveSongThemeAutoSwitchChange(next, Boolean(wantsSwitch));
        if (wantsGenerate !== undefined) next = resolveSongThemeAutoGenerateChange(next, Boolean(wantsGenerate));
        if (next.isCustomThemePreferred !== switches.isCustomThemePreferred) {
            changes.push({
                group: 'songTheme',
                key: 'isCustomThemePreferred',
                from: switches.isCustomThemePreferred,
                to: next.isCustomThemePreferred,
                derived: true,
                causedBy: [
                    ...(wantsSwitch !== undefined ? ['songThemeAutoSwitchEnabled'] : []),
                    ...(wantsGenerate !== undefined ? ['songThemeAutoGenerateEnabled'] : []),
                ],
            });
        }
    }

    const linkSwitches = (key: string, when: boolean, target: string) => {
        const change = changes.find(c => c.key === key && !c.derived);
        const targetChange = changes.find(c => c.key === target && !c.derived);
        if (change && targetChange && change.to === when) change.forces = [target];
    };
    linkSwitches('songThemeAutoGenerateEnabled', true, 'songThemeAutoSwitchEnabled');
    linkSwitches('songThemeAutoSwitchEnabled', false, 'songThemeAutoGenerateEnabled');

    const present = new Set(changes.map(c => c.group));
    return { changes, unchanged, groups: IMPORT_GROUPS.filter(g => present.has(g)) };
}
