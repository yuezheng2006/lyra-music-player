// src/utils/lyrics/awlrcContainer.ts
// 解析洛雪音乐（LX Music）写在 LRC 末尾的 `[awlrc:lrc:B64,tlrc:B64,rlrc:B64,awlrc:B64]` 容器。

const AWLRC_CONTAINER_REGEX = /\[awlrc:(.+)\]/;
const CJK_SCRIPT_REGEX = /[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/gu;
const LATIN_LETTER_REGEX = /[A-Za-z]/g;

export interface AwlrcContainerTracks {
    lrc?: string;
    tlrc?: string;
    rlrc?: string;
    awlrc?: string;
}

const decodeBase64Utf8 = (value: string): string => {
    let padded = value.trim();
    while (padded.length % 4 !== 0) {
        padded += '=';
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(padded, 'base64').toString('utf8');
    }

    return new TextDecoder('utf-8').decode(Uint8Array.from(atob(padded), char => char.charCodeAt(0)));
};

const isHanTransliteration = (track: string): boolean => {
    const cjkCount = (track.match(CJK_SCRIPT_REGEX) || []).length;
    const latinCount = (track.match(LATIN_LETTER_REGEX) || []).length;
    return cjkCount > latinCount;
};

/** 取出 `[awlrc:...]` 容器并解码各轨；未命中时返回 null。 */
export const extractAwlrcContainer = (content?: string): AwlrcContainerTracks | null => {
    const containerMatch = content?.match(AWLRC_CONTAINER_REGEX);
    if (!containerMatch) {
        return null;
    }

    const tracks: AwlrcContainerTracks = {};
    let decodedAny = false;

    for (const segment of containerMatch[1].split(',')) {
        const separatorIndex = segment.indexOf(':');
        if (separatorIndex <= 0) {
            continue;
        }

        const key = segment.slice(0, separatorIndex);
        if (key !== 'lrc' && key !== 'tlrc' && key !== 'rlrc' && key !== 'awlrc') {
            continue;
        }

        try {
            const decoded = decodeBase64Utf8(segment.slice(separatorIndex + 1));
            if (decoded.trim()) {
                tracks[key] = decoded;
                decodedAny = true;
            }
        } catch (error) {
            console.warn(`[awlrcContainer] Failed to decode "${key}" track:`, error);
        }
    }

    if (tracks.rlrc && isHanTransliteration(tracks.rlrc)) {
        delete tracks.rlrc;
    }

    return decodedAny ? tracks : null;
};
