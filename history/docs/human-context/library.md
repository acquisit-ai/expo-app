# 技术栈选型指南

本文档记录当前应用已采用的技术栈和架构选择，为理解项目技术决策提供参考。

## 当前技术栈概览

### 核心架构

- **架构模式**: Feature-Sliced Design (FSD)
- **框架**: React Native + Expo
- **语言**: TypeScript (严格模式)
- **后端服务**: Supabase (认证、数据库)
- **导航**: Expo Router (基于文件的路由)

## 已实现的技术选择

### 1. 导航系统

**选择**: `expo-router`

**实现位置**: 
- 路由定义: `app/` 目录
- 页面组件: `src/pages/` 目录

**关键特性**:
- 基于文件系统的路由
- Tab 导航 + Stack 导航
- 模态页面支持
- 类型安全的导航

```typescript
// app/(tabs)/_layout.tsx
<Tabs screenOptions={{ headerShown: false }}>
  <Tabs.Screen name="learn" />
  <Tabs.Screen name="collections" />
  <Tabs.Screen name="profile" />
</Tabs>
```

### 2. 状态管理

**认证状态**: React Context + AsyncStorage
- **位置**: `src/features/auth/providers/AuthProvider.tsx`
- **特性**: 会话管理、状态持久化、自动登录

**主题状态**: React Context + AsyncStorage  
- **位置**: `src/shared/providers/ThemeProvider.tsx`
- **特性**: 浅色/深色/自动模式、持久化用户偏好

```typescript
// 认证状态使用
const { session, loading, signIn, signOut } = useAuth();

// 主题状态使用
const { theme, isDark, toggleTheme } = useTheme();
```

### 3. UI 系统

**设计系统**: 自建 UI 组件库
- **位置**: `src/shared/ui/`
- **组件**: Button, Input, Card, Typography, Container, Row/Column
- **特性**: 完全主题化、响应式设计、TypeScript 严格类型

**玻璃态组件**: 专用认证 UI
- **位置**: `src/shared/ui/glass/`
- **组件**: GlassCard, GlassInput, GlassButton, SocialButton
- **特性**: 模糊效果、渐变背景、现代视觉效果

**样式管理**:
- **主题系统**: `src/shared/config/theme.ts`
- **样式工具**: `src/shared/lib/styles.ts`
- **响应式**: `react-native-size-matters`

```typescript
// UI 组件使用
import { Container, Button, Card, H1 } from '@/shared/ui';

<Container safe padding="lg">
  <Card>
    <H1>标题</H1>
    <Button title="按钮" onPress={handlePress} />
  </Card>
</Container>
```

### 4. 认证与后端

**后端服务**: Supabase
- **客户端**: `@supabase/supabase-js`
- **配置**: `src/features/auth/api/supabase.ts`
- **特性**: 自动会话管理、JWT 刷新、AsyncStorage 集成

**当前实现**: Mock 认证
- **兼容性**: 保持与 Supabase API 完全兼容
- **迁移路径**: 可无缝切换到真实 Supabase 认证

```typescript
// 认证配置
export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

### 5. 开发工具

**类型检查**: TypeScript 严格模式
- **配置**: `tsconfig.json`
- **脚本**: `npm run type-check`

**代码质量**: ESLint + Prettier
- **配置**: `.eslintrc.js`
- **自动格式化**: VS Code 集成

**环境管理**: `.env.local`
- **Supabase 配置**: URL + Anon Key
- **开发/生产环境**: 环境变量隔离

## 项目结构模式

### FSD 架构实现

```
src/
├── shared/           # 共享层
│   ├── ui/          # UI 组件库
│   ├── lib/         # 工具函数
│   ├── config/      # 配置文件
│   └── providers/   # 全局提供器
├── entities/        # 实体层
│   └── user/        # 用户实体
├── features/        # 功能层
├── widgets/         # 部件层
│   └── navigation/  # 导航组件
└── pages/           # 页面层
    ├── auth/        # 认证页面
    ├── learning/    # 学习页面
    ├── collections/ # 单词本页面
    └── profile/     # 个人中心页面
```

### 路由架构

```
app/
├── _layout.tsx      # 根布局 (ThemeProvider + AuthProvider)
├── index.tsx        # 认证路由控制器
├── modal.tsx        # 模态页面示例
└── (tabs)/         # Tab 导航分组
    ├── _layout.tsx  # Tab 布局
    ├── learn.tsx    # 学习页面路由
    ├── collections.tsx # 单词本页面路由
    └── profile.tsx  # 个人中心页面路由
```

## 关键设计决策

### 1. 为什么选择 Expo Router

- **FSD 兼容**: 文件系统路由与 FSD 目录结构完美匹配
- **类型安全**: 自动生成路由类型定义
- **跨平台**: iOS、Android、Web 统一导航体验
- **现代特性**: 代码分割、深层链接、模态支持

### 2. 为什么自建 UI 组件库

- **完全控制**: 满足特定设计需求
- **主题一致性**: 统一的设计令牌系统
- **性能优化**: 避免引入不必要的依赖
- **类型安全**: 完整的 TypeScript 支持

### 3. 为什么使用 React Context 而非 Redux

- **简单性**: 应用状态相对简单，Context 足够
- **性能**: 精确的状态分割，避免不必要的重渲染
- **维护性**: 较少的模板代码，更容易维护
- **集成**: 与 React 生态系统原生集成

### 4. 为什么选择 Supabase

- **全栈解决方案**: 认证、数据库、存储一体化
- **开发效率**: 减少后端开发和维护成本
- **扩展性**: PostgreSQL 数据库，支持复杂查询
- **实时功能**: 内置实时订阅功能

## 未来技术演进计划

### 短期目标

1. **数据层集成**: TanStack Query 用于服务端状态管理
2. **持久化**: Zustand 或 Jotai 用于复杂客户端状态
3. **表单管理**: React Hook Form + Zod 验证
4. **动画**: React Native Reanimated 高性能动画

### 长期目标

1. **数据库**: 本地 SQLite + WatermelonDB 离线支持
2. **测试**: Jest + React Native Testing Library
3. **CI/CD**: EAS Build + GitHub Actions
4. **监控**: Sentry 错误追踪和性能监控

## 技术栈统计

- **总包大小**: 约 50MB (Expo 管理捆绑包)
- **组件数量**: 21个 UI 组件 (17个核心 + 4个玻璃态)
- **页面数量**: 4个主要页面 + 1个模态页面
- **TypeScript 覆盖率**: 100% (严格模式)
- **主题令牌**: 89个设计令牌，10个类别

这个技术栈为单词学习应用提供了坚实的技术基础，平衡了开发效率、性能和可维护性。