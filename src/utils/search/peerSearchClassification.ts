import { isBilibiliShareUrl, isQishuiShareUrl } from '../onlineSearchRouting';

// src/utils/search/peerSearchClassification.ts
// Single seam for peer-channel search kind: prefixes, AI playlist tags, and share links.

export type PeerSearchKind = 'empty' | 'share' | 'category' | 'track' | 'account';

export type OnlineSearchShortcutGroupId = 'hot' | 'common' | 'accounts' | 'category' | 'song' | 'artist';

export type PeerSearchClassification = {
    kind: PeerSearchKind;
    query: string;
    raw: string;
};

const QISHUI_AI_CATEGORY_RE = /^ai/i;

const matchNamedPrefix = (raw: string, names: readonly string[]): string | null => {
    const pattern = new RegExp(`^(?:${names.join('|')}):\\s*(.*)$`, 'i');
    const match = pattern.exec(raw);
    if (!match) return null;
    return match[1].trim();
};

const emptyResult = (raw: string): PeerSearchClassification => ({
    kind: 'empty',
    query: '',
    raw,
});

const classifyQishui = (raw: string): PeerSearchClassification => {
    const categoryQuery = matchNamedPrefix(raw, ['cat', '分类']);
    if (categoryQuery !== null) {
        return categoryQuery ? { kind: 'category', query: categoryQuery, raw } : emptyResult(raw);
    }

    const trackQuery = matchNamedPrefix(raw, ['song', '歌曲']);
    if (trackQuery !== null) {
        return trackQuery ? { kind: 'track', query: trackQuery, raw } : emptyResult(raw);
    }

    if (QISHUI_AI_CATEGORY_RE.test(raw)) {
        return { kind: 'category', query: raw, raw };
    }

    return { kind: 'track', query: raw, raw };
};

const classifyBilibili = (raw: string): PeerSearchClassification => {
    const midQuery = matchNamedPrefix(raw, ['mid', 'uid']);
    if (midQuery !== null) {
        return /^\d+$/.test(midQuery) ? { kind: 'account', query: midQuery, raw } : { kind: 'track', query: raw, raw };
    }

    const atMatch = /^@\s*(.+)$/.exec(raw);
    if (atMatch) {
        const query = atMatch[1].trim();
        return query ? { kind: 'account', query, raw } : emptyResult(raw);
    }

    const accountQuery = matchNamedPrefix(raw, ['up', '账号', '用户']);
    if (accountQuery !== null) {
        return accountQuery ? { kind: 'account', query: accountQuery, raw } : emptyResult(raw);
    }

    return { kind: 'track', query: raw, raw };
};

/** Resolve how a peer channel should search this query. */
export const classifyPeerSearchQuery = (
    provider: string | null | undefined,
    rawQuery: string,
): PeerSearchClassification => {
    const raw = String(rawQuery || '').trim();
    if (!raw) return emptyResult('');

    if (isQishuiShareUrl(raw) || isBilibiliShareUrl(raw)) {
        return { kind: 'share', query: raw, raw };
    }

    if (provider === 'qishui') return classifyQishui(raw);
    if (provider === 'bilibili') return classifyBilibili(raw);
    return { kind: 'track', query: raw, raw };
};

const GROUP_KIND: Record<OnlineSearchShortcutGroupId, PeerSearchKind> = {
    category: 'category',
    song: 'track',
    artist: 'track',
    accounts: 'account',
    hot: 'track',
    common: 'track',
};

/** Shortcut group id → the kind every chip in that group must classify as. */
export const shortcutGroupSearchKind = (
    groupId: OnlineSearchShortcutGroupId,
): PeerSearchKind => GROUP_KIND[groupId];
