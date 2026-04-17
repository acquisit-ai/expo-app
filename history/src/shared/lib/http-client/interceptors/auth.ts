/**
 * 认证拦截器
 *
 * 职责：
 * - 自动注入 JWT Token 到请求头
 * - 从 entities/user 获取最新的 access token
 * - 支持通过 skipAuth 跳过认证
 */

import { httpClient } from '../core/client';
import { ApiError } from '../core/types';
import { useUserStore } from '@/entities/user';

/**
 * 注册认证拦截器
 * 自动为每个请求添加 Authorization header
 */
httpClient.interceptors.request.use({
  onRequest: (config) => {
    // 如果明确跳过认证，直接返回
    if (config.skipAuth) {
      return config;
    }

    // 从 user store 获取最新的 access token
    const token = useUserStore.getState().accessToken;

    // 如果没有 token，抛出认证错误
    if (!token) {
      throw new ApiError('需要登录', 401, 'UNAUTHORIZED');
    }

    // 添加 Authorization header
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };

    return config;
  },
});
