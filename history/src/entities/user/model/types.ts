/**
 * User Entity 类型定义
 * 
 * 定义用户会话状态和相关操作的类型
 * 注意：Supabase SDK 已经处理了 session 持久化，
 * 这里的 store 仅作为内存缓存使用
 */

import type { Session, User } from '@supabase/supabase-js';

/**
 * 用户会话状态
 * 包含从 Supabase session 解析出的所有用户信息
 */
export interface UserSessionState {
  // 核心 Session 数据
  session: Session | null;
  
  // 派生的用户信息（便于快速访问）
  user: User | null;
  userId: string | null;
  email: string | null;
  phone: string | null;
  
  // 认证状态
  isAuthenticated: boolean;
  hasPassword: boolean;
  
  // 元数据
  provider: string | null;        // 登录提供商 (email/google/github等)
  lastSignInAt: string | null;
  createdAt: string | null;
  
  // 令牌管理
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;  // Unix 时间戳（秒）
  
  // 状态标记
  isSessionExpired: boolean;
  isRefreshing: boolean;
  
  // 时间戳
  sessionUpdatedAt: number | null; // 最后更新时间（毫秒）
}

/**
 * Store Actions
 * 用户实体的所有操作方法
 */
export interface UserStoreActions {
  // Session 管理
  setSession: (session: Session | null) => void;
  updateSession: (updates: Partial<Session>) => void;
  clearSession: () => void;

  // User 信息更新
  updateUserMetadata: (metadata: Record<string, any>) => Promise<void>;

  // 令牌管理
  refreshSession: () => Promise<void>;
  isTokenValid: () => boolean;
  getTimeUntilExpiry: () => number | null; // 返回剩余秒数

  // 辅助方法
  getSessionSnapshot: () => UserSessionState;
  syncWithSupabase: () => Promise<void>; // 从 Supabase 同步最新 session
}

/**
 * 完整的 User Store 类型
 */
export type UserStore = UserSessionState & UserStoreActions;

/**
 * 用户元数据类型
 */
export interface UserMetadata {
  has_password?: boolean;
  avatar_url?: string;
  full_name?: string;
  username?: string;
  [key: string]: any;
}

/**
 * 应用元数据类型
 */
export interface AppMetadata {
  provider?: string;
  providers?: string[];
  [key: string]: any;
}