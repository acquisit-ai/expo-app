# 播放设置功能 (Playback Settings)

## 概述

播放设置功能提供了一个优雅的底部弹窗界面，用户可以在这里调整视频播放的各种设置，包括播放速度、音量控制、后台播放和画中画模式。该功能采用模态化设计，与视频播放器无缝集成。

## 快速开始

### 基本使用

播放设置模态框通过长按视频控制区域触发：

```typescript
import { useModal } from '@/shared/lib/modal';

function VideoControls() {
  const { openModal } = useModal();

  // 长按触发设置
  const handleLongPress = () => {
    openModal('PlaybackSettingsModal');
  };

  return (
    <GestureDetector gesture={longPressGesture}>
      {/* 视频控制内容 */}
    </GestureDetector>
  );
}
```

### 直接访问播放设置

```typescript
import { useVideoPlayer } from '@/entities/video';

function CustomControls() {
  const {
    playbackRate,
    isMuted,
    setPlaybackRate,
    toggleMute
  } = useVideoPlayer();

  // 设置播放速度为1.5x
  setPlaybackRate(1.5);

  // 切换静音
  toggleMute();
}
```

## 主要功能

### 1. 播放速度调节

提供6档播放速度选择：

- **0.5x** - 慢速播放，适合学习复杂内容
- **0.75x** - 减速播放
- **1x** - 正常速度（默认）
- **1.25x** - 略微加速
- **1.5x** - 快速播放
- **2x** - 两倍速播放

```typescript
// 支持的播放速度类型
type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

// 设置播放速度
const { setPlaybackRate } = useVideoPlayer();
setPlaybackRate(1.5);
```

### 2. 音量控制

简单的静音开关控制：

```typescript
const { isMuted, toggleMute } = useVideoPlayer();

// 查看当前状态
console.log(isMuted); // true 或 false

// 切换静音
toggleMute();
```

### 3. 后台播放

允许应用进入后台时继续播放视频：

```typescript
const {
  staysActiveInBackground,
  toggleBackgroundPlayback
} = useVideoPlayer();

// 启用后台播放
if (!staysActiveInBackground) {
  toggleBackgroundPlayback();
}
```

### 4. 画中画自动启动

配置应用进入后台时是否自动启动画中画模式：

```typescript
const {
  startsPictureInPictureAutomatically,
  togglePictureInPictureAutoStart
} = useVideoPlayer();

// 启用画中画自动启动
togglePictureInPictureAutoStart(true);
```

## API 文档

### PlaybackSettingsModal 组件

模态框组件，自动从 video entity 获取状态。

```typescript
// 通过 modal 系统调用，无需直接使用组件
openModal('PlaybackSettingsModal');
```

### useVideoPlayer Hook

访问播放设置的主要接口。

#### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `playbackRate` | `PlaybackRate` | 当前播放速度 |
| `isMuted` | `boolean` | 是否静音 |
| `staysActiveInBackground` | `boolean` | 是否启用后台播放 |
| `startsPictureInPictureAutomatically` | `boolean` | 是否自动启动画中画 |
| `setPlaybackRate` | `(rate: PlaybackRate) => void` | 设置播放速度 |
| `toggleMute` | `() => void` | 切换静音状态 |
| `toggleBackgroundPlayback` | `() => void` | 切换后台播放 |
| `togglePictureInPictureAutoStart` | `(value: boolean) => void` | 切换画中画自动启动 |

### PlaybackRate 类型

```typescript
export type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
```

限定的播放速度类型，确保类型安全。

## 使用示例

### 示例 1: 创建自定义速度选择器

```typescript
import { useVideoPlayer } from '@/entities/video';
import type { PlaybackRate } from '@/features/playback-settings';

function CustomSpeedSelector() {
  const { playbackRate, setPlaybackRate } = useVideoPlayer();

  const speeds: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <View>
      {speeds.map(speed => (
        <Button
          key={speed}
          selected={playbackRate === speed}
          onPress={() => setPlaybackRate(speed)}
        >
          {speed}x
        </Button>
      ))}
    </View>
  );
}
```

### 示例 2: 智能播放控制

```typescript
import { useVideoPlayer } from '@/entities/video';
import { useEffect } from 'react';

function SmartPlaybackControls() {
  const {
    playbackRate,
    setPlaybackRate,
    isMuted,
    toggleMute
  } = useVideoPlayer();

  // 夜间模式自动降低音量
  useEffect(() => {
    const hour = new Date().getHours();
    const isNightTime = hour >= 22 || hour <= 6;

    if (isNightTime && !isMuted) {
      toggleMute(); // 自动静音
    }
  }, []);

  // 学习模式 - 自动设置慢速播放
  const enableLearningMode = () => {
    if (playbackRate !== 0.75) {
      setPlaybackRate(0.75);
    }
  };

  return (
    <Button onPress={enableLearningMode}>
      学习模式
    </Button>
  );
}
```

### 示例 3: 播放设置持久化

```typescript
import { useVideoPlayer } from '@/entities/video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

function PersistentPlaybackSettings() {
  const {
    playbackRate,
    isMuted,
    setPlaybackRate,
    toggleMute
  } = useVideoPlayer();

  // 加载保存的设置
  useEffect(() => {
    async function loadSettings() {
      const savedRate = await AsyncStorage.getItem('playbackRate');
      const savedMuted = await AsyncStorage.getItem('isMuted');

      if (savedRate) {
        setPlaybackRate(parseFloat(savedRate) as PlaybackRate);
      }
      if (savedMuted === 'true' && !isMuted) {
        toggleMute();
      }
    }
    loadSettings();
  }, []);

  // 保存设置
  useEffect(() => {
    AsyncStorage.setItem('playbackRate', playbackRate.toString());
    AsyncStorage.setItem('isMuted', isMuted.toString());
  }, [playbackRate, isMuted]);

  return null;
}
```

## 交互设计

### 触发方式

- **长按视频区域** - 打开播放设置模态框（需按住 500ms）
- **自动隐藏** - 点击模态框外部或设置完成后自动关闭

### 视觉反馈

- **触觉反馈** - 所有开关操作都有触觉反馈
- **主题适配** - 自动适配亮色/暗色主题
- **分段控制** - 播放速度使用原生分段控制器
- **开关动画** - Switch 组件有流畅的切换动画

### 底部弹窗设计

- **模糊背景** - 使用毛玻璃效果的底部弹窗
- **拖动手柄** - 顶部显示拖动手柄，支持手势关闭
- **图标对齐** - 所有设置项采用统一的图标 + 标签 + 控件布局
- **分隔线** - 设置项之间有细微分隔线

## 常见问题

### Q: 如何在不同页面保持播放设置？

A: 播放设置存储在 video entity 中，自动在整个应用中共享。无需额外处理。

```typescript
// 在任何页面都可以访问相同的设置
const { playbackRate } = useVideoPlayer();
```

### Q: 能否限制某些场景的播放速度？

A: 可以通过包装 `setPlaybackRate` 函数实现：

```typescript
function RestrictedPlaybackControls() {
  const { setPlaybackRate } = useVideoPlayer();

  const setRestrictedRate = (rate: PlaybackRate) => {
    // 学习视频最高只能 1.5x
    if (rate <= 1.5) {
      setPlaybackRate(rate);
    }
  };

  return <SpeedSelector onSelect={setRestrictedRate} />;
}
```

### Q: 如何监听播放设置变化？

A: 使用 `useVideoPlayer` hook 的返回值会自动响应变化：

```typescript
function PlaybackMonitor() {
  const { playbackRate, isMuted } = useVideoPlayer();

  useEffect(() => {
    console.log('播放速度变化:', playbackRate);
  }, [playbackRate]);

  useEffect(() => {
    console.log('静音状态变化:', isMuted);
  }, [isMuted]);

  return null;
}
```

### Q: 播放设置是否影响所有视频？

A: 是的。播放设置是全局的，会应用到当前和后续播放的所有视频。这是有意的设计，让用户可以保持个人偏好。

### Q: 如何恢复默认设置？

A: 调用相应的设置函数设置为默认值：

```typescript
function ResetSettings() {
  const {
    setPlaybackRate,
    toggleMute,
    isMuted
  } = useVideoPlayer();

  const resetToDefaults = () => {
    setPlaybackRate(1);     // 恢复正常速度
    if (isMuted) {          // 取消静音
      toggleMute();
    }
  };

  return (
    <Button onPress={resetToDefaults}>
      恢复默认设置
    </Button>
  );
}
```

## 相关功能

- **视频播放器** (`@/features/video-player`) - 视频播放核心功能
- **视频控制覆盖层** (`@/features/video-control-overlay`) - 触发播放设置的控制界面
- **模态系统** (`@/shared/lib/modal`) - 底部弹窗基础设施
- **视频实体** (`@/entities/video`) - 播放状态管理

## 技术细节

### 架构模式

- **模态化设计** - 使用 BlurModal 实现底部弹窗
- **实体中心** - 直接与 video entity 集成，无需 prop drilling
- **类型安全** - 使用 TypeScript 限定类型确保类型安全
- **触觉集成** - 使用 expo-haptics 提供触觉反馈

### 性能优化

- **回调记忆化** - 使用 `useCallback` 优化回调函数
- **分段控制优化** - 使用防御性编程避免无效索引
- **主题性能** - 高效的主题颜色解析

### 依赖项

```json
{
  "react-native-modalfy": "模态框管理",
  "@react-native-segmented-control/segmented-control": "分段控制器",
  "expo-haptics": "触觉反馈",
  "react-native-paper": "UI组件"
}
```
