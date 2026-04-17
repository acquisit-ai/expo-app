# Session 同步机制完整分析

## 所有认证状态变化和 Entity Session 更新映射

### 1. Supabase 原生事件 → UserStore 同步

| Supabase 事件 | 触发时机 | AuthProvider 处理 | UserStore 更新 | 备注 |
|--------------|---------|-----------------|---------------|------|
| `INITIAL_SESSION` | 应用启动时 | ✅ `syncUserStore(session)` | ✅ 设置初始session | 应用启动必触发 |
| `SIGNED_IN` | 用户登录成功 | ✅ `syncUserStore(session)` | ✅ 设置登录session | 登录成功必触发 |
| `SIGNED_OUT` | 用户退出登录 | ✅ `syncUserStore(null)` | ✅ 清空session | 退出登录必触发 |
| `TOKEN_REFRESHED` | 令牌自动刷新 | ✅ `syncUserStore(session)` | ✅ 更新token信息 | 定期自动触发 |
| `USER_UPDATED` | 用户信息更新 | ✅ `syncUserStore(session)` | ✅ 更新用户数据 | 用户信息变更时 |
| `PASSWORD_RECOVERY` | 密码恢复流程 | ✅ `syncUserStore(session)` | ✅ 更新恢复session | 密码重置时 |

### 2. 业务操作 → 事件链 → UserStore 更新

#### 2.1 邮箱+密码登录 (`signIn`)
```
AuthOperations.signIn()
    ↓ 调用
AuthAPI.signInWithPassword()
    ↓ 调用
supabase.auth.signInWithPassword()
    ↓ 成功后触发
SIGNED_IN 事件
    ↓ AuthProvider 监听
handleAuthStateChange('SIGNED_IN', session)
    ↓ 调用
syncUserStore(session)
    ↓ 更新
UserStore 完整session数据
```

#### 2.2 验证码登录 (`verifyCode`)
```
AuthOperations.verifyCode()
    ↓ 调用
AuthAPI.verifyOTP()
    ↓ 调用
supabase.auth.verifyOtp()
    ↓ 成功后触发
SIGNED_IN 事件
    ↓ AuthProvider 监听
handleAuthStateChange('SIGNED_IN', session)
    ↓ 调用
syncUserStore(session)
    ↓ 更新
UserStore 完整session数据
```

#### 2.3 退出登录 (`signOut`)
```
AuthOperations.signOut()
    ↓ 调用
AuthAPI.signOut()
    ↓ 调用
supabase.auth.signOut()
    ↓ 成功后触发
SIGNED_OUT 事件
    ↓ AuthProvider 监听
handleAuthStateChange('SIGNED_OUT', null)
    ↓ 调用
syncUserStore(null)
    ↓ 清空
UserStore 所有session数据
```

#### 2.4 设置/重置密码 (`setPassword`)
```
AuthOperations.setPassword()
    ↓ 调用
AuthAPI.updatePassword()
    ↓ 调用
supabase.auth.updateUser({ password, data: { has_password: true } })
    ↓ 成功后触发
USER_UPDATED 事件
    ↓ AuthProvider 监听
handleAuthStateChange('USER_UPDATED', session)
    ↓ 调用
syncUserStore(session)
    ↓ 更新
UserStore session数据（包括 has_password: true）
```

#### 2.5 应用启动时会话检查
```
应用启动
    ↓ AuthProvider useEffect
supabase.auth.onAuthStateChange()
    ↓ 立即触发
INITIAL_SESSION 事件
    ↓ AuthProvider 监听
handleAuthStateChange('INITIAL_SESSION', session)
    ↓ 调用
syncUserStore(session) // session可能为null
    ↓ 设置
UserStore 初始状态
```

#### 2.6 Token 自动刷新
```
Supabase SDK 后台运行
    ↓ token快过期时自动触发
TOKEN_REFRESHED 事件
    ↓ AuthProvider 监听
handleAuthStateChange('TOKEN_REFRESHED', newSession)
    ↓ 调用
syncUserStore(newSession)
    ↓ 更新
UserStore token信息（accessToken, refreshToken, tokenExpiresAt）
```

### 3. 关键保证机制

#### 3.1 数据一致性保证
- **单一数据源**: UserStore 是 session 数据的唯一真实来源
- **事件驱动**: 所有 session 变更都通过 Supabase 事件触发
- **自动同步**: AuthProvider 自动监听所有事件并同步到 UserStore
- **容错处理**: 同步失败不影响认证流程，有完善的错误日志

#### 3.2 性能优化保证
- **细粒度更新**: UserStore.setSession() 只在数据确实变化时触发重渲染
- **批量更新**: 一次 setSession 调用更新所有相关字段
- **选择性订阅**: 组件通过细粒度 hooks 只订阅需要的数据片段

#### 3.3 类型安全保证
- **TypeScript 约束**: 所有 session 数据都有严格的类型定义
- **运行时验证**: UserStore 在设置数据时进行基本验证
- **空值处理**: 正确处理 session 为 null 的情况

### 4. 验证每个场景的完整性

#### ✅ 场景1: 用户首次访问应用
1. 应用启动 → `INITIAL_SESSION` 事件 → `syncUserStore(null)` → UserStore 清空状态
2. 所有组件通过细粒度 hooks 获取到未登录状态

#### ✅ 场景2: 用户邮箱密码登录
1. 点击登录 → `signInWithPassword` → `SIGNED_IN` 事件 → `syncUserStore(session)` → UserStore 设置完整session
2. 所有组件立即获取到登录状态和用户信息

#### ✅ 场景3: 用户验证码登录
1. 验证验证码 → `verifyOtp` → `SIGNED_IN` 事件 → `syncUserStore(session)` → UserStore 设置完整session
2. 所有组件立即获取到登录状态和用户信息

#### ✅ 场景4: 用户设置密码
1. 设置密码 → `updateUser` → `USER_UPDATED` 事件 → `syncUserStore(session)` → UserStore 更新 has_password 状态
2. 所有组件立即获取到更新后的密码状态

#### ✅ 场景5: 用户退出登录
1. 点击退出 → `signOut` → `SIGNED_OUT` 事件 → `syncUserStore(null)` → UserStore 清空所有数据
2. 所有组件立即跳转到未登录状态

#### ✅ 场景6: Token 自动刷新
1. Supabase 后台刷新 → `TOKEN_REFRESHED` 事件 → `syncUserStore(session)` → UserStore 更新token
2. 组件无感知更新，继续正常运行

### 5. 总结

**✅ 完全覆盖**: 所有可能的认证状态变化都会正确更新 UserStore 的 session
**✅ 数据一致**: UserStore 始终与 Supabase 状态保持同步
**✅ 实时更新**: 组件通过细粒度 hooks 实时获取最新状态
**✅ 错误容忍**: 同步失败不影响用户体验
**✅ 性能优化**: 细粒度更新避免不必要的重渲染

Entity/User 层完全接管了以前 Context session 的所有功能，并且提供了更好的性能和可维护性。