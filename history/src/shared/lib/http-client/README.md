# HTTP 客户端

> 类型安全、功能完整的 HTTP 客户端，专为 React Native 设计

## ✨ 核心特性

- ✅ **自动认证** - 自动注入 JWT Token（从 `entities/user` 获取）
- ✅ **智能重试** - 指数退避，自定义重试条件
- ✅ **网络检测** - 基于 NetInfo 的网络状态感知
- ✅ **请求超时** - 自动超时控制和请求取消
- ✅ **拦截器系统** - 灵活的请求/响应拦截器
- ✅ **类型安全** - 完整的 TypeScript 支持
- ✅ **React Hooks** - 开箱即用的 `useRequest` 和 `useMutation`

## 🚀 快速开始

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

### 使用 React Hooks

#### useRequest - GET 请求

```typescript
import { useRequest } from '@/shared/lib/http-client';

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

#### useMutation - 变更操作

```typescript
import { useMutation, httpClient } from '@/shared/lib/http-client';

function CreateVideoScreen() {
  const { mutate, isLoading } = useMutation(
    async (data: CreateVideoInput) => {
      return httpClient.post<Video>('/api/v1/videos', data);
    },
    {
      onSuccess: (video) => {
        toast.show({ message: '视频创建成功' });
        router.push(`/videos/${video.id}`);
      },
      onError: (error) => {
        toast.show({ type: 'error', message: error.message });
      }
    }
  );

  const handleSubmit = (data: CreateVideoInput) => {
    mutate(data);
  };

  return <VideoForm onSubmit={handleSubmit} isLoading={isLoading} />;
}
```

## 🔧 高级用法

### 自定义超时

```typescript
const data = await httpClient.get('/api/v1/feed', {
  timeout: 30000 // 30秒
});
```

### 跳过认证（公开接口）

```typescript
const data = await httpClient.get('/api/v1/public/feed', {
  skipAuth: true
});
```

### 禁用重试

```typescript
const data = await httpClient.post('/api/v1/payment', paymentData, {
  retry: false // 支付接口不重试
});
```

### 自定义重试策略

```typescript
const data = await httpClient.get('/api/v1/feed', {
  retry: {
    maxRetries: 5,
    retryDelay: 2000,
    backoffMultiplier: 1.5,
    retryCondition: (error) => error.isServerError()
  }
});
```

### 请求取消

```typescript
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

## 🛡️ 错误处理

### 统一的错误类型

```typescript
import { ApiError } from '@/shared/lib/http-client';

try {
  const data = await httpClient.get('/api/v1/feed');
} catch (error) {
  if (error instanceof ApiError) {
    // 网络错误
    if (error.isNetworkError()) {
      toast.show({ type: 'error', message: '网络连接失败' });
    }

    // 认证错误
    else if (error.isAuthError()) {
      router.push('/auth/login');
    }

    // 服务器错误
    else if (error.isServerError()) {
      toast.show({ type: 'error', message: '服务器异常，请稍后重试' });
    }

    // 客户端错误
    else if (error.isClientError()) {
      toast.show({ type: 'error', message: error.message });
    }
  }
}
```

### 错误类型判断方法

| 方法 | 说明 | 返回 |
|------|------|------|
| `isNetworkError()` | 网络错误（离线、无法访问互联网等） | boolean |
| `isAuthError()` | 认证错误（401、403） | boolean |
| `isServerError()` | 服务器错误（5xx） | boolean |
| `isClientError()` | 客户端错误（4xx） | boolean |

## 🎯 拦截器

拦截器在 `src/shared/lib/http-client/interceptors/` 中自动加载：

### 内置拦截器

1. **认证拦截器** (`auth.ts`)
   - 自动注入 JWT Token
   - 支持 `skipAuth` 选项

2. **日志拦截器** (`logging.ts`)
   - 记录请求/响应
   - 慢请求告警（>3秒）

3. **性能监控拦截器** (`performance.ts`)
   - 监控请求耗时
   - 性能数据收集

### 自定义拦截器

```typescript
import { httpClient } from '@/shared/lib/http-client';

// 请求拦截器
httpClient.interceptors.request.use({
  onRequest: (config) => {
    // 添加自定义 header
    config.headers = {
      ...config.headers,
      'X-App-Version': '1.0.0'
    };
    return config;
  }
});

// 响应拦截器
httpClient.interceptors.response.use({
  onResponse: (response, data) => {
    // 数据转换
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data; // 自动解包
    }
    return data;
  },

  onResponseError: (error) => {
    // 全局错误处理
    if (error.isAuthError()) {
      EventEmitter.emit('auth:expired');
    }
  }
});
```

## 📁 项目结构

```
src/shared/lib/http-client/
├── core/              # 核心实现
│   ├── client.ts     # HttpClient 主类
│   ├── types.ts      # 类型定义
│   └── index.ts
│
├── interceptors/      # 拦截器系统
│   ├── auth.ts       # 认证拦截器
│   ├── logging.ts    # 日志拦截器
│   ├── performance.ts # 性能监控
│   └── index.ts      # 自动加载
│
├── hooks/            # React Hooks
│   ├── useRequest.ts # GET 请求 Hook
│   ├── useMutation.ts # 变更操作 Hook
│   └── index.ts
│
├── utils/            # 工具函数
│   ├── retry.ts      # 重试策略
│   ├── network.ts    # 网络检测
│   └── index.ts
│
├── constants.ts      # 常量配置
├── index.ts          # 统一导出
├── README.md         # 本文档
└── DESIGN.md         # 详细设计文档
```

## 🔍 类型定义

### RequestConfig

```typescript
interface RequestConfig extends RequestInit {
  url?: string;              // 请求 URL
  timeout?: number;          // 超时时间（毫秒）
  skipAuth?: boolean;        // 跳过认证
  checkNetwork?: boolean;    // 是否检查网络
  retry?: RetryConfig | false; // 重试配置
  metadata?: Record<string, any>; // 元数据
}
```

### RetryConfig

```typescript
interface RetryConfig {
  maxRetries: number;        // 最大重试次数
  retryDelay: number;        // 基础延迟（毫秒）
  backoffMultiplier?: number; // 指数退避系数
  retryCondition?: (error: ApiError) => boolean; // 重试条件
}
```

### ApiError

```typescript
class ApiError extends Error {
  message: string;   // 错误消息
  status: number;    // HTTP 状态码
  code: string;      // 错误代码
  details?: unknown; // 详细信息

  isNetworkError(): boolean;
  isAuthError(): boolean;
  isServerError(): boolean;
  isClientError(): boolean;
}
```

## 📚 常量配置

```typescript
import { HTTP_CLIENT_CONSTANTS } from '@/shared/lib/http-client';

HTTP_CLIENT_CONSTANTS.DEFAULT_TIMEOUT          // 10000 (10秒)
HTTP_CLIENT_CONSTANTS.DEFAULT_RETRY_COUNT      // 3
HTTP_CLIENT_CONSTANTS.DEFAULT_RETRY_DELAY      // 1000 (1秒)
HTTP_CLIENT_CONSTANTS.RETRY_BACKOFF_MULTIPLIER // 2
HTTP_CLIENT_CONSTANTS.SLOW_REQUEST_THRESHOLD   // 3000 (3秒)
```

## ❓ 常见问题

### Q: 如何配置 API Base URL？

A: 在 `src/shared/config/environment.ts` 中配置：

```typescript
// 开发环境
EXPO_PUBLIC_API_DEV_HOST=localhost
EXPO_PUBLIC_API_DEV_PORT=8000

// 生产环境
EXPO_PUBLIC_API_PROD_BASE_URL=https://api.example.com
```

### Q: Token 是如何自动刷新的？

A: Supabase SDK 会自动刷新 token，HTTP 客户端只需从 `entities/user` store 读取最新的 `accessToken`。无需手动刷新。

### Q: 如何处理全局错误？

A: 使用响应拦截器的 `onResponseError`:

```typescript
httpClient.interceptors.response.use({
  onResponseError: (error) => {
    if (error.isAuthError()) {
      // 跳转到登录页
      router.push('/auth/login');
    } else if (error.isNetworkError()) {
      // 显示离线提示
      toast.show({ type: 'error', message: '网络连接失败' });
    }
  }
});
```

### Q: useRequest 会自动执行请求吗？

A: **不会**。`useRequest` 只创建请求函数，需要手动调用 `execute()` 或 `refetch()` 来执行请求：

```typescript
const { execute } = useRequest('/api/v1/feed');

useEffect(() => {
  execute(); // 手动触发
}, [execute]);
```

### Q: 如何处理文件上传？

A: 当前版本不直接支持 `FormData`，可以这样处理：

```typescript
// 方式1: 直接使用 fetch
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/v1/upload', {
  method: 'POST',
  body: formData,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// 方式2: 扩展 httpClient（未来版本支持）
```

## 📖 相关文档

- [详细设计文档](./DESIGN.md) - 完整的架构设计和实现细节
- [修复总结](../../../docs/architecture/http-client-fix-summary.md) - 问题修复记录
- [正确性分析](../../../docs/architecture/http-client-correctness-analysis.md) - 实现分析

## 🤝 贡献

如需添加新功能或修复问题，请遵循以下原则：

1. **类型安全** - 必须通过 TypeScript 检查
2. **单一职责** - 每个模块职责清晰
3. **测试覆盖** - 为核心逻辑添加测试
4. **文档更新** - 更新相关文档

## 📝 更新日志

### v1.2.0 (2025-01-10)
- ✅ 修复认证逻辑重复问题
- ✅ 修复 Hook 依赖数组导致的重渲染
- ✅ 修复 AbortController 内存泄漏
- ✅ 改进重试逻辑边界情况
- ✅ 所有 P0/P1 问题已修复，生产就绪

### v1.1.0 (2025-01-10)
- ✅ 完整的文件结构实现
- ✅ 核心功能完成
- ✅ 拦截器系统
- ✅ React Hooks 集成

### v1.0.0 (2025-01-10)
- 🎉 初始版本发布
- ✅ 基础架构设计

---

**Made with ❤️ for React Native**
