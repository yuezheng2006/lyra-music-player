import React from 'react';
import { X } from 'lucide-react';
import type { Theme } from '../../../../types';
import type { PlaylistShelfItem } from './shelfTypes';

// src/components/visualizer/geometric/shelf/PlaylistShelfDetailStub.tsx
// Minimal detail panel stub opened when a shelf card is clicked.

interface PlaylistShelfDetailStubProps {
    item: PlaylistShelfItem | null;
    selectedIndex: number;
    total: number;
    theme: Theme;
    onClose: () => void;
}

const PlaylistShelfDetailStub: React.FC<PlaylistShelfDetailStubProps> = ({
    item,
    selectedIndex,
    total,
    theme,
    onClose,
}) => {
    if (!item) return null;

    return (
        <div
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            data-testid="interactive3d-playlist-shelf-detail-stub"
        >
            <div
                className="pointer-events-auto w-[min(420px,88vw)] rounded-3xl border p-5 shadow-2xl backdrop-blur-xl"
                style={{
                    backgroundColor: `${theme.backgroundColor}cc`,
                    borderColor: `${theme.secondaryColor}55`,
                    color: theme.primaryColor,
                }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="text-xs uppercase tracking-[0.24em] opacity-45">歌单详情 · MVP</div>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        {item.subtitle && (
                            <p className="text-sm opacity-70">{item.subtitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        aria-label="关闭"
                        onClick={onClose}
                        className="rounded-full p-2 opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="mt-4 space-y-2 text-sm opacity-75">
                    <p>来源：{item.source}</p>
                    <p>曲目数：{item.trackCount ?? '—'}</p>
                    <p>当前选中：{selectedIndex + 1} / {total}</p>
                    <p className="text-xs opacity-60 pt-2">
                        完整歌曲列表与播放操作将在后续迭代接入；当前仅为详情面板占位。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PlaylistShelfDetailStub;
