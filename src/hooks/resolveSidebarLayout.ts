// src/hooks/resolveSidebarLayout.ts
// Keeps user sidebar collapse independent from immersive fullscreen / chrome-hide.

export type SidebarLayout = {
    /** Immersive canvas temporarily removes the rail; must not rewrite userCollapsed. */
    forceHidden: boolean;
    /** User preference (and only user preference) once immersive ends. */
    collapsed: boolean;
    width: '0px' | '220px';
};

/**
 * Immersive fullscreen may hide the sidebar rail, but exiting must restore
 * the user's collapse preference — never force-expand a closed sidebar.
 */
export function resolveSidebarLayout(params: {
    immersiveCanvas: boolean;
    userCollapsed: boolean;
}): SidebarLayout {
    if (params.immersiveCanvas) {
        return {
            forceHidden: true,
            collapsed: true,
            width: '0px',
        };
    }

    return {
        forceHidden: false,
        collapsed: params.userCollapsed,
        width: params.userCollapsed ? '0px' : '220px',
    };
}
