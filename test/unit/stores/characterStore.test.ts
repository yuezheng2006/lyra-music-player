import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHARACTER_DEMOTED_MIGRATION_KEY,
  CHARACTER_ENABLED_STORAGE_KEY,
  DEFAULT_CHARACTER_ENABLED,
  readCharacterEnabledPreference,
  useCharacterStore,
} from '@/stores/useCharacterStore';

// test/unit/stores/characterStore.test.ts

const createLocalStorageMock = () => {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    clear: vi.fn(() => {
      values.clear();
    }),
  };
};

describe('useCharacterStore', () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorageMock);
    (globalThis as { window?: { localStorage: Storage } }).window = {
      localStorage: localStorageMock as unknown as Storage,
    };
    useCharacterStore.setState({ enabled: DEFAULT_CHARACTER_ENABLED });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as { window?: unknown }).window;
  });

  it('one-time demotion forces character off then marks migration done', () => {
    expect(DEFAULT_CHARACTER_ENABLED).toBe(false);
    localStorageMock.setItem(CHARACTER_ENABLED_STORAGE_KEY, '1');
    expect(readCharacterEnabledPreference()).toBe(false);
    expect(localStorageMock.getItem(CHARACTER_DEMOTED_MIGRATION_KEY)).toBe('1');
    expect(localStorageMock.getItem(CHARACTER_ENABLED_STORAGE_KEY)).toBe('0');
  });

  it('honors an explicit stored opt-in after demotion migration', () => {
    localStorageMock.setItem(CHARACTER_DEMOTED_MIGRATION_KEY, '1');
    localStorageMock.setItem(CHARACTER_ENABLED_STORAGE_KEY, '1');
    expect(readCharacterEnabledPreference()).toBe(true);
  });

  it('honors an explicit stored opt-out after demotion migration', () => {
    localStorageMock.setItem(CHARACTER_DEMOTED_MIGRATION_KEY, '1');
    localStorageMock.setItem(CHARACTER_ENABLED_STORAGE_KEY, '0');
    expect(readCharacterEnabledPreference()).toBe(false);
  });

  it('persists setEnabled to localStorage', () => {
    useCharacterStore.getState().setEnabled(true);
    expect(useCharacterStore.getState().enabled).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(CHARACTER_ENABLED_STORAGE_KEY, '1');

    useCharacterStore.getState().setEnabled(false);
    expect(useCharacterStore.getState().enabled).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(CHARACTER_ENABLED_STORAGE_KEY, '0');
  });
});
