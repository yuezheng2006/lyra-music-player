import type { OnlineMusicProviderId } from '../../types';

// src/utils/musicAccounts/unifiedMusicAccountProviders.ts
// Account-panel provider catalog for the unified connect UI (no drag graph).

export type UnifiedAccountProviderKind = 'login' | 'peer-free';

export type UnifiedAccountProviderDef = {
    id: OnlineMusicProviderId;
    kind: UnifiedAccountProviderKind;
    /** Short badge in the list (NE / QQ / QS …). */
    badge: string;
    titleKey: string;
    hintKey: string;
};

/** Order shown in the unified accounts panel. */
export const UNIFIED_ACCOUNT_PROVIDERS: readonly UnifiedAccountProviderDef[] = [
    {
        id: 'netease',
        kind: 'login',
        badge: 'NE',
        titleKey: 'account.netease',
        hintKey: 'home.neteaseProviderHint',
    },
    {
        id: 'qq',
        kind: 'login',
        badge: 'QQ',
        titleKey: 'account.qqMusic',
        hintKey: 'home.qqMusicProviderHint',
    },
    {
        id: 'qishui',
        kind: 'peer-free',
        badge: 'QS',
        titleKey: 'home.qishuiProvider',
        hintKey: 'home.qishuiProviderHint',
    },
    {
        id: 'kugou',
        kind: 'peer-free',
        badge: 'KG',
        titleKey: 'home.kugouProvider',
        hintKey: 'home.kugouProviderHint',
    },
    {
        id: 'coco',
        kind: 'peer-free',
        badge: 'CO',
        titleKey: 'account.coco',
        hintKey: 'account.cocoHint',
    },
] as const;

export const DEFAULT_UNIFIED_ACCOUNT_PROVIDER_ID: OnlineMusicProviderId = 'netease';
