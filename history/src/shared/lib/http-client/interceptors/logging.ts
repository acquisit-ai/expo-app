/**
 * 日志拦截器
 *
 * 职责：
 * - 记录请求开始和结束
 * - 记录请求耗时
 * - 开发环境记录详细信息
 * - 生产环境只记录错误
 */

import { httpClient } from '../core/client';
import { log, LogType } from '@/shared/lib/logger';
import { isDevelopment } from '@/shared/config/environment';

/**
 * 请求日志拦截器
 * 记录请求开始时间和请求信息
 */
httpClient.interceptors.request.use({
  onRequest: (config) => {
    // 记录请求开始时间
    config.metadata = {
      ...config.metadata,
      startTime: Date.now(),
    };

    // 开发环境记录详细请求信息
    if (isDevelopment()) {
      log(
        'http',
        LogType.DEBUG,
        `→ ${config.method} ${config.url}`
      );
    }

    return config;
  },
});

/**
 * 响应日志拦截器
 * 记录响应状态和耗时
 */
httpClient.interceptors.response.use({
  onResponse: (response, data, config) => {
    const duration = Date.now() - (config.metadata?.startTime || 0);

    // 开发环境记录详细响应信息
    if (isDevelopment()) {
      log(
        'http',
        LogType.DEBUG,
        `← ${response.status} ${config.method} ${config.url} (${duration}ms)`
      );
    }

    // 慢请求告警（生产和开发环境都需要）
    if (duration > 3000) {
      log(
        'http',
        LogType.WARNING,
        `Slow request: ${config.url} took ${duration}ms`
      );
    }

    return data;
  },

  onResponseError: (error) => {
    // 所有环境都记录错误
    log(
      'http',
      LogType.ERROR,
      `Request failed: ${error.message} (status: ${error.status}, code: ${error.code})`
    );
  },
});
