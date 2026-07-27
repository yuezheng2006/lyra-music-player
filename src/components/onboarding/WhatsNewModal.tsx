import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NewFeaturesIntro } from '@/components/modal/NewFeaturesIntro';

// src/components/onboarding/WhatsNewModal.tsx
// Compact version-highlight modal shown after an app upgrade.

export type WhatsNewModalProps = {
    isOpen: boolean;
    onClose: () => void;
    isDaylight: boolean;
};

export function WhatsNewModal({ isOpen, onClose, isDaylight }: WhatsNewModalProps) {
    const { t } = useTranslation();
    const classes = {
        textPrimary: isDaylight ? 'text-zinc-900' : 'text-zinc-50',
        textSecondary: isDaylight ? 'text-zinc-600' : 'text-zinc-400',
        tipCardBg: isDaylight ? 'bg-white' : 'bg-white/[0.04]',
        iconTileBg: isDaylight ? 'bg-zinc-100' : 'bg-white/[0.06]',
        cardBg: isDaylight ? 'bg-zinc-50' : 'bg-white/[0.03]',
    };

    if (!isOpen) {
        return null;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[150] flex items-center justify-center p-6"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        className={`relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl ${
                            isDaylight ? 'bg-white border-black/10' : 'bg-zinc-950/95 border-white/10'
                        }`}
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        onClick={event => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="absolute right-4 top-4 rounded-full p-2 opacity-60 hover:opacity-100"
                            onClick={onClose}
                            aria-label={t('whatsNew.close', 'Close')}
                        >
                            <X size={16} />
                        </button>
                        <NewFeaturesIntro isDaylight={isDaylight} classes={classes} />
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                className={`rounded-full px-5 py-2 text-sm font-medium ${
                                    isDaylight ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-950'
                                }`}
                                onClick={onClose}
                            >
                                {t('whatsNew.gotIt', 'Got it')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
