import React from 'react';
import { resolveOnlineProviderIconUrl } from '../../../utils/onlineProviderAssets';
import { OnlineProviderMark } from '../../shared/OnlineProviderMark';

// 简洁的平台图标徽章（只显示图标，不显示文字）
type ProviderIconBadgeProps = {
  provider?: string | null;
  size?: 'sm' | 'md';
  isDaylight?: boolean;
};

export const ProviderIconBadge: React.FC<ProviderIconBadgeProps> = ({
  provider,
  size = 'sm',
  isDaylight = false
}) => {
  if (!provider) return null;

  if (!resolveOnlineProviderIconUrl(provider)) {
    const localLabels: Record<string, string> = {
      'local': '本地',
      'navidrome': 'Navi',
      'youtube': 'YT',
      'ytm': 'YT',
      'rss': 'RSS',
    };
    const label = localLabels[provider] || provider;
    const bgClass = isDaylight ? 'bg-black/[0.04]' : 'bg-white/[0.04]';
    const textClass = isDaylight ? 'text-black/60' : 'text-white/60';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${bgClass} ${textClass}`}>
        {label}
      </span>
    );
  }

  const bgClass = isDaylight ? 'bg-black/[0.04]' : 'bg-white/[0.04]';
  const padding = size === 'md' ? 'p-1' : 'p-0.5';
  return (
    <span className={`inline-flex items-center justify-center rounded-full ${bgClass} ${padding}`}>
      <OnlineProviderMark provider={provider} size={size} />
    </span>
  );
};
