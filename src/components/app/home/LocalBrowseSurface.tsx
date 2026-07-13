import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import { importFolder, resyncAllFolders, resyncFolder, LOCAL_MUSIC_SCAN_PROGRESS_EVENT } from '../../../services/localMusicService';
import LocalMusicView from '../../LocalMusicView';
import LocalGrid3DView from './LocalGrid3DView';
import GridViewOverlayHost from './GridViewOverlayHost';
import type { LocalFolderRescanTarget } from '../../local/LocalFolderRescanMenu';
import {
    HOME_HEADER_TOP_PADDING_CLASS,
    resolveHomeSolidBackgroundClass,
} from './homeSurfaceStyles';
import type { HomeViewModel } from './buildHomeModel';

// src/components/app/home/LocalBrowseSurface.tsx
// Local library browse surface opened from the sidebar (carousel or grid layout).

type LocalBrowseSurfaceProps = {
    model: HomeViewModel;
    isDaylight: boolean;
};

const LocalBrowseSurface: React.FC<LocalBrowseSurfaceProps> = ({ model, isDaylight }) => {
    const { t } = useTranslation();
    const homeLayoutStyle = useSettingsUiStore(state => state.homeLayoutStyle);
    const props = model.legacyProps;
    const {
        localSongs,
        localPlaylists,
        onRefreshLocalSongs,
        onPlayLocalSong,
        onAddLocalSongToQueue,
        localMusicState,
        setLocalMusicState,
        onMatchSong,
        onSelectLocalArtist,
        onSelectLocalAlbum,
        onBackToPlayer,
        theme,
        currentTrack,
    } = props;

    const [isLocalImporting, setIsLocalImporting] = useState(false);
    const [isResyncingFocusedFolder, setIsResyncingFocusedFolder] = useState(false);
    const [scanProgressActive, setScanProgressActive] = useState(false);

    useEffect(() => {
        const handleScanProgress = (event: Event) => {
            const detail = (event as CustomEvent<{ active?: boolean }>).detail;
            setScanProgressActive(Boolean(detail?.active));
        };
        window.addEventListener(LOCAL_MUSIC_SCAN_PROGRESS_EVENT, handleScanProgress as EventListener);
        return () => window.removeEventListener(LOCAL_MUSIC_SCAN_PROGRESS_EVENT, handleScanProgress as EventListener);
    }, []);

    // Imports a folder then refreshes the local library snapshot used by both layouts.
    const handleFolderImport = async () => {
        if (isLocalImporting || scanProgressActive) return;
        setIsLocalImporting(true);
        try {
            const importedSongs = await importFolder();
            if (importedSongs.length > 0) {
                onRefreshLocalSongs();
            }
        } catch (error) {
            console.error('[LocalBrowseSurface] Failed to import local folder:', error);
            alert(t('localMusic.importNotSupported'));
        } finally {
            setIsLocalImporting(false);
        }
    };

    // Rescans one imported root, or every root when target is "all".
    const handleRescanFolder = async (target: LocalFolderRescanTarget) => {
        if (isResyncingFocusedFolder || scanProgressActive) return;

        setIsResyncingFocusedFolder(true);
        try {
            const importedSongs = target === 'all'
                ? await resyncAllFolders()
                : await resyncFolder(target);

            if (importedSongs !== null) {
                onRefreshLocalSongs();
            }
        } catch (error) {
            console.error('[LocalBrowseSurface] Failed to rescan local folder:', error);
            alert(t('localMusic.resyncFailed'));
        } finally {
            setIsResyncingFocusedFolder(false);
        }
    };

    const solidBg = resolveHomeSolidBackgroundClass(isDaylight);

    if (homeLayoutStyle === 'grid') {
        return (
            <div
                className={`relative z-20 flex h-full w-full flex-col overflow-hidden ${HOME_HEADER_TOP_PADDING_CLASS} pointer-events-auto ${solidBg}`}
                style={{ color: 'var(--content-text)' }}
            >
                <GridViewOverlayHost legacyProps={props}>
                    {(openGridView) => (
                        <LocalGrid3DView
                            localSongs={localSongs}
                            localPlaylists={localPlaylists}
                            activeRow={localMusicState.activeRow}
                            setActiveRow={(row) => setLocalMusicState(prev => ({ ...prev, activeRow: row }))}
                            focusedFolderIndex={localMusicState.focusedFolderIndex}
                            setFocusedFolderIndex={(index) => setLocalMusicState(prev => ({ ...prev, focusedFolderIndex: index }))}
                            focusedAlbumIndex={localMusicState.focusedAlbumIndex}
                            setFocusedAlbumIndex={(index) => setLocalMusicState(prev => ({ ...prev, focusedAlbumIndex: index }))}
                            focusedArtistIndex={localMusicState.focusedArtistIndex}
                            setFocusedArtistIndex={(index) => setLocalMusicState(prev => ({ ...prev, focusedArtistIndex: index }))}
                            focusedPlaylistIndex={localMusicState.focusedPlaylistIndex}
                            setFocusedPlaylistIndex={(index) => setLocalMusicState(prev => ({ ...prev, focusedPlaylistIndex: index }))}
                            onImportFolder={handleFolderImport}
                            onRescanFolder={(target) => void handleRescanFolder(target)}
                            importButtonDisabled={isLocalImporting || scanProgressActive}
                            isImporting={isLocalImporting}
                            isScanInProgress={scanProgressActive}
                            isResyncingFocusedFolder={isResyncingFocusedFolder}
                            theme={theme}
                            isDaylight={isDaylight}
                            hasFloatingPlayer={Boolean(currentTrack)}
                            onOpenGridView={openGridView}
                        />
                    )}
                </GridViewOverlayHost>
            </div>
        );
    }

    return (
        <div
            className={`relative z-20 flex h-full w-full flex-col overflow-hidden ${HOME_HEADER_TOP_PADDING_CLASS} pointer-events-auto ${solidBg}`}
            style={{ color: 'var(--content-text)' }}
        >
            <LocalMusicView
                localSongs={localSongs}
                localPlaylists={localPlaylists}
                onRefresh={onRefreshLocalSongs}
                onPlaySong={onPlayLocalSong}
                onAddToQueue={onAddLocalSongToQueue}
                activeRow={localMusicState.activeRow}
                setActiveRow={(row) => setLocalMusicState(prev => ({ ...prev, activeRow: row }))}
                selectedGroup={localMusicState.selectedGroup}
                setSelectedGroup={(group) => setLocalMusicState(prev => ({
                    ...prev,
                    selectedGroup: group,
                    detailStack: group ? prev.detailStack : [],
                    detailOriginView: group ? prev.detailOriginView : null,
                }))}
                onBackFromDetail={() => {
                    if (localMusicState.detailStack.length > 0) {
                        setLocalMusicState(prev => {
                            const nextStack = prev.detailStack.slice(0, -1);
                            return {
                                ...prev,
                                selectedGroup: nextStack[nextStack.length - 1] ?? null,
                                detailStack: nextStack,
                            };
                        });
                        return;
                    }

                    const shouldReturnToPlayer = localMusicState.detailOriginView === 'player';
                    setLocalMusicState(prev => ({
                        ...prev,
                        selectedGroup: null,
                        detailStack: [],
                        detailOriginView: null,
                    }));

                    if (shouldReturnToPlayer) {
                        onBackToPlayer();
                    }
                }}
                onMatchSong={onMatchSong}
                focusedFolderIndex={localMusicState.focusedFolderIndex}
                setFocusedFolderIndex={(index) => setLocalMusicState(prev => ({ ...prev, focusedFolderIndex: index }))}
                focusedAlbumIndex={localMusicState.focusedAlbumIndex}
                setFocusedAlbumIndex={(index) => setLocalMusicState(prev => ({ ...prev, focusedAlbumIndex: index }))}
                focusedArtistIndex={localMusicState.focusedArtistIndex}
                setFocusedArtistIndex={(index) => setLocalMusicState(prev => ({ ...prev, focusedArtistIndex: index }))}
                focusedPlaylistIndex={localMusicState.focusedPlaylistIndex}
                setFocusedPlaylistIndex={(index) => setLocalMusicState(prev => ({ ...prev, focusedPlaylistIndex: index }))}
                onSelectArtistGroup={onSelectLocalArtist}
                onSelectAlbumGroup={onSelectLocalAlbum}
                theme={theme}
                isDaylight={isDaylight}
                hasFloatingPlayer={Boolean(currentTrack)}
            />
        </div>
    );
};

export default LocalBrowseSurface;
