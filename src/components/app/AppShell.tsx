import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, LockOpen, Radio } from 'lucide-react';
import TitlebarDragZone from '../TitlebarDragZone';
import WindowControls from '../WindowControls';
import type { CoverShellTheme } from '../../utils/coverShellTheme';

// Shared shell for the app container, Electron titlebar, and mounted audio node.
type AppShellProps = {
    appStyle: React.CSSProperties;
    isElectronWindow: boolean;
    usesCustomWindowChrome: boolean;
    useCustomWindowRadius: boolean;
    showTransparentWindowBorder: boolean;
    isPlayerView: boolean;
    isTitlebarRevealed: boolean;
    isMainWindowClickThroughEnabled: boolean;
    showMainWindowClickThroughToggle: boolean;
    onToggleMainWindowClickThrough: () => void;
    isDaylight: boolean;
    shellTheme: CoverShellTheme;
    audioElement: React.ReactNode;
    children: React.ReactNode;
};

const AppShell: React.FC<AppShellProps> = ({
    appStyle,
    isElectronWindow,
    usesCustomWindowChrome,
    useCustomWindowRadius,
    showTransparentWindowBorder,
    isPlayerView,
    isTitlebarRevealed,
    isMainWindowClickThroughEnabled,
    showMainWindowClickThroughToggle,
    onToggleMainWindowClickThrough,
    isDaylight,
    shellTheme,
    audioElement,
    children,
}) => {
    const [isWindowMaximized, setIsWindowMaximized] = useState(false);
    const [isWindowFullscreen, setIsWindowFullscreen] = useState(false);

    useEffect(() => {
        if (!useCustomWindowRadius || !window.electron?.isWindowMaximized) {
            setIsWindowMaximized(false);
            return;
        }

        let isCancelled = false;

        const syncMaximizedState = async () => {
            try {
                const nextValue = await window.electron!.isWindowMaximized();
                if (!isCancelled) {
                    setIsWindowMaximized(nextValue);
                }
            } catch {
                if (!isCancelled) {
                    setIsWindowMaximized(false);
                }
            }
        };

        void syncMaximizedState();
        window.addEventListener('resize', syncMaximizedState);

        return () => {
            isCancelled = true;
            window.removeEventListener('resize', syncMaximizedState);
        };
    }, [useCustomWindowRadius]);

    useEffect(() => {
        if (!useCustomWindowRadius) {
            setIsWindowFullscreen(false);
            return;
        }

        let isCancelled = false;

        const syncFullscreenState = async () => {
            try {
                if (window.electron?.isWindowFullscreen) {
                    const nextValue = await window.electron.isWindowFullscreen();
                    if (!isCancelled) {
                        setIsWindowFullscreen(nextValue);
                    }
                    return;
                }
                if (!isCancelled) {
                    setIsWindowFullscreen(Boolean(document.fullscreenElement));
                }
            } catch {
                if (!isCancelled) {
                    setIsWindowFullscreen(false);
                }
            }
        };

        void syncFullscreenState();
        const unsubscribe = window.electron?.onWindowFullscreenChanged?.((state) => {
            setIsWindowFullscreen(Boolean(state?.isFullscreen));
        });
        const handleDocumentFullscreenChange = () => {
            if (window.electron?.isWindowFullscreen) {
                return;
            }
            setIsWindowFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleDocumentFullscreenChange);

        return () => {
            isCancelled = true;
            unsubscribe?.();
            document.removeEventListener('fullscreenchange', handleDocumentFullscreenChange);
        };
    }, [useCustomWindowRadius]);

    const shouldApplyWindowRadius = useCustomWindowRadius && !isWindowMaximized && !isWindowFullscreen;
    const shouldRenderTitlebarBackdrop = !isPlayerView || (useCustomWindowRadius && !isMainWindowClickThroughEnabled);
    const titlebarBackdropClassName = `absolute inset-0 backdrop-blur-sm ${
        isDaylight
            ? isPlayerView
                ? 'bg-white/[0.18] border-b border-white/25 shadow-[0_8px_28px_rgba(0,0,0,0.06)]'
                : 'bg-white/[0.12] border-b border-white/15'
            : isPlayerView
                ? 'bg-black/[0.18] border-b border-white/10 shadow-[0_8px_28px_rgba(0,0,0,0.20)]'
                : ''
    }`;

    return (
        <div
            className="fixed inset-0 w-full h-full flex flex-col overflow-hidden font-sans transition-colors duration-500"
            style={{
                ...appStyle,
                ['--shell-surface' as string]: shellTheme.surface,
                ['--shell-canvas' as string]: shellTheme.canvas,
                ['--shell-sidebar-glass' as string]: shellTheme.sidebarGlass,
                ['--shell-dock-glass' as string]: shellTheme.dockGlass,
                ['--shell-popover' as string]: shellTheme.popover,
                ['--shell-text' as string]: shellTheme.text,
                ['--shell-muted-text' as string]: shellTheme.mutedText,
                ['--shell-border' as string]: shellTheme.border,
                ['--shell-hover' as string]: shellTheme.hover,
                // List/browse copy stays neutral; only surfaces track the cover palette.
                ['--content-text' as string]: isDaylight ? '#171717' : '#fafafa',
                ['--content-muted-text' as string]: isDaylight ? 'rgba(23, 23, 23, 0.55)' : 'rgba(250, 250, 250, 0.45)',
                backgroundColor: 'var(--shell-surface)',
                color: 'var(--shell-text)',
                borderRadius: shouldApplyWindowRadius ? '18px' : undefined,
                boxShadow: showTransparentWindowBorder ? 'inset 0 0 0 1px rgba(255,255,255,0.24)' : undefined,
            }}
        >
            {usesCustomWindowChrome && (
                <div className="absolute top-0 left-0 right-0 z-[9999] h-8 pointer-events-none">
                    {shouldRenderTitlebarBackdrop && (
                        <motion.div
                            initial={false}
                            animate={{
                                opacity: isTitlebarRevealed ? 1 : 0,
                            }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className={titlebarBackdropClassName}
                            style={{
                                left: 'var(--app-sidebar-width, 0px)',
                                backgroundColor: 'var(--shell-sidebar-glass)',
                                borderColor: 'var(--shell-border)',
                            }}
                        />
                    )}
                    <div className="relative h-full">
                        <TitlebarDragZone active={usesCustomWindowChrome} />
                        <div className="pointer-events-auto absolute top-0 left-0 z-10 h-full">
                            <WindowControls
                                revealed={isTitlebarRevealed}
                                isDaylight={isDaylight}
                                isMainWindowClickThroughEnabled={isMainWindowClickThroughEnabled}
                            />
                        </div>
                        <div
                            className="pointer-events-auto absolute top-0 right-0 z-20 h-full flex items-center gap-1 pr-1"
                            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                        >
                            <button
                                type="button"
                                aria-label="Remote control"
                                title="远程控制"
                                tabIndex={isTitlebarRevealed && !isMainWindowClickThroughEnabled ? 0 : -1}
                                onClick={() => void window.electron?.openRemoteControl?.()}
                                className={`flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 ${
                                    isTitlebarRevealed && !isMainWindowClickThroughEnabled
                                        ? 'pointer-events-auto opacity-100 translate-y-0'
                                        : 'pointer-events-none opacity-0 -translate-y-1'
                                } ${
                                    isDaylight
                                        ? 'border-black/[0.06] bg-white/40 text-zinc-700 hover:bg-white/80 hover:text-zinc-900 shadow-[0_4px_12px_rgba(0,0,0,0.04)]'
                                        : 'border-white/15 bg-transparent text-white/75 hover:bg-black/20 hover:text-white'
                                }`}
                            >
                                <Radio size={14} />
                            </button>
                            <button
                                type="button"
                                aria-label={isMainWindowClickThroughEnabled ? 'Disable click-through' : 'Enable click-through'}
                                title={isMainWindowClickThroughEnabled ? '关闭点击穿透' : '开启点击穿透'}
                                onClick={onToggleMainWindowClickThrough}
                                className={`flex h-7 w-7 items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-200 ${
                                    showMainWindowClickThroughToggle
                                        ? 'pointer-events-auto opacity-100 translate-y-0'
                                        : 'pointer-events-none opacity-0 -translate-y-1'
                                } ${
                                    isMainWindowClickThroughEnabled
                                        ? isDaylight
                                            ? 'border-amber-500/30 bg-amber-50/80 text-amber-700 hover:bg-amber-100/90'
                                            : 'border-amber-300/35 bg-black/55 text-amber-100 hover:bg-black/70'
                                        : isDaylight
                                            ? 'border-black/[0.06] bg-white/40 text-zinc-700 hover:bg-white/80 hover:text-zinc-900 shadow-[0_4px_12px_rgba(0,0,0,0.04)]'
                                            : 'border-white/15 bg-transparent text-white/75 hover:bg-black/20 hover:text-white'
                                }`}
                            >
                                {isMainWindowClickThroughEnabled ? <Lock size={14} /> : <LockOpen size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {audioElement}
            {children}
        </div>
    );
};

export default AppShell;
