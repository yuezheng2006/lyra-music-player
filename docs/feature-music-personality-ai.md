# 音乐人格画像 - AI 分析功能设计

> 基于用户听歌记录，用 AI 生成有趣生动的人物画像和音乐偏好分析
> 
> AI 服务：OpenRouter
> 
> 目标：让用户"哇！太准了！" + 主动分享到社交媒体

---

## 🎯 功能定位

### 核心价值
- ✅ **低成本验证 AI 付费意愿**（单次分析成本 < ¥0.5）
- ✅ **天然社交传播属性**（用户会主动分享到朋友圈/微博/小红书）
- ✅ **技术门槛低**（只需调用 OpenRouter API）
- ✅ **有趣且有用**（既娱乐又有洞察）

### 为什么这个功能适合作为第一步？

**1. 成本极低**
```
- 单次 AI 分析成本：¥0.3-0.5
- 不需要训练模型
- 不需要 GPU 服务器
- 只需要调用 API
```

**2. 开发快速**
```
- 1周完成核心功能
- 技术复杂度低
- 无需复杂的后端架构
```

**3. 传播性强**
```
- 用户看到有趣的分析会主动分享
- 朋友看到后好奇，也想试试
- 形成自然增长循环
```

**4. 验证付费意愿**
```
免费版：1次/月
Pro版：无限次 + 更详细的分析
→ 可以测试转化率
```

---

## 🎨 功能设计

### 分析维度（6大维度）

#### 1. 音乐人格类型 🎭
```
基于听歌风格，给出一个有趣的人格标签：

示例：
- 🌙 "午夜诗人" - 偏爱深夜独处，喜欢伤感慢歌
- 🔥 "燃烧战士" - 高能量，摇滚电音为主
- 🎨 "文艺游侠" - 民谣独立音乐，追求小众
- 💫 "情绪魔术师" - 根据心情切换风格
- 🎪 "复古收藏家" - 怀旧老歌，经典情怀
- 🌊 "自由浪人" - 世界音乐，不设边界
```

#### 2. 情绪光谱 🌈
```
分析用户最常出现的情绪状态：

快乐 ████████░░ 80%
忧伤 ██████░░░░ 60%
激昂 ███████░░░ 70%
平静 █████░░░░░ 50%
怀旧 ████████░░ 80%
```

#### 3. 时间习惯 ⏰
```
- 最活跃时段：深夜 23:00-02:00
- 听歌高峰：周五晚上
- 早晨偏好：轻快的流行歌
- 夜晚偏好：安静的抒情歌
```

#### 4. 音乐品味进化 📈
```
近期发现的变化：
- 从纯粹流行转向独立音乐
- 开始尝试电子音乐
- 对民谣的兴趣逐渐增加
```

#### 5. 隐藏性格洞察 🔍
```
通过音乐偏好分析潜在性格：
- "你是一个内心丰富但不善表达的人"
- "你在人群中很活跃，但也需要独处时刻"
- "你对美有独特的追求和理解"
```

#### 6. 推荐与建议 💡
```
- 推荐艺人：根据当前品味
- 推荐歌单：基于情绪模式
- 音乐探索方向：拓展听歌范围
```

---

## 🎨 展示设计

### 主界面 - "我的音乐画像"

```
┌─────────────────────────────────────────┐
│  🎵 你的音乐人格                         │
│                                         │
│         🌙 午夜诗人                      │
│    "深夜里的情感收集者"                   │
│                                         │
│  在喧嚣的世界里，你是那个在午夜独自品味    │
│  孤独与美好的人。你的歌单像一本情感日记，  │
│  记录着说不出口的心事...                 │
│                                         │
│  [查看完整分析] [分享到社交媒体]          │
└─────────────────────────────────────────┘
```

### 详细分析页

```
┌─────────────────────────────────────────┐
│  🎭 音乐人格：午夜诗人                    │
├─────────────────────────────────────────┤
│                                         │
│  📊 情绪光谱                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         │
│  快乐 ████████░░ 80%                    │
│  忧伤 ██████░░░░ 60%                    │
│  激昂 ███████░░░ 70%                    │
│  平静 █████░░░░░ 50%                    │
│  怀旧 ████████░░ 80%                    │
│                                         │
├─────────────────────────────────────────┤
│  ⏰ 你的音乐时钟                          │
│  [可视化图表：24小时听歌分布]             │
│                                         │
│  深夜时光（23:00-02:00）                 │
│  这是属于你的黄金时段，你会听：           │
│  • 陈奕迅《十年》                        │
│  • 邓紫棋《来自天堂的魔鬼》               │
│  • 毛不易《消愁》                        │
│                                         │
├─────────────────────────────────────────┤
│  🔍 性格洞察                             │
│                                         │
│  你是一个内心丰富但不善表达的人。         │
│  白天的你可能是社交达人，但夜晚的你更真实。│
│  音乐是你的情感出口，也是你的秘密花园。   │
│                                         │
│  在别人看来，你可能是个乐观开朗的人，      │
│  但只有你的播放列表知道，你也会有脆弱和   │
│  敏感的时刻...                           │
│                                         │
├─────────────────────────────────────────┤
│  💫 特别时刻                             │
│                                         │
│  最近一次深夜单曲循环：                   │
│  《夜曲》- 周杰伦                        │
│  循环了 23 次                            │
│                                         │
│  分析：那天晚上发生了什么吗？             │
│  看起来你需要音乐来陪伴一段特别的情绪...  │
│                                         │
├─────────────────────────────────────────┤
│  📈 音乐品味进化                          │
│                                         │
│  [时间轴可视化]                          │
│                                         │
│  3个月前：纯流行                          │
│  2个月前：开始尝试民谣                    │
│  最近：爱上独立音乐                       │
│                                         │
│  你的音乐世界正在扩展，从主流走向小众，    │
│  这说明你在寻找更多能引起共鸣的声音...    │
│                                         │
├─────────────────────────────────────────┤
│  🎁 为你推荐                             │
│                                         │
│  基于你的"午夜诗人"属性，你可能会喜欢：   │
│  • 艺人：陈粒、房东的猫                   │
│  • 歌单：[深夜电台] [孤独患者]            │
│  • 探索方向：爵士乐可能适合深夜的你       │
│                                         │
└─────────────────────────────────────────┘

[重新分析] [分享画像] [查看朋友的画像]
```

---

## 🎨 AI Prompt 设计

### System Prompt
```
你是一位资深音乐心理学家和数据分析师，擅长通过人们的听歌习惯分析他们的性格和情感状态。

你的分析风格：
- 生动有趣，像朋友聊天一样
- 准确敏锐，能发现深层模式
- 温暖治愈，给人被理解的感觉
- 略带文艺，有情感共鸣
- 不说教，不刻板

你的任务：
基于用户的听歌记录，生成一份独特的"音乐人格画像"。

输出要求：
1. 给出一个有创意的音乐人格标签（2-4个字）
2. 用一句话概括这个人格
3. 写一段200-300字的人格描述（要像在讲故事）
4. 分析情绪分布（5个维度，百分比）
5. 找出时间习惯模式
6. 给出2-3条性格洞察
7. 推荐3-5个可能喜欢的艺人或歌单

重要：
- 要准确但不要冰冷
- 要专业但不要术语化
- 要深刻但不要说教
- 要有趣但不要轻浮
```

### User Prompt Template
```
请分析以下用户的听歌数据，生成音乐人格画像：

## 基础统计
- 总播放次数：{total_plays}
- 不同歌曲数：{unique_songs}
- 最常听的时段：{peak_hours}
- 听歌跨度：{date_range}

## Top 20 歌曲（包含歌名、艺人、播放次数、时间分布）
{top_songs_list}

## 风格分布
{genre_distribution}

## 情绪标签统计（如果有）
{mood_tags}

## 特殊模式
- 单曲循环记录：{loop_songs}
- 深夜听歌比例：{night_ratio}
- 周末vs工作日差异：{weekday_pattern}

请生成有趣、准确、温暖的分析报告。以 JSON 格式返回：
{
  "personality_type": "音乐人格标签",
  "tagline": "一句话概括",
  "description": "人格描述（200-300字）",
  "emotion_spectrum": {
    "happy": 80,
    "sad": 60,
    "energetic": 70,
    "calm": 50,
    "nostalgic": 80
  },
  "time_habits": {
    "peak_time": "23:00-02:00",
    "description": "时间习惯描述"
  },
  "personality_insights": [
    "洞察1",
    "洞察2",
    "洞察3"
  ],
  "recommendations": {
    "artists": ["艺人1", "艺人2"],
    "playlists": ["歌单主题1", "歌单主题2"],
    "exploration": "探索建议"
  },
  "special_moment": {
    "song": "歌名 - 艺人",
    "context": "特殊时刻描述"
  }
}
```

---

## 💻 技术实现

### 1. 数据收集（已有基础）

从现有的播放历史收集：
```typescript
interface ListeningHistory {
  songId: string;
  songName: string;
  artist: string;
  album: string;
  playedAt: Date;
  duration: number;
  playCount: number; // 如果重复播放
}

// 需要统计的数据
interface AnalysisData {
  totalPlays: number;
  uniqueSongs: number;
  dateRange: { start: Date; end: Date };
  topSongs: Array<{
    song: string;
    artist: string;
    plays: number;
    timeDistribution: number[]; // 24小时分布
  }>;
  genreDistribution: Record<string, number>;
  hourlyDistribution: number[]; // 0-23小时
  weekdayPattern: number[]; // 周一到周日
  loopSongs: Array<{ song: string; consecutivePlays: number }>;
}
```

### 2. OpenRouter API 集成

```typescript
// src/services/openRouterService.ts

const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface MusicPersonalityAnalysis {
  personality_type: string;
  tagline: string;
  description: string;
  emotion_spectrum: {
    happy: number;
    sad: number;
    energetic: number;
    calm: number;
    nostalgic: number;
  };
  time_habits: {
    peak_time: string;
    description: string;
  };
  personality_insights: string[];
  recommendations: {
    artists: string[];
    playlists: string[];
    exploration: string;
  };
  special_moment?: {
    song: string;
    context: string;
  };
}

export async function generateMusicPersonality(
  analysisData: AnalysisData
): Promise<MusicPersonalityAnalysis> {
  const systemPrompt = `你是一位资深音乐心理学家和数据分析师...`; // 完整 prompt

  const userPrompt = buildUserPrompt(analysisData);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lyra-music.app', // 你的域名
      'X-Title': 'Lyra Music Player',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet', // 或其他模型
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }, // 强制 JSON 输出
      temperature: 0.8, // 稍高一点，更有创意
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  
  return result;
}

function buildUserPrompt(data: AnalysisData): string {
  // 构建详细的 prompt
  return `请分析以下用户的听歌数据...`;
}
```

### 3. UI 组件

```typescript
// src/components/MusicPersonalityModal.tsx

import React, { useState } from 'react';
import { generateMusicPersonality } from '../services/openRouterService';
import { analyzeListeningHistory } from '../utils/historyAnalyzer';

export const MusicPersonalityModal: React.FC = () => {
  const [analysis, setAnalysis] = useState<MusicPersonalityAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // 1. 从数据库获取听歌历史
      const history = await getListeningHistory();
      
      // 2. 统计分析
      const analysisData = analyzeListeningHistory(history);
      
      // 3. 调用 AI 生成画像
      const result = await generateMusicPersonality(analysisData);
      
      setAnalysis(result);
    } catch (error) {
      console.error('分析失败:', error);
      // 错误处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="music-personality-modal">
      {loading && <LoadingAnimation />}
      {analysis && <PersonalityDisplay analysis={analysis} />}
      <button onClick={handleAnalyze}>生成我的音乐画像</button>
    </div>
  );
};
```

### 4. 数据分析辅助函数

```typescript
// src/utils/historyAnalyzer.ts

export function analyzeListeningHistory(
  history: ListeningHistory[]
): AnalysisData {
  // 基础统计
  const totalPlays = history.length;
  const uniqueSongs = new Set(history.map(h => h.songId)).size;
  
  // Top 20 歌曲
  const songCounts = new Map<string, number>();
  history.forEach(h => {
    const key = `${h.songName} - ${h.artist}`;
    songCounts.set(key, (songCounts.get(key) || 0) + 1);
  });
  
  const topSongs = Array.from(songCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([song, plays]) => ({
      song: song.split(' - ')[0],
      artist: song.split(' - ')[1],
      plays,
      timeDistribution: calculateTimeDistribution(history, song),
    }));
  
  // 时间分布
  const hourlyDistribution = new Array(24).fill(0);
  history.forEach(h => {
    const hour = new Date(h.playedAt).getHours();
    hourlyDistribution[hour]++;
  });
  
  // 单曲循环检测
  const loopSongs = detectLoopSongs(history);
  
  // ... 更多分析
  
  return {
    totalPlays,
    uniqueSongs,
    topSongs,
    hourlyDistribution,
    loopSongs,
    // ...
  };
}

function detectLoopSongs(history: ListeningHistory[]) {
  const loops: Array<{ song: string; consecutivePlays: number }> = [];
  
  let currentSong = '';
  let currentCount = 0;
  
  history.forEach(h => {
    const song = `${h.songName} - ${h.artist}`;
    if (song === currentSong) {
      currentCount++;
    } else {
      if (currentCount >= 5) { // 连续5次算作循环
        loops.push({ song: currentSong, consecutivePlays: currentCount });
      }
      currentSong = song;
      currentCount = 1;
    }
  });
  
  return loops.sort((a, b) => b.consecutivePlays - a.consecutivePlays);
}
```

---

## 💰 商业模式设计

### 免费版
```
- 每月 1 次免费分析
- 基础画像（人格类型 + 情绪光谱）
- 分享到社交媒体
```

### Pro版（¥29.9/月）
```
- 无限次分析
- 完整详细报告
- 历史分析对比（看自己的变化）
- 月度/年度总结报告
- 导出精美海报
```

### 付费点设计
```
┌─────────────────────────────────────┐
│  🎵 本月免费次数已用完               │
│                                     │
│  升级 Pro 解锁：                    │
│  ✓ 无限次 AI 分析                   │
│  ✓ 更详细的性格洞察                 │
│  ✓ 月度音乐回顾                     │
│  ✓ 导出精美海报                     │
│                                     │
│  [升级 Pro - ¥29.9/月]              │
│  [单次购买 - ¥2.99]                 │
└─────────────────────────────────────┘
```

---

## 📊 成本分析

### OpenRouter 定价（参考）
| 模型 | 输入价格 | 输出价格 | 单次成本估算 |
|------|---------|---------|-------------|
| Claude 3.5 Sonnet | $3/1M tokens | $15/1M tokens | ¥0.3-0.5 |
| GPT-4 Turbo | $10/1M tokens | $30/1M tokens | ¥0.8-1.2 |
| GPT-3.5 Turbo | $0.5/1M tokens | $1.5/1M tokens | ¥0.1-0.2 |

**建议：** 使用 Claude 3.5 Sonnet（质量好，性价比高）

### 收入预测
```
假设：
- 1000个活跃用户
- 5%付费转化率（50人）
- Pro版：¥29.9/月

月收入：50 × ¥29.9 = ¥1,495

成本：
- 免费用户分析：1000人 × 1次 × ¥0.4 = ¥400
- 付费用户分析：50人 × 10次 × ¥0.4 = ¥200
- 服务器：¥200
合计成本：¥800

净利润：¥1,495 - ¥800 = ¥695

利润率：46%
```

---

## 🚀 开发计划

### Week 1：核心功能
- [ ] 听歌历史数据统计模块
- [ ] OpenRouter API 集成
- [ ] Prompt 设计和调试
- [ ] 基础 UI 组件

### Week 2：完善体验
- [ ] 美化分析报告界面
- [ ] 添加可视化图表
- [ ] 分享到社交媒体功能
- [ ] 错误处理和重试机制

### Week 3：付费功能
- [ ] 免费次数限制
- [ ] 付费解锁逻辑
- [ ] 单次购买选项
- [ ] 用户反馈收集

---

## 🎨 分享海报设计

### 社交媒体分享样式
```
┌─────────────────────────────────────┐
│                                     │
│        🎵 Lyra 音乐画像             │
│                                     │
│    [渐变背景 + 音乐符号装饰]         │
│                                     │
│         🌙 午夜诗人                 │
│                                     │
│  "在喧嚣的世界里，你是那个在         │
│   午夜独自品味孤独与美好的人"        │
│                                     │
│  情绪光谱                            │
│  快乐 ████████░░ 80%               │
│  忧伤 ██████░░░░ 60%               │
│  怀旧 ████████░░ 80%               │
│                                     │
│  [二维码]                           │
│  扫码生成你的音乐画像                │
│                                     │
└─────────────────────────────────────┘
```

---

## 📈 增长策略

### 病毒式传播循环
```
用户生成画像
     ↓
觉得准确且有趣
     ↓
分享到社交媒体
     ↓
朋友看到好奇
     ↓
扫码试用 Lyra
     ↓
生成自己的画像
     ↓
继续分享...
```

### 增长助推
1. **在海报上加激励**："邀请3位好友，解锁本月无限分析"
2. **话题标签**：#我的音乐人格 #音乐画像
3. **排行榜**："本周最受欢迎的音乐人格 Top 10"
4. **对比功能**："与朋友对比音乐品味相似度"

---

## ⚠️ 注意事项

### 隐私保护
- [ ] 用户明确授权才能分析
- [ ] 不公开具体听歌记录
- [ ] 分享海报不包含敏感信息
- [ ] 提供删除历史记录选项

### 质量控制
- [ ] 数据量不足时提示用户继续听歌
- [ ] AI 生成结果审核（避免不当内容）
- [ ] 提供"重新生成"选项（如果用户不满意）
- [ ] 收集反馈："这个分析准确吗？"

### 技术风险
- [ ] API 调用失败的降级方案
- [ ] 成本超支的限流机制
- [ ] 缓存机制（同一用户短期内不重复分析）

---

## 🎯 成功指标

### 短期（1个月）
- [ ] 100+ 用户生成画像
- [ ] 分享率 > 30%
- [ ] 付费转化率 > 3%
- [ ] 用户满意度 > 4.0/5.0

### 中期（3个月）
- [ ] 1000+ 用户生成画像
- [ ] 自然增长率 > 20%/月
- [ ] 50+ 付费用户
- [ ] 月收入 > ¥1,500

---

## 💡 后续扩展方向

### 如果这个功能成功，可以扩展：

1. **音乐性格匹配**
   - 找到音乐品味相似的用户
   - 推荐志趣相投的朋友

2. **情绪日记**
   - 通过听歌记录生成情绪曲线
   - 帮助用户了解自己的情绪变化

3. **年度音乐报告**
   - 类似 Spotify Wrapped
   - 更详细的年度回顾

4. **音乐治愈计划**
   - 根据情绪状态推荐歌单
   - AI 生成个性化音乐疗愈方案

---

## ✅ 下一步行动

### 本周立即开始
1. **申请 OpenRouter API Key**
   - 注册账号：https://openrouter.ai
   - 充值 $5-10 用于测试
   
2. **设计 Prompt**
   - 用自己的听歌数据测试
   - 调优 prompt 直到满意

3. **开发数据统计模块**
   - 从现有数据库提取听歌历史
   - 实现基础统计函数

### 下周完成
4. **API 集成**
   - 实现 OpenRouter 调用
   - 错误处理和重试

5. **UI 开发**
   - 分析按钮入口
   - 结果展示页面

### 第三周上线
6. **完善功能**
   - 分享功能
   - 付费逻辑（可选，先验证需求）

7. **小范围测试**
   - 邀请10-20个用户试用
   - 收集反馈优化

---

**这是一个完美的第一步！成本低、开发快、传播性强，而且能真正验证用户对 AI 功能的付费意愿。** 🚀
