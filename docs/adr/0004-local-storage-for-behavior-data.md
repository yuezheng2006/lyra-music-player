# ADR-0004: 本地存储用户行为数据

## 状态
已接受

## 背景
行为分析引擎需要持久化用户的听歌行为数据，包括：
- 播放历史（时间戳、歌曲ID、播放来源）
- 播放次数（每首歌的累计播放次数）
- 跳过记录（哪些歌被跳过，何时跳过）
- 播放完成度（是否完整听完）
- 情绪轨迹（用户修正的情绪标注）

存储方案选择：
1. **云端存储**（需要后端服务）
2. **本地存储**（浏览器：IndexedDB/LocalStorage；桌面端：SQLite/文件）
3. **混合方案**（本地为主，云端同步为辅）

## 决策
采用**本地存储**方案：
- 所有用户行为数据存储在本地
- 浏览器端：IndexedDB
- 桌面端（Electron等）：SQLite 或 JSON文件
- 不依赖云端服务，完全离线可用

## 理由
1. **隐私优先**：用户数据不离开本地，无隐私泄露风险
2. **无依赖**：不需要后端服务，降低开发和运维成本
3. **性能高**：本地读写速度快，实时分析无延迟
4. **离线可用**：完全不依赖网络，符合音乐播放器的离线场景
5. **符合愿景**：强调"聚合个人数据"，本地化是自然选择

## 实现细节

### 数据结构设计
```typescript
// 播放历史记录
interface PlayRecord {
  id: string;
  songId: string;
  songName: string;
  artist: string;
  platform: 'qq' | 'netease' | 'qishui' | 'local';
  timestamp: number;
  duration: number;        // 歌曲总时长
  playedDuration: number;  // 实际播放时长
  completed: boolean;      // 是否听完
  skipped: boolean;        // 是否跳过
}

// 歌曲统计信息
interface SongStats {
  songId: string;
  playCount: number;         // 累计播放次数
  skipCount: number;         // 累计跳过次数
  lastPlayedAt: number;      // 最后播放时间
  userMood?: string;         // 用户修正的情绪标注
}

// 时空记忆模式
interface TemporalPattern {
  id: string;
  timePattern: string;       // e.g., "Wed 21:00"
  genreOrMood: string;       // e.g., "摇滚", "舒缓"
  confidence: number;        // 置信度 (0-1)
  lastTriggeredAt: number;
}
```

### 存储方案
- **IndexedDB**（浏览器）：
  - `play_records` 表：存储所有播放记录
  - `song_stats` 表：存储每首歌的统计信息
  - `temporal_patterns` 表：存储识别出的时空记忆模式
  - `user_corrections` 表：存储用户对情绪等的修正

- **SQLite**（桌面端）：结构同上

### 数据迁移和备份
- 提供导出功能（JSON格式）
- 提供导入功能（用户换设备时）
- 未来可选：加密备份到云端（用户授权）

## 后果
- **正面**：
  - 隐私安全，用户信任度高
  - 性能优秀，响应快
  - 无后端成本，易于部署
  - 完全离线可用
- **负面**：
  - 数据仅在单设备，换设备后需要手动迁移
  - 无法跨设备同步（除非用户手动导出/导入）
  - 本地数据损坏风险（浏览器清除缓存、磁盘损坏）
- **技术债**：
  - 需要实现数据导出/导入功能（MVP后优先级高）
  - 需要定期清理旧数据，避免数据库膨胀

## 未来演进方向
如果后续需要跨设备同步，可以：
1. 提供可选的云同步功能（用户授权）
2. 使用端到端加密保护隐私
3. 本地存储仍为主，云端作为备份和同步媒介

## 相关决策
- 为行为分析引擎（Behavior Analytics）和时空记忆（Temporal-Context Memory）提供数据基础
- 与平台聚合器（Platform Aggregator）配合，统一存储来自多平台的数据
