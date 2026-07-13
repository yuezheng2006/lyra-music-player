import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Music, Trash2, Calendar, TrendingUp, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getPlayHistory,
  getPlayHistoryStats,
  clearPlayHistory,
  type PlayHistoryEntry
} from '../../services/playHistoryService';

interface PlayHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaySong?: (song: any) => void;
}

export const PlayHistoryModal: React.FC<PlayHistoryModalProps> = ({
  isOpen,
  onClose,
  onPlaySong
}) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<PlayHistoryEntry[]>([]);
  const [stats, setStats] = useState({ totalPlays: 0, uniqueSongs: 0, dateRange: { start: null as Date | null, end: null as Date | null } });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

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
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, PlayHistoryEntry[]> = {};

    history.forEach(entry => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [history]);

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
      netease: '网易云',
      qq: 'QQ音乐',
      local: '本地',
      navidrome: 'Navidrome',
      youtube: 'YouTube',
      coco: 'Coco',
    };
    return labels[source] || source;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-purple-500" />
            <div>
              <h2 className="text-2xl font-bold">{t('播放历史') || 'Play History'}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('记录你的音乐足迹') || 'Track your music journey'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        {!loading && history.length > 0 && (
          <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalPlays}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('总播放次数') || 'Total Plays'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {stats.uniqueSongs}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('不同歌曲') || 'Unique Songs'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.dateRange.start && stats.dateRange.end
                  ? Math.ceil((stats.dateRange.end.getTime() - stats.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('天数') || 'Days'}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">{t('加载中...') || 'Loading...'}</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t('暂无播放历史') || 'No play history yet'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {t('开始播放音乐，记录你的音乐足迹') || 'Start playing music to track your history'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedHistory.map(([date, entries]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-4 sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {formatDate(date)}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      ({entries.length} {t('首') || 'songs'})
                    </span>
                  </div>

                  {/* Song List */}
                  <div className="space-y-2">
                    {entries.map((entry, index) => (
                      <motion.div
                        key={entry.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer"
                        onClick={() => {
                          // TODO: 实现重新播放功能
                          console.log('Play song:', entry);
                        }}
                      >
                        {/* Cover */}
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0">
                          {entry.coverUrl ? (
                            <img
                              src={entry.coverUrl}
                              alt={entry.songName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-6 h-6 text-white opacity-60" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {entry.songName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {entry.artist}
                          </p>
                        </div>

                        {/* Time & Source */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                          <span className="hidden sm:inline">{formatTime(entry.playedAt)}</span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            {getSourceLabel(entry.source)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Info className="w-4 h-4" />
                <span>{t('数据仅存储在本地') || 'Data stored locally only'}</span>
              </div>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('清除历史') || 'Clear History'}</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
