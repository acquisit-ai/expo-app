# Video Player Feature

> 视频播放器功能模块 - 纯展示组件，提供小屏和全屏两种播放模式

## 🎯 概述

video-player 是一个**纯展示 Feature**，遵循 Feature-Sliced Design (FSD) 架构原则，提供两个独立的播放器组件（SmallVideoPlayer 和 FullscreenVideoPlayer）。所有数据通过 props 传入，无业务逻辑，高度可复用。

### 核心原则

- ✅ **纯展示组件**: 只负责显示，不包含业务逻辑
- ✅ **Props-Based Data Flow**: 所有数据通过 props 传入
- ✅ **本地 UI 状态**: 使用 `usePlayerReadyState` 管理每个播放器实例的本地状态
- ✅ **无 Entity 依赖**: 不直接读取或写入 Entity Store
- ✅ **高度可复用**: 可用于任何视频播放场景

## 📁 目录结构

```
src/features/video-player/
├── ui/                              # UI 组件
│   ├── SmallVideoPlayer.tsx         # 小屏播放器
│   ├── FullscreenVideoPlayer.tsx    # 全屏播放器
│   └── components/                  # 子组件
│       ├── VideoPlayerContent.tsx   # 统一内容组件
│       ├── HeaderButtonBar.tsx      # 头部按钮栏
│       └── AnimatedButton.tsx       # 动画按钮
├── lib/                             # 工具库
│   ├── hooks/                       # Feature 层工具 Hooks
│   │   ├── usePlayerReadyState.ts   # 播放器就绪状态（本地）
│   │   └── index.ts
│   └── video-float-animations.ts    # 滚动动画工具
├── hooks/                           # UI Hooks
│   └── useButtonAnimation.ts        # 按钮动画
├── model/                           # 模型层
│   ├── constants.ts                 # 配置常量
│   └── types.ts                     # 类型定义
├── index.ts                         # 统一导出
└── README.md                        # 本文档
```

## 🎨 核心组件

### 1. SmallVideoPlayer（小屏播放器）

**职责**: 纯展示组件，用于嵌入式场景（如 Feed 流、详情页）

```typescript
import { SmallVideoPlayer } from '@/features/video-player';
import { useApplyGlobalSettings } from '@/entities/video';

function VideoFeedItem() {
  const { videoMetadata, playerInstance } = getVideoData();

  return (
    <SmallVideoPlayer
      videoMetadata={videoMetadata}
      playerInstance={playerInstance}
      width="100%"
      height={VIDEO_HEIGHT}
      overlayAnimatedStyle={scrollAnimation}
    />
  );
}
```

**Props 接口**:
```typescript
interface SmallVideoPlayerProps {
  videoMetadata: VideoMetaData;    // 由上层传入
  playerInstance: VideoPlayer;     // 由上层传入
  width?: DimensionValue;          // 可选：容器宽度
  height?: DimensionValue;         // 可选：容器高度
  containerStyle?: ViewStyle;      // 可选：容器样式
  overlayAnimatedStyle?: AnimatedStyle;  // 可选：遮罩动画
}
```

**特性**:
- ✅ 应用全局设置到播放器（通过 `useApplyGlobalSettings`）
- ✅ 支持自定义尺寸和样式
- ✅ 支持遮罩层动画
- ❌ 无状态管理（不读取/写入 Entity Store）
- ❌ 无业务逻辑

### 2. FullscreenVideoPlayer（全屏播放器）

**职责**: 纯展示组件 + 轻量 UI 交互策略（autoPlay）

```typescript
import { FullscreenVideoPlayer, VideoDisplayMode } from '@/features/video-player';

function VideoFullscreenPage() {
  const { videoMetadata, playerInstance } = getVideoData();

  return (
    <FullscreenVideoPlayer
      displayMode={VideoDisplayMode.FULLSCREEN_PORTRAIT}
      videoMetadata={videoMetadata}
      playerInstance={playerInstance}
      autoPlay={true}  // 可选：是否自动播放
    />
  );
}
```

**Props 接口**:
```typescript
interface FullscreenVideoPlayerProps {
  displayMode: VideoDisplayMode;   // 显示模式（竖屏/横屏）
  videoMetadata: VideoMetaData;    // 由上层传入
  playerInstance: VideoPlayer;     // 由上层传入
  autoPlay?: boolean;              // 可选：是否自动播放
}
```

**特性**:
- ✅ 应用全局设置到播放器
- ✅ **autoPlay 策略**: 播放器就绪时自动播放（使用 ref 防止重复播放）
- ✅ 全屏布局管理（隐藏 StatusBar）
- ✅ 使用本地 `isPlayerReady` 状态
- ❌ 无业务逻辑（autoPlay 是 UI 交互策略）

**autoPlay 实现细节**:
```typescript
// 🎬 条件自动播放逻辑 - 只在明确要求时才自动播放
// 使用 ref 跟踪"已自动播放的视频 ID"，避免重复播放
const lastAutoPlayedVideoIdRef = useRef<string | null>(null);

useEffect(() => {
  // ✅ 只在以下条件全部满足时才自动播放：
  // 1. autoPlay === true (明确要求自动播放)
  // 2. 播放器已就绪
  // 3. 当前视频还未自动播放过
  if (autoPlay === true &&
      isPlayerReady &&
      playerInstance &&
      lastAutoPlayedVideoIdRef.current !== videoMetadata.id) {
    playerInstance.play();
    lastAutoPlayedVideoIdRef.current = videoMetadata.id;
  }
}, [autoPlay, isPlayerReady, playerInstance, videoMetadata.id]);
```

### 3. VideoPlayerContent（统一内容组件）

**职责**: 可复用的视频渲染组件，处理加载/错误/播放状态

```typescript
<VideoPlayerContent
  playerInstance={playerInstance}
  videoUrl={videoUrl}
  startsPictureInPictureAutomatically={startsPictureInPictureAutomatically}
  videoDisplayStyle={styles.videoDisplay}
  overlayAnimatedStyle={overlayAnimatedStyle}
  allowsPictureInPicture
  fullscreenOptions={{ enable: true, resizeMode: 'contain' }}
/>
```

**智能特性**:
- ✅ 使用 `usePlayerReadyState` 获取本地就绪状态
- ✅ 根据状态显示：ActivityIndicator / VideoView / ErrorView
- ✅ 支持画中画
- ✅ 完全独立（不依赖 Entity Store）

### 4. HeaderButtonBar（头部按钮栏）

**职责**: 显示返回按钮和播放状态指示器

```typescript
<HeaderButtonBar
  effectiveScrollY={effectiveScrollY}
  onBackPress={onBack}
  isPlaying={isPlaying}
/>
```

**特性**:
- ✅ 滚动驱动的按钮动画
- ✅ 根据 `isPlaying` 显示图标
- ✅ 纯展示组件

## 🔧 工具库

### usePlayerReadyState（本地状态管理）

**⭐️ Feature 层核心工具**：管理每个播放器实例的本地 `isPlayerReady` 状态。

```typescript
import { usePlayerReadyState } from '@/features/video-player';

function MyVideoPlayer({ playerInstance }) {
  // ✅ 本地状态：每个播放器实例独立跟踪自己的 isPlayerReady
  const { isPlayerReady } = usePlayerReadyState(playerInstance);

  if (!isPlayerReady) {
    return <ActivityIndicator />;
  }

  return <VideoView player={playerInstance} />;
}
```

**职责**:
- 监听播放器 `statusChange` 事件
- 维护本地 `isPlayerReady` 状态
- ❌ 不同步到 Entity Store
- ✅ 支持多播放器实例（每个实例独立状态）

**实现细节**:
```typescript
export const usePlayerReadyState = (player: VideoPlayer | null) => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    if (!player) {
      setIsPlayerReady(false);
      return;
    }

    // 监听 statusChange 事件
    const statusSubscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        setIsPlayerReady(true);
      } else if (status === 'loading') {
        setIsPlayerReady(false);
      }
    });

    return () => {
      statusSubscription.remove();
    };
  }, [player]);

  return { isPlayerReady };
};
```

**HLS 优化**:
- 状态去重：相同状态不触发更新
- HLS 特殊处理：一旦进入 ready 状态，短时间内忽略 loading 状态
- loading 状态防抖：延迟 300ms 才更新为 not ready

### useButtonAnimation（按钮动画）

滚动驱动的按钮动画 Hook。

```typescript
import { useButtonAnimation } from '@/features/video-player';

const animatedStyle = useButtonAnimation(effectiveScrollY, {
  showStart: 0.6,  // 滚动进度 60% 开始显示
  showEnd: 0.9,    // 滚动进度 90% 完全显示
  minScale: 0.8,
  maxScale: 1,
});
```

### 动画工具函数

```typescript
import {
  calculateVideoScrollTransform,
  calculateOverlayAnimation,
} from '@/features/video-player';

// 视频容器动画
const videoStyle = useAnimatedStyle(() =>
  calculateVideoScrollTransform({ effectiveScrollY, playingTransition })
);

// 遮罩层动画
const overlayStyle = useAnimatedStyle(() =>
  calculateOverlayAnimation({ effectiveScrollY, playingTransition })
);
```

## 📊 架构原则

### Props-Based Data Flow（FSD 架构）

```typescript
// ✅ 正确：所有数据通过 props 传入
<SmallVideoPlayer
  videoMetadata={videoMetadata}      // 从上层传入
  playerInstance={playerInstance}     // 从上层传入
/>

// ❌ 错误：直接读取 Entity Store
const videoMetadata = useVideoStore(selectCurrentVideo);  // 不应在 Feature 层
```

### 职责分离

| 层级 | 职责 | 示例 |
|------|------|------|
| **Entity 层** | 全局播放状态 | isPlaying, currentTime, bufferedTime |
| **Feature 层** | 本地 UI 状态 | isPlayerReady（每个实例独立） |
| **Widget 层** | 组合 Feature | SmallVideoPlayerSection 组合播放器+控制 |
| **Page 层** | 数据获取和传递 | 从 Entity 获取数据，传递给 Feature |

### 状态管理策略

```typescript
// Entity 层（全局状态）
const { isPlaying, currentTime } = useVideoPlayer();  // 从 Entity Store

// Feature 层（本地状态）
const { isPlayerReady } = usePlayerReadyState(playerInstance);  // 本地 state

// Feature 层（配置播放器）
useApplyGlobalSettings(playerInstance);  // 应用全局设置到播放器
```

## 🎯 使用示例

### 基础使用（Widget 层）

```typescript
import { SmallVideoPlayer } from '@/features/video-player';
import { useVideoStore, selectCurrentVideo, selectPlayerInstance } from '@/entities/video';

function SmallVideoPlayerSection() {
  // Widget 层从 Entity 获取数据
  const currentVideo = useVideoStore(selectCurrentVideo);
  const playerInstance = useVideoStore(selectPlayerInstance);

  if (!currentVideo || !playerInstance) {
    return null;
  }

  // 传递给 Feature 层
  return (
    <SmallVideoPlayer
      videoMetadata={currentVideo}
      playerInstance={playerInstance}
      width="100%"
      height={240}
    />
  );
}
```

### 全屏播放（Page 层）

```typescript
import { FullscreenVideoPlayer, VideoDisplayMode } from '@/features/video-player';
import { useVideoStore, selectCurrentVideo, selectPlayerInstance } from '@/entities/video';

function VideoFullscreenPage({ route }) {
  const { autoPlay } = route.params;

  // Page 层从 Entity 获取数据
  const currentVideo = useVideoStore(selectCurrentVideo);
  const playerInstance = useVideoStore(selectPlayerInstance);

  return (
    <FullscreenVideoPlayer
      displayMode={VideoDisplayMode.FULLSCREEN_PORTRAIT}
      videoMetadata={currentVideo}
      playerInstance={playerInstance}
      autoPlay={autoPlay}
    />
  );
}
```

### 自定义组件（使用 usePlayerReadyState）

```typescript
import { usePlayerReadyState } from '@/features/video-player';

function CustomVideoPlayer({ playerInstance }) {
  // 使用 Feature 层的本地状态工具
  const { isPlayerReady } = usePlayerReadyState(playerInstance);

  return (
    <View>
      {!isPlayerReady && <ActivityIndicator />}
      {isPlayerReady && (
        <VideoView
          player={playerInstance}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </View>
  );
}
```

## ⚙️ 配置常量

```typescript
import { VIDEO_PLAYER_CONSTANTS } from '@/features/video-player';

const {
  LAYOUT: {
    VIDEO_HEIGHT,          // 视频高度（240px, 16:9）
    PLAY_BUTTON_SIZE,      // 播放按钮尺寸（60px）
    MIN_VIDEO_HEIGHT,      // 最小视频高度（64px）
    CONTROL_BAR_HEIGHT,    // 控制栏高度
  },
  ANIMATION: {
    DURATION,              // 动画时长（300ms）
    EASING,                // 缓动函数（cubic）
    MAX_SCROLL,            // 最大滚动距离
  },
  INTERACTION: {
    ACTION_ICON_SIZE,      // 动作图标尺寸（22px）
    PLAY_ICON_SIZE,        // 播放图标尺寸（30px）
    BACK_BUTTON_SIZE,      // 返回按钮尺寸（32px）
    BUTTON_COLORS,         // 按钮颜色配置
  },
} = VIDEO_PLAYER_CONSTANTS;
```

## 📊 类型定义

```typescript
// 显示模式
enum VideoDisplayMode {
  SMALL = 'small',
  FULLSCREEN_PORTRAIT = 'fullscreen-portrait',
  FULLSCREEN_LANDSCAPE = 'fullscreen-landscape',
}

// 视频元数据
type VideoMetaData = {
  id: string;
  title: string;
  video_url: string;
  // ...
};

// 播放器实例
type VideoPlayer = {
  play(): void;
  pause(): void;
  currentTime: number;
  duration: number;
  status: 'idle' | 'loading' | 'readyToPlay' | 'error';
  // ...
};
```

## 🎯 最佳实践

### 1. 数据传递

```typescript
// ✅ 推荐：Widget/Page 层获取数据，传递给 Feature 层
function MyWidget() {
  const currentVideo = useVideoStore(selectCurrentVideo);
  const playerInstance = useVideoStore(selectPlayerInstance);

  return (
    <SmallVideoPlayer
      videoMetadata={currentVideo}
      playerInstance={playerInstance}
    />
  );
}

// ❌ 避免：Feature 层直接读取 Entity Store
function SmallVideoPlayer() {
  const currentVideo = useVideoStore(selectCurrentVideo);  // 错误！
  // ...
}
```

### 2. isPlayerReady 使用

```typescript
// ✅ 推荐：使用 usePlayerReadyState 获取本地状态
import { usePlayerReadyState } from '@/features/video-player';

const { isPlayerReady } = usePlayerReadyState(playerInstance);

// ❌ 错误：从 Entity Store 读取（已移除）
const { isPlayerReady } = useVideoPlayer();  // Entity 层不再返回此字段
```

### 3. 全局设置应用

```typescript
// ✅ 推荐：在 Feature 层组件内部调用
import { useApplyGlobalSettings } from '@/entities/video';

function SmallVideoPlayer({ playerInstance }) {
  useApplyGlobalSettings(playerInstance);  // 应用全局设置
  // ...
}

// ❌ 避免：在外部调用
function MyWidget() {
  useApplyGlobalSettings(playerInstance);  // 不推荐，职责不清晰
  return <SmallVideoPlayer playerInstance={playerInstance} />;
}
```

### 4. 性能优化

```typescript
// ✅ 推荐：使用 useMemo 缓存样式
const containerStyle = useMemo(() => [
  styles.container,
  { width, height },
], [width, height]);

// ✅ 推荐：使用 React.memo 避免不必要的重渲染
export const SmallVideoPlayer = React.memo(function SmallVideoPlayer(props) {
  // ...
});
```

## 🔗 集成点

### 与其他层次的集成

- **Entity Layer** - `entities/video` 提供全局播放状态和控制接口
  - `useApplyGlobalSettings`: 应用全局设置到播放器实例
  - ❌ 不直接读取 Entity Store

- **Page Layer** - VideoDetailPage、VideoFullscreenPage 使用播放器组件
  - 从 Entity 获取数据
  - 传递给 Feature 层

- **Widget Layer** - SmallVideoPlayerSection、FullscreenVideoPlayerSection 提供包装
  - 组合播放器和控制层
  - 管理局部动画

- **Feature Layer** - video-control-overlay、subtitle-display 等功能集成
  - 作为兄弟 Feature 组合使用

## 📋 变更记录

### v2.0.0 (当前版本) - 职责分离和本地状态管理

**核心变更**：
- ✅ **移除 Context 架构**: 通过 props 传递数据，不使用 Context
- ✅ **本地状态管理**: 新增 `usePlayerReadyState` Hook
- ✅ **完全独立**: 不依赖 Entity Store
- ✅ **纯展示组件**: 所有组件都是纯展示，无业务逻辑

**新增功能**：
- ✅ `usePlayerReadyState`: 管理每个播放器实例的本地 isPlayerReady 状态

**架构优势**：
- 🎯 **纯粹性**: Feature 层只负责显示，无业务逻辑
- ⚡ **可复用性**: 组件可用于任何场景
- 🏗️ **多播放器支持**: 每个实例独立状态
- 🔄 **架构清晰**: 单向数据流，职责分离

### v1.0.0 - 初始版本

- 基础播放器组件
- Context 架构（已废弃）

## 🎉 总结

### 核心特点

1. **纯展示组件**: 只负责显示，无业务逻辑
2. **Props-Based**: 所有数据通过 props 传入
3. **本地状态**: 使用 `usePlayerReadyState` 管理本地 UI 状态
4. **完全独立**: 不依赖 Entity Store
5. **高度可复用**: 可用于任何视频播放场景

### 职责边界

- ✅ 显示视频播放器
- ✅ 应用全局设置到播放器实例
- ✅ 管理本地 UI 状态（isPlayerReady）
- ✅ 提供 UI 交互策略（autoPlay）
- ❌ 不包含业务逻辑
- ❌ 不读取/写入 Entity Store
- ❌ 不进行数据转换/处理

---

*遵循 Feature-Sliced Design 架构原则 | 纯展示组件 | 高度可复用*
