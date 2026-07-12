// src/utils/lyricFontPresets.ts
// 歌词字体预设：优先使用打包的书法/标题字体，拉开视觉差异。

export interface LyricFontPreset {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    /** 字体族，优先级从高到低 */
    fontFamily: string;
    /** 推荐的字重 */
    fontWeight: number;
    /** 字间距系数 */
    letterSpacing: number;
    /** 行高系数 */
    lineHeight: number;
    /** 是否适合强烈的视觉效果 */
    dramatic?: boolean;
    /** 是否为书法风格 */
    calligraphic?: boolean;
}

/**
 * 歌词字体预设集合。
 * 前排为打包字体（YehuoBrush / Jianhao / MaShanZheng / ZhiMangXing / PangMen），后排系统回退。
 */
export const LYRIC_FONT_PRESETS: LyricFontPreset[] = [
    {
        id: 'yehuo-brush',
        name: '野火笔锋',
        nameEn: 'Wildfire Brush',
        description: '流江毛草浓墨狂草，冲击力最强',
        fontFamily: '"YehuoBrush", "Liu Jian Mao Cao", "STXingkai", "KaiTi", "Source Han Serif SC", serif',
        fontWeight: 700,
        letterSpacing: 0.08,
        lineHeight: 1.06,
        dramatic: true,
        calligraphic: true,
    },
    {
        id: 'calligraphy-bold',
        name: '剑豪霸气',
        nameEn: 'Sword Hero',
        description: 'Aa剑豪体，标题感强、笔画锋利',
        fontFamily: '"JianhaoBrush", "STHeiti", "Source Han Sans SC", "PingFang SC", sans-serif',
        fontWeight: 800,
        letterSpacing: 0.05,
        lineHeight: 1.1,
        dramatic: true,
        calligraphic: true,
    },
    {
        id: 'kaiti-elegant',
        name: '马善政楷',
        nameEn: 'Ma Shan Zheng',
        description: '马善政毛笔楷书，端庄有笔锋',
        fontFamily: '"MaShanZheng", "KaiTi", "STKaiti", "Source Han Serif SC", serif',
        fontWeight: 700,
        letterSpacing: 0.06,
        lineHeight: 1.18,
        dramatic: true,
        calligraphic: true,
    },
    {
        id: 'fangsong-classic',
        name: '志莽行书',
        nameEn: 'Zhi Mang Xing',
        description: '钟齐志莽行书，奔放流动',
        fontFamily: '"ZhiMangXing", "FangSong", "STFangsong", "Source Han Serif SC", serif',
        fontWeight: 700,
        letterSpacing: 0.05,
        lineHeight: 1.14,
        dramatic: true,
        calligraphic: true,
    },
    {
        id: 'bold-impact',
        name: '标题黑金',
        nameEn: 'Title Impact',
        description: '庞门正道标题体，厚重砸脸',
        fontFamily: '"PangMenTitle", "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC", sans-serif',
        fontWeight: 900,
        letterSpacing: 0.03,
        lineHeight: 1.08,
        dramatic: true,
    },
    {
        id: 'sugar-serif',
        name: '糖果衬线',
        nameEn: 'Sugar Serif',
        description: '优雅衬线，偏精致',
        fontFamily: '"獅尾四季春加糖SC", "Folia Noto Serif SC", "Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", serif',
        fontWeight: 700,
        letterSpacing: 0.03,
        lineHeight: 1.22,
        dramatic: true,
    },
    {
        id: 'modern-condensed',
        name: '现代紧凑',
        nameEn: 'Modern Condensed',
        description: '系统黑体紧凑排版',
        fontFamily: '"Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontWeight: 800,
        letterSpacing: -0.01,
        lineHeight: 1.08,
        dramatic: true,
    },
    {
        id: 'rounded-soft',
        name: '圆润柔和',
        nameEn: 'Rounded Soft',
        description: '系统圆润黑体',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Source Han Sans SC", "Noto Sans CJK SC", sans-serif',
        fontWeight: 700,
        letterSpacing: 0.02,
        lineHeight: 1.2,
    },
    {
        id: 'bold-song',
        name: '宋体厚重',
        nameEn: 'Bold Song',
        description: '加粗宋体，传统厚重',
        fontFamily: '"Folia Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", "STSong", serif',
        fontWeight: 800,
        letterSpacing: 0.03,
        lineHeight: 1.22,
        dramatic: true,
    },
];

export const LYRIC_FONT_PRESET_STORAGE_KEY = 'lyric_font_preset_id';
export const DEFAULT_LYRIC_FONT_PRESET_ID = 'bold-impact';

/** 根据 ID 获取字体预设 */
export const getLyricFontPresetById = (id: string): LyricFontPreset | null => {
    return LYRIC_FONT_PRESETS.find(preset => preset.id === id) ?? null;
};

/** 获取默认歌词字体预设 */
export const getDefaultLyricFontPreset = (): LyricFontPreset => {
    return getLyricFontPresetById(DEFAULT_LYRIC_FONT_PRESET_ID) ?? LYRIC_FONT_PRESETS.find(p => p.id === 'bold-impact')!;
};

export const parseLyricFontPresetId = (value: unknown): string => (
    typeof value === 'string' && getLyricFontPresetById(value)
        ? value
        : DEFAULT_LYRIC_FONT_PRESET_ID
);

/** 适合强烈视觉效果的字体预设 */
export const getDramaticLyricFontPresets = (): LyricFontPreset[] => {
    return LYRIC_FONT_PRESETS.filter(preset => preset.dramatic);
};

/** 书法风格字体预设 */
export const getCalligraphicLyricFontPresets = (): LyricFontPreset[] => {
    return LYRIC_FONT_PRESETS.filter(preset => preset.calligraphic);
};

/** 构建字体 CSS 字符串 */
export const buildLyricFontCss = (preset: LyricFontPreset, fontSize: number): string => {
    return `${preset.fontWeight} ${fontSize}px/${preset.lineHeight} ${preset.fontFamily}`;
};

/** 字间距像素值 */
export const getLyricLetterSpacingPx = (preset: LyricFontPreset, fontSize: number): number => {
    return preset.letterSpacing * fontSize;
};
