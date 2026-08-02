import React, { useMemo } from 'react';
import { CaptionsOff, Languages, Monitor, PanelTop, RotateCcw, type LucideIcon } from 'lucide-react';
import {
    DEFAULT_LATENT_BACKGROUND_TUNING,
    DEFAULT_MONET_BACKGROUND_TUNING,
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
    type CappellaAvatarImage,
    type CappellaEmojiImage,
    type CappellaTuning,
    type ClassicTuning,
    type CladdaghTuning,
    type FumeTuning,
    type Interactive3dSceneTuning,
    type LatentBackgroundTuning,
    type MonetBackgroundImage,
    type MonetBackgroundTuning,
    type MonetPortraitImage,
    type MonetTuning,
    type PartitaTuning,
    type Theme,
    type TiltTuning,
    type UrlBackgroundItem,
    type VisualizerBackgroundMode,
    type VisualizerMode,
} from '../../types';
import { colorWithAlpha } from './colorMix';
import { MonetBackgroundSettingsCard } from './MonetBackgroundSettingsCard';
import { Interactive3dBackgroundSettingsCard } from './backgrounds/Interactive3dBackgroundSettingsCard';
import LatentBackgroundSettingsCard from './backgrounds/latent/LatentBackgroundSettingsCard';
import { UrlBackgroundSettingsCard } from './backgrounds/UrlBackgroundSettingsCard';
import { VISUALIZER_REGISTRY, getVisualizerModeLabel, type VisualizerRegistryEntry } from './registry';
import { type VisPlaygroundEditSection } from './VisPlaygroundPreviewHotspots';

// src/components/visualizer/VisPlaygroundSettingsPanel.tsx
// Right-side settings panel for the click-to-edit visualizer playground.
interface PresetOption<T> {
    label: string;
    value: T;
}

interface PresetGroupProps<T> {
    label: string;
    value: T;
    options: PresetOption<T>[];
    onChange: (next: T) => void;
    isDaylight: boolean;
    theme: Theme;
    isOptionActive?: (option: PresetOption<T>) => boolean;
}

interface ToggleRowProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange?: (checked: boolean) => void;
    theme: Theme;
    icon?: LucideIcon;
}

interface VisPlaygroundSettingsPanelProps {
    activeSection: VisPlaygroundEditSection;
    onSectionChange: (section: VisPlaygroundEditSection) => void;
    t: (key: string) => string;
    isDaylight: boolean;
    theme: Theme;
    visualizerMode: VisualizerMode;
    visualizerEntry: VisualizerRegistryEntry | null;
    onVisualizerModeChange?: (mode: VisualizerMode) => void;
    onResetVisualizerTuning?: () => void;
    controlCardBg: string;
    rangeInputClass: string;
    backgroundOpacity: number;
    onBackgroundOpacityChange?: (opacity: number) => void;
    visualizerOpacity: number;
    onVisualizerOpacityChange?: (opacity: number) => void;
    useCoverColorBg: boolean;
    onToggleCoverColorBg?: (enabled: boolean) => void;
    disableVisualizerVignette: boolean;
    onToggleDisableVisualizerVignette?: (disabled: boolean) => void;
    enableSmartAtmosphere: boolean;
    onToggleEnableSmartAtmosphere?: (enabled: boolean) => void;
    enable3dInteractiveBackground: boolean;
    onToggleEnable3dInteractiveBackground?: (enabled: boolean) => void;
    visualizerBackgroundMode?: VisualizerBackgroundMode | null;
    onVisualizerBackgroundModeChange?: (mode: VisualizerBackgroundMode) => void;
    onResetBackgroundSettings?: () => void;
    fontStyleValue: Theme['fontStyle'] | 'custom';
    fontStyleOptions: PresetOption<Theme['fontStyle'] | 'custom'>[];
    onFontStyleChange: (fontStyle: Theme['fontStyle'] | 'custom') => void;
    fontScale: number;
    fontScaleOptions: PresetOption<number>[];
    onFontScaleChange: (fontScale: number) => void;
    onResetCommonSettings?: () => void;
    classicTuning: ClassicTuning;
    onClassicTuningChange?: (patch: Partial<ClassicTuning>) => void;
    partitaTuning: PartitaTuning;
    onPartitaTuningChange?: (patch: Partial<PartitaTuning>) => void;
    fumeTuning: FumeTuning;
    onFumeTuningChange?: (patch: Partial<FumeTuning>) => void;
    claddaghTuning: CladdaghTuning;
    onCladdaghTuningChange?: (patch: Partial<CladdaghTuning>) => void;
    cappellaTuning: CappellaTuning;
    cappellaCustomEmojiImages: CappellaEmojiImage[];
    onCappellaTuningChange?: (patch: Partial<CappellaTuning>) => void;
    isLoadingCappellaCustomEmojiPack: boolean;
    onImportCappellaCustomEmojiPack?: (files: File[]) => Promise<{ ok: boolean; error?: string; }>;
    onClearCappellaCustomEmojiPack?: () => Promise<void> | void;
    cappellaCustomAvatarImages?: CappellaAvatarImage[];
    onImportCappellaCustomAvatar?: (files: File[]) => Promise<{ ok: boolean; error?: string; }>;
    onClearCappellaCustomAvatar?: () => Promise<void> | void;
    isLoadingCappellaCustomAvatarPack?: boolean;
    tiltTuning: TiltTuning;
    pendoloTuning: import('../../types').PendoloTuning;
    onTiltTuningChange?: (patch: Partial<TiltTuning>) => void;
    onPendoloTuningChange?: (patch: Partial<import('../../types').PendoloTuning>) => void;
    monetBackgroundTuning?: MonetBackgroundTuning;
    onMonetBackgroundTuningChange?: (patch: Partial<MonetBackgroundTuning>) => void;
    latentBackgroundTuning?: LatentBackgroundTuning;
    onLatentBackgroundTuningChange?: (patch: Partial<LatentBackgroundTuning>) => void;
    interactive3dSceneTuning?: Interactive3dSceneTuning;
    onInteractive3dSceneTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
    onResetInteractive3dSceneTuning?: () => void;
    monetTuning: MonetTuning;
    onMonetTuningChange?: (patch: Partial<MonetTuning>) => void;
    onResetMonetTuning?: () => void;
    monetBackgroundImage?: MonetBackgroundImage | null;
    onUploadMonetBackgroundImage?: (files: File[]) => Promise<{ ok: boolean; error?: string; }>;
    onClearMonetBackgroundImage?: () => Promise<void> | void;
    isLoadingMonetBackgroundImage?: boolean;
    monetPortraitImage?: MonetPortraitImage | null;
    onUploadMonetPortraitImage?: (files: File[]) => Promise<{ ok: boolean; error?: string; }>;
    onClearMonetPortraitImage?: () => Promise<void> | void;
    isLoadingMonetPortraitImage?: boolean;
    urlBackgroundList?: UrlBackgroundItem[];
    urlBackgroundSelectedId?: string | null;
    onAddUrlBackgroundItem?: (item: UrlBackgroundItem) => void;
    onUpdateUrlBackgroundItem?: (id: string, patch: Partial<Omit<UrlBackgroundItem, 'id'>>) => void;
    onDeleteUrlBackgroundItem?: (id: string) => void;
    onSetUrlBackgroundSelectedId?: (id: string | null) => void;
    hideTranslationSubtitle: boolean;
    onToggleHideTranslationSubtitle?: (hidden: boolean) => void;
    showSubtitleTranslation: boolean;
    onToggleShowSubtitleTranslation?: (shown: boolean) => void;
    subtitleContentMode: import('../../types').SubtitleContentMode;
    onSubtitleContentModeChange?: (mode: import('../../types').SubtitleContentMode) => void;
    showHarmonySubtitle: boolean;
    onToggleShowHarmonySubtitle?: (enabled: boolean) => void;
    harmonySubtitleBackground: boolean;
    onToggleHarmonySubtitleBackground?: (enabled: boolean) => void;
    subtitleOverlayBackground: boolean;
    onToggleSubtitleOverlayBackground?: (enabled: boolean) => void;
    subtitleFontInheritsLyrics: boolean;
    onSubtitleFontInheritsLyricsChange?: (inherits: boolean) => void;
    subtitleFontStyle: Theme['fontStyle'];
    onSubtitleFontStyleChange?: (fontStyle: Theme['fontStyle']) => void;
    subtitleOverlayOpacity: number;
    onSubtitleOverlayOpacityChange?: (opacity: number) => void;
    onResetSubtitleSettings?: () => void;
    onSliderPointerDown?: () => void;
    onSliderCommit?: () => void;
}

const SECTION_OPTIONS: VisPlaygroundEditSection[] = ['common', 'background', 'visualizer', 'subtitle'];

const getSectionLabel = (section: VisPlaygroundEditSection, t: (key: string) => string) => {
    if (section === 'common') return t('options.previewCommonSettings') || '通用';
    if (section === 'background') return t('options.previewBackgroundSettings') || '背景';
    if (section === 'subtitle') return t('options.previewSubtitleSettings') || '字幕';
    return t('options.previewVisualizerSettings') || '歌词动画';
};

const getAccentOptionStyle = (selected: boolean, theme: Theme, isDaylight: boolean): React.CSSProperties => (
    selected
        ? {
            borderColor: theme.accentColor,
            boxShadow: `inset 0 0 0 1px ${theme.accentColor}`,
            backgroundColor: colorWithAlpha(theme.accentColor, isDaylight ? 0.1 : 0.16),
        }
        : {
            borderColor: colorWithAlpha(theme.secondaryColor, isDaylight ? 0.18 : 0.16),
            backgroundColor: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.24 : 0.34),
        }
);

const PresetGroup = <T,>({
    label,
    value,
    options,
    onChange,
    isDaylight,
    theme,
    isOptionActive,
}: PresetGroupProps<T>) => (
    <div className="space-y-2.5">
        <div className="text-xs font-medium uppercase tracking-[0.24em] opacity-60" style={{ color: theme.secondaryColor }}>
            {label}
        </div>
        <div className="flex flex-wrap gap-2">
            {options.map(option => {
                const isActive = isOptionActive ? isOptionActive(option) : option.value === value;

                return (
                    <button
                        key={String(option.value)}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className="px-3 py-2 rounded-full text-sm transition-all border"
                        style={{
                            ...getAccentOptionStyle(isActive, theme, isDaylight),
                            color: theme.primaryColor,
                        }}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    </div>
);

const ToggleRow: React.FC<ToggleRowProps> = ({
    label,
    description,
    checked,
    onChange,
    theme,
    icon: Icon = Monitor,
}) => (
    <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
            <div className="text-sm font-medium flex items-center gap-2" style={{ color: theme.primaryColor }}>
                <Icon size={14} />
                {label}
            </div>
            {description && (
                <div className="text-xs opacity-70 max-w-[320px]" style={{ color: theme.secondaryColor }}>
                    {description}
                </div>
            )}
        </div>
        <button
            type="button"
            aria-pressed={checked}
            onClick={() => onChange?.(!checked)}
            className="w-12 h-6 rounded-full p-1 transition-colors shrink-0 disabled:opacity-45"
            disabled={!onChange}
            style={{
                backgroundColor: checked ? theme.secondaryColor : colorWithAlpha(theme.secondaryColor, 0.18),
            }}
        >
            <div
                className={`w-4 h-4 rounded-full shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}
                style={{ backgroundColor: theme.backgroundColor }}
            />
        </button>
    </div>
);

const ResetSectionButton: React.FC<{
    label: string;
    onClick?: () => void;
    theme: Theme;
}> = ({ label, onClick, theme }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-45"
        style={{
            color: theme.secondaryColor,
            borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
            backgroundColor: colorWithAlpha(theme.backgroundColor, 0.22),
        }}
    >
        <RotateCcw size={12} />
        {label}
    </button>
);

const SectionTabs: React.FC<Pick<VisPlaygroundSettingsPanelProps, 'activeSection' | 'onSectionChange' | 't' | 'theme' | 'isDaylight'>> = ({
    activeSection,
    onSectionChange,
    t,
    theme,
    isDaylight,
}) => (
    <div className="inline-flex w-fit items-center gap-1 rounded-full p-1" style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.34 : 0.52) }}>
        {SECTION_OPTIONS.map(section => {
            const active = activeSection === section;
            return (
                <button
                    key={section}
                    type="button"
                    onClick={() => onSectionChange(section)}
                    className="rounded-full border px-3 py-1.5 text-sm transition-all"
                    style={{
                        ...getAccentOptionStyle(active, theme, isDaylight),
                        color: active ? theme.primaryColor : theme.secondaryColor,
                    }}
                >
                    {getSectionLabel(section, t)}
                </button>
            );
        })}
    </div>
);

const VisPlaygroundSettingsPanel: React.FC<VisPlaygroundSettingsPanelProps> = (props) => {
    const {
        activeSection,
        onSectionChange,
        t,
        isDaylight,
        theme,
        visualizerMode,
        visualizerEntry,
        onVisualizerModeChange,
        onResetVisualizerTuning,
        controlCardBg,
        rangeInputClass,
        backgroundOpacity,
        onBackgroundOpacityChange,
        visualizerOpacity,
        onVisualizerOpacityChange,
        useCoverColorBg,
        onToggleCoverColorBg,
        disableVisualizerVignette,
        onToggleDisableVisualizerVignette,
        enableSmartAtmosphere,
        onToggleEnableSmartAtmosphere,
        enable3dInteractiveBackground,
        onToggleEnable3dInteractiveBackground,
        visualizerBackgroundMode,
        onVisualizerBackgroundModeChange,
        onResetBackgroundSettings,
        fontStyleValue,
        fontStyleOptions,
        onFontStyleChange,
        fontScale,
        fontScaleOptions,
        onFontScaleChange,
        onResetCommonSettings,
        classicTuning,
        onClassicTuningChange,
        partitaTuning,
        onPartitaTuningChange,
        fumeTuning,
        onFumeTuningChange,
        claddaghTuning,
        onCladdaghTuningChange,
        cappellaTuning,
        cappellaCustomEmojiImages,
        onCappellaTuningChange,
        isLoadingCappellaCustomEmojiPack,
        onImportCappellaCustomEmojiPack,
        onClearCappellaCustomEmojiPack,
        cappellaCustomAvatarImages = [],
        onImportCappellaCustomAvatar,
        onClearCappellaCustomAvatar,
        isLoadingCappellaCustomAvatarPack = false,
        tiltTuning,
        onTiltTuningChange,
        pendoloTuning,
        onPendoloTuningChange,
        monetBackgroundTuning = DEFAULT_MONET_BACKGROUND_TUNING,
        onMonetBackgroundTuningChange,
        latentBackgroundTuning = DEFAULT_LATENT_BACKGROUND_TUNING,
        onLatentBackgroundTuningChange,
        interactive3dSceneTuning = DEFAULT_INTERACTIVE3D_SCENE_TUNING,
        onInteractive3dSceneTuningChange,
        onResetInteractive3dSceneTuning,
        monetTuning,
        onMonetTuningChange,
        monetBackgroundImage,
        onUploadMonetBackgroundImage,
        onClearMonetBackgroundImage,
        isLoadingMonetBackgroundImage,
        monetPortraitImage,
        onUploadMonetPortraitImage,
        onClearMonetPortraitImage,
        isLoadingMonetPortraitImage,
        urlBackgroundList = [],
        urlBackgroundSelectedId = null,
        onAddUrlBackgroundItem,
        onUpdateUrlBackgroundItem,
        onDeleteUrlBackgroundItem,
        onSetUrlBackgroundSelectedId,
        hideTranslationSubtitle,
        onToggleHideTranslationSubtitle,
        showSubtitleTranslation,
        onToggleShowSubtitleTranslation,
        subtitleContentMode,
        onSubtitleContentModeChange,
        showHarmonySubtitle,
        onToggleShowHarmonySubtitle,
        harmonySubtitleBackground,
        onToggleHarmonySubtitleBackground,
        subtitleOverlayBackground,
        onToggleSubtitleOverlayBackground,
        subtitleFontInheritsLyrics,
        onSubtitleFontInheritsLyricsChange,
        subtitleFontStyle,
        onSubtitleFontStyleChange,
        subtitleOverlayOpacity,
        onSubtitleOverlayOpacityChange,
        onResetSubtitleSettings,
        onSliderPointerDown,
        onSliderCommit,
    } = props;

    const modeOptions = useMemo(() => (
        VISUALIZER_REGISTRY.map(entry => ({
            label: getVisualizerModeLabel(entry.mode, t),
            value: entry.mode,
        }))
    ), [t]);
    const resolvedBackgroundMode: VisualizerBackgroundMode = visualizerBackgroundMode ?? 'interactive3d';
    const backgroundModeOptions = useMemo<PresetOption<VisualizerBackgroundMode>[]>(() => ([
        { value: 'common', label: t('options.visualizerBackgroundModeCommon') || '通用' },
        { value: 'interactive3d', label: t('options.visualizerBackgroundModeInteractive3d') || '3D 交互' },
        { value: 'monet', label: t('options.visualizerBackgroundModeMonet') || '莫奈' },
        { value: 'latent', label: t('options.visualizerBackgroundModeLatent') || 'Latent' },
        { value: 'url', label: t('options.visualizerBackgroundModeUrl') || 'URL' },
        { value: 'sora', label: t('options.visualizerBackgroundModeSora') || '空' },
        { value: 'turntable', label: t('options.visualizerBackgroundModeTurntable') || '唱盘' },
    ]), [t]);
    const subtitleFontStyleOptions = useMemo<PresetOption<Theme['fontStyle']>[]>(() => ([
        { value: 'sans', label: t('options.fontSans') || 'Sans' },
        { value: 'serif', label: t('options.fontSerif') || 'Serif' },
        { value: 'mono', label: t('options.fontMono') || 'Mono' },
    ]), [t]);

    return (
        <div className="min-h-0 flex flex-col gap-4">
            <SectionTabs
                activeSection={activeSection}
                onSectionChange={onSectionChange}
                t={t}
                theme={theme}
                isDaylight={isDaylight}
            />

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                {activeSection === 'common' && (
                    <div className="rounded-[24px] border p-4 space-y-4" style={{ backgroundColor: controlCardBg, borderColor: colorWithAlpha(theme.secondaryColor, 0.16) }}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                                    {t('options.previewCommonSettings') || '通用设置'}
                                </div>
                                <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
                                    {t('options.previewCommonSettingsDesc') || '统一调整字体、字号等全局设置。'}
                                </div>
                            </div>
                            <ResetSectionButton
                                label={t('ui.default') || '默认'}
                                onClick={onResetCommonSettings}
                                theme={theme}
                            />
                        </div>

                        <PresetGroup
                            label={t('options.fontFamily') || '字体'}
                            value={fontStyleValue}
                            options={fontStyleOptions}
                            onChange={onFontStyleChange}
                            isDaylight={isDaylight}
                            theme={theme}
                            isOptionActive={(option) => option.value === fontStyleValue}
                        />

                        <PresetGroup
                            label={t('options.fontSize') || '字号'}
                            value={fontScale}
                            options={fontScaleOptions}
                            onChange={onFontScaleChange}
                            isDaylight={isDaylight}
                            theme={theme}
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm" style={{ color: theme.primaryColor }}>
                                <span>{t('options.fontSize') || '字号'}</span>
                                <span className="font-mono opacity-70" style={{ color: theme.secondaryColor }}>
                                    {Math.round(fontScale * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.85"
                                max="1.4"
                                step="0.05"
                                value={fontScale}
                                onChange={(event) => onFontScaleChange(parseFloat(event.target.value))}
                                onPointerDown={onSliderPointerDown}
                                onPointerUp={onSliderCommit}
                                className={rangeInputClass}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm" style={{ color: theme.primaryColor }}>
                                <span>{t('options.visualizerOpacity') || '整体透明度'}</span>
                                <span className="font-mono opacity-70" style={{ color: theme.secondaryColor }}>
                                    {Math.round(visualizerOpacity * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.2"
                                max="1"
                                step="0.05"
                                value={visualizerOpacity}
                                onChange={(event) => onVisualizerOpacityChange?.(parseFloat(event.target.value))}
                                onPointerDown={onSliderPointerDown}
                                onPointerUp={onSliderCommit}
                                className={rangeInputClass}
                            />
                        </div>
                    </div>
                )}

                {activeSection === 'background' && (
                    <>
                        <div className="rounded-[24px] border p-4 space-y-4" style={{ backgroundColor: controlCardBg, borderColor: colorWithAlpha(theme.secondaryColor, 0.16) }}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                                        {t('options.previewBackgroundSettings') || '背景设置'}
                                    </div>
                                    <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
                                        {t('options.previewBackgroundSettingsDesc') || '调整播放页背景层、透明窗口和几何氛围。'}
                                    </div>
                                </div>
                                <ResetSectionButton
                                    label={t('ui.default') || '默认'}
                                    onClick={onResetBackgroundSettings}
                                    theme={theme}
                                />
                            </div>

                            <PresetGroup
                                label={t('options.visualizerBackgroundMode') || '背景类型'}
                                value={resolvedBackgroundMode}
                                options={backgroundModeOptions}
                                onChange={(mode) => onVisualizerBackgroundModeChange?.(mode)}
                                isDaylight={isDaylight}
                                theme={theme}
                            />
                        </div>

                        {resolvedBackgroundMode === 'common' ? (
                            <>
                                <div className="rounded-[24px] border p-4 space-y-4" style={{ backgroundColor: controlCardBg, borderColor: colorWithAlpha(theme.secondaryColor, 0.16) }}>
                                    <ToggleRow
                                        label={t('options.enableSmartAtmosphere') || '智能氛围'}
                                        description={t('options.enableSmartAtmosphereDesc') || '让背景和歌词跟着音乐律动。'}
                                        checked={enableSmartAtmosphere}
                                        onChange={onToggleEnableSmartAtmosphere}
                                        theme={theme}
                                    />
                                </div>

                                <div className="rounded-[24px] border p-4 space-y-4" style={{ backgroundColor: controlCardBg, borderColor: colorWithAlpha(theme.secondaryColor, 0.16) }}>
                                    <div className="space-y-2">
                                            <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                                                {t('options.previewCoverBackgroundSettings') || '封面背景'}
                                            </div>
                                            <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
                                                {t('options.previewCoverBackgroundSettingsDesc') || '将歌曲封面色彩叠加到背景中'}
                                            </div>

                                        <ToggleRow
                                            label={t('theme.addCoverColor') || '添加封面色彩'}
                                            description={t('options.coverColorBackgroundDesc') || '使用当前歌曲封面生成背景色彩。'}
                                            checked={useCoverColorBg}
                                            onChange={onToggleCoverColorBg}
                                            theme={theme}
                                        />

                                        <div className="flex items-center justify-between text-sm" style={{ color: theme.primaryColor }}>
                                            <span>{t('options.previewCoverBackgroundOpacity') || '叠层透明度'}</span>
                                            <span className="font-mono opacity-70" style={{ color: theme.secondaryColor }}>
                                                {Math.round(backgroundOpacity * 100)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={backgroundOpacity}
                                            onChange={(event) => onBackgroundOpacityChange?.(parseFloat(event.target.value))}
                                            onPointerDown={onSliderPointerDown}
                                            onPointerUp={onSliderCommit}
                                            className={rangeInputClass}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : resolvedBackgroundMode === 'interactive3d' ? (
                            <Interactive3dBackgroundSettingsCard
                                t={t}
                                theme={theme}
                                controlCardBg={controlCardBg}
                                isDaylight={isDaylight}
                                tuning={interactive3dSceneTuning}
                                onTuningChange={onInteractive3dSceneTuningChange}
                                onResetTuning={onResetInteractive3dSceneTuning}
                                enableSmartAtmosphere={enableSmartAtmosphere}
                                onToggleEnableSmartAtmosphere={onToggleEnableSmartAtmosphere}
                                disableVisualizerVignette={disableVisualizerVignette}
                                onToggleDisableVisualizerVignette={onToggleDisableVisualizerVignette}
                            />
                        ) : resolvedBackgroundMode === 'url' ? (
                            <UrlBackgroundSettingsCard
                                t={t}
                                isDaylight={isDaylight}
                                theme={theme}
                                controlCardBg={controlCardBg}
                                urlBackgroundList={urlBackgroundList}
                                urlBackgroundSelectedId={urlBackgroundSelectedId}
                                onAddUrlBackgroundItem={onAddUrlBackgroundItem}
                                onUpdateUrlBackgroundItem={onUpdateUrlBackgroundItem}
                                onDeleteUrlBackgroundItem={onDeleteUrlBackgroundItem}
                                onSetUrlBackgroundSelectedId={onSetUrlBackgroundSelectedId}
                            />
                        ) : resolvedBackgroundMode === 'monet' ? (
                            <MonetBackgroundSettingsCard
                                t={t}
                                isDaylight={isDaylight}
                                theme={theme}
                                controlCardBg={controlCardBg}
                                rangeInputClass={rangeInputClass}
                                tuning={monetBackgroundTuning}
                                onTuningChange={onMonetBackgroundTuningChange}
                                monetBackgroundImage={monetBackgroundImage}
                                onUploadMonetBackgroundImage={onUploadMonetBackgroundImage}
                                onClearMonetBackgroundImage={onClearMonetBackgroundImage}
                                isLoadingMonetBackgroundImage={isLoadingMonetBackgroundImage}
                                onSliderPointerDown={onSliderPointerDown}
                                onSliderCommit={onSliderCommit}
                                />
                        ) : resolvedBackgroundMode === 'latent' ? (
                            <LatentBackgroundSettingsCard
                                t={t}
                                isDaylight={isDaylight}
                                theme={theme}
                                controlCardBg={controlCardBg}
                                rangeInputClass={rangeInputClass}
                                tuning={latentBackgroundTuning}
                                onTuningChange={onLatentBackgroundTuningChange}
                                onSliderPointerDown={onSliderPointerDown}
                                onSliderCommit={onSliderCommit}
                            />
                        ) : null}
                    </>
                )}

                {activeSection === 'visualizer' && (
                    <>
                        <div className="rounded-[24px] border p-4 space-y-4" style={{ backgroundColor: controlCardBg, borderColor: colorWithAlpha(theme.secondaryColor, 0.16) }}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                                        {t('options.lyricsRenderer') || '歌词动画'}
                                    </div>
                                    <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
                                        {t('options.lyricsRendererDesc') || '选择播放页使用的歌词渲染模式。'}
                                    </div>
                                </div>
                                <ResetSectionButton
                                    label={t('ui.default') || '默认'}
                                    onClick={visualizerEntry?.resetSettings ? onResetVisualizerTuning : undefined}
                                    theme={theme}
                                />
                            </div>

                            <PresetGroup
                                label={t('options.visualizerMode') || '动画预设'}
                                value={visualizerMode}
                                options={modeOptions}
                                onChange={(mode) => onVisualizerModeChange?.(mode)}
                                isDaylight={isDaylight}
                                theme={theme}
                            />
                        </div>

                        {visualizerEntry?.renderSettingsPanel?.({
                            t,
                            isDaylight,
                            theme,
                            controlCardBg,
                            rangeInputClass,
                            classicTuning,
                            onClassicTuningChange,
                            partitaTuning,
                            onPartitaTuningChange,
                            fumeTuning,
                            onFumeTuningChange,
                            claddaghTuning,
                            onCladdaghTuningChange,
                            cappellaTuning,
                            cappellaCustomEmojiImages,
                            onCappellaTuningChange,
                            cappellaCustomEmojiCount: cappellaCustomEmojiImages.length,
                            hasCappellaCustomEmojiPack: cappellaCustomEmojiImages.length > 0,
                            isCappellaCustomEmojiPackLoading: isLoadingCappellaCustomEmojiPack,
                            onImportCappellaCustomEmojiPack,
                            onClearCappellaCustomEmojiPack,
                            cappellaCustomAvatarImages,
                            onImportCappellaCustomAvatar,
                            onClearCappellaCustomAvatar,
                            hasCappellaCustomAvatar: cappellaCustomAvatarImages.length > 0,
                            isCappellaCustomAvatarLoading: isLoadingCappellaCustomAvatarPack,
                            tiltTuning,
                            onTiltTuningChange,
                            pendoloTuning,
                            onPendoloTuningChange,
                            monetTuning,
                            onMonetTuningChange,
                            monetPortraitImage,
                            onUploadMonetPortraitImage,
                            onClearMonetPortraitImage,
                            isLoadingMonetPortraitImage,
                            onSliderPointerDown,
                            onSliderCommit,
                        })}
                    </>
                )}

                {activeSection === 'subtitle' && (
                    <div className="rounded-[24px] border p-4 space-y-4" style={{ backgroundColor: controlCardBg, borderColor: colorWithAlpha(theme.secondaryColor, 0.16) }}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                                    {t('options.previewSubtitleSettings') || '字幕设置'}
                                </div>
                                <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
                                    {t('options.previewSubtitleSettingsDesc') || '调整底部译文和下一句提示的显示方式。'}
                                </div>
                            </div>
                            <ResetSectionButton
                                label={t('ui.default') || '默认'}
                                onClick={onResetSubtitleSettings}
                                theme={theme}
                            />
                        </div>

                        <ToggleRow
                            label={t('options.hidePlayerTranslationSubtitle') || '隐藏底部字幕层'}
                            description={t('options.hidePlayerTranslationSubtitleDesc') || '不影响使用独立字幕的动画模式。'}
                            checked={hideTranslationSubtitle}
                            onChange={onToggleHideTranslationSubtitle}
                            theme={theme}
                            icon={CaptionsOff}
                        />

                        <ToggleRow
                            label={t('options.showSubtitleTranslation') || '显示翻译'}
                            description={t('options.showSubtitleTranslationDesc') || '显示歌词翻译'}
                            checked={showSubtitleTranslation}
                            onChange={onToggleShowSubtitleTranslation}
                            theme={theme}
                            icon={Languages}
                        />

                        <PresetGroup
                            label={t('options.subtitleContentMode') || '副字幕内容'}
                            value={subtitleContentMode}
                            options={[
                                { label: t('options.subtitleContentTranslation') || '翻译', value: 'translation' as const },
                                { label: t('options.subtitleContentRomanization') || '罗马音', value: 'romanization' as const },
                                { label: t('options.subtitleContentNone') || '不显示', value: 'none' as const },
                            ]}
                            onChange={(mode) => onSubtitleContentModeChange?.(mode)}
                            isDaylight={isDaylight}
                            theme={theme}
                        />

                        <ToggleRow
                            label={t('options.showHarmonySubtitle') || '显示和声字幕'}
                            description={t('options.showHarmonySubtitleDesc') || '显示或隐藏顶部的和声歌词层。'}
                            checked={showHarmonySubtitle}
                            onChange={onToggleShowHarmonySubtitle}
                            theme={theme}
                            icon={Languages}
                        />

                        <ToggleRow
                            label={t('options.harmonySubtitleBackground') || '和声字幕背景'}
                            description={t('options.harmonySubtitleBackgroundDesc') || '为和声字幕添加半透明背景。'}
                            checked={harmonySubtitleBackground}
                            onChange={onToggleHarmonySubtitleBackground}
                            theme={theme}
                            icon={PanelTop}
                        />

                        <ToggleRow
                            label={t('options.subtitleOverlayBackground') || '字幕背景'}
                            description={t('options.subtitleOverlayBackgroundDesc') || '为底部字幕添加主题自适应的半透明背景，提高复杂画面中的可读性。'}
                            checked={subtitleOverlayBackground}
                            onChange={onToggleSubtitleOverlayBackground}
                            theme={theme}
                            icon={PanelTop}
                        />

                        <ToggleRow
                            label={t('options.subtitleFontInheritsLyrics') || '字幕继承歌词字体'}
                            description={t('options.subtitleFontInheritsLyricsDesc') || '关闭后可为字幕单独设置字体。'}
                            checked={subtitleFontInheritsLyrics}
                            onChange={onSubtitleFontInheritsLyricsChange}
                            theme={theme}
                            icon={Monitor}
                        />

                        {!subtitleFontInheritsLyrics ? (
                            <PresetGroup
                                label={t('options.subtitleFontFamily') || t('options.fontFamily') || '字幕字体'}
                                value={subtitleFontStyle}
                                options={subtitleFontStyleOptions}
                                onChange={(next) => {
                                    onSubtitleFontStyleChange?.(next);
                                }}
                                isDaylight={isDaylight}
                                theme={theme}
                            />
                        ) : null}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm" style={{ color: theme.primaryColor }}>
                                <span>{t('options.subtitleOverlayOpacity') || '字幕透明度'}</span>
                                <span className="font-mono opacity-70" style={{ color: theme.secondaryColor }}>
                                    {Math.round(subtitleOverlayOpacity * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.2"
                                max="1"
                                step="0.05"
                                value={subtitleOverlayOpacity}
                                onChange={(event) => onSubtitleOverlayOpacityChange?.(parseFloat(event.target.value))}
                                onPointerDown={onSliderPointerDown}
                                onPointerUp={onSliderCommit}
                                className={rangeInputClass}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisPlaygroundSettingsPanel;
