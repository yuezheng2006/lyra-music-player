# ADR-0005: 主视觉氛围的分层架构

## 状态
已接受

## 背景
主视觉氛围（Ambient Visual）需要：
- 根据节奏实时变化
- 根据情绪切换风格
- 混合多种视觉效果（抽象几何、具象元素、数据可视化）
- 与互动角色独立，互不干扰
- 保证性能，不影响音频播放和角色渲染

技术挑战：
- 如何组织多种视觉效果？
- 如何在不同风格间切换？
- 如何保证性能？

## 决策
采用**分层架构 + 策略模式**：

### 层次结构
```
Canvas/WebGL场景
├── Background Layer（背景层）
│   └── 静态或慢速变化的背景（颜色渐变、纹理）
├── Ambient Layer（氛围层）- 核心
│   ├── Visual Strategy（视觉策略 - 可切换）
│   │   ├── ParticleStrategy（粒子效果）
│   │   ├── WaveStrategy（波浪/涟漪效果）
│   │   ├── GeometryStrategy（几何图形）
│   │   ├── WeatherStrategy（天气效果：雨、雪等）
│   │   └── ...（未来扩展）
│   └── Rhythm Reactor（节奏反应器）
│       └── 监听节拍点，触发视觉事件
└── Character Layer（角色层）
    └── Interactive Character（3D角色独立渲染）
```

### 策略切换规则
根据**情绪引擎**输出的情绪标签，选择视觉策略：
- **快乐/激昂** → ParticleStrategy（上升粒子、爆炸效果）
- **悲伤/舒缓** → WaveStrategy（平缓波浪、涟漪）
- **神秘/黑暗** → GeometryStrategy（低多边形、暗色调）
- **治愈/清新** → WeatherStrategy（樱花、雨滴）

情绪切换时，策略淡入淡出（Fade transition），避免突兀。

### 节奏同步机制
- **Rhythm Reactor**订阅预分析数据（ADR-0001）
- 在节拍点触发事件：`onBeat`, `onBar`, `onPhrase`
- 当前激活的Visual Strategy响应事件：
  - `onBeat`：小幅度变化（粒子脉冲、波浪抖动）
  - `onBar`：中幅度变化（颜色闪烁、图形变形）
  - `onPhrase`：大幅度变化（场景切换、特效爆发）

## 理由
1. **模块化**：每种视觉效果独立封装为策略，易于开发和测试
2. **扩展性**：新增视觉效果只需实现新策略，不影响现有代码
3. **性能可控**：
   - 同时只激活一个策略，避免渲染负担
   - 策略内部可根据设备性能调整细节等级
4. **情绪表达清晰**：每种情绪对应明确的视觉风格，用户感知直观
5. **与角色解耦**：角色层独立，主视觉和角色可并行开发

## 实现细节

### Visual Strategy接口
```typescript
interface VisualStrategy {
  name: string;
  init(scene: THREE.Scene): void;
  onBeat(energy: number): void;        // 节拍点回调
  onBar(energy: number): void;         // 小节回调
  onPhrase(energy: number): void;      // 乐句回调
  update(deltaTime: number): void;     // 每帧更新
  dispose(): void;                     // 清理资源
}
```

### 性能优化策略
- **LOD（细节层次）**：根据设备性能调整粒子数量、几何体复杂度
- **对象池**：粒子、几何体复用，避免频繁创建/销毁
- **预加载**：策略资源（纹理、模型）在空闲时预加载
- **帧率监控**：检测帧率下降时自动降级效果

## 后果
- **正面**：
  - 架构清晰，易于维护和扩展
  - 视觉效果与音乐深度结合
  - 性能可控，支持多种设备
- **负面**：
  - 初期需要实现多个策略，开发量大
  - 策略切换的过渡动画需要精细调优
- **技术债**：
  - 需要建立策略库和测试工具
  - 需要设计策略选择逻辑（情绪到策略的映射）

## MVP范围
第一版实现3个核心策略：
1. **ParticleStrategy**（粒子效果）- 覆盖快乐/激昂情绪
2. **WaveStrategy**（波浪效果）- 覆盖悲伤/舒缓情绪
3. **GeometryStrategy**（几何效果）- 作为默认/中性效果

其他策略作为TODO，后续迭代加入。

## 相关决策
- 与预分析节奏检测（ADR-0001）配合，使用节拍点数据
- 与情绪引擎（ADR-0002）配合，根据情绪选择策略
- 与3D角色（ADR-0003）独立渲染，避免相互干扰
