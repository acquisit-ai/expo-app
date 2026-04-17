# 条件自动播放逻辑分析与解决方案

## 问题陈述

### 当前行为（有问题）

| 场景 | 当前行为 | 期望行为 |
|------|---------|---------|
| Feed → Fullscreen | ✅ 自动播放 | ✅ 自动播放 |
| Detail (播放中) → Fullscreen | ✅ 继续播放 | ✅ 继续播放 |
| **Detail (暂停) → Fullscreen** | ❌ **自动播放** | ✅ **保持暂停** |

### 核心问题

当前的自动播放逻辑不区分导航来源和播放状态：

```typescript
// src/features/video-player/ui/FullscreenVideoPlayer.tsx:103-110
useEffect(() => {
  if (isPlayerReady && playerInstance &&
      lastAutoPlayedVideoIdRef.current !== videoMeta.id) {
    playerInstance.play(); // ❌ 无条件播放
    lastAutoPlayedVideoIdRef.current = videoMeta.id;
  }
}, [isPlayerReady, playerInstance, videoMeta.id]);
```

## 导航流程分析

### 场景 1: Feed → Fullscreen

```
FeedPage.handleVideoPress()
  ↓
useVideoDataLogic.enterVideoDetail(videoMeta)
  ↓
playerPoolManager.acquire() → 获取播放器实例
  ↓
setCurrentPlayerMeta() → 存储到 store
  ↓
navigation.navigate('VideoStack', {
    screen: 'VideoFullscreen',
    params: { videoId }  // ❌ 无法区分来源
  })
  ↓
FullscreenVideoPlayer 挂载
  ↓
自动播放逻辑触发 ✅
```

### 场景 2: Detail (暂停) → Fullscreen

```
VideoDetailPage (用户暂停视频)
  ↓
用户点击全屏按钮
  ↓
useVideoDetailLogic.enterFullscreen()
  ↓
navigation.replace('VideoFullscreen', {
    videoId  // ❌ 无法区分来源
  })
  ↓
FullscreenVideoPlayer 挂载
  ↓
自动播放逻辑触发 ❌ (不应该)
```

**关键问题**: 两个导航路径的 `params` 完全相同，无法区分来源！

## 解决方案对比

### 方案 1: 导航参数传递 autoPlay 标志 ⭐ **推荐**

#### 优点
- ✅ 明确的意图传递
- ✅ 导航参数清晰可见
- ✅ 易于调试和追踪
- ✅ 符合 React Navigation 最佳实践

#### 缺点
- ⚠️ 需要修改多个导航调用点
- ⚠️ 需要更新类型定义

#### 实现复杂度
🟢 低 - 约 4 个文件修改

#### 实现方案

**1. 更新导航类型定义**

```typescript
// src/shared/navigation/types.ts
export type VideoStackParamList = {
  VideoDetail: {
    videoId: string;
  };
  VideoFullscreen: {
    videoId: string;
    autoPlay?: boolean; // 🆕 自动播放标志（默认保持当前状态）
  };
};
```

**2. Feed → Fullscreen: 传递 autoPlay: true**

```typescript
// src/entities/video/hooks/useVideoDataLogic.ts
navigation.navigate('VideoStack', {
  screen: 'VideoFullscreen',
  params: {
    videoId: videoMeta.id,
    autoPlay: true, // 🆕 明确要求自动播放
  },
});
```

**3. Detail → Fullscreen: 不传递或传递 false**

```typescript
// src/pages/video-detail/model/useVideoDetailLogic.ts
navigation.replace('VideoFullscreen', {
  videoId,
  // 🆕 不传递 autoPlay，保持当前播放状态
});
```

**4. 修改自动播放逻辑**

```typescript
// src/features/video-player/ui/FullscreenVideoPlayer.tsx
export interface FullscreenVideoPlayerProps {
  // ... 其他 props
  autoPlay?: boolean; // 🆕 接收 autoPlay 参数
}

export const FullscreenVideoPlayer: React.FC<FullscreenVideoPlayerProps> = ({
  // ... 其他 props
  autoPlay,
}) => {
  const lastAutoPlayedVideoIdRef = useRef<string | null>(null);

  useEffect(() => {
    // ✅ 只在明确要求自动播放时才播放
    if (autoPlay &&
        isPlayerReady &&
        playerInstance &&
        lastAutoPlayedVideoIdRef.current !== videoMeta.id) {
      log('fullscreen-video-player', LogType.INFO,
        `Auto-playing video on ready (autoPlay=true): ${videoMeta.id}`);
      playerInstance.play();
      lastAutoPlayedVideoIdRef.current = videoMeta.id;
    }
  }, [autoPlay, isPlayerReady, playerInstance, videoMeta.id]);
};
```

**5. 传递参数到组件**

```typescript
// src/pages/video-fullscreen/ui/VideoFullscreenPage.tsx
export function VideoFullscreenPage() {
  const route = useRoute<VideoFullscreenScreenProps['route']>();
  const { videoId, autoPlay } = route.params; // 🆕 获取 autoPlay

  return (
    <FullscreenVideoPlayerSection
      autoPlay={autoPlay} // 🆕 传递给子组件
      // ... 其他 props
    />
  );
}

// src/widgets/fullscreen-video-player-section/ui/FullscreenVideoPlayerSection.tsx
export interface FullscreenVideoPlayerSectionProps {
  autoPlay?: boolean; // 🆕
  // ... 其他 props
}

export function FullscreenVideoPlayerSection({
  autoPlay,
  // ... 其他 props
}: FullscreenVideoPlayerSectionProps) {
  return (
    <FullscreenVideoPlayer
      autoPlay={autoPlay} // 🆕 传递给播放器
      // ... 其他 props
    />
  );
}
```

---

### 方案 2: 检查播放器当前状态

#### 优点
- ✅ 不需要修改导航参数
- ✅ 利用已有的播放状态

#### 缺点
- ❌ 逻辑不够明确（隐式判断）
- ❌ 播放器状态可能因异步原因不准确
- ❌ Detail 页面播放中切换全屏也会继续播放（符合预期，但逻辑混乱）

#### 实现复杂度
🟡 中 - 需要处理状态同步问题

#### 实现方案

```typescript
// src/features/video-player/ui/FullscreenVideoPlayer.tsx
useEffect(() => {
  // ✅ 只在播放器未播放且是新视频时才自动播放
  if (isPlayerReady &&
      playerInstance &&
      lastAutoPlayedVideoIdRef.current !== videoMeta.id &&
      !playerInstance.playing) { // 🆕 检查当前是否正在播放

    // ❌ 问题：无法区分"暂停后进入"和"首次进入"
    playerInstance.play();
    lastAutoPlayedVideoIdRef.current = videoMeta.id;
  }
}, [isPlayerReady, playerInstance, videoMeta.id]);
```

**问题**: 这个方案无法解决问题！
- Feed → Fullscreen: `playerInstance.playing = false` → 会自动播放 ✅
- Detail (暂停) → Fullscreen: `playerInstance.playing = false` → 会自动播放 ❌

两种情况的播放器状态完全相同，无法区分！

---

### 方案 3: 在 video store 中记录"播放意图"

#### 优点
- ✅ 集中式状态管理
- ✅ 不需要修改导航参数
- ✅ 可以记录更复杂的播放意图

#### 缺点
- ⚠️ 增加全局状态复杂度
- ⚠️ 需要在多处更新"意图"状态
- ⚠️ 状态需要及时清理，避免污染

#### 实现复杂度
🟡 中 - 需要管理额外的状态

#### 实现方案

**1. 扩展 video store**

```typescript
// src/entities/video/model/types.ts
export interface VideoStoreState {
  // ... 其他状态
  playbackIntent: 'auto-play' | 'keep-state' | null; // 🆕 播放意图
}

// src/entities/video/model/store.ts
export const useVideoStore = create<VideoStoreState>()((set) => ({
  // ... 其他状态
  playbackIntent: null,

  setPlaybackIntent: (intent: 'auto-play' | 'keep-state' | null) =>
    set({ playbackIntent: intent }),
}));
```

**2. Feed → Fullscreen: 设置 auto-play 意图**

```typescript
// src/entities/video/hooks/useVideoDataLogic.ts
const enterVideoDetail = useCallback(async (videoMeta: CurrentVideo['meta']) => {
  // ... 获取播放器实例

  // 🆕 设置自动播放意图
  const store = useVideoStore.getState();
  store.setPlaybackIntent('auto-play');

  navigation.navigate('VideoStack', {
    screen: 'VideoFullscreen',
    params: { videoId: videoMeta.id },
  });
}, [navigation]);
```

**3. Detail → Fullscreen: 设置 keep-state 意图**

```typescript
// src/pages/video-detail/model/useVideoDetailLogic.ts
const enterFullscreen = useCallback(() => {
  // 🆕 设置保持状态意图
  const store = useVideoStore.getState();
  store.setPlaybackIntent('keep-state');

  navigation.replace('VideoFullscreen', { videoId });
}, [navigation, videoId]);
```

**4. 修改自动播放逻辑**

```typescript
// src/features/video-player/ui/FullscreenVideoPlayer.tsx
const playbackIntent = useVideoStore(state => state.playbackIntent);
const setPlaybackIntent = useVideoStore(state => state.setPlaybackIntent);

useEffect(() => {
  // ✅ 只在意图为 auto-play 时才自动播放
  if (playbackIntent === 'auto-play' &&
      isPlayerReady &&
      playerInstance &&
      lastAutoPlayedVideoIdRef.current !== videoMeta.id) {

    playerInstance.play();
    lastAutoPlayedVideoIdRef.current = videoMeta.id;

    // 清理意图
    setPlaybackIntent(null);
  }
}, [playbackIntent, isPlayerReady, playerInstance, videoMeta.id, setPlaybackIntent]);
```

---

### 方案 4: 使用 Navigation State 判断来源

#### 优点
- ✅ 不需要修改导航参数
- ✅ 利用 React Navigation 内置功能

#### 缺点
- ❌ 依赖导航历史，不够可靠
- ❌ 逻辑复杂，难以维护
- ❌ 导航栈可能因为 replace 等操作变化

#### 实现复杂度
🔴 高 - 需要处理复杂的导航状态

#### 实现方案（不推荐）

```typescript
// src/pages/video-fullscreen/ui/VideoFullscreenPage.tsx
const navigation = useNavigation();
const navigationState = navigation.getState();

// ❌ 尝试通过导航历史判断来源
const isFromFeed = useMemo(() => {
  const routes = navigationState.routes;
  // 复杂的逻辑判断...
  // 不可靠！
}, [navigationState]);
```

## 推荐方案总结

### 🏆 方案 1: 导航参数传递 autoPlay 标志

**为什么推荐**:
1. ✅ **意图明确**: `autoPlay: true` 清楚地表达了自动播放的意图
2. ✅ **易于调试**: 导航参数在 React Navigation DevTools 中可见
3. ✅ **类型安全**: TypeScript 类型检查保证参数正确
4. ✅ **符合最佳实践**: React Navigation 推荐使用参数传递状态
5. ✅ **低复杂度**: 修改点明确，不增加全局状态

### 实现清单

- [ ] 1. 更新 `VideoStackParamList` 类型定义
- [ ] 2. 修改 `useVideoDataLogic.enterVideoDetail()` - 传递 `autoPlay: true`
- [ ] 3. 确认 `useVideoDetailLogic.enterFullscreen()` - 不传递 `autoPlay`
- [ ] 4. 修改 `VideoFullscreenPage` - 从 route.params 获取 `autoPlay`
- [ ] 5. 修改 `FullscreenVideoPlayerSection` - 传递 `autoPlay` 到子组件
- [ ] 6. 修改 `FullscreenVideoPlayer` - 接收 `autoPlay` 并修改自动播放逻辑
- [ ] 7. 测试三种场景：
  - [ ] Feed → Fullscreen (autoPlay=true) → 应该自动播放
  - [ ] Detail (播放中) → Fullscreen (无 autoPlay) → 应该继续播放
  - [ ] Detail (暂停) → Fullscreen (无 autoPlay) → 应该保持暂停

### 文件修改列表

1. `src/shared/navigation/types.ts` - 类型定义
2. `src/entities/video/hooks/useVideoDataLogic.ts` - Feed 导航
3. `src/pages/video-fullscreen/ui/VideoFullscreenPage.tsx` - 接收参数
4. `src/widgets/fullscreen-video-player-section/ui/FullscreenVideoPlayerSection.tsx` - 传递参数
5. `src/features/video-player/ui/FullscreenVideoPlayer.tsx` - 自动播放逻辑

**总计**: 5 个文件

## 测试场景

### 场景 1: Feed → Fullscreen (首次播放)

```
操作：在 Feed 页面点击视频卡片
预期：视频立即开始自动播放
验证：查看日志 "Auto-playing video on ready (autoPlay=true)"
```

### 场景 2: Detail (播放中) → Fullscreen

```
操作：
1. 在 Detail 页面播放视频
2. 点击全屏按钮
预期：视频继续播放（因为播放器已经在播放）
验证：视频无中断继续播放
```

### 场景 3: Detail (暂停) → Fullscreen ⭐ **关键场景**

```
操作：
1. 在 Detail 页面暂停视频
2. 点击全屏按钮
预期：视频保持暂停状态（不自动播放）
验证：播放器保持暂停，用户需要手动点击播放按钮
```

### 场景 4: Fullscreen → Detail → 再次进入 Fullscreen

```
操作：
1. 在 Fullscreen 页面暂停视频
2. 退出全屏到 Detail
3. 再次点击全屏
预期：视频保持暂停状态
验证：不自动播放
```

## 边界情况

### 1. 快速切换视频

```
操作：在 Feed 页面快速点击多个视频
预期：每个视频都应该自动播放（因为每次都是 autoPlay=true）
验证：lastAutoPlayedVideoIdRef 正确记录不同的视频 ID
```

### 2. 播放器未就绪时进入全屏

```
操作：点击未预加载的视频（冷启动）
预期：播放器加载完成后自动播放
验证：useEffect 在 isPlayerReady 变为 true 时触发
```

### 3. 从 Fullscreen 直接切换到另一个视频

```
操作：
1. 在 Fullscreen 页面播放视频 A
2. 返回 Feed
3. 点击视频 B
预期：视频 B 自动播放
验证：lastAutoPlayedVideoIdRef 更新为视频 B 的 ID
```

## 实现注意事项

1. **默认行为**: 如果 `autoPlay` 未定义（`undefined`），应该保持当前播放器状态，不做任何操作
2. **日志记录**: 在自动播放逻辑中记录 `autoPlay` 参数，便于调试
3. **类型安全**: 确保所有导航调用点都更新了类型定义
4. **向后兼容**: 如果有其他地方也导航到 Fullscreen，需要考虑是否传递 `autoPlay`

## 总结

**推荐使用方案 1（导航参数传递）**，因为：
- 明确的意图传递
- 低实现复杂度
- 易于维护和调试
- 符合 React Navigation 最佳实践

修改约 5 个文件，新增约 20 行代码即可完成。
