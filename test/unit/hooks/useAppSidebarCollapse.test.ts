import { describe, expect, it } from 'vitest';
import { APP_SIDEBAR_COLLAPSED_STORAGE_KEY } from '@/hooks/useAppSidebarCollapse';

// test/unit/hooks/useAppSidebarCollapse.test.ts

describe('app sidebar collapse storage', () => {
    it('uses a stable localStorage key for chrome layout preference', () => {
        expect(APP_SIDEBAR_COLLAPSED_STORAGE_KEY).toBe('folia_app_sidebar_collapsed_v1');
    });
});
