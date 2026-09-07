import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import type { Theme } from '../../../types';

// src/components/modal/settings/SettingsSubviewShell.tsx
// Shared overlay chrome for settings subviews (appearance, general, lab, …).

type SettingsSubviewShellProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    zIndex?: number;
    isDaylight: boolean;
    theme?: Theme;
    overlayBackground: string;
    borderColor: string;
    panelBackgroundClass: string;
};

const shellTransition = { duration: 0.24, ease: 'easeOut' as const };

export const SettingsSubviewShell: React.FC<SettingsSubviewShellProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    action,
    zIndex = 136,
    isDaylight,
    theme,
    overlayBackground,
    borderColor,
    panelBackgroundClass,
}) => {
    const handleBackdropClose = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) {
            return;
        }
        event.stopPropagation();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={shellTransition}
                    className="fixed inset-0 p-3 sm:p-5"
                    style={{ backgroundColor: overlayBackground, zIndex }}
                    onClick={handleBackdropClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.985 }}
                        transition={shellTransition}
                        className={`mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-[32px] border ${borderColor} ${panelBackgroundClass} shadow-[0_24px_80px_rgba(0,0,0,0.28)] relative`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="absolute inset-0 pointer-events-none z-0">
                            <div
                                className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] ${isDaylight ? 'opacity-20' : 'opacity-10'}`}
                                style={{ backgroundColor: theme?.accentColor || (isDaylight ? '#60a5fa' : '#3b82f6') }}
                            />
                            <div
                                className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[80px] ${isDaylight ? 'opacity-20' : 'opacity-10'}`}
                                style={{ backgroundColor: theme?.secondaryColor || theme?.accentColor || (isDaylight ? '#c084fc' : '#a855f7') }}
                            />
                        </div>
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6 relative z-10">
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center transition-colors hover:bg-white/10"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="min-w-0">
                                    <div className="text-lg sm:text-xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                        {title}
                                    </div>
                                    <div className="text-xs opacity-50 mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        {description}
                                    </div>
                                </div>
                            </div>
                            {action ?? null}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 sm:px-6 relative z-10">
                            <div className="space-y-8">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
