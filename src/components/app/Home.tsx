import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import LegacyHome from '../Home';
import Grid3D from '../Grid3D';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import { useSearchNavigationStore } from '../../stores/useSearchNavigationStore';
import GridViewOverlayHost from './home/GridViewOverlayHost';
import DailyRecommendSurface from './home/DailyRecommendSurface';
import PodcastBrowseSurface from './home/PodcastBrowseSurface';
import { resolveHomeSolidBackgroundClass } from './home/homeSurfaceStyles';
import type { HomeViewModel } from './home/buildHomeModel';

// App-level entry for the home surface backed by a view model.
type AppHomeProps = {
    model: HomeViewModel;
    isHomeFullyHidden?: boolean;
};

const Home: React.FC<AppHomeProps> = ({ model, isHomeFullyHidden }) => {
    const homeLayoutStyle = useSettingsUiStore(state => state.homeLayoutStyle);
    const isDaylight = useSettingsUiStore(state => state.isDaylight);
    const homeViewTab = useSearchNavigationStore(useShallow(state => state.homeViewTab));

    if (isHomeFullyHidden) {
        return null;
    }

    if (homeViewTab === 'daily' || homeViewTab === 'podcast') {
        // Opaque browse surfaces — do not let interactive3d / particle stage show through.
        const solidBg = resolveHomeSolidBackgroundClass(isDaylight);
        return (
            <div
                className={`relative z-20 flex h-full w-full flex-col overflow-hidden pt-6 pointer-events-auto ${solidBg}`}
                style={{ color: 'var(--text-primary)' }}
            >
                {homeViewTab === 'daily' ? (
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
