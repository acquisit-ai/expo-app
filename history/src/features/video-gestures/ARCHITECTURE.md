# Video Gestures Feature - 架构说明

## 🏗️ 架构原则

### ✅ 正确的使用方式

`video-gestures` 是一个**独立的功能模块**，应该在**更高层级**（widgets/pages）中与其他 features 组合使用：

```typescript
// ✅ 正确：在 widget 或 page 层组合
function VideoPlayerWidget() {
  // 独立使用手势功能
  const { gestureHandler, feedbackState } = useVideoGestures({
    callbacks: {
      onSingleTap: () => togglePlay(),
      onDoubleTapLeft: () => seek(currentTime - 5),
      onDoubleTapRight: () => seek(currentTime + 5),
    }
  });

  // 独立使用控件功能
  const { showControls } = useVideoControlsVisibility();

  return (
    <View>
      <GestureDetector gesture={gestureHandler}>
        <VideoPlayer />
      </GestureDetector>
      <VideoControls />
      <GestureFeedback feedbackState={feedbackState} />
    </View>
  );
}
```

### ❌ 错误的使用方式

**Feature 之间不应该直接依赖**：

```typescript
// ❌ 错误：feature 内部直接导入其他 feature
// src/features/video-control-overlay/hooks/useGestureAdapter.ts
import { useVideoGestures } from '@/features/video-gestures'; // 违反FSD原则
```

## 📁 FSD 架构层级关系

```
pages/          ← 可以导入和组合多个 features
widgets/        ← 可以导入和组合多个 features
features/       ← 只能导入 entities、shared，不能导入其他 features
  ├── video-gestures/          ← 独立手势功能
  ├── video-control-overlay/   ← 独立控件功能
  └── video-player/            ← 独立播放器功能
entities/       ← 业务实体，可被 features 使用
shared/         ← 共享工具，可被所有层使用
```

## 🔄 正确的集成方案

### 方案1: Widget 层组合（推荐）

创建一个 widget 来组合手势和控件功能：

```typescript
// src/widgets/video-player-with-gestures/ui/VideoPlayerWidget.tsx
import { useVideoGestures } from '@/features/video-gestures';
import { VideoControlsOverlay } from '@/features/video-control-overlay';
import { useVideoPlayer } from '@/entities/video';

export const VideoPlayerWidget = () => {
  const { togglePlay, seek, currentTime } = useVideoPlayer();

  const { gestureHandler, feedbackState } = useVideoGestures({
    callbacks: {
      onSingleTap: togglePlay,
      onDoubleTapLeft: () => seek(currentTime - 5),
      onDoubleTapRight: () => seek(currentTime + 5),
    }
  });

  return (
    <View>
      <GestureDetector gesture={gestureHandler}>
        <VideoPlayer />
      </GestureDetector>
      <VideoControlsOverlay />
      <GestureFeedback feedbackState={feedbackState} />
    </View>
  );
};
```

### 方案2: Shared 层提升

将通用手势功能提升到 shared 层：

```typescript
// src/shared/lib/gestures/
export { useVideoGestures } from './video-gestures';
export { GestureFeedback } from './components';
```

### 方案3: Entity 层中介

通过 entities 层提供统一的视频交互接口：

```typescript
// src/entities/video/lib/useVideoInteraction.ts
export function useVideoInteraction() {
  // 集成手势、控件、播放器功能
  // features 通过这个统一接口使用
}
```

## 🚫 反模式警告

1. **Feature 直接依赖**：features 之间不能直接 import
2. **适配器模式误用**：不要在 feature 内部创建适配器来调用其他 feature
3. **循环依赖**：避免 A feature 依赖 B feature，B 又依赖 A

## 📋 迁移检查清单

- [ ] 删除 feature 间的直接依赖
- [ ] 在 widget/page 层进行功能组合
- [ ] 确保每个 feature 保持独立性
- [ ] 验证没有循环依赖
- [ ] 更新文档和示例

## 🎯 目标架构

最终目标是每个 feature 都完全独立，可以：
- 单独测试
- 单独复用
- 独立演进
- 清晰的职责边界

通过在更高层级进行组合，实现功能的灵活组装和复用。