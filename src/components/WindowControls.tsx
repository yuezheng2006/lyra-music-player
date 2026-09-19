import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    isMacNavigatorPlatform,
    shouldUseNativeFullscreenTrafficLight,
} from '../utils/window/macNativeFullscreenTrafficLight';

// src/components/WindowControls.tsx
// Left-side macOS-style traffic lights for frameless Electron chrome.

export const WINDOW_TRAFFIC_LIGHTS_WIDTH_PX = 78;

export default function WindowControls({
    revealed,
    isMainWindowClickThroughEnabled = false,
}: {
    revealed: boolean;
    isDaylight?: boolean;
    isMainWindowClickThroughEnabled?: boolean;
}) {
    const { t } = useTranslation();
    const [isMaximized, setIsMaximized] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const electron = (window as any).electron;
    const useNativeFullscreen = shouldUseNativeFullscreenTrafficLight(isMacNavigatorPlatform());

    useEffect(() => {
        if (!electron) return;
        const checkMaximize = async () => setIsMaximized(await electron.isWindowMaximized());
        checkMaximize();
        window.addEventListener('resize', checkMaximize);
        return () => window.removeEventListener('resize', checkMaximize);
    }, [electron]);

    useEffect(() => {
        if (!electron || !useNativeFullscreen) return;
        let cancelled = false;
        const syncFullscreen = async () => {
            try {
                const next = Boolean(await electron.isWindowFullscreen?.());
                if (!cancelled) setIsFullscreen(next);
            } catch {
                if (!cancelled) setIsFullscreen(false);
            }
        };
        void syncFullscreen();
        const unsubscribe = electron.onWindowFullscreenChanged?.((state: { isFullscreen?: boolean }) => {
            setIsFullscreen(Boolean(state?.isFullscreen));
        });
        return () => {
            cancelled = true;
            unsubscribe?.();
        };
    }, [electron, useNativeFullscreen]);

    if (!electron) return null;

    const visible = revealed && !isMainWindowClickThroughEnabled;
    const groupClass = `flex h-full items-center gap-[8px] px-[14px] transition-all duration-200 ${
        visible
            ? 'pointer-events-auto opacity-100 translate-y-0'
            : 'pointer-events-none opacity-0 -translate-y-1'
    }`;

    const lightClass =
        'group relative flex h-[12px] w-[12px] items-center justify-center rounded-full transition-transform duration-150 hover:scale-110';

    return (
        <div
            className={groupClass}
            style={{
                WebkitAppRegion: 'no-drag',
                width: WINDOW_TRAFFIC_LIGHTS_WIDTH_PX,
            } as React.CSSProperties}
            data-testid="window-traffic-lights"
        >
            <button
                type="button"
                className={`${lightClass} bg-[#ff5f57]`}
                title="关闭"
                aria-label="关闭"
                tabIndex={visible ? 0 : -1}
                onClick={() => electron.closeWindow()}
            >
                <span className="pointer-events-none text-[9px] font-bold leading-none text-black/55 opacity-0 group-hover:opacity-100">
                    ×
                </span>
            </button>
            <button
                type="button"
                className={`${lightClass} bg-[#febc2e]`}
                title="最小化"
                aria-label="最小化"
                tabIndex={visible ? 0 : -1}
                onClick={() => electron.minimizeWindow()}
            >
                <span className="pointer-events-none text-[8px] font-bold leading-none text-black/55 opacity-0 group-hover:opacity-100">
                    −
                </span>
            </button>
            <button
                type="button"
                className={`${lightClass} bg-[#28c840]`}
                title={useNativeFullscreen
                    ? (isFullscreen ? t('ui.exitFullscreen', '退出全屏') : t('ui.enterFullscreen', '进入全屏'))
                    : (isMaximized ? '还原' : '最大化')}
                aria-label={useNativeFullscreen
                    ? (isFullscreen ? t('ui.exitFullscreen', '退出全屏') : t('ui.enterFullscreen', '进入全屏'))
                    : (isMaximized ? '还原' : '最大化')}
                tabIndex={visible ? 0 : -1}
                onClick={async () => {
                    if (useNativeFullscreen && electron.toggleFullscreenWindow) {
                        await electron.toggleFullscreenWindow();
                        try {
                            setIsFullscreen(Boolean(await electron.isWindowFullscreen?.()));
                        } catch {
                            // native fullscreen events will catch up
                        }
                        return;
                    }
                    await electron.toggleMaximizeWindow();
                    setIsMaximized(await electron.isWindowMaximized());
                }}
            >
                <span className="pointer-events-none text-[7px] font-bold leading-none text-black/55 opacity-0 group-hover:opacity-100">
                    {(useNativeFullscreen ? isFullscreen : isMaximized) ? '⧉' : '+'}
                </span>
            </button>
        </div>
    );
}
