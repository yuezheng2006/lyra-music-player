import React, { useState, useEffect } from 'react';

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
    const [isMaximized, setIsMaximized] = useState(false);
    const electron = (window as any).electron;

    useEffect(() => {
        if (!electron) return;
        const checkMaximize = async () => setIsMaximized(await electron.isWindowMaximized());
        checkMaximize();
        window.addEventListener('resize', checkMaximize);
        return () => window.removeEventListener('resize', checkMaximize);
    }, [electron]);

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
                title={isMaximized ? '还原' : '最大化'}
                aria-label={isMaximized ? '还原' : '最大化'}
                tabIndex={visible ? 0 : -1}
                onClick={async () => {
                    await electron.toggleMaximizeWindow();
                    setIsMaximized(await electron.isWindowMaximized());
                }}
            >
                <span className="pointer-events-none text-[7px] font-bold leading-none text-black/55 opacity-0 group-hover:opacity-100">
                    {isMaximized ? '⧉' : '+'}
                </span>
            </button>
        </div>
    );
}
