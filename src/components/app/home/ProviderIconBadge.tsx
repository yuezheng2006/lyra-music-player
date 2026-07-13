import React from 'react';
import type { OnlineMusicProviderId } from '../../../types';
import { resolveOnlineProviderIconUrl } from '../../../utils/onlineProviderAssets';

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

  // 映射到标准的 provider ID（在线音源图标）
  const providerMap: Record<string, OnlineMusicProviderId> = {
    'netease': 'netease',
    'qq': 'qq',
    'qishui': 'qishui',
    'coco': 'coco',
  };

  const providerId = providerMap[provider];
  const iconUrl = providerId ? resolveOnlineProviderIconUrl(providerId) : null;

  // 如果没有图标，显示文字标签
  if (!iconUrl) {
    const localLabels: Record<string, string> = {
      'local': '本地',
      'navidrome': 'Navi',
      'youtube': 'YT',
      'ytm': 'YT',
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

  // 统一的背景样式
  const bgClass = isDaylight ? 'bg-black/[0.04]' : 'bg-white/[0.04]';
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const padding = size === 'md' ? 'p-1' : 'p-0.5';

  return (
    <span className={`inline-flex items-center justify-center rounded-full ${bgClass} ${padding}`}>
      <img
        src={iconUrl}
        alt={provider}
        className={`${iconSize} rounded-[3px] object-cover`}
      />
    </span>
  );
};
