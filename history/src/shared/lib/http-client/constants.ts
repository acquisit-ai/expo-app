/**
 * HTTP 客户端常量定义
 */

export const HTTP_CLIENT_CONSTANTS = {
  /** 默认超时时间（毫秒） */
  DEFAULT_TIMEOUT: 10000, // 10秒

  /** 默认最大重试次数 */
  DEFAULT_RETRY_COUNT: 3,

  /** 默认重试延迟（毫秒） */
  DEFAULT_RETRY_DELAY: 1000, // 1秒

  /** 重试指数退避系数 */
  RETRY_BACKOFF_MULTIPLIER: 2,

  /** 慢请求阈值（毫秒） */
  SLOW_REQUEST_THRESHOLD: 3000, // 3秒
} as const;
