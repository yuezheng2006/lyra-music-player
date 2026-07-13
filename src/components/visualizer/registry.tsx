import { useEffect, useState } from 'react';
import { type VisualizerMode } from '../../types';
import {
    type VisualizerEntryModule,
    type VisualizerRegistryEntry,
} from './definition';
import {
    VISUALIZER_REGISTRY_META,
    type VisualizerRegistryMeta,
} from './registryMeta';

export type {
    VisualizerRegistryEntry,
    VisualizerSettingsPanelProps,
    VisualizerSettingsResetProps,
    VisualizerSharedProps,
    VisualizerTuningKind,
} from './definition';

export type { VisualizerRegistryMeta } from './registryMeta';

// src/components/visualizer/registry.tsx
// Discovers visualizer modes eagerly as metadata, and lazy-loads entry modules on demand.

const visualizerEntryLoaders = import.meta.glob<VisualizerEntryModule>('./*/entry.tsx');

const VISUALIZER_REGISTRY_BY_MODE: Partial<Record<VisualizerMode, VisualizerRegistryMeta>> = Object.fromEntries(
    VISUALIZER_REGISTRY_META.map(entry => [entry.mode, entry]),
);

const entryCache = new Map<VisualizerMode, VisualizerRegistryEntry>();
const entryPromises = new Map<VisualizerMode, Promise<VisualizerRegistryEntry>>();

const resolveLoaderPath = (mode: VisualizerMode): string | null => {
    const suffix = `/${mode}/entry.tsx`;
    return Object.keys(visualizerEntryLoaders).find(path => path.endsWith(suffix)) ?? null;
};

/** Sync mode catalog used by menus and settings lists. */
export const VISUALIZER_REGISTRY: VisualizerRegistryMeta[] = [...VISUALIZER_REGISTRY_META]
    .sort((left, right) => left.order - right.order || left.mode.localeCompare(right.mode));

export const DEFAULT_VISUALIZER_MODE: VisualizerMode = 'classic';

export const hasVisualizerMode = (mode: string | null | undefined): mode is VisualizerMode =>
    Boolean(mode && VISUALIZER_REGISTRY_BY_MODE[mode as VisualizerMode]);

export const getVisualizerRegistryEntry = (mode: VisualizerMode): VisualizerRegistryMeta =>
    VISUALIZER_REGISTRY_BY_MODE[mode] ?? VISUALIZER_REGISTRY_BY_MODE[DEFAULT_VISUALIZER_MODE]!;

/** Load the full entry module (renderer + settings) for a mode, caching the result. */
export async function loadVisualizerRegistryEntry(mode: VisualizerMode): Promise<VisualizerRegistryEntry> {
    const resolvedMode = hasVisualizerMode(mode) ? mode : DEFAULT_VISUALIZER_MODE;
    const cached = entryCache.get(resolvedMode);
    if (cached) {
        return cached;
    }

    const inflight = entryPromises.get(resolvedMode);
    if (inflight) {
        return inflight;
    }

    const loaderPath = resolveLoaderPath(resolvedMode);
    const loader = loaderPath ? visualizerEntryLoaders[loaderPath] : null;
    if (!loader) {
        throw new Error(`[VisualizerRegistry] Missing entry loader for mode "${resolvedMode}"`);
    }

    const promise = loader().then(module => {
        if (!module.default) {
            throw new Error(`[VisualizerRegistry] Missing default export for mode "${resolvedMode}"`);
        }
        entryCache.set(resolvedMode, module.default);
        entryPromises.delete(resolvedMode);
        return module.default;
    });

    entryPromises.set(resolvedMode, promise);
    return promise;
}

/** React helper that resolves a full visualizer entry once the lazy module is ready. */
export function useVisualizerRegistryEntry(mode: VisualizerMode): VisualizerRegistryEntry | null {
    const [entry, setEntry] = useState<VisualizerRegistryEntry | null>(
        () => entryCache.get(hasVisualizerMode(mode) ? mode : DEFAULT_VISUALIZER_MODE) ?? null,
    );

    useEffect(() => {
        let cancelled = false;
        const resolvedMode = hasVisualizerMode(mode) ? mode : DEFAULT_VISUALIZER_MODE;
        const cached = entryCache.get(resolvedMode);
        if (cached) {
            setEntry(cached);
            return undefined;
        }

        setEntry(null);
        void loadVisualizerRegistryEntry(resolvedMode)
            .then(next => {
                if (!cancelled) {
                    setEntry(next);
                }
            })
            .catch(error => {
                console.error('[VisualizerRegistry] Failed to load entry', resolvedMode, error);
            });

        return () => {
            cancelled = true;
        };
    }, [mode]);

    return entry;
}

export const getVisualizerModeLabel = (mode: VisualizerMode, t: (key: string) => string) => {
    const entry = getVisualizerRegistryEntry(mode);
    const translated = t(entry.labelKey);
    return !translated || translated === entry.labelKey ? entry.labelFallback : translated;
};

export const getVisualizerPreviewStartOffset = (mode: VisualizerMode, loopDuration: number) => {
    if (loopDuration <= 0) {
        return 0;
    }

    return getVisualizerRegistryEntry(mode).previewStartOffset % loopDuration;
};

export const getVisualizerScopedSeed = (mode: VisualizerMode, scope: string) =>
    `${scope}-${getVisualizerRegistryEntry(mode).previewSeed}`;
