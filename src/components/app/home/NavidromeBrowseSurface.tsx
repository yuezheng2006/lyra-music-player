import React from 'react';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import NavidromeMusicView from '../../navidrome/NavidromeMusicView';
import NavidromeGrid3DView from './NavidromeGrid3DView';
import GridViewOverlayHost from './GridViewOverlayHost';
import {
    HOME_HEADER_TOP_PADDING_CLASS,
    resolveHomeSolidBackgroundClass,
} from './homeSurfaceStyles';
import type { HomeViewModel } from './buildHomeModel';

// src/components/app/home/NavidromeBrowseSurface.tsx
// Navidrome library surface opened from the sidebar (carousel or grid layout).

type NavidromeBrowseSurfaceProps = {
    model: HomeViewModel;
    isDaylight: boolean;
};

const NavidromeBrowseSurface: React.FC<NavidromeBrowseSurfaceProps> = ({ model, isDaylight }) => {
    const homeLayoutStyle = useSettingsUiStore(state => state.homeLayoutStyle);
    const props = model.legacyProps;
    const solidBg = resolveHomeSolidBackgroundClass(isDaylight);
    const focusedAlbumIndex = props.navidromeFocusedAlbumIndex ?? 0;
    const setFocusedAlbumIndex = props.setNavidromeFocusedAlbumIndex ?? (() => undefined);

    if (homeLayoutStyle === 'grid') {
        return (
            <div
                className={`relative z-20 flex h-full w-full flex-col overflow-hidden ${HOME_HEADER_TOP_PADDING_CLASS} pointer-events-auto ${solidBg}`}
                style={{ color: 'var(--content-text)' }}
            >
                <GridViewOverlayHost legacyProps={props}>
                    {(openGridView) => (
                        <NavidromeGrid3DView
                            isDaylight={isDaylight}
                            theme={props.theme}
                            focusedAlbumIndex={focusedAlbumIndex}
                            setFocusedAlbumIndex={setFocusedAlbumIndex}
                            onOpenSettings={() => props.onOpenSettings?.('options', 'integration')}
                            onOpenGridView={openGridView}
                            externalSelection={props.pendingNavidromeSelection}
                            onExternalSelectionHandled={props.onPendingNavidromeSelectionHandled}
                            hasFloatingPlayer={Boolean(props.currentTrack)}
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
            <NavidromeMusicView
                onPlaySong={(song, queue) => props.onPlayNavidromeSong?.(song, queue)}
                onAddSongsToQueue={props.onAddNavidromeSongsToQueue}
                onOpenSettings={() => props.onOpenSettings?.('options', 'integration')}
                onMatchSong={props.onMatchNavidromeSong}
                theme={props.theme}
                isDaylight={isDaylight}
                focusedAlbumIndex={focusedAlbumIndex}
                setFocusedAlbumIndex={setFocusedAlbumIndex}
                externalSelection={props.pendingNavidromeSelection}
                onExternalSelectionHandled={props.onPendingNavidromeSelectionHandled}
                hasFloatingPlayer={Boolean(props.currentTrack)}
            />
        </div>
    );
};

export default NavidromeBrowseSurface;
