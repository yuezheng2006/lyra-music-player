# Hackathon 提交方案

## 📋 项目概览

### 当前命名评估
**现有名称**: Auralis (声境)  
**评估**: 虽然有意境，但不够直观易记，国际化发音略显复杂

### 🎯 新命名建议

#### 推荐方案 1: **Lyra** (天琴)
- ✅ 简短易记（4个字母）
- ✅ 朗朗上口，国际化友好
- ✅ 来自天琴座（Lyra constellation），音乐与天文的优雅结合
- ✅ 暗示"Lyrics"（歌词），契合产品核心功能
- ✅ .com/.app 域名可获得性较好
- 🎵 品牌定位：优雅、专业、沉浸式

#### 推荐方案 2: **Vibe** (律动)
- ✅ 极简易记（4个字母）
- ✅ 当代音乐文化强关联
- ✅ 发音简单，全球通用
- ✅ 传达音乐的"感觉"和"氛围"
- ⚠️ 可能过于常见，品牌识别度略低

#### 推荐方案 3: **Prism** (棱镜)
- ✅ 视觉与听觉的完美隐喻
- ✅ 契合产品的多主题、多视觉效果特性
- ✅ 现代感强，科技感足
- ✅ 暗示"将音乐转化为视觉体验"的核心理念

#### 推荐方案 4: **Flow** (流)
- ✅ 极简（4个字母）
- ✅ 音乐的流动感
- ✅ 沉浸式体验的流畅感
- ✅ 心流状态（Flow State）
- ⚠️ 通用词汇，需要视觉设计强化品牌

**最终推荐**: **Lyra** - 平衡了优雅、易记、品牌独特性和产品契合度

---

## 🎨 UI/UX 设计评估与改进建议

### 当前设计优势
1. ✅ **视觉冲击力强** - 3D 舞台效果、多主题系统
2. ✅ **动画流畅** - Framer Motion 加持的过渡效果
3. ✅ **技术实现先进** - Three.js 3D 渲染、WebGL 效果
4. ✅ **主题系统完善** - 6+ 种预设主题，AI 主题生成

### 需要改进的地方（对标 Hallmark 级别）

#### 🔴 高优先级改进

1. **视觉层次与信息密度**
   - 问题：部分界面信息密度过高，缺乏呼吸空间
   - 改进：增加组件间距（从当前 `gap-4` 提升到 `gap-6` 或 `gap-8`）
   - 代码位置：`src/components/GridView.tsx`, `src/components/Home.tsx`

2. **色彩系统规范化**
   - 问题：多主题下色彩一致性需要加强
   - 改进：建立严格的色彩 Token 系统
   - 建议：参考 Radix Colors 或 Tailwind v4 色彩哲学
   - 代码位置：`src/index.css`, `src/components/app/presentation/buildVisualizerTheme.ts`

3. **微交互细节**
   - 问题：部分按钮/卡片的 hover 状态缺乏微妙的反馈
   - 改进：
     ```tsx
     // 当前
     className="hover:bg-white/10"
     
     // 改进为
     className="hover:bg-white/10 hover:scale-[1.02] transition-all duration-200"
     ```
   - 增加细微的 scale、shadow 变化

4. **排版系统优化**
   - 问题：字体大小层级可以更加清晰
   - 改进：建立 Type Scale（例如：12px / 14px / 16px / 20px / 24px / 32px / 48px）
   - 行高统一为 1.5 倍（正文）/ 1.2 倍（标题）
   - 代码位置：`src/index.css`, Tailwind 配置

#### 🟡 中优先级改进

5. **边框圆角统一**
   - 当前：混用 `rounded-lg` (8px) / `rounded-xl` (12px) / `rounded-3xl` (24px)
   - 建议：统一为 `rounded-2xl` (16px) 作为主要圆角，`rounded-full` 用于圆形按钮

6. **阴影系统精简**
   - 当前：多种自定义 shadow
   - 建议：统一为 3 档 - subtle / medium / prominent

7. **加载状态优化**
   - 增加骨架屏（Skeleton）替代纯 loading spinner
   - 提升感知性能

#### 🟢 低优先级（精益求精）

8. **深色模式对比度**
   - 确保 WCAG AA 级别对比度（至少 4.5:1）
   
9. **焦点可见性**
   - 为键盘用户增加清晰的 focus-visible 样式

10. **动画性能**
    - 确保所有动画使用 GPU 加速属性（transform, opacity）
    - 避免 layout thrashing

---

## 📦 Hackathon 提交清单

### 1. 产出物 - 应用程序

#### Desktop App (Electron)
- ✅ 已完成打包配置
- ✅ 支持 macOS / Windows / Linux
- 📍 路径：运行 `npm run build:electron` 生成
- 📦 产物位置：`release/` 目录

#### Web App (Vercel 部署)
- ✅ 已支持 Vite 构建
- ✅ PWA 支持（vite-plugin-pwa）
- 🚀 部署步骤：

```bash
# 1. 确保 package.json 中的构建命令正确
npm run build

# 2. 创建 vercel.json 配置（见下方）

# 3. 部署
npx vercel --prod
```

**需要创建的 `vercel.json` 配置**：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**环境变量配置**（Vercel Dashboard）：
- `NETEASE_API_URL`: 网易云 API 地址
- `GOOGLE_AI_API_KEY`: Google Gemini API Key（如果使用 AI 功能）

### 2. 产出物 - 3分钟演示视频

#### 脚本大纲

**0:00-0:20 开场（20秒）**
- 钩子：展示最炫的 3D 舞台效果 + 歌词动画
- 旁白："在音乐与视觉的交汇处，[Lyra/你选择的名字] 重新定义沉浸式听歌体验"

**0:20-0:50 核心功能演示（30秒）**
1. 搜索歌曲 → 快速播放（5秒）
2. 展示多主题切换（浮名、流光、心象）（10秒）
3. 3D 交互背景演示（10秒）
4. 智能歌词匹配（5秒）

**0:50-1:30 差异化功能（40秒）**
1. AI 主题生成 - 展示如何根据歌曲情绪生成主题（15秒）
2. 本地音乐 + 智能匹配 - 导入本地文件自动获取歌词（15秒）
3. 桌面歌词 + Discord 集成（10秒）

**1:30-2:20 跨平台展示（50秒）**
1. Electron 桌面端（macOS）- 展示自定义窗口、点击穿透（15秒）
2. Web 端（浏览器）- 展示响应式设计（15秒）
3. PWA 安装（移动端访问）（10秒）
4. 多设备协同（可选，如果有）（10秒）

**2:20-3:00 技术亮点与结尾（40秒）**
- 技术栈介绍（React 19, Three.js, Framer Motion）（10秒）
- 开源协作（AGPL-3.0, 21+ 贡献者）（10秒）
- 未来规划（10秒）
- 行动号召："开始你的沉浸式音乐之旅"+ 网址/二维码（10秒）

#### 制作建议

**工具推荐**：
- 录屏：OBS Studio / ScreenFlow / Camtasia
- 剪辑：DaVinci Resolve (免费) / Final Cut Pro / Premiere Pro
- 配音：自然人声 or ElevenLabs AI 配音
- 配乐：使用你的产品播放舒缓背景音乐（展现产品）

**视觉技巧**：
- 使用快速的切换（2-5秒一个镜头）保持节奏
- 添加文字标注突出功能点
- 使用缩放/高亮突出关键操作
- 统一调色（建议使用产品的主题色调）

**分辨率**：1080p (1920x1080) 或 4K (3840x2160)
**格式**：MP4 (H.264 编码)
**帧率**：30fps 或 60fps

### 3. 产出物 - 产品展示页面

#### 选项 A: 单页展示（推荐快速实现）

在项目根目录创建 `showcase.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lyra - 沉浸式音乐播放器</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-white">
    <!-- Hero Section -->
    <section class="min-h-screen flex items-center justify-center px-8">
        <div class="max-w-4xl text-center">
            <h1 class="text-6xl font-bold mb-6">Sound, Stage, Sense</h1>
            <p class="text-2xl text-zinc-400 mb-12">声随境转</p>
            <div class="flex gap-4 justify-center">
                <a href="#demo" class="px-8 py-4 bg-white text-black rounded-full hover:bg-zinc-200">观看演示</a>
                <a href="https://your-vercel-url.vercel.app" class="px-8 py-4 border border-white rounded-full hover:bg-white/10">立即体验</a>
            </div>
        </div>
    </section>

    <!-- Video Section -->
    <section id="demo" class="min-h-screen flex items-center justify-center px-8 py-20">
        <div class="max-w-6xl w-full">
            <h2 class="text-4xl font-bold text-center mb-12">产品演示</h2>
            <div class="aspect-video bg-zinc-900 rounded-2xl overflow-hidden">
                <video controls class="w-full h-full">
                    <source src="./demo-video.mp4" type="video/mp4">
                </video>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="min-h-screen px-8 py-20">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-4xl font-bold text-center mb-20">核心能力</h2>
            <div class="grid md:grid-cols-3 gap-8">
                <!-- Feature 1 -->
                <div class="p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                    <div class="text-5xl mb-4">🎭</div>
                    <h3 class="text-2xl font-bold mb-4">3D 舞台视觉</h3>
                    <p class="text-zinc-400">沉浸式 3D 交互背景，WebGL 驱动的实时渲染</p>
                </div>
                <!-- Feature 2 -->
                <div class="p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                    <div class="text-5xl mb-4">🎨</div>
                    <h3 class="text-2xl font-bold mb-4">AI 智能主题</h3>
                    <p class="text-zinc-400">基于歌曲情绪与歌词内容生成专属视觉氛围</p>
                </div>
                <!-- Feature 3 -->
                <div class="p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                    <div class="text-5xl mb-4">📝</div>
                    <h3 class="text-2xl font-bold mb-4">智能歌词匹配</h3>
                    <p class="text-zinc-400">本地音乐自动匹配在线歌词，支持多种歌词格式</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Tech Stack -->
    <section class="min-h-screen px-8 py-20">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-4xl font-bold mb-12">技术栈</h2>
            <div class="flex flex-wrap justify-center gap-4">
                <span class="px-6 py-3 bg-zinc-900 rounded-full border border-zinc-800">React 19</span>
                <span class="px-6 py-3 bg-zinc-900 rounded-full border border-zinc-800">Three.js</span>
                <span class="px-6 py-3 bg-zinc-900 rounded-full border border-zinc-800">Framer Motion</span>
                <span class="px-6 py-3 bg-zinc-900 rounded-full border border-zinc-800">Electron</span>
                <span class="px-6 py-3 bg-zinc-900 rounded-full border border-zinc-800">TypeScript</span>
                <span class="px-6 py-3 bg-zinc-900 rounded-full border border-zinc-800">Tailwind CSS</span>
            </div>
        </div>
    </section>

    <!-- CTA -->
    <section class="min-h-screen flex items-center justify-center px-8">
        <div class="max-w-2xl text-center">
            <h2 class="text-5xl font-bold mb-8">开始你的沉浸式音乐之旅</h2>
            <div class="flex gap-4 justify-center">
                <a href="https://github.com/chthollyphile/folia-major" class="px-8 py-4 bg-white text-black rounded-full hover:bg-zinc-200">GitHub</a>
                <a href="https://your-vercel-url.vercel.app" class="px-8 py-4 border border-white rounded-full hover:bg-white/10">在线体验</a>
            </div>
        </div>
    </section>
</body>
</html>
```

#### 选项 B: 使用现有文档站点

- 已有网站：https://folia-site.vercel.app/guide/
- 建议：在首页添加 Hackathon 专属横幅，嵌入演示视频

---

## 🎯 提交前检查清单

### 代码质量
- [ ] 运行 `npm run lint` 确保无 TypeScript 错误
- [ ] 运行 `npm run build` 确保构建成功
- [ ] 测试关键功能路径（搜索 → 播放 → 主题切换）

### 部署验证
- [ ] Vercel 部署成功，可公开访问
- [ ] 桌面端打包完成（至少一个平台）
- [ ] 演示视频上传到视频平台（YouTube/Bilibili）

### 文档完善
- [ ] README.md 更新为新名称（如选择更名）
- [ ] 添加 Hackathon 专属说明
- [ ] 确保安装说明清晰

### 视觉优化（时间允许的情况下）
- [ ] 实施至少 3 个高优先级 UI 改进
- [ ] 统一主题色板
- [ ] 优化关键页面的视觉层次

---

## 📊 竞争优势总结

### 技术创新
1. **WebGL/Three.js 3D 舞台** - 超越传统 2D 音乐播放器
2. **AI 主题生成** - 情绪感知的智能配色
3. **多源整合** - 在线 + 本地 + Now Playing

### 用户体验
1. **沉浸式设计** - 不仅仅是播放音乐，而是视听盛宴
2. **跨平台** - 一套代码，桌面 + Web + PWA
3. **高度可定制** - 6+ 主题，自定义调色板

### 社区与开源
1. **21+ 贡献者** - 活跃的开源社区
2. **AGPL-3.0** - 完全开源，可审计
3. **详尽文档** - 技术说明 + 使用指南

---

## 💡 Pitch 演讲要点（如有展示环节）

### 30秒 Elevator Pitch
"我们正在重新定义听音乐的方式。[Lyra] 不仅仅是一个音乐播放器——它是一个沉浸式的视听平台。通过 AI 驱动的主题生成、3D 交互舞台和智能歌词匹配，我们将每一首歌变成一场视觉盛宴。跨平台、开源、由社区驱动。"

### 核心信息
1. **问题**：传统音乐播放器缺乏视觉沉浸感，千篇一律
2. **解决方案**：AI + 3D + 多主题的沉浸式体验
3. **市场**：音乐发烧友、视觉艺术爱好者、开发者社区
4. **牵引力**：已有 21+ 贡献者，GitHub 关注度持续增长
5. **下一步**：移动端原生应用、云同步、社交功能

---

## 📅 时间规划建议

### Day 1-2: 视觉优化与 Bug 修复
- 实施高优先级 UI 改进
- 修复已知问题
- 性能优化

### Day 3-4: 部署与视频制作
- Vercel 部署调试
- 录制演示视频
- 剪辑与配音

### Day 5: 文档与提交
- 完善 README
- 创建展示页面
- 准备 Pitch（如需要）
- 最终提交

---

## 🚀 成功标准

### 必须达成（Must Have）
- ✅ 可访问的 Web 版本
- ✅ 3分钟演示视频
- ✅ 核心功能无明显 Bug

### 期望达成（Should Have）
- ✅ 至少 3 个 UI 改进落地
- ✅ 桌面端打包完成
- ✅ 专业的产品展示页

### 锦上添花（Nice to Have）
- ⭐ 重命名并更新品牌
- ⭐ 移动端适配优化
- ⭐ 性能指标达到 90+ (Lighthouse)

---

**祝你在 Hackathon 中取得好成绩！🎉**
