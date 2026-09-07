import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cloud, FolderOpen, Music2, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isNavidromeUiEnabled } from '../../utils/featureFlags';
import { OnboardingBackdrop } from './OnboardingBackdrop';

// src/components/onboarding/OnboardingWizard.tsx
// Minimal first-run screen: add a music source, or continue empty.

export type OnboardingWizardProps = {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    onConnectNetease?: () => void;
    onConnectQQ?: () => void;
    onOpenLocal?: () => void;
    onOpenNavidrome?: () => void;
};

export function OnboardingWizard({
    isOpen,
    onClose,
    onComplete,
    onConnectNetease,
    onConnectQQ,
    onOpenLocal,
    onOpenNavidrome,
}: OnboardingWizardProps) {
    const { t } = useTranslation();

    if (!isOpen) {
        return null;
    }

    const finish = () => {
        onComplete();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[150]"
                    style={{ backgroundColor: '#09090b' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <OnboardingBackdrop reducedMotion />

                    <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="onboarding-title"
                            className="w-full max-w-sm"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="mb-8 text-center">
                                <div className="mb-5 text-[13px] font-medium tracking-[0.18em] text-white/35">
                                    LYRA
                                </div>
                                <h2
                                    id="onboarding-title"
                                    className="text-[22px] font-medium tracking-tight text-white/90"
                                >
                                    {t('onboarding.connectTitle', 'Add music')}
                                </h2>
                            </div>

                            <div className="flex flex-col gap-2">
                                <SourceButton
                                    icon={Cloud}
                                    label={t('onboarding.connectNetease', 'NetEase')}
                                    onClick={onConnectNetease}
                                />
                                <SourceButton
                                    icon={Music2}
                                    label={t('onboarding.connectQQ', 'QQ Music')}
                                    onClick={onConnectQQ}
                                />
                                <SourceButton
                                    icon={FolderOpen}
                                    label={t('onboarding.connectLocal', 'Local files')}
                                    onClick={onOpenLocal}
                                />
                                {isNavidromeUiEnabled() ? (
                                    <SourceButton
                                        icon={Radio}
                                        label={t('onboarding.connectNavidrome', 'Navidrome')}
                                        onClick={onOpenNavidrome}
                                    />
                                ) : null}
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    type="button"
                                    className="text-sm text-white/40 transition hover:text-white/75"
                                    onClick={finish}
                                >
                                    {t('onboarding.skip', 'Not now')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function SourceButton({
    icon: Icon,
    label,
    onClick,
}: {
    icon: React.ComponentType<{ size?: number }>;
    label: string;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left text-sm text-white/85 transition hover:border-white/18 hover:bg-white/[0.07]"
        >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/65">
                <Icon size={15} />
            </span>
            <span>{label}</span>
        </button>
    );
}
