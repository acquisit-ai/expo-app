# Auth Pages - React Navigation 架构

认证页面模块实现了**完整的 React Navigation 导航系统**和**智能导航栈管理**，确保认证流程的安全性和用户体验一致性。

## 🏗️ 页面结构

### LoginPage (登录页面)
- **文件**: `ui/LoginPage.tsx`
- **功能**: 提供密码登录和社交登录入口
- **导航模式**: 使用 `navigate()` 进入，成功后 `reset()` 清空栈
- **组件**:
  - `AuthLoginCard` - 邮箱密码登录表单
  - `SocialLoginButtons` - 社交登录按钮组（待实现）
  - `Separator` - 分隔符组件

### VerifyCodePage (验证码页面)
- **文件**: `ui/VerifyCodePage.tsx`
- **功能**: 统一的验证码输入和验证流程
- **导航优化**: 使用 `navigate()` 保留历史，`goBack()` 返回
- **模式**:
  - `mode="login"` - 验证码登录，成功后根据用户状态跳转
  - `mode="forgotPassword"` - 忘记密码验证，成功后跳转密码重置
- **组件**: `AuthEmailCodeCard`
- **防重复导航**: 使用 `useRef` 跟踪是否已导航

### PasswordManagePage (密码管理页面)
- **文件**: `ui/PasswordManagePage.tsx`
- **功能**: 统一的密码设置和重置流程
- **返回策略**: 静默退出 + `goBack()` 返回登录
- **模式**:
  - `mode="set"` - 新用户设置初始密码
  - `mode="reset"` - 忘记密码后重置密码
- **成功后**: 使用 `reset([MainTabs])` 清空导航栈
- **组件**: `AuthResetPasswordCard`

### AuthPageLayout (认证页面布局)
- **文件**: `ui/AuthPageLayout.tsx`
- **功能**: 所有认证页面的统一布局容器
- **核心特性**:
  - 玻璃风格背景和安全区域
  - 键盘收起功能
  - 响应式布局

## 🎯 React Navigation 架构设计

### 🔄 单向数据流 + 智能导航栈管理

**严格的数据流控制**：
```
用户操作 → AuthOperations → AuthAPI → Supabase Events → entities/user → 页面状态更新
```

**智能导航栈管理**：
```
- 条件渲染：RootNavigator 根据 isAuthenticated && hasPassword 决定显示哪个导航器
- 手动清空：在业务完成时调用 navigation.reset() 清空导航栈
- 正确返回：使用 goBack() 返回上一页，保留导航历史
```

**关键原则**：
- **数据源唯一性** - entities/user 作为唯一用户状态源
- **条件渲染导航器** - RootNavigator 根据双重条件 (isAuthenticated && hasPassword) 切换
- **导航栈清空** - 在认证成功/退出登录时清空导航栈
- **事件驱动更新** - 依赖 Supabase 事件自动同步状态

### 🚀 完整导航流程 (React Navigation 模式)

```
RootNavigator 条件渲染
├─ canAccessMainApp = isAuthenticated && hasPassword
├─ true  → 显示 MainTabs + VideoStack
└─ false → 显示 AuthStack

密码登录流程
Login → signIn 成功
  → navigation.reset([MainTabs])
  → RootNavigator: canAccessMainApp = true
  → 切换到 MainTabs > Feed

验证码登录（新用户）
Login → navigate('VerifyCode', { mode: 'login' })
  → verifyCode 成功 (isAuth=true, hasPwd=false)
  → RootNavigator: canAccessMainApp = false (保持 AuthStack)
  → navigate('PasswordManage', { mode: 'set' })
  → 密码设置成功 (hasPwd=true)
  → navigation.reset([MainTabs])
  → RootNavigator: canAccessMainApp = true
  → 切换到 MainTabs > Feed

验证码登录（老用户）
Login → navigate('VerifyCode', { mode: 'login' })
  → verifyCode 成功 (isAuth=true, hasPwd=true)
  → navigation.reset([MainTabs])
  → RootNavigator: canAccessMainApp = true
  → 切换到 MainTabs > Feed

忘记密码流程
Login → navigate('VerifyCode', { mode: 'forgotPassword' })
  → verifyCode 成功
  → navigate('PasswordManage', { mode: 'reset' })
  → 密码重置成功
  → navigation.reset([MainTabs])
  → 切换到 MainTabs > Feed

退出登录流程
Profile → signOut()
  → navigation.reset([AuthStack])
  → RootNavigator: canAccessMainApp = false
  → 切换到 AuthStack > Login
```

### 🎯 导航方法使用规则

| 导航方法 | 使用场景 | AuthStack 中的实际应用 |
|---------|---------|----------------------|
| **`navigate()`** | 前进导航，保留历史 | ✅ Login → VerifyCode<br>✅ VerifyCode → PasswordManage |
| **`goBack()`** | 返回上一页 | ✅ VerifyCode 返回按钮 → Login<br>✅ PasswordManage 返回按钮 → VerifyCode |
| **`reset()`** | 清空导航栈 | ✅ 密码登录成功 → `reset([MainTabs])`<br>✅ 密码设置/重置成功 → `reset([MainTabs])`<br>✅ 验证码登录成功（老用户）→ `reset([MainTabs])`<br>✅ 退出登录 → `reset([AuthStack])` |

## 🛠️ 使用模式

### 页面跳转参数

```typescript
// 验证码登录 - 使用 navigate
navigation.navigate('VerifyCode', {
  mode: 'login',
  email: 'user@example.com'
});

// 忘记密码 - 使用 navigate
navigation.navigate('VerifyCode', {
  mode: 'forgotPassword',
  email: 'user@example.com'
});

// 密码管理 - 使用 navigate
navigation.navigate('PasswordManage', { mode: 'set' }); // 或 'reset'

// 成功后清空导航栈 - 使用 reset
navigation.dispatch(
  CommonActions.reset({
    index: 0,
    routes: [{ name: 'MainTabs' }],
  })
);
```

### 状态管理 (分离架构)

```typescript
// 获取用户状态 (从 entities/user)
const session = useSession();
const hasPassword = useHasPassword();
const isAuthenticated = useIsAuthenticated();

// 执行认证操作 (从 features/auth)
const {
  signIn, signOut, verifyCode, setPassword,
  isSigningIn, isVerifyingCode, isSettingPassword,
  sendCodeCooldown, isSendCodeCooldownActive
} = useAuthOperations();

// 导航处理
const navigation = useNavigation();

// 密码登录成功后清空导航栈
const handleLogin = async (email: string, password: string) => {
  const success = await signIn(email, password);
  if (success) {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      })
    );
  }
};
```

## 📊 架构优化成果

### ✅ 解决的关键问题

1. **条件渲染不一致** - 修复 RootNavigator 只判断 `isAuthenticated` 的问题，增加 `hasPassword` 判断
2. **导航栈污染** - 在业务完成时清空导航栈，确保干净的导航状态
3. **新用户无法设置密码** - 条件渲染确保 AuthStack 在需要时保持显示
4. **返回键行为** - 使用 `goBack()` 符合用户预期的返回行为
5. **状态同步延迟** - 事件驱动的实时状态更新

### 🎯 核心优势

- **🔄 双重条件渲染** - `isAuthenticated && hasPassword` 确保完整认证流程
- **🛡️ 导航栈管理** - 业务完成时清空，确保下次进入时状态干净
- **📱 用户体验优化** - 正确的前进/返回行为
- **🚀 性能优化** - 避免不必要的页面在内存中驻留
- **🔍 完整可追踪性** - 详细的导航和状态变化日志

## 🔧 日志和调试

所有认证操作都使用 `@/shared/lib/logger` 记录详细信息：

```typescript
// 导航操作日志
log('navigation', LogType.INFO, `认证状态改变: ${isAuthenticated}, 导航栈已重置`);

// 状态变化日志
log('auth', LogType.INFO, `验证码登录成功（新用户），导航到密码设置页面`);

// 业务逻辑日志
log('auth', LogType.INFO, `密码设置成功，清空导航栈并进入主应用`);
```

## 🔐 全局冷却保护系统

### 🛡️ 双层冷却架构

**API层面的全局保护**：
- ✅ **暴力破解防护** - 登录/验证失败自动启动 `verify`(3s) 冷却
- ✅ **验证码滥发防护** - 发送成功后启动 `sendCode`(60s) 冷却
- ✅ **密码操作保护** - 密码设置/重置失败启动 `verify`(3s) 冷却
- ✅ **全局单例管理** - 防止用户通过页面切换绕过冷却

**UI层面的冷却体验**：
```typescript
// 验证码发送按钮自动倒计时
<Button
  disabled={isSendCodeCooldownActive}
  title={sendCodeCooldown > 0 ? `${sendCodeCooldown}s` : '发送验证码'}
  onPress={handleSendCode}
/>

// 冷却错误自动显示为 warning toast (橙色)
if (error.status === 429) {
  toast.show({ type: 'warning', title: '操作过于频繁' });
}
```

## 📦 依赖关系

### 核心依赖
- `@/features/auth` - 认证业务逻辑 (useAuthOperations)
- `@/entities/user` - 用户状态管理 (单一数据源)
- `@/shared/ui` - UI 组件库 (GlassCard, AuthPageLayout)
- `@/shared/lib/logger` - 日志系统

### 外部依赖
- `@react-navigation/native` - 核心导航
- `@react-navigation/stack` - Stack Navigator
- `@react-navigation/bottom-tabs` - Bottom Tab Navigator
- `react-native-paper` - UI 主题系统
- Supabase - 认证服务后端

## 🎯 最佳实践总结

1. **智能导航方法选择** - 前进用 `navigate()`，返回用 `goBack()`，清空用 `reset()`
2. **双重条件渲染** - RootNavigator 检查 `isAuthenticated && hasPassword`
3. **事件驱动状态同步** - 信任 Supabase 事件，避免手动状态管理
4. **分离的架构设计** - 认证操作与用户数据完全分离
5. **完整的日志记录** - 所有关键操作都有详细日志追踪
6. **防重复导航** - 使用 `useRef` 跟踪导航状态，防止重复触发

这个优化后的认证页面系统实现了**完美的 React Navigation 导航架构 + 智能导航栈管理**，确保了认证流程的安全性、性能和用户体验的一致性。
