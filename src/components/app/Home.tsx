import React, { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import LegacyHome from '../Home';
import Grid3D from '../Grid3D';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import { useSearchNavigationStore } from '../../stores/useSearchNavigationStore';
import GridViewOverlayHost from './home/GridViewOverlayHost';
import DailyRecommendSurface from './home/DailyRecommendSurface';
import ChartsSurface from './home/ChartsSurface';
import FmSurface from './home/FmSurface';
import { PlayerState } from '../../types';
import PodcastBrowseSurface from './home/PodcastBrowseSurface';
import LocalBrowseSurface from './home/LocalBrowseSurface';
import NavidromeBrowseSurface from './home/NavidromeBrowseSurface';
import YTMusicBrowseSurface from './home/YTMusicBrowseSurface';
import { PlayHistorySurface } from './home/PlayHistorySurface';
import {
    HOME_HEADER_TOP_PADDING_CLASS,
    resolveHomeSolidBackgroundClass,
} from './home/homeSurfaceStyles';
import type { HomeViewModel } from './home/buildHomeModel';
import { useCommitHomeSearch } from '../../hooks/useCommitHomeSearch';
import { isNavidromeUiEnabled, isYtmusicUiEnabled } from '../../utils/featureFlags';
import { hasPersonalLibraryAccess } from '../../utils/onlineLibraryAccess';
import { resolveHomeViewTabForSession } from '../../utils/home/resolveLandingHomeViewTab';

// App-level entry for the home surface backed by a view model.
// Guests land on search; playlist Grid3D is only for a signed-in library.
type AppHomeProps = {
    model: HomeViewModel;
    isHomeFullyHidden?: boolean;
};

const Home: React.FC<AppHomeProps> = ({ model, isHomeFullyHidden }) => {
    const homeLayoutStyle = useSettingsUiStore(state => state.homeLayoutStyle);
    const isDaylight = useSettingsUiStore(state => state.isDaylight);
    const homeViewTab = useSearchNavigationStore(useShallow(state => state.homeViewTab));
    const setHomeViewTab = useSearchNavigationStore(state => state.setHomeViewTab);
    const commitHomeSearch = useCommitHomeSearch({
        localSongs: model.legacyProps.localSongs,
        user: model.legacyProps.user,
        onSearchCommitted: model.legacyProps.onSearchCommitted,
    });
    const hasPersonalLibrary = hasPersonalLibraryAccess();
    const landingTab = resolveHomeViewTabForSession(homeViewTab, hasPersonalLibrary);

    useEffect(() => {
        if (landingTab === homeViewTab) return;
        setHomeViewTab(landingTab);
    }, [homeViewTab, landingTab, setHomeViewTab]);

    if (isHomeFullyHidden) {
        return null;
    }

    if (landingTab === 'local') {
        return <LocalBrowseSurface model={model} isDaylight={isDaylight} />;
    }

    if (landingTab === 'history') {
        const solidBg = resolveHomeSolidBackgroundClass(isDaylight);
        return (
            <div
                className={`relative z-20 flex h-full w-full flex-col overflow-hidden ${HOME_HEADER_TOP_PADDING_CLASS} pointer-events-auto ${solidBg}`}
                style={{ color: 'var(--content-text)' }}
            >
                <PlayHistorySurface onPlaySong={model.legacyProps.onPlaySong} isDaylight={isDaylight} />
            </div>
        );
    }

    if (landingTab === 'navidrome' && isNavidromeUiEnabled()) {
        return <NavidromeBrowseSurface model={model} isDaylight={isDaylight} />;
    }

    if (landingTab === 'ytmusic' && isYtmusicUiEnabled()) {
        const solidBg = resolveHomeSolidBackgroundClass(isDaylight);
        return (
            <div
                className={`relative z-20 flex h-full w-full flex-col overflow-hidden ${HOME_HEADER_TOP_PADDING_CLASS} pointer-events-auto ${solidBg}`}
                style={{ color: 'var(--content-text)' }}
            >
                <YTMusicBrowseSurface
                    isDaylight={isDaylight}
                    currentVideoId={(model.legacyProps.currentTrack as { ytmData?: { videoId?: string } } | null)?.ytmData?.videoId ?? null}
                    onPlayTrack={(track, queue) => model.onPlayYtmTrack?.(track, queue)}
                />
            </div>
        );
    }

    if (landingTab === 'radio') {
        const solidBg = resolveHomeSolidBackgroundClass(isDaylight);
        const fm = model.fm;
        return (
            <div
                className={`relative z-20 flex h-full w-full flex-col overflow-hidden ${HOME_HEADER_TOP_PADDING_CLASS} pointer-events-auto ${solidBg}`}
                style={{ color: 'var(--content-text)' }}
            >
                <FmSurface
                    isDaylight={isDaylight}
                    user={model.legacyProps.user}
                    playlists={model.legacyProps.playlists}
                    isFmMode={fm?.isFmMode ?? false}
                    currentSong={model.legacyProps.currentTrack}
                    playQueue={fm?.playQueue ?? []}
                    playerState={fm?.playerState ?? PlayerState.PAUSED}
                    isLiked={fm?.isLiked ?? false}
                    onPlaySong={model.legacyProps.onPlaySong}
                    onTogglePlay={fm?.onTogglePlay ?? (() => {})}
                    onNext={fm?.onNext ?? (() => {})}
                    onPrev={fm?.onPrev ?? (() => {})}
                    onTrash={fm?.onTrash ?? (() => {})}
                    onLike={fm?.onLike ?? (() => {})}
                    onRefreshUser={model.legacyProps.onRefreshUser}
                    onSelectPlaylist={model.legacyProps.onSelectPlaylist}
                />
            </div>
        );
    }

    if (landingTab === 'charts') {
        const solidBg = resolveHomeSolidBackgroundClass(isDaylight);
        return (
            <div
                className={`relative z-20 flex h-full w-full flex-col overflow-hidden ${HOME_HEADER_TOP_PADDING_CLASS} pointer-events-auto ${solidBg}`}
                style={{ color: 'var(--content-text)' }}
            >
                <ChartsSurface
                    isDaylight={isDaylight}
                    user={model.legacyProps.user}
                    onPlaySong={model.legacyProps.onPlaySong}
                    onRefreshUser={model.legacyProps.onRefreshUser}
                    onCommitSearch={(query) => {
                        void commitHomeSearch(query, false);
                    }}
                />
            </div>
        );
    }

    if (landingTab === 'daily' || landingTab === 'podcast') {
        // Opaque browse surfaces — do not let interactive3d / particle stage show through.
        const solidBg = resolveHomeSolidBackgroundClass(isDaylight);
        return (
            <div
                className={`relative z-20 flex h-full w-full flex-col overflow-hidden ${HOME_HEADER_TOP_PADDING_CLASS} pointer-events-auto ${solidBg}`}
                style={{ color: 'var(--content-text)' }}
            >
                {landingTab === 'daily' ? (
                    <DailyRecommendSurface
                        user={model.legacyProps.user}
                        isDaylight={isDaylight}
                        onPlaySong={model.legacyProps.onPlaySong}
                        onRefreshUser={model.legacyProps.onRefreshUser}
                    />
                ) : (
                    <PodcastBrowseSurface
                        isDaylight={isDaylight}
                        onPlaySong={model.legacyProps.onPlaySong}
                    />
                )}
            </div>
        );
    }

    if (homeLayoutStyle === 'grid') {
        return (
            <GridViewOverlayHost legacyProps={model.legacyProps}>
                {(openGridView) => (
                    <Grid3D
                        {...model.legacyProps}
                        onOpenGridView={openGridView}
                    />
                )}
            </GridViewOverlayHost>
        );
    }
    return <LegacyHome {...model.legacyProps} />;
};

export default Home;
