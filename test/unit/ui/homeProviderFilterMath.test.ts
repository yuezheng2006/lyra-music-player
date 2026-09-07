import { describe, expect, it } from 'vitest';
import {
    isListeningDeskMixProvider,
    joinListeningDeskSourceLabels,
    visibleListeningDeskProviderIds,
    visiblePersonalLibraryProviderIds,
} from '../../../src/utils/ui/homeProviderFilterMath';

// test/unit/ui/homeProviderFilterMath.test.ts

const ids = ['netease', 'qq', 'qishui', 'coco', 'kugou', 'bilibili', 'kuwo'];

describe('homeProviderFilterMath', () => {
    it('keeps unconnected login accounts off the listening-desk source row', () => {
        const connected = (id: string) => id !== 'netease' && id !== 'qq';
        expect(visibleListeningDeskProviderIds(ids, connected)).toEqual([
            'qishui', 'coco', 'kugou', 'bilibili', 'kuwo',
        ]);
        expect(visiblePersonalLibraryProviderIds(ids, connected)).toEqual([]);
    });

    it('adds QQ to the desk row and NetEase to the library row after login', () => {
        const connected = () => true;
        expect(visibleListeningDeskProviderIds(ids, connected)).toEqual([
            'qq', 'qishui', 'coco', 'kugou', 'bilibili', 'kuwo',
        ]);
        expect(visiblePersonalLibraryProviderIds(ids, connected)).toEqual(['netease']);
    });

    it('joins enabled source names so the desk can echo the filter row', () => {
        expect(joinListeningDeskSourceLabels(['汽水', ' coco ', ''])).toBe('汽水 · coco');
    });

    it('keeps Bilibili on the search row but out of the cover-grid mix', () => {
        expect(isListeningDeskMixProvider('bilibili')).toBe(false);
        expect(isListeningDeskMixProvider('coco')).toBe(true);
        expect(isListeningDeskMixProvider('netease')).toBe(false);
    });
});
