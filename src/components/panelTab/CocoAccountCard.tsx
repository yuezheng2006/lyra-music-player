import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// src/components/panelTab/CocoAccountCard.tsx
// Free Coco provider card — no login required.

const CocoAccountCard: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-white/5 p-3 rounded-xl space-y-2">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#D97706]/20 flex items-center justify-center shrink-0">
                        <Sparkles size={14} className="text-amber-300" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                            {t('account.coco') || t('home.cocoProvider') || 'Coco'}
                        </div>
                        <div className="text-[10px] opacity-55 truncate">
                            {t('account.cocoAvailable') || 'No login · Free to use'}
                        </div>
                    </div>
                </div>
                <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
            </div>
            <p className="text-[10px] leading-relaxed opacity-45 px-0.5">
                {t('account.cocoHint') || t('home.cocoProviderHint') || 'Public aggregated search and preview'}
            </p>
        </div>
    );
};

export default CocoAccountCard;
