import type { OnlineLibraryProviderId } from '../../stores/useOnlineLibraryFilterStore';

// src/utils/ui/homeProviderFilterMath.ts
// Source pills that feed the desk vs the NetEase library row after login.

/** Source chips that can feed search. NetEase is library-only. */
export const isListeningDeskProvider = (id: string): boolean => id !== 'netease';

/** Cover-grid mix: skip Bilibili — keyword search there is 30s clips, not full songs. */
export const isListeningDeskMixProvider = (id: string): boolean =>
    isListeningDeskProvider(id) && id !== 'bilibili';

export const visibleListeningDeskProviderIds = (
    ids: readonly string[],
    isConnected: (id: OnlineLibraryProviderId) => boolean,
): OnlineLibraryProviderId[] => (
    ids.filter((id): id is OnlineLibraryProviderId => (
        isListeningDeskProvider(id) && isConnected(id as OnlineLibraryProviderId)
    ))
);

export const visiblePersonalLibraryProviderIds = (
    ids: readonly string[],
    isConnected: (id: OnlineLibraryProviderId) => boolean,
): OnlineLibraryProviderId[] => (
    ids.filter((id): id is OnlineLibraryProviderId => (
        id === 'netease' && isConnected(id as OnlineLibraryProviderId)
    ))
);

export const joinListeningDeskSourceLabels = (labels: readonly string[]): string =>
    labels.map(label => label.trim()).filter(Boolean).join(' · ');
