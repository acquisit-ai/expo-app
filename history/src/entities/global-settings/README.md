# Global Settings Entity

## 📋 概述

全局设置实体（Global Settings Entity）负责管理应用级别的配置，这些配置**独立于具体的视频会话**，在整个应用生命周期中保持一致。

### 核心职责

- ✅ **存储**全局配置（播放器设置、UI 显示设置）
- ✅ **提供**配置查询接口
- ✅ **响应**配置修改请求
- ❌ **不负责**配置的应用（由使用方负责）

---

## 🏗️ 架构设计

### 设计原则

1. **配置层独立性**
   - 只负责配置存储，不知道配置如何被使用
   - 不依赖任何业务实体（video, player-pool 等）

2. **单向依赖**
   ```
   业务层 (video, features) → global-settings
   ```

3. **单一职责**
   - 配置存储 ≠ 配置应用
   - 提供数据 ≠ 使用数据

---

## 📊 状态结构

### PlayerInstanceSettings（播放器实例设置）

这些设置需要应用到每个播放器实例：

```typescript
interface PlayerInstanceSettings {
  playbackRate: number;                           // 播放速率 [0.25, 4]
  isMuted: boolean;                               // 静音状态
  staysActiveInBackground: boolean;               // 后台继续播放
  startsPictureInPictureAutomatically: boolean;   // 画中画自动启动
}
```

**默认值：**
```typescript
{
  playbackRate: 1.0,
  isMuted: false,
  staysActiveInBackground: false,
  startsPictureInPictureAutomatically: false,
}
```

---

### UIDisplaySettings（UI 显示设置）

这些设置只影响 UI 渲染：

```typescript
interface UIDisplaySettings {
  showSubtitles: boolean;      // 显示字幕
  showTranslation: boolean;    // 显示翻译
}
```

**默认值：**
```typescript
{
  showSubtitles: true,
  showTranslation: false,
}
```

---

## 🔧 使用方法

### 1. 读取设置

```typescript
import { useGlobalSettings, selectPlaybackRate, selectIsMuted } from '@/entities/global-settings';

function MyComponent() {
  // 细粒度订阅（推荐）
  const playbackRate = useGlobalSettings(selectPlaybackRate);
  const isMuted = useGlobalSettings(selectIsMuted);

  // 或订阅整个对象
  const playerSettings = useGlobalSettings(selectPlayerInstanceSettings);

  return (
    <Text>
      播放速率: {playbackRate}x,
      静音: {isMuted ? '是' : '否'}
    </Text>
  );
}
```

---

### 2. 修改设置

```typescript
import {
  useGlobalSettings,
  selectUpdatePlayerInstanceSettings,
  selectUpdateUIDisplaySettings
} from '@/entities/global-settings';

function PlaybackSettingsModal() {
  const updatePlayerSettings = useGlobalSettings(selectUpdatePlayerInstanceSettings);
  const updateUISettings = useGlobalSettings(selectUpdateUIDisplaySettings);

  const handleSpeedChange = (rate: number) => {
    // ✅ 修改播放器设置
    updatePlayerSettings({ playbackRate: rate });
  };

  const toggleSubtitles = () => {
    // ✅ 修改 UI 设置
    updateUISettings({ showSubtitles: !showSubtitles });
  };

  return (
    <View>
      <Button onPress={() => handleSpeedChange(2)}>2x 速度</Button>
      <Button onPress={toggleSubtitles}>切换字幕</Button>
    </View>
  );
}
```

---

### 3. 应用设置到播放器（Video Entity 的职责）

```typescript
// @/entities/video/hooks/player-control/useApplyGlobalSettings.ts
import { useGlobalSettings, selectPlayerInstanceSettings } from '@/entities/global-settings';

export const useApplyGlobalSettings = (player: VideoPlayer | null) => {
  const settings = useGlobalSettings(selectPlayerInstanceSettings);

  useEffect(() => {
    if (!player) return;

    // ✅ video entity 负责应用配置
    player.playbackRate = settings.playbackRate;
    player.muted = settings.isMuted;
    player.staysActiveInBackground = settings.staysActiveInBackground;
  }, [player, settings.playbackRate, settings.isMuted, settings.staysActiveInBackground]);
};
```

**在 Feature 层使用：**
```typescript
// @/features/video-player/ui/FullscreenVideoPlayer.tsx
import { useApplyGlobalSettings } from '@/entities/video';

export const FullscreenVideoPlayer = ({ playerInstance }) => {
  // ✅ 自动应用全局设置
  useApplyGlobalSettings(playerInstance);

  // ...
};
```

---

## 📂 文件结构

```
src/entities/global-settings/
├── model/
│   ├── types.ts          # 类型定义
│   ├── store.ts          # Zustand store
│   ├── selectors.ts      # 选择器函数
│   └── defaults.ts       # 默认值
├── index.ts              # 统一导出
└── README.md             # 本文档
```

---

## 🔌 导出的 API

### 类型

```typescript
export type {
  PlayerInstanceSettings,
  UIDisplaySettings,
  GlobalSettingsState,
  GlobalSettingsActions,
  GlobalSettingsStore,
}
```

### Store Hook

```typescript
export { useGlobalSettings }
```

### Selectors

**播放器设置：**
```typescript
export {
  selectPlayerInstanceSettings,      // 整个对象
  selectPlaybackRate,                 // 播放速率
  selectIsMuted,                      // 静音状态
  selectStaysActiveInBackground,      // 后台播放
  selectStartsPictureInPictureAutomatically, // 画中画
}
```

**UI 设置：**
```typescript
export {
  selectUIDisplaySettings,            // 整个对象
  selectShowSubtitles,                // 显示字幕
  selectShowTranslation,              // 显示翻译
}
```

**Actions：**
```typescript
export {
  selectUpdatePlayerInstanceSettings, // 更新播放器设置
  selectUpdateUIDisplaySettings,      // 更新 UI 设置
  selectResetToDefaults,              // 重置为默认值
}
```

### 默认值

```typescript
export {
  DEFAULT_PLAYER_INSTANCE_SETTINGS,
  DEFAULT_UI_DISPLAY_SETTINGS,
}
```

---

## 🎯 使用场景

### 场景 1: 设置页面

用户修改全局偏好设置。

```typescript
import {
  useGlobalSettings,
  selectPlaybackRate,
  selectIsMuted,
  selectUpdatePlayerInstanceSettings
} from '@/entities/global-settings';

function SettingsScreen() {
  const playbackRate = useGlobalSettings(selectPlaybackRate);
  const isMuted = useGlobalSettings(selectIsMuted);
  const updateSettings = useGlobalSettings(selectUpdatePlayerInstanceSettings);

  return (
    <View>
      <Text>播放速度：{playbackRate}x</Text>
      <Slider
        value={playbackRate}
        onValueChange={(rate) => updateSettings({ playbackRate: rate })}
        minimumValue={0.5}
        maximumValue={2}
      />

      <Switch
        value={isMuted}
        onValueChange={(value) => updateSettings({ isMuted: value })}
      />
    </View>
  );
}
```

---

### 场景 2: 视频播放页面

自动应用全局设置到播放器。

```typescript
import { useApplyGlobalSettings } from '@/entities/video';

function VideoPlayer({ playerInstance }) {
  // ✅ 自动监听设置变化并应用
  useApplyGlobalSettings(playerInstance);

  return <VideoView player={playerInstance} />;
}
```

---

### 场景 3: 字幕显示

根据全局设置显示/隐藏字幕。

```typescript
import { useGlobalSettings, selectShowSubtitles } from '@/entities/global-settings';

function SubtitleDisplay() {
  const showSubtitles = useGlobalSettings(selectShowSubtitles);

  if (!showSubtitles) return null;

  return <Text>{currentSubtitle}</Text>;
}
```

---

## ⚠️ 注意事项

### 1. 不要在 global-settings 中应用配置

**❌ 错误示例：**
```typescript
// global-settings/store.ts
updatePlayerInstanceSettings: (updates) => {
  set({ ...updates });

  // ❌ 不要这样做！
  const currentPlayer = getPlayerSomehow();
  currentPlayer.playbackRate = updates.playbackRate;
}
```

**✅ 正确做法：**
```typescript
// global-settings/store.ts
updatePlayerInstanceSettings: (updates) => {
  set({ ...updates });
  // ✅ 只负责存储
}

// video/hooks/useApplyGlobalSettings.ts
useEffect(() => {
  if (!player) return;
  // ✅ 由使用方负责应用
  player.playbackRate = settings.playbackRate;
}, [player, settings]);
```

---

### 2. startsPictureInPictureAutomatically 的特殊性

这个属性不是 `VideoPlayer` 的属性，而是 `VideoView` 组件的 prop：

```typescript
// ❌ 不能这样
player.startsPictureInPictureAutomatically = true;

// ✅ 应该这样
const startsPip = useGlobalSettings(selectStartsPictureInPictureAutomatically);

<VideoView
  player={player}
  startsPictureInPictureAutomatically={startsPip}
/>
```

---

### 3. 细粒度订阅优化性能

**❌ 订阅整个对象（不推荐）：**
```typescript
const settings = useGlobalSettings(state => state.playerInstance);
// 任何字段变化都会导致组件重新渲染
```

**✅ 细粒度订阅（推荐）：**
```typescript
const playbackRate = useGlobalSettings(selectPlaybackRate);
// 只有 playbackRate 变化才重新渲染
```

---

## 🔄 数据流示意图

### 修改设置流程

```
用户操作 (UI)
    ↓
updatePlayerInstanceSettings({ playbackRate: 2 })
    ↓
global-settings store 更新
    ↓
订阅组件重新渲染
    ↓
useApplyGlobalSettings 的 useEffect 触发
    ↓
player.playbackRate = 2
    ↓
播放速度改变 ✨
```

### 进入新视频流程

```
进入视频
    ↓
playerPoolManager.acquire(videoMetadata)
    ↓
FullscreenVideoPlayer 加载
    ↓
useApplyGlobalSettings(playerInstance) 执行
    ↓
useEffect 触发 (player: null → instance)
    ↓
应用全局设置到 player
    ↓
播放器配置完成 ✨
```

---

## 🎯 与 video entity 的区别

| 维度 | global-settings | video entity |
|------|----------------|--------------|
| **范围** | 全局，跨视频 | 当前视频会话 |
| **生命周期** | 整个 app | 单个视频播放 |
| **示例** | 播放速率、静音 | isPlaying, currentTime |
| **持久化** | ❌ 内存存储 | ❌ 运行时状态 |
| **职责** | 配置存储 | 播放状态管理 |

---

## 🧪 测试示例

### 单元测试

```typescript
import { useGlobalSettings, DEFAULT_PLAYER_INSTANCE_SETTINGS } from '@/entities/global-settings';

describe('GlobalSettings Store', () => {
  beforeEach(() => {
    useGlobalSettings.getState().resetToDefaults();
  });

  it('should update playback rate', () => {
    const { updatePlayerInstanceSettings } = useGlobalSettings.getState();

    updatePlayerInstanceSettings({ playbackRate: 2 });

    expect(useGlobalSettings.getState().playerInstance.playbackRate).toBe(2);
  });

  it('should update UI settings independently', () => {
    const { updateUIDisplaySettings } = useGlobalSettings.getState();

    updateUIDisplaySettings({ showSubtitles: false });

    expect(useGlobalSettings.getState().uiDisplay.showSubtitles).toBe(false);
  });
});
```

---

## 🚀 最佳实践

### 1. 使用细粒度 Selectors

```typescript
// ✅ 推荐
const playbackRate = useGlobalSettings(selectPlaybackRate);
const isMuted = useGlobalSettings(selectIsMuted);

// ❌ 不推荐
const { playbackRate, isMuted } = useGlobalSettings(state => state.playerInstance);
```

### 2. 合并相关更新

```typescript
// ✅ 推荐：一次更新多个字段
updatePlayerInstanceSettings({
  playbackRate: 2,
  isMuted: true,
});

// ❌ 不推荐：多次单独更新
updatePlayerInstanceSettings({ playbackRate: 2 });
updatePlayerInstanceSettings({ isMuted: true });
```

### 3. 类型安全

```typescript
import type { PlayerInstanceSettings } from '@/entities/global-settings';

const handleSettingsChange = (updates: Partial<PlayerInstanceSettings>) => {
  updatePlayerInstanceSettings(updates);
};
```

---

## 📚 相关文档

- [重构总结](../../../docs/decoupling-refactor-summary.md)
- [正确性分析](../../../docs/decoupling-correctness-analysis.md)
- [为什么会有反向依赖](../../../docs/why-reverse-dependency.md)
- [耦合分析](../../../docs/coupling-analysis-global-settings-video.md)

---

## 🎓 设计思想

### 为什么 global-settings 不应用配置？

**核心原则：配置层不应该知道如何使用配置**

```
❌ 错误认知：
  配置层应该"帮助"业务层应用配置

✅ 正确认知：
  配置层只提供数据，业务层自己决定如何使用
```

**好处：**
1. **单向依赖**：业务层 → 配置层
2. **职责清晰**：配置存储 vs 配置应用
3. **易于测试**：配置层独立可测
4. **灵活性高**：不同业务可以有不同的应用策略

---

## 💡 常见问题

### Q1: 为什么不直接在 store 中应用设置到播放器？

**A:** 这会导致反向依赖和职责混乱：
- global-settings 需要知道当前播放器在哪里
- 配置层依赖业务层（违反依赖倒置原则）
- 测试困难（需要 mock video entity）

### Q2: 设置修改后何时生效？

**A:** 通过 `useApplyGlobalSettings` hook 自动生效：
- 设置变化 → useEffect 触发 → 应用到播放器
- 时间：< 16ms（一帧内）
- 用户体验：立即感知

### Q3: 如果没有当前播放器，设置会丢失吗？

**A:** 不会！设置存储在 global-settings store 中：
- 修改时：更新 store
- 下次有播放器时：自动应用

### Q4: 如何添加新的全局设置？

**步骤：**
1. 在 `types.ts` 中添加字段
2. 在 `defaults.ts` 中添加默认值
3. 在 `selectors.ts` 中添加 selector
4. 在使用方应用配置（如果需要）

---

## ✅ 检查清单

使用 global-settings 时，确保：

- [ ] 只在 global-settings 中**存储**配置，不**应用**配置
- [ ] 使用细粒度 selectors 优化性能
- [ ] 在业务层（video, features）应用配置
- [ ] 保持单向依赖：业务层 → global-settings
- [ ] 编写单元测试验证配置存储
- [ ] 编写集成测试验证配置应用

---

**版本：** 2.0.0（Video 主动监听架构）
**最后更新：** 2025-01-04
**维护者：** Video Team
