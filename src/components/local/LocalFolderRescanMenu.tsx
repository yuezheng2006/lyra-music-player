import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Loader2, RefreshCw } from 'lucide-react';

// src/components/local/LocalFolderRescanMenu.tsx
// Picks one imported root directory (or all roots) to rescan.

export type LocalFolderRescanTarget = string | 'all';

type LocalFolderRescanMenuProps = {
    rootFolderNames: string[];
    onRescan: (target: LocalFolderRescanTarget) => void | Promise<void>;
    disabled?: boolean;
    isBusy?: boolean;
    isDaylight?: boolean;
    compact?: boolean;
};

const LocalFolderRescanMenu: React.FC<LocalFolderRescanMenuProps> = ({
    rootFolderNames,
    onRescan,
    disabled = false,
    isBusy = false,
    isDaylight = false,
    compact = false,
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const triggerRescan = async (target: LocalFolderRescanTarget) => {
        setOpen(false);
        await onRescan(target);
    };

    const buttonDisabled = disabled || isBusy || rootFolderNames.length === 0;
    const hasMultipleRoots = rootFolderNames.length > 1;

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    if (buttonDisabled) return;
                    if (!hasMultipleRoots) {
                        void triggerRescan(rootFolderNames[0]);
                        return;
                    }
                    setOpen(prev => !prev);
                }}
                disabled={buttonDisabled}
                title={hasMultipleRoots
                    ? t('localMusic.rescanChooseFolder')
                    : t('localMusic.rescanNamedFolder', { name: rootFolderNames[0] || '' })}
                className={compact
                    ? `p-1.5 rounded-full transition-colors ${
                        buttonDisabled
                            ? 'bg-white/5 text-white/45 cursor-not-allowed'
                            : 'bg-white/10 hover:bg-white/20'
                    }`
                    : `px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-lg backdrop-blur-md border border-white/10 flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-45 opacity-55 hover:opacity-90`}
                style={compact ? undefined : {
                    backgroundColor: isDaylight ? 'rgba(255,255,255,0.62)' : 'rgba(25,25,25,0.58)',
                    color: 'var(--text-primary)',
                }}
            >
                {isBusy
                    ? <Loader2 size={compact ? 14 : 13} className="animate-spin" />
                    : <RefreshCw size={compact ? 14 : 13} />}
                {!compact && (
                    <>
                        <span>
                            {isBusy
                                ? t('localMusic.rescanning')
                                : hasMultipleRoots
                                    ? t('localMusic.rescanFolder')
                                    : t('localMusic.rescanNamedFolder', { name: rootFolderNames[0] || '' })}
                        </span>
                        {hasMultipleRoots && (
                            <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                        )}
                    </>
                )}
            </button>

            {open && hasMultipleRoots && (
                <div
                    className="absolute right-0 top-full mt-2 z-30 min-w-[12rem] max-w-[18rem] overflow-hidden rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl"
                    style={{
                        backgroundColor: isDaylight ? 'rgba(255,255,255,0.92)' : 'rgba(24,24,24,0.94)',
                        color: 'var(--text-primary)',
                    }}
                >
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest opacity-45">
                        {t('localMusic.rescanChooseFolder')}
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                        {rootFolderNames.map(folderName => (
                            <button
                                key={folderName}
                                type="button"
                                onClick={() => void triggerRescan(folderName)}
                                className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 truncate"
                                title={folderName}
                            >
                                {folderName}
                            </button>
                        ))}
                    </div>
                    <div className="mx-2 border-t border-white/10" />
                    <button
                        type="button"
                        onClick={() => void triggerRescan('all')}
                        className="w-full px-3 py-2.5 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10"
                    >
                        {t('localMusic.rescanAllFolders')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default LocalFolderRescanMenu;
