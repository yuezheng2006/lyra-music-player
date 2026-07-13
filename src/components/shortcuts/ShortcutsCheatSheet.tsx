import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ThemedDialog from '@/components/shared/ThemedDialog';
import { useSettingsUiStore } from '@/stores/useSettingsUiStore';
import { SHORTCUT_GROUPS, type ShortcutEntry } from './shortcutCatalog';

// src/components/shortcuts/ShortcutsCheatSheet.tsx
// Grouped keyboard shortcut cheat sheet opened with Cmd/Ctrl+/ .

const renderShortcutKeys = (
    shortcut: ShortcutEntry,
    keyBg: string,
    textSecondary: string,
) => (
    <div className="flex items-center gap-1.5 shrink-0">
        {shortcut.keys.map((key, index) => (
            <React.Fragment key={`${shortcut.id}-${key}`}>
                {index > 0 && (
                    <span className={`text-xs ${textSecondary}`}>{shortcut.separator ?? '/'}</span>
                )}
                <kbd className={`px-2.5 py-1 rounded-md text-xs font-mono shadow-sm ${keyBg}`}>
                    {key}
                </kbd>
            </React.Fragment>
        ))}
    </div>
);

export const ShortcutsCheatSheet: React.FC = () => {
    const { t } = useTranslation();
    const isOpen = useSettingsUiStore(state => state.isShortcutsCheatSheetOpen);
    const setIsOpen = useSettingsUiStore(state => state.setIsShortcutsCheatSheetOpen);
    const isDaylight = useSettingsUiStore(state => state.isDaylight);

    const cardBg = isDaylight
        ? 'bg-zinc-50 border border-zinc-100'
        : 'bg-zinc-800/50 border border-zinc-700/50';
    const keyBg = isDaylight ? 'bg-white border border-zinc-200' : 'bg-white/10';
    const textPrimary = isDaylight ? 'text-zinc-900' : 'text-white';
    const textSecondary = isDaylight ? 'text-zinc-500' : 'text-zinc-400';
    const groupTitle = isDaylight ? 'text-zinc-700' : 'text-zinc-200';

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            setIsOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, setIsOpen]);

    return (
        <ThemedDialog
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            isDaylight={isDaylight}
            title={t('help.shortcutsCheatSheetTitle', 'Keyboard shortcuts')}
            description={t('help.shortcutsCheatSheetSubtitle', 'Player page controls, grouped by action.')}
            maxWidthClass="max-w-2xl"
        >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                {SHORTCUT_GROUPS.map(group => (
                    <section key={group.id} className="min-w-0">
                        <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${groupTitle}`}>
                            {t(group.titleKey, group.fallback)}
                        </h3>
                        <ul className="space-y-2">
                            {group.entries.map(shortcut => (
                                <li
                                    key={shortcut.id}
                                    className={`flex items-center justify-between gap-3 p-2.5 rounded-xl ${cardBg}`}
                                >
                                    <span className={`text-sm font-medium min-w-0 leading-snug ${textPrimary}`}>
                                        {t(shortcut.titleKey, shortcut.fallback)}
                                    </span>
                                    {renderShortcutKeys(shortcut, keyBg, textSecondary)}
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </ThemedDialog>
    );
};

export default ShortcutsCheatSheet;
