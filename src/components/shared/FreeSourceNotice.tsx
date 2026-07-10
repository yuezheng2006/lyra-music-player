import React from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// src/components/shared/FreeSourceNotice.tsx
// Prerequisite notice shown before free / third-party peer sources.

type FreeSourceNoticeProps = {
    isDaylight: boolean;
    className?: string;
    /** compact: one-line strip; default: short paragraph card */
    compact?: boolean;
};

export const FreeSourceNotice: React.FC<FreeSourceNoticeProps> = ({
    isDaylight,
    className = '',
    compact = false,
}) => {
    const { t } = useTranslation();
    const shell = isDaylight
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-950/80'
        : 'bg-amber-400/10 border-amber-300/20 text-amber-50/85';
    const iconTone = isDaylight ? 'text-amber-700/70' : 'text-amber-200/75';

    // Compact: single-line strip so home can keep peer sources above the fold.
    if (compact) {
        return (
            <div
                role="note"
                title={t('home.freeSourceNoticeBody')}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${shell} ${className}`}
            >
                <Info size={13} className={`shrink-0 ${iconTone}`} aria-hidden="true" />
                <p className={`min-w-0 truncate text-[11px] leading-none ${isDaylight ? 'text-amber-950/75' : 'text-amber-50/80'}`}>
                    <span className={`font-semibold ${isDaylight ? 'text-amber-900/85' : 'text-amber-100/90'}`}>
                        {t('home.freeSourceNoticeTitle')}
                    </span>
                    <span className="mx-1.5 opacity-40" aria-hidden="true">·</span>
                    <span>{t('home.freeSourceNoticeBody')}</span>
                </p>
            </div>
        );
    }

    return (
        <div
            role="note"
            className={`flex gap-2.5 rounded-2xl border px-3.5 py-3 ${shell} ${className}`}
        >
            <Info size={15} className={`mt-0.5 shrink-0 ${iconTone}`} aria-hidden="true" />
            <div className="min-w-0 space-y-1">
                <div className={`text-[11px] font-semibold tracking-wide ${isDaylight ? 'text-amber-900/80' : 'text-amber-100/90'}`}>
                    {t('home.freeSourceNoticeTitle')}
                </div>
                <p className="text-[11px] leading-relaxed">
                    {t('home.freeSourceNoticeBody')}
                </p>
            </div>
        </div>
    );
};

export default FreeSourceNotice;
