// services/lyrics-resolve/src/resolve/selectCandidate.ts
// Score and filter search candidates for automatic lyric matching.

import { calculateMatchScoreDetails } from '@lyra/utils/lyrics/matchScore';
import type { SongResult } from '@lyra/types';
import type { ResolveCandidate } from '../providers/types';

const AUTO_MATCH_SEARCH_LIMIT = 10;
const AUTO_MATCH_MIN_SCORE = 75;

export type MatchTarget = {
    title: string;
    artist: string;
    durationMs: number;
    album?: string;
};

function asSongResult(candidate: ResolveCandidate): SongResult {
    const artists = (candidate.artists || []).map((a, idx) => ({
        id: Number(a.id ?? idx) || idx,
        name: a.name,
    }));
    const album = {
        id: Number(candidate.album?.id ?? candidate.al?.id ?? 0) || 0,
        name: candidate.album?.name || candidate.al?.name || '',
    };
    return {
        id: Number(candidate.id) || 0,
        name: candidate.name,
        artists,
        album,
        duration: candidate.duration || candidate.dt || 0,
        dt: candidate.dt || candidate.duration || 0,
        ar: artists,
        al: album,
        qqMid: candidate.qqMid,
        kgHash: candidate.kgHash,
    };
}

export function selectBestCandidate(
    candidates: ResolveCandidate[],
    target: MatchTarget,
): { candidate: ResolveCandidate; score: number } | null {
    const isReliable = (details: ReturnType<typeof calculateMatchScoreDetails>) =>
        details.titleMatched && (details.artistMatched || details.albumMatched === true);

    const scored = candidates
        .slice(0, AUTO_MATCH_SEARCH_LIMIT)
        .map(candidate => ({
            candidate,
            details: calculateMatchScoreDetails(target, asSongResult(candidate)),
        }))
        .sort((a, b) => b.details.score - a.details.score);

    const best = scored.find(item => isReliable(item.details)) ?? scored[0];
    if (!best || !isReliable(best.details) || best.details.score < AUTO_MATCH_MIN_SCORE) {
        return null;
    }
    return { candidate: best.candidate, score: best.details.score };
}
