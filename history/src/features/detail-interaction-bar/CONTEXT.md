# Detail Interaction Bar Feature Context

## 核心设计原则

**零状态 Context 代理架构** - 作为 entity 和 UI 之间的纯代理层，通过专用 Context 封装状态订阅和操作分发，实现解耦和性能优化。

**细粒度状态订阅** - 使用专用 selector 精确订阅需要的状态片段，避免全量订阅导致的不必要重渲染。

**单点耦合设计** - 只有 `VideoInteractionProvider` 与 entity 层耦合，所有 UI 组件通过 Context 获取状态，确保清晰的依赖关系。

**可组合性优先** - 提供完整的 Feature 组件（VideoInteractionSection）和独立子组件（Provider + Bar），支持不同的集成场景。

## 架构职责边界

**纯视图层职责**:
- 订阅 video entity 的会话状态（isLiked, isFavorited, showSubtitles, showTranslation）
- 通过 Context 为 UI 组件提供状态和操作
- 渲染交互按钮（点赞、收藏、翻译、字幕）
- 主题适配和视觉反馈

**依赖关系**:
```
entities/video (session state + updateSession) → VideoInteractionProvider → useVideoInteraction → VideoInteractionBar
shared/ui/IconButton ↗
shared/providers/ThemeProvider ↗
```

**不负责的事项**:
- ❌ 状态持久化（由 entity 层负责）
- ❌ 数据验证和业务逻辑（由 entity 层负责）
- ❌ API 调用和数据处理
- ❌ 复杂的状态管理

## Context 架构设计

### 分层职责

**VideoInteractionProvider** - 唯一的 entity 耦合点：
```typescript
// 职责：订阅 entity 状态，创建 toggle 方法，提供 Context 值
export const VideoInteractionProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  // 1. 细粒度订阅 entity 状态
  const isLiked = useVideoStore(selectIsLiked);
  const isFavorited = useVideoStore(selectIsFavorited);
  const showSubtitles = useVideoStore(selectShowSubtitles);
  const showTranslation = useVideoStore(selectShowTranslation);
  const updateSession = useVideoStore(selectUpdateSession);

  // 2. 创建 toggle helpers（使用 entity 层提供的工具函数）
  const helpers = useMemo(() => createSessionToggleHelpers(updateSession), [updateSession]);

  // 3. 创建稳定的 toggle 方法（避免闭包陷阱）
  const toggleLike = useCallback(() => helpers.toggleLike(isLiked), [helpers, isLiked]);
  const toggleFavorite = useCallback(() => helpers.toggleFavorite(isFavorited), [helpers, isFavorited]);
  const toggleSubtitles = useCallback(() => helpers.toggleSubtitles(showSubtitles), [helpers, showSubtitles]);
  const toggleTranslation = useCallback(() => helpers.toggleTranslation(showTranslation), [helpers, showTranslation]);

  // 4. 缓存 Context 值（性能优化）
  const value = useMemo(() => ({
    isLiked,
    isFavorited,
    showSubtitles,
    showTranslation,
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
```

**useVideoInteraction Hook** - 类型安全的 Context 访问：
```typescript
// 职责：提供类型安全的 Context 访问，运行时边界检查
export const useVideoInteraction = () => {
  const context = useContext(VideoInteractionContext);
  if (!context) {
    throw new Error('useVideoInteraction must be used within a VideoInteractionProvider');
  }
  return context;
};
```

**VideoInteractionBar** - 纯 UI 渲染组件：
```typescript
// 职责：从 Context 获取状态，渲染交互按钮
export const VideoInteractionBar = React.memo(function VideoInteractionBar() {
  const { theme } = useTheme();

  // 从 Context 获取所有状态和操作
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

  // 主题自适应样式
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
      <IconButton
        iconName="heart"
        iconNameOutline="heart-outline"
        isActive={isLiked}
        onPress={toggleLike}
        activeColor={theme.colors.error}
        iconLibrary="Ionicons"
      />
      {/* ... 其他按钮 */}
    </View>
  );
});
```

**VideoInteractionSection** - 完整 Feature 组件：
```typescript
// 职责：作为对外暴露的完整 Feature，封装 Provider 和 UI
export const VideoInteractionSection = React.memo(function VideoInteractionSection() {
  return (
    <VideoInteractionProvider>
      <VideoInteractionBar />
    </VideoInteractionProvider>
  );
});
```

### 数据流图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Context 架构数据流                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  entities/video/model/store (Zustand)                                 │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ session: {                                                      │   │
│  │   isLiked: boolean                                             │   │
│  │   isFavorited: boolean                                         │   │
│  │   showSubtitles: boolean                                       │   │
│  │   showTranslation: boolean                                     │   │
│  │ }                                                               │   │
│  │ updateSession: (updates: Partial<VideoSessionState>) => void   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           │ 细粒度订阅 (selectIsLiked, selectIsFavorited, ...)         │
│           ▼                                                             │
│  VideoInteractionProvider                                              │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 1. 订阅状态：                                                    │   │
│  │    const isLiked = useVideoStore(selectIsLiked);               │   │
│  │    const isFavorited = useVideoStore(selectIsFavorited);       │   │
│  │    ...                                                          │   │
│  │                                                                 │   │
│  │ 2. 创建操作：                                                    │   │
│  │    const helpers = createSessionToggleHelpers(updateSession);  │   │
│  │    const toggleLike = () => helpers.toggleLike(isLiked);       │   │
│  │    ...                                                          │   │
│  │                                                                 │   │
│  │ 3. 提供 Context 值：                                            │   │
│  │    value = { isLiked, toggleLike, ... }                        │   │
│  └────────────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           │ Context.Provider                                           │
│           ▼                                                             │
│  useVideoInteraction() Hook                                            │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ const context = useContext(VideoInteractionContext);           │   │
│  │ if (!context) throw new Error(...);                            │   │
│  │ return context;                                                 │   │
│  └────────────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           │ 类型安全访问                                                │
│           ▼                                                             │
│  VideoInteractionBar (UI Component)                                    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ const { isLiked, toggleLike, ... } = useVideoInteraction();    │   │
│  │                                                                 │   │
│  │ return (                                                        │   │
│  │   <View>                                                        │   │
│  │     <IconButton isActive={isLiked} onPress={toggleLike} />     │   │
│  │     ...                                                         │   │
│  │   </View>                                                       │   │
│  │ );                                                              │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 性能优化策略

### 1. 细粒度状态订阅

**问题**: Zustand 全量订阅会导致不必要的重渲染

**解决方案**: 使用专用 selector 精确订阅

```typescript
// ❌ 不好：全量订阅
const { session } = useVideoStore();
const isLiked = session.isLiked;

// ✅ 好：细粒度订阅
const isLiked = useVideoStore(selectIsLiked);
```

**优势**:
- **减少重渲染**: 只有订阅的状态变化才触发重渲染
- **性能提升**: 避免因无关状态变化导致的组件更新
- **清晰依赖**: 明确组件依赖的具体状态

### 2. Context 值缓存

**问题**: Context 值变化会导致所有消费组件重渲染

**解决方案**: 使用 `useMemo` 缓存 Context 值

```typescript
// ✅ 缓存 Context 值
const value = useMemo(() => ({
  isLiked,
  isFavorited,
  showSubtitles,
  showTranslation,
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
```

**优势**:
- **减少对象创建**: 避免每次渲染创建新的 Context 值对象
- **稳定引用**: 只有依赖项变化时才创建新对象
- **优化性能**: 减少消费组件的不必要重渲染

### 3. 稳定的回调函数

**问题**: 每次渲染创建新的函数会导致依赖该函数的组件重渲染

**解决方案**: 使用 `useCallback` 创建稳定的函数引用

```typescript
// ✅ 稳定的 toggle 方法
const toggleLike = useCallback(() => helpers.toggleLike(isLiked), [helpers, isLiked]);
const toggleFavorite = useCallback(() => helpers.toggleFavorite(isFavorited), [helpers, isFavorited]);
```

**优势**:
- **稳定引用**: 只有依赖项变化时才创建新函数
- **减少重渲染**: 避免子组件因函数引用变化而重渲染
- **优化性能**: 配合 `React.memo` 达到最佳效果

### 4. React.memo 组件优化

**问题**: 父组件更新会导致所有子组件重渲染

**解决方案**: 使用 `React.memo` 包裹组件

```typescript
// ✅ 使用 React.memo 优化
export const VideoInteractionBar = React.memo(function VideoInteractionBar() {
  // ...
});

export const VideoInteractionSection = React.memo(function VideoInteractionSection() {
  // ...
});
```

**优势**:
- **浅比较优化**: props 不变时跳过重渲染
- **配合 useCallback**: 避免因函数引用变化导致的重渲染
- **性能提升**: 减少不必要的 DOM 更新

### 5. 动态样式缓存

**问题**: 每次渲染都创建样式对象会影响性能

**解决方案**: 使用 `React.useMemo` 缓存样式

```typescript
// ✅ 缓存动态样式
const dynamicStyles = React.useMemo(() => StyleSheet.create({
  controlBar: {
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.outline,
    // ...
  },
}), [theme]);
```

**优势**:
- **减少对象创建**: 避免每次渲染创建新的样式对象
- **主题响应**: 只有主题变化时才重新创建样式
- **性能优化**: 减少 StyleSheet 的创建开销

## 与 Entity 层的集成

### Selector 使用模式

**完整的 selector 列表**:
```typescript
import {
  useVideoStore,
  selectIsLiked,           // 点赞状态
  selectIsFavorited,       // 收藏状态
  selectShowSubtitles,     // 字幕显示状态
  selectShowTranslation,   // 翻译显示状态
  selectUpdateSession,     // 更新会话状态的方法
  createSessionToggleHelpers  // 创建 toggle helper 的工具函数
} from '@/entities/video';
```

**订阅模式**:
```typescript
// 在 Provider 中订阅
const isLiked = useVideoStore(selectIsLiked);
const updateSession = useVideoStore(selectUpdateSession);

// 创建操作方法
const helpers = createSessionToggleHelpers(updateSession);
const toggleLike = useCallback(() => helpers.toggleLike(isLiked), [helpers, isLiked]);
```

### Entity 提供的工具函数

**createSessionToggleHelpers** - 统一的 toggle 逻辑：
```typescript
// entity 层提供的工具函数（来自 entities/video/model/selectors.ts）
export const createSessionToggleHelpers = (
  updateSession: (updates: Partial<VideoSessionState>) => void
) => ({
  toggleLike: (isLiked: boolean) => updateSession({ isLiked: !isLiked }),
  toggleFavorite: (isFavorited: boolean) => updateSession({ isFavorited: !isFavorited }),
  toggleSubtitles: (showSubtitles: boolean) => updateSession({ showSubtitles: !showSubtitles }),
  toggleTranslation: (showTranslation: boolean) => updateSession({ showTranslation: !showTranslation }),
});
```

**优势**:
- **复用逻辑**: 避免在 Feature 层重复实现 toggle 逻辑
- **一致性**: 确保所有 Feature 使用相同的 toggle 实现
- **易维护**: 逻辑集中在 entity 层，便于修改和测试

## 与 Widget 层的集成

### 集成场景

**场景 1: 小屏视频播放器**
```typescript
// widgets/small-video-player-section/ui/SmallVideoPlayerSection.tsx
import { VideoInteractionSection } from '@/features/detail-interaction-bar';

export function SmallVideoPlayerSection() {
  return (
    <View>
      <SmallVideoPlayer />
      <VideoInteractionSection />  {/* 交互栏 */}
      <IntegratedSubtitleView />
    </View>
  );
}
```

**场景 2: 视频详情页**
```typescript
// pages/video-detail/VideoDetailPage.tsx
import { VideoInteractionSection } from '@/features/detail-interaction-bar';

export function VideoDetailPage() {
  return (
    <ScrollView>
      <VideoPlayer />
      <VideoInteractionSection />  {/* 交互栏 */}
      <VideoInfo />
      <Comments />
    </ScrollView>
  );
}
```

### 跨 Widget 状态共享

**优势**: 基于 entity 层的状态共享，所有 Widget 自动同步

```typescript
// Widget A 中点赞
<VideoInteractionSection />  // 用户点击点赞

// Widget B 自动同步
// 因为都订阅同一个 entity 状态，Widget B 会自动更新显示
<VideoInteractionSection />  // 自动显示已点赞状态
```

## UI 组件集成

### IconButton 使用模式

**shared/ui/IconButton** 提供的功能：
```typescript
export interface IconButtonProps {
  iconName: MaterialIconName | IoniconsIconName;       // 激活状态图标
  iconNameOutline?: MaterialIconName | IoniconsIconName; // 非激活状态图标
  isActive?: boolean;                                   // 是否激活
  onPress: () => void;                                  // 点击回调
  activeColor?: string;                                 // 激活颜色
  iconLibrary?: IconLibrary;                           // 图标库
  iconSize?: number;                                   // 图标大小
  disabled?: boolean;                                  // 是否禁用
  style?: ViewStyle;                                   // 自定义样式
}
```

**使用示例**:
```typescript
// 点赞按钮 - 使用 Ionicons 的 heart 图标
<IconButton
  iconName="heart"                     // 激活时的实心图标
  iconNameOutline="heart-outline"      // 非激活时的空心图标
  isActive={isLiked}                   // 绑定激活状态
  onPress={toggleLike}                 // 绑定点击事件
  activeColor={theme.colors.error}     // 激活时显示红色
  iconLibrary="Ionicons"               // 使用 Ionicons 图标库
/>

// 收藏按钮 - 使用 MaterialCommunityIcons 的 star 图标
<IconButton
  iconName="star"                      // 激活时的实心星星
  iconNameOutline="star-outline"       // 非激活时的空心星星
  isActive={isFavorited}               // 绑定激活状态
  onPress={toggleFavorite}             // 绑定点击事件
  activeColor={theme.colors.warning}   // 激活时显示黄色
  iconLibrary="MaterialCommunityIcons" // 使用 MaterialCommunityIcons 图标库
/>
```

### 图标状态和颜色

**激活状态切换**:
- `isActive={true}`: 显示 `iconName` (实心图标) + `activeColor` (激活颜色)
- `isActive={false}`: 显示 `iconNameOutline` (空心图标) + `theme.colors.onSurfaceVariant` (默认颜色)

**颜色规范**:
```typescript
点赞 (heart):      activeColor: theme.colors.error      // 红色
收藏 (star):       activeColor: theme.colors.warning    // 黄色/橙色
翻译 (translate):  activeColor: theme.colors.primary    // 主题色
字幕 (subtitles):  activeColor: theme.colors.primary    // 主题色
```

## 主题系统集成

### 主题提供方式

```typescript
import { useTheme } from '@/shared/providers/ThemeProvider';

const { theme } = useTheme();

// 访问主题颜色
theme.colors.surface         // 表面色（背景）
theme.colors.outline         // 边框色
theme.colors.error          // 错误色（点赞红色）
theme.colors.warning        // 警告色（收藏黄色）
theme.colors.primary        // 主题色（翻译/字幕）
theme.colors.onSurfaceVariant  // 次要文本色（未激活图标）
```

### 动态样式创建

```typescript
const dynamicStyles = React.useMemo(() => StyleSheet.create({
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,      // 主题背景色
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.outline,    // 主题边框色
    height: VIDEO_PLAYER_CONSTANTS.LAYOUT.CONTROL_BAR_HEIGHT,
  },
}), [theme]);
```

**优势**:
- **主题自适应**: 自动支持浅色/深色主题切换
- **一致性**: 使用统一的主题系统确保 UI 一致性
- **性能优化**: 使用 `useMemo` 缓存样式，只在主题变化时重新创建

## 布局和常量

### 使用统一的布局常量

```typescript
import { VIDEO_PLAYER_CONSTANTS } from '@/features/video-player';

// 使用统一的控制栏高度
height: VIDEO_PLAYER_CONSTANTS.LAYOUT.CONTROL_BAR_HEIGHT
```

**优势**:
- **一致性**: 确保所有视频相关组件使用相同的布局常量
- **易维护**: 修改常量即可全局更新
- **避免魔法数字**: 使用语义化的常量名称

## 边界情况处理

### Context 边界检查

```typescript
export const useVideoInteraction = () => {
  const context = useContext(VideoInteractionContext);
  if (!context) {
    throw new Error('useVideoInteraction must be used within a VideoInteractionProvider');
  }
  return context;
};
```

**处理场景**:
- **运行时检查**: 确保 Hook 在 Provider 内部使用
- **开发时错误**: 提供清晰的错误信息帮助调试
- **类型安全**: 返回类型始终是 `VideoInteractionContextValue`，不会是 `undefined`

### 主题安全访问

```typescript
const { theme } = useTheme();

// 安全：theme 始终存在（由 ThemeProvider 保证）
const backgroundColor = theme.colors.surface;
```

## 测试策略

### 单元测试

**Provider 测试**:
```typescript
describe('VideoInteractionProvider', () => {
  it('should provide interaction state from entity', () => {
    const { result } = renderHook(() => useVideoInteraction(), {
      wrapper: VideoInteractionProvider,
    });

    expect(result.current.isLiked).toBeDefined();
    expect(result.current.toggleLike).toBeInstanceOf(Function);
  });

  it('should toggle like state', () => {
    const { result } = renderHook(() => useVideoInteraction(), {
      wrapper: VideoInteractionProvider,
    });

    act(() => {
      result.current.toggleLike();
    });

    // 验证 entity 的 updateSession 被调用
  });
});
```

**组件测试**:
```typescript
describe('VideoInteractionBar', () => {
  it('should render all interaction buttons', () => {
    const { getByTestId } = render(
      <VideoInteractionProvider>
        <VideoInteractionBar />
      </VideoInteractionProvider>
    );

    expect(getByTestId('like-button')).toBeTruthy();
    expect(getByTestId('favorite-button')).toBeTruthy();
    expect(getByTestId('translation-button')).toBeTruthy();
    expect(getByTestId('subtitle-button')).toBeTruthy();
  });
});
```

### 集成测试

**与 Entity 集成**:
```typescript
describe('VideoInteractionBar Integration', () => {
  it('should sync with video entity state', () => {
    // 设置 entity 初始状态
    const { result: entityResult } = renderHook(() => useVideoStore());
    act(() => {
      entityResult.current.updateSession({ isLiked: true });
    });

    // 渲染交互栏
    const { getByTestId } = render(
      <VideoInteractionProvider>
        <VideoInteractionBar />
      </VideoInteractionProvider>
    );

    // 验证交互栏反映 entity 状态
    expect(getByTestId('like-button')).toHaveStyle({ color: theme.colors.error });
  });
});
```

## 架构演进建议

### 当前架构优势

1. **清晰的职责分离**: Provider、Hook、UI 组件各司其职
2. **性能优化到位**: 细粒度订阅、Context 缓存、React.memo
3. **类型安全保障**: 完整的 TypeScript 类型定义
4. **易于测试**: 纯函数式设计，便于单元测试和集成测试

### 未来扩展方向

**v1.1.0 - 添加分享功能**:
```typescript
// 在 Context 中添加
interface VideoInteractionContextValue {
  // ... 现有字段
  onShare: () => void;  // 新增分享方法
}

// 在 UI 中添加
<IconButton
  iconName="share"
  onPress={onShare}
  iconLibrary="MaterialCommunityIcons"
/>
```

**v1.2.0 - 添加评论入口**:
```typescript
// 在 Context 中添加
interface VideoInteractionContextValue {
  // ... 现有字段
  commentCount: number;     // 评论数量
  onOpenComments: () => void;  // 打开评论
}

// 在 UI 中添加
<IconButton
  iconName="comment"
  onPress={onOpenComments}
  iconLibrary="MaterialCommunityIcons"
/>
```

**v2.0.0 - 支持自定义按钮配置**:
```typescript
// 支持配置显示哪些按钮
interface VideoInteractionConfig {
  showLike?: boolean;
  showFavorite?: boolean;
  showTranslation?: boolean;
  showSubtitles?: boolean;
  showShare?: boolean;
  showComments?: boolean;
}

// 使用
<VideoInteractionSection
  config={{
    showLike: true,
    showFavorite: true,
    showShare: false,
  }}
/>
```

## 与其他 Feature 的协作

### 与 subtitle-display 的协作

```typescript
// detail-interaction-bar 控制字幕显示
const { toggleSubtitles } = useVideoInteraction();
toggleSubtitles();  // 切换字幕显示状态

// subtitle-display 订阅同一状态自动响应
const { showSubtitles } = useVideoOverlayManager();  // 来自 video entity
// showSubtitles 变化时，字幕自动显示/隐藏
```

### 与 video-player 的协作

```typescript
// detail-interaction-bar 使用 video-player 的常量
import { VIDEO_PLAYER_CONSTANTS } from '@/features/video-player';

// 使用统一的布局高度
height: VIDEO_PLAYER_CONSTANTS.LAYOUT.CONTROL_BAR_HEIGHT
```

### 状态同步机制

**核心机制**: 所有 Feature 都订阅同一个 video entity 状态

```
video entity (session state)
    ├─> detail-interaction-bar (控制状态)
    ├─> subtitle-display (响应 showSubtitles)
    ├─> video-player (响应 showTranslation)
    └─> 其他 Feature
```

**优势**:
- **自动同步**: 一个 Feature 修改状态，其他 Feature 自动更新
- **无需通信**: Feature 之间不需要直接通信
- **松耦合**: Feature 之间没有直接依赖

## 开发指南

### 添加新的交互按钮

**步骤 1**: 在 entity 层添加状态
```typescript
// entities/video/model/types.ts
export interface VideoSessionState {
  // ... 现有字段
  isShared: boolean;  // 新增
}
```

**步骤 2**: 添加 selector
```typescript
// entities/video/model/selectors.ts
export const selectIsShared = (state: VideoStore) => state.session.isShared;
```

**步骤 3**: 在 Provider 中订阅
```typescript
// hooks/VideoInteractionContext.tsx
const isShared = useVideoStore(selectIsShared);
const toggleShare = useCallback(() => helpers.toggleShare(isShared), [helpers, isShared]);
```

**步骤 4**: 在 UI 中添加按钮
```typescript
// ui/VideoInteractionBar.tsx
<IconButton
  iconName="share"
  isActive={isShared}
  onPress={toggleShare}
  activeColor={theme.colors.primary}
  iconLibrary="MaterialCommunityIcons"
/>
```

### 调试技巧

**1. 使用 React DevTools**:
- 查看 Context 值
- 检查组件重渲染次数
- 验证 props 传递

**2. 添加日志**:
```typescript
if (__DEV__) {
  console.log('[VideoInteractionBar] Render with state:', {
    isLiked,
    isFavorited,
    showSubtitles,
    showTranslation,
  });
}
```

**3. 性能分析**:
```typescript
// 使用 React Profiler
<Profiler id="VideoInteractionBar" onRender={onRenderCallback}>
  <VideoInteractionBar />
</Profiler>
```

## 最佳实践总结

### ✅ 应该做的

1. **使用完整 Feature 组件**: 优先使用 `VideoInteractionSection`
2. **通过 Context 访问状态**: 使用 `useVideoInteraction` Hook
3. **遵循主题系统**: 使用 `useTheme` 获取主题色
4. **使用统一常量**: 使用 `VIDEO_PLAYER_CONSTANTS`
5. **性能优化**: 使用 `React.memo`、`useMemo`、`useCallback`

### ❌ 不应该做的

1. **直接修改 entity 状态**: 不要绕过 Context 直接调用 entity 方法
2. **硬编码样式**: 不要使用魔法数字和固定颜色
3. **跨 Feature 直接通信**: 不要在 Feature 之间建立直接依赖
4. **全量订阅 entity**: 不要订阅整个 store，使用细粒度 selector
5. **在 UI 组件中订阅 entity**: UI 组件应该从 Context 获取状态

---

**Detail Interaction Bar Feature Context** - 高性能、可维护、可扩展的视频交互控制架构文档 🎬⚡🎯
