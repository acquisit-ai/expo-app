# Video Detail Page - Implementation Context

*详细的实现说明和技术决策文档*

## 📌 概述

本文档提供 Video Detail Page 的深度实现细节，补充 README.md 的架构说明，聚焦于实现决策、技术难点和最佳实践。

## 🏗️ 架构决策

### React Navigation 集成方案

#### 为什么使用 React Navigation 而非 Expo Router？

**历史背景**：
- v1.0 使用统一的 `VideoPlayerContainer` 组件同时挂载 Detail 和 Fullscreen
- v2.0 重构时需要拆分为独立页面，减少内存占用

**技术选择**：
- **最终选择**: React Navigation Stack + Modal
- **替代方案**: Expo Router（文件系统路由）

**选择 React Navigation 的原因**：
1. **更灵活的 Modal 控制**: 可以通过 `parent.goBack()` 精确控制 Modal 关闭
2. **类型安全**: 通过 `VideoStackParamList` 提供完整的类型推断
3. **动画定制**: 支持 SharedElement 转场动画（未来扩展）
4. **项目统一**: 项目已使用 React Navigation 作为主导航系统

### 页面与 Screen 的分离设计

#### 两层架构模式

```
VideoDetailScreen (src/screens/video/VideoDetailScreen.tsx)
    ↓ 包装层
VideoDetailPage (src/pages/video-detail/ui/VideoDetailPage.tsx)
    ↓ 业务逻辑层
useVideoDetailLogic (src/pages/video-detail/model/useVideoDetailLogic.ts)
```

**设计动机**：
- **Screen 层**: 仅负责接收 React Navigation props，薄包装层
- **Page 层**: 包含实际的 UI 和业务逻辑，可独立测试
- **Model 层**: 封装导航逻辑和页面特定行为

**优势**：
1. **关注点分离**: Screen 关注导航，Page 关注业务
2. **可测试性**: Page 组件可独立于导航系统进行测试
3. **可复用性**: Page 组件理论上可用于不同导航系统

## 🔄 导航流程深度解析

### replace() vs navigate() 的选择

#### 使用 replace() 的技术原因

```typescript
// ✅ 使用 replace
navigation.replace('VideoFullscreen', { videoId });

// ❌ 不使用 navigate
navigation.navigate('VideoFullscreen', { videoId });
```

**Stack 深度对比**：
```
使用 navigate():
[MainTabs, VideoStack[VideoDetail, VideoFullscreen]]  // 深度 = 2

使用 replace():
[MainTabs, VideoStack[VideoFullscreen]]  // 深度 = 1（替换）
```

**选择 replace() 的原因**：
1. **扁平化栈结构**: Detail ↔ Fullscreen 是平级关系，不是父子关系
2. **避免返回混乱**: 用户按返回键应该回到 Feed，而非在 Detail/Fullscreen 间循环
3. **内存优化**: 不保留历史页面，减少内存占用
4. **逻辑清晰**: Detail 和 Fullscreen 是同一视频的不同展示模式，不是导航历史

### parent.goBack() 的 Modal 控制

#### 为什么不直接 goBack()？

```typescript
// ❌ 直接 goBack() - 可能导致问题
navigation.goBack();

// ✅ 通过 parent 关闭整个 Modal
const parent = navigation.getParent();
if (parent) {
  parent.goBack();
}
```

**导航层级结构**：
```
RootNavigator
  ├── MainTabs (Stack)
  │   └── Feed
  └── VideoStack (Modal Stack) ← parent
      ├── VideoDetail ← current navigation
      └── VideoFullscreen
```

**技术细节**：
- `navigation.goBack()`: 在当前栈（VideoStack）内返回
- `parent.goBack()`: 关闭整个 VideoStack modal，返回 MainTabs

**使用场景**：
- **Detail → Feed**: 需要关闭整个 VideoStack，使用 `parent.goBack()`
- **Fullscreen → Detail**: 在 VideoStack 内切换，使用 `replace()`

## 🎯 状态管理策略

### 直接读取 Zustand vs 通用 Hook

#### 为什么不使用 useVideoPageLifecycle？

**README 中提到的 v1.0 设计**：
```typescript
// v1.0 设计（已废弃）
const { currentVideo, isReady } = useVideoPageLifecycle('video-detail-page');
```

**v2.0 实际实现**：
```typescript
// v2.0 实现
const currentVideo = useVideoStore(selectCurrentVideo);
const currentPlayer = useVideoStore(selectPlayerInstance);
const isReady = !!currentVideo && !!currentPlayer;
```

**设计决策**：
- **移除中间层**: 不需要通用生命周期 Hook，直接读取 Entity 状态
- **简化依赖**: 减少一层抽象，代码更直观
- **类型安全**: Zustand selector 提供更好的类型推断

**优势**：
1. **透明性**: 可以清楚看到依赖哪些状态
2. **灵活性**: 可以按需选择不同的 selector
3. **性能**: 减少不必要的中间层开销

### 视频状态的来源

```typescript
// 状态流向
Feed 页面设置当前视频
    ↓
useVideoStore.setCurrentPlayerMeta({ meta, playerInstance })
    ↓
VideoDetailPage 读取
    ↓
const currentVideo = useVideoStore(selectCurrentVideo)
```

**关键点**：
- 视频状态由 Feed 页面在导航前设置
- Detail 页面只读取，不修改视频状态
- 播放器实例在页面切换时保持不变

## 🎬 滚动联动实现

### 回调传递模式

```typescript
// 1. SmallVideoPlayerSection 创建滚动处理器
const scrollHandler = Animated.event(
  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
  { useNativeDriver: true }
);

// 2. 通过回调传递给父组件
onScrollHandler(scrollHandler);

// 3. Page 组件接收并设置到 ScrollView
const [scrollHandler, setScrollHandler] = useState(null);
const handleScrollHandler = useCallback((handler) => {
  setScrollHandler(() => handler);
}, []);

<Animated.ScrollView onScroll={scrollHandler} />
```

**设计动机**：
- **解耦**: Widget 不直接访问 Page 的 ref
- **灵活**: Page 可以控制何时启用滚动联动
- **类型安全**: 回调函数有明确的类型定义

**技术细节**：
- 使用 `setScrollHandler(() => handler)` 而非 `setScrollHandler(handler)`
- 原因：handler 本身是函数，需要用函数包装避免 React 误将其作为 setState 的更新函数

## 🔒 方向锁定实现

### 异步操作的安全模式

```typescript
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

**内存安全模式要点**：
1. **mounted flag**: 跟踪组件挂载状态
2. **清理函数**: 立即设置 `mounted = false`
3. **条件日志**: 仅在 mounted 时记录日志

**为什么需要？**：
- 防止在组件卸载后尝试更新状态或记录日志
- 异步操作可能在组件卸载后完成
- React 18 严格模式会触发 mount/unmount 循环

## 🐛 错误处理策略

### 资源缺失的处理

```typescript
const isReady = !!currentVideo && !!currentPlayer;

if (!isReady || !currentVideo) {
  return (
    <View style={styles.errorContainer}>
      <Text variant="headlineSmall">视频未找到</Text>
      <Text variant="bodyMedium">请从视频列表重新选择</Text>
    </View>
  );
}
```

**设计考虑**：
- **用户友好**: 提供清晰的错误提示
- **非阻塞**: 不使用 Alert 或 Modal，保持 UI 可见
- **引导性**: 告诉用户如何恢复（返回列表）

**何时会发生**：
- 用户直接深度链接到 Detail 页面
- 应用状态被系统清理（后台杀死）
- 开发环境热重载导致状态丢失

## 📊 性能优化细节

### useCallback 优化

```typescript
const handleScrollHandler = useCallback(
  (handler: (event: NativeSyntheticEvent<NativeScrollEvent>) => void) => {
    setScrollHandler(() => handler);
  },
  [] // 空依赖数组，函数引用永远不变
);

const enterFullscreen = useCallback(() => {
  navigation.replace('VideoFullscreen', { videoId });
}, [navigation, videoId]); // 仅在这些值变化时重新创建
```

**优化目标**：
- 避免子组件不必要的重渲染
- 稳定的函数引用可以作为 props 或依赖项

### 动态样式的 useMemo

```typescript
const dynamicStyles = useMemo(
  () =>
    StyleSheet.create({
      scrollContent: {
        minHeight: '100%',
        backgroundColor: theme.colors.background,
      },
    }),
  [theme] // 仅在主题变化时重新计算
);
```

**优化原理**：
- `StyleSheet.create()` 在每次渲染时调用会产生新对象
- useMemo 缓存样式对象，避免不必要的重新创建

## 🔗 与其他模块的集成

### Widget 集成

```typescript
<SmallVideoPlayerSection
  onScrollHandler={handleScrollHandler}  // 滚动联动
  onToggleFullscreen={enterFullscreen}   // 全屏切换
  onBack={backToFeed}                     // 返回导航
  playbackMode={PlaybackMode.SMALL_SCREEN}
/>
```

**职责划分**：
- **Widget**: 负责 UI 展示和用户交互
- **Page**: 负责导航逻辑和状态协调

### Feature 集成

```typescript
<VideoInfoDisplaySection />
```

**数据流**：
- Feature 直接从 Zustand 读取当前视频信息
- 不需要 Page 传递 props
- 保持单一数据源原则

## 🧪 测试考虑

### 单元测试重点

**Page 组件测试**：
- 模拟 Zustand store 状态
- 验证错误状态 UI
- 验证导航回调被正确调用

**Hook 测试**：
- 模拟 React Navigation hooks
- 验证 replace() 调用
- 验证 parent.goBack() 调用

### 集成测试重点

**导航流程测试**：
- Detail → Fullscreen 切换
- Detail → Feed 返回
- 验证栈深度保持为 1

## 📝 维护注意事项

### 导航系统变更

如果未来需要切换导航系统（如迁移到 Expo Router）：

1. **保持 Page 组件不变**: 只修改 Screen wrapper
2. **更新 model/useVideoDetailLogic**: 替换 React Navigation hooks
3. **更新类型定义**: 修改 navigation/types.ts

### 状态管理变更

如果需要修改视频状态结构：

1. **更新 Entity 层**: entities/video
2. **更新 Selector**: selectCurrentVideo, selectPlayerInstance
3. **Page 组件自动适配**: 通过 selector 解耦

## 🎓 学习要点

**对于新团队成员**：

1. **理解 FSD 分层**: Page → Widget/Feature → Entity
2. **理解导航栈**: Modal + Stack 的两层结构
3. **理解 replace() 模式**: 平级页面切换的最佳实践
4. **理解状态流**: Feed 设置 → Store 存储 → Detail 读取

**常见误区**：

1. ❌ 在 Page 中管理视频状态 → ✅ 从 Entity 读取
2. ❌ 使用 navigate() 切换页面 → ✅ 使用 replace()
3. ❌ 直接 goBack() 返回 Feed → ✅ 使用 parent.goBack()
4. ❌ 在 Page 中清理状态 → ✅ 在 Feed 的 useFocusEffect 中清理

---

**最后更新**: 2025-10-01
**维护者**: 参考 CODEOWNERS
**相关文档**: README.md, 导航类型定义, Video Entity 文档
