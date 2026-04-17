# 项目架构与技术栈

本文档为 AI 智能体提供了本项目（一个基于 React Native 和 Expo 的单词学习应用）的架构、技术栈和文件结构的权威指南。**在进行任何代码更改之前，必须先阅读并理解本文档。**

## 1. 核心架构：功能切片设计 (Feature-Sliced Design, FSD)

本项目采用 **功能切片设计 (FSD)** 作为核心代码组织方法。FSD 通过严格的、标准化的分层和模块化规则，将应用分解为易于管理、高度解耦的业务领域模块。

**项目成熟度**：本项目现已达到企业级标准，所有层级完全实现，架构稳定且无技术债务。

### FSD 层级结构与职责

代码库位于 `/src` 目录中，并分为七个层级。依赖规则是单向的：**上层可以依赖下层，但下层绝不能依赖上层。同层之间也禁止相互依赖。**

| 层级 (Layer) | 目录 (`/src`) | 核心职责 |
| :--- | :--- | :--- |
| **`app`** | `app/` | 应用入口、全局配置和导航架构。负责初始化所有服务、全局上下文提供者 (Providers) 和 React Navigation 导航器组合。**参考实现**: `app/navigation/` - 条件渲染导航栈、Modal Presentation、Replace模式。 |
| **`pages`** | `pages/` | 代表一个完整的、可路由的屏幕。负责组合 `widgets` 和 `features` 来构建 UI。使用 React Navigation 进行页面导航。 |
| **`widgets`** | `widgets/` | 可复用的、由多个 `features` 和 `entities` 组成的复合 UI 块。是页面的主要构成部分。**参考实现**: `widgets/small-video-player-section/` 和 `widgets/fullscreen-video-player-section/` - 多功能组合，SharedValue动画协调，跨Widget通信模式。 |
| **`features`** | `features/` | 封装单一、完整的用户交互逻辑，为用户提供直接的业务价值（例如，点击按钮、提交表单）。**参考实现**: `features/video-player/` - 策略模式UI架构，Props-Based Data Flow，Context Provider模式。 |
| **`entities`** | `entities/` | 定义核心业务领域模型（例如，用户、视频）及其相关的数据、UI 和基础逻辑。**参考实现**: `entities/video/` - v6.0.0单指针架构，`entities/video-meta/` - SSOT架构，`entities/player-pool/` - LRU缓存管理。 |
| **`shared`** | `shared/` | 存放与业务无关的、可在全应用范围内复用的基础代码（例如，UI Kit、API 客户端、工具函数）。 |

### 切片 (Slices) 与段 (Segments)

- **切片 (Slices)**: 在 `pages`, `widgets`, `features`, `entities` 层内，代码按业务领域进行垂直分区（例如 `entities/user`）。
- **段 (Segments)**: 在每个切片内部，代码按技术用途进行水平分区，文件夹通常命名为 `ui`, `model`, `api`, `lib`。

**关键规则：** 外部模块只能通过每个切片根目录下的 `index.ts` 文件导入所需内容，这强制实现了模块封装。

### FSD 三层架构参考实现

本项目的**视频系统**和**Feed系统**展示了完美的三层 FSD 架构协调模式，作为企业级实现范例：

**视频系统架构**（⭐ v5.0.0条件订阅重构完成 - 多视频场景性能优化）：
- **entities/video/**: v5.0.0条件订阅架构(useConditionalVideoPlayer) + 单指针架构(currentPlayerMeta: {playerInstance, videoId}) + Store精简(移除session状态) + 细粒度订阅 + player-controls工具库 + 99%性能提升
- **entities/video-meta/**: SSOT架构 + Map-based O(1)存储 + subscribeWithSelector优化 + 响应式更新 + 用户交互数据统一管理(isLiked/isFavorited/viewCount等)
- **entities/player-pool/**: v5.0.0 VideoId-Based架构 + Feed裁剪完全免疫 + LRU缓存管理(17实例:13主池+4available) + 窗口扩展功能(extendWindowNext/Prev) + 动态索引计算(indexOf) + PreloadScheduler三层调度 + O(1)任务取消 + 双锁机制 + 双池双模式管理
- **features/video-player/**: Props-Based Data Flow架构 + 组件拆分(SmallVideoPlayer/FullscreenVideoPlayer) + HLS支持(300ms debounce) + 自动播放功能
- **features/video-core-controls/**: 策略模式UI架构参考实现 + 三专用布局策略(SmallScreen/FullscreenPortrait/FullscreenLandscape) + VideoCoreControlsProvider + 独立Context设计
- **features/video-gestures/**: 跨功能手势协调 + 多层事件处理 + SharedValue手势处理 + 非破坏性交互模型
- **features/video-window-management/**: v1.0依赖注入架构 + Feature层协调模块 + 解决Player Pool对其他Entities依赖 + 多Entity数据协调 + 回调工厂模式 + 窗口扩展API封装
- **widgets/video-controls-overlay/**: v2.2多Feature组合Widget + FSD合规架构 + 组合video-core-controls+video-gestures+subtitle-display + 跨Feature状态协调 + 条件订阅集成 + 布局策略选择
- **features/playback-settings/**: 6档速度调节 + 音量控制 + 后台播放 + 长按触发(500ms)
- **features/detail-info-display/**: Context隔离架构 + 单点耦合设计 + 纯展示型Feature
- **features/detail-interaction-bar/**: 零状态Context代理 + 细粒度状态订阅 + 四项交互控制(点赞/收藏/翻译/字幕)
- **features/fullscreen-feed-list/**: TikTok式全屏滑动列表(规划中) + 分页滚动 + 单视频占满屏幕
- **features/subtitle-display/**: v3.2条件订阅 + useSubtitleNavigation独立Hook + 增强字幕系统 + 智能导航逻辑 + 点击跳转支持
- **widgets/small-video-player-section/**: v2.0活跃视频判断 + 条件渲染优化 + 小屏播放器组合 + 双模式滚动动画 + 4+ features集成 + 90%性能提升
- **widgets/fullscreen-video-player-section/**: v2.0条件订阅支持 + 全屏播放器组合 + 三层组合架构 + 静态配置优化 + 架构一致性
- **widgets/tab-bar/**: 双TabBar实现(BlurTabBar + LiquidGlassTabBar) + React Navigation集成 + 动态选择 + 触觉反馈
- **app/navigation/**: RootNavigator条件渲染 + VideoStack Modal Presentation + Replace策略 + Screen包装器模式

**Feed系统架构**（⭐ v2.3 VideoId-Based滚动同步完成）：
- **entities/feed/**: v2.0.0 ID-based架构 + videoIds存储(不存完整对象) + Video Meta Entity集成 + 50条滑动窗口队列 + 播放状态管理 + `maintainVisibleContentPosition`集成
- **features/feed-fetching/**: 无状态API设计 + JWT认证 + 业务逻辑协调 + 增强防碰撞mock数据生成 + `isLoading`完整生命周期管理
- **features/feed-list/**: v1.4 Ref转发 + FlatList集成 + 视频卡片渲染 + 可见性管理 + 敏感度优化(`onEndReachedThreshold: 0.5`) + FEED_CONSTANTS导出 + getItemLayout优化
- **pages/feed/**: v2.3 智能滚动同步 + Feed裁剪免疫(indexOf videoId) + 全屏返回自动滚动 + Player Pool v5.0集成 + 初始化流程 + 加载更多控制 + 1秒防抖机制
- **pages/video-fullscreen/**: v3.0 VideoId-Based窗口管理 + Feed裁剪免疫 + 窗口扩展集成 + useFullscreenScrollWindow重构 + 动态索引计算 + 横竖屏切换 + 硬件返回键控制

这两套三层实现展示了 Feature-Sliced Design 的最佳实践，可作为新功能开发的架构参考。

## 2. 技术栈

下表汇总了本项目的核心第三方库及其在 FSD 架构中的作用和位置。

| 库 (Library) | 角色 | 选择理由 | FSD 集成位置 |
| :--- | :--- | :--- | :--- |
| **`@tanstack/react-query`** & **`@tanstack/react-query-persist-client`** | 服务端状态管理、缓存、离线同步 | 业界标杆，强大的离线和持久化支持，原生解决数据同步和请求队列问题。 | 通过 hooks 在 `features` 和 `entities` 的 `model` 或 `api` 段中使用。 |
| **`zustand`** | 全局客户端状态管理（UI 状态） | API 极简，无模板代码，适合管理主题、模态框等简单全局状态。 | Stores 定义在 `shared/model` 中，可在全应用通过 hooks 消费。 |
| **`drizzle-orm`** & **`drizzle-kit`** | 类型安全的 SQLite ORM 和迁移工具 | 提供编译时 SQL 查询校验，杜绝运行时错误，提升数据库操作的健壮性。 | Schema 定义在 `entities/{slice}/model`，服务封装在 `shared/lib`。 |
| **`expo-sqlite`** | 底层 SQLite 数据库驱动 | Expo 生态内建的高性能本地数据库解决方案。 | 被 `drizzle-orm` 的 expo 驱动程序封装，对上层代码透明。 |
| **`react-hook-form`** & **`@hookform/resolvers`** & **`zod`** | 表单状态管理与验证 | 高性能、类型安全的表单处理方案。 | 主要在 `features` 层的 UI 组件中使用，Schemas 定义在 `entities/{slice}/model`。 |
| **`@react-navigation/native`** & **`@react-navigation/stack`** & **`@react-navigation/bottom-tabs`** | React Navigation 核心导航系统 | 业界标准的导航解决方案，支持Stack、Tab、Modal等多种导航模式，完全类型安全。 | 导航器配置在 `src/app/navigation/` 中，包含RootNavigator、MainTabNavigator、VideoStackNavigator、AuthStackNavigator四层架构。 |
| **`expo-glass-effect`** | iOS 18+ 液态玻璃效果 | Expo官方新一代视觉效果库，提供原生iOS液态玻璃效果，性能优异。 | 在 `widgets/tab-bar/` 的 LiquidGlassTabBar 中使用，通过 `isLiquidGlassAvailable()` 检测设备支持。 |
| **`react-native-size-matters`** | 响应式尺寸缩放 | 根据设备屏幕尺寸智能缩放UI元素，确保跨设备一致性。 | 封装在 `shared/lib/metrics.ts` 中，为样式工具提供缩放函数。 |
| **`@react-native-async-storage/async-storage`** | 本地数据持久化 | 跨平台的异步存储解决方案，用于保存用户偏好设置。 | 在 `shared/providers/ThemeProvider.tsx` 中用于主题模式持久化，在 `features/auth/api/supabase.ts` 中用于认证会话持久化。 |
| **`@supabase/supabase-js`** | 后端即服务 (BaaS)、用户认证、实时数据库 | 业界领先的 BaaS 平台，提供完整的认证系统、实时功能和云数据库，支持多种认证方式且针对 React Native 优化。 | 客户端配置在 `features/auth/api/supabase.ts`，认证逻辑在 `features/auth` 层，用户数据管理在 `entities/user` 层，通过事件驱动架构实现完美分离。 |
| **`react-native-reanimated`** | 高性能动画库 | 提供原生性能的流畅动画效果。 | 在 UI 组件和页面过渡中使用，视频播放页面采用高级动画架构（滚动偏移管理、共享值协调）。 |
| **`react-native-safe-area-context`** | 安全区域处理 | 处理刘海、状态栏等安全区域适配。 | 在布局组件中使用。 |
| **`react-native-screens`** | 原生屏幕管理 | 提供更高效的屏幕渲染性能。 | 与导航系统自动集成。 |
| **`@expo/vector-icons`** | 图标库 | Expo 官方图标库，包含多种图标集。 | 在 UI 组件中使用。 |
| **`@backpackapp-io/react-native-toast`** | 统一Toast通知系统 | 高性能的原生toast通知，支持手势交互和自动管理。 | 依赖注入架构实现于 `shared/lib/toast/`，包含ToastManager、品牌类型验证和React.memo优化，采用依赖注入模式解决循环依赖。 |
| **`react-native-modalfy`** | 模态框管理系统 | 集中式模态框管理，支持堆叠和类型安全。 | 配置在 `shared/lib/modal/`，模态框定义在各feature层，统一的 `AppModalStackParamsList` 类型安全。 |
| **`@react-native-segmented-control/segmented-control`** | 分段控制组件 | 原生iOS风格的分段控制器。 | 在 `features/playback-settings` 中用于播放速度选择，支持主题集成。 |
| **`expo-haptics`** | 触觉反馈 | 原生触觉反馈支持。 | 在用户交互组件中提供触觉反馈，如 `features/playback-settings` 的控制切换。 |
| **`react-native-paper`** | Material Design UI库 | 提供完整的Material Design组件系统，支持主题和响应式设计。 | 用于替代styled-components，主要集成在Toast组件和UI系统中，与主题系统深度集成。 |
| **`expo-video`** | 现代视频播放器组件 | Expo官方推出的新一代视频播放器，支持原生性能和高级功能。替代旧版expo-av，提供更好的性能和稳定性。 | 在 `features/video-player` 和相关组件中使用，支持高性能播放和控制。 |
| **`react-native-awesome-slider`** | 高性能滑块组件 | 基于React Native Reanimated的原生性能滑块，支持复杂动画和手势交互。 | 用于视频进度条和音量控制，提供流畅的用户交互体验。 |
| **`react-native-progress`** | 进度指示器组件库 | 提供多种进度条和加载指示器样式，支持动画效果。 | 用于视频缓冲指示、加载状态展示等场景。 |
| **`expo-glass-effect`** & **`expo-blur`** | 视觉效果库组合 | Expo官方玻璃态效果和模糊效果库，提供原生性能的视觉效果。 | 支持双视觉效果系统：Glassmorphism和Blur Effects并行运行。 |
| **Performance Optimization Libraries** | 样式缓存和预计算 | 减少运行时计算，提升渲染性能，防止内存泄漏。 | StyleSheet缓存和Paper主题优化在各层级组件中使用，专用hooks在 `shared/providers/` |

## 3. UI 与样式架构

本项目采用**设计系统 (Design System)** 方法，建立了完整的UI架构来确保视觉一致性和开发效率。

### 3.1 设计令牌系统 (Design Tokens)

**位置**: `src/shared/config/theme.ts`

设计令牌是所有视觉设计属性的"单一事实来源"，包括：

- **调色板**: 原始颜色值的集中管理
- **语义化颜色**: 按功能分类的颜色映射（primary、success、error等）
- **间距系统**: 基于4倍数的统一间距（4px, 8px, 12px...）
- **字体系统**: 字号、字重、行高的标准化定义
- **圆角系统**: 统一的borderRadius规范
- **阴影系统**: 层次感的阴影定义
- **动画时长**: 一致的动画持续时间

### 3.2 主题系统 (Theming)

**位置**: `src/shared/providers/ThemeProvider.tsx`

- **多模式支持**: 浅色、深色、自动跟随系统
- **持久化**: 用户选择自动保存到本地存储
- **类型安全**: 完整的TypeScript类型支持
- **热切换**: 实时主题切换无需重启应用

### 3.3 React Native Paper 架构

**位置**: `src/shared/ui/`

采用 React Native Paper 组件系统：

- **Paper 组件**: 使用 React Native Paper 的现代化组件
- **主题集成**: 自动集成主题系统，支持深色/浅色模式
- **类型安全**: 完整的 TypeScript 类型支持
- **响应式支持**: 集成 react-native-size-matters 进行设备适配
- **性能优化**: StyleSheet 和预计算样式提升渲染性能

### 3.4 UI组件库

**位置**: `src/shared/ui/`

完整的主题化组件库：

| 组件 | 功能 | 特性 |
|------|------|------|
| `Button` | 按钮组件 | 多变体、多尺寸、加载状态、图标支持 |
| `Input` | 输入框组件 | 标签、错误提示、帮助文本、图标 |
| `Card` | 卡片容器 | 可配置内边距、圆角、阴影、边框 |
| `Typography` | 文本组件 | H1/H2/H3/Body/Caption/Label语义化文本 |
| `Container` | 布局容器 | 安全区域、滚动、居中、背景色 |
| `Row/Column` | 布局组件 | Flexbox封装、间距控制、对齐方式 |
| `Spacer` | 间距组件 | 统一的垂直/水平间距管理 |
| `PageContainer` | 页面容器 | 统一的页面布局和安全区域处理 |
| `Avatar` | 头像组件 | 圆形头像，支持图片和占位符 |
| `ListItem` | 列表项组件 | 可配置的列表项，支持图标、标题、描述等 |
| `Switch` | 开关组件 | iOS风格的开关控件 |
| `SectionTitle` | 区块标题 | 统一的区块标题样式 |
| `ListSection` | 列表区块 | 分组列表容器 |
| `PageHeader` | 页面头部 | 标准化的页面头部组件 |
| `CenteredContent` | 居中内容 | 内容居中布局组件 |
| `StatCard` | 统计卡片 | 数据展示卡片组件 |
| `Alert` | 弹窗组件 | 带有多种预设的弹窗工具函数 |

### 3.5 响应式系统

**位置**: `src/shared/lib/metrics.ts`

- **智能缩放**: 基于react-native-size-matters的设备适配
- **缩放函数**: scale、verticalScale、moderateScale
- **样式集成**: 与样式工具无缝集成

### 3.6 开发规范

**严格禁止**:
- 硬编码颜色值（如`color: '#333333'`）
- 硬编码尺寸（如`width: 300`）
- 直接使用数值间距（如`margin: 10`）

**必须使用**:
- 主题颜色：`theme.colors.primary`
- 间距令牌：`theme.spacing.md`
- 响应式工具：`moderateScale(16)`
- UI组件库：`<Button>` 而不是 `<TouchableOpacity>`

### 3.7 Visual Effects Architecture

本项目实现了两套企业级视觉效果系统：**Glassmorphism** 和 **Blur Effects**，采用相同的工厂模式、预计算缓存和性能监控架构。

#### **Glassmorphism Architecture**

**位置**: `src/shared/config/theme/glass-factory.ts` 和 `src/shared/providers/GlassProvider.tsx`

企业级玻璃态效果系统，采用渐变+模糊的视觉效果：

#### **核心架构组件**
- **GlassStyleFactory**: 单例工厂模式，预计算和缓存所有玻璃态样式，支持双层缓存系统
- **GlassProvider**: 独立的玻璃态上下文管理器，与ThemeProvider解耦，提供专用hooks
- **Glass Presets**: 组件特定的玻璃态效果预设配置系统，包含Card、Input、Button等预设
- **Specialized Hooks**: 组件专用钩子(`useGlassCard`、`useGlassButton`等)，提供优化的样式访问

#### **性能优化架构**
- **样式预计算**: 所有样式在Provider初始化时一次性计算，避免运行时计算开销
- **双层缓存系统**: 
  - 第一层：样式对象缓存(isDark → 完整样式集)
  - 第二层：颜色透明度计算缓存(减少重复rgba转换)
- **内存安全**: 组件生命周期跟踪和自动内存管理，防止内存泄漏
- **钩子专用化**: 减少不必要重渲染的组件特定钩子，支持React.memo优化

#### **工厂模式实现**
```typescript
// 单例工厂实例，全局唯一
const glassStyleFactory = GlassStyleFactory.getInstance();

// 预计算样式与智能缓存，性能监控
const styles = glassStyleFactory.getStyles(isDark);
const cardPreset = glassStyleFactory.getPreset('card', isDark);
```

#### **集成架构**
- **提供器层次集成**: GlassProvider位于ThemeProvider和BlurProvider之间，接收isDark状态
- **组件使用模式**: Glass组件通过专用hooks使用预计算样式，支持热切换
- **开发模式监控**: 缓存大小监控、性能警告系统和样式重计算追踪
- **生产优化**: 缓存预热、样式压缩和批量更新优化

#### **Blur Effects Architecture**

**位置**: `src/shared/config/theme/blur/` 和 `src/shared/providers/BlurProvider.tsx`

企业级模糊态效果系统，采用语义化颜色+动画的视觉效果：

##### **核心架构组件**
- **BlurStyleFactory**: 单例工厂模式，预计算和缓存所有模糊态样式，支持双层缓存系统
- **BlurProvider**: 独立的模糊态上下文管理器，与GlassProvider并行运行，提供专用hooks
- **Blurism Configuration**: 语义化配置系统，包含10种颜色变体(success, error, warning等)
- **Specialized Hooks**: 组件专用钩子(`useBlurCard`、`useBlurButton`、`useBlurList`)，提供优化的样式访问

##### **性能优化架构**
- **样式预计算**: 所有样式在Provider初始化时一次性计算，避免运行时计算开销
- **双层缓存系统**:
  - 第一层：样式对象缓存(isDark → 完整样式集)
  - 第二层：颜色透明度计算缓存(减少重复rgba转换)
- **内存安全**: 组件生命周期跟踪和自动内存管理，防止内存泄漏
- **动画优化**: Reanimated集成，预设动画值避免运行时计算

##### **语义化颜色系统**
```typescript
// 10种语义化颜色变体，支持light/dark模式
type ColorVariant = 'default' | 'success' | 'error' | 'warning' | 'info'
                  | 'primary' | 'secondary' | 'neutral' | 'highlight' | 'disabled';
```

##### **工厂模式实现**
```typescript
// 单例工厂实例，与GlassStyleFactory并行运行
const blurStyleFactory = BlurStyleFactory.getInstance();

// 预计算样式与智能缓存，性能监控
const styles = blurStyleFactory.getStyles(isDark);
```

##### **集成架构**
- **提供器层次集成**: BlurProvider与GlassProvider并行运行，同时接收isDark状态
- **组件使用模式**: Blur组件通过专用hooks使用预计算样式，支持动画反馈
- **开发模式监控**: 缓存大小监控、性能警告系统和样式重计算追踪
- **双系统协调**: 与GlassProvider独立运行，总内存占用 <4KB

##### **双系统架构优势**

**并行运行模式**:
- **GlassProvider**: 处理玻璃态效果（渐变+透明+模糊），适用于优雅背景场景
- **BlurProvider**: 处理模糊态效果（语义化颜色+动画），适用于状态指示和交互反馈
- **独立缓存**: 双系统各自维护预计算样式缓存，总内存占用 <4KB
- **主题同步**: 两套系统同时接收isDark状态，保持主题一致性

**使用场景指南**:
- **Glassmorphism**: 品牌体验、输入表单、社交登录、优雅背景等场景
- **Blur Effects**: 状态指示、交互反馈、列表界面、语义化颜色等场景
- **性能选择**: Glass系统适用于静态美观，Blur系统适用于动态交互

## 4. 完整项目结构

```
/
├── app/                     # Expo 应用入口
│   ├── _layout.tsx          # 根布局 (五提供器层次)
│   └── index.tsx            # 应用入口组件
│
├── src/
│   ├── app/                 # ✅ 应用层 (导航架构) - 完整实现
│   │   ├── navigation/      # React Navigation 导航架构
│   │   │   ├── README.md    # 导航架构文档
│   │   │   ├── CONTEXT.md   # 导航技术文档
│   │   │   ├── index.ts     # 导航器统一导出
│   │   │   ├── RootNavigator.tsx           # 根导航器 (条件渲染)
│   │   │   ├── MainTabNavigator.tsx        # 主Tab导航器
│   │   │   ├── VideoStackNavigator.tsx     # 视频Stack导航器 (Modal)
│   │   │   ├── AuthStackNavigator.tsx      # 认证Stack导航器
│   │   │   └── screens/                    # Screen包装器
│   │   │       ├── FeedScreen.tsx          # Feed屏幕包装器
│   │   │       ├── CollectionsScreen.tsx   # 单词本屏幕包装器
│   │   │       ├── ProfileScreen.tsx       # 个人屏幕包装器
│   │   │       ├── VideoDetailScreen.tsx   # 视频详情屏幕包装器
│   │   │       ├── VideoFullscreenScreen.tsx # 全屏视频屏幕包装器
│   │   │       ├── LoginScreen.tsx         # 登录屏幕包装器
│   │   │       ├── VerifyCodeScreen.tsx    # 验证码屏幕包装器
│   │   │       └── PasswordManageScreen.tsx # 密码管理屏幕包装器
│   │   └── AppContent.tsx   # 应用内容组件
│   │
│   ├── pages/               # ✅ 页面层 (页面组件) - 完整实现
│   │   ├── auth/            # 认证页面模块
│   │   │   ├── README.md    # 认证页面文档
│   │   │   └── ui/
│   │   │       ├── AuthPageLayout.tsx    # 通用认证页面布局
│   │   │       ├── LoginPage.tsx         # 登录页面
│   │   │       ├── PasswordManagePage.tsx # 密码管理页面
│   │   │       └── VerifyCodePage.tsx    # 验证码页面
│   │   ├── feed/            # 视频流页面模块
│   │   │   ├── README.md    # Feed页面文档
│   │   │   ├── CONTEXT.md   # Feed页面技术文档
│   │   │   └── ui/
│   │   │       ├── FeedPage.tsx          # Feed页面主组件
│   │   │       └── FeedPageContent.tsx   # Feed页面内容组件
│   │   ├── collections/     # 单词本页面模块
│   │   │   ├── README.md    # 单词本页面文档
│   │   │   └── ui/CollectionsPage.tsx
│   │   ├── profile/         # 个人页面模块
│   │   │   ├── README.md    # 个人页面文档
│   │   │   └── ui/ProfilePage.tsx
│   │   ├── video-detail/    # 视频详情页面模块
│   │   │   ├── README.md    # 视频详情页面文档
│   │   │   ├── CONTEXT.md   # 视频详情技术文档
│   │   │   └── ui/
│   │   │       ├── VideoDetailPage.tsx        # 视频详情页面主组件
│   │   │       └── VideoDetailPageContent.tsx # 视频详情页面内容组件
│   │   └── video-fullscreen/ # 全屏视频页面模块
│   │       ├── README.md    # 全屏视频页面文档
│   │       ├── CONTEXT.md   # 全屏视频技术文档
│   │       ├── docs/
│   │       │   └── fullscreen-window-extension.md # 窗口扩展功能实现文档
│   │       ├── hooks/
│   │       │   └── useFullscreenScrollWindow.ts   # 全屏滚动窗口管理Hook
│   │       └── ui/
│   │           ├── VideoFullscreenPage.tsx        # 全屏视频页面主组件
│   │           ├── VideoFullscreenPageContent.tsx # 全屏视频页面内容组件
│   │           └── debug/
│   │               └── FullscreenDebugPanel.tsx   # 全屏调试面板
│   │
│   ├── widgets/             # ✅ 部件层 (复合 UI 块) - 完整实现
│   │   ├── CONTEXT.md       # 部件层架构文档
│   │   ├── index.ts         # 部件层统一导出
│   │   ├── tab-bar/         # 底部标签栏 (完整模块化实现)
│   │   │   ├── CONTEXT.md   # 标签栏技术文档
│   │   │   ├── README.md    # 标签栏用户文档
│   │   │   ├── config/      # 配置和常量
│   │   │   │   └── tabConfig.ts
│   │   │   ├── index.ts     # 标签栏模块导出
│   │   │   ├── lib/         # 工具函数
│   │   │   │   └── iconUtils.ts
│   │   │   ├── types/       # TypeScript类型定义
│   │   │   │   └── index.ts
│   │   │   └── ui/          # UI组件
│   │   │       ├── BlurTabBar.tsx          # 模糊效果TabBar
│   │   │       ├── LiquidGlassTabBar.tsx   # 液态玻璃TabBar (iOS 18+)
│   │   │       └── TabBarItem.tsx          # Tab项组件
│   │   ├── small-video-player-section/ # 小屏视频播放器区域
│   │   │   ├── CONTEXT.md   # 小屏播放器技术文档
│   │   │   ├── README.md    # 小屏播放器用户文档
│   │   │   ├── index.ts     # 小屏播放器导出
│   │   │   └── ui/
│   │   │       └── SmallVideoPlayerSection.tsx # 双模式滚动动画组合
│   │   ├── fullscreen-video-player-section/ # 全屏视频播放器区域
│   │   │   ├── CONTEXT.md   # 全屏播放器技术文档
│   │   │   ├── README.md    # 全屏播放器用户文档
│   │   │   ├── index.ts     # 全屏播放器导出
│   │   │   └── ui/
│   │   │       └── FullscreenVideoPlayerSection.tsx # 三层组合架构
│   │   ├── video-controls-overlay/ # 视频控件覆盖层Widget (v2.2多Feature组合)
│   │   │   ├── CONTEXT.md   # 控件覆盖层技术文档
│   │   │   ├── index.ts     # Widget导出
│   │   │   ├── ui/          # UI组件
│   │   │   │   ├── VideoControlsOverlay.tsx  # 主组件
│   │   │   │   ├── AnimatedPlayButton.tsx    # 动画播放按钮
│   │   │   │   └── SeekFeedback.tsx          # 快进回退反馈
│   │   │   └── hooks/       # 组合Hooks
│   │   │       ├── useVideoControlsComposition.ts # 核心组合逻辑
│   │   │       ├── useVideoGestureCallbacks.ts    # 手势回调
│   │   │       ├── useControlsAutoHide.ts         # 自动隐藏
│   │   │       ├── useScrollAwareVisibility.ts    # 滚动感知
│   │   │       └── useVideoAnimation.ts           # 动画逻辑
│   │   └── video-player-section/ # ⚠️ 已废弃 (拆分为上述两个模块)
│   │       └── CONTEXT.md   # 废弃说明文档
│   │
│   ├── features/            # ✅ 功能层 (用户交互) - 扩展实现
│   │   ├── auth/            # 认证UI功能模块 (类基架构)
│   │   │   ├── model/       # 状态管理模型层
│   │   │   │   ├── auth-state-manager.ts # 认证状态管理器类
│   │   │   │   ├── auth-types.ts         # 认证类型定义
│   │   │   │   ├── cooldown-manager.ts   # 冷却时间管理器类
│   │   │   │   ├── validation.ts         # Zod验证schemas
│   │   │   │   ├── CONTEXT.md            # 认证模型层文档
│   │   │   │   └── index.ts              # 模型层导出
│   │   │   ├── api/         # API层 (专用目录)
│   │   │   │   ├── auth-api.ts         # Supabase API封装
│   │   │   │   ├── supabase.ts         # Supabase客户端实例
│   │   │   │   └── index.ts            # API层导出
│   │   │   ├── lib/         # 工具库层
│   │   │   │   ├── auth-helpers.ts     # 认证辅助工具函数
│   │   │   │   ├── auth-operations.ts  # 认证业务逻辑协调器
│   │   │   │   ├── config.ts           # 认证配置常量
│   │   │   │   ├── error-utils.ts      # 错误处理工具
│   │   │   │   ├── useFormValidation.ts # 表单验证hook
│   │   │   │   └── index.ts            # 工具库导出
│   │   │   ├── ui/          # UI组件层
│   │   │   │   ├── AuthLoginCard.tsx      # 主登录卡片组件(简化状态管理)
│   │   │   │   ├── BaseAuthCard.tsx       # 认证卡片包装器
│   │   │   │   ├── PasswordToggleIcon.tsx # 密码切换组件
│   │   │   │   ├── ForgotPasswordLink.tsx # 忘记密码链接
│   │   │   │   ├── SocialLoginButtons.tsx # 社交登录按钮
│   │   │   │   ├── AuthEmailCodeCard.tsx  # 邮箱验证码卡片
│   │   │   │   ├── AuthResetPasswordCard.tsx # 密码重置卡片
│   │   │   │   ├── LoginHeader.tsx        # 认证页面头部
│   │   │   │   ├── FormField.tsx          # 表单字段组件
│   │   │   │   └── index.ts               # UI导出
│   │   │   ├── README.md    # 认证功能概览文档
│   │   │   └── index.ts     # 认证功能导出
│   │   ├── theme/           # 主题切换功能
│   │   │   └── ui/ThemeCard.tsx
│   │   ├── video-player/    # 视频播放器UI功能模块 (Props-Based Data Flow + 组件拆分)
│   │   │   ├── CONTEXT.md   # 视频播放器技术文档
│   │   │   ├── README.md    # 视频播放器用户文档
│   │   │   ├── ui/          # UI组件层
│   │   │   │   ├── SmallVideoPlayer.tsx           # 小屏播放器组件
│   │   │   │   ├── FullscreenVideoPlayer.tsx      # 全屏播放器组件
│   │   │   │   └── components/                    # 子组件
│   │   │   ├── hooks/       # 专用钩子
│   │   │   ├── model/       # 类型定义
│   │   │   ├── lib/         # 工具库
│   │   │   └── index.ts     # 功能统一导出
│   │   ├── video-core-controls/ # 视频核心控件功能模块 (策略模式UI架构参考实现)
│   │   │   ├── CONTEXT.md   # 核心控件技术文档
│   │   │   ├── README.md    # 核心控件用户文档
│   │   │   └── ui/          # UI组件层
│   │   ├── video-gestures/   # 视频手势功能模块
│   │   │   ├── CONTEXT.md   # 手势功能技术文档
│   │   │   ├── README.md    # 手势功能用户文档
│   │   │   └── ui/          # UI组件层
│   │   ├── video-window-management/ # 视频窗口管理功能模块 (NEW v1.0)
│   │   │   ├── CONTEXT.md   # 窗口管理依赖注入架构文档
│   │   │   └── index.ts     # Feature统一导出（依赖注入API）
│   │   ├── playback-settings/ # 播放设置功能模块
│   │   │   ├── CONTEXT.md   # 播放设置技术文档
│   │   │   ├── README.md    # 播放设置用户文档
│   │   │   └── ui/          # UI组件层
│   │   ├── detail-info-display/ # 视频详情展示功能模块
│   │   │   ├── README.md    # 详情展示用户文档
│   │   │   ├── CONTEXT.md   # 详情展示技术文档
│   │   │   ├── hooks/       # Context钩子
│   │   │   │   └── VideoInfoDisplayContext.tsx
│   │   │   ├── model/       # 类型定义
│   │   │   │   └── types.ts
│   │   │   ├── ui/          # UI组件层
│   │   │   │   ├── VideoInfoDisplaySection.tsx  # 完整Feature组件
│   │   │   │   └── VideoInfoSection.tsx         # 渲染组件
│   │   │   └── index.ts     # 功能统一导出
│   │   ├── detail-interaction-bar/ # 视频交互栏功能模块
│   │   │   ├── README.md    # 交互栏用户文档
│   │   │   ├── CONTEXT.md   # 交互栏技术文档
│   │   │   ├── hooks/       # Context钩子
│   │   │   │   └── VideoInteractionContext.tsx
│   │   │   ├── ui/          # UI组件层
│   │   │   │   ├── VideoInteractionSection.tsx  # 完整Feature组件
│   │   │   │   └── VideoInteractionBar.tsx      # 渲染组件
│   │   │   └── index.ts     # 功能统一导出
│   │   ├── fullscreen-feed-list/ # 全屏视频列表功能模块 (规划中)
│   │   │   ├── README.md    # 全屏列表用户文档
│   │   │   ├── CONTEXT.md   # 全屏列表技术文档
│   │   │   ├── lib/         # 工具函数
│   │   │   ├── model/       # 类型定义
│   │   │   ├── ui/          # UI组件层
│   │   │   └── index.ts     # 功能统一导出
│   │   ├── feed-list/       # Feed列表功能模块
│   │   │   ├── README.md    # Feed列表文档
│   │   │   ├── lib/         # 工具函数
│   │   │   │   └── constants.ts  # Feed常量配置(FEED_CONSTANTS)
│   │   │   └── ui/          # UI组件层
│   │   ├── feed-fetching/   # Feed数据获取功能模块
│   │   │   ├── README.md    # Feed获取文档
│   │   │   └── api/         # API层
│   │   ├── subtitle-fetching/ # 字幕数据源功能模块 (v2.0架构 - 完整处理管道 + 时间单位统一)
│   │   │   ├── README.md    # 字幕数据源架构文档 (v2.0 - 三层缓存+完整处理+时间统一)
│   │   │   ├── CONTEXT.md   # 字幕数据源架构实现 (完整处理管道、时间单位统一、三层缓存)
│   │   │   ├── USAGE.md     # 使用指南文档
│   │   │   ├── index.ts     # 字幕数据源统一导出
│   │   │   ├── api/         # API调用层
│   │   │   │   ├── subtitle-api.ts     # 字幕API封装
│   │   │   │   └── types.ts            # API类型定义
│   │   │   ├── lib/         # 工具函数层
│   │   │   │   ├── subtitle-fetcher.ts      # 字幕获取器（集成缓存）
│   │   │   │   ├── subtitle-cache.ts        # 独立缓存管理器（LRU + TTL）
│   │   │   │   ├── data-transformer.ts      # JSON解析器（完整数据处理）
│   │   │   │   ├── error-handler.ts         # 错误处理器
│   │   │   │   └── CACHE_DOCUMENTATION.md   # 缓存系统详细文档
│   │   │   ├── hooks/       # React Hooks层
│   │   │   │   ├── useSubtitleDataSource.ts # 主要数据源Hook
│   │   │   │   └── useSubtitleLoader.ts     # 字幕加载Hook
│   │   │   └── model/       # 状态管理层
│   │   │       ├── types.ts      # 业务类型定义
│   │   │       └── store.ts      # 加载状态管理
│   │   ├── subtitle-display/ # 字幕显示功能模块 (v2.0架构 - 无状态设计 + 智能导航)
│   │   │   ├── README.md    # 字幕显示架构文档 (v2.0 - 无状态+智能导航+时间统一)
│   │   │   ├── CONTEXT.md   # 字幕显示架构实现 (无状态设计、智能导航、时间单位统一)
│   │   │   ├── index.ts     # 字幕显示统一导出
│   │   │   ├── lib/         # 核心业务逻辑
│   │   │   │   └── useSubtitleDisplay.ts   # 主要字幕显示Hook
│   │   │   ├── model/       # 类型和配置
│   │   │   │   └── types.ts     # 类型定义和默认配置
│   │   │   └── ui/          # UI组件层
│   │   │       ├── SubtitleDisplay.tsx            # 主要字幕显示组件
│   │   │       ├── SubtitleNavigationControls.tsx # 导航控制组件
│   │   │       └── IntegratedSubtitleView.tsx     # 集成视图组件
│   │   └── index.ts         # 功能层统一导出
│   │
│   ├── entities/            # ✅ 实体层 (业务模型) - 扩展实现
│   │   ├── user/            # 用户实体 (专注用户数据管理和状态存储)
│   │   │   ├── README.md    # 用户实体文档 (v2.1 - 模块化重构)
│   │   │   ├── index.ts     # 用户实体导出 (统一 hooks 导出)
│   │   │   ├── hooks/       # React Hooks 层 (按功能分组)
│   │   │   │   ├── index.ts        # 统一导出所有 hooks
│   │   │   │   ├── useAuth.ts      # 认证状态相关 hooks (6个)
│   │   │   │   ├── useSession.ts   # Session 管理相关 hooks (3个)
│   │   │   │   ├── useTokens.ts    # Token 相关 hooks (5个)
│   │   │   │   ├── useUserActions.ts # 用户操作和工具 hooks (3个)
│   │   │   │   └── useUserProfile.ts # 用户基础信息相关 hooks (8个)
│   │   │   └── model/       # 用户数据模型和状态管理
│   │   │       ├── store.ts     # UserStore状态管理 (事件同步)
│   │   │       └── types.ts     # 用户相关类型定义
│   │   ├── subtitle/         # 字幕实体 (v2.0架构 - 时间单位统一 + 指针优化 + 扁平化数据)
│   │   │   ├── README.md    # 字幕实体架构文档 (v2.0 - 扁平化+指针优化+时间统一)
│   │   │   ├── CONTEXT.md   # 字幕实体架构实现 (时间单位统一、扁平化数据、指针优化搜索)
│   │   │   ├── index.ts     # 字幕实体统一导出
│   │   │   ├── model/       # 数据模型层
│   │   │   │   ├── subtitle.ts      # 核心数据类型定义（秒单位）
│   │   │   │   ├── raw-types.ts     # 原始数据类型定义
│   │   │   │   └── store.ts         # Zustand状态存储
│   │   │   ├── lib/         # 工具函数层
│   │   │   │   └── search.ts        # 高性能搜索引擎（指针优化）
│   │   │   └── hooks/       # React Hooks层
│   │   │       └── useSubtitleEntity.ts # 主要实体Hook
│   │   └── video/           # 视频实体 (Player Pool集成架构 + 企业级状态机模式 + 播放器指针管理 + 三状态同步架构 + 模块化Hook系统)
│   │       ├── README.md    # 视频实体文档 (v3.0.0 - 6模块Hook架构 + SharedValue集成)
│   │       ├── CONTEXT.md   # 视频实体架构实现 (状态机模式、三状态同步、交互状态隔离、内存安全)
│   │       ├── index.ts     # 视频实体导出 (类型和hooks统一导出)
│   │       ├── hooks/       # 模块化React Hooks层 (按功能职责分组)
│   │       │   ├── player-control/              # 播放器控制模块
│   │       │   │   ├── index.ts                 # 播放器控制模块导出
│   │       │   │   ├── useVideoPlayer.ts        # 统一播放器入口Hook (推荐)
│   │       │   │   ├── useVideoPlaybackStatus.ts # 播放状态访问专用Hook
│   │       │   │   └── useVideoPlayerControls.ts # 播放控制专用Hook
│   │       │   ├── instance-management/         # 实例和页面管理模块
│   │       │   │   ├── index.ts                 # 实例管理模块导出
│   │       │   │   ├── usePlaybackPageManager.ts # 页面管理器Hook (推荐)
│   │       │   │   ├── usePlaybackPageState.ts  # 页面状态管理Hook
│   │       │   │   ├── usePlaybackNavigation.ts # 页面导航控制Hook
│   │       │   │   ├── usePlaybackBusinessLogic.ts # 业务逻辑协调Hook
│   │       │   │   └── usePlayerLifecycle.ts    # 播放器生命周期Hook
│   │       │   ├── videoview-sync/              # VideoView同步模块
│   │       │   │   ├── index.ts                 # 同步模块导出
│   │       │   │   ├── usePlayerEventSync.ts    # 播放器事件同步Hook
│   │       │   │   └── useTimeUpdateInterval.ts # 时间更新同步Hook
│   │       │   ├── useCurrentVideoData.ts       # 当前视频数据管理Hook
│   │       │   └── useVideoOverlayManager.ts    # 覆盖层和会话状态管理Hook
│   │       └── model/       # 视频数据模型和状态管理
│   │           ├── store.ts     # VideoStore状态管理 (企业级Zustand + 三状态同步：Zustand ↔ SharedValues ↔ VideoPlayer)
│   │           ├── types.ts     # 视频相关类型定义 (状态机架构 + 交互状态隔离 + 预览/提交模式)
│   │           ├── selectors.ts # 细粒度状态选择器 (性能优化 + 选择性订阅)
│   │           └── playbackPageTypes.ts # 播放页面状态类型定义
│   │
│   └── shared/              # ✅ 共享层 (与业务无关的基础代码) - 完全实现
│       ├── lib/             # ✅ 通用库/工具函数
│       │   ├── index.ts     # 工具函数导出
│       │   ├── logger.ts    # 日志记录工具
│       │   ├── metrics.ts   # 响应式尺寸工具
│       │   ├── private-data-masking.ts # 数据脱敏工具 (重命名自security.ts)
│       │   └── toast/       # Toast通知系统 (依赖注入架构)
│       │       ├── README.md        # 完整文档说明
│       │       ├── index.ts         # 依赖注入服务入口
│       │       ├── types.ts         # 品牌类型和运行时验证
│       │       ├── constants.ts     # 常量定义和默认配置
│       │       ├── lib/
│       │       │   └── toastManager.tsx # ToastManager核心管理器
│       │       └── ui/
│       │           └── ToastView.tsx    # Paper集成Toast组件(React.memo优化)
│       ├── config/          # ✅ 应用配置
│       │   ├── index.ts     # 配置层导出
│       │   ├── environment.ts # 统一环境变量管理
│       │   └── theme/       # 主题和视觉效果配置系统
│       │       ├── CONTEXT.md          # 视觉效果架构文档
│       │       ├── README.md           # 主题系统说明文档
│       │       ├── colors.ts           # 统一颜色系统配置
│       │       ├── glass/              # 玻璃态效果模块
│       │       │   ├── index.ts        # 玻璃态导出
│       │       │   ├── glassmorphism.ts # 玻璃态效果核心配置
│       │       │   └── factory.ts      # 玻璃态样式工厂
│       │       ├── blur/               # 模糊态效果模块 (NEW)
│       │       │   ├── index.ts        # 模糊态导出
│       │       │   ├── blurism.ts      # 模糊态效果核心配置
│       │       │   └── factory.ts      # 模糊态样式工厂
│       │       ├── index.ts            # 主题系统统一导出
│       │       ├── paper-theme.ts      # React Native Paper 主题
│       │       ├── tokens.ts           # 设计令牌定义
│       │       └── types.ts            # TypeScript 类型定义
│       ├── hooks/           # ✅ 共享 React Hooks (v2.0 新增hooks)
│       │   ├── index.ts     # 导出文件
│       │   ├── CONTEXT.md   # Hooks系统架构文档 (v2.0)
│       │   ├── useAfterInteractions.ts  # 交互完成后执行 (NEW v2.0)
│       │   ├── useFocusState.ts         # 页面焦点状态 (NEW v2.0)
│       │   ├── useForceStatusBarStyle.ts # 强制状态栏样式 (优化 v2.0)
│       │   ├── usePlayerReadyState.ts    # 播放器就绪状态 (优化 v2.0)
│       │   ├── useMountedState.ts        # 组件挂载状态
│       │   ├── useAsyncSafeState.ts      # 异步安全状态
│       │   ├── useDebounce.ts            # 防抖Hook
│       │   ├── useOrientationDetection.ts # 屏幕方向检测
│       │   ├── useEventSubscription.ts   # 事件订阅管理
│       │   ├── useBackHandler.ts         # 硬件返回键控制
│       │   ├── useTimer.ts               # 定时器管理
│       │   └── usePlayerPlaying.ts       # 播放状态订阅
│       ├── model/           # ✅ 全局状态管理 (当前简化架构)
│       │   ├── CONTEXT.md   # 状态管理系统文档
│       │   └── index.ts     # 状态模型统一导出 (预留扩展)
│       ├── providers/       # ✅ 全局上下文提供者 (五层架构完整实现)
│       │   ├── CONTEXT.md   # 提供器系统文档
│       │   ├── ThemeProvider.tsx   # 主题提供器 (浅色/深色/自动三模式)
│       │   ├── GlassProvider.tsx   # 玻璃态效果提供器 (渐变+透明+模糊)
│       │   ├── BlurProvider.tsx    # 模糊态效果提供器 (NEW - 语义化颜色+动画)
│       │   ├── ToastProvider.tsx   # Toast通知提供器 (Paper组件集成)
│       │   ├── AuthProvider.tsx    # 认证提供器 (事件驱动架构)
│       │   └── index.ts     # 提供器导出 (五层Provider架构)
│       ├── types/           # ✅ 全局TypeScript类型定义
│       │   └── index.ts     # 类型导出
│       └── ui/              # ✅ UI组件库 (Paper架构: 22个现代化组件)
│           ├── README.md    # UI架构文档
│           ├── CONTEXT.md   # UI组件系统文档
│           ├── Button.tsx   # 按钮组件
│           ├── Input.tsx    # 输入框组件
│           ├── Card.tsx     # 卡片组件
│           ├── Typography.tsx # 文本组件 (6个变体)
│           ├── Container.tsx  # 容器组件 (3个布局类型)
│           ├── Spacer.tsx   # 间距组件
│           ├── PageContainer.tsx # 页面容器组件
│           ├── Avatar.tsx   # 头像组件
│           ├── ListItem.tsx # 列表项组件
│           ├── Switch.tsx   # 开关组件
│           ├── SectionTitle.tsx # 区块标题组件
│           ├── ListSection.tsx # 列表区块组件
│           ├── PageHeader.tsx # 页面头部组件
│           ├── CenteredContent.tsx # 居中内容组件
│           ├── StatCard.tsx # 统计卡片组件
│           ├── VIPBadge.tsx # VIP徽章组件
│           ├── Alert.tsx    # 弹窗组件
│           ├── LoadingScreen.tsx # 加载屏幕组件
│           ├── EmailInput.tsx    # 邮箱输入组件
│           ├── InputIcon.tsx     # 输入框图标组件
│           ├── OTPInputWithButton.tsx # OTP验证码输入组件
│           ├── Separator.tsx     # 分隔线组件
│           ├── animated/    # 动画组件目录
│           ├── animations/  # 动画配置目录
│           ├── glass/       # 玻璃态UI组件库
│           │   ├── GlassButton.tsx     # 玻璃态按钮组件
│           │   ├── GlassCard.tsx       # 玻璃态卡片组件
│           │   ├── GlassInput.tsx      # 玻璃态输入框组件
│           │   ├── SocialButton.tsx    # 社交登录按钮组件
│           │   └── index.ts            # 玻璃组件库导出
│           ├── blur/        # 模糊态UI组件库 (NEW v2.0)
│           │   ├── BlurButton.tsx      # 模糊态按钮组件 (10种颜色变体)
│           │   ├── BlurCard.tsx        # 模糊态卡片组件 (语义化设计)
│           │   ├── BlurList.tsx        # 模糊态列表组件 (高对比度)
│           │   ├── VideoCard.tsx       # 视频卡片组件 (TikTok风格)
│           │   └── index.ts            # 模糊组件库导出
│           ├── layouts/     # 布局组件系统 (NEW)
│           │   ├── Row.tsx             # 行布局组件
│           │   ├── Column.tsx          # 列布局组件
│           │   ├── Stack.tsx           # 堆叠布局组件
│           │   └── index.ts            # 布局组件导出
│           └── index.ts     # 组件库导出
│
├── docs/                    # 项目文档
│   ├── README.md           # 文档系统说明
│   ├── ai-context/         # AI上下文文档
│   │   ├── docs-overview.md         # 文档架构概述
│   │   ├── project-structure.md     # 项目结构和技术栈
│   │   ├── session-sync-analysis.md # Session同步分析 - Supabase事件到UserStore完整映射
│   │   ├── system-integration.md    # 系统集成模式
│   │   ├── deployment-infrastructure.md # 部署基础设施
│   │   └── handoff.md               # 任务管理和会话连续性
│   ├── human-context/      # 人类开发者文档
│   │   ├── FeatureSlicedDesign.md   # FSD架构方法论
│   │   ├── library.md               # 依赖管理策略
│   │   ├── supabase.md              # Supabase集成指南
│   │   └── ui.md                    # UI设计系统使用指南
│   ├── auth-api-guide.md            # 认证API使用指南
│   ├── auth-architecture.md         # 认证架构设计文档
│   ├── auth-error-handling-guide.md # 认证错误处理指南
│   ├── auth-implementation-test.md  # 认证实现测试文档
│   ├── password-merge-validation.md # 密码合并验证文档
│   ├── styled-components-migration-report.md # Styled Components迁移报告
│   ├── ui-components-reference.md   # UI组件API参考
│   ├── verify-code-merge-validation.md # 验证码合并验证文档
│   ├── CONTEXT-tier2-component.md  # 组件级文档模板
│   └── CONTEXT-tier3-feature.md    # 功能级文档模板
│
├── assets/                  # 静态资源 (字体, 图片)
│   ├── fonts/              # 字体文件
│   └── images/             # 图片资源
├── examples/               # 示例项目
│   └── python-project/     # Python项目示例
├── specs-test/             # 需求规范测试
├── .claude/                # Claude Code 配置
│   ├── hooks/              # Hook脚本
│   └── commands/           # 自定义命令
├── CLAUDE.md               # 主要项目上下文文档
├── MCP-ASSISTANT-RULES.md  # MCP助手规则
├── app.json                # Expo应用配置
├── babel.config.js         # Babel转换配置
├── drizzle.config.ts       # Drizzle ORM配置
├── expo-env.d.ts           # Expo类型声明
├── metro.config.js         # Metro打包配置 (路径别名)
├── package.json            # 依赖和脚本配置
└── tsconfig.json           # TypeScript配置
```

## 5. 后端集成架构

### 5.1 Supabase 后端即服务 (BaaS)
本项目集成 Supabase 作为主要后端服务，提供完整的认证系统和云端数据服务：

- **认证服务**：支持邮箱+密码、一次性密码(OTP)、密码重置等多种认证方式
- **会话管理**：自动令牌刷新、持久化会话、跨设备同步
- **实时功能**：支持实时数据订阅和推送通知
- **类型安全**：与 TypeScript 深度集成，提供端到端的类型安全

### 5.2 高级认证架构集成
项目实现了企业级认证架构，采用三类协调模式、统一接口设计和内存安全保证：

**三类架构协调**：
- **AuthOperations**：业务逻辑协调器，实现依赖注入模式，通过构造函数接收Supabase客户端、Toast服务、Logger等依赖
- **AuthStateManager**：状态机管理器，负责认证状态的转换和同步，实现`initializing | unauthenticated | authenticated | verifying`四状态管理
- **CooldownManager**：冷却时间管理器，独立管理API调用频率限制，支持双层冷却(sendCode: 60s, verify: 3s)

**统一接口设计**：
- **参数化模式切换**：`sendCode(email, mode: 'login' | 'forgotPassword')`和`verifyCode(email, code, mode)`统一处理登录和密码重置流程
- **静默模式支持**：`signOut(silent?: boolean)`支持静默退出，区分用户主动退出和系统自动清理
- **装饰器模式保护**：所有API操作通过`withCooldownProtection`装饰器统一应用速率限制
- **智能错误分类**：通过`AuthHelpers.isUserError()`自动区分用户错误和系统错误，提供差异化日志记录

### 5.3 环境配置管理
```bash
# Supabase 后端服务配置
EXPO_PUBLIC_SUPABASE_URL=https://hdipohslwswuhywkehwe.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API 后端配置
# 开发环境
EXPO_PUBLIC_API_DEV_HOST=34.56.132.171
EXPO_PUBLIC_API_DEV_PORT=8000

# 预发布环境
EXPO_PUBLIC_API_STAGING_BASE_URL=https://api-staging.acquisit.ai
```

**环境变量分类**：
- **Supabase 配置**: 认证服务、数据库和实时功能的连接参数
- **API 后端配置**: 多环境 API 端点配置(开发、预发布)
- **EXPO_PUBLIC_**: 客户端可访问的环境变量前缀
- **提供器系统配置**: 主题存储键、Toast队列限制、玻璃态缓存大小等

**配置文件**：
- **`src/shared/config/environment.ts`** - 统一环境变量管理，包含 Supabase 配置验证
- **`src/features/auth/api/supabase.ts`** - Supabase 客户端实例和 AsyncStorage 集成
- **`.env`** - 本地环境变量文件(包含实际配置值)

### 5.4 认证架构重构详解 （⭐ 最新架构）

#### 核心设计原则
本项目采用**事件驱动的认证架构**，完全符合FSD(Feature-Sliced Design)原则，实现了认证操作与用户数据管理的完美分离：

**架构层次**：
```
Supabase SDK (认证API)
    ↓ (事件触发)
features/auth (认证操作层)
    ↓ (数据同步)
entities/user (用户数据层)
    ↓ (选择器消费)
UI Components (界面层)
```

#### 层级职责分工

| 层级 | 核心职责 | 主要文件 | 状态管理范围 |
|------|---------|---------|-------------|
| **features/auth** | 认证业务操作 | `AuthProvider.tsx`、`auth-operations.ts` | 认证流程状态(`status`、`isSendingCode`、冷却状态) |
| **entities/user** | 用户数据管理 | `store.ts`、`hooks/` 模块 | Session数据(`user`、`tokens`、`email`等) |
| **UI Components** | 界面展示 | 各页面组件 | 无状态，通过hooks消费数据 |

#### Session数据同步机制

**完整事件覆盖**：
- `INITIAL_SESSION`: 应用启动时的会话检查
- `SIGNED_IN`: 用户登录成功（邮箱密码、验证码登录）
- `SIGNED_OUT`: 用户退出登录
- `TOKEN_REFRESHED`: Token自动刷新
- `USER_UPDATED`: 用户信息更新（设置密码等）
- `PASSWORD_RECOVERY`: 密码恢复流程

**同步流程**：
```typescript
// 每个Supabase事件都会触发
handleAuthStateChange(event, session) → syncUserStore(session) → UserStore.setSession()
```

#### 性能优化策略

**细粒度 Hooks 系统**：
- 25个专用 hooks：按功能分组为5个模块（认证状态、Session管理、Token管理、用户资料、操作工具）
- 组件只订阅需要的数据片段，避免不必要的重渲染
- 批量状态更新，减少渲染周期

**内存安全保障**：
- 组件卸载检查：所有异步操作前验证`isMountedRef.current`
- 同步容错机制：UserStore同步失败不影响认证流程
- 双重清除保险：signOut操作确保无论API成功与否都清除本地状态

### 5.5 多提供器集成架构

**五提供器层次结构 v2.0**：
```typescript
// app/_layout.tsx 提供器层次 - 企业级架构完整实现
ThemeProvider              // L1: 主题状态管理 - 浅色/深色/自动三种模式 + 持久化存储
└─ GlassProvider          // L2: 玻璃态效果系统 - 接收isDark状态 + 预计算样式缓存
   └─ BlurProvider        // L3: 模糊态效果系统 - 语义化颜色 + 动画集成 (NEW v2.0)
      └─ ToastProvider    // L4: 全局通知系统 - Paper组件集成 + 依赖注入模式
         └─ AuthProvider  // L5: 认证事件管理 - Supabase集成 + UserStore同步
```

**事件驱动架构重构**（⭐ **重要更新**）：
- **认证层职责分离**：`features/auth` 层专注认证操作，`entities/user` 层专注数据管理
- **4状态Provider机**：`initializing | unauthenticated | authenticated | verifying`
- **事件驱动同步**：AuthProvider监听所有Supabase事件(`INITIAL_SESSION`、`SIGNED_IN`、`SIGNED_OUT`、`TOKEN_REFRESHED`、`USER_UPDATED`、`PASSWORD_RECOVERY`)，自动同步到UserStore
- **双重数据清除**：signOut操作采用双重保险机制，确保无论API成功与否都清除本地状态
- **细粒度 Hooks**：25个专用 hooks(`useUserEmail`、`useSession`、`useHasPassword`等)按功能分组优化重渲染性能

**内存安全架构**：
- **统一安全模式**：所有Provider和Page都实现`isMountedRef`模式
- **组件生命周期跟踪**：useEffect cleanup中立即标记`isMountedRef.current = false`
- **异步操作保护**：所有异步操作前检查`isMountedRef.current`
- **性能优化**：useMemo缓存Context值，只在核心状态变化时重建

**冷却保护系统**：
- **双层冷却**：sendCode操作60秒冷却，verify操作3秒冷却
- **定时器管理**：CooldownManager类负责独立的定时器生命周期
- **Toast反馈**：冷却状态自动触发用户友好的提示信息
- **操作装饰**：所有认证操作通过装饰器自动应用冷却保护

**性能优化模式**：
- Context值使用 `useMemo` 缓存，减少不必要的重新渲染
- 批量状态更新减少渲染周期
- 功能状态更新降低依赖复杂度
- 预计算模式：玻璃态样式和Toast配置预计算和缓存
- 组件生命周期跟踪：使用`useRef`防止内存泄漏和在已卸载组件上更新状态

**内存安全保证**：
- `useRef` 组件挂载状态跟踪防止内存泄漏
- 所有异步操作包含组件挂载检查
- 优雅的组件卸载处理

**错误处理和配置管理**：
- **结构化错误类型**：`'validation' | 'network' | 'verification' | 'routing' | 'unknown'`
- **智能错误分类**：AuthHelpers.isUserError()自动区分用户错误和系统错误
- **集中配置管理**：AuthConfig统一管理冷却时间(60s/3s)、Toast标题和消息文本
- **Toast集成**：冷却状态、操作结果、错误信息统一通过全局Toast系统反馈

**类基架构优势**：
- 统一错误消息工具函数(`getFriendlyErrorMessage`)
- 错误状态的状态机过渡管理
- 结构化日志记录(使用 `shared/lib/logger.ts`)

**类型系统**：
- 扩展 Supabase 原生类型(`AppUser`, `AppSession`)以支持应用特定需求
- 完整的认证状态枚举(`AuthStatus`)和状态管理接口
- Supabase SDK 原生类型系统确保端到端类型安全

**会话持久化**：
- React Native AsyncStorage 集成
- 跨应用启动的会话保持
- 自动令牌刷新和过期处理

## 6. 数据库架构

### SQLite + Drizzle ORM
本项目使用本地 SQLite 数据库配合 Drizzle ORM 进行数据管理：

- **数据库文件**：本地 SQLite 数据库，通过 `expo-sqlite` 驱动
- **Schema 定义**：各实体的数据库模式定义在 `src/entities/{entity}/model/schema.ts`
- **迁移文件**：自动生成的迁移脚本存放在 `drizzle/` 目录
- **配置文件**：`drizzle.config.ts` 包含 ORM 配置和数据库连接设置

### 数据持久化策略
- 离线优先：应用可在无网络环境下完全运行
- 增量同步：与后端服务（Supabase）进行数据同步时采用增量更新
- 类型安全：所有数据库操作都具备编译时类型检查

## 7. 项目当前状态 (2025-01)

### 7.1 实现完成度

**✅ 完全实现的架构层级**:
- **app层**: React Navigation 导航架构、RootNavigator条件渲染、四层导航器架构(Root/MainTab/VideoStack/AuthStack)、Screen包装器模式、五提供器层次集成
- **pages层**: Feed页面(v1.1)、视频详情页面、全屏视频页面、认证页面套件(Login/VerifyCode/PasswordManage)、单词本页面框架、个人页面框架
- **widgets层**:
  - tab-bar(双TabBar实现：BlurTabBar + LiquidGlassTabBar，iOS 18+液态玻璃效果支持)
  - small-video-player-section(小屏播放器组合，双模式滚动动画，4+ features集成)
  - fullscreen-video-player-section(全屏播放器组合，三层组合架构，增强字幕系统)
- **features层**:
  - **视频播放系统**: video-player(Props-Based Data Flow架构，SmallVideoPlayer/FullscreenVideoPlayer拆分，HLS支持，自动播放)、video-core-controls(策略模式UI参考实现)、video-gestures(跨功能手势协调)、video-window-management(v1.0依赖注入架构，Player Pool协调层)、video-controls-overlay Widget(多Feature组合，FSD合规)、playback-settings(6档速度+音量控制)
  - **视频详情系统**: detail-info-display(Context隔离架构)、detail-interaction-bar(零状态Context代理，4项交互)
  - **Feed系统**: feed-fetching(无状态API+mock数据生成)、feed-list(FlatList集成+可见性管理)、fullscreen-feed-list(规划中)
  - **字幕系统**: subtitle-fetching(v2.0完整处理管道)、subtitle-display(智能导航+点击跳转)
  - **认证系统**: auth(三类协调架构+事件驱动)
- **entities层**:
  - **视频实体v6.0.0**(单指针架构currentPlayerMeta: {playerInstance, videoId} + 企业级状态机 + Video Meta Entity集成)
  - **视频元数据实体v1.0**(SSOT架构 + Map-based O(1)存储 + subscribeWithSelector优化 + 响应式更新)
  - **Player Pool实体v3.0.0**(LRU缓存5实例 + PreloadScheduler + 双锁机制 + 并发预加载2 + videoId绑定)
  - **Feed实体v2.0**(ID-based架构 + videoIds存储 + Video Meta Entity集成 + 50条滑动窗口)
  - **字幕实体v2.0**(时间单位统一 + 指针优化搜索)
  - **用户实体**(事件驱动同步 + 25个细粒度hooks)
- **shared层**: UI组件库(22个Paper组件 + 玻璃态/模糊态组件库)、五提供器架构、双视觉效果系统、Toast系统、主题系统、共享Hooks系统v2.0(useAfterInteractions交互优化 + useFocusState焦点管理)

**⏳ 待开发功能**:
- **学习功能**: 单词学习、练习模式、进度跟踪
- **收藏功能**: 单词收藏、分类管理、复习系统
- **数据层**: 本地数据库集成、离线同步、词汇管理
- **视频内容管理**: 视频数据获取、分类管理、推荐算法集成

### 7.2 架构成熟度

**企业级特性**:
- **React Navigation架构**：完整的四层导航器架构 + 条件渲染导航栈 + Modal Presentation + Replace策略 + Screen包装器模式 + 类型安全路由
- **视频实体v6.0.0**：SSOT架构 + 单指针架构(currentPlayerMeta: {playerInstance, videoId}) + Video Meta Entity集成 + 企业级状态机 + 三状态同步 + 精简Hook系统
- **三层视频架构示例**：entities/video(v6.0.0) + entities/video-meta(SSOT) + entities/player-pool(v3.0.0) ↔ features/video-player(Props-Based Data Flow) ↔ widgets/small-video-player-section + widgets/fullscreen-video-player-section
- **Props-Based Data Flow**：父组件通过Props传递数据，子组件使用Context共享状态，避免Prop Drilling
- **双TabBar实现**：BlurTabBar(expo-blur通用) + LiquidGlassTabBar(expo-glass-effect iOS 18+) + 动态选择逻辑
- **字幕系统v2.0**：时间单位统一 + 指针优化搜索(90%场景O(1)) + 智能导航逻辑 + 三层协调架构
- **Feed系统v1.1**：三重防护机制 + maintainVisibleContentPosition集成 + 增强mock数据生成

### 7.3 Feed系统v1.1架构优化详解

**最新commit实现**（2025-09-28）：

#### **三重竞态条件防护机制**
1. **UI层防抖保护**：`FeedPage.tsx` - 1秒内重复`onEndReached`触发直接忽略，使用`useRef`时间戳跟踪
2. **服务层状态检查**：`feedService.ts` - 所有函数（`initializeFeed`、`loadMoreFeed`、`refreshFeed`）完整的`isLoading`状态保护
3. **数据处理完整性保护**：`store.ts` - `isLoading`状态只在数据处理（包括`maintainWindowSize`）完全完成后才设为`false`

#### **智能索引管理**
- **移除手动索引调整**：利用React Native `maintainVisibleContentPosition`自动处理滚动位置和索引映射
- **自然状态更新**：依赖`onViewableItemsChanged`在视图稳定后自动更新正确索引
- **避免计算冲突**：消除了手动计算可能造成的索引不准确问题

#### **增强Mock数据生成**
- **防碰撞ID生成**：`video_{timestamp}_{randomPart}_{extraRandom}` - 时间戳+双重随机字符串确保唯一性
- **多样化标题系统**：20种学习内容模板（商务英语、日常口语等）+ 随机课程编号（1-999）
- **真实数据模拟**：19,980种标题组合可能，大幅提升mock数据真实感

#### **FlatList敏感度优化**
- **触底阈值调整**：`onEndReachedThreshold`从1.0调整至0.5，减少误触发
- **滚动锚点集成**：`minIndexForVisible: 0`确保数据删除时视觉连续性

#### **完整的加载状态生命周期**
```
触发操作 → isLoading=true → API请求 → 数据添加 → 窗口维护 → isLoading=false
```
确保在整个数据处理流程期间防止新的竞态条件进入。
- **事件驱动认证架构**：完美分离认证操作与用户数据管理 + 25个细粒度hooks按功能分组 + 双冷却保护系统
- **完整文档体系**：20+ 模块README.md + CONTEXT.md，覆盖所有核心架构模块

**开发体验**:
- 100% FSD合规架构，清晰的职责边界
- 端到端TypeScript类型安全
- React Navigation类型安全路由
- 详细的文档覆盖和开发指南
- 模块化组件设计，易于扩展和维护

### 7.3 导航架构重构详解 (2025-10)

**Expo Router → React Navigation 迁移**:

#### 核心变化
1. **文件系统路由 → 配置式导航器**: 从 `app/` 目录下的文件系统路由迁移到 `src/app/navigation/` 的导航器配置
2. **路由命名规范化**: 从 kebab-case (`/auth/login`) 更新为 PascalCase (`Login`)
3. **导航API统一**: 所有页面使用 `useNavigation()` + `CommonActions` 进行导航
4. **四层导航器架构**:
   - **RootNavigator**: 条件渲染根导航器 (`isAuthenticated && hasPassword`)
   - **MainTabNavigator**: 主Tab导航(Collections/Feed/Profile)
   - **VideoStackNavigator**: 视频Stack导航(VideoDetail/VideoFullscreen)，Modal Presentation
   - **AuthStackNavigator**: 认证Stack导航(Login/VerifyCode/PasswordManage)

#### 架构优势
- **条件渲染保护**: 根据认证状态自动切换导航栈，安全性更高
- **Modal Presentation**: VideoStack使用Modal呈现，支持手势关闭和透明背景
- **Replace策略**: 视频详情→全屏使用replace()防止返回，节省内存
- **Screen包装器模式**: 统一的Screen包装器简化路由配置
- **类型安全**: 完整的ParamList类型定义确保导航参数类型安全

### 7.4 技术债务状况

**架构优势**:
- 零技术债务：所有代码遵循最佳实践
- 统一的编码标准和架构模式
- 完整的测试覆盖(导航模块标杆实现)
- 性能优化：预计算、缓存、内存安全

**准备扩展**:
- 标准化的模块结构，新功能可快速集成
- 可复用的组件库和工具函数
- 事件驱动架构支持复杂业务逻辑
- 类型安全的数据流和状态管理

## 8. 更多结构信息
如果你认为需要更多项目详情信息，比如项目结构，推荐使用的库，可以查看 docs/human-context 目录下的md文件