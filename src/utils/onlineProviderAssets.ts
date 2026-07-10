import type { OnlineMusicProviderId } from '../types';
import neteaseIconUrl from '../assets/providers/netease-icon.png';
import qqIconUrl from '../assets/providers/qq-icon.png';
import qishuiIconUrl from '../assets/providers/qishui-icon.png';
import cocoIconUrl from '../assets/providers/coco-icon.svg';

// src/utils/onlineProviderAssets.ts
// Brand marks for peer providers shown as special home entries / badges.

export const ONLINE_PROVIDER_ICON_URL: Partial<Record<OnlineMusicProviderId, string>> = {
    netease: neteaseIconUrl,
    qq: qqIconUrl,
    qishui: qishuiIconUrl,
    coco: cocoIconUrl,
};

export const resolveOnlineProviderIconUrl = (
    provider?: string | null,
): string | undefined => {
    if (
        provider === 'netease'
        || provider === 'qq'
        || provider === 'qishui'
        || provider === 'coco'
    ) {
        return ONLINE_PROVIDER_ICON_URL[provider];
    }
    return undefined;
};
