/**
 * HTTP 客户端核心类型定义
 */

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 基础延迟（毫秒） */
  retryDelay: number;
  /** 指数退避系数 */
  backoffMultiplier?: number;
  /** 重试条件判断函数 */
  retryCondition?: (error: ApiError) => boolean;
}

/**
 * 请求配置接口
 */
export interface RequestConfig extends RequestInit {
  // 基础配置
  /** 请求 URL（由客户端内部设置） */
  url?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 跳过自动认证注入 */
  skipAuth?: boolean;
  /** 是否检查网络状态 */
  checkNetwork?: boolean;

  // 重试配置
  /** 重试配置，false 表示禁用重试 */
  retry?: RetryConfig | false;

  // 元数据（用于拦截器传递信息）
  metadata?: Record<string, any>;
}

/**
 * 请求拦截器接口
 */
export interface RequestInterceptor {
  /** 请求前处理 */
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  /** 请求错误处理 */
  onRequestError?: (error: Error) => void;
}

/**
 * 响应拦截器接口
 */
export interface ResponseInterceptor {
  /** 响应成功处理 */
  onResponse?: <T>(
    response: Response,
    data: T,
    config: RequestConfig
  ) => T | Promise<T>;
  /** 响应错误处理 */
  onResponseError?: (error: ApiError) => void | Promise<void>;
}

/**
 * API 错误类
 * 提供统一的错误结构和类型判断方法
 */
export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number = 0,
    public readonly code: string = 'UNKNOWN_ERROR',
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * 判断是否为网络错误
   */
  isNetworkError(): boolean {
    return (
      this.code === 'NETWORK_ERROR' ||
      this.code === 'NETWORK_OFFLINE' ||
      this.code === 'NETWORK_UNREACHABLE'
    );
  }

  /**
   * 判断是否为认证错误
   */
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * 判断是否为服务器错误 (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * 判断是否为客户端错误 (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}
