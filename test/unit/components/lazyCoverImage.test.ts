import { describe, expect, it } from 'vitest';
import { resolveLazyCoverDisplaySrc } from '@/components/shared/LazyCoverImage';

// test/unit/components/lazyCoverImage.test.ts

describe('resolveLazyCoverDisplaySrc', () => {
    it('returns a data-url placeholder when src is missing', () => {
        const src = resolveLazyCoverDisplaySrc({
            src: '',
            placeholderLabel: '晴天',
            placeholderArtist: '周杰伦',
            placeholderVariant: 'song',
        });
        expect(src.startsWith('data:image/svg+xml')).toBe(true);
    });

    it('falls back when failed is true even if src exists', () => {
        const src = resolveLazyCoverDisplaySrc({
            src: 'https://example.com/cover.jpg',
            failed: true,
            placeholderLabel: 'Song',
        });
        expect(src.startsWith('data:image/svg+xml')).toBe(true);
    });

    it('keeps a usable remote src when not failed', () => {
        const src = resolveLazyCoverDisplaySrc({
            src: 'https://example.com/cover.jpg',
            failed: false,
            placeholderLabel: 'Song',
        });
        expect(src).toContain('example.com/cover.jpg');
    });

    it('sizes netease covers when sizePx is provided', () => {
        const src = resolveLazyCoverDisplaySrc({
            src: 'https://p1.music.126.net/abc/cover.jpg',
            sizePx: 320,
            placeholderLabel: '播客',
            placeholderVariant: 'playlist',
        });
        expect(src).toContain('param=320y320');
    });
});
