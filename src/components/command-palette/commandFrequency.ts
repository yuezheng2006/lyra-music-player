// src/components/command-palette/commandFrequency.ts
// Usage counts that nudge ranking for commands that are common but not in the MRU list.
// Separate localStorage key from recentCommands.ts; missing data means bonus 0.

const STORAGE_KEY = 'command_palette_frequency_v1';

const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000;
const DECAY_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MAX_COUNT = 32;
const MAX_TRACKED_COMMANDS = 64;
const MIN_KEPT_COUNT = 0.5;
export const FREQUENCY_BONUS_MAX = 12;

export type CommandFrequencyState = {
    v: 1;
    anchor: number;
    counts: Record<string, number>;
};

export const createEmptyCommandFrequencyState = (now = Date.now()): CommandFrequencyState => ({
    v: 1,
    anchor: now,
    counts: {},
});

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const parseState = (raw: string | null, now: number): CommandFrequencyState => {
    if (!raw) {
        return createEmptyCommandFrequencyState(now);
    }

    try {
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.v !== 1 || typeof parsed.counts !== 'object' || parsed.counts === null) {
            return createEmptyCommandFrequencyState(now);
        }

        const counts: Record<string, number> = {};
        Object.entries(parsed.counts as Record<string, unknown>).forEach(([commandId, count]) => {
            if (isFiniteNumber(count) && count > 0) {
                counts[commandId] = Math.min(count, MAX_COUNT);
            }
        });

        return {
            v: 1,
            anchor: isFiniteNumber(parsed.anchor) ? parsed.anchor : now,
            counts,
        };
    } catch {
        return createEmptyCommandFrequencyState(now);
    }
};

export const readCommandFrequencyState = (now = Date.now()): CommandFrequencyState => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return createEmptyCommandFrequencyState(now);
    }
    return parseState(window.localStorage.getItem(STORAGE_KEY), now);
};

const writeCommandFrequencyState = (state: CommandFrequencyState) => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

/** Half-life decay + prune. Exported so tests can drive a fake clock. */
export const decayCommandFrequencyState = (
    state: CommandFrequencyState,
    now: number,
): CommandFrequencyState => {
    const elapsed = now - state.anchor;
    if (elapsed < DECAY_INTERVAL_MS) {
        return state;
    }

    const factor = 0.5 ** (elapsed / HALF_LIFE_MS);
    const counts: Record<string, number> = {};
    Object.entries(state.counts).forEach(([commandId, count]) => {
        const next = count * factor;
        if (next >= MIN_KEPT_COUNT) {
            counts[commandId] = next;
        }
    });

    return { v: 1, anchor: now, counts };
};

const prune = (counts: Record<string, number>): Record<string, number> => {
    const entries = Object.entries(counts);
    if (entries.length <= MAX_TRACKED_COMMANDS) {
        return counts;
    }
    return Object.fromEntries(
        entries.sort((a, b) => b[1] - a[1]).slice(0, MAX_TRACKED_COMMANDS),
    );
};

/** Record one executed command. Writes localStorage once per run, not per keystroke. */
export const recordCommandUse = (
    commandId: string,
    state: CommandFrequencyState,
    now = Date.now(),
): CommandFrequencyState => {
    const decayed = decayCommandFrequencyState(state, now);
    const counts = { ...decayed.counts };
    counts[commandId] = Math.min((counts[commandId] ?? 0) + 1, MAX_COUNT);

    const next: CommandFrequencyState = { v: 1, anchor: decayed.anchor, counts: prune(counts) };
    writeCommandFrequencyState(next);
    return next;
};

/** Log-scaled bonus in [0, FREQUENCY_BONUS_MAX]. */
export const getCommandFrequencyBonus = (
    counts: Record<string, number>,
    commandId: string,
): number => {
    const count = counts[commandId];
    if (!isFiniteNumber(count) || count <= 0) {
        return 0;
    }
    const saturated = Math.min(count, MAX_COUNT);
    const ratio = Math.log1p(saturated) / Math.log1p(MAX_COUNT);
    return Math.round(FREQUENCY_BONUS_MAX * Math.min(1, ratio));
};
