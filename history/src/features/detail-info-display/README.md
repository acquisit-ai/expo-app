# Detail Info Display Feature

视频详情信息展示功能模块,负责在视频播放页面展示视频的元数据信息,包括标题、描述和标签等内容。

## 🎯 设计理念

### 核心职责
- **元数据展示**: 显示视频标题、描述和标签信息
- **主题适配**: 自动适配应用的深色/浅色主题
- **响应式布局**: 支持不同屏幕尺寸的自适应显示
- **类型安全**: 完整的 TypeScript 类型定义

### 架构原则
- **依赖上游**: 依赖 `entities/video` 获取视频元数据
- **Context隔离**: 使用独立的Feature级别Context管理状态
- **纯展示组件**: 不包含交互逻辑,专注于信息展示
- **主题系统集成**: 使用 `shared/providers/ThemeProvider` 统一主题

## 📁 目录结构

```
src/features/detail-info-display/
├── hooks/                           # Context和Hooks
│   └── VideoInfoDisplayContext.tsx  # Feature级别状态管理
├── model/                          # 类型定义
│   └── types.ts                    # VideoMeta类型定义
├── ui/                            # UI组件层
│   ├── VideoInfoDisplaySection.tsx # 完整Feature组件(Provider包装)
│   └── VideoInfoSection.tsx        # 实际渲染组件(Context消费者)
├── index.ts                       # 功能模块统一导出
└── README.md                      # 本文档
```

## 🏗️ 核心架构

### 数据流向图

```
┌─────────────────────────────────────────────────────────┐
│                 视频详情信息展示数据流                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  entities/video                                        │
│  ├─ currentVideo                                       │
│  └─ currentVideo.meta ──────────┐                     │
│       ├─ id                     │                     │
│       ├─ title                  │                     │
│       ├─ description            │                     │
│       ├─ video_url              │                     │
│       ├─ tags                   │                     │
│       └─ duration               │                     │
│                                 │                     │
│                                 ▼                     │
│          VideoInfoDisplayProvider                     │
│          ┌────────────────────┐                      │
│          │ Context状态管理     │                      │
│          │ ├─ videoMeta        │                      │
│          │ └─ null             │                      │
│          └────────────────────┘                      │
│                    │                                  │
│                    ▼                                  │
│           VideoInfoSection                            │
│           (渲染标题/描述/标签)                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Context架构设计

**单点耦合模式** - 只有VideoInfoDisplayProvider与entities/video耦合:

```typescript
// Provider - 作为单一数据源
VideoInfoDisplayProvider
├─ 订阅 entities/video (selectCurrentVideo)
├─ 提取 videoMeta
└─ Context分发

        ↓

VideoInfoSection (纯Context消费者)
├─ 消费 videoMeta
├─ 渲染UI
└─ 主题适配
```

## 📊 类型系统

### 核心类型

```typescript
/**
 * 视频元数据类型 - 从 entities/video 导入
 */
export type VideoMeta = CurrentVideo['meta'];

/**
 * 完整的CurrentVideo类型结构
 */
interface CurrentVideo {
  readonly meta: {
    id: string;              // 视频唯一标识
    title: string;           // 视频标题
    description: string;     // 视频描述
    video_url: string;       // 视频URL
    tags: string[];          // 标签数组
    duration?: number;       // 视频总长度(秒)
  };
}

/**
 * Context状态类型
 */
interface VideoInfoDisplayContextValue {
  videoMeta: VideoMeta | null;  // 视频元数据或null
}
```

## 🔧 核心实现

### 1. Context Provider (`VideoInfoDisplayContext.tsx`)

完全依赖entities/video的数据源设计:

```typescript
import { useVideoStore, selectCurrentVideo } from '@/entities/video';

export const VideoInfoDisplayProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  // 订阅video entity的当前视频数据
  const currentVideo = useVideoStore(selectCurrentVideo);
  const videoMeta = currentVideo?.meta ?? null;

  // Context值缓存,仅在videoMeta变化时更新
  const value = useMemo(() => ({
    videoMeta,
  }), [videoMeta]);

  return (
    <VideoInfoDisplayContext.Provider value={value}>
      {children}
    </VideoInfoDisplayContext.Provider>
  );
};

// Context消费Hook
export const useVideoInfoDisplay = () => {
  const context = useContext(VideoInfoDisplayContext);
  if (!context) {
    throw new Error('useVideoInfoDisplay must be used within a VideoInfoDisplayProvider');
  }
  return context;
};
```

### 2. 完整Feature组件 (`VideoInfoDisplaySection.tsx`)

作为对外暴露的完整组件,包含Provider包装:

```typescript
export const VideoInfoDisplaySection = React.memo(function VideoInfoDisplaySection() {
  return (
    <VideoInfoDisplayProvider>
      <VideoInfoSection />
    </VideoInfoDisplayProvider>
  );
});
```

### 3. 渲染组件 (`VideoInfoSection.tsx`)

纯Context消费者,负责UI渲染:

```typescript
export const VideoInfoSection = React.memo(function VideoInfoSection() {
  const { theme } = useTheme();
  const { videoMeta } = useVideoInfoDisplay();

  // 空状态处理
  if (!videoMeta) {
    return null;
  }

  // 动态样式 - 响应主题变化
  const dynamicStyles = React.useMemo(() => StyleSheet.create({
    contentContainer: {
      backgroundColor: theme.colors.background,
      minHeight: 600,
    },
    description: {
      marginBottom: 16,
      lineHeight: 20,
      color: theme.colors.onSurface,
    },
    tag: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
    },
    tagText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  }), [theme]);

  return (
    <View style={dynamicStyles.contentContainer}>
      <View style={styles.infoContainer}>
        {/* 标题 */}
        <Text variant="headlineSmall" style={styles.title}>
          {videoMeta.title}
        </Text>

        {/* 描述 */}
        <Text variant="bodyMedium" style={dynamicStyles.description}>
          {videoMeta.description}
        </Text>

        {/* 标签列表 */}
        <View style={styles.tagsContainer}>
          {videoMeta.tags.map((tag, index) => (
            <View key={index} style={dynamicStyles.tag}>
              <Text variant="labelSmall" style={dynamicStyles.tagText}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});
```

## 🔌 集成方案

### 基础集成（推荐）

```typescript
import { VideoInfoDisplaySection } from '@/features/detail-info-display';

function VideoDetailPage() {
  return (
    <ScrollView>
      {/* 视频播放器 */}
      <VideoPlayer />

      {/* 视频详情信息 */}
      <VideoInfoDisplaySection />
    </ScrollView>
  );
}
```

### 高级自定义集成

如果需要更细粒度的控制:

```typescript
import {
  VideoInfoDisplayProvider,
  VideoInfoSection,
  useVideoInfoDisplay
} from '@/features/detail-info-display';

function CustomVideoDetail() {
  return (
    <VideoInfoDisplayProvider>
      <CustomLayout>
        {/* 使用Context消费组件 */}
        <VideoInfoSection />

        {/* 自定义组件也可以访问Context */}
        <CustomMetaDisplay />
      </CustomLayout>
    </VideoInfoDisplayProvider>
  );
}

// 自定义组件访问Context
function CustomMetaDisplay() {
  const { videoMeta } = useVideoInfoDisplay();

  if (!videoMeta) return null;

  return (
    <View>
      <Text>视频ID: {videoMeta.id}</Text>
      <Text>时长: {videoMeta.duration}秒</Text>
    </View>
  );
}
```

## 🎨 样式系统

### 主题适配

组件完全集成React Native Paper主题系统:

```typescript
// 主题颜色使用
theme.colors.background        // 容器背景色
theme.colors.onSurface        // 描述文本色
theme.colors.surfaceVariant   // 标签背景色
theme.colors.onSurfaceVariant // 标签文本色
```

### 响应式设计

```typescript
// 静态样式
const styles = StyleSheet.create({
  infoContainer: {
    paddingHorizontal: 16,  // 水平内边距
    paddingTop: 0,
    paddingBottom: 32,      // 底部留白
  },
  title: {
    marginTop: 12,
    marginBottom: 12,
    fontWeight: '600',      // 标题加粗
  },
  tagsContainer: {
    flexDirection: 'row',   // 横向排列
    flexWrap: 'wrap',       // 自动换行
    gap: 8,                 // 标签间距
    marginBottom: 24,
  },
});

// 动态样式 - 响应主题变化
const dynamicStyles = useMemo(() => StyleSheet.create({
  contentContainer: {
    backgroundColor: theme.colors.background,
    minHeight: 600,         // 最小高度保证内容区域
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,         // 描述行高
    color: theme.colors.onSurface,
  },
  tag: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,       // 圆角标签
  },
}), [theme]);
```

## ⚡ 性能优化

### 1. React.memo优化

```typescript
// 组件级别的memo优化
export const VideoInfoDisplaySection = React.memo(function VideoInfoDisplaySection() {
  // 仅在props变化时重新渲染(当前无props,永不重渲染)
});

export const VideoInfoSection = React.memo(function VideoInfoSection() {
  // 仅在Context数据或主题变化时重新渲染
});
```

### 2. useMemo缓存

```typescript
// Context值缓存
const value = useMemo(() => ({
  videoMeta,
}), [videoMeta]);

// 动态样式缓存
const dynamicStyles = useMemo(() => StyleSheet.create({
  // 仅在主题变化时重新计算样式
}), [theme]);
```

### 3. 条件渲染

```typescript
// 空状态早期返回,避免不必要的渲染
if (!videoMeta) {
  return null;
}
```

### 4. Selector优化

```typescript
// 使用精确的selector避免过度订阅
const currentVideo = useVideoStore(selectCurrentVideo);
// 只在currentVideo变化时触发更新
```

## 🔍 调试支持

### 开发环境检查

```typescript
// 检查videoMeta数据
const { videoMeta } = useVideoInfoDisplay();
console.log('Video Meta:', videoMeta);

// 输出示例
{
  id: "video-123",
  title: "Learning English with Movies",
  description: "Improve your English skills...",
  video_url: "https://example.com/video.mp4",
  tags: ["English", "Learning", "Movies"],
  duration: 300
}
```

### 常见问题排查

1. **组件不显示内容**
   - 检查 `videoMeta` 是否为 `null`
   - 确认 `entities/video` 的 `currentVideo` 已正确设置

2. **主题样式不生效**
   - 确认应用已包装 `ThemeProvider`
   - 检查 `useTheme` Hook是否正常工作

3. **Context错误**
   - 确保组件在 `VideoInfoDisplayProvider` 内部使用
   - 检查Provider是否正确包装子组件

## 🧪 测试策略

### 单元测试

```typescript
describe('VideoInfoDisplaySection', () => {
  it('should render video info when videoMeta exists', () => {
    // 测试有数据时的渲染
  });

  it('should return null when videoMeta is null', () => {
    // 测试空状态处理
  });

  it('should adapt to theme changes', () => {
    // 测试主题适配
  });
});
```

### 集成测试

```typescript
describe('VideoInfoDisplay Integration', () => {
  it('should display data from video entity', () => {
    // 测试与entities/video的集成
  });

  it('should update when video changes', () => {
    // 测试数据变化响应
  });
});
```

## 🚀 技术亮点

### 1. Context隔离架构
- **单点耦合**: 只有Provider与外部依赖耦合
- **纯消费组件**: UI组件完全依赖Context,零外部依赖
- **灵活组合**: 支持Provider包装和独立使用两种模式

### 2. 主题系统集成
- **完全适配**: 所有颜色从主题系统获取
- **动态响应**: 主题切换时自动更新样式
- **类型安全**: 使用TypeScript确保主题属性正确

### 3. 性能优化模式
- **React.memo**: 避免不必要的重新渲染
- **useMemo缓存**: 样式和Context值精确缓存
- **精确selector**: 只订阅需要的数据切片

### 4. 类型安全保障
- **完整类型**: 从entities/video导入类型,确保一致性
- **空值安全**: 完善的null检查和早期返回
- **Context类型**: 严格的Context类型定义和使用检查

## 📋 API文档

### 导出组件

#### VideoInfoDisplaySection

完整的Feature组件,包含Provider包装。

```typescript
import { VideoInfoDisplaySection } from '@/features/detail-info-display';

<VideoInfoDisplaySection />
```

**Props**: 无

**特性**:
- 自动订阅video entity数据
- 内置Provider,无需额外包装
- 完全自给自足的使用模式

#### VideoInfoSection

纯渲染组件,需要在VideoInfoDisplayProvider内使用。

```typescript
import {
  VideoInfoDisplayProvider,
  VideoInfoSection
} from '@/features/detail-info-display';

<VideoInfoDisplayProvider>
  <VideoInfoSection />
</VideoInfoDisplayProvider>
```

**Props**: 无

**特性**:
- 纯Context消费者
- 适用于自定义布局场景

### 导出Hooks

#### useVideoInfoDisplay

消费VideoInfoDisplayContext的Hook。

```typescript
import { useVideoInfoDisplay } from '@/features/detail-info-display';

function CustomComponent() {
  const { videoMeta } = useVideoInfoDisplay();

  // 使用videoMeta数据
  return <View>...</View>;
}
```

**返回值**:
```typescript
{
  videoMeta: VideoMeta | null;  // 视频元数据或null
}
```

**异常**:
- 如果在Provider外使用,抛出错误

### 导出类型

#### VideoMeta

```typescript
import type { VideoMeta } from '@/features/detail-info-display';

type VideoMeta = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  tags: string[];
  duration?: number;
};
```

## 📐 FSD架构合规性

### 层级定位

```
src/features/detail-info-display/  (Features层 - 业务功能)
├── → entities/video/              (✅ 向下依赖Entity层)
├── → shared/providers/            (✅ 向下依赖Shared层)
└── → shared/ui/                   (✅ 向下依赖Shared层)
```

### 职责边界

**负责**:
- ✅ 视频元数据的展示逻辑
- ✅ Feature级别的Context管理
- ✅ 主题适配和响应式布局

**不负责**:
- ❌ 视频数据的获取和存储(由entities/video负责)
- ❌ 用户交互和导航(由widgets或pages负责)
- ❌ 全局状态管理(由entities负责)

### 依赖规则

- ✅ 依赖 `entities/video` 获取数据
- ✅ 依赖 `shared/providers/ThemeProvider` 获取主题
- ✅ 依赖 `shared/ui` 使用基础组件
- ❌ 不依赖其他features
- ❌ 不依赖widgets或pages层

---

**Detail Info Display Feature v1.0** - 简洁、高效、可维护的视频详情展示解决方案
