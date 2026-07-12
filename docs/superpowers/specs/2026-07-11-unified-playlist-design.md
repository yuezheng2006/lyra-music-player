# Unified Playback Playlist Design

## Goal

Replace the separate dock “已点列表” with the same live playlist used by the player panel, and name the shared UI “播放列表”.

## Current Problem

The player panel reads `playQueue`, which controls playback navigation. The floating dock instead reads the persisted `requestedQueue`. The latter is independently populated when users add songs and is automatically seeded from `playQueue` when empty. This lets the two surfaces show different songs and counts.

## Selected Design

`playQueue` is the sole source of truth for the current playback playlist:

- The player panel and floating dock consume the same `SongResult[]` and invoke the same `onPlaySong(song, playQueue)` action.
- All user-facing copy in these surfaces is “播放列表” / “Playlist”; “已点列表” is removed.
- Playing a playlist, album, or song establishes the current `playQueue` using existing playback behavior.
- Adding a song to the queue, previous/next navigation, and shuffle operate on that same queue. Existing insertion behavior remains unchanged.
- The standalone `requestedQueue` Zustand store, its local-storage key, auto-seeding utility, notice state, and dock-only recommendation/notice UI are removed.
- Legacy `requested_queue_v1` storage is not migrated. It represented a separate, non-playback list and must not alter the active playback playlist after this change.

## User Explanation

“播放列表” means the songs currently playing and queued to play next. It is a live playback context, not a saved music-library playlist. Users can save the current list through the existing “保存为歌单” action when they want to retain it.

## Boundaries

- Do not change queue ordering, deduplication, stage playback, or persistent last-playback caching behavior.
- Do not modify the existing theme, shell, or other unrelated uncommitted work.
- Do not introduce a replacement persisted queue.

## Verification

- Unit tests cover that the obsolete requested-queue store and seeding utility are no longer imported or required.
- Existing playback queue tests continue to cover add, select, shuffle, and navigation behavior.
- Manual check: starting a playlist, adding a song, choosing a dock item, shuffling, and advancing a track yield matching content and counts in the dock and player panel.
