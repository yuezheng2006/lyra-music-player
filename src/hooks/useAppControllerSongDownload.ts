import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { SongResult, StatusMessage } from '@/types';
import { canDownloadSongToDirectory } from '@/services/songDownloadService';
import { enqueueSongsForDownload } from '@/services/songDownloadQueue';
import { useSearchNavigationStore } from '@/stores/useSearchNavigationStore';
import { useSettingsUiStore } from '@/stores/useSettingsUiStore';

// src/hooks/useAppControllerSongDownload.ts
// Desktop song download enqueue helpers for command palette and search UI.

export function useAppControllerSongDownload(options: {
    audioQuality: string;
    currentSong: SongResult | null | undefined;
    setStatusMsg: Dispatch<SetStateAction<StatusMessage | null>>;
}) {
    const { audioQuality, currentSong, setStatusMsg } = options;
    const { t } = useTranslation();
    const autoResyncDownloadFolder = useSettingsUiStore(state => state.autoResyncDownloadFolder);

    const reportDownloadEnqueue = useCallback((accepted: number, skippedUnsupported: number) => {
        if (accepted <= 0) {
            if (skippedUnsupported > 0) {
                setStatusMsg({
                    type: 'error',
                    text: t('status.songDownloadUnsupported'),
                    nonce: Date.now(),
                    durationMs: 2200,
                });
            } else {
                setStatusMsg({
                    type: 'error',
                    text: t('status.noSongPlaying'),
                    nonce: Date.now(),
                    durationMs: 1600,
                });
            }
            return false;
        }
        setStatusMsg({
            type: 'info',
            text: accepted === 1
                ? t('status.downloadingSong')
                : t('status.downloadingSongs', { count: accepted }),
            nonce: Date.now(),
            durationMs: 4000,
        });
        return true;
    }, [setStatusMsg, t]);

    const downloadSongs = useCallback(async (songs?: SongResult[] | null) => {
        const list = songs?.filter(Boolean) ?? [];
        if (list.length === 0) {
            setStatusMsg({ type: 'error', text: t('status.noSongPlaying'), nonce: Date.now(), durationMs: 1600 });
            return false;
        }

        const result = await enqueueSongsForDownload(list, {
            audioQuality,
            autoResyncDownloadFolder,
            onProgress: (progress) => {
                if (!progress.running && progress.total > 0) {
                    if (progress.failed === 0 && progress.done > 0) {
                        setStatusMsg({
                            type: 'success',
                            text: progress.done === 1
                                ? t('status.songDownloaded')
                                : t('status.songsDownloaded', { count: progress.done }),
                            nonce: Date.now(),
                            durationMs: 2200,
                        });
                    } else if (progress.done > 0) {
                        setStatusMsg({
                            type: 'info',
                            text: t('status.songsDownloadPartial', {
                                done: progress.done,
                                failed: progress.failed,
                            }),
                            nonce: Date.now(),
                            durationMs: 2800,
                        });
                    } else {
                        setStatusMsg({
                            type: 'error',
                            text: t('status.songDownloadFailed'),
                            nonce: Date.now(),
                            durationMs: 2200,
                        });
                    }
                    return;
                }
                if (progress.running && progress.total > 1) {
                    setStatusMsg({
                        type: 'info',
                        text: t('status.downloadingSongsProgress', {
                            done: progress.done + progress.failed,
                            total: progress.total,
                            title: progress.currentTitle || '',
                        }),
                        nonce: Date.now(),
                        durationMs: 5000,
                    });
                }
            },
        });

        return reportDownloadEnqueue(result.accepted, result.skippedUnsupported);
    }, [audioQuality, autoResyncDownloadFolder, reportDownloadEnqueue, setStatusMsg, t]);

    const downloadSong = useCallback(async (song?: SongResult | null) => {
        const target = song ?? currentSong;
        if (!target) {
            setStatusMsg({ type: 'error', text: t('status.noSongPlaying'), nonce: Date.now(), durationMs: 1600 });
            return false;
        }
        return downloadSongs([target]);
    }, [currentSong, downloadSongs, setStatusMsg, t]);

    const downloadCurrentSong = useCallback(async () => downloadSong(currentSong), [currentSong, downloadSong]);

    const downloadSearchResults = useCallback(async () => {
        const results = useSearchNavigationStore.getState().searchResults || [];
        const downloadable = results.filter(track => canDownloadSongToDirectory(track));
        return downloadSongs(downloadable);
    }, [downloadSongs]);

    return {
        downloadSong,
        downloadSongs,
        downloadCurrentSong,
        downloadSearchResults,
    };
}
