# 功能层 (Features) 文档

## 功能层架构

### 当前状态: 成熟实现阶段
功能层实现了Feature-Sliced Design的核心用户交互模式，当前包含13个功能模块，建立了完整的架构模式、策略模式和复合组件能力。视频相关功能展现了企业级架构设计的参考实现。

## 实现的功能模块 (13个)

### ✅ 视频播放器功能 (`video-player/`) - **[完整文档](/src/features/video-player/CONTEXT.md)**

**位置**: `src/features/video-player/`

**功能描述**: 实现企业级视频播放器架构，提供复合组件模式和策略模式UI基础，支持多显示模式的自适应视频播放体验。

**组件实现**:
- `VideoPlayerContent.tsx` - 统一视频渲染组件，包含加载、错误和覆盖层管理
- `SmallVideoPlayer.tsx` - 嵌入式播放器组件，优化小屏显示
- `FullscreenVideoPlayer.tsx` - 全屏播放器组件
- `VideoPlayerContext.tsx` - 上下文提供者，支持策略模式实现

**架构特性**:
- **复合组件架构**: VideoPlayerContext提供策略模式UI基础
- **多显示模式支持**: Small/Fullscreen自适应显示策略
- **动画系统集成**: React Native Reanimated高性能动画协调
- **全局播放器集成**: 与GlobalVideoPlayerManager单例架构深度整合
- **中文本地化**: 全面的中文注释支持团队协作

### ✅ 视频核心控件功能 (`video-core-controls/`) - **[完整文档](/src/features/video-core-controls/CONTEXT.md)**

**位置**: `src/features/video-core-controls/`

**功能描述**: 实现策略模式UI架构，提供多种显示模式下的自适应视频控制策略，支持TikTok风格的现代化视频控制体验。

**策略实现**:
- `SmallScreenControls.tsx` - 小屏嵌入式控制策略
- `FullscreenPortraitControls.tsx` - 全屏竖屏控制策略
- `FullscreenLandscapeControls.tsx` - 全屏横屏控制策略
- `VideoCoreControlsProvider.tsx` - 策略协调上下文
- `useVideoCoreControlsComposition.ts` - 核心控制逻辑组合

**架构特性**:
- **策略模式参考实现**: 根据显示模式动态选择控制策略
- **pendingSeekTime同步机制**: 预览/提交模式，防止误操作
- **触觉反馈集成**: 操作响应优化
- **条件订阅支持**: 通过isActiveVideo优化多视频场景性能

### ✅ 视频手势功能 (`video-gestures/`) - **[完整文档](/src/features/video-gestures/CONTEXT.md)**

**位置**: `src/features/video-gestures/`

**功能描述**: 跨功能手势协调模块，提供视频播放器的手势交互支持，实现双击暂停、长按弹出设置等高级手势。

**核心架构**:
- `VideoGesturesProvider.tsx` - 手势状态管理上下文
- `useVideoGesturesComposition.ts` - 手势逻辑组合
- 跨Widget通信模式，协调多层事件处理

**核心特性**:
- **SharedValue手势处理**: 基于Reanimated的高性能手势
- **非破坏性交互**: 手势不干扰播放状态
- **多层事件处理**: 优先级管理避免冲突
- **触觉反馈集成**: 手势操作响应优化

### ✅ 字幕显示功能 (`subtitle-display/`) - **[完整文档](/src/features/subtitle-display/CONTEXT.md)**

**版本**: v3.2

**位置**: `src/features/subtitle-display/`

**功能描述**: 提供智能字幕显示和导航功能，支持多语言字幕、翻译集成和点击导航，实现沉浸式学习体验。

**组件实现**:
- `SubtitleDisplay.tsx` - 主要字幕显示组件
- `IntegratedSubtitleView.tsx` - 集成字幕视图，支持导航控制
- `useSubtitleDisplay.ts` - 字幕逻辑Hook
- `useSubtitleNavigation.ts` - 字幕导航Hook（v3.2提取）

**核心特性**:
- **条件订阅架构**: isActiveVideo条件订阅优化性能
- **Token级交互**: 点击单词跳转视频位置，Modal集成单词解释
- **时间单位统一**: 所有时间操作使用秒，与播放器原生一致
- **无状态设计**: 纯计算状态管理，无本地状态
- **智能导航逻辑**: 自动跳过空句子

### ✅ 字幕数据获取功能 (`subtitle-fetching/`) - **[完整文档](/src/features/subtitle-fetching/CONTEXT.md)**

**版本**: v2.0

**位置**: `src/features/subtitle-fetching/`

**功能描述**: 字幕数据处理管道，负责从API获取、转换、缓存字幕数据，实现零转换开销优化。

**架构实现**:
- `api/subtitleApi.ts` - API客户端
- `lib/subtitleTransformer.ts` - 数据转换器（时间单位统一）
- `lib/subtitleCache.ts` - LRU+TTL三层缓存系统

**核心特性**:
- **时间单位统一**: API毫秒→秒转换，一次性完成
- **三层缓存系统**: 内存LRU + TTL过期 + 持久化存储
- **零转换开销**: 缓存命中直接使用，无需重复转换
- **完整数据处理管道**: 获取→转换→缓存→存储到Entity

### ✅ 播放设置功能 (`playback-settings/`) - **[完整文档](/src/features/playback-settings/CONTEXT.md)**

**位置**: `src/features/playback-settings/`

**功能描述**: 播放器设置模态框功能，提供播放速度、静音、字幕等设置界面，支持触觉反馈和实时预览。

**组件实现**:
- `PlaybackSettingsModal.tsx` - 主设置模态框组件
- SegmentedControl集成，提供分段选择器UI

**核心特性**:
- **企业级模态框架构**: 使用shared/lib/modal系统
- **触觉反馈集成**: 用户操作响应优化
- **实体层直接访问**: 读写global-settings entity
- **跨Feature集成**: 通过video-gestures长按手势触发
- **防御性编程**: 完整的错误处理和边界检查

### ✅ 主题管理功能 (`theme/`)

**位置**: `src/features/theme/`

**功能描述**: 提供用户主题切换交互，支持多种使用模式的主题控制界面。

**组件实现**: 
- `ThemeCard.tsx` - 主题控制卡片组件，支持切换、自动设置、信息展示三种模式

**核心特性**:
- 多模式支持: `'toggle'` | `'auto'` | `'info'`
- 灵活的UI配置: 可控制按钮样式和信息显示
- 完整的主题系统集成: 使用`useTheme()`钩子
- 响应式样式: 使用`useThemedStyles()`适配不同主题

### ✅ Feed列表功能 (`feed-list/`) - **[完整文档](/src/features/feed-list/README.md)**

**版本**: v1.4

**位置**: `src/features/feed-list/`

**功能描述**: 高性能视频Feed列表UI组件，基于FlatList实现滚动优化和可见性管理，支持外部精确滚动控制。

**组件实现**:
- `FeedList.tsx` - 主列表组件，支持ref转发和getItemLayout性能优化
- `FeedListLayout.tsx` - 专用布局组件，避免VirtualizedList嵌套
- `FeedVideoCard.tsx` - 视频卡片组件，React.memo优化

**核心特性**:
- **高性能渲染**: 支持50+视频项目流畅滚动
- **精确滚动控制**: ref转发支持外部scrollToIndex调用
- **滚动位置保持**: maintainVisibleContentPosition集成
- **可见性管理**: 50%可见阈值+300ms最小可见时间
- **性能优化**: removeClippedSubviews、批量渲染、React.memo

### ✅ Feed数据获取功能 (`feed-fetching/`) - **[完整文档](/src/features/feed-fetching/README.md)**

**版本**: v1.1

**位置**: `src/features/feed-fetching/`

**功能描述**: 负责视频Feed数据的获取和管理业务逻辑，遵循无状态API设计原则，实现从API获取数据并存储到Entity的完整流程。

**架构实现**:
- `api/feedApi.ts` - API客户端，无状态设计
- `lib/feedService.ts` - 业务逻辑层，协调API和Entity
- `model/types.ts` - 类型定义

**核心特性**:
- **无状态API设计**: 后端只需count+JWT，无需维护分页状态
- **责任分离**: API调用、业务逻辑、状态管理完全分离
- **模拟数据支持**: 开发阶段使用真实视频URL的模拟数据
- **防碰撞ID生成**: 确保视频ID唯一性
- **多样化标题生成**: 20种学习模板随机组合

### ✅ 视频窗口管理功能 (`video-window-management/`) - **[完整文档](/src/features/video-window-management/CONTEXT.md)**

**版本**: v1.0

**位置**: `src/features/video-window-management/`

**功能描述**: Feature层依赖注入协调模块，解决Player Pool Entity对其他Entities的依赖问题，提供窗口扩展API封装。

**核心架构**:
- **依赖注入模式**: Feature层协调多Entity数据流
- **回调工厂模式**: 创建闭包捕获Entity数据
- **FSD合规**: 保持Entity层零依赖原则

**核心特性**:
- **窗口扩展封装**: 提供extendWindowNext/Prev的高级API
- **多Entity协调**: 整合video-meta、subtitle、global-settings数据
- **异步数据准备**: 预加载字幕和元数据后再调用Player Pool
- **动态索引计算**: 基于videoId查找Feed索引

### ✅ 视频详情信息显示功能 (`detail-info-display/`) - **[完整文档](/src/features/detail-info-display/CONTEXT.md)**

**位置**: `src/features/detail-info-display/`

**功能描述**: 视频详情页信息展示组件，提供标题、描述、标签等视频元数据的UI呈现。

**组件实现**:
- `VideoDetailInfo.tsx` - 主信息展示组件
- 集成video-meta entity获取数据

**核心特性**:
- **元数据展示**: 标题、描述、时长、标签
- **响应式布局**: 适配不同屏幕尺寸
- **主题集成**: 使用设计系统组件

### ✅ 视频详情交互栏功能 (`detail-interaction-bar/`) - **[完整文档](/src/features/detail-interaction-bar/CONTEXT.md)**

**位置**: `src/features/detail-interaction-bar/`

**功能描述**: 视频详情页交互按钮栏，提供点赞、收藏、分享等用户操作入口。

**组件实现**:
- `VideoInteractionBar.tsx` - 交互按钮组
- 触觉反馈集成

**核心特性**:
- **多种交互**: 点赞、收藏、分享、评论
- **状态管理**: 与video-meta entity同步
- **触觉反馈**: 用户操作响应优化

## 实现模式

### FSD 架构合规性

**切片结构 (Slice Structure)**:
```
src/features/theme/
├── index.ts               # 功能级导出
└── ui/
    └── ThemeCard.tsx      # UI实现
```

**分段实现 (Segment Implementation)**:
- ✅ `ui/` - UI组件实现 (已实现)
- ✅ `hooks/` - 功能特定钩子 (已实现)
- ✅ `model/` - 功能状态管理 (已实现 - 认证流程状态管理)
- 🚧 `api/` - 功能API交互 (准备扩展)

### ✅ 认证功能 (`auth/`) - FSD标准架构

**位置**: `src/features/auth/`

**功能描述**: 提供完整的认证系统，基于Feature-Sliced Design标准段实现，包含API层、工具库层、模型层、UI层和提供器层的完整认证架构。

**核心架构特性**:
- **100% FSD合规**: 使用api/、lib/、model/、ui/四个标准段，严格遵循依赖规则
- **三类协调架构**: AuthOperations、AuthStateManager、CooldownManager协作
- **双冷却保护系统**: 发送验证码60秒、验证操作3秒的双重冷却保护
- **内存安全模式**: 全面的组件生命周期跟踪和异步操作保护
- **类型安全**: 端到端TypeScript + Zod验证

**UI组件实现**:
- `AuthLoginCard.tsx` - 主登录卡片组件，采用简化状态管理和表单验证
- `BaseAuthCard.tsx` - 可复用认证卡片包装器，统一所有认证表单
- `PasswordToggleIcon.tsx` - 专用密码可见性切换组件
- `ForgotPasswordLink.tsx` - 独立忘记密码导航组件
- `SocialLoginButtons.tsx` - 社交认证集成组件
- `AuthEmailCodeCard.tsx` - 邮箱验证码表单组件
- `AuthResetPasswordCard.tsx` - 密码重置表单组件
- `LoginHeader.tsx` - 认证页面头部组件
- `FormField.tsx` - 可复用表单输入字段组件

**API层 (api/)**:
- `auth-api.ts` - Supabase API调用封装类
- `supabase.ts` - Supabase客户端配置

**工具库层 (lib/)**:
- `auth-operations.ts` - 认证业务逻辑协调器(466行)
- `auth-helpers.ts` - 认证辅助工具函数
- `config.ts` - 统一配置管理(冷却时间、Toast消息、UI文案)
- `error-utils.ts` - 错误处理和友好消息转换
- `useFormValidation.ts` - 表单验证Hook

**模型层 (model/)**:
- `auth-state-manager.ts` - 认证状态管理器类(261行)
- `cooldown-manager.ts` - 冷却时间管理器类
- `auth-types.ts` - 认证类型定义
- `validation.ts` - Zod验证schemas

**提供器层 (providers/)**:
- `AuthProvider.tsx` - 认证上下文提供器(149行)

**核心特性**:
- **FSD标准合规**: 100%符合Feature-Sliced Design架构规范
- **高度模块化**: 每个类/函数都有单一职责，依赖注入模式解耦
- **类型安全**: 完整的TypeScript类型定义 + Zod runtime验证
- **用户体验优化**: 双层冷却保护防止滥用 + 友好错误消息
- **开发体验友好**: 统一配置管理 + 清晰文档和注释
- **直接集成**: 组件直接使用useAuth()钩子，无需容器模式
- **玻璃态设计**: 与GlassInput、GlassButton无缝集成
- **统一表单管理**: React Hook Form + Zod验证

### FSD认证架构模式

**架构原则**:
- **标准段分离**: api/、lib/、model/、ui/四个标准段，严格职责边界
- **单向依赖**: 严格遵循FSD依赖规则，ui → lib/model → api
- **类基架构**: AuthOperations、AuthStateManager、CooldownManager三类协作

**数据流架构**:
```
用户操作 (UI组件)
    ↓
AuthProvider.useAuth()
    ↓
AuthOperations (协调器)
    ↓
1. 参数验证 (Zod schemas)
    ↓
2. 冷却检查 (CooldownManager)
    ↓  
3. 状态更新 (AuthStateManager.setVerifying)
    ↓
4. API调用 (AuthAPI)
    ↓
5. 结果处理 & 状态恢复
    ↓
6. 错误处理 & Toast提示
```

**架构优势**:
- **FSD标准合规**: 100%符合架构规范，提升可维护性
- **高度模块化**: 清晰的职责边界，易于单元测试
- **类型安全**: 端到端类型安全，减少运行时错误
- **扩展性强**: 标准化结构便于添加新功能

### 当前文件结构

**FSD标准认证架构**:
```
src/features/auth/
├── api/                    # ✅ API交互层 (标准FSD段)
│   ├── auth-api.ts             # Supabase API调用封装
│   ├── supabase.ts             # Supabase客户端配置
│   └── index.ts
├── lib/                    # ✅ 工具库层 (标准FSD段)
│   ├── auth-helpers.ts         # 认证辅助工具函数
│   ├── auth-operations.ts      # 认证业务逻辑协调器
│   ├── config.ts               # 认证配置常量和文案
│   ├── error-utils.ts          # 错误处理工具
│   ├── useFormValidation.ts    # 表单验证Hook
│   └── index.ts
├── model/                  # ✅ 状态管理模型层 (标准FSD段)
│   ├── auth-state-manager.ts   # 认证状态管理器类
│   ├── auth-types.ts           # 认证类型定义
│   ├── cooldown-manager.ts     # 冷却时间管理器类
│   ├── validation.ts           # Zod验证schemas
│   └── index.ts
├── providers/              # ⚠️ 认证提供器层 (非标准段，但合理)
│   ├── AuthProvider.tsx        # 认证上下文提供器
│   └── index.ts
├── ui/                     # ✅ UI组件层 (标准FSD段)
│   ├── AuthLoginCard.tsx           # 主登录卡片组件
│   ├── AuthEmailCodeCard.tsx       # 邮箱验证码卡片
│   ├── AuthResetPasswordCard.tsx   # 密码重置卡片
│   ├── BaseAuthCard.tsx            # 基础卡片容器
│   ├── FormField.tsx               # 表单字段组件
│   ├── LoginHeader.tsx             # 登录页头部
│   ├── PasswordToggleIcon.tsx      # 密码显示切换图标
│   ├── SocialLoginButtons.tsx      # 社交登录按钮
│   └── index.ts
└── index.ts                # 统一导出
```

**依赖集成**:
- ✅ API层纯外部服务交互，封装Supabase认证API
- ✅ 工具库层业务逻辑协调、工具函数、配置管理
- ✅ 模型层状态管理、数据模型、验证规则
- ✅ UI层React组件和用户界面逻辑
- ✅ 提供器层全局认证状态管理
- ✅ 遵循FSD依赖方向 (仅向下依赖shared层)
- ✅ 严格的单向依赖关系

## 与其他层的集成

### 与共享层 (Shared) 集成

**玻璃态UI组件使用**:
```typescript
import { 
  GlassInput, 
  GlassButton, 
  InputIcon,
  EmailInput 
} from '@/shared/ui';
```

**认证提供器集成**:
```typescript
import { useAuth } from '@/features/auth';
```

**集成模式**:
- 直接导入玻璃态UI组件库
- 使用认证提供器获取状态和操作
- 集成表单验证和错误处理
- expo-router用于页面导航

### 与应用路由 (App Routes) 集成

**当前使用模式**:
```typescript
// app/auth/login.tsx - 直接使用认证组件
import { AuthLoginCard, SocialLoginButtons } from '@/features/auth/ui';

export default function LoginPage() {
  const handleSocialLogin = async (provider: string) => {
    // 社交登录逻辑
  };

  return (
    <GlassCard>
      <AuthLoginCard />
      <Separator text="or" />
      <SocialLoginButtons 
        onSocialLogin={handleSocialLogin}
        disabled={false}
      />
    </GlassCard>
  );
}

// 主题功能使用示例
// 学习页面: 切换模式
<ThemeCard mode="toggle" />

// 收藏页面: 自动模式设置  
<ThemeCard mode="auto" />
```

**集成特点**:
- 直接 app route → feature component 集成
- 无需中间页面层抽象
- 组件直接处理业务逻辑

### 与组件层 (Widgets) 集成

**依赖方向**:
- ✅ 功能层不依赖组件层 (正确的FSD合规性)
- ✅ 组件层可在需要时使用功能 (正确的依赖方向)

## 开发约定

### 文件组织约定

**单一职责**: 每个功能处理一个用户交互领域
**分段分离**: UI组件在`ui/`分段 (为`model/`, `api/`分段准备)
**索引导出**: 清晰导入的标准桶导出模式
**TypeScript优先**: 所有文件使用`.tsx`扩展名，严格类型

### 多模式组件设计

ThemeCard建立了具有多种交互模式功能的模式:
- **基于模式的行为**: 基于`mode`属性的不同功能
- **条件渲染**: UI元素根据配置显示/隐藏
- **灵活的API**: 单个组件处理多个用例
- **语义属性**: 表达意图的清晰属性名称

### 现代表单管理模式

认证组件采用现代化的表单管理方法:

**React Hook Form + Zod 集成**:
- **组件内集成**: 表单逻辑直接在组件中管理，无需外部容器
- **类型安全验证**: 使用Zod提供运行时和编译时类型安全
- **实时验证**: 输入时即时验证和错误反馈
- **统一错误处理**: 通过toast系统提供一致的错误显示

**组件直接集成模式**:
```typescript
// AuthLoginCard.tsx - 直接集成示例
export function AuthLoginCard() {
  const { isVerifying, signIn } = useAuth();
  const form = useForm<AuthLoginData>({
    resolver: zodResolver(loginSchema)
  });
  
  const handleLogin = async (data: AuthLoginData) => {
    await signIn(data.email, data.password);
    router.replace('/');
  };
}
```

### 用户交互处理

**建立的交互模式**:
```typescript
const handlePress = () => {
  if (mode === 'toggle') {
    toggleLightDark();      // 直接主题操作
  } else if (mode === 'auto') {
    setThemeMode('auto');   // 配置操作
  }
};
```

## 主题集成卓越性

### 设计系统合规性

**无硬编码值**: 所有颜色、间距、字体使用主题令牌
**响应式设计**: 正确使用主题间距系统
**样式生成**: 使用建立的`useThemedStyles`模式
**主题响应性**: 自动适配主题变化

**实现示例**:
```typescript
const styles = useThemedStyles((theme) => ({
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  info: {
    marginBottom: showCurrentMode && mode !== 'info' ? theme.spacing.md : 0,
  },
}));
```

## 未来功能扩展

### 功能模块模板

基于ThemeCard分析，建立的模式可指导其他功能开发:

**认证功能**: ✅ 已实现 - 简化架构的认证系统，直接集成登录、社交登录和密码管理，采用React Hook Form + Zod验证
**学习功能**: 单词学习、测验交互、进度跟踪  
**内容功能**: 书签管理、笔记记录、搜索
**设置功能**: 用户偏好、通知控制、语言选择

### 缺失分段扩展

基于FSD架构，功能可从以下方面受益:
- **`model/`分段**: 功能特定的状态管理和业务逻辑
- **`api/`分段**: 功能特定的API交互
- **`lib/`分段**: 功能特定的工具函数

## 质量和可维护性

### 代码质量

- **JSDoc覆盖**: 全面的组件文档
- **TypeScript严格**: 接口完全类型安全
- **一致命名**: 清晰、语义化命名约定
- **错误处理**: 优雅降级和回退

### 可测试性

- **纯函数**: 确定性组件行为
- **属性接口**: 易于模拟和测试
- **直接集成**: 简化的架构减少测试复杂度
- **最小依赖**: 易于单元测试隔离

---

*此文档记录了my-word-app功能层的当前实现状态和架构模式。随着新功能的开发，将持续更新此文档以反映功能层的演进。*