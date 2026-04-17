# Fullscreen 页面首次进入自动播放逻辑分析

## 一、完整流程概览

```
Feed 点击视频
  ↓
useVideoDataLogic.enterVideoDetail()
  ↓
playerPoolManager.acquire() → 获取/创建播放器实例
  ↓
setCurrentPlayerMeta() → 存储到 video store
  ↓
navigation.navigate('VideoStack', { screen: 'VideoFullscreen' })
  ↓
VideoFullscreenPage 挂载
  ↓
FullscreenVideoPlayerSection 挂载
  ↓
FullscreenVideoPlayer 挂载
  ↓
usePlayerEventSync() → 监听播放器事件
  ↓
检测 status === 'readyToPlay'
  ↓
setIsPlayerReady(true)
  ↓
自动播放 useEffect 触发
  ↓
playerInstance.play()
```

## 二、关键组件职责

### 1. FeedPage (src/pages/feed/ui/FeedPage.tsx:75-115)

**职责**: 处理用户点击视频事件

```typescript
const handleVideoPress = useCallback(async (video: VideoMetadata) => {
  // 调用 enterVideoDetail 进入视频详情
  await enterVideoDetail(video.meta);

  // 后台异步加载字幕
  loadSubtitle(video.meta.id, { background: true });
}, [enterVideoDetail, loadSubtitle]);
```

### 2. useVideoDataLogic (src/entities/video/hooks/useVideoDataLogic.ts:39-71)

**职责**: 从播放器池获取实例并导航

```typescript
const enterVideoDetail = useCallback(async (videoMeta: CurrentVideo['meta']) => {
  // 1. 从池获取播放器实例
  const videoMetadata: VideoMetadata = { meta: videoMeta };
  const player = await playerPoolManager.acquire(videoMetadata);

  // 2. 获取 PlayerMeta（包含 player + metadata）
  const playerMeta = playerPoolManager.getPlayerMeta(videoMeta.id);

  // 3. 设置到 video store
  setCurrentPlayerMeta(playerMeta);

  // 4. 导航到全屏页面
  navigation.navigate('VideoStack', {
    screen: 'VideoFullscreen',
    params: { videoId: videoMeta.id },
  });
}, [navigation, setCurrentPlayerMeta]);
```

**关键点**:
- `playerPoolManager.acquire()` 可能返回已存在的播放器（预加载）或创建新播放器
- 播放器实例已经加载了视频源，状态可能已经是 `readyToPlay`

### 3. VideoFullscreenPage (src/pages/video-fullscreen/ui/VideoFullscreenPage.tsx:20-63)

**职责**: 页面容器，传递数据和回调

```typescript
export function VideoFullscreenPage() {
  // 从 store 获取当前视频和播放器
  const currentVideo = useVideoStore(selectCurrentVideo);
  const currentPlayer = useVideoStore(selectPlayerInstance);

  // 获取页面特定逻辑
  const { exitFullscreen, isLandscape } = useVideoFullscreenLogic();

  // 计算播放模式
  const playbackMode = isLandscape
    ? PlaybackMode.FULLSCREEN_LANDSCAPE
    : PlaybackMode.FULLSCREEN_PORTRAIT;

  return (
    <FullscreenVideoPlayerSection
      onExitFullscreen={exitFullscreen}
      playbackMode={playbackMode}
    />
  );
}
```

### 4. FullscreenVideoPlayerSection (src/widgets/fullscreen-video-player-section/ui/FullscreenVideoPlayerSection.tsx:33-106)

**职责**: 组合视频播放器、控制层、字幕组件

```typescript
export function FullscreenVideoPlayerSection({
  onExitFullscreen,
  playbackMode,
}: FullscreenVideoPlayerSectionProps) {
  // 从 store 获取数据
  const currentVideo = useVideoStore(selectCurrentVideo);
  const currentPlayer = useVideoStore(selectPlayerInstance);

  return (
    <FullscreenVideoPlayer
      onExitFullscreen={onExitFullscreen}
      displayMode={displayMode}
      videoMeta={currentVideo.meta}
      playerInstance={currentPlayer}
    >
      {/* 控制层和字幕 */}
    </FullscreenVideoPlayer>
  );
}
```

### 5. FullscreenVideoPlayer (src/features/video-player/ui/FullscreenVideoPlayer.tsx:53-176)

**职责**: 播放器核心逻辑，包含自动播放

#### 5.1 播放器事件同步 (Line 96)

```typescript
// 统一的播放器事件同步
const { isPlayerReady } = usePlayerEventSync(playerInstance);
```

#### 5.2 自动播放逻辑 (Line 98-110)

```typescript
// 🎬 自动播放逻辑 - 仅在视频首次 ready 时播放一次
// 使用 ref 跟踪"已自动播放的视频 ID"
const lastAutoPlayedVideoIdRef = useRef<string | null>(null);

useEffect(() => {
  // 如果播放器已就绪 且 当前视频还未自动播放过，则播放
  if (isPlayerReady && playerInstance && lastAutoPlayedVideoIdRef.current !== videoMeta.id) {
    log('fullscreen-video-player', LogType.INFO, `Auto-playing video on ready: ${videoMeta.id}`);
    playerInstance.play();
    lastAutoPlayedVideoIdRef.current = videoMeta.id;
  }
}, [isPlayerReady, playerInstance, videoMeta.id]);
```

**设计亮点**:
- ✅ 使用 `ref` 记录已播放的视频 ID，而不是布尔值
- ✅ 支持视频切换时自动重新播放
- ✅ 每个视频只自动播放一次

### 6. usePlayerEventSync (src/entities/video/hooks/videoview-sync/usePlayerEventSync.ts:16-158)

**职责**: 监听 expo-video 播放器事件，同步状态到 store

#### 6.1 初始状态检查 (Line 32-45)

```typescript
useEffect(() => {
  if (!player) {
    setIsPlayerReady(false);
    return;
  }

  // ✅ 检查播放器初始状态，避免组件重新挂载时丢失就绪状态
  if (player.status === 'readyToPlay') {
    lastStatus.current = 'readyToPlay';
    setIsPlayerReady(true);

    // 初始状态同步
    const store = useVideoStore.getState();
    store.updatePlayback({
      playbackRate: player.playbackRate,
      isMuted: player.muted,
      staysActiveInBackground: player.staysActiveInBackground,
    });

    log('video-player', LogType.DEBUG,
      `Player already ready on mount - duration: ${player.duration}s`);
  }

  // ... 监听事件
}, [player]);
```

**关键逻辑**:
- 🔥 **立即检查**: 组件挂载时立即检查播放器状态
- 🔥 **防止丢失**: 如果播放器已经 ready，立即设置 `isPlayerReady = true`
- 📊 **同步状态**: 将播放速度、静音状态同步到 store

#### 6.2 状态变化监听 (Line 48-116)

```typescript
const statusSubscription = player.addListener('statusChange', ({ status, error }) => {
  // 状态去重
  if (lastStatus.current === status) {
    return;
  }

  // HLS 特殊处理：忽略 ready → loading 的短暂切换
  if (lastStatus.current === 'readyToPlay' && status === 'loading') {
    log('video-player', LogType.DEBUG, `Ignoring transient loading state`);
    return;
  }

  lastStatus.current = status;

  // 处理就绪状态
  if (status === 'readyToPlay') {
    setIsPlayerReady(true);

    // 同步播放器状态到 Store
    store.updatePlayback({
      playbackRate: player.playbackRate,
      isMuted: player.muted,
      staysActiveInBackground: player.staysActiveInBackground,
    });

    log('video-player', LogType.DEBUG,
      `Video ready to play - duration: ${player.duration}s`);
  }
});
```

**设计亮点**:
- ✅ 状态去重：避免重复触发
- ✅ HLS 优化：忽略加载新分片时的临时 loading 状态
- ✅ 防抖机制：loading 状态延迟 300ms 才更新

## 三、两种自动播放场景

### 场景 1: 播放器预加载完成（最常见）

```
用户在 Feed 滑动
  ↓
preloadVideos() 预加载周围视频
  ↓
playerPoolManager 创建播放器并加载视频
  ↓
播放器状态变为 'readyToPlay'（在后台）
  ↓
用户点击视频
  ↓
playerPoolManager.acquire() 返回已 ready 的播放器
  ↓
VideoFullscreenPage 挂载
  ↓
usePlayerEventSync 检测到 player.status === 'readyToPlay'
  ↓
立即设置 isPlayerReady = true
  ↓
自动播放 useEffect 触发
  ↓
playerInstance.play() → 视频立即开始播放
```

**时间**: **几乎瞬时播放**（< 50ms）

### 场景 2: 播放器未预加载（冷启动）

```
用户点击未预加载的视频
  ↓
playerPoolManager.acquire() 创建新播放器
  ↓
播放器开始加载视频（status = 'loading'）
  ↓
VideoFullscreenPage 挂载
  ↓
usePlayerEventSync 监听 statusChange 事件
  ↓
播放器加载完成，status → 'readyToPlay'
  ↓
statusChange 事件触发
  ↓
setIsPlayerReady(true)
  ↓
自动播放 useEffect 触发
  ↓
playerInstance.play() → 视频开始播放
```

**时间**: **1-3 秒**（取决于网络和视频大小）

## 四、核心技术决策

### 1. 为什么使用 `ref` 而不是 `state` 记录已播放视频？

```typescript
// ✅ 使用 ref
const lastAutoPlayedVideoIdRef = useRef<string | null>(null);

// ❌ 如果使用 state
const [lastAutoPlayedVideoId, setLastAutoPlayedVideoId] = useState<string | null>(null);
```

**原因**:
- `ref` 不会触发重新渲染
- 避免不必要的 useEffect 重新执行
- 更轻量级的状态追踪

### 2. 为什么在 `usePlayerEventSync` 中检查初始状态？

```typescript
// ✅ 检查初始状态
if (player.status === 'readyToPlay') {
  setIsPlayerReady(true);
}
```

**原因**:
- 播放器池可能返回已经 ready 的播放器
- 如果只依赖事件监听，会错过已经完成的状态变化
- 确保自动播放在任何情况下都能触发

### 3. 为什么依赖 `videoMeta.id` 而不是整个 `videoMeta` 对象？

```typescript
useEffect(() => {
  if (isPlayerReady && lastAutoPlayedVideoIdRef.current !== videoMeta.id) {
    playerInstance.play();
    lastAutoPlayedVideoIdRef.current = videoMeta.id;
  }
}, [isPlayerReady, playerInstance, videoMeta.id]); // ✅ 只依赖 id
```

**原因**:
- `videoMeta` 是对象，引用可能频繁变化
- 只有 `id` 变化才代表切换了视频
- 避免不必要的 effect 执行

### 4. 为什么要状态去重和 HLS 特殊处理？

```typescript
// 状态去重
if (lastStatus.current === status) {
  return;
}

// HLS 特殊处理
if (lastStatus.current === 'readyToPlay' && status === 'loading') {
  return; // 忽略加载新分片时的临时状态
}
```

**原因**:
- HLS 流在加载新分片时会短暂切换到 loading
- 避免 `isPlayerReady` 频繁切换导致 UI 闪烁
- 减少不必要的状态更新和日志

## 五、时序图

```
Time →   0ms          50ms         100ms        150ms        200ms
         │            │            │            │            │
Feed     │ 点击视频    │            │            │            │
         ├───────────→│            │            │            │
Pool     │            │ acquire()  │ 返回 player│            │
         │            ├───────────→│            │            │
Nav      │            │            │ navigate() │            │
         │            │            ├───────────→│            │
Page     │            │            │            │ 挂载       │
         │            │            │            ├───────────→│
Sync     │            │            │            │ 检测 ready │
         │            │            │            │ ✓          │
Effect   │            │            │            │            │ play()
         │            │            │            │            ├─→ 播放
```

## 六、调试技巧

### 1. 查看自动播放日志

```typescript
// FullscreenVideoPlayer.tsx:106
log('fullscreen-video-player', LogType.INFO, `Auto-playing video on ready: ${videoMeta.id}`);
```

### 2. 查看播放器就绪日志

```typescript
// usePlayerEventSync.ts:44
log('video-player', LogType.DEBUG,
  `Player already ready on mount - duration: ${player.duration}s`);

// usePlayerEventSync.ts:94
log('video-player', LogType.DEBUG,
  `Video ready to play - duration: ${player.duration}s`);
```

### 3. 检查播放器状态

在浏览器控制台或调试器中：

```javascript
// 获取当前播放器实例
const player = useVideoStore.getState().currentPlayerMeta?.playerInstance;

// 检查状态
console.log('Player status:', player?.status);
console.log('Is playing:', player?.playing);
console.log('Current time:', player?.currentTime);
```

## 七、潜在问题和解决方案

### 问题 1: 视频不自动播放

**可能原因**:
1. `isPlayerReady` 未设置为 `true`
2. `lastAutoPlayedVideoIdRef` 已记录该视频 ID
3. 播放器实例为 `null`

**调试步骤**:
```typescript
// 在 FullscreenVideoPlayer 的 useEffect 中添加：
console.log('Auto-play check:', {
  isPlayerReady,
  playerInstance: !!playerInstance,
  videoId: videoMeta.id,
  lastPlayedId: lastAutoPlayedVideoIdRef.current,
  shouldPlay: isPlayerReady && playerInstance &&
              lastAutoPlayedVideoIdRef.current !== videoMeta.id
});
```

### 问题 2: 视频重复自动播放

**可能原因**:
- `videoMeta` 对象引用变化导致 `useEffect` 重复执行

**解决方案**:
- ✅ 只依赖 `videoMeta.id`（已实现）

### 问题 3: 预加载的视频不播放

**可能原因**:
- `usePlayerEventSync` 没有检查初始状态

**解决方案**:
- ✅ 在 `useEffect` 开始时检查 `player.status`（已实现）

## 八、总结

### 自动播放的三个关键要素

1. **播放器就绪检测**: `usePlayerEventSync` 提供 `isPlayerReady` 状态
2. **首次播放追踪**: `lastAutoPlayedVideoIdRef` 确保每个视频只自动播放一次
3. **响应式触发**: `useEffect` 在就绪状态变化时自动触发播放

### 设计优势

✅ **快速响应**: 预加载的视频几乎瞬时播放
✅ **可靠性**: 初始状态检查 + 事件监听双重保障
✅ **防重复**: 使用视频 ID 追踪，避免重复播放
✅ **低开销**: 使用 `ref` 而不是 `state`，避免不必要的渲染
✅ **HLS 优化**: 忽略加载分片时的临时状态变化

### 文件位置索引

| 功能 | 文件 | 关键行 |
|------|------|--------|
| 点击处理 | src/pages/feed/ui/FeedPage.tsx | 75-115 |
| 进入视频 | src/entities/video/hooks/useVideoDataLogic.ts | 39-71 |
| 全屏页面 | src/pages/video-fullscreen/ui/VideoFullscreenPage.tsx | 20-63 |
| 播放器组件 | src/features/video-player/ui/FullscreenVideoPlayer.tsx | 98-110 |
| 事件同步 | src/entities/video/hooks/videoview-sync/usePlayerEventSync.ts | 16-158 |
| 自动播放逻辑 | src/features/video-player/ui/FullscreenVideoPlayer.tsx | 103-110 |
