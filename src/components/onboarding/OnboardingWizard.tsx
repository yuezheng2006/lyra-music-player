import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cloud, FolderOpen, Music2, Radio, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isNavidromeUiEnabled } from '../../utils/featureFlags';
import { OnboardingBackdrop } from './OnboardingBackdrop';

// src/components/onboarding/OnboardingWizard.tsx
// Fullscreen onboarding: glass step panel over a quiet textured backdrop.

export type OnboardingStep = 1 | 2 | 3;

export type OnboardingWizardProps = {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    onConnectNetease?: () => void;
    onConnectQQ?: () => void;
    onOpenLocal?: () => void;
    onOpenNavidrome?: () => void;
    onOpenDailyRecommend?: () => void;
    onOpenPlayer?: () => void;
};

export function OnboardingWizard({
    isOpen,
    onClose,
    onComplete,
    onConnectNetease,
    onConnectQQ,
    onOpenLocal,
    onOpenNavidrome,
    onOpenDailyRecommend,
    onOpenPlayer,
}: OnboardingWizardProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<OnboardingStep>(1);
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return undefined;
        }
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReducedMotion(media.matches);
        sync();
        media.addEventListener?.('change', sync);
        return () => media.removeEventListener?.('change', sync);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const finish = () => {
        onComplete();
        onClose();
    };

    const skip = () => {
        finish();
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
                    transition={{ duration: 0.28 }}
                >
                    <OnboardingBackdrop reducedMotion={reducedMotion} />

                    <div className="pointer-events-none absolute left-6 top-6 z-10">
                        <div
                            className="text-[22px] font-semibold tracking-[0.06em]"
                            style={{ color: 'rgba(250,250,250,0.55)', textShadow: '0 0 40px rgba(180,200,255,0.2)' }}
                        >
                            Lyra
                        </div>
                    </div>

                    <button
                        type="button"
                        className="absolute right-5 top-5 z-20 rounded-full p-2.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                        onClick={skip}
                        aria-label={t('onboarding.skip', 'Skip')}
                    >
                        <X size={18} />
                    </button>

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        className="pointer-events-auto absolute bottom-6 left-6 right-6 z-20 mx-auto w-full max-w-lg sm:left-8 sm:right-auto sm:bottom-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.35 }}
                    >
                        <div
                            className="rounded-[28px] border border-white/12 p-6 shadow-2xl backdrop-blur-2xl"
                            style={{
                                background: 'linear-gradient(160deg, rgba(24,24,28,0.78) 0%, rgba(12,12,16,0.72) 100%)',
                                color: 'var(--text-primary, #fafafa)',
                                boxShadow: '0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
                            }}
                        >
                            <div className="mb-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/45">
                                <Sparkles size={13} />
                                {t('onboarding.badge', 'Premiere')} · {step}/3
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                                    transition={{ duration: 0.22 }}
                                >
                                    {step === 1 && (
                                        <div className="space-y-3">
                                            <h2 className="text-[28px] font-semibold leading-tight tracking-tight">
                                                {t('onboarding.welcomeTitle', 'Enter the soundscape')}
                                            </h2>
                                            <p className="max-w-md text-sm leading-relaxed text-white/60">
                                                {t(
                                                    'onboarding.welcomeBody',
                                                    'Lyra turns your library into an immersive lyric stage.',
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <h2 className="text-[28px] font-semibold leading-tight tracking-tight">
                                                    {t('onboarding.connectTitle', 'Connect your music')}
                                                </h2>
                                                <p className="max-w-md text-sm leading-relaxed text-white/60">
                                                    {t(
                                                        'onboarding.connectBody',
                                                        'Sign in or add a library so the stage has songs to play.',
                                                    )}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2.5">
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
                                        </div>
                                    )}

                                    {step === 3 && (
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <h2 className="text-[28px] font-semibold leading-tight tracking-tight">
                                                    {t('onboarding.listenTitle', 'Step onto the stage')}
                                                </h2>
                                                <p className="max-w-md text-sm leading-relaxed text-white/60">
                                                    {t(
                                                        'onboarding.listenBody',
                                                        'Open daily recommend, or jump straight into the player.',
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <SourceButton
                                                    icon={Sparkles}
                                                    label={t('onboarding.openDailyRecommend', 'Daily recommend')}
                                                    onClick={onOpenDailyRecommend}
                                                    wide
                                                />
                                                <SourceButton
                                                    icon={Music2}
                                                    label={t('onboarding.openPlayer', 'Enter player')}
                                                    onClick={onOpenPlayer}
                                                    wide
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className="mt-8 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    className="text-sm text-white/45 transition hover:text-white/85"
                                    onClick={skip}
                                >
                                    {t('onboarding.skip', 'Skip')}
                                </button>
                                <div className="flex gap-2">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            className="rounded-full px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                                            onClick={() =>
                                                setStep(prev => (prev === 1 ? 1 : ((prev - 1) as OnboardingStep)))
                                            }
                                        >
                                            {t('onboarding.back', 'Back')}
                                        </button>
                                    )}
                                    {step < 3 ? (
                                        <button
                                            type="button"
                                            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white/90"
                                            onClick={() => setStep(prev => ((prev + 1) as OnboardingStep))}
                                        >
                                            {t('onboarding.continue', 'Continue')}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white/90"
                                            onClick={finish}
                                        >
                                            {t('onboarding.done', 'Done')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function SourceButton({
    icon: Icon,
    label,
    onClick,
    wide = false,
}: {
    icon: React.ComponentType<{ size?: number }>;
    label: string;
    onClick?: () => void;
    wide?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-left text-sm text-white/85 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.09] ${wide ? 'w-full' : ''}`}
        >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/70 transition group-hover:text-white">
                <Icon size={15} />
            </span>
            <span>{label}</span>
        </button>
    );
}
