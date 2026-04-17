/**
 * 性能监控拦截器
 *
 * 职责：
 * - 监控慢请求
 * - 收集性能指标
 * - 上报性能数据（待集成 analytics）
 */

import { httpClient } from '../core/client';
import { log, LogType } from '@/shared/lib/logger';

/**
 * 慢请求阈值（毫秒）
 */
const SLOW_REQUEST_THRESHOLD = 3000;

/**
 * 性能监控拦截器
 */
httpClient.interceptors.response.use({
  onResponse: (response, data, config) => {
    const duration = Date.now() - (config.metadata?.startTime || 0);

    // 慢请求告警
    if (duration > SLOW_REQUEST_THRESHOLD) {
      log(
        'http-performance',
        LogType.WARNING,
        `Slow API request detected: ${config.url} (${config.method}, ${duration}ms, status: ${response.status})`
      );

      // TODO: 集成 analytics 后上报慢请求
      // analytics.track('slow_api_request', {
      //   url: config.url,
      //   duration,
      //   method: config.method,
      // });
    }

    return data;
  },
});
