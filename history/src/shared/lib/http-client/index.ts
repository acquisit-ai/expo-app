/**
 * HTTP 客户端统一导出
 *
 * 导入此模块时会自动加载所有拦截器
 */

// 核心 API
export { httpClient } from './core/client';
export { ApiError } from './core/types';
export type {
  RequestConfig,
  RetryConfig,
  RequestInterceptor,
  ResponseInterceptor,
} from './core/types';

// React Hooks
export { useRequest } from './hooks/useRequest';
export { useMutation } from './hooks/useMutation';

// 工具函数
export { executeWithRetry } from './utils/retry';
export { checkNetworkState, getNetworkInfo } from './utils/network';

// 常量
export { HTTP_CLIENT_CONSTANTS } from './constants';

// 自动加载拦截器
import './interceptors';
