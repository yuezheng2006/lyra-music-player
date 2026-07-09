import { useCallback, useEffect, useState } from 'react';

// src/hooks/useAppSidebarCollapse.ts
// Persists sidebar collapse; player chrome-hide can force an immersive collapsed rail.

export const APP_SIDEBAR_COLLAPSED_STORAGE_KEY = 'folia_app_sidebar_collapsed_v1';

const readCollapsed = (): boolean => {
    if (typeof localStorage === 'undefined') {
        return false;
    }
    return localStorage.getItem(APP_SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
};

export const useAppSidebarCollapse = (options?: {
    forceCollapsed?: boolean;
}) => {
    const forceCollapsed = Boolean(options?.forceCollapsed);
    const [userCollapsed, setUserCollapsed] = useState(readCollapsed);

    useEffect(() => {
        localStorage.setItem(APP_SIDEBAR_COLLAPSED_STORAGE_KEY, String(userCollapsed));
    }, [userCollapsed]);

    const toggleCollapsed = useCallback(() => {
        setUserCollapsed(prev => !prev);
    }, []);

    const setCollapsed = useCallback((collapsed: boolean) => {
        setUserCollapsed(collapsed);
    }, []);

    const collapsed = forceCollapsed || userCollapsed;

    return {
        collapsed,
        userCollapsed,
        toggleCollapsed,
        setCollapsed,
    };
};
