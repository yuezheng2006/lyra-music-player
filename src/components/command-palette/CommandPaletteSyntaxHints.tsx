import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../types';
import type { SyntaxSuggestion } from './syntax/types';

// src/components/command-palette/CommandPaletteSyntaxHints.tsx
// `--` completion strip for any command that declares flags (sleep timer today).

type CommandPaletteSyntaxHintsProps = {
    suggestions: SyntaxSuggestion[];
    activeIndex: number;
    onAccept: (suggestion: SyntaxSuggestion) => void;
    onHover: (index: number) => void;
    isDaylight: boolean;
    theme: Theme;
};

const CommandPaletteSyntaxHints: React.FC<CommandPaletteSyntaxHintsProps> = ({
    suggestions,
    activeIndex,
    onAccept,
    onHover,
    isDaylight,
    theme,
}) => {
    const { t } = useTranslation();
    if (suggestions.length === 0) {
        return null;
    }

    return (
        <div
            className="border-b px-3 py-2"
            style={{ borderColor: isDaylight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)' }}
        >
            <div className="mb-1.5 px-1 text-[10px] uppercase tracking-[0.14em] opacity-45">
                                {t('commandPalette.syntaxHint', { defaultValue: 'Options' })}
            </div>
            <div className="flex flex-col gap-0.5">
                {suggestions.map((suggestion, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => onAccept(suggestion)}
                            onMouseMove={() => onHover(index)}
                            className={`flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                                isActive
                                    ? (isDaylight ? 'bg-black/[0.06]' : 'bg-white/[0.10]')
                                    : (isDaylight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/[0.06]')
                            }`}
                        >
                            <span className="font-mono text-xs" style={{ color: theme.accentColor }}>
                                {`--${suggestion.flag}`}
                            </span>
                            {suggestion.descriptionKey && (
                                <span className="truncate text-xs opacity-55">
                                    {t(suggestion.descriptionKey, { defaultValue: suggestion.descriptionFallback })}
                                </span>
                            )}
                            {suggestion.aliases && suggestion.aliases.length > 0 && (
                                <span className="ml-auto shrink-0 font-mono text-[10px] opacity-35">
                                    {suggestion.aliases.map(alias => `--${alias}`).join(' ')}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CommandPaletteSyntaxHints;
