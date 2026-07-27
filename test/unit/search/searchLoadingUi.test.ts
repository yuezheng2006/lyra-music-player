import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// test/unit/search/searchLoadingUi.test.ts

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const overlayPath = path.join(repoRoot, 'src/components/SearchResultsOverlay.tsx');

describe('search loading UI', () => {
    it('uses one content loading treatment without input or button spinners', () => {
        const source = fs.readFileSync(overlayPath, 'utf8');

        expect(source).not.toContain('Loader2');
        expect(source).toContain('<SearchResultsLoadingState');
        expect(source).toContain('visibleResultCount === 0');
        expect(source).toContain('<SearchProgressLine');
        expect(source).toContain("t('localMusic.searching', '搜索中...')");
    });

    it('renders reusable recent searches directly below the form', () => {
        const source = fs.readFileSync(overlayPath, 'utf8');

        expect(source).toContain('<RecentSearchChips');
        expect(source.indexOf('</form>')).toBeLessThan(source.indexOf('<RecentSearchChips'));
        expect(source).toContain('disabled={isSearching}');
        expect(source).toContain('onSubmitSearch(entry.query, { displayQuery: entry.displayQuery })');
        expect(source).toContain('clearRecentSearchHistory(recentSearchChannelKey)');
    });

    it('completes search input interaction states for focus, clear, and Esc', () => {
        const source = fs.readFileSync(overlayPath, 'utf8');

        expect(source).toContain('data-testid="search-overlay-input"');
        expect(source).toContain('data-testid="search-overlay-submit"');
        expect(source).toContain('focus-within:ring-2');
        expect(source).toContain('searchInputRef.current?.focus');
        expect(source).toContain('clearSearchInput()');
        expect(source).toContain('First Esc clears the field');
        expect(source).toContain('aria-label={searchPlaceholder}');
        expect(source).toContain('enterKeyHint="search"');
    });
});
