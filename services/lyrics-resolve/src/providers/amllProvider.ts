// services/lyrics-resolve/src/providers/amllProvider.ts
// Direct AMLL TTML fetch for Node (no browser lyric-proxy).

import { parseLyricsByFormat } from '@lyra/utils/lyrics/parserCore';
import type { LyricData } from '@lyra/types';
import type { AmllSourcePort } from './types';

const AMLL_DB_BASE_URL = 'https://amll-ttml-db.stevexmh.net';

export function createAmllProvider(): AmllSourcePort {
    return {
        fetchByPlatformId: async (platform, musicId) => {
            const id = String(musicId).trim();
            if (!id) {
                return null;
            }
            const url = `${AMLL_DB_BASE_URL}/${platform}/${encodeURIComponent(id)}?format=ttml`;
            try {
                const response = await fetch(url, {
                    headers: { Accept: 'application/ttml+xml, text/plain, */*' },
                    signal: AbortSignal.timeout(5000),
                });
                if (!response.ok) {
                    return null;
                }
                const ttml = await response.text();
                if (!ttml.trim() || !/<tt(?:\s|>)/i.test(ttml)) {
                    return null;
                }
                const parsed = parseLyricsByFormat('ttml', ttml) as LyricData | null;
                return parsed?.lines?.length ? parsed : null;
            } catch (error) {
                console.warn(`[lyrics-resolve] AMLL fetch failed for ${platform}/${id}:`, error);
                return null;
            }
        },
    };
}
