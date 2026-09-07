import { describe, expect, it } from 'vitest';
import {
    collectItunesPodcastResults,
    collectItunesTopChartIds,
    mapItunesPodcastResult,
} from '@/services/podcast/mapApplePodcast';

// test/unit/services/mapApplePodcast.test.ts

describe('mapItunesPodcastResult', () => {
    it('maps a lookup hit that still has a public feed', () => {
        const show = mapItunesPodcastResult({
            collectionId: 123,
            collectionName: '得意忘形',
            artistName: '高晓松',
            artworkUrl600: 'http://is1.mzstatic.com/cover.jpg',
            feedUrl: 'https://feeds.example.com/show.xml',
            trackCount: 400,
            primaryGenreName: 'Society',
        });
        expect(show).toMatchObject({
            id: 123,
            name: '得意忘形',
            djName: '高晓松',
            cover: 'https://is1.mzstatic.com/cover.jpg',
            feedUrl: 'https://feeds.example.com/show.xml',
            catalogSource: 'apple',
            programCount: 400,
        });
    });

    it('drops exclusive shows without feedUrl', () => {
        expect(mapItunesPodcastResult({
            collectionId: 1,
            collectionName: 'Locked',
            feedUrl: '',
        })).toBeNull();
    });
});

describe('collectItunes catalog payloads', () => {
    it('reads search results and top-chart ids', () => {
        const shows = collectItunesPodcastResults({
            results: [
                { collectionId: 1, collectionName: 'A', feedUrl: 'https://a.xml' },
                { collectionId: 2, collectionName: 'B' },
            ],
        });
        expect(shows.map((show) => show.id)).toEqual([1]);

        expect(collectItunesTopChartIds({
            feed: { results: [{ id: '111' }, { id: '222' }] },
        })).toEqual(['111', '222']);

        expect(collectItunesTopChartIds({
            feed: {
                entry: { id: { attributes: { 'im:id': '333' } } },
            },
        })).toEqual(['333']);
    });
});
