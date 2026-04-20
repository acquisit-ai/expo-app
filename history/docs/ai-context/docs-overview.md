# 文档架构

此项目使用**三层文档系统**，按稳定性和范围组织知识，实现高效的 AI 上下文加载和可扩展开发。

## 三层系统工作原理

**第1层（基础）**：稳定的、系统范围的文档，很少变更 - 架构原则、技术决策、跨组件模式和核心开发协议。

**第2层（组件）**：主要组件的架构章程 - 高层设计原则、集成模式和组件范围约定，不包含功能特定细节。

**第3层（功能特定）**：与代码共同定位的详细文档 - 具体实现模式、技术细节和随功能演进的局部架构决策。

此层次结构允许 AI 智能体高效加载目标上下文，同时维护稳定的核心知识基础。

## 文档原则
- **共同定位**：文档与相关代码放在一起
- **智能扩展**：在必要时自动创建新文档文件
- **AI 优先**：为高效 AI 上下文加载和机器可读模式优化

## 第1层：基础文档（系统范围）

- **[主上下文](/CLAUDE.md)** - *每个会话必需。* 编码标准、安全要求、MCP 服务器集成模式和开发协议
- **[项目结构](/docs/ai-context/project-structure.md)** - *必读。* 完整技术栈、文件树和系统架构。必须附加到 Gemini 咨询
- **[项目整体需求与应用概览](/docs/ai-context/项目整体需求与应用概览.md)** - *项目定位优先入口。* 用通用框架拆解产品需求、App 形态和技术栈，适合作为重构项目总览模板或首次接手时先读
- **[Session同步分析](/docs/ai-context/session-sync-analysis.md)** - *认证架构参考。* 完整的Supabase事件到UserStore同步映射，认证状态变化流程和数据一致性保障机制
- **[系统集成](/docs/ai-context/system-integration.md)** - *跨组件工作用。* 通信模式、数据流、测试策略和性能优化
- **[部署基础设施](/docs/ai-context/deployment-infrastructure.md)** - *基础设施模式。* 容器化、监控、CI/CD 工作流和扩展策略
- **[视频播放器架构实现](/docs/ai-context/video-player-implementation.md)** - *系统级架构参考。* Entity-Centric设计模式、单向数据流同步机制、Context Provider层次架构、高性能动画系统和跨层级状态管理
- **[任务管理](/docs/ai-context/handoff.md)** - *会话连续性。* 当前任务、文档系统进度和下次会话目标

## 第2层：组件级文档

*此层级包含主要架构模式和跨组件设计原则，不包含具体实现细节。*

**层级总览文档**:
- **[实体层总览](/src/entities/README.md)** - *实体层架构v1.0。* 7个领域实体完整文档、Player Pool v5.0 VideoId架构、Video实体v5.0条件订阅、Subtitle实体v2.0性能突破、Feed实体滑动窗口、Zustand store模式、实体集成指南、Hook API模式、性能优化策略
- **[功能层总览](/src/features/CONTEXT.md)** - *功能层架构。* 13个功能模块、视频系统三层架构、字幕系统完整实现、认证功能FSD标准、Feed数据流、主题管理、策略模式UI、手势协调、窗口管理依赖注入
- **[页面层总览](/src/pages/CONTEXT.md)** - *页面和导航架构。* 6个页面模块、认证页面套件、Feed页面VideoId-Based滚动、全屏视频页面窗口管理、Expo Router集成、认证路由控制、响应式间距系统

**架构模式文档**:
- **[导航交互模式](/docs/CONTEXT-navigation-interaction-patterns.md)** - *导航感知交互控制架构。* Focus-based交互控制模式、组件禁用状态架构、React Navigation集成模式、替代时间延迟的确定性解决方案

## 第3层：功能特定文档

与代码共同定位的详细 CONTEXT.md 文件，最小级联效应：

### React Native应用功能文档

**已实现功能文档**:
- **[UI组件系统](/src/shared/ui/CONTEXT.md)** - *设计系统实现。* 组件库架构、主题系统、React Native Paper架构、交互控制模式、VideoCard增强API和开发模式。另见 [UI架构说明](/src/shared/ui/README.md)
- **[视觉效果系统](/src/shared/config/theme/CONTEXT.md)** - *Glassmorphism & Blur架构实现。* 双工厂模式、预计算样式、独立Provider系统和性能优化策略
- **[模糊态效果实现](/src/shared/config/theme/blur/CONTEXT.md)** - *Blur工厂架构细节。* 语义化颜色系统、动画集成、组件模式和性能特征
- **[页面架构](/src/pages/CONTEXT.md)** - *页面和导航模式。* 增强认证页面套件(3个)、8状态状态机协调、全局状态集成、智能路由决策
- **[Feed页面实现](/src/pages/feed/CONTEXT.md)** - *Feed页面v2.3架构实现。* VideoId-Based滚动同步、Feed裁剪免疫、全屏返回智能滚动、Player Pool v5.0集成、Focus-controlled导航模式、VideoCard集成、防竞态条件机制、异步字幕加载架构
- **[提供器系统](/src/shared/providers/CONTEXT.md)** - *五提供器架构实现。* Theme→Glass→Blur→Toast→Auth层次结构、跨提供器通信模式、内存安全协调

**已实现功能文档** (继续):
- **[共享库服务](/src/shared/lib/CONTEXT.md)** - *共享服务模块。* 单例模式Toast系统、主题感知通知、日志记录、响应式工具、Supabase客户端、企业级Modal管理系统。另见 [Toast系统文档](/src/shared/lib/toast/README.md) 和 [Modal系统文档](/src/shared/lib/modal/CONTEXT.md)
- **[共享Hooks系统](/src/shared/hooks/CONTEXT.md)** - *通用Hook系统v2.0。* useAfterInteractions(交互完成后执行)、useFocusState(页面焦点状态)、Ref存储模式避免闭包陷阱、条件化Hook模式、InteractionManager优化、内存安全保证、性能优化策略
- **[状态管理](/src/shared/model/CONTEXT.md)** - *全局状态管理。* Zustand架构设计、状态分层、持久化策略和开发模式
- **[功能模块](/src/features/CONTEXT.md)** - *用户交互功能。* ThemeCard功能实现、FSD功能层架构、多模式组件设计和主题集成模式
- **[组件层](/src/widgets/CONTEXT.md)** - *复合UI组件。* 6个组件模块实现、高级动画组合、多功能组合模式、平台适配和主题集成策略
- **[导航模块](/src/widgets/navigation/CONTEXT.md)** - *完整导航系统。* BlurTabBar + TabBarItem 模块化实现，性能优化、测试覆盖和配置化设计
- **[视频播放器功能](/src/features/video-player/CONTEXT.md)** - *视频播放器功能模块。* Entity-Centric轻量级架构、SmallVideoPlayer/FullscreenVideoPlayer组件、条件自动播放逻辑、video-meta entity集成、专注视频内容渲染
- **[视频核心控件功能](/src/features/video-core-controls/CONTEXT.md)** - *视频核心控件功能模块。* 策略模式UI架构参考实现、三专用布局策略(SmallScreen/FullscreenPortrait/FullscreenLandscape)、VideoCoreControlsProvider、pendingSeekTime同步机制
- **[视频手势功能](/src/features/video-gestures/CONTEXT.md)** - *视频手势功能模块。* 跨功能手势协调、多层事件处理、SharedValue手势处理、非破坏性交互模型、跨Widget通信模式
- **[视频窗口管理功能](/src/features/video-window-management/CONTEXT.md)** - *视频窗口管理v1.0依赖注入架构。* Feature层协调模块、解决Player Pool对其他Entities依赖、FSD合规依赖注入模式、多Entity数据协调、回调工厂模式、窗口扩展API封装
- **[视频控件覆盖层Widget](/src/widgets/video-controls-overlay/CONTEXT.md)** - *视频控件覆盖层Widget v2.2多Feature组合。* Widget层FSD合规架构、组合video-core-controls+video-gestures+subtitle-display、跨Feature状态协调、条件订阅集成、布局策略选择、手势流程编排
- **[播放设置功能](/src/features/playback-settings/CONTEXT.md)** - *播放设置模态框功能模块。* 模态框配置界面、SegmentedControl集成、触觉反馈集成、实体层直接访问、防御性编程模式
- **[视频播放器区域组件](/src/widgets/video-player-section/CONTEXT.md)** - *视频播放器区域组合组件。* 完美三层FSD架构示例、企业级widget组合模式、多功能协调、SharedValue动画稳定性模式、跨Widget通信excellence
- **[小屏视频播放器区域组件](/src/widgets/small-video-player-section/CONTEXT.md)** - *高级小屏视频播放器组件v2.0活跃视频检测。* 多功能组合、Widget层isActiveVideo判断、条件渲染字幕、SharedValue动画协调、滚动驱动动画、widget层组合模式参考实现
- **[全屏视频播放器区域组件](/src/widgets/fullscreen-video-player-section/CONTEXT.md)** - *全屏视频播放器组合组件v2.0条件订阅支持。* 三层组合架构、Widget层活跃视频检测、条件Feature集成、绝对定位布局、全屏优化配置、统一接口设计
- **[认证功能模块](/src/features/auth/CONTEXT.md)** - *完整认证架构。* 布尔返回模式API、错误处理策略、Toast集成、静默模式支持、内存安全模式
- **[认证Hooks模块](/src/features/auth/hooks/CONTEXT.md)** - *认证Context提供器架构。* 特性级Context模式、单一集成点模式、子组件解耦设计、useAuth钩子架构
- **[认证功能详细实现](/src/features/auth/model/CONTEXT.md)** - *认证系统实现细节。* AuthStateManager、CooldownManager、AuthOperations三类架构、双冷却系统、装饰器模式API保护
- **[视频实体架构](/src/entities/video/CONTEXT.md)** - *视频实体v5.0.0条件订阅架构。* 条件订阅机制(useConditionalVideoPlayer)、useSyncExternalStore架构、细粒度订阅优化、Player Pool集成架构、播放器指针管理(currentPlayer)、模块化Hook架构、状态机模式、存储简化(移除VideoSessionState)、企业级架构参考实现
- **[视频实体模块](/src/entities/video/README.md)** - *视频播放状态管理。* 三层状态架构(CurrentVideo、VideoPlaybackState、VideoSessionState)、React Native Reanimated集成、SharedValue动画支持、会话级状态管理
- **[字幕实体架构](/src/entities/subtitle/CONTEXT.md)** - *字幕实体v2.0架构实现。* 时间单位统一架构、扁平化数据模型、指针优化搜索引擎、O(1)性能突破、企业级FSD设计模式
- **[字幕数据源功能](/src/features/subtitle-fetching/CONTEXT.md)** - *字幕数据处理v2.0架构。* 完整数据处理管道、时间单位统一、三层缓存系统、LRU+TTL架构、零转换开销优化
- **[字幕显示功能](/src/features/subtitle-display/CONTEXT.md)** - *字幕显示v3.2条件订阅架构。* useSubtitleNavigation Hook提取、isActiveVideo条件订阅支持、无状态设计架构、智能导航逻辑、时间单位统一、Token级交互系统、纯计算状态管理、Modal集成单词解释功能、跨Feature手势集成
- **[播放器池实体](/src/entities/player-pool/CONTEXT.md)** - *Player Pool实体v5.0.0 VideoId-Based架构。* 完全基于videoId的状态管理、Feed裁剪完全免疫、双池双模式架构(13主池+4available)、窗口扩展功能(extendWindowNext/Prev)、动态索引计算(indexOf)、LRU缓存管理、O(1)任务取消、PreloadScheduler三层调度
- **[全屏视频页面](/src/pages/video-fullscreen/CONTEXT.md)** - *Video Fullscreen Page v3.0架构。* VideoId-Based窗口管理、Feed裁剪免疫、窗口扩展集成、useFullscreenScrollWindow重构、动态索引计算、横竖屏切换、硬件返回键控制、React Navigation集成

### 架构实现文档
- **[全屏窗口扩展实现](/src/pages/video-fullscreen/docs/fullscreen-window-extension.md)** - *Fullscreen窗口扩展功能实现。* 纯扩展零破坏架构、video-scroll滑动窗口策略、播放器实例交换逻辑、useLayoutEffect同步避免闪烁、与模板逻辑一致性验证

### 人类开发者上下文文档
- **[Feature-Sliced Design](/docs/human-context/FeatureSlicedDesign.md)** - *架构方法论。* FSD原则、层级组织和模块化开发指南
- **[三层架构设计](/docs/human-context/three-layer-architecture.md)** - *架构实现。* Entity、Feature、Widget三层协作模式，以视频系统为企业级实现范例
- **[创建指南](/docs/human-context/create.md)** - *开发流程。* 项目创建和功能开发工作流程
- **[库管理](/docs/human-context/library.md)** - *依赖管理。* 第三方库集成和管理策略
- **[UI参考](/docs/human-context/ui.md)** - *界面设计。* UI组件和设计系统使用指南

### 开发工具和模板
- **[UI组件参考](/docs/ui-components-reference.md)** - *组件文档。* 组件API和使用示例
- **[组件级模板](/docs/CONTEXT-tier2-component.md)** - *文档模板。* 组件级文档创建模板
- **[功能级模板](/docs/CONTEXT-tier3-feature.md)** - *文档模板。* 功能特定文档创建模板

## 使用指南

### 对于 AI 智能体

**简单任务**：仅加载第1层文档
```
- CLAUDE.md（编码标准）
- project-structure.md（项目概述）
```

**功能开发**：加载第1层 + 相关第3层
```
- 基础文档 + 特定功能 CONTEXT.md
```

**UI/主题工作**：加载全部相关文档
```
- 基础 + UI组件系统 + 主题系统 + 页面架构
```

**架构学习/重构**：加载架构相关文档
```
- 基础 + 三层架构设计 + FSD方法论 + 视频实体参考实现
```

### 对于开发者

**添加新功能**：
1. 检查现有第3层文档是否适用
2. 必要时创建新的 CONTEXT.md
3. 更新 docs-overview.md 添加导航
4. 第1层文档保持不变

**新功能模块**：
1. 在对应目录创建功能级 CONTEXT.md（第3层）
2. 更新 docs-overview.md 添加导航
3. 考虑是否需要更新项目结构文档

## 文档模板

使用标准化模板确保一致性：

- **[组件级模板](/docs/CONTEXT-tier2-component.md)** - 组件架构文档模板
- **[功能级模板](/docs/CONTEXT-tier3-feature.md)** - 功能实现文档模板

## 文档维护

### 自动化
- 文档与代码变更同步检查
- 过期文档检测和警告
- 模板一致性验证

### 手动审核
- 季度文档架构审核
- 新团队成员文档可用性测试
- AI 上下文加载效率分析

## 项目特定说明

此文档反映了**my-word-app**（React Native单词学习应用）的当前文档状态：

- **架构成熟度**: Feature-Sliced Design (FSD) - **企业级标准，架构稳定，零技术债务**
- **技术栈**: React Native + TypeScript + Expo + Drizzle ORM (配置完成)
- **主要功能**: 
  - ✅ 三tab导航架构（学习/收藏/个人中心）
  - ✅ 完整设计系统和主题系统
  - ✅ UI组件库（22个核心组件 + 4个玻璃组件 + 4个模糊态组件）
  - ✅ widgets层完全实现（导航模块化架构、个人页面头部、统计区块、VIP徽章）
  - ✅ features层扩展实现（主题管理 + 完整认证UI功能）
  - ✅ entities层完全实现（视频实体v3.0.0企业级参考 + 字幕实体v2.0性能突破 + 用户实体事件驱动架构）
- **当前开发状态**:
  - ✅ 项目架构和基础设施完成
  - ✅ UI组件库和主题系统完全实现 (双视觉效果系统：Glassmorphism + Blur Effects并行运行)
  - ✅ 页面框架和路由配置完成
  - ✅ widgets层完全实现 (导航模块化架构 + 视频播放器区域 + 视频内容区域等复合UI组件)
  - ✅ features层扩展实现 (主题管理 + 企业级认证UI功能 + 视频播放器 + **video-core-controls策略模式参考实现** + **video-gestures跨功能协调** + 视频详情功能 + **字幕系统v3.0三层架构** + **播放设置模态框功能**)
  - ✅ shared层完全实现 (五提供器架构 + 工厂模式 + Toast系统)
  - ✅ 认证集成完成 (统一接口设计 + API冷却保护 + 静默模式支持)
  - ✅ entities层实现扩展 (用户实体 + **视频实体v3.0.0企业级参考实现**: Player Pool集成、播放器指针架构、模块化Hook系统、状态机模式、三状态同步架构 + **Player Pool实体v5.0**: VideoId-Based架构、Feed裁剪完全免疫、LRU缓存(17实例:13主池+4available)、窗口扩展功能、动态索引计算、PreloadScheduler、O(1)任务取消 + **字幕实体v2.0**: 时间单位统一、指针优化搜索、扁平化数据架构)
  - ✅ **视频系统v3.0.0三层FSD架构完成**: 完美演示entities/video/(Player Pool集成) + entities/player-pool/(LRU缓存+PreloadScheduler) ↔ features/video-player/+video-core-controls/+video-gestures/(策略模式+手势协调) ↔ widgets/video-player-section/(企业级组合模式)协调，作为项目架构标杆
  - ✅ **字幕系统v3.0三层FSD架构完成**: 展示完整数据流协调entities/subtitle/ ↔ features/subtitle-fetching/ ↔ features/subtitle-display/，实现时间单位统一+指针优化+Token级交互+跨Feature手势集成
  - ✅ **播放设置模态框功能完成**: 企业级模态框架构，SegmentedControl集成，触觉反馈，实体层直接访问，跨Feature长按手势触发
  - ⏳ 数据层本地存储和核心业务逻辑待开发
- **文档覆盖**: 核心架构、设计系统、导航模块化标准和开发工具已完整文档化
- **质量标准**:
  - **导航模块**: 性能优化、配置化设计和简洁架构的项目标杆
  - **视频系统**: Feature-Sliced Design三层架构的企业级参考实现，展示状态机模式、策略模式UI、SharedValue动画协调
  - **字幕系统**: Feature-Sliced Design三层协调架构的性能突破实现，展示时间单位统一、指针优化搜索引擎、Token级交互系统、跨Feature手势集成
  - **播放设置系统**: 模态框架构的最佳实践实现，展示跨Feature集成、触觉反馈、防御性编程、实体层直接访问模式

---

*此文档架构是 Claude Code 开发套件的核心。它确保 AI 智能体始终具备适当上下文，同时保持文档的可维护性和相关性。*
