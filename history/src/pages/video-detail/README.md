# Video Detail Page v2.0

**小屏视频详情页面模块** | **最新版本**: v2.0 (2025-10-01)

## 📋 概述

小屏视频详情页面是应用的核心播放模块，负责在竖屏小窗模式下展示视频内容和相关信息。该页面遵循 **Feature-Sliced Design (FSD)** 架构原则，是 v2.0 架构重构的重要成果。

## 🎯 v2.0 架构重构

### 重构背景
- **v1.0 问题**: 大小屏页面在统一容器中同时挂载，内存占用 2x
- **v2.0 方案**: 拆分为独立路由，按需加载，内存占用减半至 1x
- **迁移日期**: 2025-10-01

### 重构收益
- ✅ **内存优化**: 从双页面挂载优化为单页面挂载（50% 内存节省）
- ✅ **架构清晰**: 页面职责分离，逻辑边界明确
- ✅ **类型安全**: 使用 React Navigation 类型化路由和参数
- ✅ **导航优化**: 使用 `navigation.replace()` 保持扁平化导航栈
- ✅ **状态连续**: 页面切换时播放器状态无缝衔接

## 🏗️ 架构设计

### FSD 层级定位
- **层级**: `pages` (页面层)
- **职责**: 组装 Widgets 和 Features，处理页面特定逻辑
- **依赖关系**: 正确调用下层模块，不被任何层级依赖
- **导航集成**: React Navigation Stack Screen（通过 VideoStackNavigator）

### 目录结构
```
src/pages/video-detail/
├── index.ts                       # 公共API入口
├── ui/
│   └── VideoDetailPage.tsx       # 主页面组件
├── model/
│   └── useVideoDetailLogic.ts    # 页面特定逻辑（React Navigation）
├── README.md                      # 本文档
└── CONTEXT.md                     # 详细实现上下文
```

### React Navigation 集成架构
```
RootNavigator (Modal)
  └── VideoStack (Stack Navigator)
      ├── VideoDetail (此页面) ← 包装在 VideoDetailScreen
      └── VideoFullscreen

Screen Wrapper:
src/screens/video/VideoDetailScreen.tsx
  → 包装 VideoDetailPage 组件
  → 提供 React Navigation props
```

### 核心设计模式

#### 1. 逻辑分层架构
```typescript
VideoDetailScreen (React Navigation wrapper)
    ↓
VideoDetailPage (ui) [直接从 Zustand 读取状态]
    ↓
useVideoDetailLogic (页面特定逻辑) [使用 React Navigation hooks]
    ↓
@/entities/video (视频实体状态管理)
```

#### 2. Hook 职责分离
- **useVideoDetailLogic**: 详情页特定逻辑（方向锁定、全屏切换、返回导航）
  - 使用 `useNavigation()` 和 `useRoute()` 获取 React Navigation API
  - 从 `route.params` 获取 `videoId` 参数
  - 调用 `navigation.replace('VideoFullscreen', { videoId })` 切换到全屏
  - 调用 `parent.goBack()` 返回 Feed 页面

## 🎯 核心功能

### 1. 状态获取和生命周期
```typescript
// 直接从 Zustand store 读取状态
const currentVideo = useVideoStore(selectCurrentVideo);
const currentPlayer = useVideoStore(selectPlayerInstance);
const isReady = !!currentVideo && !!currentPlayer;

// 页面挂载日志
React.useEffect(() => {
  log('video-detail-page', LogType.INFO, `Page mounted for video: ${currentVideo?.meta.id}`);
}, [currentVideo?.meta.id]);

// ✅ 简化设计：
// - 直接从 Entity 层读取状态（Zustand）
// - 不需要中间层生命周期 Hook
// - 页面职责清晰：UI渲染 + 用户交互
```

### 2. 屏幕方向锁定
```typescript
// 页面挂载时锁定竖屏
useEffect(() => {
  let mounted = true;

  const lockOrientation = async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      if (mounted) {
        log(LOG_TAG, LogType.INFO, 'Orientation locked to portrait');
      }
    } catch (error) {
      if (mounted) {
        log(LOG_TAG, LogType.WARNING, `Failed to lock orientation: ${error}`);
      }
    }
  };

  lockOrientation();

  return () => {
    mounted = false;
  };
}, []);
```

### 3. 进入全屏导航（React Navigation）
```typescript
const enterFullscreen = useCallback(() => {
  log(LOG_TAG, LogType.INFO, `Entering fullscreen for video: ${videoId}`);

  // 🔑 使用 navigation.replace() 避免栈积累
  // 栈深度保持不变：[MainTabs, VideoStack(VideoFullscreen)]
  navigation.replace('VideoFullscreen', { videoId });
}, [navigation, videoId]);
```

### 4. 返回 Feed 导航（React Navigation）
```typescript
const backToFeed = useCallback(() => {
  log(LOG_TAG, LogType.INFO, 'Navigating back to feed');

  // 🔑 关闭整个 VideoStack modal
  const parent = navigation.getParent();
  if (parent) {
    parent.goBack();
  }
}, [navigation]);
```

### 5. 滚动联动处理
```typescript
const [scrollHandler, setScrollHandler] = useState<...>(null);

const handleScrollHandler = useCallback((handler: ...) => {
  setScrollHandler(() => handler);
}, []);

// 传递给播放器组件实现视频播放器与内容滚动的联动
<SmallVideoPlayerSection
  onScrollHandler={handleScrollHandler}
  onToggleFullscreen={enterFullscreen}
  playbackMode={PlaybackMode.SMALL_SCREEN}
/>

<Animated.ScrollView onScroll={scrollHandler}>
  {/* 视频信息展示 */}
</Animated.ScrollView>
```

## 🔧 技术实现

### 页面组件架构
```typescript
export function VideoDetailPage() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // 🔑 直接从 Zustand 读取状态
  const currentVideo = useVideoStore(selectCurrentVideo);
  const currentPlayer = useVideoStore(selectPlayerInstance);
  const isReady = !!currentVideo && !!currentPlayer;

  // 🔑 页面特定逻辑（React Navigation）
  const { enterFullscreen, backToFeed } = useVideoDetailLogic();

  // 🎯 滚动联动处理
  const [scrollHandler, setScrollHandler] = useState<...>(null);

  const handleScrollHandler = useCallback((handler: ...) => {
    setScrollHandler(() => handler);
  }, []);

  // 🚫 错误状态
  if (!isReady || !currentVideo) {
    return (/* 错误 UI */);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 小屏视频播放器 */}
      <SmallVideoPlayerSection
        onScrollHandler={handleScrollHandler}
        onToggleFullscreen={enterFullscreen}
        onBack={backToFeed}
        playbackMode={PlaybackMode.SMALL_SCREEN}
      />

      {/* 滚动内容区域 */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={1}
      >
        <VideoInfoDisplaySection />
      </Animated.ScrollView>
    </View>
  );
}

// Screen Wrapper（位于 src/screens/video/VideoDetailScreen.tsx）
export function VideoDetailScreen({ navigation, route }: VideoDetailScreenProps) {
  // 直接使用 Page 组件，videoId 在 useVideoDetailLogic 中通过 useRoute() 获取
  return <VideoDetailPage />;
}
```

### 导航流程设计（React Navigation）

#### 入口流程（不常用）
```
Feed 页面（MainTabs）
    ↓
用户点击视频（默认进入全屏）
    ↓
navigation.navigate('VideoStack', { screen: 'VideoFullscreen', params: { videoId } })
    ↓
VideoStack modal 打开 → VideoFullscreenPage 挂载
    ↓
用户点击退出全屏按钮
    ↓
navigation.replace('VideoDetail', { videoId }) → VideoDetailPage 挂载
```

**注意**: 默认流程是 Feed → Fullscreen，Detail 页面主要用于从全屏退出到小屏查看详情的场景。

#### 全屏切换流程
```
VideoDetailPage
    ↓
用户点击全屏按钮
    ↓
enterFullscreen() → navigation.replace('VideoFullscreen', { videoId })
    ↓
VideoStack 中当前 screen 替换为 VideoFullscreen
    ↓
VideoFullscreenPage 挂载，播放器状态保持（不清理）
```

#### 返回 Feed 流程
```
VideoDetailPage
    ↓
用户点击返回按钮 / 硬件返回键
    ↓
backToFeed() → parent.goBack()
    ↓
VideoStack modal 关闭 → 返回 Feed 页面
    ↓
Feed 页面 useFocusEffect 触发
    ↓
调用清理逻辑清理视频状态
```

### 关键导航特性

#### 1. 类型安全路由（React Navigation）
```typescript
// ✅ TypeScript 类型推断
const navigation = useNavigation<VideoDetailScreenProps['navigation']>();
const route = useRoute<VideoDetailScreenProps['route']>();
const { videoId } = route.params; // 类型安全的参数访问

// ✅ 编译时类型检查
navigation.replace('VideoFullscreen', { videoId }); // 正确
navigation.replace('VideoFullscreen', {}); // ❌ 编译错误：缺少 videoId
```

#### 2. 扁平导航栈（Modal + Replace）
```typescript
// 使用 navigation.replace() 保持 VideoStack 深度为 1
// 栈结构始终为: [MainTabs, VideoStack]

// Detail ↔ Fullscreen 切换
navigation.replace('VideoFullscreen', { videoId }); // Detail → Fullscreen
navigation.replace('VideoDetail', { videoId });     // Fullscreen → Detail

// 返回 Feed（关闭整个 modal）
const parent = navigation.getParent();
if (parent) {
  parent.goBack(); // 关闭 VideoStack modal
}
```

#### 3. 导航配置
```typescript
// VideoStackNavigator 配置
<Stack.Navigator
  initialRouteName="VideoFullscreen"
  screenOptions={{
    headerShown: false,      // 隐藏导航栏
    gestureEnabled: true,    // 启用手势（Android 硬件返回键）
  }}
>
  <Stack.Screen name="VideoDetail" component={VideoDetailScreen} />
  <Stack.Screen name="VideoFullscreen" component={VideoFullscreenScreen} />
</Stack.Navigator>
```

## ⚡ 性能优化

### 内存优化
- **单页面挂载**: 相比 v1.0 双页面挂载，内存占用减半
- **按需加载**: 仅在需要时挂载详情页面
- **资源共享**: 播放器实例在页面间共享，无重复创建

### 状态管理优化
- **轻量 Hook**: `useVideoDetailLogic` 仅包含页面特定逻辑
- **状态复用**: 通过 `useVideoStore` 复用视频和播放器状态
- **滚动优化**: 使用 Reanimated 实现高性能滚动联动

### 清理策略
- **无自动清理**: 页面失焦时不清理视频状态（避免 router.replace 导致的误清理）
- **Feed 负责清理**: 清理逻辑集中在 Feed 页面的 `useFocusEffect` 中
- **播放器保持**: 页面切换时播放器状态连续，无中断

## 🔄 状态流转

### 播放器状态管理
```
useVideoStore (Zustand)
    ↓
currentPlayerMeta: {
  meta: VideoMeta,          // 视频元数据
  playerInstance: Player,   // 播放器实例
  playerCreatedAt: number   // 创建时间戳
}
    ↓
useVideoPageLifecycle 读取
    ↓
VideoDetailPage 使用
```

### 滚动联动流程
```
SmallVideoPlayerSection
    ↓
创建滚动处理器 (Animated.event)
    ↓
通过 onScrollHandler 回调传递
    ↓
VideoDetailPage 接收
    ↓
设置到 Animated.ScrollView
    ↓
滚动时播放器自动调整位置
```

## 🛡️ 错误处理

### 资源检查机制
```typescript
// useVideoPageLifecycle 自动检查
const isReady = useMemo(() => {
  return !!currentVideo && !!currentPlayer;
}, [currentVideo, currentPlayer]);

const error = useMemo(() => {
  if (!currentVideo) return 'current video missing';
  if (!currentPlayer) return 'player instance missing';
  return null;
}, [currentVideo, currentPlayer]);
```

### 错误状态 UI
```typescript
if (!isReady || !currentVideo) {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.errorContainer}>
        <Text variant="bodyLarge" style={{ color: '#fff' }}>
          视频加载失败
        </Text>
        <Text variant="bodyMedium" style={{ color: '#999', marginTop: 8 }}>
          请返回重试
        </Text>
      </View>
    </>
  );
}
```

### 方向锁定错误处理
```typescript
try {
  await ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP
  );
  if (mounted) {
    log(LOG_TAG, LogType.INFO, 'Orientation locked to portrait');
  }
} catch (error) {
  if (mounted) {
    log(LOG_TAG, LogType.WARNING, `Failed to lock orientation: ${error}`);
  }
}
```

## 📊 集成架构

### 依赖关系
```typescript
VideoDetailPage
  ├── @/pages/video-player (通用生命周期)
  ├── @/widgets/small-video-player-section (小屏播放器UI)
  ├── @/widgets/video-info-display-section (视频信息展示)
  ├── @/entities/video (视频状态和逻辑)
  ├── @/shared/providers/ThemeProvider (主题系统)
  ├── @/shared/lib/logger (日志系统)
  └── expo-router (路由导航)
```

### Widget 组件使用
```typescript
// 小屏播放器
<SmallVideoPlayerSection
  onScrollHandler={handleScrollHandler}  // 滚动联动回调
  onToggleFullscreen={enterFullscreen}   // 全屏切换回调
  playbackMode={PlaybackMode.SMALL_SCREEN}
/>

// 视频信息展示
<VideoInfoDisplaySection />
```

## 📝 v2.0 更新日志 (2025-10-01)

### 🚀 重大重构

#### **独立路由架构（React Navigation）**
- 从统一容器 (`VideoPlayerContainer`) 分离为独立 Stack Screen
- 使用 React Navigation 的类型化导航系统
- 路由定义：`VideoStackParamList` in `@/shared/navigation/types`
- Screen Wrapper：`src/screens/video/VideoDetailScreen.tsx`

#### **逻辑分层优化**
```typescript
// v1.0: 统一容器中混合逻辑
VideoPlayerContainer
  ├── VideoDetailPageContent
  └── VideoFullscreenPageContent

// v2.0: 清晰分层（React Navigation）
VideoDetailScreen (Wrapper)
    ↓
VideoDetailPage (UI)
    ↓
useVideoDetailLogic (React Navigation hooks)
```

#### **导航策略升级（React Navigation）**
- ✅ 使用 `navigation.replace()` 保持扁平导航栈
- ✅ 使用 `parent.goBack()` 关闭 Modal Stack
- ✅ 类型安全路由参数 (`VideoStackParamList`)
- ✅ 编译时类型检查（TypeScript 推断）

#### **清理策略重构**
- ✅ 移除页面自动清理（避免 navigation.replace 误清理）
- ✅ 清理责任转移至 Feed 页面的 useFocusEffect
- ✅ 播放器状态在页面切换时保持连续

### 🛡️ 稳定性提升

#### **内存安全模式**
- 组件挂载状态跟踪 (`mounted` flag)
- 异步操作中检查挂载状态
- useEffect 清理函数立即标记卸载

#### **类型安全强化**
- 零 `any` 类型使用
- React Navigation 类型化导航和参数
- TypeScript 严格模式通过

#### **错误恢复机制**
- 资源缺失时展示友好错误 UI
- 方向锁定失败不阻塞渲染
- 详细日志记录便于调试

### 📈 架构成熟度

- **完整 FSD 实现**: 展示了 Page 层的正确职责边界
- **导航最佳实践**: React Navigation Modal + Stack 的正确使用
- **类型安全设计**: 完整的 TypeScript 类型推断链
- **性能优化**: 内存占用减半，滚动联动流畅

---

## 🔗 相关文档

- [Video Fullscreen Page](../video-fullscreen/README.md) - 全屏播放页文档
- [Feed Page](../feed/README.md) - Feed 页面文档
- [Video Player Common](../video-player/README.md) - 通用播放器逻辑
- [Player Pool Entity](../../entities/player-pool/README.md) - 播放器池管理

---

**注意**: 该 Page v2.0 展示了 FSD 架构重构的最佳实践，通过 React Navigation 的独立 Stack Screen 和逻辑分层，实现了高性能、高可维护性的小屏播放体验。滚动联动和方向锁定确保了优秀的用户交互体验。
