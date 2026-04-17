/**
 * 纯粹的认证业务逻辑 Hook
 *
 * 职责：
 * - 执行认证相关的业务逻辑
 * - 管理认证操作的 UI 状态
 * - 提供冷却保护机制
 * - 处理错误和用户反馈
 *
 * 不包含：
 * - 用户数据管理（由 entities/user 负责）
 * - API 调用实现（委托给 AuthAPI）
 * - 表单验证（由组件层负责）
 * - 路由导航（由组件层负责）
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { AuthAPI } from '../api/auth-api';
import { toast } from '@/shared/lib/toast';
import { log, LogType } from '@/shared/lib/logger';
import { GlobalCooldownManager } from '@/shared/lib/authen-global-cooldown';

// ============ 类型定义 ============

/**
 * 认证操作的 UI 状态
 * 与 entities/user 的数据状态完全分离
 */
interface AuthOperationState {
  isSigningIn: boolean;
  isSigningOut: boolean;
  isSendingCode: boolean;
  isVerifyingCode: boolean;
  isSettingPassword: boolean;

  // 冷却状态 (只有 sendCode 需要 UI 显示)
  sendCodeCooldown: number;
}

/**
 * 认证模式类型
 */
type AuthMode = 'login' | 'forgotPassword';
type PasswordMode = 'set' | 'reset';


// ============ 主要 Hook ============

/**
 * 认证业务逻辑 Hook
 *
 * 设计原则：
 * - 只处理业务逻辑，不管理用户数据
 * - 所有操作通过 Supabase API 执行
 * - Supabase 事件会自动更新 entities/user
 * - 组件从 entities/user 获取数据状态
 */
export const useAuthOperations = () => {
  // ========== 全局冷却管理器 ==========
  const cooldownManager = useMemo(() => GlobalCooldownManager.getInstance(), []);

  // ========== 本地 UI 状态 ==========
  const [state, setState] = useState<AuthOperationState>(() => ({
    isSigningIn: false,
    isSigningOut: false,
    isSendingCode: false,
    isVerifyingCode: false,
    isSettingPassword: false,
    // ✅ 初始化时立即获取 sendCode 冷却状态
    sendCodeCooldown: cooldownManager.getRemainingTime('sendCode'),
  }));

  // ========== 冷却时间更新 ==========
  const updateCooldowns = useCallback(() => {
    setState(prev => ({
      ...prev,
      sendCodeCooldown: cooldownManager.getRemainingTime('sendCode'),
    }));
  }, [cooldownManager]);

  // 组件挂载时立即同步冷却状态，然后定时更新
  useEffect(() => {
    // ✅ 立即执行一次，确保状态同步
    updateCooldowns();

    // ✅ 然后启动定时器
    const interval = setInterval(updateCooldowns, 1000);
    return () => clearInterval(interval);
  }, [updateCooldowns]);

  // ========== 认证操作方法 ==========

  /**
   * 邮箱密码登录
   */
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (state.isSigningIn) {
      log('auth-ops', LogType.WARNING, '登录操作已在进行中，忽略重复请求');
      return false;
    }

    log('auth-ops', LogType.INFO, `🔐 开始登录流程 - 邮箱: ${email}`);
    setState(prev => ({ ...prev, isSigningIn: true }));

    try {
      const { data, error } = await AuthAPI.signInWithPassword(email, password);

      if (error) {
        log('auth-ops', LogType.WARNING, `❌ 登录失败 - ${error.message}`);

        // ✅ 区分冷却错误和其他错误
        const isRateLimitError = error.status === 429;
        const friendlyMessage = error.message === 'invalid_credentials'
          ? '邮箱或密码错误，请检查后重试'
          : error.message;

        toast.show({
          type: isRateLimitError ? 'warning' : 'error',
          title: isRateLimitError ? '操作过于频繁' : '登录失败',
          message: friendlyMessage
        });
        return false;
      }

      log('auth-ops', LogType.INFO, '✅ 登录成功');
      toast.show({
        type: 'success',
        title: '登录成功',
        message: '欢迎回来！'
      });

      // ✅ Supabase 认证事件会自动更新 entities/user
      // ✅ 组件可以通过监听 entities/user 状态变化来响应登录成功
      return true;
    } catch (error) {
      log('auth-ops', LogType.ERROR, `💥 登录异常 - ${error}`);
      toast.show({
        type: 'error',
        title: '登录失败',
        message: '网络连接异常，请检查网络后重试'
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isSigningIn: false }));
    }
  }, [state.isSigningIn]);

  /**
   * 发送验证码
   */
  const sendCode = useCallback(async (email: string, mode: AuthMode = 'login'): Promise<boolean> => {
    if (state.isSendingCode) {
      log('auth-ops', LogType.WARNING, '发送验证码操作已在进行中，忽略重复请求');
      return false;
    }

    if (cooldownManager.isInCooldown('sendCode')) {
      const remaining = cooldownManager.getRemainingTime('sendCode');
      toast.show({
        type: 'warning',
        title: '操作过于频繁',
        message: `请等待 ${remaining} 秒后重试`
      });
      return false;
    }

    const operationName = mode === 'login' ? '登录验证码' : '重置密码验证码';
    log('auth-ops', LogType.INFO, `📧 开始发送${operationName} - 邮箱: ${email}`);
    setState(prev => ({ ...prev, isSendingCode: true }));

    try {
      const { error } = mode === 'login'
        ? await AuthAPI.sendLoginOTP(email)
        : await AuthAPI.sendPasswordResetEmail(email);

      if (error) {
        log('auth-ops', LogType.WARNING, `❌ 发送${operationName}失败 - ${error.message}`);

        // ✅ 区分冷却错误和其他错误
        const isRateLimitError = error.status === 429;
        toast.show({
          type: isRateLimitError ? 'warning' : 'error',
          title: isRateLimitError ? '操作过于频繁' : '发送失败',
          message: error.message
        });
        return false;
      }

      // ✅ 冷却由 API 层统一管理，这里只需要更新 UI 状态
      updateCooldowns();

      log('auth-ops', LogType.INFO, `✅ 发送${operationName}成功`);
      toast.show({
        type: 'success',
        title: '验证码已发送',
        message: '请检查邮箱并输入6位验证码'
      });

      return true;
    } catch (error) {
      log('auth-ops', LogType.ERROR, `💥 发送${operationName}异常 - ${error}`);
      toast.show({
        type: 'error',
        title: '发送失败',
        message: '网络连接异常，请检查网络后重试'
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isSendingCode: false }));
    }
  }, [state.isSendingCode, cooldownManager, updateCooldowns]);

  /**
   * 验证码验证
   */
  const verifyCode = useCallback(async (email: string, code: string, mode: AuthMode = 'login'): Promise<boolean> => {
    if (state.isVerifyingCode) {
      log('auth-ops', LogType.WARNING, '验证码验证操作已在进行中，忽略重复请求');
      return false;
    }

    if (cooldownManager.isInCooldown('verify')) {
      const remaining = cooldownManager.getRemainingTime('verify');
      toast.show({
        type: 'warning',
        title: '操作过于频繁',
        message: `请等待 ${remaining} 秒后重试`
      });
      return false;
    }

    const operationName = mode === 'login' ? '登录验证' : '重置密码验证';
    log('auth-ops', LogType.INFO, `🔍 开始${operationName} - 邮箱: ${email}`);
    setState(prev => ({ ...prev, isVerifyingCode: true }));

    try {
      const { data, error } = await AuthAPI.verifyOTP(email, code);

      if (error) {
        // ✅ 冷却由 API 层统一管理，这里只需要更新 UI 状态
        updateCooldowns();

        log('auth-ops', LogType.WARNING, `❌ ${operationName}失败 - ${error.message}`);

        // ✅ 区分冷却错误和其他错误
        const isRateLimitError = error.status === 429;
        const friendlyMessage = error.message === 'invalid_otp'
          ? '验证码错误，请检查后重试'
          : error.message;

        toast.show({
          type: isRateLimitError ? 'warning' : 'error',
          title: isRateLimitError ? '操作过于频繁' : '验证失败',
          message: friendlyMessage
        });
        return false;
      }

      log('auth-ops', LogType.INFO, `✅ ${operationName}成功`);

      // ✅ Supabase 认证事件会自动更新 entities/user
      return true;
    } catch (error) {
      log('auth-ops', LogType.ERROR, `💥 ${operationName}异常 - ${error}`);
      toast.show({
        type: 'error',
        title: '验证失败',
        message: '网络连接异常，请检查网络后重试'
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isVerifyingCode: false }));
    }
  }, [state.isVerifyingCode, cooldownManager, updateCooldowns]);

  /**
   * 设置/重置密码
   */
  const setPassword = useCallback(async (password: string, mode: PasswordMode = 'set'): Promise<boolean> => {
    if (state.isSettingPassword) {
      log('auth-ops', LogType.WARNING, '设置密码操作已在进行中，忽略重复请求');
      return false;
    }

    const operationName = mode === 'set' ? '设置密码' : '重置密码';
    log('auth-ops', LogType.INFO, `🔑 开始${operationName}`);
    setState(prev => ({ ...prev, isSettingPassword: true }));

    try {
      const { data, error } = await AuthAPI.updatePassword(password);

      if (error) {
        log('auth-ops', LogType.WARNING, `❌ ${operationName}失败 - ${error.message}`);

        // ✅ 区分冷却错误和其他错误
        const isRateLimitError = error.status === 429;
        toast.show({
          type: isRateLimitError ? 'warning' : 'error',
          title: isRateLimitError ? '操作过于频繁' : `${operationName}失败`,
          message: error.message
        });
        return false;
      }

      log('auth-ops', LogType.INFO, `✅ ${operationName}成功`);
      toast.show({
        type: 'success',
        title: `${operationName}成功`,
        message: '密码已更新，请妥善保管'
      });

      // ✅ Supabase 认证事件会自动更新 entities/user 中的用户信息
      return true;
    } catch (error) {
      log('auth-ops', LogType.ERROR, `💥 ${operationName}异常 - ${error}`);
      toast.show({
        type: 'error',
        title: `${operationName}失败`,
        message: '网络连接异常，请检查网络后重试'
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isSettingPassword: false }));
    }
  }, [state.isSettingPassword]);

  /**
   * 登出
   */
  const signOut = useCallback(async (silent = false): Promise<boolean> => {
    if (state.isSigningOut) {
      log('auth-ops', LogType.WARNING, '登出操作已在进行中，忽略重复请求');
      return false;
    }

    log('auth-ops', LogType.INFO, `🚪 开始登出 - 静默模式: ${silent}`);
    setState(prev => ({ ...prev, isSigningOut: true }));

    try {
      const { error } = await AuthAPI.signOut();

      if (error && !silent) {
        log('auth-ops', LogType.WARNING, `❌ 登出失败 - ${error.message}`);
        toast.show({
          type: 'error',
          title: '登出失败',
          message: error.message
        });
        return false;
      }

      log('auth-ops', LogType.INFO, '✅ 登出成功');
      if (!silent) {
        toast.show({
          type: 'success',
          title: '已登出',
          message: '再见！期待您的再次到来'
        });
      }

      // ✅ Supabase 认证事件会自动清除 entities/user
      return true;
    } catch (error) {
      log('auth-ops', LogType.ERROR, `💥 登出异常 - ${error}`);
      if (!silent) {
        toast.show({
          type: 'error',
          title: '登出失败',
          message: '网络连接异常'
        });
      }
      return false;
    } finally {
      setState(prev => ({ ...prev, isSigningOut: false }));
    }
  }, [state.isSigningOut]);

  // ========== 返回接口 ==========
  return {
    // 操作状态
    isSigningIn: state.isSigningIn,
    isSigningOut: state.isSigningOut,
    isSendingCode: state.isSendingCode,
    isVerifyingCode: state.isVerifyingCode,
    isSettingPassword: state.isSettingPassword,

    // 冷却状态 (只有 sendCode 需要 UI 显示)
    sendCodeCooldown: state.sendCodeCooldown,
    isSendCodeCooldownActive: state.sendCodeCooldown > 0,

    // 操作方法
    signIn,
    signOut,
    sendCode,
    verifyCode,
    setPassword,
  };
};