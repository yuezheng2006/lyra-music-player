import { describe, expect, it } from 'vitest';
import { buildImportPlan, normalizeImportedAppearanceConfig } from '@/utils/appearanceImportPlan';
import type { ThemePreferenceSwitchState } from '@/services/themePreferences';

// test/unit/utils/appearanceImportPlan.test.ts
// The diff an import would apply, computed before anything is applied. The derived cases matter
// most: accepting a song-theme switch can also unpin a custom theme, which the config never names.

const pinned: ThemePreferenceSwitchState = {
    isCustomThemePreferred: true,
    songThemeAutoSwitchEnabled: false,
    songThemeAutoGenerateEnabled: false,
};
const unpinned: ThemePreferenceSwitchState = {
    isCustomThemePreferred: false,
    songThemeAutoSwitchEnabled: true,
    songThemeAutoGenerateEnabled: false,
};

const plan = (incoming: Record<string, unknown>, current: Record<string, unknown> = {}, switches = pinned) =>
    buildImportPlan({ incoming, current, switches, isCustomThemeActive: true });

const keys = (p: ReturnType<typeof plan>) => p.changes.map(c => c.key);

describe('buildImportPlan', () => {
    it('reports nothing when the incoming config matches the current one', () => {
        const same = { visualizerMode: 'monet', backgroundOpacity: 0.75, lyricsFontScale: 1 };
        const p = plan(same, same, unpinned);
        expect(p.changes).toEqual([]);
        expect(p.groups).toEqual([]);
    });

    it('ignores fields the incoming config does not mention', () => {
        const p = plan({ visualizerMode: 'monet' }, { visualizerMode: 'classic', backgroundOpacity: 0.5 }, unpinned);
        expect(keys(p)).toEqual(['visualizerMode']);
    });

    it('sorts changes into the group they are presented under', () => {
        const p = plan({
            theme: { light: { name: 'X' }, dark: { name: 'Y' } },
            visualizerMode: 'monet',
            lyricsFontScale: 1.25,
            backgroundOpacity: 0.3,
        }, { visualizerMode: 'classic', lyricsFontScale: 1, backgroundOpacity: 0.75 }, unpinned);
        expect(p.groups).toEqual(['theme', 'visualizer', 'fonts', 'background']);
    });

    it('plans the subtitle and harmony fields the apply path writes', () => {
        const p = plan({
            subtitleContentMode: 'romanization',
            showHarmonySubtitle: true,
            harmonySubtitleBackground: true,
            subtitleFontScale: 1.4,
            lyricWordMode: 'karaoke',
        }, {
            subtitleContentMode: 'translation',
            showHarmonySubtitle: false,
            harmonySubtitleBackground: false,
            subtitleFontScale: 1,
            lyricWordMode: 'word',
        }, unpinned);
        expect(keys(p)).toEqual(expect.arrayContaining([
            'subtitleContentMode', 'showHarmonySubtitle', 'harmonySubtitleBackground', 'subtitleFontScale', 'lyricWordMode',
        ]));
        expect(p.changes.find(c => c.key === 'subtitleContentMode')?.group).toBe('visualizer');
        expect(p.changes.find(c => c.key === 'subtitleFontScale')?.group).toBe('fonts');
        expect(p.changes.find(c => c.key === 'lyricWordMode')?.group).toBe('visualizer');
    });

    it('plans a harmony toggle turning off', () => {
        expect(keys(plan({ showHarmonySubtitle: false }, { showHarmonySubtitle: true }, unpinned)))
            .toContain('showHarmonySubtitle');
    });

    it('skips an empty subtitleContentMode the apply path would not set', () => {
        expect(keys(plan({ subtitleContentMode: '' }, { subtitleContentMode: 'translation' }, unpinned)))
            .not.toContain('subtitleContentMode');
    });

    it('rewrites a karaoke visualizerMode into lyricWordMode', () => {
        expect(normalizeImportedAppearanceConfig({ visualizerMode: 'karaoke' }))
            .toEqual({ lyricWordMode: 'karaoke' });
        expect(keys(plan({ visualizerMode: 'karaoke' }, { lyricWordMode: 'word' }, unpinned)))
            .toEqual(['lyricWordMode']);
    });

    it('compares nested tunings structurally', () => {
        const tuning = { cameraSpeed: 1, motionAmount: 1 };
        expect(plan({ classicTuning: { ...tuning } }, { classicTuning: tuning }, unpinned).changes).toEqual([]);
        expect(keys(plan({ classicTuning: { ...tuning, cameraSpeed: 2 } }, { classicTuning: tuning }, unpinned)))
            .toEqual(['classicTuning']);
    });

    it('plans Lyra background tunings including interactive3d', () => {
        const p = plan(
            { interactive3dSceneTuning: { qualityTier: 'high' }, nomandBackgroundTuning: { size: 8 } },
            { interactive3dSceneTuning: { qualityTier: 'lite' }, nomandBackgroundTuning: { size: 4 } },
            unpinned,
        );
        expect(keys(p)).toEqual(expect.arrayContaining(['interactive3dSceneTuning', 'nomandBackgroundTuning']));
        expect(p.changes.find(c => c.key === 'interactive3dSceneTuning')?.group).toBe('background');
    });

    it('surfaces the unpinning that accepting auto-switch implies', () => {
        const p = plan({ songThemeAutoSwitchEnabled: true, songThemeAutoGenerateEnabled: false }, {}, pinned);
        const derived = p.changes.find(c => c.derived);
        expect(derived).toMatchObject({
            group: 'songTheme',
            key: 'isCustomThemePreferred',
            from: true,
            to: false,
        });
    });

    it('reports no derived change when the config turns the automation off', () => {
        const p = plan({ songThemeAutoSwitchEnabled: false, songThemeAutoGenerateEnabled: false }, {}, pinned);
        expect(p.changes.some(c => c.derived)).toBe(false);
    });

    it('threads the resolvers so auto-generate can unpin on its own', () => {
        const p = plan({ songThemeAutoGenerateEnabled: true }, {}, pinned);
        expect(p.changes.find(c => c.derived)).toMatchObject({ key: 'isCustomThemePreferred', to: false });
    });

    const side = (accentColor: string) => ({
        backgroundColor: '#000000',
        primaryColor: '#ffffff',
        accentColor,
        secondaryColor: '#888888',
        fontStyle: 'sans',
        animationIntensity: 'normal',
    });

    it('splits the theme into a light and a dark row', () => {
        const current = { theme: { light: side('#111111'), dark: side('#111111') } };
        const p = plan({ theme: { light: side('#ea580c'), dark: side('#0df1fe') } }, current, unpinned);
        expect(keys(p)).toEqual(['themeLight', 'themeDark']);
        expect(p.changes[0]).toMatchObject({ from: current.theme.light, to: side('#ea580c') });
    });

    it('offers only the side that actually differs', () => {
        const p = plan(
            { theme: { light: side('#ea580c'), dark: side('#0df1fe') } },
            { theme: { light: side('#ea580c'), dark: side('#111111') } },
            unpinned,
        );
        expect(keys(p)).toEqual(['themeDark']);
        expect(p.unchanged.map(c => c.key)).toEqual(['themeLight']);
    });

    it('ignores theme metadata and empty-vs-absent lists', () => {
        const saved = {
            backgroundColor: '#f5f5f4', primaryColor: '#1c1917', accentColor: '#ea580c', secondaryColor: '#44403c',
            fontStyle: 'sans', animationIntensity: 'normal', wordColors: [], lyricsIcons: [], provider: 'Custom', description: '',
        };
        const incoming = {
            name: 'Whatever Else', backgroundColor: '#f5f5f4', primaryColor: '#1c1917', accentColor: '#ea580c',
            secondaryColor: '#44403c', fontStyle: 'sans', animationIntensity: 'normal',
        };
        const p = plan({ theme: { light: incoming, dark: incoming } }, { theme: { light: saved, dark: saved } }, unpinned);
        expect(p.changes).toEqual([]);
        expect(p.unchanged.map(c => c.key)).toEqual(['themeLight', 'themeDark']);
    });

    it('does not compare animation intensity', () => {
        const base = { backgroundColor: '#000', primaryColor: '#fff', accentColor: '#ea580c', secondaryColor: '#888' };
        const p = plan(
            { theme: { light: { ...base, animationIntensity: 'chaotic' }, dark: { ...base, animationIntensity: 'chaotic' } } },
            { theme: { light: { ...base, animationIntensity: 'calm' }, dark: { ...base, animationIntensity: 'calm' } } },
            unpinned,
        );
        expect(p.changes).toEqual([]);
        expect(p.unchanged.map(c => c.key)).toEqual(['themeLight', 'themeDark']);
    });

    describe('activating the custom theme', () => {
        const themeSide = { backgroundColor: '#000', primaryColor: '#fff', accentColor: '#ea580c', secondaryColor: '#888' };
        const build = (isCustomThemeActive: boolean) => buildImportPlan({
            incoming: { theme: { light: themeSide, dark: themeSide } },
            current: { theme: { light: themeSide, dark: themeSide } },
            switches: unpinned,
            isCustomThemeActive,
        });

        it('is offered when an identical theme arrives while another mode is on screen', () => {
            const p = build(false);
            expect(keys(p)).toEqual(['activateCustomTheme']);
            expect(p.unchanged.map(c => c.key)).toEqual(['themeLight', 'themeDark']);
        });

        it('is not offered when the custom theme is already the active mode', () => {
            expect(keys(build(true))).toEqual([]);
        });

        it('links a picked side to activating, since saving is what switches the mode', () => {
            const p = buildImportPlan({
                incoming: { theme: { light: { ...themeSide, accentColor: '#0df1fe' }, dark: themeSide } },
                current: { theme: { light: themeSide, dark: themeSide } },
                switches: unpinned,
                isCustomThemeActive: false,
            });
            expect(keys(p)).toEqual(['themeLight', 'activateCustomTheme']);
            expect(p.changes.find(c => c.key === 'themeLight')?.forces).toEqual(['activateCustomTheme']);
        });
    });

    it('breaks a changed settings object down to the leaves that moved', () => {
        const p = plan(
            { monetBackgroundTuning: { backgroundBlurPx: 24, backgroundSaturation: 0, backgroundWash: 0.34 } },
            { monetBackgroundTuning: { backgroundBlurPx: 6, backgroundSaturation: 1.05, backgroundWash: 0.34 } },
            unpinned,
        );
        const change = p.changes.find(c => c.key === 'monetBackgroundTuning');
        expect(change?.children).toEqual([
            { group: 'background', key: 'backgroundBlurPx', from: 6, to: 24 },
            { group: 'background', key: 'backgroundSaturation', from: 1.05, to: 0 },
        ]);
    });

    it('does not report a settings object whose leaves all match', () => {
        const p = plan(
            { classicTuning: { motionAmount: 1, cameraSpeed: 2 } },
            { classicTuning: { cameraSpeed: 2, motionAmount: 1 } },
            unpinned,
        );
        expect(p.changes).toEqual([]);
        expect(p.unchanged.map(c => c.key)).toEqual(['classicTuning']);
    });

    it('reports matching fields as unchanged rather than dropping them', () => {
        const p = plan(
            { visualizerMode: 'monet', backgroundOpacity: 0.5 },
            { visualizerMode: 'monet', backgroundOpacity: 0.75 },
            unpinned,
        );
        expect(keys(p)).toEqual(['backgroundOpacity']);
        expect(p.unchanged.map(c => c.key)).toEqual(['visualizerMode']);
    });

    it('skips a field the import would not apply because the incoming value is null', () => {
        const p = plan(
            { visualizerMode: null, subtitleFontFamily: null },
            { visualizerMode: 'monet', subtitleFontFamily: 'Georgia' },
            unpinned,
        );
        expect(keys(p)).toEqual(['subtitleFontFamily']);
    });

    describe('webpage backgrounds', () => {
        const a = { id: 'a', url: 'https://a.example/', note: 'a' };
        const b = { id: 'b', url: 'https://b.example/', note: 'b' };

        it('diffs against the merged list rather than the incoming one', () => {
            const p = plan({ urlBackgroundList: [b] }, { urlBackgroundList: [a] }, unpinned);
            const change = p.changes.find(c => c.key === 'urlBackgroundList');
            expect(change?.to).toEqual([a, b]);
            expect(change?.note).toBe('listMerged');
        });

        it('reports no change when the incoming entries are all already present', () => {
            const p = plan({ urlBackgroundList: [a] }, { urlBackgroundList: [a] }, unpinned);
            expect(keys(p)).toEqual([]);
            expect(p.unchanged.map(c => c.key)).toEqual(['urlBackgroundList']);
        });

        it('reports no change for an empty incoming list', () => {
            const p = plan({ urlBackgroundList: [] }, { urlBackgroundList: [a] }, unpinned);
            expect(keys(p)).toEqual([]);
        });

        it('does not count entries the sanitizer discards', () => {
            const p = plan({ urlBackgroundList: [{ id: '', url: 'https://x.example/' }, { id: 'c', url: 'ftp://nope/' }] }, { urlBackgroundList: [a] }, unpinned);
            expect(keys(p)).toEqual([]);
        });

        it('offers the selected id only when it survives the merge', () => {
            expect(keys(plan({ urlBackgroundList: [b], urlBackgroundSelectedId: 'b' }, { urlBackgroundList: [a] }, unpinned)))
                .toEqual(['urlBackgroundList', 'urlBackgroundSelectedId']);
            expect(keys(plan({ urlBackgroundSelectedId: 'gone' }, { urlBackgroundList: [a] }, unpinned)))
                .toEqual([]);
        });

        it('links a selected id that only the merge introduces to the list row', () => {
            const p = plan({ urlBackgroundList: [b], urlBackgroundSelectedId: 'b' }, { urlBackgroundList: [a] }, unpinned);
            expect(p.changes.find(c => c.key === 'urlBackgroundSelectedId')?.forces).toEqual(['urlBackgroundList']);
        });
    });

    describe('leaves the setters pin', () => {
        it('drops cadenza beamIntensity, which the setter always writes as 0', () => {
            expect(keys(plan({ cadenzaTuning: { beamIntensity: 0.8, fontScale: 1 } }, { cadenzaTuning: { beamIntensity: 0, fontScale: 1 } }, unpinned)))
                .toEqual([]);
        });

        it('drops a custom cappella emoji source when this machine has no pack', () => {
            const incoming = { cappellaTuning: { emojiPackSource: 'custom', showEmoMessages: true } };
            const current = { cappellaTuning: { emojiPackSource: 'builtin', showEmoMessages: true } };
            expect(keys(plan(incoming, current, unpinned))).toEqual([]);

            const withPack = buildImportPlan({ incoming, current, switches: unpinned, assets: { hasCappellaEmojiPack: true } });
            expect(keys(withPack)).toEqual(['cappellaTuning']);
        });

        it('drops an uploaded monet background source when this machine has no image', () => {
            const incoming = { monetBackgroundTuning: { backgroundSource: 'uploaded-global' } };
            const current = { monetBackgroundTuning: { backgroundSource: 'cover-derived' } };
            expect(keys(plan(incoming, current, unpinned))).toEqual([]);

            const withImage = buildImportPlan({ incoming, current, switches: unpinned, assets: { hasMonetBackgroundImage: true } });
            expect(keys(withImage)).toEqual(['monetBackgroundTuning']);
        });

        it('drops a custom monet portrait source when this machine has no image', () => {
            const incoming = { monetTuning: { portraitSource: 'custom' } };
            const current = { monetTuning: { portraitSource: 'cover' } };
            expect(keys(plan(incoming, current, unpinned))).toEqual([]);

            const withImage = buildImportPlan({ incoming, current, switches: unpinned, assets: { hasMonetPortraitImage: true } });
            expect(keys(withImage)).toEqual(['monetTuning']);
        });

        it('leaves other leaves of the same tuning alone', () => {
            const p = plan(
                { cadenzaTuning: { beamIntensity: 0.8, fontScale: 2 } },
                { cadenzaTuning: { beamIntensity: 0, fontScale: 1 } },
                unpinned,
            );
            expect(p.changes.find(c => c.key === 'cadenzaTuning')?.children)
                .toEqual([{ group: 'visualizer', key: 'fontScale', from: 1, to: 2 }]);
        });
    });

    describe('linking the song-theme switches', () => {
        const find = (p: ReturnType<typeof plan>, key: string) => p.changes.find(c => c.key === key);

        it('links auto-generate to auto-switch when both are turning on', () => {
            const p = plan(
                { songThemeAutoSwitchEnabled: true, songThemeAutoGenerateEnabled: true },
                { songThemeAutoSwitchEnabled: false, songThemeAutoGenerateEnabled: false },
                pinned,
            );
            expect(find(p, 'songThemeAutoGenerateEnabled')?.forces).toEqual(['songThemeAutoSwitchEnabled']);
            expect(find(p, 'songThemeAutoSwitchEnabled')?.forces).toBeUndefined();
        });

        it('links auto-switch to auto-generate when both are turning off', () => {
            const p = plan(
                { songThemeAutoSwitchEnabled: false, songThemeAutoGenerateEnabled: false },
                { songThemeAutoSwitchEnabled: true, songThemeAutoGenerateEnabled: true },
                { isCustomThemePreferred: false, songThemeAutoSwitchEnabled: true, songThemeAutoGenerateEnabled: true },
            );
            expect(find(p, 'songThemeAutoSwitchEnabled')?.forces).toEqual(['songThemeAutoGenerateEnabled']);
        });

        it('leaves a lone switch unlinked', () => {
            const p = plan({ songThemeAutoSwitchEnabled: true }, { songThemeAutoSwitchEnabled: false }, pinned);
            expect(find(p, 'songThemeAutoSwitchEnabled')?.forces).toBeUndefined();
        });
    });

    it('plans now-playing card fields under visualizer', () => {
        const p = plan({
            stageTrackPillMode: 'always',
            stageTrackPillTimeoutSec: 20,
            stageTrackPillOnHome: true,
        }, {
            stageTrackPillMode: 'auto',
            stageTrackPillTimeoutSec: 10,
            stageTrackPillOnHome: false,
        }, unpinned);
        expect(keys(p)).toEqual(expect.arrayContaining([
            'stageTrackPillMode',
            'stageTrackPillTimeoutSec',
            'stageTrackPillOnHome',
        ]));
        expect(p.changes.find(c => c.key === 'stageTrackPillMode')?.group).toBe('visualizer');
        expect(p.changes.find(c => c.key === 'stageTrackPillOnHome')?.to).toBe(true);
    });
});
