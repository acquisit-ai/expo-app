# 组件层 (Widgets) 文档

## 组件层架构

### 当前状态: 生产就绪
组件层实现了Feature-Sliced Design的复合UI组件模式，包含7个运行组件模块，为可重用界面块建立了一致的架构模式。已升级支持高级动画和多功能组合模式。

## 实现的组件模块

### ✅ 导航组件 (`tab-bar/`) - **[完整文档](/src/widgets/tab-bar/CONTEXT.md)**

**位置**: `src/widgets/tab-bar/`  
**主要组件**: `BlurTabBar.tsx`, `TabBarItem.tsx` - 完整导航系统

**架构特性**:
- **模块化设计**: 按照FSD原则的完整架构(config/lib/types/ui结构)
- **性能优化**: React.memo优化、预计算颜色、静态/动态样式分离
- **类型安全**: 100% TypeScript覆盖，完整类型定义
- **测试保障**: 100+ 测试用例，涵盖组件、工具、性能测试

**技术实现**:
- 毛玻璃效果背景 (expo-blur)，主题自适应强度
- 平台特定样式适配和阴影效果
- 配置化图标映射系统，支持focused/outline变体
- 完整的可访问性支持和ARIA属性

**集成模式**:
```typescript
// app/(tabs)/_layout.tsx 中集成
import { BlurTabBar } from '@/widgets/tab-bar';
<Tabs tabBar={(props) => <BlurTabBar {...props} />}>
```

### ✅ 用户信息头部 (`profile-header/`)

**位置**: `src/widgets/profile-header/`  
**组件**: `ProfileHeader.tsx` - 用户信息展示组件

**核心特性**:
- 用户头像、姓名、ID展示
- VIP徽章集成 (组件间依赖示例)
- 可选个人简介显示
- 可配置头像尺寸

**组件组合模式**:
```typescript
// 集成了多个共享UI组件和其他组件
import { Avatar, H2, Caption } from '@/shared/ui';
import { VIPBadge } from '@/widgets/vip-badge';
```

### ✅ 统计区块 (`stats-section/`)

**位置**: `src/widgets/stats-section/`  
**组件**: `StatsSection.tsx` - 学习数据统计展示

**核心特性**:
- 灵活的统计数据数组配置
- 卡片式布局设计
- 响应式行布局 (使用 Row 组件)
- 统计项目的图标、数值、标签展示

**数据结构模式**:
```typescript
interface StatItem {
  icon: string;    // 图标名称
  value: string;   // 统计数值
  label: string;   // 描述标签
}
```

### ✅ VIP徽章 (`vip-badge/`)

**位置**: `src/widgets/vip-badge/`
**组件**: `VIPBadge.tsx` - 状态指示器

**核心特性**:
- 简洁的状态展示
- 主题化样式
- 被其他组件复用 (ProfileHeader中使用)

### ✅ 小屏视频播放器区域 (`small-video-player-section/`) - **[完整文档](/src/widgets/small-video-player-section/CONTEXT.md)**

**位置**: `src/widgets/small-video-player-section/`
**组件**: `SmallVideoPlayerSection.tsx` - 高级小屏视频播放器组合组件

**核心特性**:
- **多功能组合**: 整合video-player和video-detail功能特性
- **React Native Reanimated集成**: 高性能滚动驱动动画系统
- **SharedValue协调**: 跨组件动画状态同步
- **固定定位布局**: 带安全区域适配的绝对定位头部
- **性能优化**: React.memo、useRef、useCallback完整优化栈

**高级架构特性**:
```typescript
// SharedValue稳定性模式
const scrollY = useRef(useSharedValue(0)).current;
const effectiveScrollY = useRef(useSharedValue(0)).current;

// 跨组件动画协调
const { isPlayingShared, isPlayAnimatingShared } = useVideoPlayback();
```

**集成模式**:
- **Entity集成**: 深度整合entities/video的SharedValue系统
- **动画逻辑**: 工作线程中的复杂滚动和播放动画计算
- **多功能协调**: SmallVideoPlayer + VideoInteractionBar + BackButton

### ✅ 全屏视频播放器区域 (`fullscreen-video-player-section/`) - **[完整文档](/src/widgets/fullscreen-video-player-section/CONTEXT.md)**

**位置**: `src/widgets/fullscreen-video-player-section/`
**组件**: `FullscreenVideoPlayerSection.tsx` - 全屏视频播放器组合组件

**核心特性**:
- **三层组合架构**: 整合FullscreenVideoPlayer + VideoControlsOverlay + IntegratedSubtitleView
- **绝对定位布局**: StyleSheet.absoluteFill覆盖层系统
- **全屏优化配置**: 16px字体，完整字幕导航控件，点击跳转支持
- **统一接口**: 与小屏播放器保持一致的组合模式

**技术实现**:
```typescript
// 三层组合模式
<FullscreenVideoPlayer />           // 纯播放功能
<VideoControlsOverlay />            // FULLSCREEN_PORTRAIT模式控制层
<IntegratedSubtitleView />          // 增强字幕导航体验
```

**集成模式**:
- **页面集成**: 在VideoFullscreenPageContent中直接使用
- **配置驱动**: 全屏专用配置（大字体、完整导航、点击跳转）
- **Feature组合**: 统一的三层architecture模式

### ✅ 视频内容区域 (`video-content-section/`) - **[完整文档](/src/widgets/video-content-section/CONTEXT.md)**

**位置**: `src/widgets/video-content-section/`
**组件**: `VideoContentSection.tsx` - 视频内容展示组合组件

**核心特性**:
- **内容组合**: 整合VideoInfoSection和RecommendationsList
- **滚动协调**: 接收并应用来自VideoPlayerSection的滚动处理器
- **布局管理**: 固定头部协调的占位空间处理
- **主题响应**: 动态样式缓存和主题集成

**内容组织模式**:
```typescript
<Animated.ScrollView onScroll={scrollHandler || undefined}>
  <View style={{ height: DERIVED.PLACEHOLDER_HEIGHT + insets.top }} />
  <VideoInfoSection videoMeta={videoMeta} />
  <RecommendationsList recommendations={mockRecommendations} />
</Animated.ScrollView>
```

## 架构实现模式

### FSD 合规性与组织

**切片结构标准**:
```
src/widgets/{widget-name}/
├── index.ts               # 切片导出边界
└── ui/
    └── {WidgetName}.tsx   # UI实现
```

**导出边界模式**:
每个组件通过index.ts文件强制执行清晰的模块边界:
```typescript
// 示例: /src/widgets/profile-header/index.ts
export { ProfileHeader } from './ui/ProfileHeader';
```

### 复合UI实现模式

**共享组件集成**:
组件一致地利用共享UI组件库:

```typescript
// StatsSection.tsx 示例
import { Card, Row, StatCard } from '@/shared/ui';

// ProfileHeader.tsx 示例  
import { Avatar, H2, Caption } from '@/shared/ui';
```

**组件间组合**:
架构支持组件间组合，如ProfileHeader中使用VIPBadge:
```typescript
import { VIPBadge } from '@/widgets/vip-badge';
```

### 数据结构模式

组件接受良好类型化的属性进行配置:
```typescript
interface StatsSectionProps {
  stats: StatItem[];
}

interface ProfileHeaderProps {
  name: string;
  userId: string;
  bio?: string;
  avatarSize?: number;
  showVIP?: boolean;
}
```

## 主题集成策略

### 一致的主题系统使用

所有组件使用两种主要模式实现主题集成:

**模式1: useThemedStyles钩子 (首选)**
```typescript
import { useThemedStyles } from '@/shared/lib/styles';

const styles = useThemedStyles((theme) => ({
  container: {
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
  },
}));
```

**模式2: 直接useTheme钩子**
```typescript
import { useTheme } from '@/shared/providers/ThemeProvider';

const { theme, isDark } = useTheme();
```

### 设计令牌遵循

组件严格遵循设计令牌系统:
- **间距**: `theme.spacing.{xs|sm|md|lg|xl}`
- **颜色**: `theme.colors.{primary|surface|border|text}`
- **排版**: `theme.fontSize.{sm|md|lg|xl}`
- **圆角**: `theme.borderRadius.{sm|md}`

## 与页面层集成

### 页面组合模式

页面将组件作为主要构建块进行组合:
```typescript
// ProfilePage.tsx
import { ProfileHeader } from '@/widgets/profile-header';
import { StatsSection } from '@/widgets/stats-section';

export function ProfilePage() {
  return (
    <PageContainer>
      <ProfileHeader name="张三" userId="10086" />
      <StatsSection stats={learningStats} />
      {/* 其他页面内容 */}
    </PageContainer>
  );
}
```

### 导航集成

BlurTabBar组件直接与Expo Router的标签页导航集成:
```typescript
// app/(tabs)/_layout.tsx
import { BlurTabBar } from '@/widgets/tab-bar/ui/BlurTabBar';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <BlurTabBar {...props} />}>
      {/* 标签页屏幕 */}
    </Tabs>
  );
}
```

## 高级实现模式

### 平台特定样式

BlurTabBar展示了复杂的平台适配:
```typescript
...(!isDark && Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
  },
  android: {
    elevation: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
}))
```

### 现代React Native特性

使用expo-blur实现复杂的视觉效果:
```typescript
<BlurView
  style={styles.blurView}
  tint={isDark ? 'regular' : 'light'}
  intensity={isDark ? 40 : 50}
>
```

### 动态图标映射

实现灵活的图标系统:
```typescript
function getIconName(routeName: string, focused: boolean): any {
  const iconMap: Record<string, { focused: string; outline: string }> = {
    collections: { focused: 'library', outline: 'library-outline' },
    learn: { focused: 'book', outline: 'book-outline' },
    profile: { focused: 'person', outline: 'person-outline' },
  };
  // 动态图标选择逻辑
}
```

## 开发约定

### TypeScript集成

- 所有组件使用适当的TypeScript接口
- 属性具有可选参数的良好类型
- JSDoc注释提供全面文档

### 组件文档

每个组件包含详细的JSDoc:
```typescript
/**
 * 用户信息头部组件
 * @param name 用户姓名
 * @param userId 用户ID
 * @param bio 个人简介
 * @param avatarSize 头像大小，默认80
 * @param showVIP 是否显示VIP徽章，默认true
 */
export function ProfileHeader({ /* props */ }: ProfileHeaderProps) {
```

### 可访问性考虑

- 交互元素使用适当的TouchableOpacity
- 通过组件属性进行语义标记
- 平台适配的反馈模式

## 扩展模式建议

基于当前实现，未来组件应遵循这些建立的模式:

1. **结构**: 使用标准的切片/分段FSD结构
2. **依赖**: 利用shared/ui组件，避免直接功能依赖
3. **主题化**: 使用`useThemedStyles`实现一致的主题集成
4. **类型化**: 提供全面的TypeScript接口
5. **文档**: 包含所有公共API的JSDoc
6. **组合**: 设计为跨多个页面可重用
7. **平台感知**: 在适当的地方考虑平台特定优化

## 当前差距与机会

### 已实现的高级特性

1. **功能集成**: ✅ 视频组件实现了深度功能层集成模式
2. **实体使用**: ✅ 视频组件与entities/video进行了SharedValue协调
3. **动画**: ✅ React Native Reanimated高级动画实现 (video-player-section)
4. **多功能组合**: ✅ 建立了跨功能特性组合的架构模式

### 未来扩展机会

1. **测试**: 为高级动画组件建立测试模式
2. **状态管理**: 扩展复杂组件状态管理模式
3. **跨平台优化**: 视频组件的平台特定优化

### 潜在新组件

基于页面需求，可考虑的新组件:
- **学习卡片组件** (LearningCard) - 用于学习页面
- **收藏项组件** (CollectionItem) - 用于收藏页面
- **搜索栏组件** (SearchBar) - 跨页面搜索功能
- **进度指示器** (ProgressIndicator) - 学习进度展示

---

*此文档记录了my-word-app组件层的完整实现状态和架构模式。组件层展示了成熟的架构模式，为在FSD方法论中构建复杂、可重用UI组件提供了坚实基础。*