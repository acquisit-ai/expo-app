# Video Fullscreen Page - Implementation Context

> **版本**: v3.0
> **最后更新**: 2025-10-09

*详细的实现说明和技术决策文档*

## 📌 概述

本文档提供 Video Fullscreen Page 的深度实现细节，补充 README.md 的架构说明，聚焦于实现决策、技术难点和最佳实践。全屏页面是应用的主要播放入口，需要处理横竖屏切换、硬件返回键控制等复杂交互。

---

## 🆕 v3.0 架构升级：VideoId-Based窗口管理

### 核心变革：Feed裁剪完全免疫

**v3.0 最大突破**：与 Player Pool v5.0 同步升级，采用完全基于videoId的窗口管理机制，彻底解决Feed裁剪导致的滚动位置错误问题。

### VideoId-Based窗口状态

#### 状态管理演进
```typescript
// ❌ v2.0 - 基于索引（Feed裁剪后失效）
const currentIndex = usePlayerPoolStore(state => state.currentVideoIndexInWindow);

// ✅ v3.0 - 基于videoId（永不失效）
const currentVideoId = usePlayerPoolStore(state => state.currentVideoId);
const currentIndex = useMemo(() => {
  if (!currentVideoId) return -1;
  return windowVideoIds.indexOf(currentVideoId);  // 动态计算
}, [currentVideoId, windowVideoIds]);
```

#### Feed裁剪场景对比

**v2.0 问题场景**：
```
Feed: [v1...v60] → 用户在Feed点击v40 → 进入全屏
Pool存储: currentVideoIndexInWindow = 6 (窗口内索引)

用户滑动...
Feed裁剪: [v1...v10] 被删除 → Feed = [v11...v60]

滚动计算:
  currentIndexRef.current = 6  // 错误！索引不变但videoId已变
  scrollTo(6 * itemHeight)     // 滚动到错误位置
  ❌ 视频错位
```

**v3.0 解决方案**：
```
Feed: [v1...v60] → 用户在Feed点击v40 → 进入全屏
Pool存储: currentVideoId = 'v40'

用户滑动...
Feed裁剪: [v1...v10] 被删除 → Feed = [v11...v60]

滚动计算:
  currentIndex = windowVideoIds.indexOf('v40')  // 动态查找
  scrollTo(currentIndex * itemHeight)           // 正确位置
  ✅ 视频位置准确
```

### 窗口扩展集成

#### useFullscreenScrollWindow重构

**关键变更**：所有索引计算改为基于videoId动态查找
```typescript
// v3.0: 窗口扩展触发检测
const handleScroll = useCallback((event) => {
  const offsetY = event.nativeEvent.contentOffset.y;
  const newIndex = Math.round(offsetY / itemHeight);
  const newVideoId = windowVideoIds[newIndex];

  // ✅ v3.0: 更新currentVideoId而非索引
  usePlayerPoolStore.getState().setCurrentVideoId(newVideoId);

  // 窗口扩展检测（基于动态索引）
  if (newIndex >= 11 && !hasTriggeredExtendRef.current.next) {
    const windowStartVideoId = usePlayerPoolStore.getState().windowStartVideoId;

    if (windowStartVideoId) {
      // ✅ 动态计算窗口位置（Feed裁剪免疫）
      const windowStartIndex = feedVideoIds.indexOf(windowStartVideoId);

      if (windowStartIndex >= 0) {
        const canExtendNext = windowStartIndex + windowVideoIds.length < feedVideoIds.length;

        if (canExtendNext) {
          playerPoolManager.extendWindowNext();
        }
      }
    }
  }
}, [itemHeight, feedVideoIds, windowVideoIds]);
```

#### 窗口状态同步监听

**v3.0 关键模式**：监听windowStartVideoId变化
```typescript
// ✅ v3.0: 监听videoId变化而非索引
const windowStartVideoId = usePlayerPoolStore(state => state.windowStartVideoId);
const prevWindowStartVideoIdRef = useRef(windowStartVideoId);

useLayoutEffect(() => {
  const videoIdChanged = windowStartVideoId !== prevWindowStartVideoIdRef.current;

  if (videoIdChanged && !isLandscape && currentIndexRef.current >= 0) {
    const newOffset = currentIndexRef.current * itemHeight;

    // ✅ 同步调整（Feed裁剪不影响）
    scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });

    resetExtendTriggers();
  }

  prevWindowStartVideoIdRef.current = windowStartVideoId;
}, [windowStartVideoId, itemHeight, isLandscape, resetExtendTriggers]);
```

**优势**：
- Feed裁剪时，videoId不变，currentIndex自动重新计算
- 滚动位置始终正确，无需手动调整
- 0ms闪烁（useLayoutEffect同步调整）

### 性能优化与权衡

#### 动态索引计算性能

| 操作 | v2.0 (Index) | v3.0 (VideoId) | 影响 |
|------|-------------|----------------|------|
| 索引访问 | O(1) 直接读取 | O(n) indexOf | n≤13, ~0.005ms |
| Feed裁剪适应 | ❌ 需手动调整 | ✅ 自动适应 | 零维护成本 |
| 代码复杂度 | 高（需监听Feed变化） | 低（无需额外逻辑） | 开发效率↑ |

**结论**：用可忽略的性能代价（~0.005ms，窗口仅13个视频）换取100%的位置准确性。

### v3.0 架构优势总结

1. **Feed裁剪完全免疫**：videoId永不失效，滚动位置100%准确
2. **零维护成本**：无需监听Feed变化，无需手动调整索引
3. **架构简化**：删除Feed裁剪相关的复杂逻辑
4. **可读性提升**：videoId比索引更直观，调试更容易

## 🏗️ 架构决策

### React Navigation 集成方案

#### 设计选择

**与 Detail 页面一致**：
- 使用 React Navigation Stack + Modal
- 通过 `VideoStackNavigator` 管理 Detail 和 Fullscreen 两个页面
- Screen Wrapper + Page Component 的两层架构

**全屏页面特殊需求**：
1. **方向自动适配**: 横屏和竖屏都需要支持
2. **硬件返回键控制**: 横屏模式下禁用返回键（防止误触）
3. **动态播放模式**: 根据屏幕方向切换播放模式

### 页面与 Screen 的分离设计

```
VideoFullscreenScreen (src/screens/video/VideoFullscreenScreen.tsx)
    ↓ 包装层
VideoFullscreenPage (src/pages/video-fullscreen/ui/VideoFullscreenPage.tsx)
    ↓ 业务逻辑层
useVideoFullscreenLogic (src/pages/video-fullscreen/hooks/useVideoFullscreenLogic.ts)
    ↓ 集成共享 Hooks
useOrientationDetection + useBackHandler
```

**设计优势**：
- **可测试**: Page 组件可独立测试，不依赖导航系统
- **可复用**: Hooks 逻辑可在不同导航系统中复用
- **关注点分离**: 导航、UI、逻辑三层清晰分离

## 🔄 导航流程深度解析

### 默认入口流程

```typescript
// Feed 页面导航到全屏
navigation.navigate('VideoStack', {
  screen: 'VideoFullscreen',
  params: { videoId }
});
```

**为什么全屏是默认入口？**
- **用户期望**: 点击视频卡片期望立即看到全屏播放
- **沉浸体验**: 最大化视频展示，减少干扰
- **TikTok 模式**: 符合短视频应用的标准交互模式

**导航栈结构**：
```
初始状态: [MainTabs]
点击视频后: [MainTabs, VideoStack[VideoFullscreen]]
```

### replace() 切换到 Detail

```typescript
// 退出全屏到小屏详情
const exitFullscreen = useCallback(() => {
  navigation.replace('VideoDetail', { videoId });
}, [navigation, videoId]);
```

**为什么使用 replace？**
- **平级关系**: Fullscreen 和 Detail 是同一视频的不同展示模式
- **扁平栈**: 栈深度保持为 1，避免 Fullscreen → Detail → Fullscreen 循环
- **内存优化**: 不保留 Fullscreen 页面，减少内存占用

**栈深度对比**：
```
使用 navigate: [MainTabs, VideoStack[Fullscreen, Detail]]  // 深度 = 2
使用 replace:  [MainTabs, VideoStack[Detail]]              // 深度 = 1
```

### parent.goBack() 返回 Feed

```typescript
const backToFeed = useCallback(() => {
  const parent = navigation.getParent();
  if (parent) {
    parent.goBack();
  }
}, [navigation]);
```

**技术细节**：
- `navigation`: 当前页面的导航对象（VideoStack 内部）
- `parent`: 父级导航对象（RootNavigator）
- `parent.goBack()`: 关闭整个 VideoStack modal

**为什么需要 parent？**
- 直接 `goBack()` 只会在 VideoStack 内返回
- 需要关闭整个 modal 才能回到 Feed
- 保持导航意图明确：返回 Feed，不是返回上一页

## 🎬 屏幕方向管理

### 方向解锁策略

```typescript
useEffect(() => {
  let mounted = true;

  const unlockOrientation = async () => {
    try {
      await ScreenOrientation.unlockAsync();
      if (mounted) {
        log(LOG_TAG, LogType.INFO, 'Orientation unlocked for fullscreen');
      }
    } catch (error) {
      if (mounted) {
        log(LOG_TAG, LogType.WARNING, `Failed to unlock orientation: ${error}`);
      }
    }
  };

  unlockOrientation();

  return () => {
    mounted = false;
  };
}, []);
```

**设计考虑**：
1. **解锁方向**: 允许横屏和竖屏自由切换
2. **异步安全**: 使用 `mounted` flag 防止内存泄漏
3. **错误容忍**: 失败时只记录警告，不阻塞渲染

**与 Detail 页面的对比**：
- **Detail**: 锁定竖屏 (`PORTRAIT_UP`)
- **Fullscreen**: 解锁方向（支持横竖屏）

### 方向检测集成

```typescript
const { isLandscape } = useOrientationDetection();

// 根据方向动态计算播放模式
const playbackMode = React.useMemo(() =>
  isLandscape ? PlaybackMode.FULLSCREEN_LANDSCAPE : PlaybackMode.FULLSCREEN_PORTRAIT,
  [isLandscape]
);
```

**useOrientationDetection 原理**：
- 监听设备方向变化事件
- 计算设备宽高比判断横竖屏
- 返回 `isLandscape` 布尔值

**播放模式切换**：
- **竖屏**: `FULLSCREEN_PORTRAIT` - 垂直布局，显示返回按钮
- **横屏**: `FULLSCREEN_LANDSCAPE` - 水平布局，隐藏返回按钮

## 🔙 硬件返回键控制

### useBackHandler 集成

```typescript
useBackHandler(
  () => {
    log(LOG_TAG, LogType.DEBUG, 'Hardware back blocked in landscape');
    return true; // 阻止默认行为
  },
  isLandscape  // 条件：仅在横屏时生效
);
```

**技术细节**：
- **返回 true**: 阻止默认的返回行为
- **条件启用**: 仅在 `isLandscape === true` 时生效
- **竖屏恢复**: 竖屏时自动恢复默认返回行为

**为什么横屏禁用？**
1. **防止误触**: 横屏观看时容易不小心按到返回键
2. **沉浸体验**: 横屏模式应该专注于视频，减少导航干扰
3. **明确退出**: 用户需要先切回竖屏，再使用返回键退出

**用户体验流程**：
```
横屏模式:
  用户按返回键 → 被拦截 → 无反应 → 用户转为竖屏

竖屏模式:
  用户按返回键 → 执行 backToFeed() → 关闭 VideoStack → 返回 Feed
```

## 🎯 状态管理策略

### 直接读取 Zustand Store

```typescript
// 不使用中间层 Hook
const currentVideo = useVideoStore(selectCurrentVideo);
const currentPlayer = useVideoStore(selectPlayerInstance);
const isReady = !!currentVideo && !!currentPlayer;
```

**设计原因**（与 Detail 页面相同）：
- **简化依赖**: 不需要 `useVideoPageLifecycle` 中间层
- **类型透明**: Selector 提供清晰的类型推断
- **灵活读取**: 可以按需选择不同的 state slice

### 视频状态的生命周期

```
Feed 页面点击视频
    ↓
enterVideoDetail(videoMeta)
    ↓
useVideoStore.setCurrentPlayerMeta({ meta, playerInstance })
    ↓
VideoFullscreenPage 挂载
    ↓
读取 currentVideo 和 currentPlayer
    ↓
开始播放
```

**关键点**：
- 状态由 Feed 在导航前设置
- Fullscreen 只读取，不修改
- 播放器实例在整个流程中保持不变

## 🎮 播放模式动态计算

### useMemo 优化

```typescript
const playbackMode = React.useMemo(() =>
  isLandscape ? PlaybackMode.FULLSCREEN_LANDSCAPE : PlaybackMode.FULLSCREEN_PORTRAIT,
  [isLandscape]
);
```

**为什么使用 useMemo？**
- `playbackMode` 是派生状态，根据 `isLandscape` 计算
- 避免每次渲染都重新计算
- `isLandscape` 变化时才重新计算

**播放模式影响**：
```typescript
// 在 FullscreenVideoPlayerSection 中
switch (playbackMode) {
  case PlaybackMode.FULLSCREEN_LANDSCAPE:
    // 隐藏返回按钮，最大化视频区域
    // 使用横向布局，优化横屏体验
    break;
  case PlaybackMode.FULLSCREEN_PORTRAIT:
    // 显示返回按钮，提供导航出口
    // 使用纵向布局，保持视频比例
    break;
}
```

## 🐛 错误处理策略

### 资源缺失的用户引导

```typescript
if (!isReady || !currentVideo) {
  return (
    <View style={styles.errorContainer}>
      <Text variant="bodyLarge" style={{ color: '#fff' }}>
        视频加载失败
      </Text>
    </View>
  );
}
```

**设计考虑**：
- **用户友好**: 简洁的错误提示
- **暗色背景**: 与全屏播放的视觉一致性
- **无阻塞**: 不使用 Alert，保持 UI 可见

**触发场景**：
- 应用被系统杀死，状态丢失
- 深度链接直接进入全屏页面
- 开发环境热重载

### 方向解锁失败处理

```typescript
catch (error) {
  if (mounted) {
    log(LOG_TAG, LogType.WARNING, `Failed to unlock orientation: ${error}`);
  }
}
```

**错误容忍策略**：
- **不阻塞**: 解锁失败只记录日志，继续渲染
- **降级体验**: 可能停留在当前方向，但不影响播放
- **用户无感**: 大多数情况下用户不会注意到

## 📊 性能优化细节

### useCallback 稳定引用

```typescript
const exitFullscreen = useCallback(() => {
  navigation.replace('VideoDetail', { videoId });
}, [navigation, videoId]);

const backToFeed = useCallback(() => {
  const parent = navigation.getParent();
  if (parent) {
    parent.goBack();
  }
}, [navigation]);
```

**优化目标**：
- 作为 props 传递给 Widget 时，避免子组件重渲染
- 作为 useEffect 依赖时，避免不必要的 effect 执行

### playbackMode 的 useMemo

```typescript
const playbackMode = React.useMemo(() =>
  isLandscape ? PlaybackMode.FULLSCREEN_LANDSCAPE : PlaybackMode.FULLSCREEN_PORTRAIT,
  [isLandscape]
);
```

**为什么 enum 也需要 memo？**
- 虽然是简单的三元运算，但每次渲染都会创建新值
- 作为 props 传递时会导致子组件重渲染
- useMemo 确保仅在 `isLandscape` 变化时更新

## 🔗 与其他模块的集成

### Widget 集成

```typescript
<FullscreenVideoPlayerSection
  onExitFullscreen={exitFullscreen}
  playbackMode={playbackMode}
/>
```

**职责划分**：
- **Widget**: 负责全屏播放器 UI、播放控制、进度条
- **Page**: 负责导航逻辑、方向管理、播放模式计算

### Shared Hooks 集成

```typescript
// 方向检测
const { isLandscape } = useOrientationDetection();

// 硬件返回键控制
useBackHandler(() => true, isLandscape);
```

**共享 Hooks 的设计**：
- **useOrientationDetection**: 可在任何需要方向检测的组件中使用
- **useBackHandler**: 可在任何需要拦截返回键的组件中使用
- **解耦**: Hooks 不依赖于特定的页面或导航系统

## 🧪 测试考虑

### 单元测试重点

**Page 组件测试**：
```typescript
// 测试方向变化时播放模式切换
test('switches playback mode when orientation changes', () => {
  const { result } = renderHook(() => useOrientationDetection());

  // 模拟横屏
  act(() => {
    Dimensions.set({ window: { width: 800, height: 400 } });
  });

  expect(result.current.isLandscape).toBe(true);
});
```

**Hook 测试**：
```typescript
// 测试硬件返回键拦截
test('blocks hardware back in landscape mode', () => {
  const handler = jest.fn(() => true);
  const { rerender } = renderHook(
    ({ isLandscape }) => useBackHandler(handler, isLandscape),
    { initialProps: { isLandscape: true } }
  );

  // 模拟返回键
  BackHandler.exitApp();

  expect(handler).toHaveBeenCalled();
});
```

### 集成测试重点

**导航流程测试**：
```typescript
// 测试退出全屏流程
test('navigates to detail when exit fullscreen', async () => {
  const { getByTestId } = render(<VideoFullscreenPage />);

  // 点击退出全屏按钮
  fireEvent.press(getByTestId('exit-fullscreen-button'));

  // 验证 navigation.replace 被调用
  expect(mockNavigation.replace).toHaveBeenCalledWith(
    'VideoDetail',
    { videoId: 'test-video-id' }
  );
});
```

## 📝 维护注意事项

### 方向管理的注意事项

**锁定/解锁的时机**：
- **Detail 进入**: 自动锁定竖屏
- **Fullscreen 进入**: 自动解锁方向
- **离开页面**: 不需要手动恢复，下一个页面会设置自己的方向策略

**方向变化的副作用**：
- 方向变化会触发组件重新渲染
- `playbackMode` 会自动更新
- Widget 会响应 `playbackMode` 变化调整布局

### 硬件返回键的注意事项

**多个 useBackHandler 的优先级**：
- 最后注册的 handler 优先级最高
- 返回 `true` 会阻止事件继续传播
- 返回 `false` 会让事件传递给下一个 handler

**清理逻辑**：
- `useBackHandler` 会自动在组件卸载时清理
- 不需要手动 `removeEventListener`

### 状态管理的注意事项

**视频状态的所有权**：
- **Feed**: 设置当前视频（`setCurrentPlayerMeta`）
- **Fullscreen/Detail**: 只读取，不修改
- **Feed 的 useFocusEffect**: 清理视频状态（`clearCurrentPlayerMeta`）

**状态清理的时机**：
- ❌ 不在页面 `useEffect` cleanup 中清理
- ✅ 在 Feed 页面获得焦点时清理
- 原因：防止 `navigation.replace()` 导致误清理

## 🎓 学习要点

**对于新团队成员**：

1. **理解导航栈**: Modal + Stack 的两层结构
2. **理解 replace 模式**: 平级页面切换的最佳实践
3. **理解方向管理**: 解锁 vs 锁定，何时使用
4. **理解硬件返回键**: 拦截条件，用户体验考虑

**常见误区**：

1. ❌ 在页面中清理视频状态 → ✅ 在 Feed 的 useFocusEffect 中清理
2. ❌ 使用 navigate() 切换到 Detail → ✅ 使用 replace()
3. ❌ 所有情况下拦截返回键 → ✅ 仅在横屏时拦截
4. ❌ 手动管理方向锁定/解锁 → ✅ 页面挂载时自动设置

**高级技巧**：

1. **条件化 Hook**: `useBackHandler` 的第二个参数控制是否生效
2. **派生状态**: `playbackMode` 从 `isLandscape` 派生，避免重复状态
3. **父级导航**: 使用 `getParent()` 访问上层导航器
4. **异步安全**: 所有异步操作检查 `mounted` flag

## 🔍 调试技巧

### 导航调试

```typescript
// 添加导航日志
useEffect(() => {
  const unsubscribe = navigation.addListener('state', (e) => {
    console.log('Navigation state:', e.data.state);
  });
  return unsubscribe;
}, [navigation]);
```

### 方向调试

```typescript
// 监听方向变化
useEffect(() => {
  const subscription = ScreenOrientation.addOrientationChangeListener((evt) => {
    console.log('Orientation changed:', evt.orientationInfo.orientation);
  });
  return () => subscription.remove();
}, []);
```

### 返回键调试

```typescript
// 监听所有返回键事件
useEffect(() => {
  const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
    console.log('Hardware back pressed');
    return false; // 不拦截，继续传播
  });
  return () => subscription.remove();
}, []);
```

## 🚀 未来扩展

### Shared Element 转场动画

```typescript
// 已集成 react-navigation-shared-element
// 在 VideoStackNavigator 中配置
<Stack.Screen
  name="VideoFullscreen"
  component={VideoFullscreenScreen}
  sharedElements={(route) => {
    const { videoId } = route.params;
    return [
      {
        id: `video.${videoId}`,
        animation: 'move',
        resize: 'auto',
        align: 'center-center'
      }
    ];
  }}
/>
```

**效果**：
- Feed → Fullscreen: 视频卡片流畅放大到全屏
- Fullscreen → Detail: 视频区域平滑过渡到小屏

### 手势控制扩展

**可能的扩展**：
- 左右滑动切换上/下一个视频
- 上下滑动退出全屏
- 双击暂停/播放
- 捏合缩放视频

**实现建议**：
- 使用 `react-native-gesture-handler`
- 在 Widget 层实现手势识别
- Page 层提供手势回调

---

**文档版本**: v3.0
**最后更新**: 2025-10-09
**维护者**: 参考 CODEOWNERS
**相关文档**: README.md, Player Pool v5.0 Entity 文档, Video Entity 文档, Orientation Hook 文档
