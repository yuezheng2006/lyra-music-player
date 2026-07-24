# Remote load stability (retry + diagnostics)

## Behavior
- HTTP (`fetchWithCreds`, sidecar) and YTM IPC go through `src/utils/network/*` with transient auto-retry (network / timeout / 429 / 5xx).
- Failures record into an in-memory diagnostic ring (`formatDiagnosticsForCopy`).
- Browse / search empty states use `RemoteLoadState`: short message + Retry + expandable copyable diagnostics.
- True empty lists stay empty (no fake “no content” for timeouts).

## Manual check (Electron)
1. Open 每日推荐 with network on — list or auth/empty as appropriate.
2. Disable network, force retry — expect error (not “今天还没有推荐歌曲”) + 诊断详情.
3. Re-enable network, retry — list recovers.
4. Search overlay: same error/retry path.
5. Playback URL failure: toast mentions diagnostics can be copied; console has `[App] Audio unavailable:` or capture logs.
