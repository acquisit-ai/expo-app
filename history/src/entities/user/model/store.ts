/**
 * 纯粹的用户数据存储
 *
 * 只管理数据状态，不包含任何业务逻辑
 * 数据的唯一来源：Supabase 认证事件通过 useSupabaseAuthSync 自动同步
 *
 * 设计原则：
 * - 只有 setter，没有复杂的业务逻辑
 * - 数据派生在 store 内完成，提高性能
 * - 通过选择器 hooks 提供细粒度的状态订阅
 *
 * 性能优化：
 * - 使用 subscribeWithSelector 中间件，只在选择器结果变化时触发重渲染
 * - 开发环境启用 devtools 便于调试
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { isDevelopment } from '@/shared/config/environment';
import type { Session, User } from '@supabase/supabase-js';

/**
 * 纯粹的用户数据状态接口
 */
interface UserState {
  // 原始数据
  session: Session | null;
  user: User | null;

  // 派生数据（为了性能，避免重复计算）
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  hasPassword: boolean;
  provider: string | null;

  // 令牌数据
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;

  // 元数据
  lastSignInAt: string | null;
  createdAt: string | null;

  // 状态时间戳
  lastUpdated: number;

  // 初始化状态 - 用于判断是否已完成认证初始化
  isAuthInitialized: boolean;
}

/**
 * 纯粹的数据操作接口
 * 只有 setter，没有业务逻辑
 */
interface UserActions {
  // 设置完整会话（由 Supabase 事件触发）
  setSession: (session: Session | null) => void;

  // 清除所有数据
  clear: () => void;

  // 获取状态快照（用于调试）
  getSnapshot: () => UserState;
}

type UserStore = UserState & UserActions;

/**
 * 纯粹的数据存储实现
 * 安全策略：
 * - 生产环境禁用 devtools，防止敏感数据暴露
 * - 开发环境启用 devtools，便于调试
 */
const createUserStore = (set: any, get: any): UserStore => ({
  // ========== 初始状态 ==========
  session: null,
  user: null,
  userId: null,
  email: null,
  isAuthenticated: false,
  hasPassword: false,
  provider: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  lastSignInAt: null,
  createdAt: null,
  lastUpdated: 0,
  isAuthInitialized: false,

  // ========== 纯数据操作 ==========

  /**
   * 设置完整的 session 信息
   * 由 useSupabaseAuthSync 调用，解析 session 并更新所有派生状态
   */
  setSession: (session) => {
    const now = Date.now();

    if (!session) {
      // 清空所有状态，但保持 isAuthInitialized=true
      set({
        session: null,
        user: null,
        userId: null,
        email: null,
        isAuthenticated: false,
        hasPassword: false,
        provider: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        lastSignInAt: null,
        createdAt: null,
        lastUpdated: now,
        isAuthInitialized: true,
      });
      return;
    }

    // 解析会话数据，自动计算所有派生状态
    const user = session.user;
    set({
      session,
      user,
      userId: user?.id || null,
      email: user?.email || null,
      isAuthenticated: true,
      hasPassword: user?.user_metadata?.has_password ?? false,
      provider: user?.app_metadata?.provider || null,
      accessToken: session.access_token,
      refreshToken: session.refresh_token || null,
      expiresAt: session.expires_at || null,
      lastSignInAt: user?.last_sign_in_at || null,
      createdAt: user?.created_at || null,
      lastUpdated: now,
      isAuthInitialized: true,
    });
  },

  /**
   * 清除所有数据
   */
  clear: () => {
    get().setSession(null);
  },

  /**
   * 获取状态快照（用于调试）
   */
  getSnapshot: () => {
    const state = get();
    return {
      session: state.session,
      user: state.user,
      userId: state.userId,
      email: state.email,
      isAuthenticated: state.isAuthenticated,
      hasPassword: state.hasPassword,
      provider: state.provider,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      expiresAt: state.expiresAt,
      lastSignInAt: state.lastSignInAt,
      createdAt: state.createdAt,
      lastUpdated: state.lastUpdated,
      isAuthInitialized: state.isAuthInitialized,
    };
  },
});

/**
 * 导出用户数据存储
 * 根据环境决定是否启用 devtools
 * 始终使用 subscribeWithSelector 优化性能
 */
export const useUserStore = create<UserStore>()(
  subscribeWithSelector(
    isDevelopment()
      ? devtools(createUserStore, {
          name: 'user-store', // DevTools 中显示的名称
        })
      : createUserStore
  )
);