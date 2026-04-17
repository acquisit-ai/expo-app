/**
 * HTTP 客户端核心实现
 *
 * 职责：
 * - 统一的网络请求接口
 * - 自动认证注入（从 entities/user 获取 token）
 * - 拦截器链管理
 * - 自动重试和网络检测
 * - 请求超时控制
 */

import NetInfo from '@react-native-community/netinfo';
import { log, LogType } from '@/shared/lib/logger';
import { getEnvironmentConfig } from '@/shared/config/environment';
import type {
  RequestConfig,
  RetryConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ApiError,
} from './types';
import { ApiError as ApiErrorClass } from './types';

/**
 * HTTP 客户端核心类
 * 单例模式，全局唯一实例
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number = 10000;

  // 拦截器存储
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  // 默认重试配置
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryCondition: (error: ApiError) => {
      // 不重试已取消的请求
      if (error.code === 'TIMEOUT_ERROR') {
        return false;
      }

      // 可以重试的错误类型：
      // - 网络错误 (NETWORK_ERROR, NETWORK_OFFLINE, NETWORK_UNREACHABLE)
      // - 服务器错误 (5xx)
      // - 429 Too Many Requests
      return (
        error.isNetworkError() ||
        error.isServerError() ||
        error.status === 429
      );
    },
  };

  constructor() {
    this.baseUrl = getEnvironmentConfig().api.baseUrl;
    log('http-client', LogType.INFO, `Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * 拦截器管理 API
   */
  public interceptors = {
    request: {
      use: (interceptor: RequestInterceptor) => {
        this.requestInterceptors.push(interceptor);
      },
    },
    response: {
      use: (interceptor: ResponseInterceptor) => {
        this.responseInterceptors.push(interceptor);
      },
    },
  };

  /**
   * 检查网络状态
   */
  private async checkNetworkState(): Promise<void> {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      throw new ApiErrorClass('网络未连接', 0, 'NETWORK_OFFLINE');
    }

    if (state.isInternetReachable === false) {
      throw new ApiErrorClass('无法访问互联网', 0, 'NETWORK_UNREACHABLE');
    }
  }

  /**
   * 执行请求拦截器链
   */
  private async runRequestInterceptors(
    config: RequestConfig
  ): Promise<RequestConfig> {
    let currentConfig = config;

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        try {
          currentConfig = await interceptor.onRequest(currentConfig);
        } catch (error) {
          if (interceptor.onRequestError) {
            interceptor.onRequestError(error as Error);
          }
          throw error;
        }
      }
    }

    return currentConfig;
  }

  /**
   * 执行响应拦截器链
   */
  private async runResponseInterceptors<T>(
    response: Response,
    data: T,
    config: RequestConfig
  ): Promise<T> {
    let currentData = data;

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponse) {
        currentData = await interceptor.onResponse(response, currentData, config);
      }
    }

    return currentData;
  }

  /**
   * 执行错误拦截器
   */
  private async runErrorInterceptors(error: ApiError): Promise<void> {
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponseError) {
        await interceptor.onResponseError(error);
      }
    }
  }

  /**
   * 带超时的 fetch
   */
  private async fetchWithTimeout(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, signal, ...fetchOptions } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // 合并外部 signal，并确保清理监听器
    let abortHandler: (() => void) | undefined;
    if (signal) {
      abortHandler = () => controller.abort();
      signal.addEventListener('abort', abortHandler);
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      // 清理事件监听器
      if (signal && abortHandler) {
        signal.removeEventListener('abort', abortHandler);
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      // 清理事件监听器
      if (signal && abortHandler) {
        signal.removeEventListener('abort', abortHandler);
      }

      if ((error as Error).name === 'AbortError') {
        throw new ApiErrorClass('请求超时', 408, 'TIMEOUT_ERROR');
      }

      throw new ApiErrorClass('网络请求失败', 0, 'NETWORK_ERROR', error);
    }
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(
    response: Response,
    config: RequestConfig
  ): Promise<T> {
    const status = response.status;

    // 成功响应 (2xx)
    if (status >= 200 && status < 300) {
      if (status === 204) {
        return {} as T;
      }

      try {
        const data = await response.json();
        return await this.runResponseInterceptors<T>(response, data, config);
      } catch (error) {
        throw new ApiErrorClass('响应解析失败', status, 'PARSE_ERROR', error);
      }
    }

    // 错误响应
    let errorMessage = `请求失败 (${status})`;
    let errorCode = 'HTTP_ERROR';
    let errorDetails: any;

    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
      errorCode = errorBody.code || errorCode;
      errorDetails = errorBody;
    } catch {
      // 无法解析错误体
    }

    const error = new ApiErrorClass(errorMessage, status, errorCode, errorDetails);
    await this.runErrorInterceptors(error);
    throw error;
  }

  /**
   * 带重试的请求执行
   */
  private async requestWithRetry<T>(
    url: string,
    config: RequestConfig
  ): Promise<T> {
    const retryConfig =
      config.retry === false
        ? null
        : { ...this.defaultRetryConfig, ...config.retry };

    let lastError: ApiError | null = null;
    const maxAttempts = retryConfig ? retryConfig.maxRetries + 1 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // 非首次尝试，计算延迟
        if (attempt > 0 && retryConfig) {
          const delay =
            retryConfig.retryDelay *
            Math.pow(retryConfig.backoffMultiplier || 1, attempt - 1);

          log(
            'http-client',
            LogType.INFO,
            `Retry attempt ${attempt}/${retryConfig.maxRetries} after ${delay}ms`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const response = await this.fetchWithTimeout(url, config);
        return await this.handleResponse<T>(response, config);
      } catch (error) {
        lastError =
          error instanceof ApiErrorClass
            ? error
            : new ApiErrorClass('未知错误', 0, 'UNKNOWN_ERROR', error);

        // 检查是否应该重试
        const shouldRetry =
          retryConfig &&
          attempt < retryConfig.maxRetries &&
          retryConfig.retryCondition?.(lastError);

        if (!shouldRetry) {
          throw lastError;
        }

        log(
          'http-client',
          LogType.WARNING,
          `Request failed, will retry: ${lastError.message}`
        );
      }
    }

    throw lastError || new ApiErrorClass('请求失败', 0, 'UNKNOWN_ERROR');
  }

  /**
   * 核心请求方法
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    // 1. 网络状态检查
    if (config.checkNetwork !== false) {
      await this.checkNetworkState();
    }

    // 2. 构建完整 URL
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    // 3. 构建请求配置
    let requestConfig: RequestConfig = {
      ...config,
      url, // 设置 URL 供拦截器使用
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    // 4. 执行请求拦截器（认证由 auth.ts 拦截器处理）
    requestConfig = await this.runRequestInterceptors(requestConfig);

    // 5. 执行请求（带重试）
    log(
      'http-client',
      LogType.INFO,
      `${requestConfig.method || 'GET'} ${url}`
    );

    return await this.requestWithRetry<T>(url, requestConfig);
  }

  /**
   * 公开 API - GET 请求
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * 公开 API - POST 请求
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 公开 API - PUT 请求
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 公开 API - PATCH 请求
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 公开 API - DELETE 请求
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

/**
 * 导出全局单例
 */
export const httpClient = new HttpClient();
