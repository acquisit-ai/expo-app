# Video Gestures Feature

独立的视频手势识别和处理功能模块，专门负责视频播放器的手势交互逻辑。

## 特性

- ✅ **独立模块**：完全解耦，可复用于任何视频组件
- ✅ **多种手势**：单击、双击、长按、滑动等
- ✅ **智能区域**：左右双击区域自动识别
- ✅ **触觉反馈**：支持 Haptic 触觉反馈
- ✅ **视觉反馈**：可自定义的动画反馈效果
- ✅ **屏幕适配**：自动适配不同屏幕密度
- ✅ **配置化**：灵活的手势参数配置
- ✅ **TypeScript**：完整的类型支持

## 快速开始

### 基础用法

```typescript
import { useVideoGestures, GestureFeedback } from '@/features/video-gestures';

function VideoPlayer() {
  const { gestureHandler, feedbackState } = useVideoGestures({
    callbacks: {
      onSingleTap: () => togglePlay(),
      onDoubleTapLeft: () => seek(currentTime - 5),
      onDoubleTapRight: () => seek(currentTime + 5),
      onLongPress: () => openSettings(),
    },
  });

  return (
    <View>
      <GestureDetector gesture={gestureHandler}>
        <VideoView />
      </GestureDetector>
      <GestureFeedback feedbackState={feedbackState} />
    </View>
  );
}
```

### 高级配置

```typescript
const { gestureHandler, feedbackState, controls } = useVideoGestures({
  callbacks: {
    onSingleTap: handlePlay,
    onDoubleTapLeft: handleSeekBackward,
    onDoubleTapRight: handleSeekForward,
    onLongPress: handleSettings,
  },
  config: {
    recognition: {
      singleTapDelay: 100,
      doubleTapMaxDelay: 250,
      longPressMinDuration: 500,
      maxMovement: 20,
    },
    zones: {
      leftZoneRatio: 0.3,
      rightZoneRatio: 0.3,
      centerDeadZone: 0.4,
    },
    feedback: {
      haptic: true,
      visual: true,
      animationDuration: 150,
    },
    debug: {
      logging: __DEV__,
      showZones: false,
    },
  },
});

// 动态控制
useEffect(() => {
  if (isPlayerReady) {
    controls.enable();
  } else {
    controls.disable();
  }
}, [isPlayerReady]);
```

## 从旧版本迁移

### 对于 video-control-overlay 用户

当前已自动使用适配器，无需修改代码：

```typescript
// 自动使用新的手势系统，保持接口兼容
const { tapGesture, seekFeedbackTrigger } = useGestureAdapter({
  displayMode,
  playerInstance,
  togglePlay,
  showControls,
  // ... 其他参数
});
```

### 直接使用新模块

如果要直接使用新的手势模块：

```typescript
// 旧版本
import { useOverlayGesture } from '@/features/video-control-overlay';

// 新版本
import { useVideoGestures } from '@/features/video-gestures';
```

## API 文档

### useVideoGestures

主要的手势处理 Hook。

#### 参数

```typescript
interface UseVideoGesturesOptions {
  callbacks: VideoGestureCallbacks;
  config?: VideoGestureConfig;
  screenContext?: ScreenContext;
  enabled?: boolean;
}
```

#### 返回值

```typescript
interface UseVideoGesturesReturn {
  gestureHandler: GestureType;
  feedbackState: GestureFeedbackState;
  controls: GestureControls;
  currentGesture: GestureEvent | null;
}
```

### 手势类型

- `SINGLE_TAP` - 单击
- `DOUBLE_TAP_LEFT` - 左侧双击
- `DOUBLE_TAP_RIGHT` - 右侧双击
- `LONG_PRESS` - 长按
- `SWIPE_LEFT/RIGHT/UP/DOWN` - 滑动（未来版本）

### 配置选项

- `recognition` - 手势识别参数
- `zones` - 区域配置（左右双击区域）
- `feedback` - 反馈配置（触觉、视觉）
- `debug` - 调试配置

## 架构关系

### FSD 层级定位

`video-gestures` 是一个**基础 feature**，专注于视频手势识别和处理：

```
features/video-control-overlay/     (组合型 feature)
├── → video-gestures/               (✅ 被单向依赖)
├── → video-core-controls/          (✅ 被单向依赖)
└── → entities/video/               (✅ 向下依赖)

features/video-gestures/            (基础 feature)
└── → shared/                       (✅ 向下依赖)
```

### 组合使用模式

`video-gestures` 被 `video-control-overlay` 作为组合型 feature 使用：

```typescript
// video-control-overlay 中的集成
import { useVideoGestures } from '@/features/video-gestures';

// 通过 useGestureIntegration Hook 进行功能组合
const { tapGesture, seekFeedbackTrigger } = useGestureIntegration({
  displayMode,
  playerInstance,
  togglePlay,
  // ...其他参数
});
```

### 依赖约束

✅ **允许的依赖**：
- `video-control-overlay` → `video-gestures`
- `widgets/*` → `video-gestures`

❌ **禁止的依赖**：
- `video-gestures` → `video-control-overlay`
- 其他 features → `video-gestures` (除非明确需要)

### 设计原则

1. **独立性** 🔒
   - 可以独立使用，不依赖 `video-control-overlay`
   - 拥有完整的 API 和功能集
   - 不知道上层组合 feature 的存在

2. **可组合性** 🧩
   - 提供清晰的接口供上层组合
   - 通过回调函数实现控制反转
   - 支持灵活的配置选项

## 架构优势

1. **解耦设计**：手势识别与业务逻辑完全分离
2. **控制反转**：通过回调函数实现，业务逻辑由调用方控制
3. **高度配置化**：所有参数都可以自定义
4. **性能优化**：使用 Worklet 实现纯 UI 线程手势处理
5. **内存安全**：完善的生命周期管理和清理
6. **组合友好**：易于被其他 features 集成和复用

## 开发指南

### 添加新手势

1. 在 `GestureType` 枚举中添加新类型
2. 在 `VideoGestureCallbacks` 接口中添加回调
3. 创建对应的手势 Hook
4. 在 `useVideoGestures` 中整合

### 自定义反馈

```typescript
<GestureFeedback
  feedbackState={feedbackState}
  renderSeekFeedback={(isForward, seconds) => (
    <CustomSeekFeedback isForward={isForward} seconds={seconds} />
  )}
  renderTapFeedback={() => <CustomTapFeedback />}
/>
```

## 故障排除

### 手势不响应

1. 检查 `enabled` 属性是否为 `true`
2. 确认 `GestureDetector` 正确包装了目标组件
3. 验证回调函数是否正确传入

### 性能问题

1. 避免在回调函数中进行耗时操作
2. 使用 `useCallback` 包装回调函数
3. 考虑使用防抖来限制手势频率

### 兼容性

- React Native >= 0.70
- react-native-reanimated >= 3.0
- react-native-gesture-handler >= 2.0