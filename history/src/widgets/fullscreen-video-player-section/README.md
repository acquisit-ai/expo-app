# 全屏视频播放器区域 (Fullscreen Video Player Section)

## 概述

全屏视频播放器区域是一个专门为全屏播放场景设计的 Widget 组件。它整合了全屏视频播放器、控制界面和增强的字幕系统，提供沉浸式的全屏观看体验。支持竖屏和横屏两种全屏模式，自动适配不同的屏幕方向。

## 快速开始

### 基本使用

```typescript
import { FullscreenVideoPlayerSection } from '@/widgets/fullscreen-video-player-section';

function VideoFullscreenPage() {
  const handleExit = () => {
    navigation.goBack();
  };

  return (
    <FullscreenVideoPlayerSection
      playbackMode="fullscreen-portrait"
      onExitFullscreen={handleExit}
    />
  );
}
```

### 横屏模式

```typescript
function LandscapeFullscreenPlayer() {
  return (
    <FullscreenVideoPlayerSection
      playbackMode="fullscreen-landscape"
      onExitFullscreen={handleExit}
    />
  );
}
```

### 带自定义控件

```typescript
function CustomFullscreenPlayer() {
  return (
    <FullscreenVideoPlayerSection
      playbackMode="fullscreen-portrait"
      onExitFullscreen={handleExit}
    >
      {/* 添加额外的控制层 */}
      <CustomOverlay />
    </FullscreenVideoPlayerSection>
  );
}
```

## 主要功能

### 1. 全屏视频播放

#### 自动配置
- **Entity 集成** - 从 video entity 自动获取当前视频和播放器实例
- **无 Prop Drilling** - 无需传递视频数据
- **状态同步** - 播放状态实时同步

```typescript
// 内部自动处理
const currentVideo = useVideoStore(selectCurrentVideo);
const currentPlayer = useVideoStore(selectPlayerInstance);
```

#### 屏幕适配
- **竖屏全屏** - TikTok 风格的竖屏全屏体验
- **横屏全屏** - 传统横屏全屏播放
- **自动旋转** - 根据设备方向自动适配

### 2. 控制界面

#### 竖屏模式控件
- **右侧操作栏** - 点赞、收藏、字幕、翻译按钮
- **全宽进度条** - 底部全宽度的播放进度控制
- **顶部导航栏** - 返回按钮和标题
- **中央播放按钮** - 大尺寸的播放/暂停按钮

#### 横屏模式控件
- **宽控制栏** - 横屏优化的控制布局
- **增强触摸区域** - 更大的可操作区域
- **侧边控制** - 音量和亮度控制（预留）

### 3. 增强字幕系统

全屏模式提供完整的字幕功能：

```typescript
<IntegratedSubtitleView
  config={{
    enabled: true,                    // 启用字幕
    position: 'bottom',               // 底部显示
    fontSize: 18,                     // 较大字号
    fontColor: '#FFFFFF',
    backgroundColor: 'transparent',
    showNavigationControls: true,     // 显示导航按钮
    autoScroll: true,                 // 自动滚动
    enableClickToSeek: true,          // 支持点击跳转
  }}
/>
```

#### 字幕导航
- **上一句/下一句** - 快速切换字幕句子
- **点击跳转** - 点击字幕句子跳转到对应时间
- **自动滚动** - 字幕自动跟随播放进度
- **双击手势集成** - 左右双击快速切换字幕

### 4. 手势交互

完整的手势支持：

- **单击** - 显示/隐藏控件
- **双击左侧** - 跳转到上一句字幕或回退5秒
- **双击右侧** - 跳转到下一句字幕或快进5秒
- **长按** - 打开播放设置
- **拖动进度条** - 精确控制播放位置

### 5. 模式映射

自动将 PlaybackMode 映射到 VideoDisplayMode：

```typescript
const displayModeMapping = {
  'fullscreen-portrait': VideoDisplayMode.FULLSCREEN_PORTRAIT,
  'fullscreen-landscape': VideoDisplayMode.FULLSCREEN_LANDSCAPE,
};
```

## API 文档

### FullscreenVideoPlayerSection 组件

#### Props

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `playbackMode` | `PlaybackMode` | 是 | 播放模式 |
| `onExitFullscreen` | `() => void` | 是 | 退出全屏回调 |
| `children` | `ReactNode` | 否 | 额外的控制层组件 |

#### PlaybackMode 类型

```typescript
type PlaybackMode =
  | 'fullscreen-portrait'   // 竖屏全屏
  | 'fullscreen-landscape'; // 横屏全屏
```

### 字幕配置接口

```typescript
interface SubtitleConfig {
  enabled: boolean;                    // 是否启用字幕
  position: 'top' | 'bottom';         // 字幕位置
  fontSize: number;                    // 字号
  fontColor: string;                   // 字体颜色
  backgroundColor: string;             // 背景颜色
  backgroundOpacity: number;           // 背景透明度
  showNavigationControls: boolean;     // 显示导航控件
  autoScroll: boolean;                 // 自动滚动
  enableClickToSeek: boolean;          // 启用点击跳转
}
```

### 导航功能接口

```typescript
interface SubtitleNavigation {
  goToPrevious: () => void;  // 跳转到上一句
  goToNext: () => void;      // 跳转到下一句
}
```

## 使用示例

### 示例 1: 基础全屏页面

```typescript
import { FullscreenVideoPlayerSection } from '@/widgets/fullscreen-video-player-section';
import { useNavigation } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';

function VideoFullscreenPage() {
  const navigation = useNavigation();

  const handleExitFullscreen = async () => {
    // 恢复竖屏方向
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );

    // 返回上一页
    navigation.goBack();
  };

  return (
    <FullscreenVideoPlayerSection
      playbackMode="fullscreen-portrait"
      onExitFullscreen={handleExitFullscreen}
    />
  );
}
```

### 示例 2: 响应式全屏播放器

```typescript
function ResponsiveFullscreenPlayer() {
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(
    'fullscreen-portrait'
  );

  useEffect(() => {
    // 监听屏幕方向变化
    const subscription = ScreenOrientation.addOrientationChangeListener(
      ({ orientationInfo }) => {
        const isLandscape = orientationInfo.orientation.includes('LANDSCAPE');
        setPlaybackMode(
          isLandscape ? 'fullscreen-landscape' : 'fullscreen-portrait'
        );
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <FullscreenVideoPlayerSection
      playbackMode={playbackMode}
      onExitFullscreen={handleExit}
    />
  );
}
```

### 示例 3: 带加载和错误处理

```typescript
function SafeFullscreenPlayer() {
  const currentVideo = useVideoStore(selectCurrentVideo);
  const currentPlayer = useVideoStore(selectPlayerInstance);
  const [error, setError] = useState(null);

  if (error) {
    return (
      <FullscreenErrorView
        message="视频加载失败"
        onExit={handleExit}
        onRetry={() => {
          setError(null);
          // 重试逻辑
        }}
      />
    );
  }

  if (!currentVideo?.meta || !currentPlayer) {
    return (
      <FullscreenLoadingView
        message="加载中..."
        onCancel={handleExit}
      />
    );
  }

  return (
    <FullscreenVideoPlayerSection
      playbackMode="fullscreen-portrait"
      onExitFullscreen={handleExit}
    />
  );
}
```

### 示例 4: 带自定义水印

```typescript
function FullscreenPlayerWithWatermark() {
  return (
    <FullscreenVideoPlayerSection
      playbackMode="fullscreen-portrait"
      onExitFullscreen={handleExit}
    >
      {/* 添加水印覆盖层 */}
      <View style={styles.watermarkContainer}>
        <Text style={styles.watermark}>
          @MyApp
        </Text>
      </View>
    </FullscreenVideoPlayerSection>
  );
}

const styles = StyleSheet.create({
  watermarkContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    opacity: 0.5,
  },
  watermark: {
    color: 'white',
    fontSize: 16,
  },
});
```

### 示例 5: 带播放统计

```typescript
function FullscreenPlayerWithAnalytics() {
  const currentVideo = useVideoStore(selectCurrentVideo);

  useEffect(() => {
    // 记录全屏播放开始
    analytics.logEvent('fullscreen_started', {
      videoId: currentVideo?.meta?.id,
      timestamp: Date.now(),
    });

    return () => {
      // 记录全屏播放结束
      analytics.logEvent('fullscreen_ended', {
        videoId: currentVideo?.meta?.id,
        duration: calculateWatchDuration(),
      });
    };
  }, [currentVideo]);

  return (
    <FullscreenVideoPlayerSection
      playbackMode="fullscreen-portrait"
      onExitFullscreen={handleExit}
    />
  );
}
```

## 布局架构

### 组件层次

```
FullscreenVideoPlayerSection
└─ FullscreenVideoPlayer (feature)
   ├─ 视频渲染层
   │  └─ Expo Video 组件
   │
   ├─ VideoControlsOverlay (feature)
   │  ├─ 手势检测层
   │  ├─ 视觉反馈层（快进/回退动画）
   │  ├─ 中央播放按钮
   │  └─ 控制布局
   │     ├─ 顶部导航栏
   │     ├─ 右侧操作栏（竖屏）
   │     └─ 底部进度栏
   │
   ├─ IntegratedSubtitleView (feature)
   │  ├─ 字幕文本显示
   │  ├─ 导航控件（上一句/下一句）
   │  └─ 滚动容器
   │
   └─ children（自定义控件）
      └─ 用户提供的额外组件
```

### Z-index 层级

```
层级 5: 自定义控件 (children)
层级 4: 字幕显示 (z-index: auto)
层级 3: 控制覆盖层 (z-index: 2)
层级 2: 视觉反馈层 (z-index: 1.3)
层级 1: 视频渲染 (z-index: 0)
```

## 常见问题

### Q: 如何处理屏幕旋转？

A: 使用 `expo-screen-orientation` 库：

```typescript
import * as ScreenOrientation from 'expo-screen-orientation';

// 进入全屏时允许旋转
await ScreenOrientation.unlockAsync();

// 退出全屏时锁定竖屏
await ScreenOrientation.lockAsync(
  ScreenOrientation.OrientationLock.PORTRAIT_UP
);
```

### Q: 如何自定义字幕样式？

A: 目前字幕配置在组件内部定义。可以通过修改组件代码或者使用自定义字幕组件：

```typescript
// 方案1：修改组件内部配置（不推荐）
// 方案2：使用自定义字幕（推荐）
<FullscreenVideoPlayerSection {...props}>
  <CustomSubtitleView />
</FullscreenVideoPlayerSection>
```

### Q: 全屏模式下状态栏如何处理？

A: 组件内部自动处理状态栏：

```typescript
// FullscreenVideoPlayer 内部处理
useEffect(() => {
  StatusBar.setHidden(true, 'fade');

  return () => {
    StatusBar.setHidden(false, 'fade');
  };
}, []);
```

### Q: 如何添加弹幕功能？

A: 通过 children 添加弹幕组件：

```typescript
<FullscreenVideoPlayerSection {...props}>
  <DanmakuOverlay
    danmakuList={danmakuList}
    currentTime={currentTime}
  />
</FullscreenVideoPlayerSection>
```

### Q: 如何禁用字幕？

A: 修改组件内部的字幕配置：

```typescript
// 在 FullscreenVideoPlayerSection.tsx 中
<IntegratedSubtitleView
  config={{
    enabled: false,  // 禁用字幕
    // ...
  }}
/>
```

### Q: 控件自动隐藏时间如何调整？

A: 自动隐藏逻辑在 `video-control-overlay` feature 中，默认 3 秒：

```typescript
// 在 useControlsAutoHide hook 中
const AUTO_HIDE_DELAY = 3000; // 修改这个值
```

## 相关功能

- **全屏视频播放器** (`@/features/video-player`) - 全屏播放核心
- **视频控制覆盖层** (`@/features/video-control-overlay`) - 控制界面
- **字幕显示** (`@/features/subtitle-display`) - 增强字幕系统
- **视频实体** (`@/entities/video`) - 状态管理

## 技术特点

### 三层组合模式

```typescript
// 清晰的层次划分
FullscreenVideoPlayer      // 播放核心
  ├─ VideoControlsOverlay  // 控制层
  └─ IntegratedSubtitleView // 字幕层
```

### 配置驱动

- **DisplayMode 映射** - 自动映射播放模式到显示模式
- **字幕配置** - 声明式的字幕配置
- **依赖注入** - Widget 层注入字幕导航功能

### 无 Prop Drilling

```typescript
// Entity 层自动提供数据
const currentVideo = useVideoStore(selectCurrentVideo);
const currentPlayer = useVideoStore(selectPlayerInstance);

// 无需从 props 传递
```

### 错误处理

```typescript
// 防御性检查
if (!currentVideo?.meta) return null;
if (!currentPlayer) return null;
```

### 性能考虑

- **绝对定位** - 使用 `StyleSheet.absoluteFill` 避免布局计算
- **Pointer Events** - 字幕层使用 `box-none` 允许穿透点击
- **条件渲染** - 早期返回避免不必要的渲染

## 最佳实践

1. **总是处理退出** - 提供明确的退出全屏回调
2. **管理屏幕方向** - 正确锁定和解锁屏幕方向
3. **处理状态栏** - 全屏时隐藏，退出时恢复
4. **错误边界** - 使用错误边界捕获渲染错误
5. **加载状态** - 提供加载指示器
6. **记忆化组件** - 避免不必要的重渲染
