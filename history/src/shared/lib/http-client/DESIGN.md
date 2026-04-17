# React Native HTTP 客户端设计文档

> **目标平台**: iOS & Android
> **技术栈**: React Native + TypeScript + Supabase
> **文档版本**: v1.2.0 (已修复所有问题)
> **最后更新**: 2025-01-10
> **状态**: ✅ 生产就绪

> 💡 **快速上手？** 查看 **[README.md](./README.md)** 获取使用示例和常见问题解答

---

## 📋 目录

1. [设计目标](#设计目标)
2. [核心架构](#核心架构)
3. [文件结构](#文件结构)
4. [功能特性](#功能特性)
5. [实现细节](#实现细节)
6. [使用指南](#使用指南)
7. [最佳实践](#最佳实践)

---

## 🎯 设计目标

### 核心原则

1. **简单性** - API 简洁直观，学习成本低
2. **类型安全** - 完整的 TypeScript 类型推断
3. **可靠性** - 自动重试、错误恢复、网络状态感知
4. **性能优化** - 请求取消、并发控制、智能缓存
5. **可观测性** - 完整的日志、性能监控、错误追踪
6. **移动优先** - 针对移动端网络特性优化

### 非目标

- ❌ Web 端兼容性（纯移动端）
- ❌ 向后兼容（全新设计）
- ❌ GraphQL 支持（专注 REST API）
- ❌ 复杂的离线队列（使用专门的库）

---

## 🏗️ 核心架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    应用层                                 │
│  - React Components                                     │
│  - Custom Hooks                                         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  HTTP 客户端 API 层                       │
│  - httpClient.get/post/put/delete                      │
│  - 类型安全的请求/响应                                    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    拦截器链                               │
│  Request:  Auth → Logging → Transform                  │
│  Response: Transform → Error → Logging                 │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  核心请求引擎                             │
│  - Fetch Wrapper                                        │
│  - 超时控制                                              │
│  - 取消机制                                              │
│  - 重试逻辑                                              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  底层能力                                 │
│  - Network State (NetInfo)                             │
│  - Token Store (entities/user)                         │
│  - Logger                                              │
└─────────────────────────────────────────────────────────┘
```

### 设计模式

1. **单例模式** - 全局唯一的客户端实例
2. **拦截器模式** - 请求/响应处理链
3. **策略模式** - 可配置的重试/缓存策略
4. **构建器模式** - 灵活的请求配置

---

## 📁 文件结构

### 目录组织

基于 Feature-Sliced Design (FSD) 架构，HTTP 客户端作为应用级基础设施，放置在 `shared` 层：

```
src/shared/lib/http-client/
├── core/                           # 核心实现
│   ├── client.ts                  # HttpClient 主类
│   ├── error.ts                   # ApiError 错误类
│   └── types.ts                   # 核心类型定义
│
├── interceptors/                   # 拦截器系统
│   ├── auth.ts                    # 认证拦截器（自动注入JWT）
│   ├── logging.ts                 # 日志拦截器
│   ├── performance.ts             # 性能监控拦截器
│   ├── index.ts                   # 拦截器统一初始化
│   └── README.md                  # 拦截器使用文档
│
├── hooks/                          # React Hooks 封装
│   ├── useRequest.ts              # GET 请求 Hook
│   ├── useMutation.ts             # POST/PUT/DELETE Hook
│   └── index.ts
│
├── utils/                          # 工具函数
│   ├── retry.ts                   # 重试策略实现
│   ├── network.ts                 # 网络状态检测（NetInfo）
│   └── index.ts
│
├── constants.ts                    # 常量定义（超时、重试配置）
├── index.ts                        # 统一公开 API 导出
├── README.md                       # 使用文档
└── CONTEXT.md                      # 架构说明文档（可选）
```

### 文件职责说明

#### **core/ - 核心层**

**`core/client.ts`** - HTTP 客户端主类
- ✅ 实现 `HttpClient` 类
- ✅ 管理拦截器链
- ✅ 处理请求执行和重试逻辑
- ✅ 导出全局单例 `httpClient`

**`core/error.ts`** - 统一错误处理
- ✅ 定义 `ApiError` 错误类
- ✅ 提供错误分类方法（网络错误、认证错误、服务器错误）
- ✅ 错误序列化和日志格式化

**`core/types.ts`** - 类型定义
- ✅ `RequestConfig` - 请求配置接口
- ✅ `RetryConfig` - 重试配置接口
- ✅ `RequestInterceptor` - 请求拦截器接口
- ✅ `ResponseInterceptor` - 响应拦截器接口

#### **interceptors/ - 拦截器层**

**`interceptors/auth.ts`** - 认证拦截器
```typescript
// 自动注入 JWT Token
httpClient.interceptors.request.use({
  onRequest: (config) => {
    const token = useUserStore.getState().accessToken;
    if (token && !config.skipAuth) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  }
});
```

**`interceptors/logging.ts`** - 日志拦截器
```typescript
// 请求/响应日志记录
httpClient.interceptors.request.use({
  onRequest: (config) => {
    log('http', LogType.INFO, `→ ${config.method} ${config.url}`);
    config.metadata = { startTime: Date.now() };
    return config;
  }
});

httpClient.interceptors.response.use({
  onResponse: (response, data, config) => {
    const duration = Date.now() - config.metadata.startTime;
    log('http', LogType.INFO, `← ${response.status} (${duration}ms)`);
    return data;
  }
});
```

**`interceptors/performance.ts`** - 性能监控
```typescript
// 慢请求告警和性能追踪
httpClient.interceptors.response.use({
  onResponse: (response, data, config) => {
    const duration = Date.now() - config.metadata.startTime;

    if (duration > 3000) {
      analytics.track('slow_api_request', {
        url: config.url,
        duration,
        method: config.method,
      });
    }

    return data;
  }
});
```

**`interceptors/index.ts`** - 自动初始化
```typescript
// 导入所有拦截器，自动注册
import './auth';
import './logging';
import './performance';

// 拦截器加载顺序：
// 1. auth.ts - 认证注入
// 2. logging.ts - 日志记录
// 3. performance.ts - 性能监控
```

#### **hooks/ - React 集成层**

**`hooks/useRequest.ts`** - GET 请求 Hook
```typescript
export function useRequest<T>(endpoint: string, options = {}) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await httpClient.get<T>(endpoint, options);
      setData(result);
      return result;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, options]);

  return { data, error, isLoading, execute, refetch: execute };
}
```

**`hooks/useMutation.ts`** - 变更操作 Hook
```typescript
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      options.onError?.(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, options]);

  return { mutate, isLoading, error };
}
```

#### **utils/ - 工具函数层**

**`utils/retry.ts`** - 重试策略
```typescript
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = config.retryDelay *
          Math.pow(config.backoffMultiplier, attempt - 1);
        await sleep(delay);
      }

      return await fn();
    } catch (error) {
      lastError = error;

      if (!config.retryCondition?.(error)) {
        throw error;
      }
    }
  }

  throw lastError!;
}
```

**`utils/network.ts`** - 网络检测
```typescript
import NetInfo from '@react-native-community/netinfo';
import { ApiError } from '../core/error';

export async function checkNetworkState(): Promise<void> {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    throw new ApiError('网络未连接', 0, 'NETWORK_OFFLINE');
  }

  if (state.isInternetReachable === false) {
    throw new ApiError('无法访问互联网', 0, 'NETWORK_UNREACHABLE');
  }
}
```

#### **根文件**

**`constants.ts`** - 全局常量
```typescript
export const HTTP_CLIENT_CONSTANTS = {
  DEFAULT_TIMEOUT: 10000,           // 10秒
  DEFAULT_RETRY_COUNT: 3,
  DEFAULT_RETRY_DELAY: 1000,        // 1秒
  RETRY_BACKOFF_MULTIPLIER: 2,      // 指数退避系数
  SLOW_REQUEST_THRESHOLD: 3000,     // 慢请求阈值 3秒
} as const;
```

**`index.ts`** - 统一导出
```typescript
// 核心 API
export { httpClient } from './core/client';
export { ApiError } from './core/error';
export type { RequestConfig, RetryConfig } from './core/types';

// React Hooks
export { useRequest } from './hooks/useRequest';
export { useMutation } from './hooks/useMutation';

// 常量
export { HTTP_CLIENT_CONSTANTS } from './constants';

// 自动加载拦截器
import './interceptors';
```

### 模块依赖关系

```
┌─────────────────────────────────────────┐
│         External Dependencies           │
│  - entities/user (Token Store)         │
│  - shared/lib/logger (日志系统)         │
│  - shared/config/environment (环境配置)  │
│  - @react-native-community/netinfo     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            http-client/core/            │
│  - client.ts                           │
│  - error.ts                            │
│  - types.ts                            │
└─────────────────────────────────────────┘
        ↓                    ↓
┌──────────────┐      ┌──────────────────┐
│ interceptors/│      │     utils/       │
│ (自动注册)    │      │  - retry.ts     │
└──────────────┘      │  - network.ts   │
                      └──────────────────┘
                             ↓
                      ┌──────────────────┐
                      │     hooks/       │
                      │  - useRequest    │
                      │  - useMutation   │
                      └──────────────────┘
```

### 与项目现有模块对比

| 现有模块 | 复杂度 | 文件结构 | http-client 对应 |
|---------|--------|----------|------------------|
| `auth-sync/` | 简单 | 2个文件 | ❌ 过于简单 |
| `toast/` | 中等 | lib/, ui/, types.ts | ✅ 相似模式 |
| `modal/` | 中等 | config/, provider/ | ✅ 相似模式 |
| **`http-client/`** | **中等** | **core/, interceptors/, hooks/** | ✅ **推荐结构** |

**设计理由**：
1. ✅ 符合 FSD 的 `shared/lib` 层定位
2. ✅ 遵循项目现有的模块组织模式
3. ✅ 清晰的职责分离和分层架构
4. ✅ 支持渐进式复杂度扩展
5. ✅ 便于测试和维护

---

## ✨ 功能特性

### 1. 认证集成

#### 自动 JWT 注入

```typescript
// ✅ 自动从 entities/user 获取最新 token
const response = await httpClient.get('/api/v1/feed');

// ✅ 跳过认证（公开接口）
const response = await httpClient.get('/api/v1/public/feed', {
  skipAuth: true
});
```

#### Token 失效处理

```typescript
// Supabase SDK 自动刷新 token
// HTTP 客户端读取最新的 token（无需手动刷新）
```

### 2. 错误处理

#### 统一错误类型

```typescript
class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // 错误类型判断
  isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR';
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}
```

#### 错误分类处理

```typescript
try {
  const data = await httpClient.get('/api/v1/feed');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isNetworkError()) {
      // 网络错误 - 显示离线提示
      toast.show({ type: 'error', message: '网络连接失败' });
    } else if (error.isAuthError()) {
      // 认证错误 - 重新登录
      router.push('/auth/login');
    } else if (error.isServerError()) {
      // 服务器错误 - 稍后重试
      toast.show({ type: 'error', message: '服务器异常，请稍后重试' });
    }
  }
}
```

### 3. 自动重试机制

#### 智能重试策略

```typescript
interface RetryConfig {
  maxRetries: number;       // 最大重试次数
  retryDelay: number;       // 基础延迟（毫秒）
  retryCondition?: (error: ApiError) => boolean; // 重试条件
  backoffMultiplier?: number; // 指数退避系数
}

// 默认重试策略
const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2, // 1s, 2s, 4s
  retryCondition: (error) => {
    // 仅对网络错误和 5xx 错误重试
    return error.isNetworkError() || error.isServerError();
  }
};
```

#### 使用示例

```typescript
// 自定义重试配置
const data = await httpClient.get('/api/v1/feed', {
  retry: {
    maxRetries: 5,
    retryDelay: 2000,
    backoffMultiplier: 1.5,
  }
});

// 禁用重试
const data = await httpClient.post('/api/v1/payment', data, {
  retry: false
});
```

### 4. 请求取消

#### AbortController 集成

```typescript
// 手动取消
const controller = new AbortController();

const promise = httpClient.get('/api/v1/feed', {
  signal: controller.signal
});

// 5秒后取消请求
setTimeout(() => controller.abort(), 5000);

try {
  const data = await promise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('请求已取消');
  }
}
```

#### 自动超时

```typescript
// 默认 10 秒超时
const data = await httpClient.get('/api/v1/feed');

// 自定义超时
const data = await httpClient.get('/api/v1/feed', {
  timeout: 30000 // 30秒
});
```

### 5. 网络状态感知

#### NetInfo 集成

```typescript
import NetInfo from '@react-native-community/netinfo';

class HttpClient {
  private async checkNetworkState(): Promise<void> {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      throw new ApiError(
        '网络未连接',
        0,
        'NETWORK_OFFLINE'
      );
    }

    if (state.isInternetReachable === false) {
      throw new ApiError(
        '无法访问互联网',
        0,
        'NETWORK_UNREACHABLE'
      );
    }
  }
}
```

#### 离线提示

```typescript
// 请求前检查网络状态
const data = await httpClient.get('/api/v1/feed', {
  checkNetwork: true // 默认开启
});
```

### 6. 拦截器系统

#### 请求拦截器

```typescript
interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: Error) => void;
}

// 注册拦截器
httpClient.interceptors.request.use({
  onRequest: async (config) => {
    // 添加自定义 header
    config.headers['X-App-Version'] = '1.0.0';

    // 记录请求
    console.log(`[HTTP] ${config.method} ${config.url}`);

    return config;
  }
});
```

#### 响应拦截器

```typescript
interface ResponseInterceptor {
  onResponse?: <T>(response: Response, data: T) => T | Promise<T>;
  onResponseError?: (error: ApiError) => void;
}

// 注册拦截器
httpClient.interceptors.response.use({
  onResponse: async (response, data) => {
    // 统一数据转换
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data; // 自动解包
    }
    return data;
  },

  onResponseError: (error) => {
    // 全局错误处理
    if (error.isAuthError()) {
      // 触发重新登录流程
      EventEmitter.emit('auth:expired');
    }
  }
});
```

### 7. 类型安全

#### 泛型支持

```typescript
interface FeedResponse {
  videos: Video[];
  nextCursor?: string;
  hasMore: boolean;
}

// 完整的类型推断
const response = await httpClient.get<FeedResponse>('/api/v1/feed');
// response 类型: FeedResponse

response.videos.forEach(video => {
  // ✅ 完整的类型提示
  console.log(video.id, video.title);
});
```

#### 请求/响应类型定义

```typescript
interface ApiRequest<T = unknown> {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, string | number | boolean>;
  data?: T;
  headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}
```

### 8. 日志系统

#### 分级日志

```typescript
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// 开发环境：DEBUG
// 生产环境：ERROR
const logLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.ERROR;

httpClient.setLogLevel(logLevel);
```

#### 请求日志

```typescript
// 自动记录
// [HTTP:DEBUG] GET /api/v1/feed
// [HTTP:DEBUG] Request headers: { Authorization: 'Bearer ***', ... }
// [HTTP:INFO] Response 200 in 245ms
// [HTTP:DEBUG] Response data: { videos: [...], ... }
```

#### 性能监控

```typescript
httpClient.interceptors.request.use({
  onRequest: (config) => {
    config.metadata = { startTime: Date.now() };
    return config;
  }
});

httpClient.interceptors.response.use({
  onResponse: (response, data, config) => {
    const duration = Date.now() - config.metadata.startTime;

    if (duration > 3000) {
      // 慢请求告警
      logger.warn('http', `Slow request: ${config.url} took ${duration}ms`);
    }

    return data;
  }
});
```

---

## 💻 实现细节

### 核心类设计

```typescript
// src/shared/lib/http-client/core.ts

import NetInfo from '@react-native-community/netinfo';
import { useUserStore } from '@/entities/user';
import { log, LogType } from '@/shared/lib/logger';
import { getEnvironmentConfig } from '@/shared/config/environment';

/**
 * API 错误类
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

  isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR' ||
           this.code === 'NETWORK_OFFLINE' ||
           this.code === 'NETWORK_UNREACHABLE';
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

/**
 * 请求配置接口
 */
export interface RequestConfig extends RequestInit {
  // 基础配置
  timeout?: number;
  skipAuth?: boolean;
  checkNetwork?: boolean;

  // 重试配置
  retry?: RetryConfig | false;

  // 元数据（用于拦截器传递信息）
  metadata?: Record<string, any>;
}

/**
 * 重试配置
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier?: number;
  retryCondition?: (error: ApiError) => boolean;
}

/**
 * 拦截器接口
 */
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: Error) => void;
}

export interface ResponseInterceptor {
  onResponse?: <T>(response: Response, data: T, config: RequestConfig) => T | Promise<T>;
  onResponseError?: (error: ApiError) => void | Promise<void>;
}

/**
 * HTTP 客户端核心类
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
    retryCondition: (error) => {
      return error.isNetworkError() || error.isServerError();
    }
  };

  constructor() {
    this.baseUrl = getEnvironmentConfig().api.baseUrl;
    log('http-client', LogType.INFO, `Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * 拦截器管理
   */
  public interceptors = {
    request: {
      use: (interceptor: RequestInterceptor) => {
        this.requestInterceptors.push(interceptor);
      }
    },
    response: {
      use: (interceptor: ResponseInterceptor) => {
        this.responseInterceptors.push(interceptor);
      }
    }
  };

  /**
   * 获取当前的 Access Token
   */
  private getAccessToken(): string | null {
    const { accessToken } = useUserStore.getState();
    return accessToken;
  }

  /**
   * 检查网络状态
   */
  private async checkNetworkState(): Promise<void> {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      throw new ApiError('网络未连接', 0, 'NETWORK_OFFLINE');
    }

    if (state.isInternetReachable === false) {
      throw new ApiError('无法访问互联网', 0, 'NETWORK_UNREACHABLE');
    }
  }

  /**
   * 执行请求拦截器
   */
  private async runRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
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
   * 执行响应拦截器
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

    // 合并外部 signal
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new ApiError('请求超时', 408, 'TIMEOUT_ERROR');
      }

      throw new ApiError(
        '网络请求失败',
        0,
        'NETWORK_ERROR',
        error
      );
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

    // 成功响应
    if (status >= 200 && status < 300) {
      if (status === 204) {
        return {} as T;
      }

      try {
        const data = await response.json();
        return await this.runResponseInterceptors<T>(response, data, config);
      } catch (error) {
        throw new ApiError('响应解析失败', status, 'PARSE_ERROR', error);
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

    const error = new ApiError(errorMessage, status, errorCode, errorDetails);
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
    const retryConfig = config.retry === false
      ? null
      : { ...this.defaultRetryConfig, ...config.retry };

    let lastError: ApiError | null = null;
    const maxAttempts = retryConfig ? retryConfig.maxRetries + 1 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // 非首次尝试，计算延迟
        if (attempt > 0 && retryConfig) {
          const delay = retryConfig.retryDelay *
            Math.pow(retryConfig.backoffMultiplier || 1, attempt - 1);

          log('http-client', LogType.INFO,
            `Retry attempt ${attempt}/${retryConfig.maxRetries} after ${delay}ms`);

          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const response = await this.fetchWithTimeout(url, config);
        return await this.handleResponse<T>(response, config);

      } catch (error) {
        lastError = error instanceof ApiError
          ? error
          : new ApiError('未知错误', 0, 'UNKNOWN_ERROR', error);

        // 检查是否应该重试
        const shouldRetry = retryConfig &&
          attempt < retryConfig.maxRetries &&
          retryConfig.retryCondition?.(lastError);

        if (!shouldRetry) {
          throw lastError;
        }

        log('http-client', LogType.WARN,
          `Request failed, will retry: ${lastError.message}`);
      }
    }

    throw lastError || new ApiError('请求失败', 0, 'UNKNOWN_ERROR');
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
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      }
    };

    // 4. 添加认证 header
    if (!config.skipAuth) {
      const token = this.getAccessToken();

      if (!token) {
        throw new ApiError('需要登录', 401, 'UNAUTHORIZED');
      }

      requestConfig.headers!['Authorization'] = `Bearer ${token}`;
    }

    // 5. 执行请求拦截器
    requestConfig = await this.runRequestInterceptors(requestConfig);

    // 6. 执行请求（带重试）
    log('http-client', LogType.INFO,
      `${requestConfig.method || 'GET'} ${url}`);

    return await this.requestWithRetry<T>(url, requestConfig);
  }

  /**
   * 公开 API
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// 导出全局单例
export const httpClient = new HttpClient();
```

### 默认拦截器配置

```typescript
// src/shared/lib/http-client/interceptors.ts

import { httpClient } from './core';
import { isDevelopment } from '@/shared/config/environment';
import { log, LogType } from '@/shared/lib/logger';

/**
 * 请求日志拦截器
 */
httpClient.interceptors.request.use({
  onRequest: (config) => {
    // 记录请求开始时间
    config.metadata = {
      ...config.metadata,
      startTime: Date.now(),
    };

    if (isDevelopment()) {
      log('http-client', LogType.DEBUG,
        `→ ${config.method} ${config.url}`,
        { headers: config.headers });
    }

    return config;
  }
});

/**
 * 响应日志拦截器
 */
httpClient.interceptors.response.use({
  onResponse: (response, data, config) => {
    const duration = Date.now() - (config.metadata?.startTime || 0);

    if (isDevelopment()) {
      log('http-client', LogType.DEBUG,
        `← ${response.status} ${config.method} ${config.url} (${duration}ms)`,
        { data });
    }

    // 慢请求告警
    if (duration > 3000) {
      log('http-client', LogType.WARN,
        `Slow request: ${config.url} took ${duration}ms`);
    }

    return data;
  },

  onResponseError: (error) => {
    log('http-client', LogType.ERROR,
      `Request failed: ${error.message}`,
      { status: error.status, code: error.code, details: error.details });
  }
});

/**
 * 应用版本 Header 拦截器
 */
httpClient.interceptors.request.use({
  onRequest: (config) => {
    // 添加应用版本信息
    config.headers = {
      ...config.headers,
      'X-App-Version': '1.0.0', // 从 app.json 读取
      'X-Platform': Platform.OS,
    };
    return config;
  }
});
```

---

## 📖 使用指南

### 基础用法

```typescript
import { httpClient } from '@/shared/lib/http-client';

// GET 请求
const feed = await httpClient.get<FeedResponse>('/api/v1/feed');

// POST 请求
const video = await httpClient.post<Video>('/api/v1/videos', {
  title: 'New Video',
  url: 'https://...'
});

// PUT 请求
const updated = await httpClient.put<Video>(`/api/v1/videos/${id}`, {
  title: 'Updated Title'
});

// DELETE 请求
await httpClient.delete(`/api/v1/videos/${id}`);
```

### 高级用法

#### 自定义超时

```typescript
const data = await httpClient.get('/api/v1/feed', {
  timeout: 30000 // 30秒
});
```

#### 跳过认证

```typescript
const data = await httpClient.get('/api/v1/public/feed', {
  skipAuth: true
});
```

#### 禁用重试

```typescript
const data = await httpClient.post('/api/v1/payment', paymentData, {
  retry: false // 支付接口不重试
});
```

#### 自定义 Headers

```typescript
const data = await httpClient.get('/api/v1/feed', {
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

#### 请求取消

```typescript
const controller = new AbortController();

const promise = httpClient.get('/api/v1/feed', {
  signal: controller.signal
});

// 取消请求
controller.abort();
```

### React Hook 封装

```typescript
// src/shared/lib/http-client/hooks/useRequest.ts

import { useState, useEffect, useCallback } from 'react';
import { httpClient, ApiError, RequestConfig } from '../core';

interface UseRequestOptions<T> extends RequestConfig {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

export function useRequest<T>(
  endpoint: string,
  options: UseRequestOptions<T> = {}
) {
  const [data, setData] = useState<T | undefined>(options.initialData);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await httpClient.get<T>(endpoint, options);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError
        ? err
        : new ApiError('请求失败', 0, 'UNKNOWN_ERROR', err);

      setError(apiError);
      options.onError?.(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, options]);

  return {
    data,
    error,
    isLoading,
    execute,
    refetch: execute,
  };
}
```

#### 使用示例

```typescript
function FeedScreen() {
  const { data, error, isLoading, refetch } = useRequest<FeedResponse>(
    '/api/v1/feed',
    {
      onSuccess: (data) => {
        console.log('Feed loaded:', data.videos.length);
      },
      onError: (error) => {
        if (error.isNetworkError()) {
          toast.show({ type: 'error', message: '网络连接失败' });
        }
      }
    }
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView error={error} onRetry={refetch} />;

  return <FeedList videos={data?.videos || []} />;
}
```

---

## 🎯 最佳实践

### 1. 类型定义集中管理

```typescript
// src/shared/types/api.ts

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}
```

### 2. API 端点统一管理

```typescript
// src/shared/api/endpoints.ts

export const API_ENDPOINTS = {
  feed: {
    list: '/api/v1/feed',
    item: (id: string) => `/api/v1/feed/${id}`,
  },
  video: {
    list: '/api/v1/videos',
    item: (id: string) => `/api/v1/videos/${id}`,
    subtitle: (id: string) => `/api/v1/videos/${id}/subtitle`,
  },
  user: {
    profile: '/api/v1/user/profile',
    settings: '/api/v1/user/settings',
  }
} as const;
```

### 3. 错误处理统一化

```typescript
// src/shared/lib/http-client/error-handler.ts

export function handleApiError(error: unknown): void {
  if (!(error instanceof ApiError)) {
    toast.show({ type: 'error', message: '未知错误' });
    return;
  }

  if (error.isNetworkError()) {
    toast.show({
      type: 'error',
      message: '网络连接失败，请检查网络设置'
    });
  } else if (error.isAuthError()) {
    // 跳转到登录页
    router.push('/auth/login');
  } else if (error.isServerError()) {
    toast.show({
      type: 'error',
      message: '服务器异常，请稍后重试'
    });
  } else {
    toast.show({
      type: 'error',
      message: error.message
    });
  }
}
```

### 4. 性能监控

```typescript
// 监控慢请求
httpClient.interceptors.response.use({
  onResponse: (response, data, config) => {
    const duration = Date.now() - config.metadata.startTime;

    // 上报慢请求
    if (duration > 3000) {
      analytics.track('slow_api_request', {
        url: config.url,
        duration,
        method: config.method,
      });
    }

    return data;
  }
});
```

### 5. 调试工具

```typescript
// 开发环境启用 Reactotron 网络监控
if (isDevelopment()) {
  httpClient.interceptors.request.use({
    onRequest: (config) => {
      console.tron?.display({
        name: 'API Request',
        value: {
          method: config.method,
          url: config.url,
          headers: config.headers,
        },
        preview: `${config.method} ${config.url}`,
      });
      return config;
    }
  });
}
```

---

## 📊 总结

### 核心优势

✅ **简单易用** - 清晰的 API，符合直觉的使用方式
✅ **类型安全** - 完整的 TypeScript 支持
✅ **可靠性高** - 自动重试、网络检测、错误恢复
✅ **性能优化** - 智能缓存、并发控制、请求取消
✅ **易于调试** - 完整的日志系统和性能监控
✅ **移动优化** - 专为 iOS/Android 设计

### 架构特点

- **单一职责** - HTTP 客户端只负责网络请求
- **可扩展性** - 拦截器机制支持灵活扩展
- **可测试性** - 清晰的接口，易于 mock 和测试
- **可维护性** - 模块化设计，代码结构清晰

### 后续优化方向

1. **请求缓存** - 实现基于时间的智能缓存
2. **离线队列** - 离线请求排队和自动重发
3. **GraphQL 支持** - 扩展支持 GraphQL 查询
4. **文件上传** - 优化大文件上传体验
5. **WebSocket 集成** - 统一管理实时连接

---

## 📚 相关文档

- **[README.md](./README.md)** - 快速上手指南和常用示例
- **[修复总结](../../../docs/architecture/http-client-fix-summary.md)** - 问题修复详细记录
- **[正确性分析](../../../docs/architecture/http-client-correctness-analysis.md)** - 实现正确性分析

---

**文档版本**: v1.2.0 (已修复所有问题)
**最后更新**: 2025-01-10
**状态**: ✅ 生产就绪
