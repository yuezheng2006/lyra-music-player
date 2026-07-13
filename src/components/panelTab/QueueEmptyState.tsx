import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Music2, Heart, TrendingUp, Plus } from 'lucide-react';
import type { SongResult } from '../../types';
import { useDailyRecommendStore } from '../../stores/useDailyRecommendStore';
import LazyCoverImage from '../shared/LazyCoverImage';

// src/components/panelTab/QueueEmptyState.tsx
// 播放列表空状态：展示每日推荐或收藏的音乐，用户可以直接添加到播放列表

interface QueueEmptyStateProps {
    onAddSongs: (songs: SongResult[]) => void;
    onPlaySong: (song: SongResult, queue: SongResult[]) => void;
    isDaylight?: boolean;
}

const QueueEmptyState: React.FC<QueueEmptyStateProps> = ({
    onAddSongs,
    onPlaySong,
    isDaylight = false,
}) => {
    const { t } = useTranslation();
    const [recommendations, setRecommendations] = useState<SongResult[]>([]);
    const { songs: dailySongs, loading, ensureLoaded } = useDailyRecommendStore();

    useEffect(() => {
        // 加载每日推荐
        void ensureLoaded();
    }, [ensureLoaded]);

    useEffect(() => {
        // 随机选择 5 首推荐歌曲
        if (dailySongs.length > 0) {
            const shuffled = [...dailySongs].sort(() => Math.random() - 0.5);
            setRecommendations(shuffled.slice(0, 5));
        }
    }, [dailySongs]);

    const handlePlayRecommendation = (song: SongResult) => {
        // 创建临时播放列表
        const tempQueue = [song, ...recommendations.filter(s => s.id !== song.id)];
        onAddSongs(tempQueue);
        // 立即播放
        setTimeout(() => onPlaySong(song, tempQueue), 100);
    };

    const handleAddAll = () => {
        if (recommendations.length > 0) {
            onAddSongs(recommendations);
        }
    };

    if (loading && recommendations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-8 px-4">
                <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent ${
                    isDaylight ? 'border-black/20' : 'border-white/20'
                }`} />
                <p className={`mt-3 text-xs ${isDaylight ? 'text-black/40' : 'text-white/40'}`}>
                    {t('queue.loadingRecommendations') || '加载推荐中...'}
                </p>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-8 px-4">
                <Music2 size={32} className={isDaylight ? 'text-black/20' : 'text-white/20'} />
                <p className={`mt-3 text-xs ${isDaylight ? 'text-black/40' : 'text-white/40'}`}>
                    {t('queue.emptyHint') || '播放列表为空'}
                </p>
                <p className={`mt-1 text-[10px] ${isDaylight ? 'text-black/30' : 'text-white/30'}`}>
                    {t('queue.emptyHintDetail') || '添加歌曲开始播放'}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full py-3 px-2">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-2 pb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className={isDaylight ? 'text-black/50' : 'text-white/50'} />
                    <span className={`text-[11px] font-medium ${isDaylight ? 'text-black/60' : 'text-white/60'}`}>
                        {t('queue.recommendedForYou') || '为你推荐'}
                    </span>
                </div>
                <button
                    onClick={handleAddAll}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                        isDaylight
                            ? 'text-black/60 hover:bg-black/5 hover:text-black/80'
                            : 'text-white/60 hover:bg-white/10 hover:text-white/80'
                    }`}
                    title={t('queue.addAllToQueue') || '全部添加'}
                >
                    <Plus size={12} />
                    {t('queue.addAll') || '全部添加'}
                </button>
            </div>

            {/* 推荐歌曲列表 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                {recommendations.map((song, index) => {
                    const artists = song.ar?.map(a => a.name).join(', ')
                        || song.artists?.map(a => a.name).join(', ')
                        || '';

                    return (
                        <button
                            key={song.id}
                            onClick={() => handlePlayRecommendation(song)}
                            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors ${
                                isDaylight
                                    ? 'hover:bg-black/5 text-black/75'
                                    : 'hover:bg-white/8 text-white/78'
                            }`}
                        >
                            {/* 封面或序号 */}
                            <div className={`flex items-center justify-center w-9 h-9 rounded-md overflow-hidden shrink-0 ${
                                isDaylight ? 'bg-black/5' : 'bg-white/5'
                            }`}>
                                <LazyCoverImage
                                    src={song.al?.picUrl || song.album?.picUrl}
                                    placeholderLabel={song.name}
                                    placeholderArtist={artists}
                                    sizePx={80}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* 歌曲信息 */}
                            <div className="min-w-0 flex-1">
                                <div className="text-[12px] font-medium truncate leading-snug">
                                    {song.name}
                                </div>
                                {artists && (
                                    <div className={`text-[10px] truncate mt-0.5 ${
                                        isDaylight ? 'text-black/40' : 'text-white/40'
                                    }`}>
                                        {artists}
                                    </div>
                                )}
                            </div>

                            {/* 添加图标 */}
                            <Plus
                                size={14}
                                className={`shrink-0 ${isDaylight ? 'text-black/30' : 'text-white/30'}`}
                            />
                        </button>
                    );
                })}
            </div>

            {/* 底部提示 */}
            <div className={`mt-2 px-2 py-2 text-center text-[10px] leading-snug ${
                isDaylight ? 'text-black/35' : 'text-white/35'
            }`}>
                {t('queue.recommendationHint') || '点击歌曲即可开始播放'}
            </div>
        </div>
    );
};

export default QueueEmptyState;
