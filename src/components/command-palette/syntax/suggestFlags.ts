import type { CommandSyntaxSpec, SyntaxSuggestion } from './types';

// src/components/command-palette/syntax/suggestFlags.ts
// Completions for `--` when the active command declares flags.

const FLAG_DRAFT_RE = /(?:^|\s)--([a-z-]*)$/i;

/** Flag chips shown once the user starts a `--` token. */
export const buildFlagSuggestions = (
    spec: CommandSyntaxSpec | undefined,
    input: string,
): SyntaxSuggestion[] => {
    if (!spec?.flags.length) {
        return [];
    }

    const match = FLAG_DRAFT_RE.exec(input);
    if (!match) {
        return [];
    }

    const draft = match[1].toLowerCase();
    const prefix = input.slice(0, match.index + match[0].length - match[1].length);
    return spec.flags
        .filter(flag => (
            flag.name.startsWith(draft)
            || (flag.aliases ?? []).some(alias => alias.startsWith(draft))
        ))
        .map(flag => ({
            id: `flag:${flag.name}`,
            flag: flag.name,
            aliases: flag.aliases,
            descriptionKey: flag.descriptionKey,
            descriptionFallback: flag.descriptionFallback,
            replacement: `${prefix}${flag.name}`.replace(/^\s+/, ''),
        }));
};
