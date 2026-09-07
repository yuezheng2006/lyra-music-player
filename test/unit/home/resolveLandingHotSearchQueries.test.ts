import { describe, expect, it } from 'vitest';
import { resolveLandingHotSearchQueries } from '@/utils/home/resolveLandingHotSearchQueries';

// test/unit/home/resolveLandingHotSearchQueries.test.ts

describe('resolveLandingHotSearchQueries', () => {
    it('uses artist names for coco and unknown providers', () => {
        expect(resolveLandingHotSearchQueries('coco')).toEqual([
            '周杰伦',
            '林俊杰',
            '陈奕迅',
            '邓紫棋',
            '五月天',
        ]);
        expect(resolveLandingHotSearchQueries('netease')).toEqual(
            resolveLandingHotSearchQueries('coco'),
        );
        expect(resolveLandingHotSearchQueries(null)).toEqual(
            resolveLandingHotSearchQueries('coco'),
        );
    });

    it('keeps Bilibili landing chips on verified UP shortcuts', () => {
        expect(resolveLandingHotSearchQueries('bilibili')).toEqual([
            'up:天花板上吊着猫',
            'up:溪谷之风',
            'up:阿德托昆博带件衣服',
            'up:黑蓝墨水就爱搞事儿',
            'up:漫游会议室',
        ]);
    });

    it('uses qishui artist names instead of cat: chips', () => {
        expect(resolveLandingHotSearchQueries('qishui')).toEqual([
            '周杰伦',
            '林俊杰',
            '邓紫棋',
            '陈奕迅',
            '五月天',
        ]);
    });
});
