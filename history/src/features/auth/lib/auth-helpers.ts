/**
 * 认证辅助函数库
 * 
 * 提供认证相关的纯函数工具，包括参数验证、消息生成等
 * 纯函数，无副作用，易于测试和复用
 */

import { maskEmail } from '@/shared/lib/private-data-masking';
import { AuthConfig } from './config';

/**
 * 认证模式类型
 */
export type AuthMode = 'login' | 'forgotPassword';

/**
 * 操作模式类型
 */
export type PasswordMode = 'set' | 'reset';

/**
 * 认证辅助函数集合
 */
export class AuthHelpers {

  /**
   * 获取操作名称
   * @param mode 认证模式
   * @param isLogin 是否为登录操作
   * @returns 操作名称
   */
  static getOperationName(mode: AuthMode, isLogin: boolean): string {
    if (isLogin) {
      return mode === 'login' 
        ? AuthConfig.operationNames.LOGIN_VERIFICATION
        : AuthConfig.operationNames.RESET_VERIFICATION;
    }
    return mode === 'login' 
      ? AuthConfig.operationNames.SEND_OTP
      : AuthConfig.operationNames.SEND_RESET_EMAIL;
  }

  /**
   * 获取发送操作的描述文本
   * @param mode 认证模式
   * @returns 操作描述
   */
  static getSendOperationDescription(mode: AuthMode): string {
    return mode === 'login' ? 'OTP' : '密码重置邮件';
  }

  /**
   * 获取验证操作的描述文本
   * @param mode 认证模式
   * @returns 操作描述
   */
  static getVerifyOperationDescription(mode: AuthMode): string {
    return mode === 'login' ? '登录验证' : '重置密码验证';
  }

  /**
   * 获取密码操作的描述文本
   * @param mode 密码模式
   * @returns 操作描述
   */
  static getPasswordOperationDescription(mode: PasswordMode): string {
    return mode === 'set' ? '设置' : '重置';
  }

  /**
   * 生成冷却错误消息
   * @param type 冷却类型
   * @param remainingTime 剩余时间（秒）
   * @returns 错误消息
   */
  static getCooldownErrorMessage(type: 'sendCode' | 'verify', remainingTime: number): string {
    const isSendCode = type === 'sendCode';
    return isSendCode 
      ? `发送过于频繁，请等待 ${remainingTime} 秒后重新发送`
      : `操作过于频繁，请等待 ${remainingTime} 秒后重试`;
  }

  /**
   * 生成冷却提示消息
   * @param type 冷却类型
   * @param remainingTime 剩余时间（秒）
   * @returns 提示消息对象
   */
  static getCooldownToastMessage(type: 'sendCode' | 'verify', remainingTime: number): {
    title: string;
    message: string;
  } {
    const isSendCode = type === 'sendCode';
    return {
      title: isSendCode 
        ? AuthConfig.toastTitles.SEND_TOO_FREQUENT
        : AuthConfig.toastTitles.OPERATION_TOO_FREQUENT,
      message: isSendCode 
        ? AuthConfig.toastMessages.WAIT_SECONDS_TO_RESEND(remainingTime)
        : AuthConfig.toastMessages.WAIT_SECONDS_TO_RETRY(remainingTime)
    };
  }

  /**
   * 生成发送成功的Toast消息
   * @param mode 认证模式
   * @returns Toast消息对象
   */
  static getSendSuccessToastMessage(mode: AuthMode): {
    title: string;
    message: string;
  } {
    return {
      title: mode === 'login' 
        ? AuthConfig.toastTitles.CODE_SENT
        : AuthConfig.toastTitles.RESET_EMAIL_SENT,
      message: mode === 'login' 
        ? AuthConfig.toastMessages.CHECK_EMAIL_AND_ENTER_CODE
        : AuthConfig.toastMessages.RESET_EMAIL_SENT_INFO
    };
  }

  /**
   * 生成发送失败的Toast消息
   * @param mode 认证模式
   * @param errorMessage 错误消息
   * @returns Toast消息对象
   */
  static getSendErrorToastMessage(mode: AuthMode, errorMessage: string): {
    title: string;
    message: string;
  } {
    return {
      title: mode === 'login' 
        ? AuthConfig.toastTitles.SEND_CODE_FAILED
        : AuthConfig.toastTitles.SEND_RESET_EMAIL_FAILED,
      message: errorMessage || '请稍后重试'
    };
  }

  /**
   * 生成验证失败的Toast消息
   * @param mode 认证模式
   * @param errorMessage 错误消息
   * @returns Toast消息对象
   */
  static getVerifyErrorToastMessage(mode: AuthMode, errorMessage: string): {
    title: string;
    message: string;
  } {
    return {
      title: mode === 'login' 
        ? AuthConfig.toastTitles.VERIFY_LOGIN_FAILED
        : AuthConfig.toastTitles.VERIFY_RESET_FAILED,
      message: errorMessage || AuthConfig.toastMessages.CODE_INVALID_OR_EXPIRED
    };
  }

  /**
   * 生成密码设置成功的Toast消息
   * @param mode 密码模式
   * @returns Toast消息对象
   */
  static getPasswordSuccessToastMessage(mode: PasswordMode): {
    title: string;
    message: string;
  } {
    return {
      title: mode === 'set' 
        ? AuthConfig.toastTitles.PASSWORD_SET_SUCCESS
        : AuthConfig.toastTitles.PASSWORD_RESET_SUCCESS,
      message: mode === 'set' 
        ? AuthConfig.toastMessages.PASSWORD_SET_SUCCESS_REDIRECT
        : AuthConfig.toastMessages.PASSWORD_RESET_SUCCESS_REDIRECT
    };
  }

  /**
   * 生成密码设置失败的Toast消息
   * @param mode 密码模式
   * @param errorMessage 错误消息
   * @returns Toast消息对象
   */
  static getPasswordErrorToastMessage(mode: PasswordMode, errorMessage: string): {
    title: string;
    message: string;
  } {
    return {
      title: mode === 'set' 
        ? AuthConfig.toastTitles.SET_PASSWORD_FAILED
        : AuthConfig.toastTitles.RESET_PASSWORD_FAILED,
      message: errorMessage
    };
  }

  /**
   * 生成日志消息
   * @param operation 操作描述
   * @param email 邮箱地址（可选）
   * @param additionalInfo 额外信息（可选）
   * @returns 格式化的日志消息
   */
  static formatLogMessage(operation: string, email?: string, additionalInfo?: string): string {
    let message = `AuthOperations: ${operation}`;
    
    if (email) {
      message += ` - 邮箱: ${maskEmail(email)}`;
    }
    
    if (additionalInfo) {
      message += ` - ${additionalInfo}`;
    }
    
    return message;
  }

  /**
   * 检查是否为静默操作
   * @param silent 静默标志
   * @returns 静默操作描述
   */
  static getSilentOperationDescription(silent: boolean): {
    startMessage: string;
    apiMessage: string;
    errorPrefix: string;
    endMessage: string;
  } {
    return silent 
      ? {
          startMessage: '清除无效会话状态（hasPassword检查失败）',
          apiMessage: '调用 Supabase API 清除远程会话',
          errorPrefix: '清除远程会话失败',
          endMessage: '会话清除流程结束'
        }
      : {
          startMessage: '开始真实退出登录',
          apiMessage: '调用 Supabase 退出登录 API',
          errorPrefix: 'Supabase API 退出失败',
          endMessage: '退出登录流程结束'
        };
  }
}