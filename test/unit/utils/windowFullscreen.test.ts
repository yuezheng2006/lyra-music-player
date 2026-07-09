import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    isBrowserDocumentFullscreen,
    isFullscreenPlayActive,
    isFullscreenPlayEngaged,
    setBrowserDocumentFullscreen,
} from '@/utils/windowFullscreen';

function installDocumentMock(initialFullscreenElement: Element | null = null) {
    const root = {
        requestFullscreen: vi.fn(async () => undefined),
    };
    let fullscreenElement: Element | null = initialFullscreenElement;
    const doc = {
        get fullscreenElement() {
            return fullscreenElement;
        },
        set fullscreenElement(value: Element | null) {
            fullscreenElement = value;
        },
        documentElement: root,
        exitFullscreen: vi.fn(async () => {
            fullscreenElement = null;
        }),
    };

    root.requestFullscreen = vi.fn(async () => {
        fullscreenElement = root as unknown as Element;
    });

    vi.stubGlobal('document', doc);
    return { doc, root };
}

describe('windowFullscreen', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('detects combined fullscreen play only when player chrome is hidden and window is fullscreen', () => {
        expect(isFullscreenPlayActive({
            currentView: 'player',
            isPlayerChromeHidden: true,
            isWindowFullscreen: true,
        })).toBe(true);

        expect(isFullscreenPlayActive({
            currentView: 'player',
            isPlayerChromeHidden: true,
            isWindowFullscreen: false,
        })).toBe(false);

        expect(isFullscreenPlayActive({
            currentView: 'home',
            isPlayerChromeHidden: true,
            isWindowFullscreen: true,
        })).toBe(false);
    });

    it('treats half-states as engaged so the combined toggle can exit them', () => {
        expect(isFullscreenPlayEngaged({
            currentView: 'player',
            isPlayerChromeHidden: true,
            isWindowFullscreen: false,
        })).toBe(true);

        expect(isFullscreenPlayEngaged({
            currentView: 'home',
            isPlayerChromeHidden: false,
            isWindowFullscreen: true,
        })).toBe(true);

        expect(isFullscreenPlayEngaged({
            currentView: 'home',
            isPlayerChromeHidden: false,
            isWindowFullscreen: false,
        })).toBe(false);
    });

    it('reads browser document fullscreen from fullscreenElement', () => {
        const { root } = installDocumentMock();
        expect(isBrowserDocumentFullscreen()).toBe(false);
        (document as { fullscreenElement: Element | null }).fullscreenElement = root as unknown as Element;
        expect(isBrowserDocumentFullscreen()).toBe(true);
    });

    it('requests and exits browser document fullscreen', async () => {
        const { doc, root } = installDocumentMock();

        await expect(setBrowserDocumentFullscreen(true)).resolves.toBe(true);
        expect(root.requestFullscreen).toHaveBeenCalled();

        await expect(setBrowserDocumentFullscreen(false)).resolves.toBe(false);
        expect(doc.exitFullscreen).toHaveBeenCalled();
    });
});
