import type { HomeViewTab } from '../../types';
import type { CommandPaletteCommand } from './types';

// src/components/command-palette/homeTabCommands.ts
// One command per real browse tab. Dead destinations (albums) stay out.

const createHomeTabCommand = (
    tab: HomeViewTab,
    title: string,
    description: string,
    keywords: string[],
): CommandPaletteCommand => ({
    id: `home-${tab}`,
    group: 'navigation',
    title,
    description,
    keywords,
    execute: (_input, context) => {
        context.setHomeViewTab(tab);
        context.navigateDirectHome();
        return true;
    },
});

export const HOME_TAB_COMMANDS: CommandPaletteCommand[] = [
    createHomeTabCommand('playlist', 'Open playlists', 'Open recommended playlists, charts, and your library', ['playlist', 'playlists', '歌单', '资料库', 'gedan', 'gd']),
    createHomeTabCommand('daily', 'Open Today Picks', 'Open the listening desk and Today Picks', ['daily', 'today picks', 'daily mix', 'daily recommend', 'listening desk', '今日精选', '每日推荐', '听台', '开箱即听', 'meirituijian', 'mrtj']),
    createHomeTabCommand('charts', 'Open search and charts', 'Search songs or browse official charts', ['charts', 'chart', 'toplist', 'top list', '排行榜', '榜单', '热歌榜', '飙升榜', 'paihangbang', 'phb', '搜索', '搜歌', '来源搜索', 'sousuo']),
    createHomeTabCommand('podcast', 'Open podcasts', 'Open the podcast browse tab', ['podcast', 'podcasts', '播客', 'boke', 'bk']),
    createHomeTabCommand('radio', 'Open Personal FM', 'Open the listening desk, radar, and Personal FM', ['radio', 'personal fm', '私人漫游', '独立fm', '电台', '听台', 'diantai', 'dt', 'srmy']),
    createHomeTabCommand('local', 'Open local music', 'Open local music tab', ['local music', 'local', '本地', '本地音乐', 'bendi', 'bendiyinyue', 'bd', 'bdyy']),
    createHomeTabCommand('navidrome', 'Open Navidrome', 'Open Navidrome tab', ['navidrome', 'navi', '服务器', 'fuwuqi', 'fwq']),
    createHomeTabCommand('history', 'Open play history', 'Open the play history tab', ['history', 'play history', '播放历史', '最近播放', 'lishi', 'bofanglishi', 'bfls']),
];
