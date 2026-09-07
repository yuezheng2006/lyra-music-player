import { describe, expect, it, vi } from 'vitest';
import { PlayerState } from '../../../src/types';
import { getCommandPaletteMatches, getQueueSongMatches } from '../../../src/components/command-palette/commandRegistry';
import type { CommandPaletteContext } from '../../../src/components/command-palette/types';
import { useAddToPlaylistStore } from '../../../src/stores/useAddToPlaylistStore';

const createContext = (overrides: Partial<CommandPaletteContext> = {}): CommandPaletteContext => ({
    currentSearchSourceTab: 'playlist',
    localSongs: [],
    playerState: PlayerState.PAUSED,
    t: (_key, fallback) => fallback ?? '',
    openSettings: vi.fn(),
    navigateToHome: vi.fn(),
    navigateDirectHome: vi.fn(),
    navigateToPlayer: vi.fn(),
    navigateToSearch: vi.fn(),
    toggleImmersiveFullscreen: vi.fn(() => true),
    setHomeViewTab: vi.fn(),
    setPanelTab: vi.fn(),
    setIsPanelOpen: vi.fn(),
    submitSearch: vi.fn(async () => true),
    togglePlay: vi.fn(),
    toggleLoop: vi.fn(),
    handleNextTrack: vi.fn(),
    handlePrevTrack: vi.fn(),
    adjustVolumeByStep: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    shuffleQueue: vi.fn(),
    currentSong: null,
    replacePlayQueue: vi.fn(() => true),
    canGenerateAITheme: true,
    isGeneratingTheme: false,
    generateAITheme: vi.fn(),
    setVisualizerMode: vi.fn(),
    setLyricWordMode: vi.fn(),
    setVisualizerBackgroundMode: vi.fn(),
    setMonetBackgroundTuning: vi.fn(),
    setLatentBackgroundTuning: vi.fn(),
    setNomandBackgroundTuning: vi.fn(),
    toggleTransparentBackground: vi.fn(),
    hideBottomSubtitleOverlay: false,
    toggleBottomSubtitleOverlay: vi.fn(),
    showSubtitleTranslation: true,
    toggleSubtitleTranslation: vi.fn(),
    subtitleContentMode: 'translation',
    cycleSubtitleContentMode: vi.fn(),
    toggleDaylightMode: vi.fn(),
    enableSmartAtmosphere: true,
    toggleSmartAtmosphere: vi.fn(),
    openLocalBeatAnalysis: vi.fn(() => true),
    setLocalBeatAnalysisMode: vi.fn(),
    setLocalBeatAnalysisPromptPolicy: vi.fn(),
    setAppLanguagePreference: vi.fn(async () => undefined),
    enableAlternativeLyricSources: false,
    runAutoMatchBestLyric: vi.fn(async () => true),
    setIsUserGuideModalOpen: vi.fn(),
    setIsShortcutsCheatSheetOpen: vi.fn(),
    setIsOnboardingOpen: vi.fn(),
    setIsWhatsNewOpen: vi.fn(),
    openThemeQuickEditor: vi.fn(),
    canOpenThemeQuickEditor: true,
    playQueue: [],
    playSong: vi.fn(),
    startNeteasePersonalFm: vi.fn(async () => true),
    startNeteaseHeartbeat: vi.fn(async () => true),
    toggleDesktopLyrics: vi.fn(async () => true),
    setDesktopLyricsLocked: vi.fn(async () => true),
    desktopLyricsEnabled: false,
    desktopLyricsLocked: true,
    setDesktopLyricsYFactor: vi.fn(),
    downloadCurrentSong: vi.fn(async () => true),
    downloadSearchResults: vi.fn(async () => true),
    startVideoExport: vi.fn(),
    isElectronWindow: false,
    setLyricEffectPackId: vi.fn(),
    enableBilibiliVideoBackground: true,
    toggleBilibiliVideoBackground: vi.fn(),
    ...overrides,
});

describe('command palette registry', () => {
    it('parses source-specific search input', async () => {
        const context = createContext();
        const [match] = getCommandPaletteMatches('local touhou');

        expect(match.command.id).toBe('search-local');
        expect(match.input).toBe('touhou');

        await match.command.execute(match.input, context);

        expect(context.submitSearch).toHaveBeenCalledWith(expect.objectContaining({
            query: 'touhou',
            sourceTab: 'local',
            returnView: 'player',
        }));
        expect(context.navigateToSearch).toHaveBeenCalledWith(expect.objectContaining({
            query: 'touhou',
            sourceTab: 'local',
            returnView: 'player',
        }));
    });

    it('opens settings subviews through the settings command', () => {
        const context = createContext();
        const [match] = getCommandPaletteMatches('integration');

        expect(match.command.id).toBe('settings-integration');
        match.command.execute(match.input, context);

        expect(context.openSettings).toHaveBeenCalledWith('options', 'integration');
    });

    it('opens Now Playing pairing through a dedicated settings command', () => {
        const context = createContext();
        const [match] = getCommandPaletteMatches('9863');

        expect(match.command.id).toBe('settings-now-playing');
        match.command.execute(match.input, context);

        expect(context.openSettings).toHaveBeenCalledWith('options', 'integration');
    });

    it('opens the account panel for Qishui login', () => {
        const context = createContext();
        const [match] = getCommandPaletteMatches('汽水扫码');

        expect(match.command.id).toBe('qishui-scan-login');
        match.command.execute(match.input, context);

        expect(context.setPanelTab).toHaveBeenCalledWith('account');
        expect(context.setIsPanelOpen).toHaveBeenCalledWith(true);
    });

    it('opens the account panel for Kugou login', () => {
        const context = createContext();
        const [match] = getCommandPaletteMatches('酷狗扫码');

        expect(match.command.id).toBe('kugou-scan-login');
        match.command.execute(match.input, context);

        expect(context.setPanelTab).toHaveBeenCalledWith('account');
        expect(context.setIsPanelOpen).toHaveBeenCalledWith(true);
    });

    it('adjusts volume and mute from playback commands', () => {
        const context = createContext();
        const [up] = getCommandPaletteMatches('音量加');
        const [down] = getCommandPaletteMatches('volume down');
        const [mute] = getCommandPaletteMatches('静音');

        expect(up.command.id).toBe('playback-volume-up');
        expect(down.command.id).toBe('playback-volume-down');
        expect(mute.command.id).toBe('playback-toggle-mute');

        up.command.execute(up.input, context);
        down.command.execute(down.input, context);
        mute.command.execute(mute.input, context);

        expect(context.adjustVolumeByStep).toHaveBeenCalledWith(0.05);
        expect(context.adjustVolumeByStep).toHaveBeenCalledWith(-0.05);
        expect(context.toggleMute).toHaveBeenCalled();
    });

    it('opens official charts from the home-charts command', () => {
        const context = createContext();
        const [match] = getCommandPaletteMatches('排行榜');

        expect(match.command.id).toBe('home-charts');
        match.command.execute(match.input, context);

        expect(context.setHomeViewTab).toHaveBeenCalledWith('charts');
        expect(context.navigateDirectHome).toHaveBeenCalled();
    });

    it('opens the combined search and charts tab from 搜歌', () => {
        const [match] = getCommandPaletteMatches('搜歌');
        expect(match.command.id).toBe('home-charts');
    });

    it('opens signed-in playlists from the home-playlist command', () => {
        const [match] = getCommandPaletteMatches('资料库');
        expect(match.command.id).toBe('home-playlist');
    });

    it('opens podcasts and play history from dedicated home-tab commands', () => {
        const context = createContext();

        const [podcastMatch] = getCommandPaletteMatches('播客');
        expect(podcastMatch.command.id).toBe('home-podcast');
        podcastMatch.command.execute('', context);
        expect(context.setHomeViewTab).toHaveBeenCalledWith('podcast');

        const [historyMatch] = getCommandPaletteMatches('播放历史');
        expect(historyMatch.command.id).toBe('home-history');
        historyMatch.command.execute('', context);
        expect(context.setHomeViewTab).toHaveBeenCalledWith('history');
    });

    it('opens the shortcuts cheat sheet from the show-shortcuts command', () => {
        const context = createContext();
        const [match] = getCommandPaletteMatches('快捷键');

        expect(match.command.id).toBe('show-shortcuts');
        match.command.execute(match.input, context);

        expect(context.setIsShortcutsCheatSheetOpen).toHaveBeenCalledWith(true);
    });

    it('opens general settings and executes direct language switch commands', async () => {
        const context = createContext();

        const [generalMatch] = getCommandPaletteMatches('通用');
        expect(generalMatch.command.id).toBe('settings-general');
        generalMatch.command.execute(generalMatch.input, context);
        expect(context.openSettings).toHaveBeenCalledWith('options', 'general');

        const [systemLanguageMatch] = getCommandPaletteMatches('跟随系统');
        expect(systemLanguageMatch.command.id).toBe('settings-language-system');
        await systemLanguageMatch.command.execute(systemLanguageMatch.input, context);
        expect(context.setAppLanguagePreference).toHaveBeenCalledWith('system');

        const [englishMatch] = getCommandPaletteMatches('english');
        expect(englishMatch.command.id).toBe('settings-language-en');
        await englishMatch.command.execute(englishMatch.input, context);
        expect(context.setAppLanguagePreference).toHaveBeenCalledWith('en');
    });

    it('previews recognized search commands with parsed input', () => {
        const translations: Record<string, string> = {
            'commandPalette.previewSearch': '搜索{{source}}歌曲：{{query}}',
            'commandPalette.sourceCurrent': '当前来源',
        };
        const context = createContext({
            t: (key, fallback) => translations[key] ?? fallback ?? '',
        });
        const [match] = getCommandPaletteMatches('search 你好世界');

        expect(match.command.id).toBe('search-current');
        expect(match.input).toBe('你好世界');
        expect(match.command.getPreview?.(match.input, context)).toBe('搜索当前来源歌曲：你好世界');
    });

    it('does not preview search commands before input is provided', () => {
        const context = createContext();
        const [match] = getCommandPaletteMatches('search');

        expect(match.command.id).toBe('search-current');
        expect(match.input).toBe('');
        expect(match.command.getPreview?.(match.input, context)).toBeNull();
    });

    it('matches commands by Chinese keyword and pinyin', () => {
        expect(getCommandPaletteMatches('本地 bad apple')[0].command.id).toBe('search-local');
        expect(getCommandPaletteMatches('bendi bad apple')[0].command.id).toBe('search-local');
        expect(getCommandPaletteMatches('设置')[0].command.id).toBe('settings-options');
        expect(getCommandPaletteMatches('shezhi')[0].command.id).toBe('settings-options');
        expect(getCommandPaletteMatches('心象')[0].command.id).toBe('visualizer-cadenza');
        expect(getCommandPaletteMatches('xinxiang')[0].command.id).toBe('visualizer-cadenza');
        expect(getCommandPaletteMatches('野火').some(match => match.command.id === 'visualizer-dazibao')).toBe(false);
        expect(getCommandPaletteMatches('自动续播')[0].command.id).toBe('toggle-auto-play-on-launch');
        expect(getCommandPaletteMatches('时计')[0].command.id).toBe('visualizer-pendolo');
        expect(getCommandPaletteMatches('slptmr')[0].command.id).toBe('sleep-timer');
    });

    it('executes transparent player background and daylight theme toggle commands', () => {
        const context = createContext();

        const [matchTransparent] = getCommandPaletteMatches('透明化');
        expect(matchTransparent.command.id).toBe('settings-toggle-transparent');
        matchTransparent.command.execute(matchTransparent.input, context);
        expect(context.toggleTransparentBackground).toHaveBeenCalled();

        const [matchDaylight] = getCommandPaletteMatches('切换明暗');
        expect(matchDaylight.command.id).toBe('settings-toggle-daylight');
        matchDaylight.command.execute(matchDaylight.input, context);
        expect(context.toggleDaylightMode).toHaveBeenCalled();

        const [matchBottomSubtitleOverlay] = getCommandPaletteMatches('隐藏底部字幕层');
        expect(matchBottomSubtitleOverlay.command.id).toBe('settings-toggle-bottom-subtitle-overlay');
        matchBottomSubtitleOverlay.command.execute(matchBottomSubtitleOverlay.input, context);
        expect(context.toggleBottomSubtitleOverlay).toHaveBeenCalled();

        const [matchSubtitleTranslation] = getCommandPaletteMatches('隐藏翻译');
        expect(matchSubtitleTranslation.command.id).toBe('settings-toggle-subtitle-translation');
        matchSubtitleTranslation.command.execute(matchSubtitleTranslation.input, context);
        expect(context.toggleSubtitleTranslation).toHaveBeenCalled();

        const [matchSubtitleContentMode] = getCommandPaletteMatches('罗马音');
        expect(matchSubtitleContentMode.command.id).toBe('settings-cycle-subtitle-content-mode');
        matchSubtitleContentMode.command.execute(matchSubtitleContentMode.input, context);
        expect(context.cycleSubtitleContentMode).toHaveBeenCalled();
    });

    it('executes the current song AI theme generation command', () => {
        const context = createContext();

        const [match] = getCommandPaletteMatches('生成AI主题', context);
        expect(match.command.id).toBe('theme-generate-current');

        match.command.execute(match.input, context);
        expect(context.generateAITheme).toHaveBeenCalled();
    });

    it('hides the AI theme generation command when unavailable or already running', () => {
        expect(getCommandPaletteMatches('生成AI主题', createContext({
            canGenerateAITheme: false,
        })).some(match => match.command.id === 'theme-generate-current')).toBe(false);

        expect(getCommandPaletteMatches('生成AI主题', createContext({
            isGeneratingTheme: true,
        })).some(match => match.command.id === 'theme-generate-current')).toBe(false);
    });

    it('executes the current editable theme quick editor command', () => {
        const context = createContext();

        const [match] = getCommandPaletteMatches('快速主题编辑器', context);
        expect(match.command.id).toBe('theme-quick-editor');

        match.command.execute(match.input, context);
        expect(context.openThemeQuickEditor).toHaveBeenCalled();
    });

    it('hides the theme quick editor command when no editable theme is available', () => {
        expect(getCommandPaletteMatches('快速主题编辑器', createContext({
            canOpenThemeQuickEditor: false,
        })).some(match => match.command.id === 'theme-quick-editor')).toBe(false);
    });

    it('filters out non-current search commands when context is provided', () => {
        const context = createContext({ currentSearchSourceTab: 'local' });

        const matches = getCommandPaletteMatches('search touhou', context);
        const searchMatches = matches.filter(m => m.command.group === 'search');

        expect(searchMatches).toHaveLength(1);
        expect(searchMatches[0].command.id).toBe('search-current');
    });

    it('returns all search commands when context is not provided', () => {
        const matches = getCommandPaletteMatches('search');
        const searchMatches = matches.filter(m => m.command.group === 'search');
        // All search-* titles contain "Search", so they rank together.
        // search-navidrome is gated behind NAVIDROME_UI_ENABLED.
        expect(searchMatches.map(match => match.command.id).sort()).toEqual([
            'search-bilibili',
            'search-coco',
            'search-current',
            'search-kugou',
            'search-kuwo',
            'search-local',
            'search-netease',
            'search-qishui',
            'search-qq',
        ]);
        expect(searchMatches[0].command.id).toBe('search-current');
    });

    it('matches and executes color/theme-park command', () => {
        const context = createContext();
        
        const matchesColor = getCommandPaletteMatches('color');
        expect(matchesColor[0].command.id).toBe('settings-theme-park');
        
        const matchesPeise = getCommandPaletteMatches('配色');
        expect(matchesPeise[0].command.id).toBe('settings-theme-park');

        const matchesZhuti = getCommandPaletteMatches('zhutigongyuan');
        expect(matchesZhuti[0].command.id).toBe('settings-theme-park');

        matchesColor[0].command.execute('', context);
        expect(context.openSettings).toHaveBeenCalledWith('options', 'themePark');
    });

    it('executes navigation commands', async () => {
        const context = createContext();
        
        const [matchHome] = getCommandPaletteMatches('home');
        expect(matchHome.command.id).toBe('navigate-home');
        matchHome.command.execute('', context);
        expect(context.setHomeViewTab).toHaveBeenCalledWith('charts');
        expect(context.navigateDirectHome).toHaveBeenCalled();

        const [matchPlayer] = getCommandPaletteMatches('player');
        expect(matchPlayer.command.id).toBe('navigate-player');
        matchPlayer.command.execute('', context);
        expect(context.navigateToPlayer).toHaveBeenCalled();

        const [matchFullscreen] = getCommandPaletteMatches('全屏播放');
        expect(matchFullscreen.command.id).toBe('immersive-fullscreen');
        matchFullscreen.command.execute('', context);
        expect(context.toggleImmersiveFullscreen).toHaveBeenCalled();
    });

    it('executes home tab navigation commands', () => {
        const context = createContext();
        
        const [matchLocalTab] = getCommandPaletteMatches('local music');
        expect(matchLocalTab.command.id).toBe('home-local');
        matchLocalTab.command.execute('', context);
        expect(context.setHomeViewTab).toHaveBeenCalledWith('local');
        expect(context.navigateDirectHome).toHaveBeenCalled();
    });

    it('executes playback controls', () => {
        const context = createContext({ playerState: PlayerState.PAUSED });
        
        const [matchPlay] = getCommandPaletteMatches('play');
        expect(matchPlay.command.id).toBe('playback-play');
        matchPlay.command.execute('', context);
        expect(context.togglePlay).toHaveBeenCalled();

        const contextPlaying = createContext({ playerState: PlayerState.PLAYING });
        const [matchPause] = getCommandPaletteMatches('pause');
        expect(matchPause.command.id).toBe('playback-pause');
        matchPause.command.execute('', contextPlaying);
        expect(contextPlaying.togglePlay).toHaveBeenCalled();
        
        const [matchNext] = getCommandPaletteMatches('next');
        expect(matchNext.command.id).toBe('playback-next');
        matchNext.command.execute('', context);
        expect(context.handleNextTrack).toHaveBeenCalled();

        const [matchPrev] = getCommandPaletteMatches('prev');
        expect(matchPrev.command.id).toBe('playback-prev');
        matchPrev.command.execute('', context);
        expect(context.handlePrevTrack).toHaveBeenCalled();

        const [matchLoop] = getCommandPaletteMatches('loop');
        expect(matchLoop.command.id).toBe('playback-loop');
        matchLoop.command.execute('', context);
        expect(context.toggleLoop).toHaveBeenCalled();

        const [matchShuffle] = getCommandPaletteMatches('shuffle');
        expect(matchShuffle.command.id).toBe('playback-shuffle');
        matchShuffle.command.execute('', context);
        expect(context.shuffleQueue).toHaveBeenCalled();
    });

    it('opens add-to-playlist from a global command when the host says it can add', () => {
        useAddToPlaylistStore.setState({
            isOpen: false,
            availability: { isApplicable: true, canAdd: true },
        });

        try {
            const context = createContext();
            const [match] = getCommandPaletteMatches('添加到歌单', context);
            expect(match.command.id).toBe('playback-add-to-playlist');
            expect(match.command.execute('', context)).toBe(true);
            expect(useAddToPlaylistStore.getState().isOpen).toBe(true);
        } finally {
            useAddToPlaylistStore.setState({
                isOpen: false,
                availability: { isApplicable: false, canAdd: false },
            });
        }
    });

    it('hides add-to-playlist when the current song cannot go in a playlist', () => {
        const context = createContext();
        expect(
            getCommandPaletteMatches('添加到歌单', context).some(match => match.command.id === 'playback-add-to-playlist'),
        ).toBe(false);
    });

    it('starts video export from command palette in electron only', () => {
        const webContext = createContext({ isElectronWindow: false });
        const [webMatch] = getCommandPaletteMatches('录制');
        expect(webMatch.command.id).toBe('record-current-playback');
        expect(webMatch.command.execute('', webContext)).toBe(false);
        expect(webContext.startVideoExport).not.toHaveBeenCalled();

        const electronContext = createContext({ isElectronWindow: true });
        const [electronMatch] = getCommandPaletteMatches('luping');
        expect(electronMatch.command.id).toBe('record-current-playback');
        expect(electronMatch.command.execute('', electronContext)).toBe(true);
        expect(electronContext.startVideoExport).toHaveBeenCalledWith('from-start');
    });

    it('shows best lyric auto-match command only when alternative lyric sources are enabled', async () => {
        const disabledContext = createContext({ enableAlternativeLyricSources: false });
        expect(getCommandPaletteMatches('最佳歌词', disabledContext).some(match => match.command.id === 'playback-auto-match-best-lyric')).toBe(false);

        const enabledContext = createContext({ enableAlternativeLyricSources: true });
        const [match] = getCommandPaletteMatches('最佳歌词', enabledContext);
        expect(match.command.id).toBe('playback-auto-match-best-lyric');

        await match.command.execute(match.input, enabledContext);
        expect(enabledContext.runAutoMatchBestLyric).toHaveBeenCalled();
    });

    it('filters out settings-desktop command in a web browser environment without electron', () => {
        vi.stubGlobal('window', {});

        try {
            const matches = getCommandPaletteMatches('desktop');
            const hasDesktopCommand = matches.some(m => m.command.id === 'settings-desktop');
            expect(hasDesktopCommand).toBe(false);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('retains settings-desktop command in desktop app environment', () => {
        vi.stubGlobal('window', { electron: {} });

        try {
            const matches = getCommandPaletteMatches('desktop');
            const hasDesktopCommand = matches.some(m => m.command.id === 'settings-desktop');
            expect(hasDesktopCommand).toBe(true);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('limits suggestions to ten commands', () => {
        expect(getCommandPaletteMatches('')).toHaveLength(10);
    });

    it('hides Discord presence command while UI flag is off', () => {
        const matches = getCommandPaletteMatches('discord');
        expect(matches.some(match => match.command.id === 'settings-discord-presence')).toBe(false);
    });

    it('hides Navidrome commands while UI flag is off', () => {
        const matches = getCommandPaletteMatches('navidrome');
        expect(matches.some(match => match.command.id === 'search-navidrome')).toBe(false);
        expect(matches.some(match => match.command.id === 'home-navidrome')).toBe(false);
        expect(matches.some(match => match.command.id === 'panel-navi')).toBe(false);
    });

    it('matches and executes background and visualizer monet switching commands', () => {
        const context = createContext();

        const [matchMonet] = getCommandPaletteMatches('切换到可视化：莫奈');
        expect(matchMonet.command.id).toBe('visualizer-monet');
        matchMonet.command.execute('', context);
        expect(context.setVisualizerMode).toHaveBeenCalledWith('monet');

        const [matchKaraokeWord] = getCommandPaletteMatches('k歌逐字');
        expect(matchKaraokeWord.command.id).toBe('lyric-word-mode-karaoke');
        matchKaraokeWord.command.execute('', context);
        expect(context.setLyricWordMode).toHaveBeenCalledWith('karaoke');

        const [matchKtvWipe] = getCommandPaletteMatches('传统k歌');
        expect(matchKtvWipe.command.id).toBe('lyric-word-mode-karaoke');
        matchKtvWipe.command.execute('', context);
        expect(context.setLyricWordMode).toHaveBeenCalledWith('karaoke');

        const [matchFullOverlay] = getCommandPaletteMatches('全屏叠色');
        expect(matchFullOverlay.command.id).toBe('background-monet-full-overlay');
        matchFullOverlay.command.execute('', context);
        expect(context.setVisualizerBackgroundMode).toHaveBeenCalledWith('monet');
        expect(context.setMonetBackgroundTuning).toHaveBeenCalledWith({ backgroundLayout: 'full-overlay' });

        const [matchHalfGradient] = getCommandPaletteMatches('半屏渐变');
        expect(matchHalfGradient.command.id).toBe('background-monet-half-gradient');
        matchHalfGradient.command.execute('', context);
        expect(context.setVisualizerBackgroundMode).toHaveBeenCalledWith('monet');
        expect(context.setMonetBackgroundTuning).toHaveBeenCalledWith({ backgroundLayout: 'half-pane-gradient' });

        const [matchCommon] = getCommandPaletteMatches('通用背景');
        expect(matchCommon.command.id).toBe('background-common');
        matchCommon.command.execute('', context);
        expect(context.setVisualizerBackgroundMode).toHaveBeenCalledWith('common');

        const [matchLatent] = getCommandPaletteMatches('隐现');
        expect(matchLatent.command.id).toBe('background-latent');
        matchLatent.command.execute('', context);
        expect(context.setVisualizerBackgroundMode).toHaveBeenCalledWith('latent');

        const [matchLatentPixel] = getCommandPaletteMatches('隐现像素');
        expect(matchLatentPixel.command.id).toBe('background-latent-dithering');
        matchLatentPixel.command.execute('', context);
        expect(context.setLatentBackgroundTuning).toHaveBeenCalledWith({ displayMode: 'dithering' });

        const [matchNomand] = getCommandPaletteMatches('漫游');
        expect(matchNomand.command.id).toBe('background-nomand');
        matchNomand.command.execute('', context);
        expect(context.setVisualizerBackgroundMode).toHaveBeenCalledWith('nomand');

        const [matchPersonalFm] = getCommandPaletteMatches('私人漫游');
        expect(matchPersonalFm.command.id).toBe('playback-netease-personal-fm');

        const [matchHeartbeat] = getCommandPaletteMatches('心动模式');
        expect(matchHeartbeat.command.id).toBe('playback-netease-heartbeat');

        const [matchTurntable] = getCommandPaletteMatches('唱盘');
        expect(matchTurntable.command.id).toBe('background-turntable');
        matchTurntable.command.execute('', context);
        expect(context.setVisualizerBackgroundMode).toHaveBeenCalledWith('turntable');
    });

    it('matches queue DSL indexes, ranges, and artist facets', () => {
        const playQueue = [
            { id: 1, name: 'Idol', artists: [{ id: 1, name: 'YOASOBI' }], album: { id: 1, name: 'Idol' }, duration: 1 },
            { id: 2, name: 'Night Dancer', artists: [{ id: 2, name: 'imase' }], album: { id: 2, name: 'Night' }, duration: 1 },
            { id: 3, name: 'Gunjo', artists: [{ id: 3, name: 'YOASOBI' }], album: { id: 3, name: 'The Book' }, duration: 1 },
        ] as never;
        const context = createContext({ playQueue });
        expect(getQueueSongMatches('#2', context).map(match => match.command.id)).toEqual([
            'queue-song-1-2',
        ]);
        expect(getQueueSongMatches('1-2', context).map(match => match.command.id)).toEqual([
            'queue-song-0-1',
            'queue-song-1-2',
        ]);
        expect(getQueueSongMatches('artist:yoasobi', context).map(match => match.command.id)).toEqual([
            'queue-song-0-1',
            'queue-song-2-3',
        ]);
        const queueCommand = getCommandPaletteMatches('queue').find(match => match.command.id === 'queue');
        expect(queueCommand?.command.execute('#2', context)).toBe(true);
        expect(context.playSong).toHaveBeenCalled();

        const replacePlayQueue = vi.fn(() => true);
        const mutateContext = createContext({ playQueue, replacePlayQueue });
        expect(queueCommand?.command.execute('2-3 --remove', mutateContext)).toBe(true);
        expect(replacePlayQueue).toHaveBeenCalled();
        expect(mutateContext.playSong).not.toHaveBeenCalled();
        expect(queueCommand?.command.execute('--remove', mutateContext)).toBe(false);
    });

    it('centers desktop lyrics from the command palette', () => {
        const context = createContext();
        const [match] = getCommandPaletteMatches('桌面歌词居中');
        expect(match.command.id).toBe('desktop-lyrics-center');
        match.command.execute('', context);
        expect(context.setDesktopLyricsYFactor).toHaveBeenCalledWith(0.5);
    });

    it('cycles settings panel chrome daylight from the command palette', () => {
        const context = createContext();
        const [match] = getCommandPaletteMatches('设置面板浅色');
        expect(match.command.id).toBe('settings-chrome-daylight');
        expect(match.command.execute('', context)).toBe(true);
    });

    it('matches the sleep timer command', () => {
        expect(getCommandPaletteMatches('定时关闭')[0].command.id).toBe('sleep-timer');
        expect(getCommandPaletteMatches('sleep timer')[0].command.id).toBe('sleep-timer');
        const [match] = getCommandPaletteMatches('sleep timer');
        expect(match.command.getPreview?.('30', createContext())).toContain('30');
        expect(match.command.execute('--off', createContext())).toBe(true);
    });
});
