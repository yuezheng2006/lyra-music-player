import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveMonetCanvasSafeImageSource } from '@/components/visualizer/monet/monetBackgroundPipeline';
import { fetchCoverViaProxy } from '@/utils/fetchCoverViaProxy';

// test/unit/visualizer/monetCanvasSafeImageSource.test.ts
// Monet must proxy CORS-blocked Douyin covers instead of failing canvas load.

vi.mock('@/utils/fetchCoverViaProxy', () => ({
    fetchCoverViaProxy: vi.fn(),
}));

describe('resolveMonetCanvasSafeImageSource', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.mocked(fetchCoverViaProxy).mockReset();
    });

    it('falls back to cover proxy when direct CORS fetch fails', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new TypeError('Failed to fetch');
        }));
        vi.stubGlobal('URL', {
            ...URL,
            createObjectURL: vi.fn(() => 'blob:monet-proxy'),
            revokeObjectURL: vi.fn(),
        });
        vi.mocked(fetchCoverViaProxy).mockResolvedValue(
            new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
        );

        const result = await resolveMonetCanvasSafeImageSource(
            'https://p3-luna.douyinpic.com/img/cover.jpg',
        );

        expect(fetchCoverViaProxy).toHaveBeenCalledWith(
            'https://p3-luna.douyinpic.com/img/cover.jpg',
        );
        expect(result.url).toBe('blob:monet-proxy');
        result.revoke();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:monet-proxy');
    });
});
