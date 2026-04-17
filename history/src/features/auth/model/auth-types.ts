/**
 * 认证系统类型定义
 * 
 * 包含认证状态、错误类型、上下文接口等核心类型定义
 * 为整个认证系统提供类型安全保障
 */

import { Session, User } from '@supabase/supabase-js';

/**
 * 认证状态机枚举 - 简化状态管理
 */
export type AuthStatus = 
  | 'initializing'   // 应用启动时的认证状态检查
  | 'unauthenticated' // 未登录
  | 'authenticated'   // 已登录
  | 'verifying';      // 认证验证进行中

/**
 * 统一的认证状态机结构 - 专注认证流程状态
 */
export interface AuthState {
  status: AuthStatus;
  isSendingCode: boolean;
  sendCodeCooldown: number; // 发送验证码冷却倒计时（秒）
}


/**
 * 认证上下文类型 - 专注认证操作
 */
export interface AuthContextType {
  // 基础认证状态
  status: AuthStatus;

  // 核心派生状态
  isInitializing: boolean;
  isVerifying: boolean;
  isSendingCode: boolean;
  sendCodeCooldown: number;

  // 便民布尔字段
  isSendCodeCooldownActive: boolean;

  // 认证操作方法
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: (silent?: boolean) => Promise<boolean>;
  sendCode: (email: string, mode: 'login' | 'forgotPassword') => Promise<boolean>;
  verifyCode: (email: string, code: string, mode: 'login' | 'forgotPassword') => Promise<boolean>;
  setPassword: (newPassword: string, mode?: 'set' | 'reset') => Promise<boolean>;
  startCooldown: (type: 'sendCode' | 'verify') => void;
  clearCooldown: (type: 'sendCode' | 'verify') => void;
}

/**
 * AuthProvider组件Props类型
 */
export interface AuthProviderProps {
  children: React.ReactNode;
}