# User Entity

用户实体模块，专注于用户会话状态管理，为应用提供类型安全的用户数据访问。

## 📖 概述

User Entity 是基于 Zustand 的用户会话管理模块，作为 Supabase 认证系统的内存缓存层。它遵循 FSD（Feature-Sliced Design）架构原则，与 `features/auth` 完美配合，实现认证操作与数据管理的职责分离。

### 🎯 核心理念

- **数据管理专注**: 纯粹的用户数据状态管理，不包含业务逻辑
- **事件驱动同步**: 通过 AuthProvider 事件自动同步 Supabase 状态变化
- **性能优化**: 25个细粒度 hooks 避免不必要的重渲染
- **类型安全**: 完整的 TypeScript 类型支持
- **内存安全**: 组件卸载保护，防止内存泄漏

## 🏗️ 架构设计

```
src/entities/user/
├── model/                    # 状态管理层
│   ├── types.ts             # 类型定义
│   └── store.ts             # Zustand store
├── hooks/                    # React Hooks 层
│   ├── index.ts             # 统一导出所有 hooks
│   ├── useAuth.ts           # 认证状态相关 hooks
│   ├── useSession.ts        # Session 管理相关 hooks
│   ├── useTokens.ts         # Token 相关 hooks
│   ├── useUserActions.ts    # 用户操作和工具 hooks
│   └── useUserProfile.ts    # 用户基础信息相关 hooks
├── index.ts                 # 公共 API 导出
└── README.md               # 本文档
```

### 🔄 数据流

```
Supabase Auth Events → AuthProvider → UserStore → React Components
        ↑                  ↑            ↑             ↑
    持久化存储           事件监听      数据管理       状态消费
```

### 🎨 职责分离

```
features/auth        entities/user
     ↓                    ↓
 认证业务操作    ←→   用户数据管理
 - signIn               - session 状态
 - signOut              - 用户信息缓存
 - verifyCode           - token 管理
 - sendCode             - 细粒度选择器
```

## 🚀 快速开始

### 基础使用

```typescript
import {
  useIsAuthenticated,
  useUserId,
  useUserEmail,
  useSession
} from '@/entities/user';

import { useAuth } from '@/features/auth';

function MyComponent() {
  // ✅ 从 entities/user 获取数据
  const isAuth = useIsAuthenticated();
  const userId = useUserId();
  const email = useUserEmail();
  const session = useSession();

  // ✅ 从 features/auth 执行认证操作
  const { signOut } = useAuth();

  if (!isAuth) {
    return <LoginScreen />;
  }

  return (
    <View>
      <Text>用户ID: {userId}</Text>
      <Text>邮箱: {email}</Text>
      <Button title="退出" onPress={() => signOut()} />
    </View>
  );
}
```

### 事件驱动同步机制

```typescript
// AuthProvider 自动同步到 UserStore
export function AuthProvider({ children }) {
  const syncUserStore = useCallback((session: Session | null) => {
    try {
      const { setSession } = useUserStore.getState();
      setSession(session);
      log('auth', LogType.DEBUG, 'AuthProvider: UserStore 同步成功');
    } catch (error) {
      log('auth', LogType.WARNING, 'AuthProvider: UserStore 同步失败，不影响认证流程');
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        syncUserStore(session); // 自动同步所有事件
      }
    );

    return () => subscription.unsubscribe();
  }, [syncUserStore]);

  // ...
}
```

## 📚 API 参考

### Store Actions

#### 会话管理

```typescript
// 设置完整 session
setSession(session: Session | null): void

// 部分更新 session
updateSession(updates: Partial<Session>): void

// 清空 session
clearSession(): void

// 从 Supabase 同步最新状态
syncWithSupabase(): Promise<void>
```

#### 令牌管理

```typescript
// 刷新 session
refreshSession(): Promise<void>

// 检查 token 是否有效
isTokenValid(): boolean

// 获取 token 剩余时间（秒）
getTimeUntilExpiry(): number | null
```

#### 用户信息

```typescript
// 更新用户元数据
updateUserMetadata(metadata: Record<string, any>): Promise<void>

// 获取状态快照
getSessionSnapshot(): UserSessionState
```

### Hooks（25个优化 Hooks）

所有 hooks 按功能分组，提供细粒度的状态访问：

#### 用户基础信息 (`hooks/useUserProfile.ts`)

```typescript
useUserId()             // string | null - 用户 ID
useUserEmail()          // string | null - 用户邮箱
useUserPhone()          // string | null - 用户手机号
useUserProfile()        // User | null - 完整用户对象
useUserBasicInfo()      // 组合基础信息
useLastSignInAt()       // string | null - 最后登录时间
useCreatedAt()          // string | null - 账户创建时间
useIsProfileComplete()  // boolean - 用户资料是否完整
```

#### 认证状态 (`hooks/useAuth.ts`)

```typescript
useIsAuthenticated()  // boolean - 是否已认证
useHasPassword()      // boolean - 是否设置密码
useAuthProvider()     // string | null - 登录提供商
useIsSessionExpired() // boolean - session 是否过期
useIsRefreshing()     // boolean - 是否正在刷新
useAuthStatus()       // 组合认证状态
```

#### Token 管理 (`hooks/useTokens.ts`)

```typescript
useAccessToken()      // string | null - 访问令牌
useRefreshToken()     // string | null - 刷新令牌
useTokenExpiresAt()   // number | null - 令牌过期时间
useTokenInfo()        // 组合 token 信息
useNeedsRefresh()     // boolean - 是否需要刷新（提前5分钟）
```

#### Session 管理 (`hooks/useSession.ts`)

```typescript
useSession()          // Session | null - 完整 session
useSessionUpdatedAt() // number | null - session 最后更新时间
useSessionActions()   // session 管理操作
```

#### 用户操作和工具 (`hooks/useUserActions.ts`)

```typescript
useUserActions()  // { updateUserMetadata } - 用户信息更新操作
useUserUtils()    // { isTokenValid, getTimeUntilExpiry, getSessionSnapshot } - 工具方法
useUserStore()    // 完整 store（谨慎使用）
```

### Hooks 分组说明

- **`useUserProfile.ts`**: 用户基础信息和资料相关
- **`useAuth.ts`**: 认证状态和权限相关
- **`useSession.ts`**: Session 生命周期管理
- **`useTokens.ts`**: 令牌管理和刷新逻辑
- **`useUserActions.ts`**: 用户操作、工具方法和完整 store

## 🎨 最佳实践

### 1. 正确的职责分离

**✅ 推荐模式**

```typescript
import { useSession, useUserEmail, useHasPassword } from '@/entities/user';
import { useAuth } from '@/features/auth';

function ProfileComponent() {
  // ✅ 数据获取：从 entities/user
  const session = useSession();
  const email = useUserEmail();
  const hasPassword = useHasPassword();

  // ✅ 业务操作：从 features/auth
  const { signOut, updatePassword } = useAuth();

  return (
    <View>
      <Text>邮箱: {email}</Text>
      {hasPassword ? (
        <Button title="修改密码" onPress={updatePassword} />
      ) : (
        <Button title="设置密码" onPress={() => router.push('/auth/set-password')} />
      )}
      <Button title="退出登录" onPress={() => signOut()} />
    </View>
  );
}
```

**❌ 错误模式**

```typescript
// ❌ 不要从 features/auth 获取用户数据
const { session } = useAuth(); // 错误！

// ❌ 不要在 entities/user 中放置业务操作
const { signOut } = useUserStore(); // 错误！
```

### 2. 性能优化

**✅ 使用细粒度 hooks**

```typescript
// 好 - 只在 userId 变化时重渲染
const userId = useUserId();

// 避免 - 任何状态变化都会重渲染
const { userId } = useUserStore();
```

**✅ 使用组合 hooks**

```typescript
// 好 - 一次性获取相关状态
const { isAuthenticated, isSessionExpired } = useAuthStatus();
const { userId, email, phone } = useUserBasicInfo();

// 避免 - 多次调用
const isAuth = useIsAuthenticated();
const isExpired = useIsSessionExpired();
const userId = useUserId();
const email = useUserEmail();
```

**✅ 按功能导入**

```typescript
// 好 - 按需导入特定功能的 hooks
import { useUserId, useUserEmail } from '@/entities/user';
import { useIsAuthenticated, useAuthStatus } from '@/entities/user';

// 避免 - 导入不需要的 hooks
import * as UserHooks from '@/entities/user';
```

### 3. 内存安全

```typescript
// Store 内部已实现内存安全保护
const isMountedRef = useRef(true);
useEffect(() => () => { isMountedRef.current = false; }, []);

// 异步操作前检查组件挂载状态
if (!isMountedRef.current) return;
```

### 4. 错误处理

```typescript
import { useSessionActions } from '@/entities/user';

function useAuthRefresh() {
  const { refreshSession } = useSessionActions();

  const handleRefresh = useCallback(async () => {
    try {
      await refreshSession();
    } catch (error) {
      // 处理刷新失败
      console.error('刷新失败:', error);
      // 可能需要重新登录
    }
  }, [refreshSession]);

  return handleRefresh;
}
```

## 🔧 高级用法

### 自动刷新机制

```typescript
import { useNeedsRefresh, useSessionActions } from '@/entities/user';

function useAutoRefresh() {
  const needsRefresh = useNeedsRefresh();
  const { refreshSession } = useSessionActions();

  useEffect(() => {
    if (needsRefresh) {
      refreshSession().catch(console.error);
    }
  }, [needsRefresh, refreshSession]);
}
```

### 路由守卫

```typescript
function useAuthGuard() {
  const { isAuthenticated, isSessionExpired } = useAuthStatus();
  const { syncWithSupabase } = useSessionActions();

  useEffect(() => {
    if (isSessionExpired) {
      syncWithSupabase().catch(() => {
        router.replace('/auth/login');
      });
    }
  }, [isSessionExpired, syncWithSupabase]);

  return isAuthenticated;
}
```

### 应用启动同步

```typescript
function useInitializeAuth() {
  const { syncWithSupabase } = useSessionActions();

  useEffect(() => {
    syncWithSupabase().catch(console.error);
  }, []);
}
```

## 🚨 注意事项

### 1. 架构原则

- **严格遵循**：数据从 entities/user 获取，操作从 features/auth 执行
- **事件驱动**：所有状态变更通过 AuthProvider 事件自动同步
- **单一数据源**：UserStore 是用户数据的唯一真相来源

### 2. 持久化

- **不要**在 Zustand store 中使用 `persist` 中间件
- Supabase SDK 已经处理了 session 持久化
- Store 仅作为内存缓存使用

### 3. 安全性

- 敏感操作始终通过 Supabase API 进行
- 不要在客户端存储敏感信息
- Token 刷新等操作已内置安全检查

### 4. 性能

- 优先使用细粒度 selectors
- 避免在 render 中直接调用 store actions
- 大量状态变更时已自动批处理

## 🔍 调试

### 开发工具

```typescript
// 开启 Zustand DevTools
const store = useUserStore();

// 在控制台查看当前状态
console.log('当前用户状态:', store.getSessionSnapshot());
```

### 日志

Store 会自动记录关键操作日志：

```
[10:30:15] [user] 🟢 UserStore: 更新用户会话 - 用户ID: abc123
[10:30:20] [user] 🟡 UserStore: 刷新返回空会话
[10:30:25] [user] 🔴 UserStore: 刷新会话失败
```

## 🧪 测试

### 单元测试示例

```typescript
import { renderHook } from '@testing-library/react-native';
import { useUserStore, useIsAuthenticated } from '@/entities/user';

describe('User Entity', () => {
  beforeEach(() => {
    useUserStore.getState().clearSession();
  });

  it('should update authentication status', () => {
    const { result } = renderHook(() => useIsAuthenticated());

    expect(result.current).toBe(false);

    // 模拟登录
    useUserStore.getState().setSession(mockSession);

    expect(result.current).toBe(true);
  });
});
```

## 📦 类型定义

```typescript
interface UserSessionState {
  session: Session | null;
  user: User | null;
  userId: string | null;
  email: string | null;
  phone: string | null;
  isAuthenticated: boolean;
  hasPassword: boolean;
  provider: string | null;
  lastSignInAt: string | null;
  createdAt: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  isSessionExpired: boolean;
  isRefreshing: boolean;
  sessionUpdatedAt: number | null;
}
```

## 📝 更新日志

### v2.1.0 (当前版本)
- **模块化重构**: 新增 `hooks/` 文件夹，按功能分组组织 hooks
- **更清晰的架构**: 5个功能模块，25个优化 hooks
- **文档更新**: 反映新的文件结构和使用方式
- **向前兼容**: 保持所有现有 API 不变

### v2.0.0
- **架构重构**: 完全移除业务逻辑，专注数据管理
- **工具函数清理**: 删除未使用的验证器和会话工具函数
- **性能优化**: 25个细粒度 hooks，最小化重渲染
- **事件驱动**: 完整的 Supabase 事件覆盖和自动同步
- **内存安全**: 组件卸载保护，防止内存泄漏
- **类型安全**: 完整的 TypeScript 类型支持
- **职责分离**: 与 features/auth 完美协作

### v1.0.0
- 初始实现
- 基础 session 管理
- 工具函数（已移除）

## 🤝 贡献

在修改此模块时，请确保：

1. 保持数据管理的单一职责
2. 不要添加业务逻辑，应放在 features/ 层
3. 保持与 Supabase SDK 的兼容性
4. 添加适当的类型定义
5. 更新相关测试和文档
6. 遵循 FSD 架构原则