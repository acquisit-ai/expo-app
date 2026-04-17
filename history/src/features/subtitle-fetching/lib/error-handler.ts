/**
 * 字幕数据源错误处理器
 *
 * 统一处理数据获取过程中的各种错误
 * 使用统一的 ApiError (@/shared/lib/http-client)
 */

import { log, LogType } from '@/shared/lib/logger';
import { ApiError } from '@/shared/lib/http-client';

/**
 * 用户友好的错误信息
 */
export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  canRetry: boolean;
}

/**
 * 错误处理器类
 */
export class SubtitleErrorHandler {
  /**
   * 将技术错误转换为用户友好的错误信息
   */
  static toUserFriendlyError(error: any): UserFriendlyError {
    if (error instanceof ApiError) {
      return this.handleApiError(error);
    }

    // 解析错误
    if (error.name === 'SubtitleParseError') {
      return {
        title: '字幕格式错误',
        message: '字幕数据格式不正确，请稍后重试',
        action: '重新加载',
        canRetry: true
      };
    }

    // 默认错误
    return {
      title: '加载失败',
      message: '字幕加载失败，请检查网络连接后重试',
      action: '重试',
      canRetry: true
    };
  }

  /**
   * 处理 API 错误
   */
  private static handleApiError(error: ApiError): UserFriendlyError {
    // 根据错误类型判断
    if (error.isNetworkError()) {
      return {
        title: '网络连接错误',
        message: '无法连接到服务器，请检查网络连接',
        action: '重试',
        canRetry: true
      };
    }

    // 超时错误
    if (error.code === 'TIMEOUT_ERROR') {
      return {
        title: '请求超时',
        message: '服务器响应超时，请稍后重试',
        action: '重试',
        canRetry: true
      };
    }

    // 404 - 字幕不存在
    if (error.status === 404) {
      return {
        title: '字幕不存在',
        message: '该视频暂无字幕，或字幕正在生成中',
        action: '稍后重试',
        canRetry: true
      };
    }

    // 认证错误
    if (error.isAuthError()) {
      return {
        title: '访问被拒绝',
        message: '没有权限访问该字幕，请重新登录',
        action: '重新登录',
        canRetry: false
      };
    }

    // 服务器错误
    if (error.isServerError()) {
      return {
        title: '服务器错误',
        message: '服务器暂时不可用，请稍后重试',
        action: '重试',
        canRetry: true
      };
    }

    // 解析错误
    if (error.code === 'PARSE_ERROR') {
      return {
        title: '数据解析错误',
        message: '字幕数据格式异常，请稍后重试',
        action: '重试',
        canRetry: true
      };
    }

    // 默认错误
    return {
      title: '未知错误',
      message: error.message || '发生了未知错误，请稍后重试',
      action: '重试',
      canRetry: true
    };
  }

  /**
   * 记录错误日志
   */
  static logError(error: any, context: string, videoId?: string): void {
    const contextInfo = videoId ? `${context} (videoId: ${videoId})` : context;

    if (error instanceof ApiError) {
      // 404 和解析错误是 WARNING 级别
      const isWarningLevel =
        error.status === 404 ||
        error.code === 'PARSE_ERROR' ||
        error.message.includes('mock');

      const logLevel = isWarningLevel ? LogType.WARNING : LogType.ERROR;

      log('subtitle-error', logLevel,
        `API Error in ${contextInfo}: ${error.code} - ${error.message} (status: ${error.status})`
      );
    } else if (error instanceof Error) {
      // 检查是否是开发环境的模拟数据相关错误
      const isMockDataError =
        error.message.includes('mock') ||
        error.message.includes('No mock subtitle data available');

      const logLevel = isMockDataError ? LogType.WARNING : LogType.ERROR;

      log('subtitle-error', logLevel,
        `Error in ${contextInfo}: ${error.name} - ${error.message}`
      );
    } else {
      log('subtitle-error', LogType.ERROR,
        `Unknown error in ${contextInfo}: ${String(error)}`
      );
    }
  }

  /**
   * 判断错误是否应该显示给用户
   */
  static shouldShowToUser(error: any): boolean {
    // 开发环境显示所有错误
    if (__DEV__) {
      return true;
    }

    // 生产环境只显示用户相关的错误
    if (error instanceof ApiError) {
      // 网络错误、超时、404、认证错误应该显示
      return (
        error.isNetworkError() ||
        error.code === 'TIMEOUT_ERROR' ||
        error.status === 404 ||
        error.isAuthError()
      );
    }

    return true;
  }

  /**
   * 生成错误报告（用于调试）
   */
  static generateErrorReport(error: any, context: string): string {
    const timestamp = new Date().toISOString();

    let report = `=== 字幕错误报告 ===\n`;
    report += `时间: ${timestamp}\n`;
    report += `上下文: ${context}\n`;

    if (error instanceof ApiError) {
      report += `错误代码: ${error.code}\n`;
      report += `错误信息: ${error.message}\n`;
      report += `状态码: ${error.status}\n`;
      if (error.details) {
        report += `详细信息: ${JSON.stringify(error.details, null, 2)}\n`;
      }
    } else if (error instanceof Error) {
      report += `错误名称: ${error.name}\n`;
      report += `错误信息: ${error.message}\n`;
      if (error.stack) {
        report += `堆栈跟踪: ${error.stack}\n`;
      }
    } else {
      report += `原始错误: ${String(error)}\n`;
    }

    report += `===================`;

    return report;
  }
}
