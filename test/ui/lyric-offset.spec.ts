import { expect, test } from '@playwright/test';
import {
    enterPlayerFromLocalImport,
    installLocalLibraryState,
    type LocalLibraryFixture,
} from './helpers/localLibrary';

// test/ui/lyric-offset.spec.ts
// Lyric timeline offset: 50ms stepping, per-song persistence, restore on song switch.

const fixture: LocalLibraryFixture = {
    rootName: 'Offset Fixture',
    entries: [
        {
            kind: 'file',
            name: 'Test Artist - Midnight Train.wav',
            type: 'audio/wav',
            content: '__SILENT_WAV__',
            lastModified: 1710000000000,
        },
        {
            kind: 'file',
            name: 'Test Artist - Midnight Train.lrc',
            type: 'text/plain',
            content: '[00:00.00]Midnight Train\n[00:12.00]Leaves the station',
            lastModified: 1710000000000,
        },
        {
            kind: 'file',
            name: 'Test Artist - Morning Rain.wav',
            type: 'audio/wav',
            content: '__SILENT_WAV__',
            lastModified: 1710000000000,
        },
    ],
};

test.describe('lyric timeline offset', () => {
    test.beforeEach(async ({ page }) => {
        await installLocalLibraryState(page, fixture);
    });

    test('steps by 50ms, persists per song, and restores on song switch', async ({ page }) => {
        await enterPlayerFromLocalImport(page, { firstTrackText: 'Midnight Train' });

        await page.getByTestId('unified-panel-toggle').locator('button').first().click();
        // Local songs surface the lyric controls in the 本地/Local tab.
        await page.getByRole('button', { name: /^(本地|歌词|Local|Lyrics)$/ }).click();

        const offsetInput = page.getByLabel(/时间轴偏移|Timeline Offset/).first();
        await expect(offsetInput).toBeVisible({ timeout: 10_000 });
        await expect(offsetInput).toHaveAttribute('step', '50');
        await expect(offsetInput).toHaveValue('0');

        const plusButton = page.getByRole('button', { name: '+50ms' }).first();
        await plusButton.click();
        await plusButton.click();
        await plusButton.click();
        await expect(offsetInput).toHaveValue('150');

        // Persisted with a per-song key.
        await expect.poll(() => page.evaluate(() => localStorage.getItem('lyric_timeline_offsets_v1')))
            .toContain(',150]');

        // Switching songs shows that song's offset (none yet), switching back restores 150.
        const queueTab = page.getByRole('button', { name: /播放队列|Queue/ }).first();
        const localTab = page.getByRole('button', { name: /^(本地|歌词|Local|Lyrics)$/ });

        // Don't assume which track play-all landed on — read it from the dock title.
        const dockTitle = await page.getByTestId('floating-player-dock')
            .getByText(/Midnight Train|Morning Rain/)
            .first()
            .textContent();
        const calibratedSong = dockTitle?.includes('Morning Rain') ? 'Morning Rain' : 'Midnight Train';
        const otherSong = calibratedSong === 'Morning Rain' ? 'Midnight Train' : 'Morning Rain';

        await queueTab.click();
        await page.getByRole('listitem').filter({ hasText: otherSong }).first().click();
        await localTab.click();
        await expect(offsetInput).toHaveValue('0', { timeout: 10_000 });

        await queueTab.click();
        await page.getByRole('listitem').filter({ hasText: calibratedSong }).first().click();
        await localTab.click();
        await expect(offsetInput).toHaveValue('150', { timeout: 10_000 });

        // Reset removes the stored entry. dispatchEvent: the floating panel-toggle
        // button overlaps this corner and intercepts real pointer clicks.
        await page.getByRole('button', { name: /重置时间轴偏移|Reset/ }).first().dispatchEvent('click');
        await expect(offsetInput).toHaveValue('0');
        await expect.poll(() => page.evaluate(() => localStorage.getItem('lyric_timeline_offsets_v1')))
            .not.toContain(',150]');
    });
});
