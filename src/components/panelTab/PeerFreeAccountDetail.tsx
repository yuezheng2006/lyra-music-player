import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OnlineMusicProviderId } from '../../types';
import { resolveOnlineProviderIconUrl } from '../../utils/onlineProviderAssets';

// src/components/panelTab/PeerFreeAccountDetail.tsx
// Status-only detail for curated peer-free providers (no in-app login yet).

type PeerFreeAccountDetailProps = {
    providerId: OnlineMusicProviderId;
    title: string;
    hint: string;
};

const PeerFreeAccountDetail: React.FC<PeerFreeAccountDetailProps> = ({
    providerId,
    title,
    hint,
}) => {
    const { t } = useTranslation();
    const iconUrl = resolveOnlineProviderIconUrl(providerId);

    return (
        <div className="bg-white/5 p-3 rounded-xl space-y-2">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {iconUrl ? (
                            <img src={iconUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-[10px] font-bold opacity-70">{providerId.slice(0, 2).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{title}</div>
                        <div className="text-[10px] opacity-55 truncate">
                            {t('account.peerFreeAvailable') || '第三方试听 · 无需登录'}
                        </div>
                    </div>
                </div>
                <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
            </div>
            <p className="text-[10px] leading-relaxed opacity-45 px-0.5">{hint}</p>
            <p className="text-[10px] leading-relaxed opacity-40 px-0.5">
                {t('account.peerFreeLoginLater') || '账号登录与会员票据接入将在后续版本补齐；可用上方「展示」控制首页是否显示该源。'}
            </p>
        </div>
    );
};

export default PeerFreeAccountDetail;
