# HTTP 客户端状态码与错误代码完整指南

## 目录

- [概述](#概述)
- [HTTP 状态码详解](#http-状态码详解)
  - [成功响应 (2xx)](#成功响应-2xx)
  - [客户端错误 (4xx)](#客户端错误-4xx)
  - [服务器错误 (5xx)](#服务器错误-5xx)
- [自定义错误代码](#自定义错误代码)
  - [网络相关错误](#网络相关错误)
  - [HTTP 相关错误](#http-相关错误)
  - [通用错误](#通用错误)
- [ApiError 类详解](#apierror-类详解)
- [错误处理最佳实践](#错误处理最佳实践)
- [自动重试机制](#自动重试机制)
- [常见问题排查](#常见问题排查)

---

## 概述

本应用使用统一的 HTTP 客户端 (`@/shared/lib/http-client`) 处理所有网络请求。每个错误都会被封装为 `ApiError` 对象，包含以下信息：

```typescript
class ApiError extends Error {
  message: string;   // 错误描述
  status: number;    // HTTP 状态码 (0 表示非 HTTP 错误)
  code: string;      // 自定义错误代码
  details?: unknown; // 附加错误详情
}
```

**核心特性**：
- ✅ 统一的错误结构
- ✅ 智能重试机制（网络错误、服务器错误、429）
- ✅ 指数退避策略
- ✅ 网络状态检测
- ✅ 请求超时控制（默认 10 秒）

---

## HTTP 状态码详解

### 成功响应 (2xx)

#### **200 OK**
- **含义**：请求成功
- **处理**：解析 JSON 响应体并返回数据
- **示例**：
  ```typescript
  // GET /api/v1/feed?count=10
  // Response: { videos: [...] }
  const data = await httpClient.get('/api/v1/feed?count=10');
  // data = { videos: [...] }
  ```

#### **204 No Content**
- **含义**：请求成功，但无响应内容
- **处理**：返回空对象 `{}`
- **示例**：
  ```typescript
  // DELETE /api/v1/user/123
  // Response: (empty)
  const data = await httpClient.delete('/api/v1/user/123');
  // data = {}
  ```

#### **其他 2xx (201, 202, 203 等)**
- **处理**：与 200 相同，解析 JSON 响应体

---

### 客户端错误 (4xx)

这类错误通常表示**客户端请求有误**，不会自动重试。

#### **400 Bad Request**
- **含义**：请求参数错误、格式错误
- **常见原因**：
  - 缺少必需参数
  - 参数类型错误
  - JSON 格式错误
- **重试**：❌ 否
- **处理建议**：检查请求参数，修复后重新发送
- **示例错误**：
  ```typescript
  {
    message: "Invalid parameter: count must be a positive integer",
    status: 400,
    code: "INVALID_PARAMETER",
    details: { field: "count", value: -1 }
  }
  ```

#### **401 Unauthorized**
- **含义**：未授权，缺少或无效的认证信息
- **常见原因**：
  - Token 过期
  - Token 无效
  - 未登录
- **重试**：❌ 否
- **识别方法**：`error.isAuthError() === true`
- **处理建议**：跳转到登录页面，重新获取 Token
- **示例错误**：
  ```typescript
  {
    message: "Token expired",
    status: 401,
    code: "TOKEN_EXPIRED",
    details: { expiredAt: "2024-10-06T10:00:00Z" }
  }
  ```

#### **403 Forbidden**
- **含义**：禁止访问，有认证但无权限
- **常见原因**：
  - 用户角色权限不足
  - 访问被禁止的资源
- **重试**：❌ 否
- **识别方法**：`error.isAuthError() === true`
- **处理建议**：显示权限不足提示，引导用户升级权限
- **示例错误**：
  ```typescript
  {
    message: "You don't have permission to access this resource",
    status: 403,
    code: "FORBIDDEN",
    details: { requiredRole: "admin", currentRole: "user" }
  }
  ```

#### **404 Not Found**
- **含义**：请求的资源不存在
- **常见原因**：
  - URL 路径错误
  - 资源已被删除
  - 资源 ID 不存在
- **重试**：❌ 否
- **处理建议**：显示"资源不存在"提示
- **示例错误**：
  ```typescript
  {
    message: "Video not found",
    status: 404,
    code: "RESOURCE_NOT_FOUND",
    details: { videoId: "abc123" }
  }
  ```

#### **408 Request Timeout**
- **含义**：请求超时（客户端超时，非服务器超时）
- **常见原因**：
  - 请求耗时超过 `timeout` 配置（默认 10 秒）
  - 网络缓慢
- **重试**：❌ 否（避免重复长时间等待）
- **错误代码**：`TIMEOUT_ERROR`
- **处理建议**：提示用户网络缓慢，建议稍后重试
- **示例错误**：
  ```typescript
  {
    message: "请求超时",
    status: 408,
    code: "TIMEOUT_ERROR",
    details: { timeout: 10000 }
  }
  ```

#### **429 Too Many Requests**
- **含义**：请求过于频繁，触发限流
- **常见原因**：
  - 短时间内发送过多请求
  - 超过 API 速率限制
- **重试**：✅ 是（自动重试，带指数退避）
- **处理建议**：等待一段时间后重试，或显示限流提示
- **示例错误**：
  ```typescript
  {
    message: "Rate limit exceeded",
    status: 429,
    code: "RATE_LIMIT_EXCEEDED",
    details: {
      limit: 100,
      remaining: 0,
      resetAt: "2024-10-06T11:00:00Z"
    }
  }
  ```

#### **其他 4xx (405, 409, 422 等)**
- **识别方法**：`error.isClientError() === true`
- **重试**：❌ 否
- **处理建议**：根据具体错误码和消息处理

---

### 服务器错误 (5xx)

这类错误表示**服务器内部错误**，会自动重试（最多 3 次）。

#### **500 Internal Server Error**
- **含义**：服务器内部错误
- **常见原因**：
  - 服务器代码异常
  - 数据库错误
  - 未处理的异常
- **重试**：✅ 是
- **识别方法**：`error.isServerError() === true`
- **示例错误**：
  ```typescript
  {
    message: "Internal server error",
    status: 500,
    code: "INTERNAL_ERROR"
  }
  ```

#### **502 Bad Gateway**
- **含义**：网关错误，上游服务器响应无效
- **常见原因**：
  - 负载均衡器无法连接到后端服务
  - 后端服务崩溃
- **重试**：✅ 是

#### **503 Service Unavailable**
- **含义**：服务暂时不可用
- **常见原因**：
  - 服务器维护
  - 服务器过载
  - 临时故障
- **重试**：✅ 是

#### **504 Gateway Timeout**
- **含义**：网关超时，上游服务器响应超时
- **常见原因**：
  - 后端服务响应缓慢
  - 数据库查询超时
- **重试**：✅ 是

#### **其他 5xx**
- **识别方法**：`error.isServerError() === true`
- **重试**：✅ 是
- **处理建议**：显示"服务器错误"提示，引导用户稍后重试

---

## 自定义错误代码

除了 HTTP 状态码，系统还定义了自定义错误代码用于特定场景。

### 网络相关错误

#### **NETWORK_ERROR**
- **含义**：网络请求失败（通用网络错误）
- **HTTP 状态码**：0（无 HTTP 响应）
- **常见原因**：
  - 无法连接到服务器
  - DNS 解析失败
  - 连接被拒绝
- **重试**：✅ 是
- **识别方法**：`error.isNetworkError() === true`
- **示例**：
  ```typescript
  {
    message: "网络请求失败",
    status: 0,
    code: "NETWORK_ERROR",
    details: { originalError: "Failed to fetch" }
  }
  ```

#### **NETWORK_OFFLINE**
- **含义**：设备未连接到网络
- **HTTP 状态码**：0
- **检测方式**：使用 `@react-native-community/netinfo` 检测
- **重试**：✅ 是（等待网络恢复后自动重试）
- **识别方法**：`error.isNetworkError() === true`
- **处理建议**：显示"网络未连接"提示
- **示例**：
  ```typescript
  {
    message: "网络未连接",
    status: 0,
    code: "NETWORK_OFFLINE"
  }
  ```

#### **NETWORK_UNREACHABLE**
- **含义**：已连接到网络，但无法访问互联网
- **HTTP 状态码**：0
- **检测方式**：`NetInfo.isInternetReachable === false`
- **重试**：✅ 是
- **识别方法**：`error.isNetworkError() === true`
- **处理建议**：显示"无法访问互联网"提示
- **示例**：
  ```typescript
  {
    message: "无法访问互联网",
    status: 0,
    code: "NETWORK_UNREACHABLE"
  }
  ```

#### **TIMEOUT_ERROR**
- **含义**：请求超时（客户端主动取消）
- **HTTP 状态码**：408
- **触发条件**：请求耗时超过 `timeout` 配置（默认 10000ms）
- **重试**：❌ 否（避免重复长时间等待）
- **处理建议**：提示用户网络缓慢
- **示例**：
  ```typescript
  {
    message: "请求超时",
    status: 408,
    code: "TIMEOUT_ERROR",
    details: { timeout: 10000 }
  }
  ```

---

### HTTP 相关错误

#### **HTTP_ERROR**
- **含义**：HTTP 错误的默认错误代码
- **HTTP 状态码**：对应的 HTTP 状态码
- **使用场景**：当后端未返回自定义 `code` 字段时的默认值
- **示例**：
  ```typescript
  {
    message: "请求失败 (400)",
    status: 400,
    code: "HTTP_ERROR"
  }
  ```

#### **PARSE_ERROR**
- **含义**：响应解析失败（JSON 解析错误）
- **HTTP 状态码**：对应的 HTTP 状态码
- **常见原因**：
  - 服务器返回非 JSON 格式数据
  - JSON 格式错误
  - 响应体不完整
- **处理建议**：记录错误，联系后端修复
- **示例**：
  ```typescript
  {
    message: "响应解析失败",
    status: 200,
    code: "PARSE_ERROR",
    details: { originalError: "Unexpected token < in JSON" }
  }
  ```

---

### 通用错误

#### **UNKNOWN_ERROR**
- **含义**：未知错误（兜底错误代码）
- **HTTP 状态码**：0 或对应的 HTTP 状态码
- **使用场景**：
  - 无法归类的异常
  - 意外的错误类型
- **处理建议**：记录完整错误信息，联系技术支持
- **示例**：
  ```typescript
  {
    message: "未知错误",
    status: 0,
    code: "UNKNOWN_ERROR",
    details: { originalError: "..." }
  }
  ```

---

## ApiError 类详解

`ApiError` 类提供了便捷的错误类型判断方法。

### 类定义

**位置**：`src/shared/lib/http-client/core/types.ts`

```typescript
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

  isNetworkError(): boolean;
  isAuthError(): boolean;
  isServerError(): boolean;
  isClientError(): boolean;
}
```

### 方法说明

#### **isNetworkError()**
判断是否为网络错误。

**返回 `true` 条件**：
- `code === 'NETWORK_ERROR'`
- `code === 'NETWORK_OFFLINE'`
- `code === 'NETWORK_UNREACHABLE'`

**使用场景**：
```typescript
if (error.isNetworkError()) {
  toast.show({
    type: 'error',
    title: '网络错误',
    message: '请检查网络连接后重试'
  });
}
```

---

#### **isAuthError()**
判断是否为认证错误。

**返回 `true` 条件**：
- `status === 401` (未授权)
- `status === 403` (禁止访问)

**使用场景**：
```typescript
if (error.isAuthError()) {
  // 清除本地 token
  await signOut();
  // 跳转到登录页
  navigation.navigate('Login');
}
```

---

#### **isServerError()**
判断是否为服务器错误。

**返回 `true` 条件**：
- `status >= 500 && status < 600`

**使用场景**：
```typescript
if (error.isServerError()) {
  toast.show({
    type: 'error',
    title: '服务器错误',
    message: '服务暂时不可用，请稍后重试'
  });
}
```

---

#### **isClientError()**
判断是否为客户端错误。

**返回 `true` 条件**：
- `status >= 400 && status < 500`

**使用场景**：
```typescript
if (error.isClientError()) {
  // 记录客户端错误，可能是代码逻辑问题
  logger.error('Client error', { error });
}
```

---

## 错误处理最佳实践

### 1. 统一错误处理

```typescript
import { ApiError } from '@/shared/lib/http-client';
import { toast } from '@/shared/lib/toast';

try {
  const data = await httpClient.get('/api/v1/feed?count=10');
  // 处理成功响应
} catch (error) {
  if (error instanceof ApiError) {
    // 网络错误
    if (error.isNetworkError()) {
      toast.show({
        type: 'error',
        title: '网络错误',
        message: '请检查网络连接后重试'
      });
      return;
    }

    // 认证错误
    if (error.isAuthError()) {
      // 跳转到登录页
      navigation.navigate('Login');
      return;
    }

    // 服务器错误
    if (error.isServerError()) {
      toast.show({
        type: 'error',
        title: '服务器错误',
        message: '服务暂时不可用，请稍后重试'
      });
      return;
    }

    // 客户端错误
    if (error.isClientError()) {
      toast.show({
        type: 'error',
        title: '请求错误',
        message: error.message
      });
      return;
    }

    // 其他错误
    toast.show({
      type: 'error',
      title: '错误',
      message: error.message
    });
  } else {
    // 非 ApiError
    console.error('Unexpected error:', error);
  }
}
```

---

### 2. 特定错误处理

```typescript
try {
  const data = await httpClient.get('/api/v1/user/profile');
} catch (error) {
  if (error instanceof ApiError) {
    // 根据错误代码精确处理
    switch (error.code) {
      case 'NETWORK_OFFLINE':
        toast.show({
          type: 'warning',
          title: '网络未连接',
          message: '请检查您的网络连接'
        });
        break;

      case 'TOKEN_EXPIRED':
        // 刷新 token
        await refreshToken();
        // 重试请求
        return httpClient.get('/api/v1/user/profile');

      case 'RATE_LIMIT_EXCEEDED':
        const resetAt = error.details?.resetAt;
        toast.show({
          type: 'warning',
          title: '请求过于频繁',
          message: `请在 ${resetAt} 后重试`
        });
        break;

      default:
        toast.show({
          type: 'error',
          message: error.message
        });
    }
  }
}
```

---

### 3. 使用 React Hooks

```typescript
import { useRequest } from '@/shared/lib/http-client';

function FeedList() {
  const { data, loading, error, execute } = useRequest(
    () => httpClient.get('/api/v1/feed?count=10'),
    {
      immediate: true,
      onError: (error) => {
        if (error.isAuthError()) {
          navigation.navigate('Login');
        } else if (error.isNetworkError()) {
          toast.show({
            type: 'error',
            title: '网络错误',
            message: '请检查网络连接'
          });
        }
      }
    }
  );

  if (loading) return <Loading />;
  if (error) return <ErrorView error={error} onRetry={execute} />;
  return <FeedListView data={data} />;
}
```

---

### 4. 后台加载错误处理

对于后台加载（如预加载、字幕加载），避免显示侵入性提示：

```typescript
loadSubtitle(video.id, {
  autoStore: true,
  background: true,  // 标记为后台加载
  onSuccess: () => {
    log('feed-page', LogType.INFO, `Subtitle loaded for video ${video.id}`);
  },
  onError: (error) => {
    // 后台加载失败：只记录日志，不显示 toast
    log('feed-page', LogType.WARNING,
      `Failed to load subtitle for video ${video.id}: ${error.message}`
    );

    // 可选：显示不侵入的提示
    if (error.isNetworkError()) {
      toast.show({
        type: 'info',
        title: '字幕加载失败',
        message: '视频可以正常播放，字幕暂不可用',
        duration: 2000  // 短暂提示
      });
    }
  }
});
```

---

## 自动重试机制

### 重试策略

**位置**：`src/shared/lib/http-client/core/client.ts`

```typescript
defaultRetryConfig: RetryConfig = {
  maxRetries: 3,              // 最大重试 3 次
  retryDelay: 1000,           // 基础延迟 1 秒
  backoffMultiplier: 2,       // 指数退避系数
  retryCondition: (error) => {
    // 不重试超时错误
    if (error.code === 'TIMEOUT_ERROR') {
      return false;
    }

    // 重试条件：
    // - 网络错误
    // - 服务器错误 (5xx)
    // - 429 Too Many Requests
    return (
      error.isNetworkError() ||
      error.isServerError() ||
      error.status === 429
    );
  }
}
```

### 重试延迟计算

使用**指数退避**策略：

| 重试次数 | 延迟计算 | 实际延迟 |
|---------|---------|---------|
| 第 1 次 | 1000 × 2^0 | 1 秒 |
| 第 2 次 | 1000 × 2^1 | 2 秒 |
| 第 3 次 | 1000 × 2^2 | 4 秒 |

**总耗时**：最多 7 秒（不包括请求本身的时间）

### 重试场景示例

#### ✅ **会重试的错误**

```typescript
// 1. 网络错误
{
  status: 0,
  code: "NETWORK_ERROR"  // ✅ 重试
}

// 2. 服务器错误
{
  status: 500,
  code: "INTERNAL_ERROR"  // ✅ 重试
}

// 3. 限流错误
{
  status: 429,
  code: "RATE_LIMIT_EXCEEDED"  // ✅ 重试
}
```

#### ❌ **不会重试的错误**

```typescript
// 1. 超时错误
{
  status: 408,
  code: "TIMEOUT_ERROR"  // ❌ 不重试
}

// 2. 认证错误
{
  status: 401,
  code: "UNAUTHORIZED"  // ❌ 不重试
}

// 3. 客户端错误
{
  status: 400,
  code: "BAD_REQUEST"  // ❌ 不重试
}
```

### 禁用重试

```typescript
// 单个请求禁用重试
const data = await httpClient.get('/api/v1/feed', {
  retry: false
});

// 自定义重试配置
const data = await httpClient.get('/api/v1/feed', {
  retry: {
    maxRetries: 1,
    retryDelay: 500
  }
});
```

---

## 常见问题排查

### Q1: 请求一直超时，怎么办？

**症状**：请求总是在 10 秒后返回 `TIMEOUT_ERROR`

**可能原因**：
1. 网络缓慢
2. 服务器响应慢
3. 超时时间设置过短

**解决方案**：
```typescript
// 增加超时时间
const data = await httpClient.get('/api/v1/large-data', {
  timeout: 30000  // 30 秒
});
```

---

### Q2: 为什么 401 错误不会自动重试？

**原因**：认证错误（401/403）通常是 token 过期或无效，重试相同的请求不会成功。

**正确做法**：
1. 刷新 token
2. 重新发起请求

```typescript
try {
  const data = await httpClient.get('/api/v1/protected-resource');
} catch (error) {
  if (error instanceof ApiError && error.status === 401) {
    // 刷新 token
    await refreshToken();
    // 重新请求
    const data = await httpClient.get('/api/v1/protected-resource');
  }
}
```

---

### Q3: 如何判断错误是否可以重试？

**方法 1**：使用 `retryCondition` 判断

```typescript
const retryCondition = (error: ApiError) => {
  return (
    error.isNetworkError() ||
    error.isServerError() ||
    error.status === 429
  );
};

if (retryCondition(error)) {
  // 可以重试
}
```

**方法 2**：检查错误类型

```typescript
if (error instanceof ApiError) {
  if (error.code === 'TIMEOUT_ERROR') {
    // 不要自动重试，提示用户手动重试
  } else if (error.isNetworkError()) {
    // 可以重试
  }
}
```

---

### Q4: 为什么看到了 3 次相同的错误日志？

**原因**：默认重试 3 次，每次失败都会记录日志。

**解决方案**：这是正常行为。如果不希望看到重试日志，可以：
1. 禁用重试：`retry: false`
2. 过滤日志级别：只记录最终失败

---

### Q5: 后端返回了自定义错误代码，如何访问？

**后端响应**：
```json
{
  "message": "Invalid video ID",
  "code": "INVALID_VIDEO_ID",
  "details": {
    "videoId": "abc123",
    "reason": "Video not found in database"
  }
}
```

**访问方式**：
```typescript
try {
  const data = await httpClient.get('/api/v1/video/abc123');
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.code);     // "INVALID_VIDEO_ID"
    console.log(error.message);  // "Invalid video ID"
    console.log(error.details);  // { videoId: "abc123", ... }
  }
}
```

---

## 附录

### 错误代码快速查询表

| 错误代码 | 状态码 | 重试 | 含义 |
|---------|--------|------|------|
| `NETWORK_ERROR` | 0 | ✅ | 网络请求失败 |
| `NETWORK_OFFLINE` | 0 | ✅ | 网络未连接 |
| `NETWORK_UNREACHABLE` | 0 | ✅ | 无法访问互联网 |
| `TIMEOUT_ERROR` | 408 | ❌ | 请求超时 |
| `HTTP_ERROR` | 4xx/5xx | 取决于状态码 | 通用 HTTP 错误 |
| `PARSE_ERROR` | 2xx | ❌ | 响应解析失败 |
| `UNKNOWN_ERROR` | 0 | ❌ | 未知错误 |

### HTTP 状态码快速查询表

| 状态码 | 分类 | 重试 | 常见场景 |
|--------|------|------|----------|
| 200 | 成功 | - | 请求成功 |
| 204 | 成功 | - | 删除成功 |
| 400 | 客户端错误 | ❌ | 参数错误 |
| 401 | 客户端错误 | ❌ | 未授权 |
| 403 | 客户端错误 | ❌ | 无权限 |
| 404 | 客户端错误 | ❌ | 资源不存在 |
| 408 | 客户端错误 | ❌ | 请求超时 |
| 429 | 客户端错误 | ✅ | 限流 |
| 500 | 服务器错误 | ✅ | 服务器错误 |
| 502 | 服务器错误 | ✅ | 网关错误 |
| 503 | 服务器错误 | ✅ | 服务不可用 |
| 504 | 服务器错误 | ✅ | 网关超时 |

---

**最后更新**：2024-10-06
**维护者**：开发团队
**相关文档**：
- [HTTP 客户端使用指南](./http-client-usage.md)
- [API 开发规范](./api-development-guide.md)
