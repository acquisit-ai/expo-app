# VideoPlayerSection Widget Documentation

*This file documents the VideoPlayerSection widget implementation and advanced animation patterns.*

## Sophisticated Widget Architecture

### Advanced Multi-Feature Composition
- **video-player Feature**: Entity-centric SmallVideoPlayer with optimized display component architecture
- **video-control-overlay Feature**: Integrated VideoControlsOverlay with strategy pattern UI architecture for adaptive controls
- **detail-interaction-bar Feature**: VideoInteractionSection providing seamless user interactions
- **subtitle-display Feature**: IntegratedSubtitleView with positioning and configuration management
- **Scroll Animation Coordination**: Enterprise-grade SharedValue-based scroll handling with sophisticated dual-mode behavior
- **Layout Management**: Advanced fixed positioning with comprehensive safe area handling and responsive design
- **Widget Composition Excellence**: Demonstrates exemplary widget-layer composition patterns for project-wide reference

### Sophisticated Widget Responsibilities (v2.0 - 条件订阅支持)

- **Video Player Integration**: Hosts entity-driven SmallVideoPlayer with zero data prop passing demonstrating clean widget composition
- **PlaybackMode Integration**: Accepts `playbackMode` prop from page layer with sophisticated flow to feature components
- **Player Pool Integration**: Accesses current player pointer from video entity store for instance coordination
- **Animation Coordination**: Manages enterprise-grade scroll-based video player animations via sophisticated SharedValues coordination
- **Control Layer Management**: Orchestrates VideoControlsOverlay with SMALL display mode for embedded video controls
- **Subtitle Integration**: Manages IntegratedSubtitleView positioning within video bounds with z-index coordination
- **🎯 Active Video Detection (v2.0)**: Widget-level判断`isActiveVideo`，控制feature层条件订阅，实现多视频场景性能优化
- **🚀 Conditional Rendering (v2.0)**: 字幕组件仅在活跃视频渲染，非活跃视频零渲染开销
- **Multi-Feature Coordination**: Seamlessly combines video-player, video-control-overlay, detail-interaction-bar, and subtitle-display features
- **Layout Management**: Advanced fixed header positioning with comprehensive responsive safe area support
- **Scroll Integration Excellence**: Demonstrates sophisticated scroll integration patterns for complex multi-feature widgets

## Widget-Layer Conditional Subscription Pattern (v2.0)

### Active Video Detection

**职责**：Widget层自主判断是否为当前活跃视频，控制Feature层是否订阅video entity。

```typescript
// SmallVideoPlayerSection.tsx
const currentVideoId = useVideoStore(selectCurrentVideoId);
const isActiveVideo = videoId === currentVideoId;
```

**原理**：
- Widget层仅订阅`currentVideoId`（低频变化）
- 通过比较`videoId === currentVideoId`判断活跃性
- 将`isActiveVideo`传递给Feature层，控制订阅行为

### Conditional Feature Rendering

**字幕组件条件渲染**：
```typescript
{/* 字幕显示组件 - 仅活跃视频渲染 */}
{isActiveVideo && (
  <IntegratedSubtitleView
    config={{
      enabled: false,  // 小屏模式禁用字幕
      position: 'bottom',
      showNavigationControls: false,
      // ...
    }}
  />
)}
```

**性能优势**：
- **组件级优化**：非活跃视频不渲染字幕组件
- **零订阅开销**：未渲染的组件不创建任何订阅
- **内存节省**：减少组件树和状态管理开销

### Feature Layer Integration

**VideoControlsOverlay集成**：
```typescript
<VideoControlsOverlay
  playerMeta={cachedPlayerMeta}      // { videoId, playerInstance }
  displayMode={displayMode}
  isActiveVideo={isActiveVideo}      // ← 控制条件订阅
  onToggleFullscreen={onToggleFullscreen}
  scrollY={effectiveScrollY}
  isPlayingShared={isPlayingShared}
/>
```

**Feature层响应**：
- 接收`isActiveVideo`参数
- 使用`useConditionalCurrentTime(isActiveVideo)`等条件订阅hooks
- 播放控制方法包含`if (!isActiveVideo) return`守卫

### VideoInteractionSection解耦

**v2.0变更**：
```typescript
// ❌ v1.0：内部自动获取currentVideoId
<VideoInteractionSection />

// ✅ v2.0：显式传递videoId
<VideoInteractionSection videoId={videoId} />
```

**解耦效果**：
- VideoInteractionSection不再订阅video entity的`currentVideoId`
- 支持多视频场景（每个widget传入自己的videoId）
- 职责更清晰：Widget判断活跃性，Feature只管理交互

### Performance Characteristics

| 场景 | Widget订阅 | Feature订阅 | 字幕组件 | 总开销 |
|------|----------|------------|---------|--------|
| **活跃视频** | currentVideoId | currentTime等3个字段 | ✅ 渲染 | 基准 |
| **非活跃视频** | currentVideoId | 0个字段 | ❌ 不渲染 | **~90% ↓** |

### Cross-Widget Data Flow (v2.0)

```
Page Layer
  ↓ (playerMeta)
Widget Layer (SmallVideoPlayerSection)
├─ 判断活跃视频：const isActiveVideo = videoId === currentVideoId
├─ 条件渲染：{isActiveVideo && <IntegratedSubtitleView />}
└─ 传递isActiveVideo ↓

Feature Layer (VideoControlsOverlay)
├─ useConditionalCurrentTime(isActiveVideo) - 条件订阅
├─ useConditionalBufferedTime(isActiveVideo)
├─ useConditionalDuration(isActiveVideo)
└─ useSubtitleNavigation(playerInstance, isActiveVideo)

Entity Layer
└─ useConditionalStoreValue(store, selector, enabled, fallback)
   ├─ enabled=true: 创建细粒度订阅
   └─ enabled=false: 零开销
```

## Implementation Patterns

### SharedValue Stability Pattern
```typescript
// useRef ensures SharedValues are stable across renders
const scrollY = useRef(useSharedValue(0)).current;
const scrollOffsetRaw = useRef(useSharedValue(0)).current;
const effectiveScrollY = useRef(useSharedValue(0)).current;
const playingTransition = useRef(useSharedValue(0)).current;
```

### Animation State Synchronization
```typescript
// Sync external playing state with animation system
useEffect(() => {
  if (isPlaying) {
    isPlayAnimatingShared.value = true;
    effectiveScrollY.value = withTiming(0, ANIMATION_PRESETS.videoExpand);
    playingTransition.value = withTiming(1, ANIMATION_PRESETS.playTransition);
  } else {
    isPlayAnimatingShared.value = false;
    scrollOffsetRaw.value = scrollY.value;
    playingTransition.value = withTiming(0, ANIMATION_PRESETS.pauseTransition);
  }
}, [isPlaying]);
```

### Cross-Widget Communication Pattern
```typescript
// Non-prop-drilling scroll handler delegation
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollY.value = event.contentOffset.y;

    // Dual-mode scroll handling based on playback state
    if (isPlayingShared.value) {
      handlePlayingScroll(event.contentOffset.y, scrollOffsetRaw, effectiveScrollY, isPlayAnimatingShared.value);
    } else {
      handlePausedScroll(event.contentOffset.y, scrollOffset, scrollOffsetRaw, effectiveScrollY);
    }
  },
});

// Delegate handler to parent without prop drilling
useEffect(() => {
  onScrollHandler?.(scrollHandler);
}, [scrollHandler]);
```
```

### Performance Optimizations
- **React.memo**: Wraps component to prevent unnecessary re-renders
- **useMemo**: Caches complex style calculations
- **useCallback**: Stabilizes callback functions for child components
- **Animation Cleanup**: Proper cleanup of animations on unmount
- **Non-Destructive Interactions**: Fixed header widgets maintain state while content widgets scroll independently
- **Deferred Operations**: Heavy operations deferred during high-frequency scroll events
- **Worklet-Based Calculations**: Complex animation logic runs on UI thread for 60fps performance

## Integration Points

### Entity Layer Integration
- **useVideoPlayer Hook**: Accesses `isPlayingShared`, `isPlayAnimatingShared` for animation coordination
- **State Synchronization**: Coordinates entity state with widget-level animations through modular hooks

### Page Layer Coordination
- **Scroll Handler Delegation**: Provides complex animated scroll handler to parent page via callback without prop drilling
- **Back Navigation**: Receives navigation callback from page layer
- **Simplified State Flow**: Minimal prop passing thanks to entity-centric video player design
- **Cross-Widget Communication**: VideoPlayerSection generates scroll handler, VideoContentSection receives and applies it
- **Animation State Isolation**: Video and content widgets coordinate through shared animation state without direct dependencies

### Feature Layer Composition
- **SmallVideoPlayer**: Entity-centric video player with auto-configuration, modular components, and animation overlays
- **VideoControlsOverlay**: Strategy pattern control system with SMALL display mode for embedded video controls
- **IntegratedSubtitleView**: Subtitle display component with bottom positioning and click-to-seek disabled for small screen
- **VideoInteractionSection**: Video interaction controls (like, favorite, subtitles, translation)
- **BackButton**: Modular animated back button with direct SharedValue integration

## Advanced Animation Architecture

### Video Transform Animations
```typescript
const videoAnimatedStyle = useAnimatedStyle(() => {
  return calculateVideoScrollTransform({ effectiveScrollY, playingTransition });
});
```

### Worklet Function Integration
- **calculateVideoScrollTransform**: Video container transform calculations
- **calculatePlayButtonAnimation**: Play button fade/scale animations
- **calculateOverlayAnimation**: Overlay opacity and position animations
- **createVideoScrollLogic**: Scroll behavior logic for playing/paused states

### Memory Safety
```typescript
// Proper animation cleanup on unmount
useEffect(() => {
  return () => {
    cancelAnimation(effectiveScrollY);
    cancelAnimation(playingTransition);
    log('video-player', LogType.DEBUG, 'VideoPlayerSection unmounted, animations cleaned up');
  };
}, []);
```

## Widget Layer Architectural Reference

This VideoPlayerSection widget serves as an exemplary implementation demonstrating:

### Widget Composition Excellence
- **Multi-Feature Integration**: Seamless composition of video-player, video-control-overlay, detail-interaction-bar, and subtitle-display features with zero prop drilling
- **Advanced Animation Coordination**: Enterprise-grade SharedValue-based scroll handling with sophisticated dual-mode behavior
- **Layered UI Architecture**: Sophisticated z-index management for video, controls, and subtitle overlays within video bounds
- **Clean Widget Architecture**: Demonstrates proper widget-layer responsibilities in Feature-Sliced Design
- **Performance Optimization**: Memory-safe animation cleanup and React.memo optimization patterns
- **Cross-Widget Communication Excellence**: Sophisticated handler delegation patterns enabling widget coordination without direct coupling
- **Non-Destructive Interaction Model**: Fixed and scrollable widgets maintain independent state while coordinating animations

### Enterprise-Grade Patterns
- **Scroll Integration**: Sophisticated scroll integration patterns for complex multi-feature widgets
- **Animation Architecture**: Advanced SharedValue stability patterns with performance-first design
- **Layout Management**: Comprehensive safe area handling and responsive design implementation
- **Feature Coordination**: Clean integration patterns between multiple feature layers

---

*This file documents the VideoPlayerSection widget's sophisticated animation architecture and multi-feature composition patterns, serving as an architectural reference for enterprise-grade widget-layer implementation in Feature-Sliced Design.*