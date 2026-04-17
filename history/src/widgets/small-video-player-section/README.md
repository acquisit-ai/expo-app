# 小屏视频播放器区域 (Small Video Player Section)

## 概述

小屏视频播放器区域是一个复杂的 Widget 组件，专门为小屏嵌入式视频播放场景设计。它整合了视频播放、控制界面、交互按钮、字幕显示和高级滚动动画等多个功能模块，提供类似短视频应用的沉浸式播放体验。

## 快速开始

### 基本使用

```typescript
import { SmallVideoPlayerSection } from '@/widgets/small-video-player-section';

function VideoDetailPage() {
  const handleFullscreen = () => {
    // 进入全屏逻辑
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SmallVideoPlayerSection
      playbackMode="small-screen"
      onToggleFullscreen={handleFullscreen}
      onBack={handleBack}
    />
  );
}
```

### 带滚动集成

```typescript
function VideoPageWithScroll() {
  const [scrollHandler, setScrollHandler] = useState(null);

  return (
    <View style={{ flex: 1 }}>
      <SmallVideoPlayerSection
        playbackMode="small-screen"
        onScrollHandler={setScrollHandler}
        onToggleFullscreen={handleFullscreen}
        onBack={handleBack}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* 视频详情内容 */}
        <VideoContentSection />
      </Animated.ScrollView>
    </View>
  );
}
```

## 主要功能

### 1. 视频播放集成

整合完整的视频播放功能：

- **自动配置** - 从 video entity 自动获取当前视频
- **播放器实例** - 管理播放器实例生命周期
- **状态同步** - 播放状态实时同步到 UI

```typescript
// 内部自动处理
const currentVideo = useVideoStore(selectCurrentVideo);
const currentPlayer = useVideoStore(selectPlayerInstance);
```

### 2. 高级滚动动画

#### 播放时行为
- **固定显示** - 播放时视频固定在顶部
- **平滑展开** - 从缩小状态平滑展开到全屏
- **防止跳动** - 智能的滚动偏移管理

```typescript
// 播放时的动画逻辑
if (isPlaying) {
  effectiveScrollY.value = withTiming(0, {
    duration: 300,
    easing: Easing.out(Easing.cubic)
  });
}
```

#### 暂停时行为
- **跟随滚动** - 视频随页面滚动移动
- **自然收缩** - 向下滚动时自然缩小
- **动态高度** - 视频区域高度动态变化

```typescript
// 暂停时的动画逻辑
const handlePausedScroll = (scrollY, scrollOffset, effectiveScrollY) => {
  'worklet';
  const delta = scrollY - scrollOffset.value;
  effectiveScrollY.value = Math.max(0, effectiveScrollY.value + delta);
};
```

### 3. 控制界面组合

#### 顶部控制栏
- **返回按钮** - 带动画的返回导航
- **播放状态指示** - 实时显示播放状态
- **安全区域适配** - 自动适配设备安全区域

#### 视频控制覆盖层
- **小屏模式控件** - 适合嵌入式播放的简化控件
- **手势交互** - 单击、双击、长按手势支持
- **自动隐藏** - 智能的控件自动隐藏

#### 底部交互栏
- **点赞按钮** - 视频点赞功能
- **收藏按钮** - 添加到收藏
- **字幕开关** - 控制字幕显示
- **翻译开关** - 控制翻译显示

### 4. 字幕系统

```typescript
// 小屏模式字幕配置
<IntegratedSubtitleView
  config={{
    enabled: false,              // 小屏默认禁用
    position: 'bottom',
    fontSize: 14,
    showNavigationControls: false,
    enableClickToSeek: false,    // 小屏不支持点击跳转
  }}
/>
```

### 5. 跨 Widget 通信

通过滚动处理器实现 Widget 间协调：

```typescript
// VideoPlayerSection 生成滚动处理器
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    // 处理滚动事件
  }
});

// 传递给父组件
useEffect(() => {
  onScrollHandler?.(scrollHandler);
}, []);

// 父组件应用到 ScrollView
<Animated.ScrollView onScroll={scrollHandler} />
```

## API 文档

### SmallVideoPlayerSection 组件

#### Props

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `playbackMode` | `PlaybackMode` | 是 | 播放模式（'small-screen'） |
| `onToggleFullscreen` | `() => void` | 是 | 全屏切换回调 |
| `onBack` | `() => void` | 是 | 返回导航回调 |
| `onScrollHandler` | `(handler) => void` | 否 | 滚动处理器回调 |

### 动画常量

```typescript
const ANIMATION_PRESETS = {
  // 视频展开动画（播放时）
  videoExpand: {
    duration: 300,
    easing: Easing.out(Easing.cubic)
  },

  // 播放转换动画
  playTransition: {
    duration: 300,
    easing: Easing.out(Easing.exp)
  },

  // 暂停转换动画
  pauseTransition: {
    duration: 200,
    easing: Easing.in(Easing.quad)
  }
};
```

### 布局常量

```typescript
const LAYOUT = {
  VIDEO_HEIGHT: 400,           // 视频播放器高度
  HEADER_HEIGHT: 56,           // 头部控制栏高度
  INTERACTION_BAR_HEIGHT: 48,  // 交互按钮栏高度
};
```

## 使用示例

### 示例 1: 基础视频详情页

```typescript
import { SmallVideoPlayerSection } from '@/widgets/small-video-player-section';
import { VideoContentSection } from '@/widgets/video-content-section';

function VideoDetailPage({ navigation }) {
  const [scrollHandler, setScrollHandler] = useState(null);

  const handleFullscreen = () => {
    navigation.navigate('VideoFullscreen');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SmallVideoPlayerSection
        playbackMode="small-screen"
        onScrollHandler={setScrollHandler}
        onToggleFullscreen={handleFullscreen}
        onBack={handleBack}
      />

      <Animated.ScrollView
        style={{ flex: 1 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <VideoContentSection />
      </Animated.ScrollView>
    </View>
  );
}
```

### 示例 2: 带加载状态

```typescript
function VideoPlayerWithLoading() {
  const currentVideo = useVideoStore(selectCurrentVideo);
  const currentPlayer = useVideoStore(selectPlayerInstance);

  if (!currentVideo || !currentPlayer) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text>加载视频中...</Text>
      </View>
    );
  }

  return (
    <SmallVideoPlayerSection
      playbackMode="small-screen"
      onToggleFullscreen={handleFullscreen}
      onBack={handleBack}
    />
  );
}
```

### 示例 3: 自定义滚动行为

```typescript
function CustomScrollBehavior() {
  const [scrollHandler, setScrollHandler] = useState(null);
  const scrollY = useSharedValue(0);

  // 监听滚动位置
  const handleScroll = useCallback((handler) => {
    setScrollHandler(handler);
  }, []);

  // 使用滚动位置做其他事情
  useAnimatedReaction(
    () => scrollY.value,
    (current, previous) => {
      // 滚动超过 200 时触发某些操作
      if (current > 200 && previous <= 200) {
        runOnJS(onScrollThresholdReached)();
      }
    }
  );

  return (
    <>
      <SmallVideoPlayerSection
        playbackMode="small-screen"
        onScrollHandler={handleScroll}
        onToggleFullscreen={handleFullscreen}
        onBack={handleBack}
      />

      <Animated.ScrollView onScroll={scrollHandler}>
        <VideoContent />
      </Animated.ScrollView>
    </>
  );
}
```

### 示例 4: 带错误处理

```typescript
function SafeVideoPlayer() {
  const currentVideo = useVideoStore(selectCurrentVideo);
  const [error, setError] = useState(null);

  if (error) {
    return (
      <ErrorView
        message="视频加载失败"
        onRetry={() => {
          setError(null);
          // 重新加载视频
        }}
      />
    );
  }

  if (!currentVideo?.meta) {
    return <VideoNotFoundView />;
  }

  return (
    <SmallVideoPlayerSection
      playbackMode="small-screen"
      onToggleFullscreen={handleFullscreen}
      onBack={handleBack}
    />
  );
}
```

## 布局架构

### 层次结构

```
SmallVideoPlayerSection
├─ 固定安全区域（黑色背景）
│  └─ 高度: insets.top
│
├─ 固定头部容器（z-index: 9/11）
│  ├─ HeaderButtonBar
│  │  ├─ 返回按钮
│  │  └─ 播放状态指示器
│  │
│  └─ 动画内容容器
│     ├─ SmallVideoPlayer
│     │  └─ 视频渲染组件
│     │
│     ├─ VideoControlsOverlay（z-index 层次）
│     │  ├─ 手势检测层
│     │  ├─ 视觉反馈层
│     │  ├─ 播放按钮层
│     │  └─ 控件层
│     │
│     ├─ IntegratedSubtitleView
│     │  └─ 字幕显示
│     │
│     └─ VideoInteractionSection
│        ├─ 点赞按钮
│        ├─ 收藏按钮
│        ├─ 字幕开关
│        └─ 翻译开关
```

### 动画层

- **effectiveScrollY** - 有效滚动位置（控制视频变换）
- **playingTransition** - 播放过渡动画（0-1）
- **scrollOffsetRaw** - 原始滚动偏移
- **scrollY** - 实际滚动位置

## 常见问题

### Q: 为什么视频在播放时不能滚动？

A: 这是设计行为。播放时视频固定在顶部，提供沉浸式观看体验。暂停后可以滚动。

### Q: 如何自定义视频高度？

A: 视频高度由 `VIDEO_PLAYER_CONSTANTS.LAYOUT.VIDEO_HEIGHT` 定义。可以通过修改常量调整：

```typescript
// 不建议直接修改，会影响动画计算
// 如需调整，应该在 feature 层定义新的配置
```

### Q: 滚动动画卡顿怎么办？

A: 确保使用正确的配置：

```typescript
<Animated.ScrollView
  onScroll={scrollHandler}
  scrollEventThrottle={16}  // 重要：60fps 更新
  showsVerticalScrollIndicator={false}
>
```

### Q: 如何禁用滚动动画？

A: 不传递 `onScrollHandler` 回调即可：

```typescript
<SmallVideoPlayerSection
  playbackMode="small-screen"
  // 不传递 onScrollHandler
  onToggleFullscreen={handleFullscreen}
  onBack={handleBack}
/>
```

### Q: 字幕为什么不显示？

A: 小屏模式默认禁用字幕。如需启用，可以在组件内部修改配置：

```typescript
// 在 SmallVideoPlayerSection.tsx 中
<IntegratedSubtitleView
  config={{
    enabled: true,  // 改为 true
    // ...其他配置
  }}
/>
```

### Q: 如何添加自定义控件？

A: 通过修改 `VideoInteractionSection` 或创建新的组件：

```typescript
function CustomVideoPlayer() {
  return (
    <View>
      <SmallVideoPlayerSection {...props} />

      {/* 添加自定义浮动按钮 */}
      <View style={styles.customButton}>
        <Button title="自定义" onPress={handleCustomAction} />
      </View>
    </View>
  );
}
```

## 相关功能

- **小屏视频播放器** (`@/features/video-player`) - 视频播放核心
- **视频控制覆盖层** (`@/features/video-control-overlay`) - 控制界面
- **交互栏** (`@/features/detail-interaction-bar`) - 点赞收藏等交互
- **字幕显示** (`@/features/subtitle-display`) - 字幕功能
- **视频实体** (`@/entities/video`) - 状态管理

## 技术特点

### 高级动画模式

- **双模式滚动** - 播放/暂停状态的不同滚动行为
- **SharedValue 稳定性** - 使用 useRef 确保动画值稳定
- **Worklet 计算** - 所有动画逻辑在 UI 线程运行
- **内存安全** - 正确的动画清理

### Widget 组合模式

- **多 Feature 集成** - 无缝整合 4+ features
- **零 Prop Drilling** - 通过 entity 层避免属性传递
- **跨 Widget 通信** - 通过回调实现 Widget 协调
- **清晰的职责** - Widget 只负责组合，不包含业务逻辑

### 性能优化

- **React.memo** - 防止不必要的重渲染
- **useMemo** - 缓存样式计算
- **useCallback** - 稳定的回调引用
- **条件渲染** - 错误状态早返回

### 依赖注入

```typescript
// Widget 层组合字幕导航
const subtitleNavigation = useSubtitleDisplay();

// 注入到控制层
<VideoControlsOverlay
  subtitleNavigation={{
    goToPrevious: subtitleNavigation.actions.goToPrevious,
    goToNext: subtitleNavigation.actions.goToNext,
  }}
/>
```
