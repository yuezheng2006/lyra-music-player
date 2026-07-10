// scripts/music-provider-adapters/qq-provider-adapter.mjs
// QQ provider adapter with official API first and MusicSquare open API fallback.

const QQ_OPEN_API_BASE = process.env.MUSIC_PROVIDER_QQ_OPEN_API_BASE
    || process.env.VITE_QQ_OPEN_API_BASE
    || 'https://tang.api.s01s.cn/music_open_api.php';

const QQ_OFFICIAL_API_URL = 'https://u.y.qq.com/cgi-bin/musicu.fcg';

const QQ_AUDIO_QUALITY_CANDIDATES = [
    { prefix: 'RS01', ext: '.flac', level: 'hires' },
    { prefix: 'F000', ext: '.flac', level: 'lossless' },
    { prefix: 'M800', ext: '.mp3', level: 'exhigh' },
    { prefix: 'M500', ext: '.mp3', level: 'standard' },
    { prefix: 'C400', ext: '.m4a', level: 'aac' },
];

const QQ_OPEN_AUDIO_FIELDS = [
    { field: 'song_play_url_sq', level: 'hires' },
    { field: 'song_play_url_pq', level: 'lossless' },
    { field: 'song_play_url_accom', level: 'exhigh' },
    { field: 'song_play_url_hq', level: 'exhigh' },
    { field: 'song_play_url_standard', level: 'standard' },
    { field: 'song_play_url_fq', level: 'standard' },
    { field: 'song_play_url', level: 'standard' },
];

const normalizeQualityPreference = (quality) => {
    const raw = String(quality || '').toLowerCase().trim();
    if (['hires', 'hi-res', 'highres'].includes(raw)) return 'hires';
    if (['lossless', 'flac', 'sq'].includes(raw)) return 'lossless';
    if (['exhigh', 'high', '320', '320k'].includes(raw)) return 'exhigh';
    if (['standard', 'normal', '128', '128k'].includes(raw)) return 'standard';
    return 'hires';
};

const hashProviderSongId = (providerId, rawId) => {
    let hash = 0x811c9dc5;
    const input = `${providerId}:${rawId}`;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
};

const normalizeAudioUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http:') ? url.replace('http:', 'https:') : url;
};

const buildDetailKeyword = (song, fallbackQuery = '') => {
    const title = song?.name || song?.title || '';
    const artist = Array.isArray(song?.artists)
        ? song.artists.map(item => (typeof item === 'string' ? item : item?.name || '')).filter(Boolean).join(' ')
        : (song?.artist || '');
    const keyword = `${title} ${artist}`.trim();
    return keyword || String(fallbackQuery || '').trim();
};

const getQualityCandidates = (quality) => {
    const preferred = normalizeQualityPreference(quality);
    const preferredIndex = QQ_AUDIO_QUALITY_CANDIDATES.findIndex(candidate => candidate.level === preferred);
    return preferredIndex <= 0
        ? QQ_AUDIO_QUALITY_CANDIDATES
        : QQ_AUDIO_QUALITY_CANDIDATES.slice(preferredIndex);
};

const fetchQQOpenPayload = async (params) => {
    const requestUrl = new URL(QQ_OPEN_API_BASE);
    Object.entries(params).forEach(([key, value]) => {
        requestUrl.searchParams.set(key, value);
    });

    const response = await fetch(requestUrl, {
        headers: {
            'User-Agent': 'Auralis/1.0',
        },
    });
    if (!response.ok) {
        throw new Error(`QQ open API failed: ${response.status}`);
    }

    return response.json();
};

const normalizeSearchList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
};

const requestOfficialQQ = async (method, module, param, options = {}) => {
    const auth = options.qqAuth || {};
    const payload = {
        comm: {
            ct: 11,
            cv: '1003006',
            v: '1003006',
            os_ver: '15',
            phonetype: '24122RKC7C',
            rom: 'Redmi/miro/miro:15/AE3A.240806.005/OS2.0.102.0.VOMCNXM:user/release-keys',
            tmeAppID: 'qqmusiclight',
            nettype: 'NETWORK_WIFI',
            udid: '0',
            uid: auth.uin || '0',
            ...options.comm,
        },
        request: {
            method,
            module,
            param,
        },
    };

    const response = await fetch(QQ_OFFICIAL_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: auth.cookieHeader || 'tmeLoginType=-1;',
            'User-Agent': 'okhttp/3.14.9',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`QQ official API failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 0 || data.request?.code !== 0) {
        throw new Error(`QQ official API error: code ${data.code || data.request?.code}`);
    }

    return data.request.data;
};

const mapOfficialSearchItem = (info) => {
    const artists = (info.singer || []).map((singer, index) => ({
        id: singer.id || index,
        name: singer.name || 'Unknown Artist',
    }));
    const albumMid = info.album?.mid;
    const picUrl = albumMid
        ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albumMid}.jpg?max_age=2592000`
        : undefined;

    return {
        id: Number(info.id || 0),
        providerSongId: info.mid,
        title: info.title || 'Unknown Song',
        artist: artists.map(item => item.name).join(', '),
        artists,
        album: {
            id: Number(info.album?.id || 0),
            name: info.album?.name || 'Unknown Album',
            picUrl,
        },
        durationMs: Number(info.interval || 0) * 1000,
        qqMid: info.mid,
        qqMediaMid: info.file?.media_mid || info.mid,
        musicProvider: 'qq',
    };
};

const searchOfficialQQ = async (query, limit, offset, qqAuth) => {
    const page = Math.floor(offset / limit) + 1;
    const data = await requestOfficialQQ('DoSearchForQQMusicLite', 'music.search.SearchCgiService', {
        search_id: String(Math.floor(Math.random() * 100000000000000 + Date.now() % 86400000)),
        remoteplace: 'search.android.keyboard',
        query: query.length > 60 ? query.slice(0, 60) : query,
        search_type: 0,
        num_per_page: limit,
        page_num: page,
        highlight: 0,
        nqc_flag: 0,
        page_id: 1,
        grp: 1,
    }, { qqAuth });

    const songs = (data?.body?.item_song || []).map(mapOfficialSearchItem);
    return {
        songs,
        total: songs.length,
        hasMore: songs.length >= limit,
    };
};

const mapOpenSearchItem = (item) => {
    const mid = String(item?.song_mid || '').trim();
    if (!mid) return null;

    const title = String(item?.song_title || 'Unknown Song').trim();
    const artist = String(item?.singer_name || 'Unknown Artist').trim();

    return {
        id: hashProviderSongId('qq', mid),
        providerSongId: mid,
        title,
        artist,
        artists: [artist],
        album: '',
        qqMid: mid,
        qqMediaMid: mid,
        musicProvider: 'qq',
    };
};

const searchOpenQQ = async (query, limit, offset) => {
    const payload = await fetchQQOpenPayload({
        msg: query,
        type: 'json',
    });
    const list = normalizeSearchList(payload)
        .map(mapOpenSearchItem)
        .filter(Boolean);
    const page = list.slice(offset, offset + limit);
    return {
        songs: page,
        total: list.length,
        hasMore: offset + page.length < list.length,
    };
};

const resolveOfficialAudioUrl = async (song, quality, qqAuth) => {
    if (!qqAuth?.isLoggedIn) {
        return null;
    }

    const mid = String(song?.qqMid || song?.providerSongId || '').trim();
    if (!mid) {
        return null;
    }

    const mediaMid = String(song?.qqMediaMid || mid).trim();
    const mediaIds = mediaMid === mid ? [mid] : [mediaMid, mid];
    const fileCandidates = mediaIds.flatMap(mediaId =>
        getQualityCandidates(quality).map(candidate => ({
            filename: `${candidate.prefix}${mediaId}${candidate.ext}`,
        }))
    );
    const filename = fileCandidates.map(candidate => candidate.filename);
    const data = await requestOfficialQQ('CgiGetVkey', 'vkey.GetVkeyServer', {
        filename,
        guid: qqAuth.guid || '10000',
        loginflag: 1,
        platform: '20',
        songmid: filename.map(() => mid),
        songtype: filename.map(() => 0),
        uin: qqAuth.uin || '0',
    }, {
        qqAuth,
        comm: {
            authst: qqAuth.musicKey,
            ct: 19,
            cv: 0,
            format: 'json',
            uin: qqAuth.uin || '0',
        },
    });

    const midUrlInfo = Array.isArray(data?.midurlinfo) ? data.midurlinfo : [];
    const purl = midUrlInfo.map(item => item?.purl).find(value => typeof value === 'string' && value.length > 0);
    if (!purl) {
        return null;
    }

    const sip = Array.isArray(data?.sip) && typeof data.sip[0] === 'string'
        ? data.sip[0]
        : 'https://dl.stream.qqmusic.qq.com/';
    const url = purl.startsWith('http') ? purl : `${sip}${purl}`;
    return normalizeAudioUrl(url);
};

const pickOpenAudioUrl = (detail, quality) => {
    const preferred = normalizeQualityPreference(quality);
    const preferredIndex = QQ_OPEN_AUDIO_FIELDS.findIndex(candidate => candidate.level === preferred);
    const candidates = preferredIndex <= 0
        ? QQ_OPEN_AUDIO_FIELDS
        : QQ_OPEN_AUDIO_FIELDS.slice(preferredIndex);

    for (const candidate of candidates) {
        const url = detail?.[candidate.field];
        if (typeof url === 'string' && url.trim()) {
            return normalizeAudioUrl(url);
        }
    }

    return null;
};

const resolveOpenAudioUrl = async (song, quality) => {
    const keyword = buildDetailKeyword(song);
    const mid = String(song?.qqMid || song?.providerSongId || '').trim();

    if (mid && !/^\d+$/.test(mid)) {
        try {
            const detail = await fetchQQOpenPayload({
                msg: keyword || mid,
                type: 'json',
                mid,
            });
            if (detail && typeof detail === 'object' && detail.song_mid) {
                const url = pickOpenAudioUrl(detail, quality);
                if (url) return url;
            }
        } catch (error) {
            console.warn('[qq-provider-adapter] open mid lookup failed, trying search fallback', error);
        }
    }

    if (!keyword) {
        return null;
    }

    const search = await searchOpenQQ(keyword, 8, 0);
    const candidates = (search.songs || []).filter(item => item?.qqMid);
    if (candidates.length === 0) {
        return null;
    }

    const preferred = mid
        ? candidates.find(item => item.qqMid === mid)
        : null;
    const matched = preferred
        || candidates.find(item => item.title === (song?.name || song?.title))
        || candidates[0];

    const detail = await fetchQQOpenPayload({
        msg: buildDetailKeyword(matched, keyword),
        type: 'json',
        mid: matched.qqMid,
    });
    if (!detail || typeof detail !== 'object' || !detail.song_mid) {
        return null;
    }

    return pickOpenAudioUrl(detail, quality);
};

const fetchOpenLyricsText = async (song) => {
    const mid = String(song?.qqMid || song?.providerSongId || song?.id || '').trim();
    if (!mid) {
        return '';
    }

    const detail = await fetchQQOpenPayload({
        msg: buildDetailKeyword(song),
        type: 'json',
        mid,
    });
    return String(detail?.song_lyric || detail?.lyric || '').trim();
};

export async function search({ query, limit = 30, offset = 0, qqAuth }) {
    const keyword = String(query || '').trim();
    if (!keyword) {
        return { songs: [], total: 0, hasMore: false };
    }

    try {
        const official = await searchOfficialQQ(keyword, limit, offset, qqAuth);
        if (official.songs.length > 0) {
            return official;
        }
    } catch (error) {
        console.warn('[qq-provider-adapter] official search failed, falling back to open API', error);
    }

    return searchOpenQQ(keyword, limit, offset);
}

export async function audio({ song, quality, qqAuth }) {
    try {
        const officialUrl = await resolveOfficialAudioUrl(song, quality, qqAuth);
        if (officialUrl) {
            return { audioUrl: officialUrl };
        }
    } catch (error) {
        console.warn('[qq-provider-adapter] official audio failed, falling back to open API', error);
    }

    const openUrl = await resolveOpenAudioUrl(song, quality);
    return {
        audioUrl: openUrl,
    };
}

export async function lyrics({ song, qqAuth }) {
    void qqAuth;
    const lyricsText = await fetchOpenLyricsText(song);
    if (!lyricsText) {
        return { lyrics: null };
    }

    return { lyricsText };
}
