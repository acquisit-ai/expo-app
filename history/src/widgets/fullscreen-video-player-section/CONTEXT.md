# Fullscreen Video Player Section Widget

*This widget provides a complete fullscreen video player experience by composing video player, control overlay, and subtitle components.*

## Architecture Overview

The `FullscreenVideoPlayerSection` implements a **three-layer composition pattern** with **widget-driven conditional subscription** (v2.0):

- **FullscreenVideoPlayer** (feature) - Pure video playback functionality
- **VideoControlsOverlay** (feature) - Control layer with `VideoDisplayMode.FULLSCREEN_PORTRAIT` + conditional subscription
- **IntegratedSubtitleView** (feature) - Subtitle display with navigation controls (conditionally rendered)

## Widget-Layer Conditional Subscription (v2.0)

### Active Video Detection Pattern

**职责**：Widget层判断是否为活跃视频，控制Feature层条件订阅。

```typescript
// FullscreenVideoPlayerSection.tsx
// 🎯 判断是否为当前活跃视频 - Widget 层职责
const currentVideoId = useVideoStore(selectCurrentVideoId);
const isActiveVideo = videoId === currentVideoId;
```

**注意**：全屏视频通常是活跃视频，但为了架构一致性和未来扩展性，仍然实现活跃视频判断逻辑。

### Conditional Feature Integration

**VideoControlsOverlay集成**：
```typescript
<VideoControlsOverlay
  playerMeta={playerMeta}         // { videoId, playerInstance }
  displayMode={displayMode}
  isActiveVideo={isActiveVideo}   // ← 控制条件订阅
  onToggleFullscreen={onExitFullscreen}
/>
```

**IntegratedSubtitleView条件渲染**：
```typescript
{/* 字幕显示组件 - 仅活跃视频渲染 */}
{isActiveVideo && (
  <IntegratedSubtitleView
    config={FULLSCREEN_SUBTITLE_CONFIG}
    subtitleStyle={SUBTITLE_STYLE}
  />
)}
```

### Performance Optimization Strategy

| 优化维度 | 实现方式 | 效果 |
|---------|---------|------|
| **Feature层订阅** | `isActiveVideo`参数传递 | 条件订阅video entity |
| **字幕组件渲染** | `{isActiveVideo && <IntegratedSubtitleView />}` | 非活跃视频不渲染 |
| **静态配置缓存** | `const FULLSCREEN_SUBTITLE_CONFIG = {...}` | 避免重复创建对象 |

### Fullscreen Context Characteristics

**特殊性**：
- 全屏页面通常只有一个视频实例
- `isActiveVideo`通常为`true`
- 条件订阅机制保证架构一致性，为未来多视频场景预留扩展性

**架构优势**：
- 与SmallVideoPlayerSection保持一致的条件订阅模式
- 支持未来的画中画等多视频场景
- Feature层代码可在不同Widget间复用

## Implementation Patterns

### Component Composition
- **Absolute Positioning**: Control and subtitle layers use `StyleSheet.absoluteFill` overlay pattern
- **Feature Integration**: Composes 3 independent features into cohesive fullscreen experience
- **Configuration-Driven**: Subtitle and control behavior configured via props
- **PlaybackMode Integration**: Accepts `playbackMode` prop from page layer and maps to `VideoDisplayMode`
- **Player Pool Integration**: Accesses current player pointer from video entity store for player instance access

### Integration Points

**Page Integration:**
```typescript
// Usage in VideoFullscreenPageContent
<FullscreenVideoPlayerSection
  isVisible={isVisible}
  onExitFullscreen={handleExitFullscreen}
/>
```

**Feature Dependencies:**
- `@/features/video-player` - FullscreenVideoPlayer component and VideoDisplayMode
- `@/features/video-control-overlay` - VideoControlsOverlay component
- `@/features/subtitle-display` - IntegratedSubtitleView component

**Configuration (v2.0更新):**
- **PlaybackMode to DisplayMode Mapping**: Sophisticated mapping logic (`playbackMode` → `VideoDisplayMode.FULLSCREEN_PORTRAIT`)
- **Subtitle Config**: Enhanced navigation controls with static optimization (`FULLSCREEN_SUBTITLE_CONFIG` const)
- **Pointer Events**: Box-none for click-through subtitle overlays (`pointerEvents: 'box-none'`)
- **🎯 Active Video Detection (v2.0)**: Widget-level `isActiveVideo` judgment for conditional subscription
- **🚀 Conditional Rendering (v2.0)**: Subtitle component only renders when `isActiveVideo === true`
- **Props Evolution (v2.0)**: `playerMeta` replaces direct `playerInstance`, removed `subtitleNavigation` prop (internal management)
- **Error Handling**: Defensive programming with player instance validation and video meta checks

---

*This file documents the fullscreen video player widget composition patterns and integration points.*