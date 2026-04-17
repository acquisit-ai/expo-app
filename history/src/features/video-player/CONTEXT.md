# Video Player Feature Documentation

*This file documents the video player feature implementing a clean, lightweight component architecture with Entity-centric state management.*

## Feature Architecture Overview

The video player feature provides **两个独立的播放器组件**，专注于视频内容渲染，状态管理由Entity层统一处理：

### Core Components
- **SmallVideoPlayer** - 小屏播放器组件，用于嵌入式/Feed流场景
- **FullscreenVideoPlayer** - 全屏播放器组件，支持竖屏和横屏模式，含自动播放逻辑
- **VideoPlayerContent** - 统一的视频内容渲染组件，处理加载/错误/播放状态

### Architecture Principles
- **Entity-Centric**: 播放器事件同步、全局设置应用由 `video` entity 的 `useVideoEntitySync` 统一管理
- **Stateless UI**: Feature层组件专注于渲染，不维护播放器状态
- **Props-Based**: 通过 `PlayerMeta` props接收播放器实例和videoId
- **Data Integration**: 从 `video-meta` entity 获取视频元数据

## Component Architecture

### 1. SmallVideoPlayer (小屏播放器)

**文件**: `ui/SmallVideoPlayer.tsx`

**职责边界：**
- 接收 Widget 层传入的 `PlayerMeta`（包含 playerInstance + videoId）
- 从 `video-meta` entity 获取视频 URL
- 渲染视频内容和遮罩层
- **不负责**: 事件同步、全局设置应用、时间更新间隔（由Entity层统一管理）

**Props接口：**
```typescript
interface SmallVideoPlayerProps {
  playerMeta: PlayerMeta;              // 播放器元数据（videoId + playerInstance）
  width?: DimensionValue;              // 容器宽度
  height?: DimensionValue;             // 容器高度
  containerStyle?: StyleProp<ViewStyle>; // 自定义容器样式
  overlayAnimatedStyle?: AnimatedStyle<ViewStyle>; // 遮罩层动画
  startsPictureInPictureAutomatically?: boolean; // 是否自动启用画中画
}
```

**关键实现：**
```typescript
// 从 PlayerMeta 解构
const { playerInstance, videoId } = playerMeta;

// 细粒度订阅：只订阅 video_url
const videoUrl = useVideoMetaStore(state => {
  const video = videoId ? state.getVideo(videoId) : null;
  return video?.video_url ?? null;
});

// 渲染视频内容
<VideoPlayerContent
  player={playerInstance}
  videoUrl={videoUrl}
  overlayAnimatedStyle={overlayAnimatedStyle}
/>
```

### 2. FullscreenVideoPlayer (全屏播放器)

**文件**: `ui/FullscreenVideoPlayer.tsx`

**职责边界：**
- 接收 Widget 层传入的 `PlayerMeta` 和显示模式
- 从 `video-meta` entity 获取视频元数据
- 管理条件自动播放逻辑（基于 `autoPlay` prop）
- 渲染全屏视频内容
- **不负责**: 事件同步、全局设置应用、时间更新间隔（由Entity层统一管理）

**Props接口：**
```typescript
interface FullscreenVideoPlayerProps {
  playerMeta: PlayerMeta;              // 播放器元数据（videoId + playerInstance）
  displayMode: VideoDisplayMode;       // 显示模式（FULLSCREEN_PORTRAIT/FULLSCREEN_LANDSCAPE）
  autoPlay?: boolean;                  // 是否自动播放（由页面层控制）
  startsPictureInPictureAutomatically?: boolean; // 是否自动启用画中画
}
```

**自动播放实现：**
```typescript
// 本地状态：独立跟踪播放器就绪状态
const { isPlayerReady } = usePlayerReadyState(playerInstance);

// 条件自动播放逻辑
useEffect(() => {
  // 只在以下条件全部满足时才自动播放：
  // 1. autoPlay === true (由页面层响应式控制)
  // 2. 播放器已就绪
  // 3. 播放器实例和视频数据存在
  if (autoPlay === true && isPlayerReady && playerInstance && videoMetaData) {
    playerInstance.play();
  }
}, [autoPlay, isPlayerReady, playerInstance, videoMetaData]);
```

**设计特点：**
- **页面层控制**: `autoPlay` 由页面层通过 `useFocusEffect` 响应式管理
- **简化逻辑**: 不需要 ref 防重复，页面层已控制响应式状态
- **本地 Ready 状态**: 每个播放器实例独立跟踪就绪状态

### 3. VideoPlayerContent (统一内容组件)

**职责：**统一的视频渲染逻辑，可同时被SmallVideoPlayer和FullscreenVideoPlayer使用

**智能状态渲染：**
1. **加载状态** - 仅在首次加载时显示ActivityIndicator（防止状态切换闪烁）
2. **错误状态** - 显示错误信息和重试提示
3. **视频层** - VideoView与Player Pool集成（通过video entity的currentPlayer指针）
4. **遮罩层** - 可选的动画遮罩覆盖层

**HLS状态防抖保护：**
```typescript
// UI层额外保护：一旦视频显示过，就不再显示loading动画
// 解决HLS格式视频的ready→loading状态切换问题
const [hasShownVideo, setHasShownVideo] = useState(false);

useEffect(() => {
  if (shouldShowVideoPlayer && !hasShownVideo) {
    setHasShownVideo(true);
  }
}, [shouldShowVideoPlayer, hasShownVideo]);

const shouldShowLoading = isLoading && !hasShownVideo;
```

**Props接口：**
```typescript
interface VideoPlayerContentProps {
  videoDisplayStyle: StyleProp<ViewStyle>;    // 视频显示区域样式
  overlayAnimatedStyle?: AnimatedStyle<ViewStyle>; // 遮罩层动画样式
  allowsPictureInPicture?: boolean;           // 是否允许画中画
  fullscreenOptions?: {                       // 全屏选项配置
    enable: boolean;
    resizeMode: 'contain' | 'cover' | 'stretch';
  };
}
```

## Animation System

视频播放器功能使用React Native Reanimated实现高性能动画：

### Video Float Animations (lib/video-float-animations.ts)

**核心动画函数：**
- **calculateVideoScrollTransform** - 滚动驱动的视频容器变换动画
- **calculatePlayButtonAnimation** - 播放按钮的淡入淡出和缩放动画
- **calculateOverlayAnimation** - 控制遮罩层的可见性动画
- **createVideoScrollLogic** - 统一的滚动处理逻辑（播放/暂停状态）

**性能优化：**
```typescript
// 预计算插值范围，避免重复计算
const INTERPOLATION_RANGES = {
  input: [0, ANIMATION.MAX_SCROLL] as const,
  playingTransition: [0, 1] as const,
  scrollTranslateY: [0, -ANIMATION.MAX_SCROLL] as const,
  buttonScale: [1, 0.7] as const,
  // ...
} as const;
```

### Button Animation Hook (hooks/useButtonAnimation.ts)

**通用按钮动画Hook：**
- 提供可配置的出现/消失动画效果
- 支持自定义缩放和透明度范围
- 用于返回按钮、操作按钮等UI元素

```typescript
export function useButtonAnimation(
  effectiveScrollY: SharedValue<number>,
  config?: ButtonAnimationConfig
): AnimatedStyle<ViewStyle>
```

### Animation Presets

**预设动画配置（model/constants.ts）：**
- **playTransition** - 播放状态过渡动画（300ms, cubic easing）
- **pauseTransition** - 暂停状态过渡动画（300ms, cubic easing）
- **videoExpand** - 视频展开动画（300ms, cubic easing）

## State Management Architecture

### Entity-Centric Design

**核心原则**: Feature层不维护播放器状态，所有状态管理由Entity层统一处理

**责任分离：**

1. **Video Entity** (`@/entities/video`):
   - 通过 `useVideoEntitySync` 监听播放器事件，同步状态到 store
   - 应用全局设置到播放器实例
   - 管理时间更新间隔
   - 提供 `currentPlayerMeta` 指针

2. **Video Meta Entity** (`@/entities/video-meta`):
   - 存储视频元数据（title, video_url, subtitle_url等）
   - 提供 `getVideo(videoId)` 选择器

3. **Video Player Feature** (本层):
   - 接收 `PlayerMeta` props（videoId + playerInstance）
   - 从 Entity 获取所需数据
   - 专注于视频内容渲染
   - 实现自动播放逻辑（Fullscreen）

### Data Flow

```
Widget Layer
  ↓ 传递 PlayerMeta
Feature Layer (video-player)
  ├─ 接收 PlayerMeta (videoId + playerInstance)
  ├─ 从 video-meta entity 获取视频元数据
  └─ 渲染 VideoPlayerContent
      ↓
Entity Layer (video)
  ├─ useVideoEntitySync 全局监听播放器事件
  ├─ 同步状态到 video store
  └─ 应用全局设置到 playerInstance
```

## Implementation Patterns

### Props-Based Data Flow (FSD架构)

**核心原则：Feature层组件通过props接收数据，状态管理由Entity层统一处理**

#### 组件实现模式

```typescript
// ✅ SmallVideoPlayer - 接收 PlayerMeta，从 Entity 获取数据
export const SmallVideoPlayer: React.FC<SmallVideoPlayerProps> = ({
  playerMeta,          // Widget层传入（videoId + playerInstance）
  overlayAnimatedStyle,
  // ...
}) => {
  const { playerInstance, videoId } = playerMeta;

  // 从 video-meta entity 获取视频URL
  const videoUrl = useVideoMetaStore(state => {
    const video = videoId ? state.getVideo(videoId) : null;
    return video?.video_url ?? null;
  });

  // 不需要事件同步 - 由 Entity 层的 useVideoEntitySync 统一管理
  // 不需要应用全局设置 - 由 Entity 层统一管理

  return (
    <VideoPlayerContent
      player={playerInstance}
      videoUrl={videoUrl}
      overlayAnimatedStyle={overlayAnimatedStyle}
    />
  );
};
```

```typescript
// ✅ FullscreenVideoPlayer - 添加自动播放逻辑
export const FullscreenVideoPlayer: React.FC<FullscreenVideoPlayerProps> = ({
  playerMeta,
  autoPlay,
  // ...
}) => {
  const { playerInstance, videoId } = playerMeta;

  // 本地状态：跟踪播放器就绪
  const { isPlayerReady } = usePlayerReadyState(playerInstance);

  // 从 video-meta entity 获取数据
  const videoMetaData = useVideoMetaStore(state =>
    videoId ? state.getVideo(videoId) : null
  );

  // 条件自动播放
  useEffect(() => {
    if (autoPlay === true && isPlayerReady && playerInstance && videoMetaData) {
      playerInstance.play();
    }
  }, [autoPlay, isPlayerReady, playerInstance, videoMetaData]);

  return <VideoPlayerContent player={playerInstance} />;
};
```

### 架构优势

- **Entity-Centric**: 状态管理职责清晰，Entity层统一处理
- **轻量级UI**: Feature层组件简洁，专注渲染逻辑
- **易于测试**: 组件依赖少，Props易于mock
- **FSD合规**: 清晰的层次边界，不越界访问

### Entity Integration

**视频播放器功能与Entity层的集成方式：**

#### Video Entity Integration

Feature层组件不直接调用Entity的同步hooks，所有同步由App层统一管理：

```typescript
// ❌ Feature层不再做这些
// const { isPlayerReady } = usePlayerEventSync(playerInstance);
// useApplyGlobalSettings(playerInstance);
// useTimeUpdateInterval();

// ✅ 所有同步由 App 层的 useVideoEntitySync 统一处理
// 在 App.tsx 或 _layout.tsx 中调用一次即可
```

**useVideoEntitySync职责（App层）：**
- 监听当前播放器的事件（ready/loading/error/timeUpdate）
- 同步播放器状态到 video store
- 应用全局设置到播放器实例
- 管理动态时间更新间隔

#### Video Meta Entity Integration

Feature层从 video-meta entity 获取视频元数据：

```typescript
// 细粒度订阅：只订阅需要的字段
const videoUrl = useVideoMetaStore(state => {
  const video = videoId ? state.getVideo(videoId) : null;
  return video?.video_url ?? null;
});

// 获取完整元数据
const videoMetaData = useVideoMetaStore(state =>
  videoId ? state.getVideo(videoId) : null
);
```

#### Global Settings Integration

播放器设置（playbackRate, isMuted, PiP等）由 `global-settings` entity 管理，Feature层无需关心

### Shared Element Transitions（共享元素转场）

**VideoPlayerContent现已支持React Navigation的共享元素转场动画：**

```typescript
// 从路由参数获取videoId
const route = useRoute();
const videoId = (route.params as any)?.videoId;

// 使用SharedElement包裹视频内容
<SharedElement id={`video.${videoId}`} style={videoDisplayStyle}>
  <View style={StyleSheet.absoluteFill}>
    {shouldShowVideoPlayer ? (
      <VideoView player={currentPlayer} />
    ) : (
      <PlaceholderView />
    )}
  </View>
</SharedElement>
```

**转场特性：**
- Feed流到详情页的流畅视频转场
- 保持视频播放连续性
- 配合react-navigation-shared-element库实现

### Component Composition（组件组合）

#### Compound Components（复合组件模式）

```typescript
// 灵活的子组件组合
<SmallVideoPlayer
  videoMeta={videoMeta}
  playerInstance={playerInstance}
  overlayAnimatedStyle={animatedStyle}
>
  {/* 控制层 */}
  <VideoControlsOverlay />

  {/* 字幕层 */}
  <SubtitleOverlay />

  {/* 其他覆盖层 */}
  <CustomOverlay />
</SmallVideoPlayer>
```

**组合特性：**
- **Slot-based架构** - 子组件作为覆盖层灵活插入
- **样式定制** - 通过style props定制而不修改组件
- **动画注入** - 动画样式可从父容器注入

#### Display Mode Adaptation（显示模式适配）

- **响应式尺寸** - 组件适配不同容器尺寸
- **上下文感知行为** - 根据displayMode调整行为
- **性能缩放** - 小屏vs全屏的优化策略不同

## Integration Points

### 与其他层次的集成

#### Entity Layer（实体层）
- **Video Entity** - 提供播放器指针、状态同步和控制接口
- **Player Pool** - 管理播放器实例池，Feature层通过指针访问
- **State Management** - 统一的播放状态和会话状态管理

#### Page Layer（页面层）
- **VideoDetailPage** - 使用SmallVideoPlayer展示视频详情
- **VideoFullscreenPage** - 使用FullscreenVideoPlayer提供沉浸式体验
- **FeedPage** - 集成SmallVideoPlayerSection用于Feed流

#### Widget Layer（部件层）
- **SmallVideoPlayerSection** - 包装SmallVideoPlayer，提供滚动动画协调
- **FullscreenVideoPlayerSection** - 包装FullscreenVideoPlayer，处理手势和控制层

#### Feature Layer（功能层）
- **video-core-controls** - 提供控制层UI（进度条、按钮等）
- **video-gestures** - 处理手势交互（双击点赞、滑动调节等）
- **video-subtitles** - 字幕渲染和管理

### 导出的组件和Hooks

#### UI组件
```typescript
export { SmallVideoPlayer } from './ui/SmallVideoPlayer';
export { FullscreenVideoPlayer } from './ui/FullscreenVideoPlayer';
export { VideoPlayerContent } from './ui/components/VideoPlayerContent';
// 其他子组件通过 './ui/components' 导出
```

#### Hooks
```typescript
export { useButtonAnimation } from './hooks/useButtonAnimation';
```

#### 类型和常量
```typescript
// 从 model/ 目录导出
export { VideoDisplayMode } from './model/types';
export { VIDEO_PLAYER_CONSTANTS } from './model/constants';
```

#### 动画工具
```typescript
// 从 lib/ 目录导出
export {
  calculateVideoScrollTransform,
  calculatePlayButtonAnimation,
  calculateOverlayAnimation,
  createVideoScrollLogic,
} from './lib/video-float-animations';
```

**注意**: 此feature不再导出Context相关hooks，状态访问通过Entity层

## Performance Characteristics

### 性能特性

- **渲染性能** - 硬件加速的视频渲染，最小化覆盖层开销
- **动画性能** - 通过Reanimated worklets实现60fps流畅动画
- **内存使用** - 高效的组件挂载/卸载，支持不同显示模式
- **触摸响应** - 优化的触摸处理和手势管理
- **HLS支持** - 300ms防抖逻辑，避免状态切换闪烁

### 关键优化

1. **状态防抖** - HLS视频的ready→loading状态切换防抖
2. **动画范围预计算** - 避免动画循环中的重复计算
3. **细粒度Context hooks** - 减少不必要的组件重渲染
4. **动态时间更新间隔** - 根据播放状态调整更新频率

## Constants and Configuration

### 配置常量（VIDEO_PLAYER_CONSTANTS）

**LAYOUT（布局）：**
- VIDEO_HEIGHT - 视频高度（16:9比例）
- PLAY_BUTTON_SIZE - 播放按钮尺寸
- CONTROL_BAR_HEIGHT - 控制栏高度
- MIN_VIDEO_HEIGHT - 最小视频高度

**ANIMATION（动画）：**
- DURATION - 动画持续时间（300ms）
- EASING - 缓动函数（cubic）
- MAX_SCROLL - 最大滚动距离

**INTERACTION（交互）：**
- ACTION_ICON_SIZE - 操作图标尺寸
- CONTROLS_TIMEOUT - 控制层自动隐藏时间（3s）
- TIME_UPDATE_INTERVAL - 时间更新间隔配置

---

*本功能展示了React Native视频集成的最佳实践，包括清晰的FSD架构、高性能动画系统、复合组件模式和HLS格式支持。*