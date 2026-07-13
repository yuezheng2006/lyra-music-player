import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Music, Calendar, Trash2, Info, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getPlayHistory,
  getPlayHistoryStats,
  clearPlayHistory,
  stripExpiringYoutubeStream,
  type PlayHistoryEntry
} from '../../../services/playHistoryService';
import {
  resolveBrowseListRowClass,
  resolveHomeContentBottomPaddingClass,
  resolveContentTextColor,
  resolveContentMutedTextColor,
} from './homeSurfaceStyles';
import { ProviderIconBadge } from './ProviderIconBadge';

interface PlayHistorySurfaceProps {
  onPlaySong?: (song: any) => void;
  isDaylight?: boolean;
}

export const PlayHistorySurface: React.FC<PlayHistorySurfaceProps> = ({
  onPlaySong,
  isDaylight = false
}) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<PlayHistoryEntry[]>([]);
  const [stats, setStats] = useState({
    totalPlays: 0,
    uniqueSongs: 0,
    dateRange: { start: null as Date | null, end: null as Date | null }
  });
  const [loading, setLoading] = useState(true);

  const textColor = resolveContentTextColor(isDaylight);
  const mutedTextColor = resolveContentMutedTextColor(isDaylight);
  const bottomPadding = resolveHomeContentBottomPaddingClass(true);
  const rowClass = resolveBrowseListRowClass(isDaylight);
  const cardBg = isDaylight ? 'bg-black/[0.02]' : 'bg-white/[0.02]';
  const buttonHover = isDaylight ? 'hover:bg-black/[0.06]' : 'hover:bg-white/[0.08]';

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [historyData, statsData] = await Promise.all([
        getPlayHistory(500),
        getPlayHistoryStats()
      ]);
      setHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load play history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm(t('确定要清除所有播放历史吗？此操作不可撤销。') || 'Clear all play history? This cannot be undone.')) {
      return;
    }

    try {
      await clearPlayHistory();
      setHistory([]);
      setStats({ totalPlays: 0, uniqueSongs: 0, dateRange: { start: null, end: null } });
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('清除失败，请稍后重试');
    }
  };

  // 按日期分组
  const groupedHistory = useMemo(() => {
    const groups: Record<string, PlayHistoryEntry[]> = {};

    history.forEach(entry => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [history]);

  const handlePlaySong = (entry: PlayHistoryEntry) => {
    if (!onPlaySong) return;
    // 优先用存储的完整歌曲快照播放
    const snapshot = entry.songSnapshot as any;
    if (snapshot) {
      // 强制剥除 YouTube 缓存的 streamUrl（动态端口会失效），按 videoId 重新解析
      onPlaySong(stripExpiringYoutubeStream(snapshot));
      return;
    }
    // 兼容旧记录（无快照）：用基础字段构造，仅在线歌曲可能成功
    onPlaySong({
      id: entry.songId,
      name: entry.songName,
      artists: entry.artist.split(', ').map((name, index) => ({ id: index, name })),
      ar: entry.artist.split(', ').map((name, index) => ({ id: index, name })),
      album: entry.album ? { id: 0, name: entry.album, picUrl: entry.coverUrl } : undefined,
      al: entry.album ? { id: 0, name: entry.album, picUrl: entry.coverUrl } : undefined,
      musicProvider: entry.source === 'local' ? undefined : entry.source,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return t('今天') || 'Today';
    if (dateStr === yesterday) return t('昨天') || 'Yesterday';

    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      netease: '网易云音乐',
      qq: 'QQ音乐',
      local: '本地音乐',
      navidrome: 'Navidrome',
      youtube: 'YouTube Music',
      coco: 'Coco音乐',
      qishui: '汽水音乐',
    };
    return labels[source] || source;
  };

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col"
      style={{ color: textColor }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-7 h-7" style={{ color: mutedTextColor }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: textColor }}>
                {t('app.sidebarHistory') || '播放历史'}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: mutedTextColor }}>
                {t('记录你的音乐足迹') || 'Track your music journey'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadHistory}
              className={`p-2 rounded-lg transition-colors ${buttonHover}`}
              title={t('刷新') || 'Refresh'}
            >
              <RefreshCw className="w-4 h-4" style={{ color: mutedTextColor }} />
            </button>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${buttonHover}`}
                style={{ color: mutedTextColor }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-sm">{t('清除历史') || 'Clear'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {!loading && history.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-lg p-3 ${cardBg}`}>
              <div className="text-2xl font-bold" style={{ color: textColor }}>
                {stats.totalPlays}
              </div>
              <div className="text-xs mt-0.5" style={{ color: mutedTextColor }}>
                {t('总播放次数') || 'Total Plays'}
              </div>
            </div>
            <div className={`rounded-lg p-3 ${cardBg}`}>
              <div className="text-2xl font-bold" style={{ color: textColor }}>
                {stats.uniqueSongs}
              </div>
              <div className="text-xs mt-0.5" style={{ color: mutedTextColor }}>
                {t('不同歌曲') || 'Unique Songs'}
              </div>
            </div>
            <div className={`rounded-lg p-3 ${cardBg}`}>
              <div className="text-2xl font-bold" style={{ color: textColor }}>
                {stats.dateRange.start && stats.dateRange.end
                  ? Math.ceil((stats.dateRange.end.getTime() - stats.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
              </div>
              <div className="text-xs mt-0.5" style={{ color: mutedTextColor }}>
                {t('天数') || 'Days'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`min-h-0 flex-1 overflow-y-auto px-6 ${bottomPadding}`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mx-auto mb-3"
                   style={{ borderColor: mutedTextColor, borderTopColor: 'transparent' }}></div>
              <p className="text-sm" style={{ color: mutedTextColor }}>{t('加载中...') || 'Loading...'}</p>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Music className="w-16 h-16 mb-3" style={{ color: mutedTextColor, opacity: 0.4 }} />
            <p className="text-base font-medium mb-1" style={{ color: textColor }}>
              {t('暂无播放历史') || 'No play history yet'}
            </p>
            <p className="text-sm" style={{ color: mutedTextColor }}>
              {t('开始播放音乐，记录你的音乐足迹') || 'Start playing music to track your history'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            {groupedHistory.map(([date, entries]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3 sticky top-0 py-2 z-10"
                     style={{ backgroundColor: 'var(--shell-surface)' }}>
                  <Calendar className="w-4 h-4" style={{ color: mutedTextColor }} />
                  <h3 className="text-sm font-semibold" style={{ color: textColor }}>
                    {formatDate(date)}
                  </h3>
                  <span className="text-xs" style={{ color: mutedTextColor }}>
                    ({entries.length} {t('首') || 'songs'})
                  </span>
                </div>

                {/* Song List */}
                <div className="space-y-1.5">
                  {entries.map((entry, index) => (
                    <motion.div
                      key={entry.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                      className={`rounded-lg p-3 ${rowClass}`}
                      onClick={() => handlePlaySong(entry)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Cover */}
                        <div className="relative w-11 h-11 rounded overflow-hidden flex-shrink-0"
                             style={{ backgroundColor: isDaylight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                          {entry.coverUrl ? (
                            <img
                              src={entry.coverUrl}
                              alt={entry.songName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-5 h-5" style={{ color: mutedTextColor }} />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate" style={{ color: textColor }}>
                            {entry.songName}
                          </h4>
                          <p className="text-xs truncate" style={{ color: mutedTextColor }}>
                            {entry.artist}
                            {entry.album && ` · ${entry.album}`}
                          </p>
                        </div>

                        {/* Time & Source */}
                        <div className="flex items-center gap-3 text-xs flex-shrink-0" style={{ color: mutedTextColor }}>
                          <span className="hidden sm:inline font-mono">{formatTime(entry.playedAt)}</span>
                          <ProviderIconBadge
                            provider={entry.source}
                            size="sm"
                            isDaylight={isDaylight}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {history.length > 0 && (
        <div className="flex-shrink-0 px-6 py-3 border-t"
             style={{ borderColor: isDaylight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: mutedTextColor }}>
            <Info className="w-3.5 h-3.5" />
            <span>{t('数据仅存储在本地，不会上传到服务器') || 'Data stored locally only'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
