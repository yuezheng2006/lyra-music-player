import { PlayerState, type SearchSourceId, type SongResult, type VisualizerBackgroundMode, type MonetBackgroundTuning } from '../../types';
import type { AppLanguagePreference } from '../../i18n/config';
import type { PanelTab } from '../UnifiedPanel';
import type {
    CommandPaletteCommand,
    CommandPaletteContext,
    CommandPaletteMatch,
    CommandPaletteSearchSource,
} from './types';
import { isDiscordPresenceUiEnabled, isNavidromeUiEnabled } from '../../utils/featureFlags';
import { usePerformanceMonitorStore } from '../../stores/usePerformanceMonitorStore';
import { useAmbientVisualStore } from '../../stores/useAmbientVisualStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useMagneticPullStore } from '../../stores/useMagneticPullStore';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import type { PerformanceMode } from '../../types/performance';
import { NOMAND_BACKGROUND_COMMANDS } from './backgroundNomandCommands';
import { NETEASE_DISCOVERY_COMMANDS } from './neteaseDiscoveryCommands';
import { VOLUME_COMMANDS } from './volumeCommands';
import { OBS_COMMANDS } from './obsCommands';
import { SETTINGS_CHROME_COMMANDS } from './settingsChromeCommands';
import { QISHUI_LOGIN_COMMANDS } from './qishuiLoginCommands';
import { KUGOU_LOGIN_COMMANDS } from './kugouLoginCommands';
import { NETEASE_API_COMMANDS } from './neteaseApiCommands';
import { QUEUE_COMMANDS } from './queueCommands';
import { SLEEP_TIMER_COMMANDS } from './sleepTimerCommands';
import { AUTO_PLAY_ON_LAUNCH_COMMANDS } from './autoPlayOnLaunchCommands';
import { VISUALIZER_MODE_COMMANDS } from './visualizerCommands';
import { HOME_TAB_COMMANDS } from './homeTabCommands';
import { evaluateQueueQuery } from '../../utils/queue/evaluateQueueQuery';

// src/components/command-palette/commandRegistry.ts
// Defines command palette entries and the lightweight matching used for autocomplete.

const MAX_COMMAND_MATCHES = 10;

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const getSongArtistLabel = (song: SongResult) => {
    const artists = song.ar?.length ? song.ar : song.artists;
    return artists?.map(artist => artist.name).filter(Boolean).join(', ') || '';
};

const getSongAlbumLabel = (song: SongResult) => song.al?.name || song.album?.name || '';

const buildQueueSearchText = (song: SongResult, index: number) => [
    String(index + 1),
    song.name,
    getSongArtistLabel(song),
    getSongAlbumLabel(song),
    ...(song.alia ?? []),
    ...(song.tns ?? []),
].filter(Boolean).join(' ');

const buildQueueSongDescription = (song: SongResult, index: number, context: CommandPaletteContext) => {
    const metadata = [getSongArtistLabel(song), getSongAlbumLabel(song)].filter(Boolean).join(' · ');
    return metadata || context.t('commandPalette.queueIndex', 'Queue #{{index}}').replace('{{index}}', String(index + 1));
};

const getSearchSourceLabel = (sourceTab: SearchSourceId, context: CommandPaletteContext) => {
    if (sourceTab === 'local') {
        return context.t('commandPalette.sourceLocal', 'local library');
    }
    if (sourceTab === 'navidrome') {
        return context.t('commandPalette.sourceNavidrome', 'Navidrome');
    }
    if (sourceTab === 'qq') {
        return context.t('commandPalette.sourceQQMusic', 'QQ Music');
    }
    if (sourceTab === 'qishui') {
        return context.t('commandPalette.sourceQishuiMusic', 'Qishui Music');
    }
    if (sourceTab === 'coco') {
        return context.t('commandPalette.sourceCocoMusic', 'coco-免费');
    }
    return context.t('commandPalette.sourceNetease', 'NetEase Cloud Music');
};

const buildSearchPreview = (
    input: string,
    sourceTab: SearchSourceId,
    context: CommandPaletteContext,
    isCurrentSource: boolean
) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
        return null;
    }

    const sourceLabel = isCurrentSource
        ? context.t('commandPalette.sourceCurrent', 'current source')
        : getSearchSourceLabel(sourceTab, context);

    return context.t('commandPalette.previewSearch', 'Search {{source}} songs: {{query}}')
        .replace('{{source}}', sourceLabel)
        .replace('{{query}}', trimmedInput);
};

const runSearch = async (
    query: string,
    sourceTab: CommandPaletteSearchSource,
    context: CommandPaletteContext
) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        return false;
    }

    const didSearch = await context.submitSearch({
        query: trimmedQuery,
        sourceTab,
        deps: {
            localSongs: context.localSongs,
            t: context.t,
        },
        returnView: 'player',
    });

    if (didSearch) {
        context.navigateToSearch({
            query: trimmedQuery,
            sourceTab,
            replace: typeof window !== 'undefined' && Boolean(window.history.state?.search),
            returnView: 'player',
        });
    }

    return didSearch;
};

const createSearchCommand = (
    id: string,
    title: string,
    description: string,
    keywords: string[],
    resolveSource: (context: CommandPaletteContext) => SearchSourceId
): CommandPaletteCommand => ({
    id,
    group: 'search',
    title,
    description,
    keywords,
    placeholder: `${keywords[0]} ${description}`,
    requiresInput: true,
    getPreview: (input, context) => buildSearchPreview(
        input,
        resolveSource(context),
        context,
        id === 'search-current'
    ),
    execute: (input, context) => runSearch(input, resolveSource(context), context),
});

const createSettingsCommand = (
    id: string,
    title: string,
    description: string,
    keywords: string[],
    initialTab: 'help' | 'options',
    initialSubview: Parameters<CommandPaletteContext['openSettings']>[1] = null
): CommandPaletteCommand => ({
    id,
    group: 'settings',
    title,
    description,
    keywords,
    execute: (_input, context) => {
        context.openSettings(initialTab, initialSubview);
        return true;
    },
});

const createAppLanguageCommand = (
    id: string,
    preference: AppLanguagePreference,
    title: string,
    description: string,
    keywords: string[],
): CommandPaletteCommand => ({
    id,
    group: 'settings',
    title,
    description,
    keywords,
    execute: async (_input, context) => {
        await context.setAppLanguagePreference(preference);
        return true;
    },
});

const createPanelCommand = (
    tab: PanelTab,
    title: string,
    description: string,
    keywords: string[]
): CommandPaletteCommand => ({
    id: `panel-${tab}`,
    group: 'panel',
    title,
    description,
    keywords,
    execute: (_input, context) => {
        context.setPanelTab(tab);
        context.setIsPanelOpen(true);
        return true;
    },
});

const createPerformanceModeCommand = (
    mode: PerformanceMode,
    title: string,
    description: string,
    keywords: string[],
): CommandPaletteCommand => ({
    id: `performance-mode-${mode}`,
    group: 'settings',
    title,
    description,
    keywords,
    execute: () => {
        usePerformanceMonitorStore.getState().setMode(mode);
        return true;
    },
});


export const COMMAND_PALETTE_COMMANDS: CommandPaletteCommand[] = [
    createSearchCommand('search-current', 'Search songs', 'Search songs in the current source', ['search', 'find', 'song', '搜索', '搜歌', 'sousuo', 'souge', 'ss', 'sg'], context => context.currentSearchSourceTab),
    createSearchCommand('search-local', 'Search local songs', 'Search local library', ['local', 'local search', 'search local', '本地', '本地音乐', 'bendi', 'bendiyinyue', 'bd', 'bdyy'], () => 'local'),
    createSearchCommand('search-navidrome', 'Search Navidrome songs', 'Search Navidrome library', ['navi', 'navidrome', 'search navidrome', '导航', '服务器', 'fuwuqi', 'fwq'], () => 'navidrome'),
    createSearchCommand('search-netease', 'Search NetEase songs', 'Search NetEase Cloud Music', ['netease', 'cloud', 'search netease', '网易云', '网抑云', 'wangyiyun', 'wyy'], () => 'netease'),
    createSearchCommand('search-qq', 'Search QQ Music songs', 'Search QQ Music', ['qq', 'qq music', 'search qq', 'QQ音乐', '扣扣音乐', 'qqyinyue', 'qqyy'], () => 'qq'),
    createSearchCommand('search-qishui', 'Parse Qishui Music link', 'Paste a Qishui Music share link', ['qishui', 'qishui music', 'search qishui', '汽水', '汽水音乐', 'qishuiyinyue', 'qsyy'], () => 'qishui'),
    createSearchCommand('search-coco', 'Search Coco songs', 'Search free aggregated music sources', ['coco', 'coco downloader', 'search coco', '聚合', '免费搜索', 'juhe'], () => 'coco'),
    createSearchCommand('search-kugou', 'Search Kugou songs', 'Search Kugou Music', ['kugou', '酷狗', '酷狗音乐', 'kugouyinyue', 'kgyy'], () => 'kugou'),
    createSearchCommand('search-bilibili', 'Search Bilibili audio', 'Search Bilibili video audio', ['bilibili', 'bili', 'B站', '哔哩哔哩', 'b站', 'blbl'], () => 'bilibili'),
    createSearchCommand('search-kuwo', 'Search Kuwo songs', 'Search Kuwo Music', ['kuwo', '酷我', '酷我音乐', 'kuwoyinyue', 'kwyy'], () => 'kuwo'),
    ...QUEUE_COMMANDS,
    ...SLEEP_TIMER_COMMANDS,
    ...AUTO_PLAY_ON_LAUNCH_COMMANDS,

    createSettingsCommand('settings-help', 'Open Help', 'Open help and shortcuts', ['help', '帮助', 'bangzhu', 'bz'], 'help'),
    {
        id: 'show-user-guide',
        group: 'settings',
        title: 'Show User Guide',
        description: 'Open the user guide tutorial',
        keywords: ['guide', 'help', 'tutorial', '用户指引', '指南', '帮助', 'yonghuzhiyin', 'zhinan', 'yhzy', 'zn'],
        execute: (_input, context) => {
            context.setIsUserGuideModalOpen(true);
            return true;
        },
    },
    {
        id: 'show-shortcuts',
        group: 'settings',
        title: 'Show shortcuts',
        description: 'Open the keyboard shortcuts cheat sheet',
        keywords: [
            'shortcuts',
            'hotkeys',
            'keyboard',
            'cheat sheet',
            '快捷键',
            '热键',
            '键盘',
            'kuaijiejian',
            'rejian',
            'kjj',
        ],
        execute: (_input, context) => {
            context.setIsShortcutsCheatSheetOpen(true);
            return true;
        },
    },
    {
        id: 'show-onboarding',
        group: 'settings',
        title: 'Show onboarding',
        description: 'Open the first-run getting started wizard',
        keywords: ['onboarding', 'getting started', 'welcome', '入门', '新手引导', '引导', 'rumen', 'xinshouyindao', 'yindao', 'rm', 'xsyd'],
        execute: (_input, context) => {
            context.setIsOnboardingOpen(true);
            return true;
        },
    },
    {
        id: 'show-whats-new',
        group: 'settings',
        title: "What's new",
        description: 'Open the latest version highlights',
        keywords: ['whats new', 'new features', 'changelog', '更新', '新功能', '版本亮点', 'gengxin', 'xingongneng', 'gx', 'xgn'],
        execute: (_input, context) => {
            context.setIsWhatsNewOpen(true);
            return true;
        },
    },
    createSettingsCommand('settings-options', 'Open Options', 'Open the options center', ['settings', 'options', '设置', '选项', 'shezhi', 'xuanxiang', 'sz', 'xx'], 'options'),
    createSettingsCommand('settings-appearance', 'Appearance settings', 'Open visual and appearance settings', ['appearance', 'visual settings', '外观', '视觉', 'waiguan', 'shijue', 'wg', 'sj'], 'options', 'appearance'),
    createSettingsCommand(
        'settings-stage-track-pill',
        'Now playing card',
        'Open now-playing card appearance settings',
        ['now playing card', 'song info card', 'track pill', '歌曲信息', '正在播放卡片', '歌曲卡片', 'gequxinxi', 'zhengzaibofang', 'gqxk', 'zzbf'],
        'options',
        'appearance',
    ),
    createSettingsCommand('settings-general', 'General settings', 'Open general app preferences', ['general', 'language settings', 'locale', '通用', '语言', 'tongyong', 'yuyan', 'ty', 'yy'], 'options', 'general'),
    createSettingsCommand('settings-playback', 'Playback settings', 'Open playback behavior settings', ['playback settings', 'playback', '播放', '播放设置', 'bofang', 'bofangshezhi', 'bf', 'bfsz'], 'options', 'playback'),
    createSettingsCommand(
        'settings-lyrics-resolve-service',
        'Lyrics resolve service',
        'Open private lyrics resolve service settings',
        ['lyrics resolve', 'lyric service', 'private lyrics', '歌词服务', '歌词解析服务', '私有歌词', 'gecifuwu', 'gecijiexifu', 'gcfw'],
        'options',
        'playback',
    ),
    createSettingsCommand('settings-integration', 'Integration settings', 'Open music account, Stage, Now Playing, and provider settings', ['integration', 'stage', 'now playing', 'qq music settings', 'qq music cookie', 'qishui', 'soda music', '集成', '连接', 'QQ音乐', 'QQ音乐登录', '汽水', 'jicheng', 'lianjie', 'qqyinyue', 'qqdenglu', 'jc', 'lj', 'qs'], 'options', 'integration'),
    createSettingsCommand('settings-now-playing', 'Now Playing sidecar', 'Open Now Playing pairing and the 9863 probe', ['now playing', 'now-playing', '9863', 'widdit', 'sidecar', 'smtc', '正在播放侧车', 'nowplaying', 'ceche', 'np'], 'options', 'integration'),
    createSettingsCommand('settings-music-provider-plugins', 'Music provider plugins', 'Open open-mode music provider plugin settings', ['music provider', 'provider plugin', 'open mode', 'sidecar plugin', '音乐源插件', '开放模式', '插件源', 'yinyueyuan', 'chajian', 'kaifang', 'cjy'], 'options', 'integration'),
    createSettingsCommand('settings-discord-presence', 'Discord playback status', 'Open Discord Rich Presence settings', ['discord', 'rich presence', 'discord presence', 'playing status', '播放状态', 'discord状态', 'discordzhuangtai', 'bofangzhuangtai', 'dc', 'zt'], 'options', 'integration'),
    createSettingsCommand('settings-obs-browser-source', 'OBS browser source', 'Open OBS browser source settings', ['obs', 'browser source', 'live source', '直播源', '浏览器源', 'zhiboyuan', 'liulanqiyuan', 'zby', 'llqy'], 'options', 'integration'),
    {
        id: 'music-provider-rescan',
        group: 'settings',
        title: 'Rescan music provider plugins',
        description: 'Reload local open-mode music provider plugins from disk',
        keywords: [
            'rescan providers',
            'reload providers',
            'provider plugin',
            '重新扫描',
            '扫描插件',
            '音乐源',
            'chongxinsaomiao',
            'saomiao',
            'cxsm',
        ],
        execute: async () => {
            const { useMusicProviderCatalogStore } = await import('../../stores/useMusicProviderCatalogStore');
            const { useOnlineLibraryFilterStore } = await import('../../stores/useOnlineLibraryFilterStore');
            const { mergeProviderCatalogIds } = await import('../../utils/musicProviders/providerManifestMath');
            await useMusicProviderCatalogStore.getState().reload();
            const providers = useMusicProviderCatalogStore.getState().providers;
            useOnlineLibraryFilterStore.getState().syncKnownProviders(mergeProviderCatalogIds(providers));
            return true;
        },
    },
    createSettingsCommand('settings-storage', 'Storage settings', 'Open cache and storage settings', ['storage', 'cache', 'download folder', '存储', '缓存', '下载目录', 'cunchu', 'huancun', 'xiazai', 'cc', 'hc', 'xz'], 'options', 'storage'),
    {
        id: 'open-download-directory',
        group: 'settings',
        title: 'Open download folder',
        description: 'Reveal the song download directory in your file manager',
        keywords: ['download folder', 'download directory', 'open downloads', '下载目录', '打开下载', '下载文件夹', 'xiazai', 'xiazaimulu', 'xzml'],
        execute: async () => {
            if (typeof window === 'undefined' || !window.electron?.openDownloadDirectory) {
                return false;
            }
            await window.electron.openDownloadDirectory();
            return true;
        },
    },
    {
        id: 'download-current-song',
        group: 'playback',
        title: 'Download current song',
        description: 'Save the current playable audio into the download folder',
        keywords: [
            'download song',
            'save song',
            'download current',
            '下载歌曲',
            '下载当前',
            '保存歌曲',
            '本地下载',
            'xiazai',
            'baocun',
            'xzgq',
        ],
        execute: async (_input, context) => context.downloadCurrentSong(),
    },
    {
        id: 'download-search-results',
        group: 'playback',
        title: 'Download search results',
        description: 'Save all downloadable songs from the current search results',
        keywords: [
            'download search',
            'download results',
            'batch download',
            '下载搜索',
            '下载结果',
            '批量下载',
            'xiazai',
            'sousuo',
            'plxz',
        ],
        execute: async (_input, context) => context.downloadSearchResults(),
    },
    {
        id: 'toggle-auto-resync-download-folder',
        group: 'settings',
        title: 'Toggle download folder local resync',
        description: 'After download, resync local library when the download folder is already imported',
        keywords: [
            'auto resync',
            'download resync',
            'local library download',
            '自动同步下载',
            '下载同步本地库',
            'resync',
            'xiazai',
            'tongbu',
        ],
        execute: async () => {
            const store = (await import('../../stores/useSettingsUiStore')).useSettingsUiStore.getState();
            store.handleToggleAutoResyncDownloadFolder(!store.autoResyncDownloadFolder);
            return true;
        },
    },
    {
        id: 'record-current-playback',
        group: 'playback',
        title: 'Record current playback',
        description: 'Export the current player view or Bilibili video stream to a video file (Electron only)',
        keywords: [
            'record',
            'video export',
            'export video',
            'screen record',
            'bilibili record',
            '录制',
            '录屏',
            '导出视频',
            'B站录制',
            'bilibili',
            'luzhi',
            'luping',
            'daochu',
            'lz',
            'lp',
        ],
        execute: (_input, context) => {
            if (!context.isElectronWindow) {
                return false;
            }
            context.startVideoExport('from-start');
            return true;
        },
    },
    createSettingsCommand('settings-desktop', 'Desktop settings', 'Open desktop app settings', ['desktop', 'electron', '桌面', '桌面端', 'zhuomian', 'zhuomianduan', 'zm', 'zmd'], 'options', 'desktop'),
    {
        id: 'desktop-lyrics-toggle',
        group: 'settings',
        title: 'Toggle desktop lyrics',
        description: 'Show or hide the always-on-top desktop lyrics overlay',
        keywords: ['desktop lyrics', 'overlay lyrics', '桌面歌词', '悬浮歌词', 'zhuomiangedci', 'xuanfugeci', 'zmgc', 'xfgc'],
        execute: async (_input, context) => {
            await context.toggleDesktopLyrics();
            return true;
        },
    },
    {
        id: 'desktop-lyrics-lock-toggle',
        group: 'settings',
        title: 'Toggle desktop lyrics lock',
        description: 'Lock or unlock the desktop lyrics overlay click-through mode',
        keywords: ['desktop lyrics lock', 'lock desktop lyrics', 'unlock desktop lyrics', '桌面歌词锁定', '锁定桌面歌词', 'suodingzhuomiangedci', 'sdzmgc'],
        execute: async (_input, context) => {
            if (!context.desktopLyricsEnabled) {
                await context.toggleDesktopLyrics();
            }
            await context.setDesktopLyricsLocked(!context.desktopLyricsLocked);
            return true;
        },
    },
    {
        id: 'desktop-lyrics-center',
        group: 'settings',
        title: 'Desktop lyrics: center',
        description: 'Snap desktop lyrics to the vertical middle',
        keywords: ['desktop lyrics center', 'desktop lyrics middle', '桌面歌词居中', '桌面歌词中线', 'zmgcjz'],
        execute: (_input, context) => {
            context.setDesktopLyricsYFactor(0.5);
            return true;
        },
    },
    createSettingsCommand('settings-lab', 'Lab settings', 'Open experimental settings', ['lab', 'experimental', '实验', '实验室', 'shiyan', 'shiyanshi', 'sy', 'sys'], 'options', 'lab'),
    createSettingsCommand(
        'settings-track-atmosphere-light',
        'Track atmosphere lighting',
        'Open curated per-track atmosphere and light plan catalog',
        [
            'track atmosphere',
            'atmosphere light',
            'light plan',
            'mood lighting',
            '曲级氛围',
            '氛围灯光',
            '灯光配方',
            'qujifenwei',
            'fenweidengguang',
            'dengguangpeifang',
            'qjfw',
            'fwdg',
        ],
        'options',
        'trackAtmosphereLight',
    ),
    createPerformanceModeCommand('auto', 'Performance: Auto', 'Auto-adapt visual quality from FPS', ['performance', 'auto quality', '性能', '自动性能', 'xingneng', 'zdnx', 'xn']),
    createPerformanceModeCommand('high', 'Performance: High', 'Full visual quality', ['performance high', '高性能', 'gaoxingneng', 'gxn']),
    createPerformanceModeCommand('balanced', 'Performance: Balanced', 'Balanced visual quality', ['performance balanced', '均衡性能', 'junheng', 'jhxn']),
    createPerformanceModeCommand('lite', 'Performance: Lite', 'Minimal visual quality', ['performance lite', 'low performance', '低性能', '省电', 'dixingneng', 'dxn']),
    {
        id: 'toggle-performance-hud',
        group: 'settings',
        title: 'Toggle performance HUD',
        description: 'Show or hide the FPS / memory readout in the corner',
        keywords: [
            'performance hud',
            'fps hud',
            'fps overlay',
            'hide fps',
            '性能面板',
            '性能监控',
            '帧率显示',
            'FPS显示',
            'xingnengmianban',
            'xingnengjiankong',
            'zhenlv',
            'xnmb',
            'xnjk',
        ],
        execute: () => {
            const store = usePerformanceMonitorStore.getState();
            store.setShowHud(!store.showHud);
            return true;
        },
    },
    {
        id: 'toggle-speaker-stage',
        group: 'visualizer',
        title: 'Toggle speaker stage',
        description: 'Immersive glass-depth stage with MoodLyric floating lyrics',
        keywords: [
            'speaker stage',
            'speaker',
            'mood lyric',
            'floating lyrics',
            'glass stage',
            '音箱舞台',
            '悬浮歌词',
            '玻璃景深',
            '音箱',
            'yinxiangwutai',
            'xuanfugeici',
            'yxwt',
            'xfgc',
        ],
        execute: () => {
            useSettingsUiStore.getState().handleToggleSpeakerStage();
            return true;
        },
    },
    {
        id: 'toggle-ambient-visual',
        group: 'visualizer',
        title: 'Toggle ambient visual',
        description: 'Show or hide mood-driven ambient visual strategies above cover particles',
        keywords: [
            'ambient visual',
            'ambient',
            'mood visual',
            '主视觉',
            '氛围视觉',
            '情绪视觉',
            'zhushijue',
            'fenweishijue',
            'zsj',
            'fwsj',
        ],
        execute: () => {
            const store = useAmbientVisualStore.getState();
            store.setEnabled(!store.enabled);
            return true;
        },
    },
    {
        id: 'toggle-interactive-character',
        group: 'visualizer',
        title: 'Toggle interactive character',
        description: 'Show or hide the fox companion on the player stage',
        keywords: [
            'character',
            'fox',
            'interactive character',
            '角色',
            '互动角色',
            '狐狸',
            'juese',
            'hudongjuese',
            'js',
            'hdjs',
        ],
        execute: () => {
            const store = useCharacterStore.getState();
            store.setEnabled(!store.enabled);
            return true;
        },
    },
    {
        id: 'toggle-magnetic-pull',
        group: 'visualizer',
        title: 'Toggle magnetic emotion chip',
        description: 'Soft pointer-follow on the floating mood chip',
        keywords: [
            'magnetic',
            'magnetic pull',
            'emotion chip',
            'mood chip',
            '磁吸',
            '磁性',
            '情绪按钮',
            '情绪芯片',
            'cixi',
            'cixing',
            'qingxuan',
            'cx',
        ],
        execute: () => {
            const store = useMagneticPullStore.getState();
            store.setEnabled(!store.enabled);
            return true;
        },
    },
    {
        id: 'toggle-emotion-scramble',
        group: 'visualizer',
        title: 'Toggle emotion label scramble',
        description: 'Brief scramble reveal when the mood label changes',
        keywords: [
            'scramble',
            'emotion scramble',
            'mood scramble',
            '乱码',
            '情绪乱码',
            '文字扰乱',
            'luanma',
            'qingxuluanma',
            'lm',
            'qxlm',
        ],
        execute: () => {
            const store = useMagneticPullStore.getState();
            store.setScrambleEnabled(!store.scrambleEnabled);
            return true;
        },
    },
    {
        id: 'toggle-emotion-beat-pulse',
        group: 'visualizer',
        title: 'Toggle emotion chip beat pulse',
        description: 'Soft glow on the mood chip follows atmosphere beat',
        keywords: [
            'beat pulse',
            'emotion beat',
            'mood beat',
            '节拍光晕',
            '情绪节拍',
            'chip pulse',
            'jiepai',
            'qingxujiepai',
            'jp',
            'qxjp',
        ],
        execute: () => {
            const store = useMagneticPullStore.getState();
            store.setBeatPulseEnabled(!store.beatPulseEnabled);
            return true;
        },
    },
    createSettingsCommand('settings-visualizer', 'Visualizer settings', 'Open lyrics animation workbench', ['visualizer settings', 'visualizer workbench', '可视化', '歌词动画', 'keshihua', 'gecidonghua', 'ksh', 'gcdh'], 'options', 'visualizer'),
    createSettingsCommand('settings-theme-park', 'Color', 'Open theme editor', ['color', 'theme park', 'theme', '配色', '主题', '主题公园', 'peise', 'zhuti', 'zhutigongyuan', 'ps', 'zt', 'ztgy'], 'options', 'themePark'),
    createSettingsCommand('settings-lyric-filter', 'Lyric filter', 'Open lyric filter settings', ['lyric filter', 'lyrics filter', '歌词过滤', '过滤', 'geciguolv', 'guolv', 'gcgl', 'gl'], 'options', 'lyricFilter'),

    {
        id: 'navigate-home',
        group: 'navigation',
        title: 'Go home',
        description: 'Return to home view',
        keywords: ['home', '首页', '主页', 'shouye', 'zhuye', 'sy', 'zy'],
        execute: (_input, context) => {
            context.setHomeViewTab('charts');
            context.navigateDirectHome();
            return true;
        },
    },
    {
        id: 'navigate-player',
        group: 'navigation',
        title: 'Listening mode',
        description: 'Enter the immersive player view',
        keywords: [
            'player',
            'listening mode',
            '听歌模式',
            '播放页',
            '播放器',
            'tinggemoshi',
            'bofangye',
            'bofangqi',
            'tgms',
            'bfy',
            'bfq',
        ],
        execute: (_input, context) => {
            context.navigateToPlayer();
            return true;
        },
    },
    {
        id: 'navigate-back-playlist',
        group: 'navigation',
        title: 'Back to playlist',
        description: 'Return from listening mode to the playlist card view',
        keywords: [
            'back',
            'playlist',
            'grid',
            '回到歌单',
            '返回歌单',
            '歌单',
            '卡片',
            'huidaogedan',
            'fanhuidedan',
            'gedan',
            'hdgd',
            'fhgd',
            'gd',
        ],
        execute: (_input, context) => {
            context.navigateToHome();
            return true;
        },
    },
    {
        id: 'immersive-fullscreen',
        group: 'navigation',
        title: 'Fullscreen player',
        description: 'OS fullscreen plus player-only fill',
        keywords: [
            'fullscreen',
            'full screen',
            'immersive',
            'player fullscreen',
            '全屏',
            '全屏播放',
            '沉浸',
            '满屏',
            '满画面',
            'quanping',
            'quanpingbofang',
            'manscreen',
            'qp',
            'qpbf',
        ],
        execute: (_input, context) => context.toggleImmersiveFullscreen(),
    },
    ...HOME_TAB_COMMANDS,

    createPanelCommand('cover', 'Panel: cover', 'Open the cover panel tab', ['panel cover', 'cover panel', '封面', 'fengmian', 'fm']),
    createPanelCommand('controls', 'Panel: controls', 'Open the controls panel tab', ['panel controls', 'controls panel', '控制', 'kongzhi', 'kz']),
    createPanelCommand('queue', 'Panel: queue', 'Open the queue panel tab', ['panel queue', 'queue panel', '队列', 'duilie', 'dl']),
    createPanelCommand('account', 'Panel: account', 'Open the account panel tab', ['panel account', 'account panel', '账号', '账户', '汽水', 'qishui', 'zhanghao', 'zhanghu', 'zh', 'qs']),
    createPanelCommand('local', 'Panel: local', 'Open the local panel tab', ['panel local', 'local panel', '本地面板', 'bendimianban', 'bdmb']),
    createPanelCommand('navi', 'Panel: Navidrome', 'Open the Navidrome panel tab', ['panel navi', 'panel navidrome', 'navi panel', 'navidrome 面板', '服务器面板', 'fuwuqimianban', 'fwqmb']),
    createPanelCommand('onlineLyrics', 'Panel: lyrics', 'Open the online lyrics panel tab', ['panel lyrics', 'lyrics panel', '歌词面板', 'gecimianban', 'gcmb']),

    {
        id: 'playback-play',
        group: 'playback',
        title: 'Play',
        description: 'Start playback when paused',
        keywords: ['play', '播放', 'bofang', 'bf'],
        execute: (_input, context) => {
            if (context.playerState !== PlayerState.PLAYING) {
                context.togglePlay();
            }
            return true;
        },
    },
    {
        id: 'playback-pause',
        group: 'playback',
        title: 'Pause',
        description: 'Pause current playback',
        keywords: ['pause', '暂停', 'zanting', 'zt'],
        execute: (_input, context) => {
            if (context.playerState === PlayerState.PLAYING) {
                context.togglePlay();
            }
            return true;
        },
    },
    {
        id: 'playback-next',
        group: 'playback',
        title: 'Next track',
        description: 'Play the next track',
        keywords: ['next', '下一首', 'xiayishou', 'xys'],
        execute: (_input, context) => {
            context.handleNextTrack();
            return true;
        },
    },
    {
        id: 'playback-prev',
        group: 'playback',
        title: 'Previous track',
        description: 'Play the previous track',
        keywords: ['prev', 'previous', '上一首', 'shangyishou', 'sys'],
        execute: (_input, context) => {
            context.handlePrevTrack();
            return true;
        },
    },
    {
        id: 'playback-loop',
        group: 'playback',
        title: 'Toggle loop',
        description: 'Change loop mode',
        keywords: ['loop', '循环', 'xunhuan', 'xh'],
        execute: (_input, context) => {
            context.toggleLoop();
            return true;
        },
    },
    {
        id: 'playback-volume-up',
        group: 'playback',
        title: 'Volume up',
        description: 'Raise volume by 5%',
        keywords: ['volume up', 'louder', '音量加', '音量+', '增大音量', 'yinliangjia', 'ylj'],
        execute: (_input, context) => {
            context.adjustVolumeByStep(0.05);
            return true;
        },
    },
    {
        id: 'playback-volume-down',
        group: 'playback',
        title: 'Volume down',
        description: 'Lower volume by 5%',
        keywords: ['volume down', 'quieter', '音量减', '音量-', '减小音量', 'yinliangjian', 'yljian'],
        execute: (_input, context) => {
            context.adjustVolumeByStep(-0.05);
            return true;
        },
    },
    {
        id: 'playback-toggle-mute',
        group: 'playback',
        title: 'Toggle mute',
        description: 'Mute or unmute playback',
        keywords: ['mute', 'unmute', '静音', '取消静音', 'jingyin', 'jy'],
        execute: (_input, context) => {
            context.toggleMute();
            return true;
        },
    },
    {
        id: 'playback-shuffle',
        group: 'playback',
        title: 'Shuffle queue',
        description: 'Shuffle current play queue',
        keywords: ['shuffle queue', 'shuffle', '打乱', '打乱队列', 'daluan', 'daluanduilie', 'dl'],
        execute: (_input, context) => {
            context.shuffleQueue();
            return true;
        },
    },
    ...NETEASE_DISCOVERY_COMMANDS,
    ...VOLUME_COMMANDS,
    ...OBS_COMMANDS,
    ...SETTINGS_CHROME_COMMANDS,
    ...QISHUI_LOGIN_COMMANDS,
    ...KUGOU_LOGIN_COMMANDS,
    ...NETEASE_API_COMMANDS,
    {
        id: 'theme-generate-current',
        group: 'settings',
        title: 'Generate AI theme',
        description: 'Generate an AI theme for the current song',
        keywords: ['generate ai theme', 'ai theme', 'theme generation', 'generate theme', '生成AI主题', '生成主题', '主题生成', 'shengchengzhuti', 'aizhuti', 'sczt', 'aizt'],
        execute: (_input, context) => {
            if (!context.canGenerateAITheme || context.isGeneratingTheme) {
                return false;
            }
            context.generateAITheme();
            return true;
        },
    },
    {
        id: 'theme-quick-editor',
        group: 'settings',
        title: 'Quick theme editor',
        description: 'Quickly edit the current AI or custom theme',
        keywords: ['quick theme editor', 'theme editor', 'ai theme editor', 'custom theme editor', '快速主题编辑器', '主题编辑器', '自定义主题编辑器', 'kuaisuzhutibianjiqi', 'zhutibianjiqi', 'zidingyizhutibianjiqi', 'ksztbjq', 'ztbjq'],
        execute: (_input, context) => {
            if (!context.canOpenThemeQuickEditor) {
                return false;
            }
            context.openThemeQuickEditor();
            return true;
        },
    },
    {
        id: 'playback-auto-match-best-lyric',
        group: 'playback',
        title: 'Match best lyrics',
        description: 'Run automatic best lyric matching for the current song',
        keywords: ['best lyrics', 'match best lyrics', 'auto match lyrics', '最佳歌词', '匹配最佳歌词', '自动匹配歌词', 'zuijiageci', 'pipeizuijiageci', 'zidongpipeigeci', 'zjgc', 'ppzjgc', 'zdppgc'],
        execute: (_input, context) => context.runAutoMatchBestLyric(),
    },

    ...VISUALIZER_MODE_COMMANDS,
    {
        id: 'lyric-effect-none',
        group: 'visualizer',
        title: 'Lyric effect: None',
        description: 'Clear lyric effect pack',
        keywords: ['lyric effect none', 'no lyric effect', '无特效', '关闭特效', 'wutexiao', 'wtx'],
        execute: (_input, context) => {
            context.setLyricEffectPackId('none');
            return true;
        },
    },
    {
        id: 'lyric-effect-yehuo',
        group: 'visualizer',
        title: 'Lyric effect: Wildfire',
        description: 'Apply yehuo dual-layer echo pack',
        keywords: ['lyric effect yehuo', 'wildfire effect', '野火感', '双重叠字', 'yehuo', 'yh'],
        execute: (_input, context) => {
            context.setLyricEffectPackId('yehuo');
            return true;
        },
    },
    {
        id: 'lyric-effect-neon',
        group: 'visualizer',
        title: 'Lyric effect: Neon',
        description: 'Apply neon glow / scan pack',
        keywords: ['lyric effect neon', 'neon lyrics', '霓虹感', '霓虹', 'nihong', 'nh'],
        execute: (_input, context) => {
            context.setLyricEffectPackId('neon');
            return true;
        },
    },
    {
        id: 'lyric-effect-glitch',
        group: 'visualizer',
        title: 'Lyric effect: Glitch',
        description: 'Apply short glitch / RGB offset pack',
        keywords: ['lyric effect glitch', 'glitch lyrics', '故障感', '故障', 'guzhang', 'gz'],
        execute: (_input, context) => {
            context.setLyricEffectPackId('glitch');
            return true;
        },
    },
    {
        id: 'lyric-word-mode-default',
        group: 'visualizer',
        title: 'Lyrics: Default Word Highlight',
        description: 'Show word-by-word highlight on the current line only',
        keywords: ['lyric word mode', 'default word', 'default lyrics', '默认逐字', '默认歌词', 'morenzhuzi', 'mrzz'],
        execute: (_input, context) => {
            context.setLyricWordMode('default');
            return true;
        },
    },
    {
        id: 'lyric-word-mode-karaoke',
        group: 'visualizer',
        title: 'Lyrics: Karaoke / KTV Wipe',
        description: 'Preview upcoming lyrics with per-character left-to-right KTV wipe fill',
        keywords: ['lyric word mode', 'karaoke', 'ktv', 'sing along', 'wipe', '扫光', 'k歌', '卡拉ok', 'kalake', 'kg', 'k歌逐字', '预告歌词', '传统k歌', '传统', 'chuantong', 'ct', '扫字'],
        execute: (_input, context) => {
            context.setLyricWordMode('karaoke');
            return true;
        },
    },

    {
        id: 'background-monet-full-overlay',
        group: 'visualizer',
        title: 'Background: Monet Full Screen Overlay',
        description: 'Switch background to Monet full screen overlay layout',
        keywords: ['monet full screen', 'monet full', 'overlay', '莫奈全屏叠色', '全屏叠色', '莫奈', 'mnqpds', 'qpds', '背景切换到 莫奈: 全屏叠色', '背景切换到莫奈全屏叠色'],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('monet');
            context.setMonetBackgroundTuning({ backgroundLayout: 'full-overlay' });
            return true;
        },
    },
    {
        id: 'background-monet-half-gradient',
        group: 'visualizer',
        title: 'Background: Monet Half Screen Gradient',
        description: 'Switch background to Monet half screen gradient layout',
        keywords: ['monet half screen', 'monet half', 'gradient', '莫奈半屏渐变', '半屏渐变', '莫奈', 'mnbpjb', 'bpjb', '背景切换到 莫奈: 半屏渐变', '背景切换到莫奈半屏渐变'],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('monet');
            context.setMonetBackgroundTuning({ backgroundLayout: 'half-pane-gradient' });
            return true;
        },
    },
    {
        id: 'background-latent',
        group: 'visualizer',
        title: 'Background: Latent',
        description: 'Switch background to cover-colored audio-reactive shaders',
        keywords: ['latent', 'shader', 'mesh', 'dithering', '隐现', '着色器', 'yx', '背景切换到隐现', '背景切换到 Latent'],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('latent');
            return true;
        },
    },
    {
        id: 'background-latent-dithering',
        group: 'visualizer',
        title: 'Latent: Pixel',
        description: 'Show only the Dithering layer',
        keywords: ['latent dithering', 'latent pixel', '隐现像素', '像素层', 'yxss', '背景切换到隐现：像素'],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('latent');
            context.setLatentBackgroundTuning({ displayMode: 'dithering' });
            return true;
        },
    },
    {
        id: 'background-latent-mesh',
        group: 'visualizer',
        title: 'Latent: Fluid',
        description: 'Show only the MeshGradient layer',
        keywords: ['latent mesh', 'latent fluid', '隐现流体', '流体层', 'yxlt', '背景切换到隐现：流体'],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('latent');
            context.setLatentBackgroundTuning({ displayMode: 'mesh' });
            return true;
        },
    },
    {
        id: 'background-latent-both',
        group: 'visualizer',
        title: 'Latent: Mixed',
        description: 'Show both shader layers',
        keywords: ['latent both', 'latent mixed', '隐现混合', '混合层', 'yxhh', '背景切换到隐现：混合'],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('latent');
            context.setLatentBackgroundTuning({ displayMode: 'both' });
            return true;
        },
    },
    ...NOMAND_BACKGROUND_COMMANDS,
    {
        id: 'settings-toggle-smart-atmosphere',
        group: 'visualizer',
        title: 'Toggle smart atmosphere',
        description: 'Enable or disable local beat / bass / camera-punch drive',
        keywords: [
            'smart atmosphere',
            'atmosphere',
            'beat drive',
            '智能氛围',
            '氛围',
            '节拍驱动',
            'zhinengfenwei',
            'znfw',
            'fw',
        ],
        execute: (_input, context) => {
            context.toggleSmartAtmosphere();
            return true;
        },
    },
    {
        id: 'open-local-beat-analysis',
        group: 'visualizer',
        title: 'Local beat analysis',
        description: 'Run offline rhythm analysis for the current track using the algorithm from Settings',
        keywords: [
            'local beat',
            'beat analysis',
            'cinema analysis',
            'strong beat',
            '本地节奏',
            '节奏分析',
            '电影视角',
            '强节奏',
            'bendifenxi',
            'jiezhou',
        ],
        execute: (_input, context) => context.openLocalBeatAnalysis(),
    },
    {
        id: 'settings-local-beat-mode-mr',
        group: 'playback',
        title: 'Local beat: Cinema',
        description: 'Use everyday cinema-style rhythm analysis for local tracks',
        keywords: [
            'local beat cinema',
            'cinema mode',
            'beat analysis cinema',
            '本地节奏电影视角',
            '电影视角',
            '综合节奏',
            'bendifenxidianying',
            'dianyingshijiao',
        ],
        execute: (_input, context) => {
            context.setLocalBeatAnalysisMode('mr');
            return true;
        },
    },
    {
        id: 'settings-local-beat-mode-dj',
        group: 'playback',
        title: 'Local beat: Strong beat',
        description: 'Use low-band lock analysis for long mixes and kick-heavy tracks',
        keywords: [
            'local beat pulse',
            'strong beat',
            'beat analysis pulse',
            '本地节奏强节奏',
            '强节奏',
            '长混音',
            '低频锁拍',
            'bendifenxiqiang',
            'qiangjiezou',
        ],
        execute: (_input, context) => {
            context.setLocalBeatAnalysisMode('dj');
            return true;
        },
    },
    {
        id: 'settings-local-beat-prompt-auto',
        group: 'playback',
        title: 'Local beat: Analyze in background',
        description: 'Silently analyze local tracks while playing — no dialog',
        keywords: [
            'local beat auto',
            'silent beat analysis',
            'no beat dialog',
            '后台节奏分析',
            '静默分析',
            '不弹窗',
            'houtaifenxi',
        ],
        execute: (_input, context) => {
            context.setLocalBeatAnalysisPromptPolicy('auto');
            return true;
        },
    },
    {
        id: 'settings-local-beat-prompt-ask',
        group: 'playback',
        title: 'Local beat: Ask before analyzing',
        description: 'Show a confirmation dialog before analyzing local tracks',
        keywords: [
            'local beat ask',
            'prompt beat analysis',
            '播放时询问',
            '节奏弹窗',
            '询问分析',
            'xunwenfenxi',
        ],
        execute: (_input, context) => {
            context.setLocalBeatAnalysisPromptPolicy('ask');
            return true;
        },
    },
    {
        id: 'settings-toggle-bilibili-video-background',
        group: 'playback',
        title: 'Toggle Bilibili video background',
        description: 'Show or hide muted Bilibili video under lyrics while playing',
        keywords: [
            'bilibili video',
            'bilibili background',
            'video background',
            'B站视频',
            'B站背景',
            '视频背景',
            'bizhan',
            'bizhanshipin',
            'b站视频',
            'bilibili',
        ],
        execute: (_input, context) => {
            context.toggleBilibiliVideoBackground();
            return true;
        },
    },
    {
        id: 'background-common',
        group: 'visualizer',
        title: 'Background: Common',
        description: 'Switch background to general layout',
        keywords: ['background common', 'background general', 'common', 'general', '通用背景', 'tybj', 'ty', '背景切换到 通用', '背景切换到通用'],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('common');
            return true;
        },
    },
    {
        id: 'background-url',
        group: 'visualizer',
        title: 'Background: Embedded Background',
        description: 'Switch background to embedded webpage mode',
        keywords: ['embedded background', 'embed background', 'background embed', 'background url', 'url background', 'url', 'webpage', '嵌入背景', '网页背景', 'qianrubeijing', 'qrbj', 'wybj', '背景切换到 嵌入背景', '背景切换到嵌入背景'],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('url');
            return true;
        },
    },
    {
        id: 'background-sora',
        group: 'visualizer',
        title: 'Background: Sora',
        description: 'Switch background to Sora (starry sky) layout',
        keywords: ['sora', 'background sora', 'starry sky', 'star', '星空', '空', 'kong', 'xingkong', 'xk', '背景切换到 空', '背景切换到空', '背景切换到Sora', '背景切换到星空'],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('sora');
            return true;
        },
    },
    {
        id: 'background-turntable',
        group: 'visualizer',
        title: 'Background: Turntable',
        description: 'Switch background to vinyl turntable disc',
        keywords: [
            'turntable',
            'vinyl',
            'record',
            'disc',
            '唱盘',
            '唱片',
            '黑胶',
            'changpan',
            'changpian',
            'heijiao',
            'cp',
            '背景切换到唱盘',
            '背景切换到 唱盘',
            '背景切换到唱片',
        ],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('turntable');
            return true;
        },
    },
    {
        id: 'settings-toggle-transparent',
        group: 'settings',
        title: 'Toggle transparency',
        description: 'Toggle transparent player background',
        keywords: ['transparent', 'transparency', '透明', '透明化', 'touming', 'touminghua', 'tm', 'tmh'],
        execute: (_input, context) => {
            context.toggleTransparentBackground();
            return true;
        },
    },
    {
        id: 'settings-toggle-daylight',
        group: 'settings',
        title: 'Toggle light/dark',
        description: 'Toggle theme daylight/midnight mode',
        keywords: ['daylight', 'midnight', 'light', 'dark', '明暗', '切换明暗', '日夜', '日间', '夜间', 'qiehuanmingan', 'ry', 'rj', 'yj'],
        execute: (_input, context) => {
            context.toggleDaylightMode();
            return true;
        },
    },
    {
        id: 'settings-toggle-bottom-subtitle-overlay',
        group: 'settings',
        title: 'Toggle bottom subtitle overlay',
        description: 'Show or hide the whole bottom subtitle overlay',
        keywords: [
            'bottom subtitle overlay',
            'subtitle overlay',
            'hide subtitle overlay',
            'show subtitle overlay',
            'bottom subtitles',
            'hide bottom subtitles',
            '底部字幕层',
            '隐藏底部字幕层',
            '显示底部字幕层',
            '底部字幕',
            '隐藏底部字幕',
            '显示底部字幕',
            'zimu ceng',
            'dibuzimu',
            'dibuzimuceng',
            'yincang dibuzimu',
            'xianshi dibuzimu',
            'dbzm',
            'dbzmc',
            'ycdbzm',
            'xsdbzm',
        ],
        execute: (_input, context) => {
            context.toggleBottomSubtitleOverlay();
            return true;
        },
    },
    {
        id: 'settings-toggle-subtitle-translation',
        group: 'settings',
        title: 'Toggle subtitle translation',
        description: 'Show or hide translation text in visualizer subtitles',
        keywords: [
            'subtitle translation',
            'translation subtitle',
            'show subtitle translation',
            'hide subtitle translation',
            'lyrics translation',
            'caption translation',
            '字幕翻译',
            '显示翻译',
            '隐藏翻译',
            '翻译字幕',
            '歌词翻译',
            'zimu fanyi',
            'xianshi fanyi',
            'yincang fanyi',
            'fanyi zimu',
            'geci fanyi',
            'zmfy',
            'xsfy',
            'ycfy',
            'gc fy',
        ],
        execute: (_input, context) => {
            context.toggleSubtitleTranslation();
            return true;
        },
    },
    {
        id: 'settings-cycle-subtitle-content-mode',
        group: 'settings',
        title: 'Cycle subtitle content mode',
        description: 'Switch between translation and romanization subtitle modes',
        keywords: [
            'subtitle translation',
            'subtitle romanization',
            'romanized lyrics',
            'romaji',
            '副字幕',
            '罗马音',
            '罗马字',
            '字幕翻译',
            'luomayin',
            'lmy',
            'fzm',
        ],
        execute: (_input, context) => {
            context.cycleSubtitleContentMode();
            return true;
        },
    },
    createAppLanguageCommand('settings-language-system', 'system', 'Follow system language', 'Use the browser or system language', ['system language', 'follow system', 'auto language', '跟随系统', '系统语言', 'gensuixitong', 'xitongyuyan', 'gsxt', 'xtyy']),
    createAppLanguageCommand('settings-language-zh-CN', 'zh-CN', 'Switch language to Chinese', 'Use Simplified Chinese in the interface', ['chinese', 'simplified chinese', '中文', '简体中文', 'zhongwen', 'jiantizhongwen', 'zw', 'jtzw']),
    createAppLanguageCommand('settings-language-en', 'en', 'Switch language to English', 'Use English in the interface', ['english', 'interface english', '英文', 'yingwen', 'yw']),

];

export const getQueueSongMatches = (query: string, context: CommandPaletteContext): CommandPaletteMatch[] => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
        return context.playQueue.slice(0, MAX_COMMAND_MATCHES).map((song, index) => ({
            command: createQueueSongCommand(song, index, context),
            score: 100 - index,
            input: '',
        }));
    }

    return evaluateQueueQuery(context.playQueue, query).matches
        .slice(0, MAX_COMMAND_MATCHES)
        .map(match => ({
            command: createQueueSongCommand(match.song, match.index, context),
            score: match.score,
            input: query,
        }));
};

const createQueueSongCommand = (
    song: SongResult,
    index: number,
    context: CommandPaletteContext
): CommandPaletteCommand => ({
    id: `queue-song-${index}-${song.id}`,
    group: 'playback',
    title: song.name,
    description: buildQueueSongDescription(song, index, context),
    keywords: [`#${index + 1}`],
    execute: async (_input, commandContext) => {
        await commandContext.playSong(song, commandContext.playQueue);
        return true;
    },
});

export const getCommandPaletteMatches = (
    query: string,
    context?: CommandPaletteContext,
    recentCommandIds: string[] = []
): CommandPaletteMatch[] => {
    const normalizedQuery = normalize(query);

    const filteredCommands = COMMAND_PALETTE_COMMANDS.filter(command => {
        if (command.id === 'search-navidrome'
            || command.id === 'home-navidrome'
            || command.id === 'panel-navi') {
            return isNavidromeUiEnabled();
        }

        if (command.id === 'settings-discord-presence') {
            return isDiscordPresenceUiEnabled();
        }

        if (command.id === 'settings-desktop') {
            const isWebBrowser = typeof window !== 'undefined';
            const isElectron = isWebBrowser && Boolean((window as any).electron);
            if (isWebBrowser && !isElectron) {
                return false;
            }
        }

        if (
            command.id === 'desktop-lyrics-toggle'
            || command.id === 'desktop-lyrics-lock-toggle'
            || command.id === 'open-download-directory'
            || command.id === 'download-current-song'
            || command.id === 'download-search-results'
            || command.id === 'toggle-auto-resync-download-folder'
        ) {
            const isWebBrowser = typeof window !== 'undefined';
            const isElectron = isWebBrowser && Boolean((window as any).electron);
            if (isWebBrowser && !isElectron) {
                return false;
            }
        }

        if (command.id === 'playback-auto-match-best-lyric') {
            return Boolean(context?.enableAlternativeLyricSources);
        }

        if (command.id === 'theme-generate-current') {
            return context ? context.canGenerateAITheme && !context.isGeneratingTheme : true;
        }

        if (command.id === 'theme-quick-editor') {
            return context ? context.canOpenThemeQuickEditor : true;
        }

        if (command.group === 'search') {
            if (command.id === 'search-current') return true;
            if (context) {
                return false;
            }
        }
        return true;
    });

    if (!normalizedQuery) {
        const recentCommands = recentCommandIds
            .map(commandId => filteredCommands.find(command => command.id === commandId))
            .filter((command): command is CommandPaletteCommand => Boolean(command) && !command.requiresInput);
        const recentCommandIdSet = new Set(recentCommands.map(command => command.id));
        const defaultCommands = filteredCommands.filter(command => !recentCommandIdSet.has(command.id));

        return [...recentCommands, ...defaultCommands].slice(0, MAX_COMMAND_MATCHES).map((command, index) => ({
            command,
            score: recentCommandIdSet.has(command.id) ? 130 - index : 100 - index,
            input: '',
        }));
    }

    const matches = filteredCommands
        .map(command => {
            let bestScore = 0;
            let bestInput = '';

            for (const keyword of command.keywords) {
                const normalizedKeyword = normalize(keyword);
                if (normalizedQuery === normalizedKeyword) {
                    bestScore = Math.max(bestScore, 120);
                } else if (normalizedKeyword.startsWith(normalizedQuery)) {
                    bestScore = Math.max(bestScore, 100 - normalizedKeyword.length);
                } else if (normalizedQuery.startsWith(`${normalizedKeyword} `)) {
                    bestScore = Math.max(bestScore, 90 + normalizedKeyword.length + (command.requiresInput ? 20 : 0));
                    bestInput = query.trim().slice(keyword.length).trim();
                } else if (normalizedKeyword.includes(normalizedQuery)) {
                    bestScore = Math.max(bestScore, 60 - normalizedKeyword.indexOf(normalizedQuery));
                }
            }

            return bestScore > 0 ? { command, score: bestScore, input: bestInput } : null;
        })
        .filter((match): match is CommandPaletteMatch => Boolean(match))
        .sort((a, b) => b.score - a.score || a.command.title.localeCompare(b.command.title));

    return matches.slice(0, MAX_COMMAND_MATCHES);
};
