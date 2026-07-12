# Unified Playback Playlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `playQueue` the only playback playlist used by both the player panel and floating dock, under the user-facing name “播放列表” / “Playlist”.

**Architecture:** The app-level overlay view model passes the existing `playQueue` directly into the floating controls, matching the player panel and all navigation actions. Remove the obsolete persisted requested-queue store, auto-seeding utility, and mirror writes so no second collection can diverge from the active playback context.

**Tech Stack:** React 19, TypeScript, Zustand removal, i18next, Vitest, existing Vite hot reload.

## Global Constraints

- Preserve existing `playQueue` ordering, deduplication, stage playback, shuffle, and playback-cache behavior.
- Do not migrate `requested_queue_v1`; its data must not alter a live playback playlist.
- Do not modify unrelated uncommitted theme, shell, or color-extraction work.
- Do not create a Git commit unless the user explicitly requests one.
- Use `npm run lint` and targeted `npm run test:unit` validation; do not run a build while the existing development environment is active.

---

### Task 1: Remove requested-list writes from playback mutations

**Files:**
- Modify: `src/hooks/usePlaybackQueueController.ts:18-19, 227-233, 617-629`
- Modify: `src/hooks/useLibraryPlaybackController.ts:32, 524-551`
- Modify: `src/components/app/player-panel/createQueueMutations.ts:4, 37-58`

**Interfaces:**
- Consumes: existing `applyQueueAddBehavior({ queue, songs, currentSong, behavior })`.
- Produces: every add-to-queue action updates only `setPlayQueue(nextQueue)` and the existing playback cache.

- [ ] **Step 1: Remove the online-playback requested-list mirror**

Delete the store and seed imports, delete the `useRequestedQueueStore.getState().addSongs(...)` block in `appendNeteaseSongsToMainQueue`, and delete the `ensureRequestedQueueSeededFromPlaylist(...)` call and toast from `playSong`.

```ts
if (changed && affectedSongs.length > 0) {
    void persistLastPlaybackCache(queueAnchorSong, nextQueue);
}
```

- [ ] **Step 2: Remove local and Navidrome requested-list mirrors**

Keep the queue mutation and feedback behavior, but remove the requested-store import and each `addSongs` mirror call.

```ts
setPlayQueue(nextQueue);
void persistLastPlaybackCache(currentSong, nextQueue);
setStatusMsg({
    type: 'success',
    text: queueAddBehavior === 'next' ? '已插入到下一首' : (t('status.queueUpdated') || '已添加到播放队列'),
    nonce: Date.now(),
    durationMs: 1200,
});
```

- [ ] **Step 3: Type-check the affected data path**

Run: `npm run lint`

Expected: TypeScript completes without imports or symbols related to `useRequestedQueueStore` or `ensureRequestedQueueSeededFromPlaylist` in these files.

### Task 2: Make the floating dock consume the active playback playlist

**Files:**
- Modify: `src/hooks/useAppOverlayDialogViewModels.ts:1-15, 128-143, 179-181, 319-320`
- Modify: `src/components/FloatingPlayerControls.tsx:22, 562-573, 885-895`
- Modify: `src/components/FloatingPlayerQueueMenu.tsx:1-8, 20, 35, 47-64, 149-219`
- Modify: `src/components/app/overlays/buildAppOverlaysModel.ts:215, 383-387`

**Interfaces:**
- Consumes: `playQueue: SongResult[]` and `playSong(song, queue, false, { shouldNavigateToPlayer: false })`.
- Produces: player panel and floating dock render and select from the identical `playQueue` instance.

- [ ] **Step 1: Replace the dock model’s requested queue with `playQueue`**

Remove `useRequestedQueueStore`, `ensureRequestedQueueSeededFromPlaylist`, `requestedQueue`, and the associated effect from `useAppOverlayDialogViewModels`. Pass the destructured `playQueue` through unchanged.

```ts
playQueueLength: playQueue.length,
playQueue,
```

- [ ] **Step 2: Remove auto-seed state and behavior from floating controls**

Remove the requested-store import, `autoSeedNotice`, `clearAutoSeedNotice`, `highlightAutoSeed`, and its timeout effect. Keep `queueMenuOpen` so opening the dock menu still pauses the chrome auto-hide timer.

```tsx
<FloatingPlayerQueueMenu
    playQueue={playQueue}
    currentSongId={currentSong?.id ?? null}
    onPlaySong={onPlayQueueSong}
    isDaylight={isDaylight}
    open={queueMenuOpen}
    onOpenChange={setQueueMenuOpen}
    disabled={controlsDisabled}
    triggerClassName={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-180 ${buildToolButtonClass(isDaylight, controlsDisabled, queueMenuOpen)}`}
    queueLabel={queueLabel}
/>
```

- [ ] **Step 3: Simplify the dock menu’s empty state**

Remove `onAddSongs`, daily-recommendation imports/state/effects, the auto-seed banner, badge prop, and recommended-song branch. An empty active playlist uses the normal translated empty hint.

```tsx
{playQueue.length === 0 ? (
    <div className={`px-2 py-6 text-center text-[12px] ${isDaylight ? 'text-black/40' : 'text-white/40'}`}>
        {t('queue.emptyHint')}
    </div>
) : null}
```

- [ ] **Step 4: Align the English fallback label**

Change the `buildAppOverlaysModel` default label from `Play queue` to `Playlist`; keep the supplied translated label as the display value in normal app execution.

```ts
queueLabel = 'Playlist',
```

- [ ] **Step 5: Type-check the surface wiring**

Run: `npm run lint`

Expected: the floating-control props no longer accept or use auto-seed or add-recommendation fields, and the model supplies its live `playQueue`.

### Task 3: Rename copy and delete the obsolete requested-list implementation

**Files:**
- Modify: `src/i18n/locales/zh-CN.ts:1144-1157`
- Modify: `src/i18n/locales/en.ts:1141-1154`
- Delete: `src/stores/useRequestedQueueStore.ts`
- Delete: `src/utils/seedRequestedQueueFromPlaylist.ts`
- Delete: `test/unit/stores/requestedQueueStore.test.ts`
- Delete: `test/unit/utils/seedRequestedQueueFromPlaylist.test.ts`

**Interfaces:**
- Consumes: queue translation keys still used by `QueueTab`, `QueueEmptyState`, and `FloatingPlayerQueueMenu`.
- Produces: no requested-list strings, store, seed helper, storage key, or isolated unit tests remain.

- [ ] **Step 1: Update retained playlist copy**

Keep generic queue keys used by the panel empty state and recommendations. Rename the shared title and empty text, then remove only auto-seed keys with no remaining callers.

```ts
// zh-CN.ts
"empty": "播放列表为空",
"title": "播放列表",

// en.ts
"empty": "Playlist is empty",
"title": "Playlist",
```

- [ ] **Step 2: Delete the isolated state implementation and tests**

Remove the requested queue store, auto-seed utility, and their tests together.

```bash
git rm src/stores/useRequestedQueueStore.ts \
  src/utils/seedRequestedQueueFromPlaylist.ts \
  test/unit/stores/requestedQueueStore.test.ts \
  test/unit/utils/seedRequestedQueueFromPlaylist.test.ts
```

- [ ] **Step 3: Confirm no obsolete requested-list references remain**

Run: `rg "useRequestedQueueStore|requestedQueue|requested_queue_v1|ensureRequestedQueueSeededFromPlaylist|autoSeed" src test`

Expected: no matches.

- [ ] **Step 4: Run the automated validation**

Run: `npm run lint && npm run test:unit`

Expected: TypeScript and Vitest pass; no deleted requested-list test files are discovered.

### Task 4: Verify the unified user experience

**Files:**
- Modify: no additional files.

**Interfaces:**
- Consumes: the one active `playQueue` used by the panel, dock, and transport controls.
- Produces: confirmation that the product wording and surfaces match the selected design.

- [ ] **Step 1: Exercise a playlist context manually**

In the running app, start playback from a multi-song playlist. Open the player-panel playlist and the floating-dock playlist.

Expected: both headers say “播放列表”, counts match, and item order including the current song matches.

- [ ] **Step 2: Exercise queue mutations manually**

Add a song using the configured append/next behavior, select a track from the dock, then shuffle and advance once.

Expected: each action is reflected identically in both surfaces, and previous/next follows the displayed list.

- [ ] **Step 3: Exercise the empty state**

Start a one-song context or clear the available queue through existing supported behavior, then open the dock menu.

Expected: the dock displays the standard empty-playlist message without auto-fill, a badge, or a separate recommendation list.
