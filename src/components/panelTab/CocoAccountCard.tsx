import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveOnlineProviderIconUrl } from '../../utils/onlineProviderAssets';

// src/components/panelTab/CocoAccountCard.tsx
// Free Coco provider card — no login required.

const CocoAccountCard: React.FC = () => {
    const { t } = useTranslation();
    const cocoIconUrl = resolveOnlineProviderIconUrl('coco');

    return (
        <div className="bg-white/5 p-3 rounded-xl space-y-2">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#D97706]/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {cocoIconUrl ? (
                            <img src={cocoIconUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                        ) : null}
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                            {t('account.coco') || t('home.cocoProvider') || 'coco-免费'}
                        </div>
                        <div className="text-[10px] opacity-55 truncate">
                            {t('account.cocoAvailable') || '第三方免费 · 无需登录'}
                        </div>
                    </div>
                </div>
                <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
            </div>
            <p className="text-[10px] leading-relaxed opacity-45 px-0.5">
                {t('account.cocoHint') || t('home.cocoProviderHint') || '第三方免费聚合，仅供个人试听'}
            </p>
        </div>
    );
};

export default CocoAccountCard;
