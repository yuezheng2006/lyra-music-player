import {
    DEFAULT_CLADDAGH_TUNING,
    DEFAULT_LATENT_BACKGROUND_TUNING,
    DEFAULT_MONET_BACKGROUND_TUNING,
    DEFAULT_MONET_TUNING,
    type Theme,
} from '../../types';
import { compressNomandBackground, decompressNomandBackground } from './nomandAppearanceCodec';

// src/utils/settings/visualSettingsConfig.ts
// Shortcode compress/decompress for appearance import/export. Kept out of the settings view so
// the confirmation dialog can plan against the same codec without growing that file.

export const compressTheme = (t: Theme): any => ({
    n: t.name,
    bg: t.backgroundColor,
    pc: t.primaryColor,
    ac: t.accentColor,
    sc: t.secondaryColor,
    tfs: t.fontStyle,
    tff: t.fontFamily,
    ai: t.animationIntensity,
    wc: t.wordColors,
    li: t.lyricsIcons,
    pv: t.provider,
    tds: t.description,
});

export const decompressTheme = (o: any): Theme => ({
    name: o.n || 'Imported Theme',
    backgroundColor: o.bg || '#000000',
    primaryColor: o.pc || '#ffffff',
    accentColor: o.ac || '#ffffff',
    secondaryColor: o.sc || '#888888',
    fontStyle: o.tfs || 'sans',
    fontFamily: o.tff,
    animationIntensity: o.ai || 'normal',
    wordColors: o.wc || [],
    lyricsIcons: o.li || [],
    provider: o.pv,
    description: o.tds || '',
});

const compressClassic = (t: any): any => ({
    ewr: t.enableWordRotation,
    bfm: t.breathingFloatMultiplier,
    ull: t.useLegacyLayout,
    cws: t.wordSpacing,
});
const decompressClassic = (o: any): any => ({
    enableWordRotation: o.ewr !== undefined ? o.ewr : true,
    breathingFloatMultiplier: o.bfm !== undefined ? o.bfm : 1,
    useLegacyLayout: o.ull,
    wordSpacing: o.cws,
});

const compressCadenza = (t: any): any => ({
    cfs: t.fontScale,
    wr: t.widthRatio,
    ma: t.motionAmount,
    gi: t.glowIntensity,
    bi: t.beamIntensity,
});
const decompressCadenza = (o: any): any => ({
    fontScale: o.cfs !== undefined ? o.cfs : 1.12,
    widthRatio: o.wr !== undefined ? o.wr : 0.72,
    motionAmount: o.ma !== undefined ? o.ma : 1,
    glowIntensity: o.gi !== undefined ? o.gi : 1,
    beamIntensity: o.bi !== undefined ? o.bi : 0,
});

const compressPartita = (t: any): any => ({
    sgl: t.showGuideLines,
    usl: t.useSemanticLayout,
    smi: t.staggerMin,
    sma: t.staggerMax,
});
const decompressPartita = (o: any): any => ({
    showGuideLines: o.sgl !== undefined ? o.sgl : true,
    useSemanticLayout: o.usl !== undefined ? o.usl : true,
    staggerMin: o.smi !== undefined ? o.smi : 20,
    staggerMax: o.sma !== undefined ? o.sma : 100,
});

const compressFume = (t: any): any => ({
    hps: t.hidePrintSymbols,
    dgb: t.disableGeometricBackground,
    boo: t.backgroundObjectOpacity,
    thr: t.textHoldRatio,
    ctm: t.cameraTrackingMode,
    csp: t.cameraSpeed,
    gi: t.glowIntensity,
    hs: t.heroScale,
});
const decompressFume = (o: any): any => ({
    hidePrintSymbols: o.hps !== undefined ? o.hps : false,
    disableGeometricBackground: o.dgb !== undefined ? o.dgb : true,
    backgroundObjectOpacity: o.boo !== undefined ? o.boo : 0.5,
    textHoldRatio: o.thr !== undefined ? o.thr : 1,
    cameraTrackingMode: o.ctm || 'smooth',
    cameraSpeed: o.csp !== undefined ? o.csp : 1,
    glowIntensity: o.gi !== undefined ? o.gi : 1,
    heroScale: o.hs !== undefined ? o.hs : 1,
});

const compressCladdagh = (t: any): any => ({
    fsr: t.focusScaleRatio,
    rs: t.radiusScale,
    etd: t.ellipseTiltDeg,
});
const decompressCladdagh = (o: any): any => ({
    focusScaleRatio: o.fsr !== undefined ? o.fsr : DEFAULT_CLADDAGH_TUNING.focusScaleRatio,
    radiusScale: o.rs !== undefined ? o.rs : DEFAULT_CLADDAGH_TUNING.radiusScale,
    ellipseTiltDeg: o.etd !== undefined ? o.etd : DEFAULT_CLADDAGH_TUNING.ellipseTiltDeg,
});

const compressCappella = (t: any): any => ({
    sem: t.showEmoMessages,
    eps: t.emojiPackSource,
    as: t.avatarSource,
});
const decompressCappella = (o: any): any => ({
    showEmoMessages: o.sem !== undefined ? o.sem : true,
    emojiPackSource: o.eps || 'builtin',
    avatarSource: o.as || 'cover',
});

const compressTilt = (t: any): any => ({
    sp: t.splitProbability,
    tsp: t.tiltStyleProbability,
    tcs: t.colorScheme,
});
const decompressTilt = (o: any): any => ({
    splitProbability: o.sp !== undefined ? o.sp : 0.75,
    tiltStyleProbability: o.tsp !== undefined ? o.tsp : 0.35,
    colorScheme: o.tcs || 'default',
});

const compressMonetBackground = (t: any): any => ({
    mbs: t.backgroundSource,
    mbl: t.backgroundLayout,
    mbb: t.backgroundBlurPx,
    mbo: t.backgroundOverlayOpacity,
    mbg: t.backgroundGrayscale,
    mbsat: t.backgroundSaturation,
    mbw: t.backgroundWash,
    mbh: t.backgroundHalfPaneOffsetX,
    mbwcm: t.backgroundWashColorMode,
    mbwcc: t.backgroundWashCustomColor,
});
const decompressMonetBackground = (o: any): any => ({
    backgroundSource: o.mbs || DEFAULT_MONET_BACKGROUND_TUNING.backgroundSource,
    backgroundLayout: o.mbl || DEFAULT_MONET_BACKGROUND_TUNING.backgroundLayout,
    backgroundBlurPx: o.mbb !== undefined ? o.mbb : DEFAULT_MONET_BACKGROUND_TUNING.backgroundBlurPx,
    backgroundOverlayOpacity: o.mbo !== undefined ? o.mbo : DEFAULT_MONET_BACKGROUND_TUNING.backgroundOverlayOpacity,
    backgroundGrayscale: o.mbg !== undefined ? o.mbg : DEFAULT_MONET_BACKGROUND_TUNING.backgroundGrayscale,
    backgroundSaturation: o.mbsat !== undefined ? o.mbsat : DEFAULT_MONET_BACKGROUND_TUNING.backgroundSaturation,
    backgroundWash: o.mbw !== undefined ? o.mbw : DEFAULT_MONET_BACKGROUND_TUNING.backgroundWash,
    backgroundHalfPaneOffsetX: o.mbh !== undefined ? o.mbh : DEFAULT_MONET_BACKGROUND_TUNING.backgroundHalfPaneOffsetX,
    backgroundWashColorMode: o.mbwcm || DEFAULT_MONET_BACKGROUND_TUNING.backgroundWashColorMode,
    backgroundWashCustomColor: o.mbwcc || DEFAULT_MONET_BACKGROUND_TUNING.backgroundWashCustomColor,
});

const compressLatentBackground = (t: any): any => ({
    ldm: t.displayMode,
    lcs: t.colorSource,
    ldop: t.dynamicOnlyInPlayer,
    lebr: t.enhancedBeatResponse,
    lds: t.ditheringSpeed,
    ldas: t.ditheringAudioSpeed,
    ldz: t.ditheringSize,
    ldo: t.ditheringOpacity,
    lms: t.meshSpeed,
    lmas: t.meshAudioSpeed,
    lmd: t.meshDistortion,
    lmw: t.meshSwirl,
    loe: t.overlayEnabled,
    loo: t.overlayOpacity,
});
const decompressLatentBackground = (o: any): any => ({
    displayMode: o.ldm || DEFAULT_LATENT_BACKGROUND_TUNING.displayMode,
    colorSource: o.lcs || DEFAULT_LATENT_BACKGROUND_TUNING.colorSource,
    dynamicOnlyInPlayer: o.ldop !== undefined ? o.ldop : DEFAULT_LATENT_BACKGROUND_TUNING.dynamicOnlyInPlayer,
    enhancedBeatResponse: o.lebr !== undefined ? o.lebr : DEFAULT_LATENT_BACKGROUND_TUNING.enhancedBeatResponse,
    ditheringSpeed: o.lds !== undefined ? o.lds : DEFAULT_LATENT_BACKGROUND_TUNING.ditheringSpeed,
    ditheringAudioSpeed: o.ldas !== undefined ? o.ldas : DEFAULT_LATENT_BACKGROUND_TUNING.ditheringAudioSpeed,
    ditheringSize: o.ldz !== undefined ? o.ldz : DEFAULT_LATENT_BACKGROUND_TUNING.ditheringSize,
    ditheringOpacity: o.ldo !== undefined ? o.ldo : DEFAULT_LATENT_BACKGROUND_TUNING.ditheringOpacity,
    meshSpeed: o.lms !== undefined ? o.lms : DEFAULT_LATENT_BACKGROUND_TUNING.meshSpeed,
    meshAudioSpeed: o.lmas !== undefined ? o.lmas : DEFAULT_LATENT_BACKGROUND_TUNING.meshAudioSpeed,
    meshDistortion: o.lmd !== undefined ? o.lmd : DEFAULT_LATENT_BACKGROUND_TUNING.meshDistortion,
    meshSwirl: o.lmw !== undefined ? o.lmw : DEFAULT_LATENT_BACKGROUND_TUNING.meshSwirl,
    overlayEnabled: o.loe !== undefined ? o.loe : DEFAULT_LATENT_BACKGROUND_TUNING.overlayEnabled,
    overlayOpacity: o.loo !== undefined ? o.loo : DEFAULT_LATENT_BACKGROUND_TUNING.overlayOpacity,
});

const compressMonet = (t: any): any => ({
    kce: t.keywordColoringEnabled,
    msd: t.showDescription,
    mas: t.audioStyle,
    mfs: t.fontScale,
    mps: t.portraitSource,
    pox: t.portraitOffsetX,
    mpy: t.portraitStyle,
    mpdh: t.showPortraitDragHanger,
});
const decompressMonet = (o: any): any => ({
    keywordColoringEnabled: o.kce !== undefined ? o.kce : DEFAULT_MONET_TUNING.keywordColoringEnabled,
    showDescription: o.msd !== undefined ? o.msd : DEFAULT_MONET_TUNING.showDescription,
    audioStyle: o.mas || DEFAULT_MONET_TUNING.audioStyle,
    fontScale: o.mfs !== undefined ? o.mfs : DEFAULT_MONET_TUNING.fontScale,
    portraitSource: o.mps || DEFAULT_MONET_TUNING.portraitSource,
    portraitOffsetX: o.pox !== undefined ? o.pox : DEFAULT_MONET_TUNING.portraitOffsetX,
    portraitStyle: o.mpy || DEFAULT_MONET_TUNING.portraitStyle,
    showPortraitDragHanger: o.mpdh !== undefined ? o.mpdh : DEFAULT_MONET_TUNING.showPortraitDragHanger,
});

export const compressConfig = (config: any): string => {
    const minified: any = {};
    if (config.theme) {
        minified.t = {
            l: compressTheme(config.theme.light),
            d: compressTheme(config.theme.dark),
        };
    }
    if (config.visualizerMode) minified.vm = config.visualizerMode;
    if (config.lyricWordMode) minified.lwm = config.lyricWordMode;
    if (config.lyricFontPresetId) minified.lfp = config.lyricFontPresetId;
    if (config.lyricEffectPackId) minified.lep = config.lyricEffectPackId;
    if (config.visualEffectIntensity) minified.vei = config.visualEffectIntensity;
    if (config.visualizerBackgroundMode) minified.vbm = config.visualizerBackgroundMode;
    if (config.backgroundOpacity !== undefined) minified.bo = config.backgroundOpacity;
    if (config.visualizerOpacity !== undefined) minified.vo = config.visualizerOpacity;
    if (config.hidePlayerTranslationSubtitle !== undefined) minified.hpts = config.hidePlayerTranslationSubtitle;
    if (config.showSubtitleTranslation !== undefined) minified.sst = config.showSubtitleTranslation;
    if (config.subtitleContentMode) minified.scm = config.subtitleContentMode;
    if (config.showHarmonySubtitle !== undefined) minified.shs = config.showHarmonySubtitle;
    if (config.harmonySubtitleBackground !== undefined) minified.hsb = config.harmonySubtitleBackground;
    if (config.playbackPresentation) minified.pp = config.playbackPresentation;
    if (config.subtitleFontScale !== undefined) minified.sfscl = config.subtitleFontScale;
    if (config.subtitleOverlayBackground !== undefined) minified.sob = config.subtitleOverlayBackground;
    if (config.subtitleFontInheritsLyrics !== undefined) minified.sfi = config.subtitleFontInheritsLyrics;
    if (config.subtitleFontStyle) minified.sfs = config.subtitleFontStyle;
    if (config.subtitleFontFamily) minified.sff = config.subtitleFontFamily;
    if (config.lyricsFontStyle) minified.lfs = config.lyricsFontStyle;
    if (config.lyricsFontScale !== undefined) minified.lfn = config.lyricsFontScale;
    if (config.lyricColorPresetId) minified.lcp = config.lyricColorPresetId;
    if (config.lyricBodyColor) minified.lbc = config.lyricBodyColor;

    if (config.classicTuning) minified.ct = compressClassic(config.classicTuning);
    if (config.cadenzaTuning) minified.cat = compressCadenza(config.cadenzaTuning);
    if (config.partitaTuning) minified.pt = compressPartita(config.partitaTuning);
    if (config.fumeTuning) minified.ft = compressFume(config.fumeTuning);
    if (config.claddaghTuning) minified.clt = compressCladdagh(config.claddaghTuning);
    if (config.cappellaTuning) minified.cpt = compressCappella(config.cappellaTuning);
    if (config.tiltTuning) minified.tt = compressTilt(config.tiltTuning);
    if (config.pendoloTuning) minified.pdt = config.pendoloTuning;
    if (config.monetBackgroundTuning) minified.mbt = compressMonetBackground(config.monetBackgroundTuning);
    if (config.latentBackgroundTuning) minified.lbt = compressLatentBackground(config.latentBackgroundTuning);
    if (config.nomandBackgroundTuning) minified.nbt = compressNomandBackground(config.nomandBackgroundTuning);
    if (config.interactive3dSceneTuning) minified.i3st = config.interactive3dSceneTuning;
    if (config.monetTuning) minified.mt = compressMonet(config.monetTuning);
    if (config.urlBackgroundList) minified.ubl = config.urlBackgroundList;
    if (config.urlBackgroundSelectedId) minified.ubid = config.urlBackgroundSelectedId;
    if (config.songThemeAutoSwitchEnabled !== undefined) minified.stas = config.songThemeAutoSwitchEnabled;
    if (config.songThemeAutoGenerateEnabled !== undefined) minified.stag = config.songThemeAutoGenerateEnabled;
    if (config.enableSmartAtmosphere !== undefined) minified.esa = config.enableSmartAtmosphere;
    if (config.enable3dInteractiveBackground !== undefined) minified.e3ib = config.enable3dInteractiveBackground;
    if (config.performanceMode) minified.pm = config.performanceMode;
    if (config.ambientVisualEnabled !== undefined) minified.ave = config.ambientVisualEnabled;
    if (config.magneticPullEnabled !== undefined) minified.mpe = config.magneticPullEnabled;
    if (config.emotionScrambleEnabled !== undefined) minified.ese = config.emotionScrambleEnabled;
    if (config.emotionBeatPulseEnabled !== undefined) minified.ebe = config.emotionBeatPulseEnabled;
    if (config.stageTrackPillMode) minified.stp = config.stageTrackPillMode;
    if (config.stageTrackPillTimeoutSec !== undefined) minified.stpt = config.stageTrackPillTimeoutSec;
    if (config.stageTrackPillOnHome !== undefined) minified.stph = config.stageTrackPillOnHome;

    const jsonStr = JSON.stringify(minified);
    const bytes = new TextEncoder().encode(jsonStr);
    const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    const base64 = btoa(binaryString);
    return `auralis-theme://${base64}`;
};

/**
 * Decodes and restores a configuration object from either raw JSON or a compressed base64 string starting with 'auralis-theme://'.
 */
export const decompressConfig = (str: string): any => {
    let parsed: any = null;
    const trimmed = str.trim();
    if (trimmed.startsWith('auralis-theme://')) {
        const base64 = trimmed.slice('auralis-theme://'.length);
        const binaryString = atob(base64);
        const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
        const jsonStr = new TextDecoder().decode(bytes);
        parsed = JSON.parse(jsonStr);
    } else {
        parsed = JSON.parse(trimmed);
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid format');
    }

    const isMinified = parsed.t !== undefined || parsed.vm !== undefined || parsed.lwm !== undefined || parsed.ct !== undefined || parsed.cat !== undefined || parsed.hpts !== undefined || parsed.sst !== undefined || parsed.esa !== undefined || parsed.e3ib !== undefined || parsed.pm !== undefined || parsed.ave !== undefined || parsed.mpe !== undefined || parsed.ese !== undefined || parsed.ebe !== undefined || parsed.stp !== undefined || parsed.stpt !== undefined || parsed.stph !== undefined;
    if (isMinified) {
        const decompressed: any = {};
        if (parsed.t) {
            decompressed.theme = {
                light: decompressTheme(parsed.t.l),
                dark: decompressTheme(parsed.t.d),
            };
        }
        if (parsed.vm) decompressed.visualizerMode = parsed.vm;
        if (parsed.lwm) decompressed.lyricWordMode = parsed.lwm;
        if (parsed.lfp) decompressed.lyricFontPresetId = parsed.lfp;
        if (parsed.lep) decompressed.lyricEffectPackId = parsed.lep;
        if (parsed.vei) decompressed.visualEffectIntensity = parsed.vei;
        if (parsed.vbm) decompressed.visualizerBackgroundMode = parsed.vbm;
        if (parsed.bo !== undefined) decompressed.backgroundOpacity = parsed.bo;
        if (parsed.vo !== undefined) decompressed.visualizerOpacity = parsed.vo;
        if (parsed.hpts !== undefined) decompressed.hidePlayerTranslationSubtitle = parsed.hpts;
        if (parsed.sst !== undefined) decompressed.showSubtitleTranslation = parsed.sst;
        if (parsed.scm) decompressed.subtitleContentMode = parsed.scm;
        if (parsed.shs !== undefined) decompressed.showHarmonySubtitle = parsed.shs;
        if (parsed.hsb !== undefined) decompressed.harmonySubtitleBackground = parsed.hsb;
        if (parsed.pp) decompressed.playbackPresentation = parsed.pp;
        if (parsed.sfscl !== undefined) decompressed.subtitleFontScale = parsed.sfscl;
        if (parsed.sob !== undefined) decompressed.subtitleOverlayBackground = parsed.sob;
        if (parsed.sfi !== undefined) decompressed.subtitleFontInheritsLyrics = parsed.sfi;
        if (parsed.sfs) decompressed.subtitleFontStyle = parsed.sfs;
        if (parsed.sff) decompressed.subtitleFontFamily = parsed.sff;
        if (parsed.lfs) decompressed.lyricsFontStyle = parsed.lfs;
        if (parsed.lfn !== undefined) decompressed.lyricsFontScale = parsed.lfn;
        if (parsed.lcp) decompressed.lyricColorPresetId = parsed.lcp;
        if (parsed.lbc) decompressed.lyricBodyColor = parsed.lbc;

        if (parsed.ct) decompressed.classicTuning = decompressClassic(parsed.ct);
        if (parsed.cat) decompressed.cadenzaTuning = decompressCadenza(parsed.cat);
        if (parsed.pt) decompressed.partitaTuning = decompressPartita(parsed.pt);
        if (parsed.ft) decompressed.fumeTuning = decompressFume(parsed.ft);
        if (parsed.clt) decompressed.claddaghTuning = decompressCladdagh(parsed.clt);
        if (parsed.cpt) decompressed.cappellaTuning = decompressCappella(parsed.cpt);
        if (parsed.tt) decompressed.tiltTuning = decompressTilt(parsed.tt);
        if (parsed.pdt) decompressed.pendoloTuning = parsed.pdt;
        if (parsed.mbt) decompressed.monetBackgroundTuning = decompressMonetBackground(parsed.mbt);
        if (parsed.lbt) decompressed.latentBackgroundTuning = decompressLatentBackground(parsed.lbt);
        if (parsed.nbt) decompressed.nomandBackgroundTuning = decompressNomandBackground(parsed.nbt);
        if (parsed.i3st) decompressed.interactive3dSceneTuning = parsed.i3st;
        if (parsed.mt) decompressed.monetTuning = decompressMonet(parsed.mt);
        if (parsed.ubl) decompressed.urlBackgroundList = parsed.ubl;
        if (parsed.ubid) decompressed.urlBackgroundSelectedId = parsed.ubid;
        if (parsed.stas !== undefined) decompressed.songThemeAutoSwitchEnabled = parsed.stas;
        if (parsed.stag !== undefined) decompressed.songThemeAutoGenerateEnabled = parsed.stag;
        if (parsed.esa !== undefined) decompressed.enableSmartAtmosphere = parsed.esa;
        if (parsed.e3ib !== undefined) decompressed.enable3dInteractiveBackground = parsed.e3ib;
        if (parsed.pm) decompressed.performanceMode = parsed.pm;
        if (parsed.ave !== undefined) decompressed.ambientVisualEnabled = parsed.ave;
        if (parsed.mpe !== undefined) decompressed.magneticPullEnabled = parsed.mpe;
        if (parsed.ese !== undefined) decompressed.emotionScrambleEnabled = parsed.ese;
        if (parsed.ebe !== undefined) decompressed.emotionBeatPulseEnabled = parsed.ebe;
        if (parsed.stp) decompressed.stageTrackPillMode = parsed.stp;
        if (parsed.stpt !== undefined) decompressed.stageTrackPillTimeoutSec = parsed.stpt;
        if (parsed.stph !== undefined) decompressed.stageTrackPillOnHome = parsed.stph;

        return decompressed;
    } else {
        const validKeys = [
            'theme', 'visualizerMode', 'lyricWordMode', 'lyricFontPresetId', 'lyricEffectPackId', 'visualEffectIntensity', 'visualizerBackgroundMode', 'backgroundOpacity',
            'visualizerOpacity', 'hidePlayerTranslationSubtitle', 'showSubtitleTranslation',
            'subtitleContentMode', 'showHarmonySubtitle', 'harmonySubtitleBackground', 'playbackPresentation', 'subtitleFontScale',
            'subtitleOverlayBackground', 'subtitleFontInheritsLyrics', 'subtitleFontStyle', 'subtitleFontFamily',
            'lyricsFontStyle', 'lyricsFontScale', 'lyricColorPresetId', 'lyricBodyColor', 'classicTuning',
            'cadenzaTuning', 'partitaTuning', 'fumeTuning', 'claddaghTuning', 'cappellaTuning',
            'tiltTuning', 'pendoloTuning', 'monetBackgroundTuning', 'latentBackgroundTuning', 'nomandBackgroundTuning', 'interactive3dSceneTuning', 'monetTuning',
            'urlBackgroundList', 'urlBackgroundSelectedId',
            'songThemeAutoSwitchEnabled', 'songThemeAutoGenerateEnabled',
            'enableSmartAtmosphere', 'enable3dInteractiveBackground', 'performanceMode', 'ambientVisualEnabled',
            'magneticPullEnabled', 'emotionScrambleEnabled', 'emotionBeatPulseEnabled',
            'stageTrackPillMode', 'stageTrackPillTimeoutSec', 'stageTrackPillOnHome',
        ];
        const hasValidKey = validKeys.some(k => parsed[k] !== undefined);
        if (!hasValidKey) {
            throw new Error('Invalid visual settings configuration');
        }
        return parsed;
    }
};
