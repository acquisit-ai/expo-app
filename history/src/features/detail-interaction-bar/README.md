# Detail Interaction Bar Feature

视频详情页交互栏功能模块，负责在视频详情页提供点赞、收藏、翻译和字幕等核心交互控制。

## 🎯 设计理念

### 核心职责
- **用户交互控制**: 提供点赞、收藏、翻译、字幕的切换功能
- **状态可视化**: 实时反映各项交互功能的开启/关闭状态
- **主题适配**: 支持浅色/深色主题自动适配
- **图标反馈**: 通过图标状态和颜色变化提供清晰的视觉反馈

### 架构原则
- **依赖上游**: 完全依赖 `entities/video` 的会话状态，无本地状态管理
- **Context 隔离**: 使用专用 Context 封装状态和操作，避免 prop drilling
- **零状态设计**: 不维护额外状态，仅作为 video entity 的视图层
- **可组合性**: 提供完整的 Feature 组件和独立子组件
- **性能优化**: 通过 Context 优化和 React.memo 减少不必要的重渲染
- **类型安全**: 完整的 TypeScript 类型定义

## 📁 目录结构

```
src/features/detail-interaction-bar/
├── hooks/                              # Context 和 Hook 层
│   └── VideoInteractionContext.tsx     # 视频交互状态 Context
├── ui/                                 # UI 组件层
│   ├── VideoInteractionBar.tsx         # 交互栏主组件
│   └── VideoInteractionSection.tsx     # 完整 Feature 组件
├── index.ts                            # 功能模块统一导出
└── README.md                           # 本文档
```

## 🏗️ 核心架构

### 数据流向图

```
┌─────────────────────────────────────────────────────────────┐
│                   视频交互栏数据流                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  entities/video/model/store                                │
│  ├─ session.isLiked                                        │
│  ├─ session.isFavorited                                    │
│  ├─ session.showSubtitles                                  │
│  ├─ session.showTranslation                                │
│  └─ updateSession(updates)                                 │
│           │                                                 │
│           │ (直接订阅)                                       │
│           ▼                                                 │
│  VideoInteractionContext                                   │
│  ├─ 订阅 entity 状态                                        │
│  ├─ 创建 toggle helpers                                     │
│  └─ 提供统一接口                                            │
│           │                                                 │
│           │ (Context 提供)                                  │
│           ▼                                                 │
│  VideoInteractionBar                                       │
│  └─ 渲染交互按钮                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Context 架构

**单点耦合设计** - 只有 `VideoInteractionProvider` 与 entity 耦合：

```typescript
// VideoInteractionProvider - 唯一的 entity 耦合点
export function VideoInteractionProvider({ children }) {
  // 直接订阅 entity 状态
  const isLiked = useVideoStore(selectIsLiked);
  const isFavorited = useVideoStore(selectIsFavorited);
  const showSubtitles = useVideoStore(selectShowSubtitles);
  const showTranslation = useVideoStore(selectShowTranslation);
  const updateSession = useVideoStore(selectUpdateSession);

  // 创建 toggle helpers
  const helpers = useMemo(() => createSessionToggleHelpers(updateSession), [updateSession]);

  // 创建稳定的 toggle 方法
  const toggleLike = useCallback(() => helpers.toggleLike(isLiked), [helpers, isLiked]);
  // ... 其他 toggle 方法

  const value = useMemo(() => ({
    isLiked,
    isFavorited,
    showSubtitles,
    showTranslation,
    toggleLike,
    toggleFavorite,
    toggleSubtitles,
    toggleTranslation,
  }), [/* 所有依赖 */]);

  return (
    <VideoInteractionContext.Provider value={value}>
      {children}
    </VideoInteractionContext.Provider>
  );
}
```

## 📊 类型系统

### 核心类型

```typescript
/**
 * 视频交互 Context 值类型
 */
interface VideoInteractionContextValue {
  // 交互状态
  isLiked: boolean;              // 是否已点赞
  isFavorited: boolean;          // 是否已收藏
  showSubtitles: boolean;        // 是否显示字幕
  showTranslation: boolean;      // 是否显示翻译

  // 交互方法
  toggleLike: () => void;        // 切换点赞状态
  toggleFavorite: () => void;    // 切换收藏状态
  toggleSubtitles: () => void;   // 切换字幕显示
  toggleTranslation: () => void; // 切换翻译显示
}
```

## 🔧 核心实现

### 1. Context Provider (`VideoInteractionContext.tsx`)

完全无状态设计，纯订阅和代理型 Context：

```typescript
export const VideoInteractionProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  // 直接订阅 entity 状态 - 细粒度 selector 优化性能
  const isLiked = useVideoStore(selectIsLiked);
  const isFavorited = useVideoStore(selectIsFavorited);
  const showSubtitles = useVideoStore(selectShowSubtitles);
  const showTranslation = useVideoStore(selectShowTranslation);
  const updateSession = useVideoStore(selectUpdateSession);

  // 创建 toggle helpers - 使用 entity 层提供的工具函数
  const helpers = useMemo(() => createSessionToggleHelpers(updateSession), [updateSession]);

  // 创建稳定的 toggle 方法 - 避免不必要的重渲染
  const toggleLike = useCallback(() => helpers.toggleLike(isLiked), [helpers, isLiked]);
  const toggleFavorite = useCallback(() => helpers.toggleFavorite(isFavorited), [helpers, isFavorited]);
  const toggleSubtitles = useCallback(() => helpers.toggleSubtitles(showSubtitles), [helpers, showSubtitles]);
  const toggleTranslation = useCallback(() => helpers.toggleTranslation(showTranslation), [helpers, showTranslation]);

  // 缓存 Context 值 - 优化性能
  const value = useMemo(() => ({
    // 状态
    isLiked,
    isFavorited,
    showSubtitles,
    showTranslation,
    // 方法
    toggleLike,
    toggleFavorite,
    toggleSubtitles,
    toggleTranslation,
  }), [
    isLiked,
    isFavorited,
    showSubtitles,
    showTranslation,
    toggleLike,
    toggleFavorite,
    toggleSubtitles,
    toggleTranslation,
  ]);

  return (
    <VideoInteractionContext.Provider value={value}>
      {children}
    </VideoInteractionContext.Provider>
  );
};

// 自定义 Hook - 提供类型安全的 Context 访问
export const useVideoInteraction = () => {
  const context = useContext(VideoInteractionContext);
  if (!context) {
    throw new Error('useVideoInteraction must be used within a VideoInteractionProvider');
  }
  return context;
};
```

### 2. 交互栏组件 (`VideoInteractionBar.tsx`)

纯 UI 组件，完全从 Context 获取状态和方法：

```typescript
export const VideoInteractionBar = React.memo(function VideoInteractionBar() {
  const { theme } = useTheme();

  // 从专用 Context 获取交互状态
  const {
    isLiked,
    isFavorited,
    showSubtitles,
    showTranslation,
    toggleLike,
    toggleFavorite,
    toggleSubtitles,
    toggleTranslation
  } = useVideoInteraction();

  const dynamicStyles = React.useMemo(() => StyleSheet.create({
    controlBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
      height: VIDEO_PLAYER_CONSTANTS.LAYOUT.CONTROL_BAR_HEIGHT,
    },
  }), [theme]);

  return (
    <View style={dynamicStyles.controlBar}>
      {/* 点赞按钮 */}
      <IconButton
        iconName="heart"
        iconNameOutline="heart-outline"
        isActive={isLiked}
        onPress={toggleLike}
        activeColor={theme.colors.error}
        iconLibrary="Ionicons"
      />

      {/* 收藏按钮 */}
      <IconButton
        iconName="star"
        iconNameOutline="star-outline"
        isActive={isFavorited}
        onPress={toggleFavorite}
        activeColor={theme.colors.warning}
        iconLibrary="MaterialCommunityIcons"
      />

      {/* 翻译按钮 */}
      <IconButton
        iconName="translate"
        isActive={showTranslation}
        onPress={toggleTranslation}
        activeColor={theme.colors.primary}
        iconLibrary="MaterialCommunityIcons"
      />

      {/* 字幕按钮 */}
      <IconButton
        iconName="subtitles"
        iconNameOutline="subtitles-outline"
        isActive={showSubtitles}
        onPress={toggleSubtitles}
        activeColor={theme.colors.primary}
        iconLibrary="MaterialCommunityIcons"
      />
    </View>
  );
});
```

### 3. 完整 Feature 组件 (`VideoInteractionSection.tsx`)

作为 Feature 层的完整组件，内部包含 Context Provider 和交互栏：

```typescript
/**
 * 视频交互区域组件
 *
 * 作为 Feature 层的完整组件，内部包含 Context Provider 和交互栏
 */
export const VideoInteractionSection = React.memo(function VideoInteractionSection() {
  return (
    <VideoInteractionProvider>
      <VideoInteractionBar />
    </VideoInteractionProvider>
  );
});
```

## 🔌 集成方案

### 基础集成（推荐）

```typescript
import { VideoInteractionSection } from '@/features/detail-interaction-bar';

function VideoDetailPage() {
  return (
    <View>
      <VideoPlayer />

      {/* 完整的交互栏 - 包含 Context 和 UI */}
      <VideoInteractionSection />

      <VideoDetails />
    </View>
  );
}
```

### 高级集成（自定义布局）

如果需要自定义布局，可以单独使用 Provider 和组件：

```typescript
import {
  VideoInteractionProvider,
  VideoInteractionBar,
  useVideoInteraction
} from '@/features/detail-interaction-bar';

function CustomVideoPage() {
  return (
    <VideoInteractionProvider>
      <View>
        <VideoPlayer />

        {/* 自定义位置的交互栏 */}
        <VideoInteractionBar />

        {/* 其他组件也可以访问交互状态 */}
        <CustomComponent />
      </View>
    </VideoInteractionProvider>
  );
}

// 其他组件可以通过 Hook 访问交互状态
function CustomComponent() {
  const { isLiked, toggleLike } = useVideoInteraction();

  return (
    <Text onPress={toggleLike}>
      {isLiked ? '已点赞' : '点赞'}
    </Text>
  );
}
```

## ⚡ 性能优化

### 1. Context 值缓存

```typescript
// 使用 useMemo 缓存 Context 值，避免不必要的重渲染
const value = useMemo(() => ({
  isLiked,
  isFavorited,
  // ...
}), [isLiked, isFavorited, /* ... */]);
```

### 2. 细粒度状态订阅

```typescript
// 使用专用 selector 只订阅需要的状态，避免全量订阅
const isLiked = useVideoStore(selectIsLiked);
const isFavorited = useVideoStore(selectIsFavorited);
// 而非 const { session } = useVideoStore();
```

### 3. 稳定的回调函数

```typescript
// 使用 useCallback 创建稳定的函数引用
const toggleLike = useCallback(() => helpers.toggleLike(isLiked), [helpers, isLiked]);
```

### 4. React.memo 优化

```typescript
// 组件使用 React.memo 包裹，避免父组件更新导致的重渲染
export const VideoInteractionBar = React.memo(function VideoInteractionBar() {
  // ...
});
```

## 🎨 样式和主题

### 主题适配

交互栏完全支持应用主题系统：

```typescript
// 自动适配浅色/深色主题
const { theme } = useTheme();

const dynamicStyles = StyleSheet.create({
  controlBar: {
    backgroundColor: theme.colors.surface,        // 主题背景色
    borderBottomColor: theme.colors.outline,      // 主题边框色
  },
});
```

### 图标状态颜色

```typescript
// 每个交互功能有专属的激活颜色
点赞: theme.colors.error      // 红色
收藏: theme.colors.warning    // 黄色/橙色
翻译: theme.colors.primary    // 主题色
字幕: theme.colors.primary    // 主题色
```

### 布局常量

```typescript
// 使用统一的布局常量确保一致性
height: VIDEO_PLAYER_CONSTANTS.LAYOUT.CONTROL_BAR_HEIGHT
```

## 🧩 依赖关系

### 上游依赖

```typescript
// entities/video - 状态和操作
import {
  useVideoStore,
  selectIsLiked,
  selectIsFavorited,
  selectShowSubtitles,
  selectShowTranslation,
  selectUpdateSession,
  createSessionToggleHelpers
} from '@/entities/video';

// shared/ui - UI 组件
import { IconButton } from '@/shared/ui/IconButton';

// shared/providers - 主题系统
import { useTheme } from '@/shared/providers/ThemeProvider';

// features/video-player - 常量
import { VIDEO_PLAYER_CONSTANTS } from '@/features/video-player';
```

### 下游使用

```typescript
// widgets/small-video-player-section
// widgets/fullscreen-video-player-section
// pages/video-detail
```

## 🎯 设计模式

### 1. Context 隔离模式

- **单点耦合**: 只有 Provider 与 entity 耦合
- **纯消费组件**: UI 组件只从 Context 获取数据
- **类型安全**: 通过自定义 Hook 提供类型检查

### 2. 代理模式

```typescript
// Context 作为 entity 和 UI 之间的代理层
Entity State → Context Provider → Context Consumer → UI
```

### 3. 细粒度订阅模式

```typescript
// 使用专用 selector 实现细粒度订阅
const isLiked = useVideoStore(selectIsLiked);           // 只订阅 isLiked
const isFavorited = useVideoStore(selectIsFavorited);   // 只订阅 isFavorited
```

### 4. 辅助函数复用模式

```typescript
// 使用 entity 层提供的工具函数，避免重复实现
const helpers = createSessionToggleHelpers(updateSession);
const toggleLike = () => helpers.toggleLike(isLiked);
```

## 🔍 调试支持

### 开发环境检查

```typescript
if (__DEV__) {
  console.log('视频交互状态:', {
    isLiked,
    isFavorited,
    showSubtitles,
    showTranslation
  });
}
```

### Context 调试

```typescript
// 使用 React DevTools 查看 Context 值
<VideoInteractionContext.Provider value={value} displayName="VideoInteraction">
```

## 🚀 技术亮点

### 1. 零状态设计
- **完全无状态**: 不维护任何本地状态，纯视图层
- **实时同步**: 自动订阅 entity 状态，保持数据一致性
- **简化维护**: 减少状态同步问题，降低维护成本

### 2. Context 架构优势
- **避免 Prop Drilling**: 多层嵌套组件无需逐层传递 props
- **统一接口**: 所有消费组件通过统一的 Hook 访问状态
- **性能优化**: 通过 memo 和 selector 减少不必要的重渲染

### 3. 类型安全保障
- **完整类型定义**: 所有接口和函数都有 TypeScript 类型
- **运行时检查**: Context Hook 提供运行时边界检查
- **IDE 支持**: 完整的类型推导和自动补全

### 4. 可维护性
- **单一职责**: 每个组件职责明确
- **清晰分层**: hooks、ui 目录结构清晰
- **易于测试**: 纯函数式设计便于单元测试

## 📋 版本历史

### v1.0.0 (当前版本)
- ✅ **Context 架构**: 使用专用 Context 封装交互状态
- ✅ **零状态设计**: 完全依赖 video entity，无本地状态
- ✅ **细粒度订阅**: 使用专用 selector 优化性能
- ✅ **主题适配**: 完整支持浅色/深色主题
- ✅ **类型安全**: 完整的 TypeScript 类型定义
- ✅ **四项交互**: 点赞、收藏、翻译、字幕控制

### 未来版本
- 🔄 v1.1.0: 添加分享功能
- 🔄 v1.2.0: 添加评论入口
- 🔄 v2.0.0: 支持自定义按钮配置

## 💡 最佳实践

### 1. 始终使用完整 Feature 组件

```typescript
// ✅ 推荐：使用 VideoInteractionSection
<VideoInteractionSection />

// ❌ 避免：手动组合 Provider 和组件（除非有特殊布局需求）
<VideoInteractionProvider>
  <VideoInteractionBar />
</VideoInteractionProvider>
```

### 2. 不要在 Feature 外部修改状态

```typescript
// ❌ 错误：绕过 Context 直接修改 entity
const { updateSession } = useVideoStore();
updateSession({ isLiked: true });

// ✅ 正确：通过 Context 提供的方法
const { toggleLike } = useVideoInteraction();
toggleLike();
```

### 3. 利用 TypeScript 类型检查

```typescript
// ✅ 类型安全的使用方式
const { isLiked, toggleLike }: VideoInteractionContextValue = useVideoInteraction();
```

---

**Detail Interaction Bar Feature v1.0** - 简洁、高效、类型安全的视频交互控制解决方案 🎬⚡🎯
