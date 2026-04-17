/**
 * 纯粹的数据选择器 hooks
 *
 * 只从 UserStore 中选择数据，不包含任何业务逻辑
 * 提供细粒度的状态订阅，优化渲染性能
 */

import { useUserStore } from '../model/store';

// ============ 基础数据选择器 ============

/**
 * 获取完整的 Supabase session 对象
 */
export const useSession = () => useUserStore(state => state.session);

/**
 * 获取用户对象
 */
export const useUser = () => useUserStore(state => state.user);

/**
 * 获取用户 ID
 */
export const useUserId = () => useUserStore(state => state.userId);

/**
 * 获取用户邮箱
 */
export const useUserEmail = () => useUserStore(state => state.email);

// ============ 认证状态选择器 ============

/**
 * 获取认证状态
 */
export const useIsAuthenticated = () => useUserStore(state => state.isAuthenticated);

/**
 * 获取是否已设置密码
 */
export const useHasPassword = () => useUserStore(state => state.hasPassword);

/**
 * 获取认证提供商 (email/google/github等)
 */
export const useAuthProvider = () => useUserStore(state => state.provider);

/**
 * 获取认证初始化状态
 * 用于判断 getSession() 是否已完成（无论成功或失败）
 */
export const useIsAuthInitialized = () => useUserStore(state => state.isAuthInitialized);

// ============ 令牌选择器 ============

/**
 * 获取访问令牌
 */
export const useAccessToken = () => useUserStore(state => state.accessToken);

/**
 * 获取刷新令牌
 */
export const useRefreshToken = () => useUserStore(state => state.refreshToken);

/**
 * 获取令牌过期时间 (Unix 时间戳)
 */
export const useTokenExpiry = () => useUserStore(state => state.expiresAt);

// ============ 元数据选择器 ============

/**
 * 获取最后登录时间
 */
export const useLastSignInAt = () => useUserStore(state => state.lastSignInAt);

/**
 * 获取用户创建时间
 */
export const useUserCreatedAt = () => useUserStore(state => state.createdAt);

/**
 * 获取数据最后更新时间
 */
export const useLastUpdated = () => useUserStore(state => state.lastUpdated);

// ============ 组合选择器 (避免多次渲染) ============

/**
 * 获取认证状态概览
 */
export const useAuthStatus = () => useUserStore(state => ({
  isAuthenticated: state.isAuthenticated,
  hasPassword: state.hasPassword,
  provider: state.provider,
}));

/**
 * 获取用户基本信息
 */
export const useUserProfile = () => useUserStore(state => ({
  userId: state.userId,
  email: state.email,
  lastSignInAt: state.lastSignInAt,
  createdAt: state.createdAt,
}));

/**
 * 获取令牌信息
 */
export const useTokenInfo = () => useUserStore(state => ({
  accessToken: state.accessToken,
  refreshToken: state.refreshToken,
  expiresAt: state.expiresAt,
}));

/**
 * 获取完整的用户状态快照 (仅用于调试)
 */
export const useUserSnapshot = () => useUserStore(state => state.getSnapshot());