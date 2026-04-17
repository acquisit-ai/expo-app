/**
 * 重试工具函数
 *
 * 职责：
 * - 提供通用的重试逻辑
 * - 支持指数退避
 * - 自定义重试条件
 */

import type { RetryConfig, ApiError } from '../core/types';

/**
 * 睡眠函数
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 带重试的函数执行
 *
 * @param fn 要执行的异步函数
 * @param config 重试配置
 * @returns 函数执行结果
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // 非首次尝试，添加延迟
      if (attempt > 0) {
        const delay =
          config.retryDelay *
          Math.pow(config.backoffMultiplier || 1, attempt - 1);
        await sleep(delay);
      }

      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 检查是否应该重试
      if (config.retryCondition && !config.retryCondition(error as ApiError)) {
        throw error;
      }

      // 已经是最后一次尝试，抛出错误
      if (attempt === config.maxRetries) {
        throw error;
      }
    }
  }

  throw lastError!;
}
