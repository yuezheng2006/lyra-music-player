```markdown
# lyra-music-player Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development patterns and workflows for contributing to the `lyra-music-player` project, a TypeScript-based music player application. You'll learn about the project's coding conventions, how to add new features and music providers, update documentation, and write effective tests. The guide is designed to help both new and experienced contributors work efficiently and maintain consistency across the codebase.

## Coding Conventions

- **Language:** TypeScript
- **Framework:** None detected (vanilla TypeScript)
- **File Naming:** Use `camelCase` for file and directory names.
  - Example: `musicPlayer.ts`, `nowPlayingBar/`
- **Import Style:** Use relative imports.
  - Example:
    ```typescript
    import { usePlayback } from '../hooks/usePlayback';
    ```
- **Export Style:** Use named exports.
  - Example:
    ```typescript
    // src/services/musicService.ts
    export function playTrack(trackId: string) { ... }
    ```
- **Commit Messages:** Follow [Conventional Commits](https://www.conventionalcommits.org/) with the `feat` prefix for features.
  - Example: `feat: add mood engine to playlist generator`

## Workflows

### Add New Feature with UI, State, and Tests
**Trigger:** When adding a new user-facing feature involving UI, state, and logic  
**Command:** `/new-feature`

1. **Create or update UI components** in `src/components/`.
   - Example: `src/components/MoodSelector.tsx`
2. **Add or update supporting hooks** in `src/hooks/`.
   - Example: `src/hooks/useMoodEngine.ts`
3. **Add or update state stores** in `src/stores/`.
   - Example: `src/stores/moodStore.ts`
4. **Add or update types** in `src/types/` or `src/types.ts`.
   - Example:
     ```typescript
     // src/types/mood.ts
     export type Mood = 'happy' | 'sad' | 'energetic';
     ```
5. **Update or add service logic** in `src/services/` or `scripts/`.
   - Example: `src/services/moodService.ts`
6. **Add or update assets** if needed in `src/assets/`.
   - Example: `src/assets/moods/happy.svg`
7. **Update localization files** in `src/i18n/locales/`.
   - Example: `src/i18n/locales/en.json`
8. **Write or update unit tests** in `test/unit/` and/or `test/ui/`.
   - Example: `test/unit/moodEngine.test.ts`

### Add or Integrate Music Provider
**Trigger:** When integrating a new online music provider (e.g., Kugou, Bilibili)  
**Command:** `/add-provider`

1. **Create or update provider adapter scripts** in `scripts/music-provider-adapters/`.
   - Example: `scripts/music-provider-adapters/kugouAdapter.ts`
2. **Update provider registry and client** in `src/services/musicProviders/`.
   - Example: `src/services/musicProviders/registry.ts`
3. **Add provider icons/assets** in `src/assets/providers/`.
   - Example: `src/assets/providers/kugou.png`
4. **Update UI components** to show provider badges and filters in `src/components/`.
   - Example: `src/components/ProviderBadge.tsx`
5. **Update hooks and stores** for provider data in `src/hooks/` and `src/stores/`.
   - Example: `src/hooks/useProvider.ts`
6. **Update localization files** in `src/i18n/locales/`.
   - Example: `src/i18n/locales/zh.json`
7. **Add or update utility functions** for provider logic in `src/utils/`.
   - Example: `src/utils/providerUtils.ts`
8. **Write or update unit tests** for provider integration in `test/unit/`.
   - Example: `test/unit/kugouAdapter.test.ts`

### Add or Update Feature with Documentation and Tests
**Trigger:** When introducing or updating a significant feature or architectural change and documenting it  
**Command:** `/new-doc-feature`

1. **Create or update ADRs** (Architecture Decision Records) in `docs/adr/`.
   - Example: `docs/adr/0003-mood-engine.md`
2. **Update or add technical documentation** in `docs/` or `docs/technical.md`.
   - Example: `docs/technical.md`
3. **Add or update README files** in relevant component/service directories.
   - Example: `src/components/MoodSelector/README.md`
4. **Implement or update feature** in `src/components/`, `src/services/`, etc.
   - Example: `src/services/moodService.ts`
5. **Write or update unit and UI tests** in `test/unit/` and `test/ui/`.
   - Example: `test/ui/MoodSelector.test.tsx`

## Testing Patterns

- **Testing Framework:** [Jest](https://jestjs.io/)
- **Test File Pattern:** Files end with `.test.ts` or `.test.tsx`.
  - Example: `moodEngine.test.ts`
- **Test Location:** Place unit tests in `test/unit/`, UI tests in `test/ui/`.
- **Test Example:**
  ```typescript
  // test/unit/moodEngine.test.ts
  import { generatePlaylist } from '../../src/services/moodService';

  describe('generatePlaylist', () => {
    it('returns happy tracks for happy mood', () => {
      const playlist = generatePlaylist('happy');
      expect(playlist.every(track => track.mood === 'happy')).toBe(true);
    });
  });
  ```

## Commands

| Command         | Purpose                                                         |
|-----------------|-----------------------------------------------------------------|
| /new-feature    | Start a new feature with UI, state, and tests                   |
| /add-provider   | Integrate a new music provider                                  |
| /new-doc-feature| Add or update a feature with documentation and tests            |
```
