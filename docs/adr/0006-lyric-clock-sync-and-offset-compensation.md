# ADR-0006: 歌词时钟同步与偏移补偿

## 状态
已接受（2026-07 实测校准）

## 背景
用户反馈"人声总是比歌词快一点点"。排查后确认这不是单一 bug，而是一条完整的时间管线问题：

```
音频输出（扬声器）
└── HTMLAudioElement.currentTime        ← 唯一媒体时钟
    └── rAF 轮询采样（usePlaybackVisualizerBridge）
        └── resolveLyricPlaybackTimes   ← 应用用户偏移
            └── MotionValue（currentTime / lyricCurrentTime）
                ├── 逐字状态判定（lyricWordStatusMath）
                ├── KTV 扫光（karaokeWipeMath）
                └── 桌面歌词（buildDesktopLyricsState）
```

实测数据（CDP probe，M 系 Mac + 120Hz 屏）：

| 环节 | 量级 | 方向 |
| --- | --- | --- |
| Web Audio outputLatency | ~32ms | 视觉相对听感**提前** |
| rAF 采样 → 上屏 paint | ~16ms | 视觉**滞后** |
| 媒体时钟启动缺口 | ~45ms（仅起播瞬间） | 一次性 |
| 管线净偏差 | ≈ 0 | — |

结论：管线本身基本对齐，"歌词慢"主要来自歌词文件时间戳偏晚，需要用户级校准手段 + 渲染补偿。

## 决策

### 1. 偏移极性统一约定
**正偏移 = 歌词更晚出现**（`lyricTime = currentTime - offsetMs / 1000`）。

- 主窗口：`src/utils/playback/syncLyricPlaybackClock.ts`
- 桌面歌词：`src/utils/desktopLyrics/buildDesktopLyricsState.ts`（修复前极性相反，已对齐）

任何新的歌词时钟消费者必须复用 `resolveLyricPlaybackTimes`，不得自行加减偏移。

### 2. LRC `[offset:±ms]` 标签在解析期生效
LRC 惯例：**标签正值 = 歌词提前**（时间戳整体下移）。在 `parserCore.ts` 解析时一次性平移所有 `startTime` / `endTime`，运行时不再感知该标签。注意它与用户偏移极性相反，两者语义独立。

### 3. 渲染延迟用固定 lookahead 补偿
- 逐字激活判定 lookahead：`0.08s`（`lyricWordStatusMath.ts`）
- KTV 扫光 render lead：`0.033s`（`KARAOKE_WIPE_RENDER_LEAD_SEC`，约两帧 @120Hz）

补偿值是常量而非动态测量：渲染延迟量级稳定（~16ms），动态测量的复杂度不值得。

### 4. 用户偏移按歌记忆
- 存储：`src/utils/playback/lyricOffsetStore.ts`，localStorage key `lyric_timeline_offsets_v1`
- 歌曲身份：本地文件优先用 `LocalSong` UUID（`localfile:<uuid>`），因为 `SongResult.id` 对本地歌曲是会话级生成、不稳定；在线源用 `provider:id`
- 换歌时从 store 恢复而不是重置为 0
- UI 步进 50ms（真实歌词偏差通常 50–150ms，原 250ms 步进无法校准）

### 5. 媒体时钟只有一个
`audio.currentTime` 是唯一真相，rAF 循环不做时间外推（不用 `performance.now()` 推算媒体时间）。外推曾导致暂停/seek 边界错位，收益（更平滑）不抵风险。

## 理由
1. 极性统一后，"调偏移"在主窗口、桌面歌词、导出等所有消费端行为一致。
2. 解析期处理 `[offset:]` 使运行时零成本，且所有消费端自动受益。
3. 按歌记忆符合真实使用模式：偏差来自歌词文件本身，同一首歌的偏差是稳定的。
4. 常量 lookahead 简单可测试，且有单测锁定。

## 后果
- 正面：换歌不丢校准；桌面歌词与主窗口不再互相矛盾；带 `[offset:]` 的 LRC 开箱即准。
- 负面：又多一个 localStorage key 需要进入存储清理范围。
- 技术债：`lookaheadSec` / `RENDER_LEAD` 在低刷新率屏幕（60Hz）上补偿略不足，如有反馈可按 `screen.refreshRate` 分档。

## 验证
- 单测：`test/unit/lyrics/parserCore.test.ts`（offset 标签）、`karaokeWipeMath.test.ts`（render lead）、`lyricOffsetStore.test.ts`（key 稳定性）、`desktopLyrics/buildDesktopLyricsState.test.ts`（极性）
- E2E：`test/ui/lyric-offset.spec.ts`（50ms 步进、按歌持久化、换歌恢复、重置）

## 相关决策
- ADR-0004：行为数据本地存储（同样使用 localStorage 承载用户偏好）
