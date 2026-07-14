import type { OnlineMusicProviderId } from '../types';
import neteaseIconUrl from '../assets/providers/netease-icon.png';
import qqIconUrl from '../assets/providers/qq-icon.png';
import qishuiIconUrl from '../assets/providers/qishui-icon.png';
import cocoIconUrl from '../assets/providers/coco-icon.svg';
import kugouIconUrl from '../assets/providers/kugou-icon.svg';
import bilibiliIconUrl from '../assets/providers/bilibili-icon.svg';
import { isOnlineMusicProviderId } from './onlinePeerProviders';

// src/utils/onlineProviderAssets.ts
// Brand marks for peer providers shown as special home entries / badges.

export const ONLINE_PROVIDER_ICON_URL: Partial<Record<OnlineMusicProviderId, string>> = {
    netease: neteaseIconUrl,
    qq: qqIconUrl,
    qishui: qishuiIconUrl,
    coco: cocoIconUrl,
    kugou: kugouIconUrl,
    bilibili: bilibiliIconUrl,
};

export const resolveOnlineProviderIconUrl = (
    provider?: string | null,
): string | undefined => {
    if (isOnlineMusicProviderId(provider)) {
        return ONLINE_PROVIDER_ICON_URL[provider];
    }
    return undefined;
};
