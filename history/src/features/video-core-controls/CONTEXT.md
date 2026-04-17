# Video Core Controls Feature - 三层架构文档

*本文档详细说明video-core-controls feature的三层架构设计、组件组成和集成模式*

## 架构概览

video-core-controls是一个**独立的基础feature**，提供完整的视频控制UI组件库。采用三层架构模式，从底层的Context/Foundation到中层的Bar/Controls，再到顶层的Layout组件。

### 三层架构模式

```
┌─────────────────────────────────────────────────────┐
│            第三层：Layout Layer                      │
│  组件：SmallScreenLayout, FullscreenPortraitLayout, │
│        FullscreenLandscapeLayout                    │
│  职责：组合控制栏和控制组件，定义布局结构            │
└─────────────────────────────────────────────────────┘
                        ↓ 使用
┌─────────────────────────────────────────────────────┐
│         第二层：Bar & Controls Layer                │
│  组件：VideoTopBar, VideoBottomBar, PlayButton,    │
│        ProgressBar, TimeDisplay, etc.              │
│  职责：消费Context数据，组合基础组件，处理交互        │
└─────────────────────────────────────────────────────┘
                        ↓ 使用
┌─────────────────────────────────────────────────────┐
│      第一层：Context & Foundation Layer             │
│  组件：VideoCoreControlsProvider, AnimatedButton,  │
│        ControlBar, useVideoTimeSync                │
│  职责：状态管理、时间同步、基础UI、尺寸系统          │
└─────────────────────────────────────────────────────┘
```

## 第一层：Context & Foundation Layer

### 1.1 VideoCoreControlsContext

**核心状态管理Context**，提供完全独立的feature级别状态管理：

**关键特性：**
- 完全独立：不依赖VideoPlayerContext或其他外部Context
- 集成useVideoTimeSync：在Context级别处理时间同步
- 统一接口：通过单一Hook访问所有状态和回调

**Context数据结构：**
```typescript
interface VideoCoreControlsContextValue {
  // 核心时间和播放控制
  displayTime: number;           // Hook处理后的显示时间
  isDragging: boolean;           // 拖拽状态
  isSeeking: boolean;            // seeking状态
  isPlaying: boolean;
  duration: number;
  bufferedTime: number;

  // 进度控制（Hook提供的统一接口）
  progressHandlers: {
    onDragStart: () => void;
    onDragUpdate: (value: number) => void;
    onDragEnd: (value: number) => void;
  };

  // UI配置
  size: ControlSize;
  isFullscreen: boolean;

  // 社交功能
  isLiked?: boolean;
  isFavorited?: boolean;
  onToggleLike?: () => void;
  onToggleFavorite?: () => void;

  // 内容功能
  showSubtitles?: boolean;
  showTranslation?: boolean;
  onToggleSubtitles?: () => void;
  onToggleTranslation?: () => void;
}
```

### 1.2 useVideoTimeSync Hook

**智能时间同步Hook**，解决进度条拖拽时的跳动问题：

**状态机设计：**
```
normal → dragging → seeking → normal
  ↑         ↓          ↓         ↑
  └─────────┴──────────┴─────────┘
```

**关键机制：**
1. **预览时间管理**：拖拽时显示预览时间，不受实际播放时间影响
2. **智能seeking检测**：通过容差（默认0.5秒）判断是否到达目标位置
3. **超时保护**：防止永久seeking状态（默认3秒超时）

**使用示例：**
```typescript
const timeSync = useVideoTimeSync({
  currentTime,
  duration,
  onSeek,
  seekingTolerance: 0.5,
  seekingTimeout: 3000,
});
// 返回：displayTime, isDragging, isSeeking, progressHandlers
```

### 1.3 基础组件

**AnimatedButton**：统一的动画按钮基础组件
- 弹性动画：按下缩放至0.8，释放弹性回弹至1.15再回到1.0
- 旋转效果：轻微旋转(-5°)增强反馈
- worklet优化：使用reanimated的worklet实现60fps动画

**ControlBar**：通用控制栏容器
- 支持top/bottom/floating三种位置
- 渐变背景：基于位置自动选择渐变方向
- 绝对定位：贴边显示，支持自定义内边距

**ControlBarSection / ControlGroup**：布局辅助组件
- 灵活的flex布局支持
- 统一的间距系统（xs/sm/md/lg）

### 1.4 统一尺寸系统

```typescript
CONTROL_DIMENSIONS = {
  BUTTON: {
    small: { width: 32, height: 32, iconSize: 20 },
    medium: { width: 40, height: 40, iconSize: 24 },
    large: { width: 48, height: 48, iconSize: 28 },
  },
  BAR: {
    small: { height: 48, padding: 8 },
    medium: { height: 64, padding: 12 },
    large: { height: 80, padding: 16 },
  },
  PROGRESS: {
    small: { sliderHeight: 4 },
    medium: { sliderHeight: 6 },
    large: { sliderHeight: 8 },
  }
}
```

## 第二层：Bar & Controls Layer

### 2.1 控制栏组件

**VideoTopBar**：顶部控制栏
- 返回按钮（可选）
- 标题显示（可选）
- 设置按钮（可选）
- 自动适配安全区域

**VideoBottomBar**：底部控制栏
- 支持两种布局：horizontal（横向）、portrait-fullscreen（竖屏全屏）
- 组合PlayButton、ProgressBar、TimeDisplay、FullscreenToggle
- 从Context获取所有数据，无需props传递

### 2.2 基础控制组件

**PlayButton**：播放/暂停按钮
- 基于AnimatedButton实现
- 自动切换图标（play/pause）
- 无障碍支持

**ProgressBar**：进度条组件
- 纯UI组件：零业务逻辑，状态由useVideoTimeSync管理
- 使用react-native-awesome-slider
- 支持缓冲显示、拖拽交互
- SharedValue集成：与reanimated动画系统无缝集成

**TimeDisplay**：时间显示组件
- 格式化时间显示（mm:ss或h:mm:ss）
- 支持显示剩余时间
- 自适应字体大小

**FullscreenToggle**：全屏切换按钮
- 自动切换图标（fullscreen/fullscreen-exit）
- 回调通知父组件

**BackButton**：返回按钮
- 可选确认对话框
- 标准化返回交互

## 第三层：Layout Layer

### 3.1 Strategy Pattern架构

三个布局组件实现Strategy Pattern，根据VideoDisplayMode自动选择：

```typescript
const LAYOUT_COMPONENTS = {
  [VideoDisplayMode.SMALL]: SmallScreenLayout,
  [VideoDisplayMode.FULLSCREEN_PORTRAIT]: FullscreenPortraitLayout,
  [VideoDisplayMode.FULLSCREEN_LANDSCAPE]: FullscreenLandscapeLayout,
}
```

### 3.2 SmallScreenLayout

**适用场景：**列表中的视频预览、小窗口播放

**特点：**
- 简化的控件集合
- 紧凑的布局设计
- 基本播放控制
- 无额外间距

**组件组合：**
```tsx
<SmallScreenLayout>
  <VideoTopBar />      // 顶部控制栏
  <VideoBottomBar />   // 底部控制栏（horizontal布局）
</SmallScreenLayout>
```

### 3.3 FullscreenPortraitLayout

**适用场景：**移动端全屏视频播放、短视频应用

**特点：**
- TikTok风格侧边栏
- 增强尺寸控件（large size）
- 社交功能集成（Like、Favorite）
- 内容功能（字幕、翻译）
- 触觉反馈增强

**TikTok风格侧边栏：**
```tsx
// 侧边栏按钮配置
const sideBarButtons = [
  { icon: 'heart', color: '#FF4569', isActive: isLiked },
  { icon: 'star', color: '#FFA500', isActive: isFavorited },
  { icon: 'translate', color: '#00BFFF', isActive: showTranslation },
  { icon: 'subtitles', color: '#00BFFF', isActive: showSubtitles },
]
```

**响应式设计：**
- 按钮尺寸：屏幕宽度的13%
- 垂直间距：屏幕高度的1.5%
- 底部间距：为控制栏预留空间

### 3.4 FullscreenLandscapeLayout

**适用场景：**横屏全屏视频播放、桌面端播放

**特点：**
- 横屏布局优化
- 充分利用宽屏空间
- 屏幕方向控制
- 传统播放器风格

**屏幕方向处理：**
```typescript
// 返回时自动锁定为竖屏
const handleOrientationBack = async () => {
  await ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP
  );
  onBack?.();
};
```

**响应式间距：**
- 水平间距：屏幕宽度的5%
- 垂直间距：屏幕高度的3%

## 与video-control-overlay的集成

### 集成架构

video-core-controls被video-control-overlay作为底层UI库使用，形成清晰的职责分离：

```
video-control-overlay (组合层)
├── useVideoControlsComposition Hook
│   ├── 从entities/video获取数据
│   ├── 组合业务逻辑（手势、动画、自动隐藏）
│   └── 桥接数据到video-core-controls
└── VideoControlsOverlay 组件
    └── VideoCoreControlsProvider (数据桥接)
        └── LayoutComponent (SmallScreen/FullscreenPortrait/Landscape)

video-core-controls (UI组件库)
├── VideoCoreControlsContext (独立状态管理)
├── Layout Components (组合控制栏)
├── Bar & Controls (UI组件)
└── Foundation (Context、基础组件)
```

### 数据流向

```
1. VideoPlayerContext (entities/video)
   ↓ (useVideoPlayer Hook)
2. useVideoControlsComposition (video-control-overlay)
   ↓ (coreControlsProps)
3. VideoCoreControlsProvider (video-core-controls)
   ↓ (useVideoCoreControls Hook)
4. Layout/Bar/Controls Components
```

### 集成示例

```typescript
// video-control-overlay/ui/VideoControlsOverlay.tsx
export const VideoControlsOverlay = (props) => {
  // 组合层：整合业务逻辑
  const {
    coreControlsProps,    // 桥接给video-core-controls的数据
    gestureProps,         // 手势系统
    animationProps,       // 动画系统
    LayoutComponent,      // 动态选择的布局组件
  } = useVideoControlsComposition(props);

  return (
    <VideoCoreControlsProvider {...coreControlsProps}>
      <LayoutComponent />
    </VideoCoreControlsProvider>
  );
};
```

### useVideoControlsComposition的桥接逻辑

**数据转换：**
```typescript
// 从VideoPlayerContext获取原始数据
const { isPlaying, currentTime, bufferedTime, seek, togglePlay } = useVideoPlayer();
const isLiked = useVideoStore(selectIsLiked);

// 转换为VideoCoreControlsProvider所需的props
const coreControlsProps = {
  currentTime,
  duration: currentVideo?.meta?.duration || 0,
  isPlaying,
  bufferedTime,
  onSeek: seek,
  onPlayToggle: togglePlay,
  isLiked,
  onToggleLike: toggleLike,
  // ... 更多状态和回调
};
```

### 职责分离

**video-control-overlay职责：**
- 业务逻辑集成（手势检测、自动隐藏、动画）
- 数据桥接（Entity层 → UI层）
- Layout策略选择
- 与entities/video的交互

**video-core-controls职责：**
- UI组件库（纯展示和交互）
- 独立的Context状态管理
- 时间同步逻辑（useVideoTimeSync）
- 统一的尺寸和样式系统

## HLS支持与集成

### HLS相关调整

video-core-controls作为纯UI组件库，本身不涉及HLS协议处理，但为HLS视频播放提供了完整的UI支持：

1. **缓冲状态显示**：ProgressBar支持bufferedTime显示，与HLS分段加载完美配合
2. **Seeking状态管理**：useVideoTimeSync的超时保护机制适应HLS的网络延迟
3. **时间同步容差**：默认0.5秒容差适合HLS的分段特性

### 与新视频播放器架构的集成

**SmallVideoPlayer集成：**
```tsx
<SmallVideoPlayer>
  <VideoControlsOverlay displayMode={VideoDisplayMode.SMALL}>
    <SmallScreenLayout />
  </VideoControlsOverlay>
</SmallVideoPlayer>
```

**FullscreenVideoPlayer集成：**
```tsx
<FullscreenVideoPlayer>
  <VideoControlsOverlay displayMode={VideoDisplayMode.FULLSCREEN_PORTRAIT}>
    <FullscreenPortraitLayout />
  </VideoControlsOverlay>
</FullscreenVideoPlayer>
```

## 性能优化模式

### SharedValue稳定性

**问题：**SharedValue在每次渲染时重新创建导致动画丢失

**解决方案：**
```typescript
// ❌ 错误：每次渲染创建新的SharedValue
const progress = useSharedValue(0);

// ✅ 正确：使用useRef确保稳定
const progress = useRef(useSharedValue(0)).current;
```

**应用场景：**
- ProgressBar组件的progress、cache、min、max值
- 动画组件的scale、opacity、rotation值

### Callback优化

**最小依赖数组：**
```typescript
// VideoBottomBar中的回调优化
const handlePlayToggle = useCallback(() => {
  onPlayToggle?.();
  onInteraction?.();
}, [onPlayToggle, onInteraction]); // 仅依赖必要的回调
```

### useMemo缓存

**响应式尺寸计算：**
```typescript
// FullscreenPortraitLayout中的尺寸缓存
const responsiveSizes = useMemo(() => {
  const { width, height } = Dimensions.get('window');
  return {
    buttonSize: width * 0.13,
    iconSize: Math.round(width * 0.13 * 0.57),
    horizontalPadding: width * 0.04,
  };
}, [controlSize]); // 仅在controlSize变化时重新计算
```

### React.memo包装

**减少不必要的重渲染：**
```typescript
export const ProgressBar = React.memo(({ ... }) => {
  // 组件实现
});

export const VideoBottomBar = React.memo(({ ... }) => {
  // 组件实现
});
```

## 设计原则总结

### 1. 完全独立性
- 不依赖VideoPlayerContext
- 可独立使用和测试
- 拥有完整的功能集和文档

### 2. 组合优于继承
- Layout组合Bar
- Bar组合Controls
- Controls组合Shared基础组件

### 3. 单一职责
- Context层：状态管理和时间同步
- Bar/Controls层：UI组件和交互处理
- Layout层：布局组合和响应式设计

### 4. 策略模式
- 三种布局策略（SmallScreen、FullscreenPortrait、FullscreenLandscape）
- 动态选择，统一接口
- 各自独立，互不影响

### 5. 性能优先
- SharedValue稳定性保证
- Callback和useMemo优化
- React.memo减少重渲染
- Worklet动画优化

---

*本feature展示了Feature-Sliced Design架构中基础UI组件库的最佳实践，为adaptive组件设计提供参考实现。*