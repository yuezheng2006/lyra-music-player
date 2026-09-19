// src/components/command-palette/syntax/types.ts
// Optional `--flag` dialect that palette commands can declare.

export type SyntaxFlagSpec = {
    name: string;
    aliases?: string[];
    descriptionKey?: string;
    descriptionFallback?: string;
};

export type CommandSyntaxSpec = {
    flags: SyntaxFlagSpec[];
};

export type SyntaxSuggestion = {
    id: string;
    flag: string;
    aliases?: string[];
    descriptionKey?: string;
    descriptionFallback?: string;
    replacement: string;
};
