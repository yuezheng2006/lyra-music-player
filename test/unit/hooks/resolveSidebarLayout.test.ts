import { describe, expect, it } from 'vitest';
import { resolveSidebarLayout } from '@/hooks/resolveSidebarLayout';

// test/unit/hooks/resolveSidebarLayout.test.ts

describe('resolveSidebarLayout', () => {
    it('hides the rail during immersive canvas without rewriting user preference semantics', () => {
        expect(resolveSidebarLayout({
            immersiveCanvas: true,
            userCollapsed: false,
        })).toEqual({
            forceHidden: true,
            collapsed: true,
            width: '0px',
        });

        expect(resolveSidebarLayout({
            immersiveCanvas: true,
            userCollapsed: true,
        })).toEqual({
            forceHidden: true,
            collapsed: true,
            width: '0px',
        });
    });

    it('restores a closed sidebar after immersive exit instead of force-expanding', () => {
        expect(resolveSidebarLayout({
            immersiveCanvas: false,
            userCollapsed: true,
        })).toEqual({
            forceHidden: false,
            collapsed: true,
            width: '0px',
        });
    });

    it('keeps an open sidebar open after immersive exit', () => {
        expect(resolveSidebarLayout({
            immersiveCanvas: false,
            userCollapsed: false,
        })).toEqual({
            forceHidden: false,
            collapsed: false,
            width: '220px',
        });
    });
});
