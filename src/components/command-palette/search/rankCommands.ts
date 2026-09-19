import { getCommandFrequencyBonus } from '../commandFrequency';
import type { CommandPaletteCommand, CommandPaletteMatch } from '../types';
import { scoreSubsequence } from './fuzzyScore';
import { normalizeSearchText, splitWords } from './normalize';

// src/components/command-palette/search/rankCommands.ts
// Palette ranking: existing exact/prefix/input/contains tiers, then subsequence fuzzy.
// Frequency only breaks ties among commands that are both outside the MRU list.

export const MAX_COMMAND_MATCHES = 10;

const MATCH_QUALITY = {
    fuzzy: 0,
    contains: 1,
    prefix: 2,
    input: 3,
    exact: 4,
} as const;

const NO_MATCH = -1;
const MIN_FUZZY_QUERY_LENGTH = 2;
const MAX_FUZZY_SCORE = 50;
const ASCII_QUERY = /^[a-z0-9 ]+$/;

type RankedCommandPaletteMatch = CommandPaletteMatch & {
    matchQuality: number;
};

const sliceInputAfterTerm = (query: string, term: string): string => {
    const termWordCount = splitWords(term).length;
    return query.trim().split(/\s+/).slice(termWordCount).join(' ');
};

const scoreCommand = (
    command: CommandPaletteCommand,
    normalizedQuery: string,
    rawQuery: string,
    frequencyCounts: Record<string, number>,
): RankedCommandPaletteMatch | null => {
    let tier: number = NO_MATCH;
    let score = 0;
    let input = '';
    let matchedTermLength = 0;

    for (const keyword of command.keywords) {
        const term = normalizeSearchText(keyword);
        if (!term) continue;

        if (normalizedQuery === term) {
            tier = Math.max(tier, MATCH_QUALITY.exact);
            score = Math.max(score, 120);
        } else if (term.startsWith(normalizedQuery)) {
            tier = Math.max(tier, MATCH_QUALITY.prefix);
            score = Math.max(score, 100 - term.length);
        } else if (normalizedQuery.startsWith(`${term} `)) {
            tier = Math.max(tier, MATCH_QUALITY.input);
            score = Math.max(score, 90 + term.length + (command.requiresInput ? 20 : 0));
            if (term.length > matchedTermLength) {
                matchedTermLength = term.length;
                input = sliceInputAfterTerm(rawQuery, term);
            }
        } else if (term.includes(normalizedQuery)) {
            tier = Math.max(tier, MATCH_QUALITY.contains);
            score = Math.max(score, 60 - term.indexOf(normalizedQuery));
        }
    }

    if (tier === NO_MATCH) {
        const condensed = normalizedQuery.replace(/ /g, '');
        if (ASCII_QUERY.test(normalizedQuery) && condensed.length >= MIN_FUZZY_QUERY_LENGTH) {
            let best: number | null = null;
            const fuzzyTargets = [
                normalizeSearchText(command.title),
                normalizeSearchText(command.description),
                ...command.keywords.map(keyword => normalizeSearchText(keyword)),
            ].filter(Boolean);
            for (const target of fuzzyTargets) {
                const fuzzy = scoreSubsequence(target, condensed);
                if (fuzzy !== null && (best === null || fuzzy > best)) {
                    best = fuzzy;
                }
            }
            if (best !== null) {
                tier = MATCH_QUALITY.fuzzy;
                score = Math.min(MAX_FUZZY_SCORE, best);
            }
        }
    }

    if (tier === NO_MATCH) {
        return null;
    }

    const bonus = getCommandFrequencyBonus(frequencyCounts, command.id);
    return { command, score: score + bonus, input, matchQuality: tier };
};

const buildLandingCommands = (
    filteredCommands: CommandPaletteCommand[],
    recentCommandIds: string[],
): CommandPaletteMatch[] => {
    const recentCommands = recentCommandIds
        .map(commandId => filteredCommands.find(command => command.id === commandId))
        .filter((command): command is CommandPaletteCommand => Boolean(command) && !command.requiresInput);
    const recentCommandIdSet = new Set(recentCommands.map(command => command.id));
    const defaultCommands = filteredCommands.filter(command => !recentCommandIdSet.has(command.id));

    return [...recentCommands, ...defaultCommands].slice(0, MAX_COMMAND_MATCHES).map((command, index) => ({
        command,
        score: recentCommandIdSet.has(command.id) ? 130 - index : 100 - index,
        input: '',
    }));
};

/** Rank an already-filtered command list. */
export const rankCommands = (
    query: string,
    filteredCommands: CommandPaletteCommand[],
    recentCommandIds: string[] = [],
    frequencyCounts: Record<string, number> = {},
): CommandPaletteMatch[] => {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
        return buildLandingCommands(filteredCommands, recentCommandIds);
    }

    const recentCommandRanks = new Map<string, number>();
    recentCommandIds.forEach((commandId, position) => {
        if (!recentCommandRanks.has(commandId)) {
            recentCommandRanks.set(commandId, position);
        }
    });

    const matches = filteredCommands
        .map(command => scoreCommand(command, normalizedQuery, query, frequencyCounts))
        .filter((match): match is RankedCommandPaletteMatch => Boolean(match))
        .sort((a, b) => {
            if (a.matchQuality !== b.matchQuality) {
                return b.matchQuality - a.matchQuality;
            }

            const aRecentRank = recentCommandRanks.get(a.command.id);
            const bRecentRank = recentCommandRanks.get(b.command.id);
            if (aRecentRank !== undefined || bRecentRank !== undefined) {
                if (aRecentRank === undefined) return 1;
                if (bRecentRank === undefined) return -1;
                if (aRecentRank !== bRecentRank) return aRecentRank - bRecentRank;
            }

            return b.score - a.score || a.command.title.localeCompare(b.command.title);
        });

    return matches.slice(0, MAX_COMMAND_MATCHES);
};
