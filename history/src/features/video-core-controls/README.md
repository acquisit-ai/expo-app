# Video Core Controls

独立的视频控制组件库，支持完全自给自足的使用模式。

## 特性

- 🎯 **独立Context**: 拥有自己的feature级别状态管理（VideoCoreControlsContext）
- 🔄 **智能时间同步**: 集成useVideoTimeSync Hook，解决滑块跳动问题
- 🎨 **灵活布局**: 三种预设布局（SmallScreenLayout、FullscreenPortraitLayout、FullscreenLandscapeLayout）
- 📱 **响应式设计**: 基于ControlSize的统一尺寸系统
- 🔒 **类型安全**: 完整的TypeScript支持
- ⚡ **性能优化**: SharedValue稳定性、动画性能优化
- 🎭 **动画效果**: 统一的AnimatedButton、渐变背景、过渡动画

## 快速开始

### 基本使用

```tsx
import {
  VideoCoreControlsProvider,
  VideoBottomBar
} from '@/features/video-core-controls';

function MyVideoPlayer() {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <VideoCoreControlsProvider
      currentTime={currentTime}
      duration={duration}
      isPlaying={isPlaying}
      onSeek={(time) => {
        setCurrentTime(time);
        // 执行实际的视频跳转
      }}
      onPlayToggle={() => setIsPlaying(!isPlaying)}
      size="medium"
    >
      <VideoBottomBar
        layout="horizontal"
        showProgress={true}
        showTime={true}
        showPlayButton={true}
      />
    </VideoCoreControlsProvider>
  );
}
```

### 全屏模式

```tsx
<VideoCoreControlsProvider
  currentTime={currentTime}
  duration={duration}
  isPlaying={isPlaying}
  isFullscreen={true}
  size="large"
  onSeek={handleSeek}
  onPlayToggle={handlePlayToggle}
  onToggleFullscreen={handleToggleFullscreen}
>
  <VideoBottomBar
    layout="portrait-fullscreen"
    showProgress={true}
    showTime={true}
    showPlayButton={true}
    showFullscreen={true}
  />
</VideoCoreControlsProvider>
```

## API参考

### VideoCoreControlsProvider

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| currentTime | number | ✅ | - | 当前播放时间（秒） |
| duration | number | ✅ | - | 视频总时长（秒） |
| isPlaying | boolean | ✅ | - | 播放状态 |
| bufferedTime | number | ❌ | 0 | 缓冲时间（秒） |
| isFullscreen | boolean | ❌ | false | 全屏状态 |
| size | ControlSize | ❌ | 'medium' | 控件尺寸 |
| onSeek | (time: number) => void | ❌ | - | 跳转回调 |
| onPlayToggle | () => void | ❌ | - | 播放切换回调 |
| onToggleFullscreen | () => void | ❌ | - | 全屏切换回调 |
| seekingTolerance | number | ❌ | 0.5 | seeking检测容差（秒） |
| seekingTimeout | number | ❌ | 3000 | seeking超时时间（毫秒） |

### VideoBottomBar

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| layout | 'horizontal' \| 'portrait-fullscreen' | 'horizontal' | 布局模式 |
| showPlayButton | boolean | true | 显示播放按钮 |
| showProgress | boolean | true | 显示进度条 |
| showTime | boolean | true | 显示时间 |
| showFullscreen | boolean | true | 显示全屏按钮 |
| showVolume | boolean | false | 显示音量控制 |

## 核心优势

### 1. 智能时间同步

内置的useVideoTimeSync Hook解决了进度条拖拽时的跳动问题：

- **状态机管理**: normal → dragging → seeking → normal
- **智能检测**: 自动判断seeking完成
- **防护机制**: 容差检测 + 超时保护

### 2. 完全独立

不依赖外部Context或状态管理：

```tsx
// ✅ 完全独立使用
<VideoCoreControlsProvider {...props}>
  <VideoBottomBar />
</VideoCoreControlsProvider>

// ❌ 不需要外部依赖
<SomeExternalProvider>
  <VideoCoreControlsProvider {...props}>
    <VideoBottomBar />
  </VideoCoreControlsProvider>
</SomeExternalProvider>
```

### 3. 灵活配置

支持多种使用场景：

```tsx
// 小屏模式
<VideoBottomBar layout="horizontal" />

// 全屏模式
<VideoBottomBar layout="portrait-fullscreen" />

// 自定义显示
<VideoBottomBar
  showProgress={true}
  showTime={false}
  showFullscreen={false}
/>
```

## 迁移指南

从旧的props模式迁移到Context模式：

### 之前
```tsx
<VideoBottomBar
  currentTime={currentTime}
  duration={duration}
  isPlaying={isPlaying}
  onSeek={onSeek}
  // ... 更多props
/>
```

### 之后
```tsx
<VideoCoreControlsProvider
  currentTime={currentTime}
  duration={duration}
  isPlaying={isPlaying}
  onSeek={onSeek}
>
  <VideoBottomBar layout="horizontal" />
</VideoCoreControlsProvider>
```

主要变化：
- 数据通过Provider传递
- VideoBottomBar只接收布局配置
- 自动处理时间同步逻辑

## 核心组件清单

### 1. Context与状态管理
- **VideoCoreControlsProvider**: 独立的feature级别Context提供者
- **useVideoCoreControls**: Context消费Hook
- **useVideoTimeSync**: 智能时间同步Hook，管理进度条拖拽状态机

### 2. 布局组件（Layouts）
- **SmallScreenLayout**: 小屏嵌入式布局（列表、小窗口）
- **FullscreenPortraitLayout**: 竖屏全屏布局（TikTok风格，含侧边栏）
- **FullscreenLandscapeLayout**: 横屏全屏布局（传统播放器风格）

### 3. 控制栏组件（Bars）
- **VideoTopBar**: 顶部控制栏（返回按钮、标题、设置）
- **VideoBottomBar**: 底部控制栏（播放、进度、时间、全屏）

### 4. 基础控制组件（Controls）
- **PlayButton**: 播放/暂停按钮
- **ProgressBar**: 进度条（支持拖拽、缓冲显示）
- **TimeDisplay**: 时间显示（当前/总时长/剩余）
- **FullscreenToggle**: 全屏切换按钮
- **BackButton**: 返回按钮

### 5. 基础架构组件（Shared）
- **AnimatedButton**: 统一的动画按钮基础组件
- **ControlBar**: 通用控制栏容器（支持渐变背景）
- **ControlBarSection**: 控制栏区段（flex布局）
- **ControlGroup**: 控制组分组

## 架构设计

### 三层架构模式

```
┌─────────────────────────────────────────────────────┐
│                  Layout Layer                       │
│  (SmallScreen/FullscreenPortrait/Landscape)        │
│  - 组合控制栏和控制组件                              │
│  - 定义布局结构和响应式间距                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Bar & Controls Layer                   │
│  (VideoTopBar, VideoBottomBar, PlayButton...)      │
│  - 消费Context数据                                   │
│  - 组合基础组件                                      │
│  - 处理用户交互                                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           Context & Foundation Layer                │
│  (VideoCoreControlsContext, AnimatedButton...)     │
│  - 状态管理和时间同步                                │
│  - 基础UI组件                                        │
│  - 统一的尺寸和样式系统                              │
└─────────────────────────────────────────────────────┘
```

### 核心设计原则

1. **独立Context架构**
   - Provider包装所有子组件
   - 统一的数据流和状态管理
   - 与VideoPlayerContext完全解耦

2. **智能时间同步**
   ```typescript
   // 状态机：normal → dragging → seeking → normal
   // 解决进度条跳动问题
   const timeSync = useVideoTimeSync({
     currentTime,
     duration,
     onSeek,
     seekingTolerance: 0.5,
     seekingTimeout: 3000
   });
   ```

3. **组合优于继承**
   - Layout组件组合Bar组件
   - Bar组件组合Controls组件
   - Controls组件组合Shared基础组件

4. **统一尺寸系统**
   ```typescript
   // ControlSize: 'small' | 'medium' | 'large'
   CONTROL_DIMENSIONS = {
     BUTTON: { small: 32x32, medium: 40x40, large: 48x48 },
     BAR: { small: 48h, medium: 64h, large: 80h },
     PROGRESS: { small: 4h, medium: 6h, large: 8h }
   }
   ```

## 与视频播放器的集成

### 集成模式

```tsx
// video-control-overlay 组合使用
import { VideoCoreControlsProvider, SmallScreenLayout } from '@/features/video-core-controls';

<VideoCoreControlsProvider
  currentTime={currentTime}
  duration={duration}
  isPlaying={isPlaying}
  onSeek={seek}
  onPlayToggle={togglePlay}
>
  <SmallScreenLayout />
</VideoCoreControlsProvider>
```

### 与VideoPlayerContext的关系

- **完全解耦**: video-core-controls不直接依赖VideoPlayerContext
- **数据桥接**: 由video-control-overlay作为中间层桥接数据
- **单向数据流**: VideoPlayerContext → video-control-overlay → VideoCoreControlsProvider

### FSD 层级依赖

`video-core-controls` 是一个**基础 feature**，被其他更高层级的组合 feature 依赖：

```
features/video-control-overlay/     (组合型 feature)
├── → video-core-controls/          (✅ 单向依赖)
├── → video-gestures/               (✅ 单向依赖)
└── → entities/video/               (✅ 向下依赖)

features/video-core-controls/       (基础 feature)
└── → shared/                       (✅ 向下依赖)
```

## UI设计与动画

### 动画系统

1. **AnimatedButton动画**
   - 按下：缩放至0.8 + 轻微旋转(-5°) + 透明度0.6
   - 释放：弹性回弹(1.15 → 1.0) + 旋转归零
   - 使用react-native-reanimated的worklet优化

2. **控制栏渐变**
   ```typescript
   GRADIENT_COLORS = {
     top: ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)'],
     bottom: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)'],
     floating: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.4)']
   }
   ```

3. **TikTok风格侧边栏**（FullscreenPortraitLayout）
   - 语义化颜色编码（Like: #FF4569, Favorite: #FFA500）
   - 触觉反馈集成（expo-haptics）
   - 阴影效果增强点击区域感知

### 响应式设计

- **FullscreenPortraitLayout**: 动态计算按钮尺寸（屏幕宽度的13%）
- **FullscreenLandscapeLayout**: 横屏时5%水平间距，3%垂直间距
- **SmallScreenLayout**: 紧凑布局，移除不必要的间距

## 性能优化

1. **SharedValue稳定性**
   - 使用`useRef(useSharedValue())`确保跨渲染稳定
   - 避免SharedValue在每次渲染时重新创建

2. **Callback优化**
   - 所有交互方法使用`useCallback`包装
   - 精确的依赖数组，避免过度更新

3. **useMemo缓存**
   - 响应式尺寸计算缓存（FullscreenPortraitLayout）
   - 样式对象缓存，减少重新计算

4. **React.memo包装**
   - ProgressBar、VideoBottomBar等组件使用React.memo
   - 减少不必要的重新渲染