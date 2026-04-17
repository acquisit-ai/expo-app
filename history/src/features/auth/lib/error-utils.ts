/**
 * 认证错误处理工具集
 * 
 * 统一管理认证相关的错误处理、分类、友好提示和表单错误处理
 * 支持用户错误与系统错误的智能分级和 react-hook-form 表单错误转换
 */

import { FieldErrors } from 'react-hook-form';
import { toast } from '@/shared/lib/toast';
import { UI_TEXTS, FIELD_LABELS } from './config';

// ================================
// 服务端错误处理
// ================================

/**
 * 根据Supabase错误判断是否为用户错误
 * 用户错误应该使用WARNING级别，系统错误使用ERROR级别
 */
export function isUserError(error: unknown): boolean {
  const message = (error as Error)?.message?.toLowerCase() || '';
  
  // 常见的用户错误模式（基于 Supabase 原始错误消息）
  const userErrorPatterns = [
    'token has expired or is invalid',  // 验证码过期或无效
    'invalid login credentials',         // 登录凭据无效
    'user not found',                   // 用户不存在
    'email not confirmed',              // 邮箱未确认
    'invalid email format',             // 邮箱格式无效
    'email address',                    // 邮箱地址相关错误
    'password is too short',            // 密码太短
    'weak password',                    // 密码太弱
    'password',                         // 密码相关错误（通用匹配）
    'email already registered',         // 邮箱已注册
    'security purposes',                // 安全限制
    'rate limit',                       // 频率限制
    'too many requests',                // 请求过多
    'please wait',                      // 请等待
    'try again later',                  // 稍后重试
    'network request failed',           // 网络请求失败
    'network error',                    // 网络错误
    'connection failed',                // 连接失败
    'session',                          // 会话相关错误
    'timeout',                          // 超时错误
    'unauthorized',                     // 未授权错误
    
    // 以下是中文友好错误消息模式（已注释，配合中文映射使用）
    /*
    '操作失败，请重试',                   // getFriendlyErrorMessage 的默认返回值
    '密码操作失败，请重试',               // 密码相关操作的默认返回值
    '邮箱或密码错误',                     // Invalid login credentials 的友好提示
    '请先验证您的邮箱',                   // Email not confirmed 的友好提示
    '请求过于频繁，请稍后重试',             // Too many requests 的友好提示
    '网络连接异常，请重试',               // 网络相关错误的友好提示
    '新密码不能与当前密码相同',             // 密码相同错误的友好提示
    '密码长度不足，至少需要6位',           // 密码太短错误的友好提示  
    '密码强度不够，请使用更复杂的密码',      // 密码太弱错误的友好提示
    '密码格式不正确',                     // 密码格式错误的友好提示
    */
  ];
  
  return userErrorPatterns.some(pattern => message.includes(pattern));
}

/**
 * 错误处理工具函数 - 直接返回 Supabase 原始错误信息
 * 不做复杂的映射，便于调试和了解具体错误原因
 */
export function getFriendlyErrorMessage(supabaseError: { message: string }): string {
  // 直接返回 Supabase 的原始错误信息
  return supabaseError.message;

  // 以下是中文映射逻辑（已注释，需要时可以启用）
  /*
  const message = supabaseError.message.toLowerCase();
  
  // 登录相关错误
  if (message.includes('invalid login credentials')) {
    return '邮箱或密码错误';
  }
  if (message.includes('email not confirmed')) {
    return '请先验证您的邮箱';
  }
  
  // 密码相关错误
  if (message.includes('password') && message.includes('same')) {
    return '新密码不能与当前密码相同';
  }
  if (message.includes('password is too short')) {
    return '密码长度不足，至少需要6位';
  }
  if (message.includes('weak password')) {
    return '密码强度不够，请使用更复杂的密码';
  }
  if (message.includes('password') && message.includes('invalid')) {
    return '密码格式不正确';
  }
  
  // 频率限制
  if (message.includes('too many requests') || message.includes('rate limit')) {
    return '请求过于频繁，请稍后重试';
  }
  
  // 网络相关错误  
  if (message.includes('network') || message.includes('connection')) {
    return '网络连接异常，请重试';
  }
  
  // 根据上下文返回更合适的默认消息
  if (message.includes('password') || message.includes('update')) {
    return '密码操作失败，请重试';
  }
  
  return '操作失败，请重试';
  */
}

/**
 * 获取认证错误信息（综合函数）
 * 同时返回友好提示和错误分类
 */
export function getAuthErrorInfo(supabaseError: { message: string }) {
  return {
    message: getFriendlyErrorMessage(supabaseError),
    isUserError: isUserError(supabaseError)
  };
}

// ================================
// 客户端表单错误处理
// ================================

/**
 * 表单验证错误 Toast 处理工具
 * 将 react-hook-form 的字段错误转换为统一的 toast 提示
 */

/**
 * 显示表单字段验证错误的 Hook
 * @example
 * ```typescript
 * const { showFieldErrors } = useFormErrorToast();
 * 
 * const onSubmit = (data: FormData) => {
 *   if (form.formState.errors) {
 *     showFieldErrors(form.formState.errors);
 *     return;
 *   }
 *   // 处理提交逻辑
 * };
 * ```
 */
export const useFormErrorToast = () => {

  /**
   * 显示表单字段验证错误
   * @param errors react-hook-form 的错误对象
   */
  const showFieldErrors = (errors: FieldErrors) => {
    // 遍历所有错误字段，为每个错误显示独立的toast
    Object.keys(errors).forEach((fieldKey) => {
      const fieldError = errors[fieldKey];
      const errorMessage = fieldError?.message;

      if (errorMessage) {
        const fieldDisplayName = FIELD_LABELS[fieldKey as keyof typeof FIELD_LABELS] || fieldKey;
        
        toast.show({
          title: UI_TEXTS.validation.inputError,
          message: `${fieldDisplayName}: ${errorMessage}`,
          duration: 4000,
          type: 'error'
        });
      }
    });
  };

  return {
    showFieldErrors,
  };
};

