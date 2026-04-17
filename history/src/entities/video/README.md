# Video Entity - 播放会话管理

视频实体模块，基于 **Player Pool 架构**，专注于管理当前播放会话的视频状态。基于 Feature-Sliced Design (FSD) 架构原则，提供会话级别的状态管理，不涉及数据持久化。

## 🎯 设计理念

### 核心职责

- **PlayerMeta 指针管理**: 维护 `currentPlayerMeta` 指针（包含 playerInstance + videoId），确保播放器和视频ID的绑定关系
- **播放状态管理**: 通过事件监听从播放器实例同步播放状态到 Store
- **会话状态管理**: 管理用户交互状态（控件可见性、拖拽进度等）
- **Player Pool 集成**: 与 Player Pool entity 协作，支持播放器预加载和快速切换
- **事件同步**: 自动同步播放器事件到 Store，确保 React 组件正确重渲染

### 架构原则

- **会话级状态**: 只管理当前播放会话的运行时状态，应用关闭后状态丢失
- **PlayerMeta 绑定**: 维护 `currentPlayerMeta` 指针，确保 videoId 和 playerInstance 的绑定关系
- **VideoMetaData 分离**: VideoMetaData (点赞、收藏等) 由 **Video Meta Entity** 管理，本 Entity 不存储
- **状态隔离**: 切换视频时自动重置所有状态，确保状态不相互干扰
- **事件驱动同步**: 通过播放器事件监听自动同步状态到 Store
- **职责分离**: isPlayerReady 由 Feature 层管理，Entity 层只管理全局播放状态
- **性能优化**: 使用 subscribeWithSelector 中间件，精确触发组件更新

## 📁 目录结构

```
src/entities/video/
├── model/
│   ├── types.ts                     # 类型定义
│   ├── store.ts                     # Zustand 状态管理
│   ├── selectors.ts                 # Zustand selectors
│   └── playbackPageTypes.ts         # 播放页面状态类型
├── hooks/
│   ├── player-control/              # 播放器控制功能
│   │   ├── index.ts                 # 统一导出
│   │   ├── useVideoPlayer.ts        # 播放器统一入口（推荐使用）
│   │   ├── useVideoPlaybackStatus.ts # 播放状态访问专用
│   │   ├── useVideoPlayerControls.ts # 播放控制专用
│   │   └── useApplyGlobalSettings.ts # 应用全局设置到播放器
│   ├── videoview-sync/              # VideoView 同步机制
│   │   ├── index.ts                 # 统一导出
│   │   ├── usePlayerEventSync.ts    # 播放器事件同步
│   │   └── useTimeUpdateInterval.ts # 时间更新同步
│   ├── useVideoDataLogic.ts         # Player Pool 集成业务逻辑
│   └── useVideoEntitySync.ts        # Entity 自动同步（App 层调用）
├── index.ts                         # 统一导出
├── README.md                        # 本文档
└── CONTEXT.md                       # 架构文档
```

## 🏗️ 核心架构

### Store 状态结构

```typescript
interface VideoEntityState {
  // 🎯 当前播放器元数据（绑定 videoId 和 player）
  currentPlayerMeta: PlayerMeta | null;

  // 播放状态（从播放器事件同步）
  playback: VideoPlaybackState;

  // 会话状态（UI 交互）
  session: VideoSessionState;
}
```

**关键架构**：
```typescript
// PlayerMeta 结构（共享类型）
interface PlayerMeta {
  playerInstance: VideoPlayer;  // 播放器实例
  videoId: string | null;       // 视频ID
}

// ⚠️ 重要：PlayerMeta 不包含 VideoMetaData
// VideoMetaData 由 Video Meta Entity 管理
```

**数据获取模式**：
```typescript
// 1. 从 Video Entity 获取 PlayerMeta
const playerMeta = useVideoStore(selectCurrentPlayerMeta);
const { playerInstance, videoId } = playerMeta;

// 2. 从 Video Meta Entity 获取 VideoMetaData
const videoMetaData = useVideoMetaStore(state =>
  videoId ? state.getVideo(videoId) : null
);
```

### 播放状态同步机制

```typescript
interface VideoPlaybackState {
  currentTime: number;      // 从 timeUpdate 事件同步
  bufferedTime: number;     // 从 timeUpdate 事件同步
}
```

**重要说明**：
- ✅ **时间状态**: currentTime, bufferedTime 同步到 Store
- ❌ **isPlaying 移除**: 不在 Store 管理，直接从 `playerInstance.playing` 读取
- ❌ **duration 移除**: 直接从 `playerInstance.duration` 读取
- ❌ **isPlayerReady 移除**: 由 Feature 层的 `usePlayerReadyState` 管理

**架构优势**：
- 减少 Store 状态冗余
- 直接读取播放器实例的即时状态
- 避免状态同步延迟

### 会话状态管理

```typescript
interface VideoSessionState {
  // 控件状态
  controlsVisible: boolean;
  controlsAutoHide: boolean;
  controlsHideDelay: number;
  isDraggingProgress: boolean;  // 拖拽进度条状态

  // 会话记录
  viewStartTime: Date;
}
```

**注意**：
- ✅ **控件状态**: 由 Video Entity 管理
- ❌ **UI 显示设置**: showSubtitles, showTranslation 移至 global-settings entity
- ❌ **用户交互**: isLiked, isFavorited 移至 Video Meta Entity

## 🔧 API 文档

### 核心 Hooks

#### `useVideoEntitySync()` - 全局同步入口（App 层调用）

⭐️ **必须**在 App 根组件调用一次，自动同步当前播放器的事件到 Store。

```typescript
// App.tsx
import { useVideoEntitySync } from '@/entities/video';

function AppContent() {
  // ✅ 全局同步入口：自动同步当前活动播放器的事件到 Entity Store
  useVideoEntitySync();

  return <Navigation />;
}
```

**职责**：
- 监听 `currentPlayerMeta` 变化
- 只同步当前活动播放器（currentPlayerMeta.playerInstance）
- 防止多播放器实例状态冲突
- 不返回任何值（纯同步到 Store）

#### `useVideoPlayer()` - 统一播放器入口（推荐使用）

组合播放状态和控制功能的统一 Hook。

```typescript
const {
  // 播放器实例（从 Store 获取）
  playerInstance,

  // 播放状态（从 Store 读取同步后的状态）
  currentTime,
  bufferedTime,

  // 播放状态（从 playerInstance 直接读取）
  isPlaying,        // playerInstance.playing
  duration,         // playerInstance.duration
  volume,           // playerInstance.volume

  // 派生状态
  progress,
  bufferedProgress,
  isAtStart,
  isAtEnd,
  formattedCurrentTime,
  formattedDuration,

  // 播放控制功能
  play,
  pause,
  togglePlay,
  seek,
  seekRelative,
  setVolume,
} = useVideoPlayer();
```

**重要变化**：
- ❌ 不再返回 `isPlayerReady`（由 Feature 层管理）
- ✅ `isPlaying` 从 playerInstance 直接读取
- ✅ `duration` 从 playerInstance 直接读取

#### `useVideoDataLogic()` - Player Pool 集成业务逻辑

管理视频加载、切换和预加载的业务逻辑。

```typescript
const {
  enterVideoDetail,   // 进入视频播放模式（从池获取播放器）
  exitToFeed,         // 退出视频播放（暂停并清除指针）
  preloadVideos,      // 预加载视频列表
} = useVideoDataLogic();

// 用法示例
await enterVideoDetail(videoId);  // 通过 Player Pool 获取实例并导航
exitToFeed();                     // 暂停播放器并返回 Feed
await preloadVideos(videoIds);    // 使用调度器预加载
```

**内部流程**：
```typescript
// enterVideoDetail 实现
const enterVideoDetail = useCallback(async (videoId: string) => {
  // 1. 从池获取播放器实例
  const player = await playerPoolManager.acquire(videoId);

  // 2. 从池中获取 PlayerMeta（包含 player + videoId 绑定）
  const playerMeta = playerPoolManager.getPlayerMeta(videoId);

  // 3. 设置到 video store
  setCurrentPlayerMeta(playerMeta);

  // 4. 导航
  navigation.navigate('VideoStack', {
    screen: 'VideoFullscreen',
    params: { videoId, autoPlay: true },
  });
}, []);
```

### Selectors（推荐使用）

```typescript
import { useVideoStore } from '@/entities/video';
import {
  // PlayerMeta selectors
  selectCurrentPlayerMeta,  // 选择当前播放器元数据
  selectCurrentVideoId,     // 选择当前视频ID
  selectCurrentPlayer,      // 选择播放器实例

  // State selectors
  selectPlaybackState,      // 选择播放状态
  selectSessionState,       // 选择会话状态

  // Session 细分 selectors
  selectControlsVisible,
  selectIsDraggingProgress,

  // Action selectors
  selectSetCurrentPlayerMeta,
  selectClearCurrentVideo,
  selectUpdatePlayback,
  selectUpdateSession,
} from '@/entities/video';

// 用法示例
const currentVideoId = useVideoStore(selectCurrentVideoId);
const playerInstance = useVideoStore(selectCurrentPlayer);
const controlsVisible = useVideoStore(selectControlsVisible);
```

**移除的 selectors**：
- ❌ `selectIsLiked`, `selectIsFavorited` → 使用 Video Meta Entity
- ❌ `selectShowSubtitles`, `selectShowTranslation` → 使用 Global Settings Entity

## 📝 使用示例

### App 层全局同步

```typescript
import { useVideoEntitySync } from '@/entities/video';

function App() {
  // ✅ 必须调用：全局同步入口
  useVideoEntitySync();

  return <Navigation />;
}
```

### Page 层数据组合

```typescript
import { useVideoStore, selectCurrentPlayerMeta } from '@/entities/video';
import { useVideoMetaStore } from '@/entities/video-meta';

function VideoDetailPage() {
  // 1. 获取 PlayerMeta
  const currentPlayerMeta = useVideoStore(selectCurrentPlayerMeta);

  // 2. 从 Video Meta Entity 获取 VideoMetaData
  const videoMetaData = useVideoMetaStore(state =>
    currentPlayerMeta?.videoId ? state.getVideo(currentPlayerMeta.videoId) : null
  );

  const isReady = !!currentPlayerMeta?.playerInstance && !!videoMetaData;

  if (!isReady) {
    return <LoadingView />;
  }

  return (
    <SmallVideoPlayerSection
      playerMeta={currentPlayerMeta}
      // videoMetaData 由组件内部从 Video Meta Entity 获取
    />
  );
}
```

### Feature 层播放控制

```typescript
import { useVideoPlayer } from '@/entities/video';

function VideoControls() {
  const {
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
  } = useVideoPlayer();

  return (
    <View>
      <Button onPress={togglePlay}>
        {isPlaying ? '暂停' : '播放'}
      </Button>
      <ProgressBar
        value={currentTime}
        max={duration}
        onSeek={seek}
      />
    </View>
  );
}
```

### Feature 层用户交互

```typescript
import { useVideoStore, selectCurrentVideoId } from '@/entities/video';
import { useVideoMetaStore } from '@/entities/video-meta';

function VideoInteractionButtons() {
  // 1. 获取当前 videoId
  const currentVideoId = useVideoStore(selectCurrentVideoId);

  // 2. 从 Video Meta Entity 获取数据
  const videoMetadata = useVideoMetaStore(state =>
    currentVideoId ? state.getVideo(currentVideoId) : null
  );

  // 3. 直接更新 Video Meta Entity
  const toggleLike = useCallback(() => {
    if (!currentVideoId || !videoMetadata) return;

    const videoMetaStore = useVideoMetaStore.getState();
    videoMetaStore.updateVideo(currentVideoId, {
      isLiked: !videoMetadata.isLiked
    });
  }, [currentVideoId, videoMetadata]);

  return (
    <Button onPress={toggleLike}>
      {videoMetadata?.isLiked ? '取消点赞' : '点赞'}
    </Button>
  );
}
```

## 🔄 状态生命周期

### 视频切换流程（Player Pool 架构）

```typescript
// 1. 从 Player Pool 获取播放器实例
const player = await playerPoolManager.acquire(videoId);

// 2. 从 Pool 获取 PlayerMeta（包含 player + videoId 绑定）
const playerMeta = playerPoolManager.getPlayerMeta(videoId);

// 3. 设置到 video store（自动重置播放和会话状态）
setCurrentPlayerMeta(playerMeta);

// 4. 播放器事件自动同步状态到 Store
// useVideoEntitySync → usePlayerEventSync 监听事件

// 5. 用户交互更新会话状态
updateSession({ controlsVisible: false });

// 6. 退出时清除指针（播放器保留在池中）
clearCurrentVideo();
```

### 状态重置时机

- **切换视频**: 调用 `setCurrentPlayerMeta()` 时自动重置 playback 和 session 状态
- **离开页面**: 调用 `clearCurrentVideo()` 清除所有状态
- **应用重启**: 所有会话级状态自动丢失

## 🎯 最佳实践

### 1. 获取 VideoMetaData

```typescript
// ✅ 推荐：先获取 videoId，再从 Video Meta Entity 查询
const videoId = useVideoStore(selectCurrentVideoId);
const videoData = useVideoMetaStore(state => state.getVideo(videoId));

// ❌ 避免：期望从 Video Entity 获取 VideoMetaData
const { currentPlayerMeta } = useVideoStore();
const videoData = currentPlayerMeta.videoMetaData; // 不存在
```

### 2. 更新用户交互状态

```typescript
// ✅ 推荐：直接更新 Video Meta Entity
videoMetaStore.updateVideo(videoId, { isLiked: true });

// ❌ 避免：尝试更新 Video Entity 的会话状态
updateSession({ isLiked: true }); // isLiked 不在 session 中
```

### 3. 读取播放状态

```typescript
// ✅ 推荐：直接从 playerInstance 读取即时状态
const isPlaying = playerInstance.playing;
const duration = playerInstance.duration;

// ✅ 也可以：使用 useVideoPlayer Hook
const { isPlaying, duration } = useVideoPlayer();

// ⚠️ 注意：Store 只同步 currentTime 和 bufferedTime
const { currentTime, bufferedTime } = useVideoPlayer();
```

### 4. isPlayerReady 使用

```typescript
// ❌ 错误：从 Video Entity 读取
const { isPlayerReady } = useVideoPlayer(); // 已移除

// ✅ 正确：使用 Feature 层的 Hook
import { usePlayerReadyState } from '@/shared/hooks';

const { isPlayerReady } = usePlayerReadyState(playerInstance);
```

## 🔍 调试支持

### 开发环境调试

```javascript
// 查看当前状态
console.log(__videoStore.getState());

// 查看当前播放器元数据
console.log(__videoStore.getState().currentPlayerMeta);

// 查看播放状态
console.log(__videoStore.getState().playback);

// 查看会话状态
console.log(__videoStore.getState().session);
```

### 日志记录

```typescript
// 视频切换
log('video-entity', LogType.INFO, `Setting current video: ${videoId}`);

// 播放状态更新
log('video-entity', LogType.DEBUG, `Playback state updated: ${JSON.stringify(updates)}`);

// 全局同步
log('video-entity-sync', LogType.INFO, `Syncing events for player: video-${videoId}`);
```

## 📋 重构变更记录

### v6.0.0 (当前版本) - Video Meta Entity SSOT 架构

**核心变更**：
- ✅ **PlayerMeta 不包含 VideoMetaData**: PlayerMeta = { playerInstance, videoId }
- ✅ **VideoMetaData 由 Video Meta Entity 管理**: 单一真相来源 (SSOT)
- ✅ **ID-based 架构**: 组件先获取 videoId，再从 Video Meta Entity 查询数据
- ✅ **用户交互移除**: isLiked, isFavorited 移至 Video Meta Entity
- ✅ **播放状态简化**: 移除 isPlaying, duration，直接从 playerInstance 读取

**移除的功能**：
- ❌ `PlayerMeta.videoMetaData` 字段
- ❌ `VideoSessionState.isLiked`, `VideoSessionState.isFavorited`
- ❌ `VideoPlaybackState.isPlaying`, `VideoPlaybackState.duration`
- ❌ Selectors: `selectIsLiked`, `selectIsFavorited`

**新增的架构**：
- ✅ **Video Meta Entity**: 所有 VideoMetaData 的 SSOT
- ✅ **数据组合模式**: Page/Widget 层组合 PlayerMeta + VideoMetaData
- ✅ **直接更新**: Features 直接更新 Video Meta Entity

**架构优势**：
- 🎯 **单一数据源**: 避免数据冗余和同步问题
- ⚡ **性能优化**: 减少 Store 状态，精确订阅更新
- 🏗️ **FSD 合规**: ID-based 引用，符合架构原则
- 🔄 **响应式正确**: immutable 更新，自动同步所有订阅者

### v5.0.0 - isPlayerReady 职责分离

**核心变更**：
- ✅ **移除全局 isPlayerReady**: 从 `VideoPlaybackState` 移除
- ✅ **Feature 层管理**: `isPlayerReady` 由 Feature 层独立管理
- ✅ **全局同步入口**: 新增 `useVideoEntitySync` Hook

### v4.0.0 - Player Pool 架构重构

**核心变更**：
- ✅ **单一指针架构**: 使用 `currentPlayerMeta` 替代分离的状态
- ✅ **事件驱动同步**: 强化播放器事件监听和状态同步

## 🔗 相关模块

### 依赖关系

```
entities/video-meta (SSOT)
    ↓ 提供 VideoMetaData
entities/player-pool (播放器实例池)
    ↓ 提供 PlayerMeta
entities/video (当前播放状态)
    ↓ 存储 currentPlayerMeta
features/video-player (播放器 UI)
    ↓ 组合数据并渲染
widgets/video-player-section
    ↓
pages/video-*
```

### 与其他模块的集成

- **`entities/video-meta`**: 提供 VideoMetaData (isLiked, isFavorited, title, etc.)
- **`entities/player-pool`**: 提供播放器实例的 LRU 缓存和 PlayerMeta
- **`entities/global-settings`**: 提供全局设置（playbackRate, showSubtitles, etc.)
- **`features/video-player`**: 使用 video entity 的状态进行 UI 渲染
- **`shared/lib/time-format`**: 提供时间格式化工具函数
- **`shared/lib/logger`**: 统一的日志记录服务

---

**本文档反映了 Video Meta Entity SSOT 架构的最新状态，所有示例代码均基于当前实现。**
