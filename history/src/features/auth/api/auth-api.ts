/**
 * 认证API调用封装层
 *
 * 封装所有与Supabase认证相关的API调用，提供统一的接口
 * 包含 API 层面的冷却验证，提供双重安全保护
 */

import { supabase } from './supabase';
import type { AuthResponse, AuthError } from '@supabase/supabase-js';
import { normalizeEmail, normalizeCode, normalizePassword } from '../model/validation';
import { GlobalCooldownManager } from '@/shared/lib/authen-global-cooldown';

/**
 * API响应类型
 */
export interface AuthAPIResponse<T = any> {
  data: T | null;
  error: AuthError | null;
}

/**
 * 认证API封装类
 * 提供所有认证相关的API调用方法
 */
export class AuthAPI {
  /**
   * 邮箱+密码登录
   * 包含 API 层面的冷却验证，防止暴力破解
   * @param email 邮箱地址
   * @param password 密码
   * @returns Supabase认证响应
   */
  static async signInWithPassword(
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const normalizedEmail = normalizeEmail(email);
    const cooldown = GlobalCooldownManager.getInstance();

    // ✅ 使用 verify 冷却键，防止暴力破解密码
    if (cooldown.isInCooldown('verify')) {
      const remaining = cooldown.getRemainingTime('verify');
      return {
        data: { user: null, session: null },
        error: {
          message: `登录操作过于频繁，请等待 ${remaining} 秒后重试`,
          status: 429,
        } as AuthError
      };
    }

    const result = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizePassword(password),
    });

    // ✅ 登录失败时启动短暂冷却，防止暴力破解
    if (result.error) {
      cooldown.startCooldown('verify');
    }

    return result;
  }

  /**
   * 发送登录验证码 (OTP)
   * 使用全局统一的 sendCode 冷却键
   * @param email 邮箱地址
   * @returns Supabase API响应
   */
  static async sendLoginOTP(email: string): Promise<AuthAPIResponse> {
    const normalizedEmail = normalizeEmail(email);
    const cooldown = GlobalCooldownManager.getInstance();

    // ✅ 使用与 UI 层相同的冷却键
    if (cooldown.isInCooldown('sendCode')) {
      const remaining = cooldown.getRemainingTime('sendCode');
      return {
        data: null,
        error: {
          message: `操作过于频繁，请等待 ${remaining} 秒后重试`,
          status: 429,
        } as AuthError
      };
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true, // 允许为新用户创建账户
        emailRedirectTo: undefined, // 避免重定向问题
      }
    });

    // ✅ 成功后启动全局 sendCode 冷却（自动使用配置的60秒）
    if (!error) {
      cooldown.startCooldown('sendCode');
    }

    return { data, error };
  }

  /**
   * 发送密码重置邮件
   * 使用全局统一的 sendCode 冷却键
   * @param email 邮箱地址
   * @returns Supabase API响应
   */
  static async sendPasswordResetEmail(email: string): Promise<AuthAPIResponse> {
    const normalizedEmail = normalizeEmail(email);
    const cooldown = GlobalCooldownManager.getInstance();

    // ✅ 使用与 UI 层相同的冷却键
    if (cooldown.isInCooldown('sendCode')) {
      const remaining = cooldown.getRemainingTime('sendCode');
      return {
        data: null,
        error: {
          message: `操作过于频繁，请等待 ${remaining} 秒后重试`,
          status: 429,
        } as AuthError
      };
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail
      // 不需要 redirectTo 参数，移动应用通过应用内流程处理重置
    );

    // ✅ 成功后启动全局 sendCode 冷却（自动使用配置的60秒）
    if (!error) {
      cooldown.startCooldown('sendCode');
    }

    return { data, error };
  }

  /**
   * 验证OTP验证码
   * 包含 API 层面的冷却验证，防止暴力破解
   * @param email 邮箱地址
   * @param code 验证码
   * @returns Supabase验证响应
   */
  static async verifyOTP(
    email: string,
    code: string
  ): Promise<AuthResponse> {
    const normalizedEmail = normalizeEmail(email);
    const cooldown = GlobalCooldownManager.getInstance();

    // ✅ 使用与 UI 层相同的 verify 冷却键
    if (cooldown.isInCooldown('verify')) {
      const remaining = cooldown.getRemainingTime('verify');
      return {
        data: { user: null, session: null },
        error: {
          message: `验证操作过于频繁，请等待 ${remaining} 秒后重试`,
          status: 429,
        } as AuthError
      };
    }

    const result = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizeCode(code),
      type: 'email' // 统一使用 email 类型
    });

    // ✅ 验证失败时启动短暂冷却，防止暴力破解（自动使用配置的3秒）
    if (result.error) {
      cooldown.startCooldown('verify');
    }

    return result;
  }

  /**
   * 更新用户密码
   * 包含 API 层面的冷却验证，防止频繁操作
   * @param newPassword 新密码
   * @returns Supabase用户更新响应
   */
  static async updatePassword(newPassword: string): Promise<AuthAPIResponse> {
    const cooldown = GlobalCooldownManager.getInstance();

    // ✅ 使用 verify 冷却键，防止频繁密码操作
    if (cooldown.isInCooldown('verify')) {
      const remaining = cooldown.getRemainingTime('verify');
      return {
        data: null,
        error: {
          message: `密码操作过于频繁，请等待 ${remaining} 秒后重试`,
          status: 429,
        } as AuthError
      };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: normalizePassword(newPassword),
      data: { has_password: true }  // 手动维护密码状态标志
    });

    // ✅ 密码更新失败时启动短暂冷却
    if (error) {
      cooldown.startCooldown('verify');
    }

    return { data, error };
  }

  /**
   * 退出登录
   * @returns Supabase API响应
   */
  static async signOut(): Promise<AuthAPIResponse> {
    const { error } = await supabase.auth.signOut();
    return { data: null, error };
  }

  /**
   * 获取当前会话
   * @returns 当前会话信息
   */
  static async getSession() {
    return await supabase.auth.getSession();
  }

  /**
   * 获取当前用户
   * @returns 当前用户信息
   */
  static async getUser() {
    return await supabase.auth.getUser();
  }

  /**
   * 刷新会话
   * @returns 刷新后的会话信息
   */
  static async refreshSession() {
    return await supabase.auth.refreshSession();
  }
}

/**
 * 导出单个API方法，便于按需导入
 */
export const {
  signInWithPassword,
  sendLoginOTP,
  sendPasswordResetEmail,
  verifyOTP,
  updatePassword,
  signOut,
  getSession,
  getUser,
  refreshSession,
} = AuthAPI;