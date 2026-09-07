import type { LineRenderHints } from './utils/lyrics/renderHints';
import type { BuiltinVisualizerMode } from './types/visualizerModes';

export type { BuiltinVisualizerMode } from './types/visualizerModes';

export interface LyricRuby {
  text: string;
  startTime: number; // Seconds
  endTime: number; // Seconds
}

export interface LyricSyllable {
  text: string;
  startTime: number; // Seconds
  endTime: number; // Seconds
  endsWithSpace?: boolean;
  ruby?: LyricRuby[];
  obscene?: boolean;
  emptyBeat?: number;
}

export interface LyricAlternateText {
  role: 'translation' | 'romanization' | string;
  language?: string;
  text: string;
  syllables?: LyricSyllable[];
}

export interface Word {
  text: string;
  startTime: number; // Seconds
  endTime: number; // Seconds
  syllables?: LyricSyllable[];
}

export interface LyricBackgroundVocal {
  text: string;
  startTime: number; // Seconds
  endTime: number; // Seconds
  words: Word[];
  agentId?: string;
  translation?: string;
  romanization?: string;
  alternateTexts?: LyricAlternateText[];
}

export type SubtitleContentMode = 'translation' | 'romanization' | 'none';
/** Lyrics drive the visualizer rail; captions render as a bottom subtitle plate. */
export type LyricPresentation = 'lyrics' | 'captions';

export interface LyricAgent {
  id: string;
  name?: string;
  type?: string;
}

export interface Line {
  words: Word[];
  startTime: number;
  endTime: number;
  fullText: string;
  translation?: string;
  id?: string;
  agentId?: string;
  songPart?: string;
  blockIndex?: number;
  romanization?: string;
  alternateTexts?: LyricAlternateText[];
  backgroundVocal?: LyricBackgroundVocal;
  backgroundVocals?: LyricBackgroundVocal[];
  renderHints?: LineRenderHints;
  isChorus?: boolean;
  chorusEffect?: 'bars' | 'circles' | 'beams';
}

export interface LyricData {
  lines: Line[];
  title?: string;
  artist?: string;
  isWordByWord?: boolean;
  presentation?: LyricPresentation;
  ttml?: {
    timingMode?: 'Word' | 'Line';
    agents?: Record<string, LyricAgent>;
  };
}

export interface Theme {
  name: string;
  backgroundColor: string;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  fontStyle: 'sans' | 'serif' | 'mono';
  fontFamily?: string;
  /** Extra fallback families after the primary lyric font. */
  fontFamilyStack?: string[];
  fontWeight?: number;
  animationIntensity: 'calm' | 'normal' | 'chaotic';
  /** Optional beat-sync scale boost multiplier for lyric rhythm staging. */
  lyricRhythmScaleMultiplier?: number;
  /** When true, lyric rhythm glow uses accentColor instead of neutral white. */
  lyricGlowUsesAccent?: boolean;
  wordColors?: { word: string; color: string; }[];
  lyricsIcons?: string[];
  provider?: string;
  description?: string;
}

export type CustomLyricsFontSource = 'system' | 'uploaded';

export interface StoredCustomLyricsFont {
  source: CustomLyricsFontSource;
  family: string;
  label?: string | null;
  fontId?: string;
}

export type ThemeMode = 'default' | 'ai' | 'custom';

export type VisualizerMode = BuiltinVisualizerMode | (string & {});
/** default = current line only; karaoke = upcoming preview + per-grapheme LTR wipe fill. */
export type LyricWordMode = 'default' | 'karaoke';

/** Playback presentation: default player chrome vs speaker-stage immersion. */
export type PlaybackPresentation = 'default' | 'speaker';
export type VisualizerFrameRate = 'off' | 120 | 90 | 60;

export type HomeViewTab = 'playlist' | 'local' | 'albums' | 'navidrome' | 'ytmusic' | 'radio' | 'daily' | 'podcast' | 'history' | 'charts';
/** Curated in-app online sources (not user plugins). */
export type BuiltInOnlineMusicProviderId =
  | 'netease'
  | 'qq'
  | 'qishui'
  | 'coco'
  | 'kugou'
  | 'bilibili'
  | 'kuwo';
/**
 * Built-in or dynamic sidecar plugin id.
 * `(string & {})` keeps autocomplete for built-ins while allowing open-mode plugins.
 */
export type OnlineMusicProviderId = BuiltInOnlineMusicProviderId | (string & {});
export type SearchSourceId = HomeViewTab | OnlineMusicProviderId;

export type PlaybackContext = 'main' | 'stage';
export type StageSource = 'stage-api' | 'now-playing';
export type StageLoopMode = 'off' | 'all' | 'one';
export type GridViewCardLayout = 'neat' | 'casual';
export type QueueAddBehavior = 'append' | 'next';
export type StageActiveEntryKind = 'lyrics' | 'media';

export interface StageEmbeddedUsltTag {
  language?: string;
  descriptor?: string;
  text: string;
}

export interface StageEmbeddedLyricSource {
  type: 'embedded';
  usltTags?: StageEmbeddedUsltTag[];
  textContent?: string;
  translationContent?: string;
}

export interface StageLocalLyricSource {
  type: 'local';
  lrcContent: string;
  tLrcContent?: string;
  formatHint?: 'lrc' | 'enhanced-lrc' | 'vtt' | 'ttml' | 'yrc' | 'qrc' | 'krc';
}

export interface StageNeteaseLyricBranch {
  lyric?: string;
  pureMusic?: boolean;
}

export interface StageNeteaseLyricSource {
  type: 'netease';
  lrc?: StageNeteaseLyricBranch & {
    yrc?: StageNeteaseLyricBranch;
    ytlrc?: StageNeteaseLyricBranch;
    yromalrc?: StageNeteaseLyricBranch;
    romalrc?: StageNeteaseLyricBranch;
  };
  yrc?: StageNeteaseLyricBranch;
  ytlrc?: StageNeteaseLyricBranch;
  yromalrc?: StageNeteaseLyricBranch;
  tlyric?: StageNeteaseLyricBranch;
  romalrc?: StageNeteaseLyricBranch;
  pureMusic?: boolean;
}

export interface StageNavidromeStructuredLyricLine {
  start?: number;
  value?: string;
}

export interface StageNavidromeLyricSource {
  type: 'navidrome';
  structuredLyrics?: StageNavidromeStructuredLyricLine[];
  plainLyrics?: string;
}

export interface StageQrcLyricSource {
  type: 'qrc';
  qrcContent: string;
  translationContent?: string;
}

export type StageLyricSource =
  | StageEmbeddedLyricSource
  | StageLocalLyricSource
  | StageNeteaseLyricSource
  | StageNavidromeLyricSource
  | StageQrcLyricSource;

export interface StageLyricsSession {
  title?: string;
  artist?: string;
  album?: string;
  lyricSource: StageLyricSource;
  updatedAt: number;
}

export interface StageMediaSession {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationMs?: number | null;
  coverUrl?: string | null;
  coverArtUrl?: string | null;
  audioUrl?: string | null;
  audioSrc: string;
  audioMimeType?: string;
  coverMimeType?: string;
  lyricsText?: string | null;
  lyricsFormat?: 'lrc' | 'enhanced-lrc' | 'vtt' | 'ttml' | 'yrc' | 'qrc' | null;
  updatedAt: number;
}

export type StageSession = StageMediaSession;

export interface StageSearchResult {
  songId: number;
  title: string;
  artists: string[];
  album: string;
  durationMs: number | null;
  coverUrl: string | null;
}

export interface StageExternalPlayRequest {
  requestId: string;
  songId: number;
  appendToQueue?: boolean;
}

export interface StageExternalPlayResult {
  requestId: string;
  ok: boolean;
  error?: string | null;
  baseSnapshot?: StagePlayerSnapshot;
  snapshot?: StagePlayerSnapshot;
  result?: unknown;
}

export interface StageStatus {
  domain?: 'stage-input';
  direction?: 'outside-in';
  enabled: boolean;
  modeEnabled?: boolean;
  source?: StageSource | null;
  port: number;
  token: string | null;
  activeEntryKind: StageActiveEntryKind | null;
  lyricsSession: StageLyricsSession | null;
  mediaSession: StageMediaSession | null;
}

export type StagePlayerPlaybackContext = 'normal-playback' | 'stage-session' | 'external-playback-source';

export interface StagePlayerCurrent {
  id: string;
  source: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  coverUrl: string | null;
}

export interface StagePlayerControlCapabilities {
  play: boolean;
  pause: boolean;
  resume: boolean;
  seek: boolean;
  previous: boolean;
  next: boolean;
}

export interface StagePlayerQueueCapabilities {
  append: boolean;
  insertNext: boolean;
  remove: boolean;
  move: boolean;
  select: boolean;
  clear: boolean;
}

export interface StagePlayerQueueItem extends StagePlayerCurrent {
  queueItemId: string;
}

export interface StagePlayerQueueSummary {
  currentIndex: number;
  length: number;
  revision?: string;
}

export interface StagePlayerQueueSnapshot extends StagePlayerQueueSummary {
  items: StagePlayerQueueItem[];
}

export interface StagePlayerQueueWindow extends StagePlayerQueueSummary {
  items: StagePlayerQueueItem[];
  offset: number;
  limit: number;
  returned: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export type StagePlayerQueueDiffOp =
  | { op: 'insert'; index: number; item: StagePlayerQueueItem }
  | { op: 'remove'; index: number }
  | { op: 'move'; from: number; to: number }
  | { op: 'clear' }
  | { op: 'select'; index: number };

export interface StagePlayerQueueDiff {
  baseRevision: string;
  revision: string;
  ops: StagePlayerQueueDiffOp[];
  requiresReload?: true;
}

export interface StagePlayerSnapshot {
  playbackContext: StagePlayerPlaybackContext;
  current: StagePlayerCurrent | null;
  playerState: PlayerState;
  positionMs: number;
  durationMs: number;
  sampledAtMs: number;
  updatedAt: number;
  controlCapabilities: StagePlayerControlCapabilities;
  queueCapabilities: StagePlayerQueueCapabilities;
  queue: StagePlayerQueueSnapshot;
}

export interface StagePlayerControlRequest {
  requestId: string;
  action: 'next' | 'prev' | 'pause' | 'resume' | 'seek';
  positionMs?: number;
}

export interface StagePlayerQueueRequest {
  requestId: string;
  action: 'append' | 'insert-next' | 'remove' | 'move' | 'select' | 'clear';
  songId?: number;
  songIds?: number[];
  queueItemId?: string;
  fromQueueItemId?: string;
  fromIndex?: number;
  toIndex?: number;
  index?: number;
}

export interface StagePlayerRequestResult {
  requestId: string;
  ok: boolean;
  error?: string | null;
  snapshot?: StagePlayerSnapshot;
  result?: unknown;
}

export type NowPlayingConnectionStatus = 'disabled' | 'connecting' | 'connected' | 'error';

export interface NowPlayingTrackSnapshot {
  id: string | null;
  title: string;
  artist: string;
  album: string;
  coverUrl: string | null;
  durationMs: number | null;
  isVideo?: boolean;
  isAdvertisement?: boolean;
}

export interface NowPlayingLyricPayload {
  source: string | null;
  title: string;
  artist: string;
  durationMs: number | null;
  hasLyric: boolean;
  hasTranslatedLyric: boolean;
  hasKaraokeLyric: boolean;
  lrc: string | null;
  translatedLyric: string | null;
  karaokeLyric: string | null;
}

export interface ClassicTuning {
  enableWordRotation: boolean;
  breathingFloatMultiplier: number;
  useLegacyLayout?: boolean;
  wordSpacing?: number;
}

export const DEFAULT_CLASSIC_TUNING: ClassicTuning = {
  enableWordRotation: true,
  breathingFloatMultiplier: 1,
  useLegacyLayout: false,
  wordSpacing: 0.7,
};

export interface CadenzaTuning {
  fontScale: number;
  widthRatio: number;
  motionAmount: number;
  glowIntensity: number;
  beamIntensity: number;
}

export const DEFAULT_CADENZA_TUNING: CadenzaTuning = {
  fontScale: 1.12,
  widthRatio: 0.72,
  motionAmount: 1,
  glowIntensity: 1,
  beamIntensity: 0,
};

export interface PartitaTuning {
  showGuideLines: boolean;
  useSemanticLayout: boolean;
  staggerMin: number;
  staggerMax: number;
}

export const DEFAULT_PARTITA_TUNING: PartitaTuning = {
  showGuideLines: true,
  useSemanticLayout: true,
  staggerMin: 20,
  staggerMax: 100,
};

export interface FumeTuning {
  hidePrintSymbols: boolean;
  disableGeometricBackground: boolean;
  backgroundObjectOpacity: number;
  textHoldRatio: number;
  cameraTrackingMode: 'stepped' | 'smooth';
  cameraSpeed: number;
  glowIntensity: number;
  heroScale: number;
}

export const DEFAULT_FUME_TUNING: FumeTuning = {
  hidePrintSymbols: false,
  disableGeometricBackground: true,
  backgroundObjectOpacity: 0.5,
  textHoldRatio: 1,
  cameraTrackingMode: 'smooth',
  cameraSpeed: 1,
  glowIntensity: 1,
  heroScale: 1,
};

export interface CladdaghTuning {
  focusScaleRatio: number;
  radiusScale: number;
  ellipseTiltDeg: number;
}

export const DEFAULT_CLADDAGH_TUNING: CladdaghTuning = {
  // Stronger front punch for face-on depth (still softer than the old 0.9 handoff jump).
  focusScaleRatio: 0.62,
  radiusScale: 1.0,
  // Face-on parallel ring (major axis horizontal).
  ellipseTiltDeg: 0,
};

export type CappellaEmojiPackSource = 'builtin' | 'custom';
export type CappellaAvatarSource = 'cover' | 'builtin' | 'color' | 'custom';

export interface CappellaTuning {
  showEmoMessages: boolean;
  emojiPackSource: CappellaEmojiPackSource;
  avatarSource: CappellaAvatarSource;
}

export const DEFAULT_CAPPELLA_TUNING: CappellaTuning = {
  showEmoMessages: true,
  emojiPackSource: 'builtin',
  avatarSource: 'cover',
};

export type TiltColorScheme = 'default' | 'swap' | 'accentAll' | 'primaryAll';

export interface TiltTuning {
  splitProbability: number;
  tiltStyleProbability: number;
  colorScheme?: TiltColorScheme;
}

export const DEFAULT_TILT_TUNING: TiltTuning = {
  splitProbability: 0.75,
  tiltStyleProbability: 0.35,
  colorScheme: 'default',
};

export interface PendoloTuning {
  arcRadius: number;
  arcAngleDeg: number;
  wheelCenterX: number;
  wheelCenterY: number;
  tickSnappiness: number;
  activeScale: number;
  showGearDecor: 'none' | 'subtle' | 'full';
  showCenterGradient?: boolean;
  showCoverOnWatchFace?: boolean;
  enableLineGlow?: boolean;
}

export const DEFAULT_PENDOLO_TUNING: PendoloTuning = {
  // Inset wheel so the lyric arc sits in the left-center third (not glued to the left edge).
  arcRadius: 0.40,
  arcAngleDeg: 100,
  wheelCenterX: 0.18,
  wheelCenterY: 0.50,
  tickSnappiness: 2.0,
  activeScale: 1.25,
  showGearDecor: 'subtle',
  showCenterGradient: true,
  showCoverOnWatchFace: false,
  enableLineGlow: false,
};

export type MonetBackgroundSource = 'cover-derived' | 'uploaded-global';
export type MonetBackgroundLayout = 'full-overlay' | 'half-pane-gradient';
export type MonetBackgroundWashColorMode = 'theme' | 'custom';
export type MonetAudioStyle = 'bar' | 'line';
export type MonetPortraitSource = 'cover' | 'custom';
export type VisualizerBackgroundMode = 'common' | 'interactive3d' | 'monet' | 'nomand' | 'url' | 'sora' | 'latent' | 'turntable';
export type {
    NomandBackgroundDitheringType,
    NomandBackgroundEffect,
    NomandBackgroundSource,
    NomandBackgroundTuning,
    NomandBuiltinEffect,
} from './types/nomandBackground';
export { DEFAULT_NOMAND_BACKGROUND_TUNING } from './types/nomandBackground';
export type LatentBackgroundDisplayMode = 'dithering' | 'mesh' | 'both';
export type LatentBackgroundColorSource = 'cover-theme' | 'cover-only';

export interface UrlBackgroundItem {
  id: string;
  url: string;
  note: string;
}

export interface LatentBackgroundTuning {
  displayMode: LatentBackgroundDisplayMode;
  colorSource: LatentBackgroundColorSource;
  dynamicOnlyInPlayer: boolean;
  enhancedBeatResponse: boolean;
  ditheringSpeed: number;
  ditheringAudioSpeed: number;
  ditheringSize: number;
  ditheringOpacity: number;
  meshSpeed: number;
  meshAudioSpeed: number;
  meshDistortion: number;
  meshSwirl: number;
  overlayEnabled: boolean;
  overlayOpacity: number;
}

export const DEFAULT_LATENT_BACKGROUND_TUNING: LatentBackgroundTuning = {
  displayMode: 'both',
  colorSource: 'cover-theme',
  dynamicOnlyInPlayer: true,
  enhancedBeatResponse: true,
  ditheringSpeed: 0.1,
  ditheringAudioSpeed: 1.2,
  ditheringSize: 2.5,
  ditheringOpacity: 0.55,
  meshSpeed: 0.3,
  meshAudioSpeed: 2,
  meshDistortion: 0.8,
  meshSwirl: 0.1,
  overlayEnabled: true,
  // Stronger default wash so lyrics stay readable on busy shader stacks.
  overlayOpacity: 0.48,
};

export interface MonetBackgroundTuning {
  backgroundSource: MonetBackgroundSource;
  backgroundLayout: MonetBackgroundLayout;
  backgroundBlurPx: number;
  backgroundOverlayOpacity: number;
  backgroundGrayscale: number;
  backgroundSaturation: number;
  backgroundWash: number;
  backgroundHalfPaneOffsetX: number;
  backgroundWashColorMode: MonetBackgroundWashColorMode;
  backgroundWashCustomColor: string;
  backgroundDriftEnabled?: boolean;
  backgroundDriftStrength?: number;
}

export interface MonetTuning {
  keywordColoringEnabled: boolean;
  showDescription: boolean;
  audioStyle: MonetAudioStyle;
  fontScale: number;
  portraitSource: MonetPortraitSource;
  portraitOffsetX?: number;
  portraitStyle?: 'square' | 'rectangular';
  showPortraitDragHanger?: boolean;
}

export type Interactive3dQualityTier = 'auto' | 'high' | 'balanced' | 'lite';

/** Mineradio 交互 3D 背景镜头模式。 */
export type Interactive3dCameraControlMode = 'auto' | 'orbit' | 'wasd' | 'gesture';

/** Interactive 3D visual preset ids (shipped + legacy ids kept for storage remap). */
export type MineradioVisualPresetId =
  | 'emily'
  | 'starfield'
  | 'nebula'
  | 'quantumCube'
  | 'aurora'
  | 'mineradioTunnel'
  | 'mineradioOrbit'
  | 'mineradioVoid'
  | 'mineradioVinyl'
  | 'mineradioGalaxy';

/** AI / theme bridge hints that can nudge interactive-3D atmosphere intensity only. */
export interface AtmosphereThemeHints {
  /** @deprecated 3D style is user-owned; ignored by atmosphere bridge. */
  visualPreset?: MineradioVisualPresetId;
  rhythmIntensity?: number;
  cinemaShake?: number;
  atmosphereSensitivity?: number;
  cameraPunchStrength?: number;
}

export interface DualTheme {
  light: Theme;
  dark: Theme;
  /** Optional local-atmosphere recommendations derived from or returned with AI themes. */
  atmosphereHints?: AtmosphereThemeHints;
}

export interface Interactive3dSceneTuning {
  qualityTier: Interactive3dQualityTier;
  visualPreset: MineradioVisualPresetId;
  /** Mineradio fx.intensity — overall rhythm response (0–1). */
  rhythmIntensity: number;
  /** Mineradio fx.cinemaShake — idle camera drift strength (0–1.8). */
  cinemaShake: number;
  /** Mineradio fx.bloomStrength when bloom layer is enabled (0–1.6). */
  bloomStrength: number;
  /** Scales beat / bass / energy response from the local atmosphere engine (0–1.5). */
  atmosphereSensitivity: number;
  /** Scales cameraPunch / cinematic punch from beat hits (0–1.5). */
  cameraPunchStrength: number;
  enableBackgroundWash: boolean;
  enableOrbitField: boolean;
  enableBassRipples: boolean;
  enableBeatBursts: boolean;
  enableLyricFocusAura: boolean;
  enableDomShapes: boolean;
  enableBloomParticles: boolean;
  enableFloatingParticles: boolean;
  /** Mineradio Three.js cover/skull particle WebGL layer. */
  enableCoverParticles: boolean;
  /** 3D 歌单架模式：关闭 / 侧栏 / 舞台。 */
  shelfMode: 'off' | 'sidebar' | 'stage';
  /** 歌单架显示策略：自动隐藏 / 常驻。 */
  shelfPresence: 'auto' | 'always';
  /** 歌单架镜头：动态跟随 / 静态绑定封面。 */
  shelfCameraMode: 'dynamic' | 'static';
  /** 3D 场景相机控制：自动 / 轨道拖拽 / WASD / 手势。 */
  cameraControl: Interactive3dCameraControlMode;
}

export const DEFAULT_INTERACTIVE3D_SCENE_TUNING: Interactive3dSceneTuning = {
  qualityTier: 'auto',
  visualPreset: 'emily',
  rhythmIntensity: 0.85,
  cinemaShake: 0.5,
  bloomStrength: 0.82,
  atmosphereSensitivity: 1,
  cameraPunchStrength: 1,
  shelfMode: 'off',
  shelfPresence: 'auto',
  shelfCameraMode: 'dynamic',
  enableBackgroundWash: true,
  enableOrbitField: true,
  enableBassRipples: true,
  enableBeatBursts: true,
  enableLyricFocusAura: true,
  enableDomShapes: false,
  enableBloomParticles: false,
  enableFloatingParticles: false,
  enableCoverParticles: true,
  cameraControl: 'auto',
};

export const DEFAULT_MONET_BACKGROUND_TUNING: MonetBackgroundTuning = {
  backgroundSource: 'cover-derived',
  backgroundLayout: 'full-overlay',
  backgroundBlurPx: 6,
  backgroundOverlayOpacity: 0.74,
  backgroundGrayscale: 0,
  backgroundSaturation: 1.05,
  backgroundWash: 0.34,
  backgroundHalfPaneOffsetX: 0,
  backgroundWashColorMode: 'theme',
  backgroundWashCustomColor: '#8fb7ff',
  backgroundDriftEnabled: true,
  backgroundDriftStrength: 0.55,
};

export const DEFAULT_MONET_TUNING: MonetTuning = {
  keywordColoringEnabled: true,
  showDescription: false,
  audioStyle: 'bar',
  fontScale: 1.32,
  portraitSource: 'cover',
  portraitOffsetX: 0,
  portraitStyle: 'square',
  showPortraitDragHanger: true,
};

export interface StoredCappellaEmojiImage {
  id: string;
  name: string;
  mimeType: string;
  blob: Blob;
}

export interface CappellaEmojiImage {
  id: string;
  name: string;
  url: string;
}

export interface StoredCappellaAvatarImage {
  id: string;
  name: string;
  mimeType: string;
  blob: Blob;
}

export interface CappellaAvatarImage {
  id: string;
  name: string;
  url: string;
}

export interface StoredMonetBackgroundImage {
  id: string;
  name: string;
  mimeType: string;
  blob: Blob;
}

export interface MonetBackgroundImage {
  id: string;
  name: string;
  url: string;
}

export interface StoredMonetPortraitImage {
  id: string;
  name: string;
  mimeType: string;
  blob: Blob;
}

export interface MonetPortraitImage {
  id: string;
  name: string;
  url: string;
}

export enum PlayerState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

export interface StatusMessage {
  type: 'error' | 'success' | 'info';
  text: string;
  nonce?: number;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  persistent?: boolean;
}

// Netease / Search API Types

export interface NeteaseUser {
  userId: number;
  nickname: string;
  avatarUrl: string;
  backgroundUrl?: string;
  vipType?: number;
}

export interface NeteasePlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  playCount: number;
  updateTime: number;
  trackUpdateTime: number;
  creator: NeteaseUser;
  description?: string;
  specialType?: 'cloud' | 'provider-default';
  musicProvider?: OnlineMusicProviderId;
  providerPlaylistId?: string;
}

export interface Artist {
  id: number;
  name: string;
}

export interface Album {
  id: number;
  name: string;
  picUrl?: string;
}

export interface SongPrivilege {
  id?: number;
  fee?: number;
  payed?: number;
  st?: number;
  pl?: number;
  dl?: number;
  flag?: number;
  cs?: boolean;
}

export interface NoCopyrightRecommendation {
  type?: number;
  typeDesc?: string;
  songId?: string | number;
  thirdPartySong?: unknown | null;
  expInfo?: unknown | null;
}

export type LyricProviderSource = 'netease' | 'qq' | 'kugou' | 'amll' | 'lrclib';
export type AmllDbPlatform = 'ncm' | 'qq';

export interface SongResult {
  id: number;
  name: string;
  artists: Artist[];
  album: Album;
  duration: number; // milliseconds usually from API
  musicProvider?: OnlineMusicProviderId;
  providerSongId?: string;
  isPureMusic?: boolean;
  t?: 0 | 1 | 2;
  sourceType?: 'netease' | 'cloud';
  /** Catalog content kind; podcast episodes use mainSong id for playback. */
  contentType?: 'music' | 'podcast' | 'audiobook';
  /** Direct playable URL for RSS/enclosure podcasts; skips provider URL lookup. */
  audioUrl?: string;
  /** RSS shownotes HTML/text used as caption lyrics when no transcript exists. */
  podcastDescription?: string;
  /** Podcasting 2.0 transcript URL (VTT / SRT / JSON). */
  podcastTranscriptUrl?: string;
  programId?: number;
  radioId?: number;
  radioName?: string;
  serialNum?: number;
  // Netease API raw fields
  al?: {
    id: number;
    name: string;
    picUrl?: string;
  };
  ar?: Artist[];
  dt?: number; // duration in ms
  alia?: string[]; // 别名
  tns?: string[]; // 翻译名
  fee?: number;
  noCopyrightRcmd?: NoCopyrightRecommendation | null;
  resourceState?: boolean;
  privilege?: SongPrivilege;
  onlineLyricsState?: OnlineLyricsState;
  matchedLyricsSource?: LyricProviderSource;
  matchedLyricsProviderPlatform?: AmllDbPlatform;
  qqMid?: string;
  qqMediaMid?: string;
  /** Upstream catalog id used by free aggregators such as Coco. */
  providerCatalogSource?: string;
  kgHash?: string;
  amllDbPlatform?: AmllDbPlatform;
}

export interface OnlineLyricsState {
  lyricsSource: 'online' | 'imported';
  importedLyrics?: LyricData | null;
  importedLyricsName?: string | null;
  hasOnlineOverride?: boolean;
  onlineOverrideLyrics?: LyricData | null;
  matchedSongId?: number;
  matchedIsPureMusic?: boolean;
  matchedLyricsSource?: LyricProviderSource;
  matchedLyricsProviderPlatform?: AmllDbPlatform;
}

export interface SearchResponse {
  result?: {
    songs?: SongResult[];
    songCount?: number;
  };
  code: number;
}

// Local Music Types

export interface LocalSong {
  id: string; // UUID for local file
  fileName: string;
  filePath: string; // File path for reference
  fileHandle?: FileSystemFileHandle; // For re-accessing the file (not persisted, stored in memory)
  duration: number; // milliseconds
  fileSize: number; // bytes
  fileLastModified?: number; // milliseconds since epoch
  fileSignature?: string; // Lightweight file identity for incremental scans
  mimeType: string;
  bitrate?: number; // bps
  addedAt: number; // timestamp

  // Extracted metadata from file tags
  title?: string;
  artist?: string;
  album?: string;
  trackNumber?: number;
  discNumber?: number;

  // Embedded metadata from file tags
  embeddedTitle?: string;
  embeddedArtist?: string;
  embeddedAlbum?: string;
  embeddedCover?: Blob; // Preferred local cover blob (folder cover or embedded art), stored in IndexedDB
  replayGain?: number; // ReplayGain track gain in dB
  replayGainTrackGain?: number; // ReplayGain track gain in dB
  replayGainTrackPeak?: number; // ReplayGain track peak ratio
  replayGainAlbumGain?: number; // ReplayGain album gain in dB
  replayGainAlbumPeak?: number; // ReplayGain album peak ratio

  // Lyrics matching result
  matchedSongId?: number; // Netease song ID
  matchedArtists?: string; // Matched artist names (joined string)
  matchedAlbumId?: number; // Netease album ID
  matchedAlbumName?: string; // Netease album name
  matchedLyrics?: LyricData;
  matchedIsPureMusic?: boolean;
  matchedCoverUrl?: string; // Cover image URL from matched song
  hasManualLyricSelection?: boolean;
  folderName?: string; // Name of the folder if imported via folder import
  noAutoMatch?: boolean; // If true, do not attempt to auto-match metadata
  matchedLyricsSource?: LyricProviderSource;
  matchedLyricsProviderPlatform?: AmllDbPlatform;

  // User preferences for online data override (set via LyricMatchModal)
  lyricsSource?: 'local' | 'embedded' | 'online';  // Explicit lyrics source selection; undefined = default priority (local > embedded > online)
  useOnlineCover?: boolean;     // Prefer online cover over embedded cover
  useOnlineMetadata?: boolean;  // Prefer online artist/album over embedded tags

  // Local Lyrics (.lrc / .vtt / .ttml / .qrc / .yrc / .krc files)
  hasLocalLyrics?: boolean;
  localLyricsContent?: string;
  localLyricsFormat?: 'vtt' | 'ttml' | 'yrc' | 'qrc' | 'krc';
  hasLocalTranslationLyrics?: boolean;
  localTranslationLyricsContent?: string;

  // Embedded Lyrics (from file tags: ID3 USLT, Vorbis LYRICS, etc.)
  hasEmbeddedLyrics?: boolean;
  embeddedLyricsContent?: string;
  hasEmbeddedTranslationLyrics?: boolean;
  embeddedTranslationLyricsContent?: string;
}

export interface LocalLibrarySnapshotFile {
  name: string;
  relativePath: string;
  kind: 'audio' | 'lyric' | 'translationLyric' | 'cover' | 'other';
  size: number;
  lastModified: number;
  signature: string;
}

export interface LocalLibrarySnapshotNode {
  name: string;
  relativePath: string;
  hash: string;
  files: LocalLibrarySnapshotFile[];
  children: LocalLibrarySnapshotNode[];
}

export interface LocalLibrarySnapshot {
  rootFolderName: string;
  scannedAt: number;
  tree: LocalLibrarySnapshotNode;
}

export interface LocalPlaylist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
}

export type LocalLibraryGroupType = 'folder' | 'album' | 'artist' | 'playlist';

export interface LocalLibraryGroup {
  type: LocalLibraryGroupType;
  name: string;
  songs: LocalSong[];
  coverUrl?: string | Blob;
  id: string;
  isVirtual?: boolean;
  trackCount?: number;
  description?: string;
  albumId?: number;
  playlistId?: string;
}

// Extend SongResult to support local files, Navidrome, and YouTube Music carriers
export interface UnifiedSong extends SongResult {
  isLocal?: boolean;
  localData?: LocalSong;
  isNavidrome?: boolean;
  navidromeData?: any;
  isYtm?: boolean;
  ytmData?: import('./types/ytmusic').YtmTrackData;
}

export type ReplayGainMode = 'off' | 'track' | 'album';

// Audio Analysis Types
import { MotionValue } from 'framer-motion';

export interface AudioBands {
    bass: MotionValue<number>;    // 20-150Hz (Circles)
    lowMid: MotionValue<number>;  // 150-400Hz (Squares)
    mid: MotionValue<number>;     // 400-1200Hz (Triangles)
    vocal: MotionValue<number>;   // 1000-3500Hz (Icons)
    treble: MotionValue<number>;  // 3500Hz+ (Crosses)
    spectrum?: MotionValue<Uint8Array>; // Raw analyser FFT magnitude bins for full-spectrum visualizers
  }
