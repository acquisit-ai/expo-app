# Supabase Authentication Integration

本文档记录当前应用的 Supabase 认证集成方案，重点说明 SDK 自动管理的认证流程和实现架构。

## 认证架构概述

当前应用采用 **Supabase SDK 自动管理** 的认证方案，实现了以下核心特性：

- **自动会话管理**: Supabase SDK 自动处理 JWT 令牌的生成、刷新和存储
- **会话持久化**: 利用 AsyncStorage 自动保存和恢复用户会话状态
- **状态同步**: 通过 `onAuthStateChange` 实现实时认证状态监听
- **Mock 认证**: 当前实现模拟认证，保持与真实 Supabase API 兼容的接口

## 核心实现组件

### AuthProvider 认证提供器

**位置**: `src/features/auth/providers/AuthProvider.tsx`

提供应用级别的认证状态管理和会话控制：

```typescript
interface AuthContextType {
  session: Session | null;           // 当前用户会话
  loading: boolean;                  // 认证状态加载中
  error: AuthError | null;           // 认证错误状态
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}
```

### Supabase 客户端配置

**位置**: `src/features/auth/api/supabase.ts`

配置 Supabase 客户端，实现自动会话管理：

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

## SDK 自动管理的认证流程

### 1. 会话初始化和恢复

应用启动时自动从 AsyncStorage 恢复会话状态：

```typescript
useEffect(() => {
  // Supabase 自动从存储中恢复会话
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setLoading(false);
  });
}, []);
```

### 2. 实时状态监听

监听认证状态变化，自动同步到应用状态：

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (_event, session) => {
    setSession(session);
    setLoading(false);
  }
);
```

### 3. 模拟认证实现

当前使用模拟认证，保持 Supabase API 兼容性：

```typescript
const signIn = async (email: string, password: string) => {
  // 基本验证
  if (!email.trim() || !password.trim()) {
    throw new Error('请输入邮箱和密码');
  }
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 创建与 Supabase Session 兼容的模拟会话
  const mockSession = createMockSession(email);
  setSession(mockSession);
};
```

## 认证路由集成

### 应用入口路由控制

**位置**: `app/index.tsx`

根据认证状态自动路由用户：

```typescript
export default function Index() {
  const { session, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!session) return <LoginPage />;
  
  // 已登录用户重定向到主应用
  router.replace('/(tabs)/learn');
}
```

### 认证状态驱动的导航

- **未认证**: 显示登录页面 (`LoginPage`)
- **认证中**: 显示加载屏幕 (`LoadingScreen`)
- **已认证**: 自动重定向到主应用

## 环境配置

**位置**: `.env.local`

```bash
# Supabase 项目配置
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 认证 API 使用模式

### 登录流程

```typescript
const { signIn, loading, error } = useAuth();

const handleLogin = async () => {
  try {
    await signIn(email, password);
    // AuthProvider 自动更新会话状态
    // app/index.tsx 监听状态变化并导航
  } catch (error) {
    // 错误处理
  }
};
```

### 登出流程

```typescript
const { signOut } = useAuth();

const handleLogout = async () => {
  try {
    await signOut();
    // 会话状态自动清除
    // 应用自动返回登录页面
  } catch (error) {
    // 错误处理
  }
};
```

### 会话状态检查

```typescript
const { session, loading } = useAuth();

if (loading) {
  // 显示加载状态
}

if (session) {
  // 用户已登录，可以访问受保护的功能
  const userId = session.user.id;
  const userEmail = session.user.email;
}
```

## 未来 Supabase 集成路径

当前模拟认证设计保持与 Supabase API 完全兼容，迁移到真实 Supabase 认证只需：

1. **替换登录实现**:
   ```typescript
   // 将模拟登录替换为
   const { data, error } = await supabase.auth.signInWithPassword({
     email, password
   });
   ```

2. **替换登出实现**:
   ```typescript
   // 将模拟登出替换为
   const { error } = await supabase.auth.signOut();
   ```

3. **保持现有架构**: AuthProvider、路由控制和状态管理无需更改

## 关键优势

1. **SDK 自动化**: 令牌管理、刷新和存储完全自动化
2. **状态同步**: 认证状态变化自动同步到整个应用
3. **持久化会话**: 应用重启后自动恢复用户会话
4. **开发友好**: 模拟认证支持快速开发和测试
5. **生产就绪**: 与真实 Supabase API 完全兼容