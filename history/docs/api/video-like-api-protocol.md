# 视频点赞 API 前后端交互协议

## 目录

- [概述](#概述)
- [认证机制](#认证机制)
- [API 端点](#api-端点)
- [数据类型定义](#数据类型定义)
- [错误响应](#错误响应)
- [完整示例](#完整示例)

---

## 概述

视频点赞 API 提供用户对视频进行点赞和取消点赞的服务。点赞状态与用户账号关联，同一用户对同一视频只能点赞一次。

**基础信息**：
- **Base URL**: `https://api.example.com` (生产环境)
- **协议**: HTTPS
- **数据格式**: JSON
- **编码**: UTF-8
- **认证方式**: Bearer Token（必需）

**业务规则**：
- 每个用户对每个视频只能点赞一次
- 重复点赞返回成功（幂等性）
- 取消不存在的点赞返回成功（幂等性）
- 点赞状态实时生效，影响视频元数据 API 返回的 `isLiked` 字段

---

## 认证机制

所有 API 请求都**必须**在 HTTP Header 中包含有效的 Bearer Token。

### 请求头格式

```http
Authorization: Bearer <access_token>
```

### 认证失败

如果 Token 缺失、过期或无效，服务器将返回 `401 Unauthorized` 或 `403 Forbidden`。

**客户端处理**：
- 401 错误：清除本地 Token，跳转到登录页
- 403 错误：提示权限不足

---

## API 端点

### **POST** `/api/v1/videos/{videoId}/like`

对指定视频进行点赞。

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `videoId` | `string` | 是 | 视频唯一标识符 | `1video_1728234567890_abc123def456_ghi789` |

**参数约束**：
- `videoId` 必须为非空字符串
- `videoId` 必须是系统中存在的视频 ID

#### 请求示例

```http
POST /api/v1/videos/1video_1728234567890_abc123def456_ghi789/like HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Content-Length: 0
```

**注意**：
- 请求体为空（Content-Length: 0）
- 必须包含 Content-Type 头

#### 响应格式

**成功响应** - HTTP 200 OK

```json
{
  "success": true,
  "message": "Video liked successfully",
  "data": {
    "videoId": "string",
    "isLiked": true,
    "likeCount": 123
  }
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `success` | `boolean` | 是 | 操作是否成功 |
| `message` | `string` | 是 | 操作结果描述 |
| `data.videoId` | `string` | 是 | 视频 ID |
| `data.isLiked` | `boolean` | 是 | 当前点赞状态（总是 `true`） |
| `data.likeCount` | `number` | 是 | 该视频的总点赞数 |

#### 响应状态码

| 状态码 | 说明 | 客户端处理 |
|--------|------|------------|
| **200** | 点赞成功 | 更新 UI 状态 |
| **400** | 参数错误（videoId 格式无效） | 显示错误提示 |
| **401** | 未授权 | 跳转到登录页 |
| **403** | 权限不足 | 显示权限不足提示 |
| **404** | 视频不存在 | 显示"视频不存在"提示 |
| **429** | 请求过于频繁 | 等待后重试（自动） |
| **500** | 服务器错误 | 自动重试（最多 3 次） |
| **502** | 网关错误 | 自动重试（最多 3 次） |
| **503** | 服务不可用 | 自动重试（最多 3 次） |

---

### **DELETE** `/api/v1/videos/{videoId}/like`

取消对指定视频的点赞。

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `videoId` | `string` | 是 | 视频唯一标识符 | `1video_1728234567890_abc123def456_ghi789` |

**参数约束**：
- `videoId` 必须为非空字符串
- `videoId` 必须是系统中存在的视频 ID

#### 请求示例

```http
DELETE /api/v1/videos/1video_1728234567890_abc123def456_ghi789/like HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应格式

**成功响应** - HTTP 200 OK

```json
{
  "success": true,
  "message": "Like removed successfully",
  "data": {
    "videoId": "string",
    "isLiked": false,
    "likeCount": 122
  }
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `success` | `boolean` | 是 | 操作是否成功 |
| `message` | `string` | 是 | 操作结果描述 |
| `data.videoId` | `string` | 是 | 视频 ID |
| `data.isLiked` | `boolean` | 是 | 当前点赞状态（总是 `false`） |
| `data.likeCount` | `number` | 是 | 该视频的总点赞数 |

#### 响应状态码

| 状态码 | 说明 | 客户端处理 |
|--------|------|------------|
| **200** | 取消点赞成功 | 更新 UI 状态 |
| **400** | 参数错误（videoId 格式无效） | 显示错误提示 |
| **401** | 未授权 | 跳转到登录页 |
| **403** | 权限不足 | 显示权限不足提示 |
| **404** | 视频不存在 | 显示"视频不存在"提示 |
| **429** | 请求过于频繁 | 等待后重试（自动） |
| **500** | 服务器错误 | 自动重试（最多 3 次） |
| **502** | 网关错误 | 自动重试（最多 3 次） |
| **503** | 服务不可用 | 自动重试（最多 3 次） |

---

## 数据类型定义

### LikeActionResponse

点赞/取消点赞操作的响应数据结构。

```typescript
interface LikeActionResponse {
  /** 操作是否成功 */
  success: boolean;

  /** 操作结果描述 */
  message: string;

  /** 响应数据 */
  data: {
    /** 视频 ID */
    videoId: string;

    /** 当前用户对该视频的点赞状态 */
    isLiked: boolean;

    /** 该视频的总点赞数 */
    likeCount: number;
  };
}
```

**字段详解**：

#### `success` - 操作状态
- **格式**：布尔值
- **说明**：
  - `true`：操作成功
  - `false`：操作失败（实际上失败会返回错误响应，不会有此字段为 false 的情况）

#### `message` - 结果描述
- **格式**：UTF-8 字符串
- **示例**：
  - 点赞成功：`"Video liked successfully"`
  - 取消点赞：`"Like removed successfully"`
  - 重复点赞：`"Video already liked"` (仍返回 200)

#### `data.videoId` - 视频 ID
- **格式**：字符串
- **示例**：`"1video_1728234567890_abc123def456_ghi789"`
- **说明**：与请求中的 videoId 一致

#### `data.isLiked` - 点赞状态
- **格式**：布尔值
- **说明**：
  - POST 请求后：总是 `true`
  - DELETE 请求后：总是 `false`
  - 用于客户端验证操作是否生效

#### `data.likeCount` - 点赞总数
- **格式**：非负整数
- **说明**：
  - 该视频的总点赞数
  - 实时更新，包含当前操作的影响
  - 最小值为 0
- **用途**：
  - 显示视频点赞数
  - 计算点赞增长趋势

---

## 错误响应

所有错误响应遵循统一格式。

### 错误响应格式

```json
{
  "message": "string",
  "code": "string",
  "details": {}
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `message` | `string` | 是 | 人类可读的错误描述 |
| `code` | `string` | 是 | 错误代码（用于程序判断） |
| `details` | `object` | 否 | 错误详细信息（可选） |

### 常见错误示例

#### 400 - 参数错误

```json
{
  "message": "Invalid video ID format",
  "code": "INVALID_PARAMETER",
  "details": {
    "parameter": "videoId",
    "value": "invalid-id",
    "expected": "string matching pattern: ^[0-9]video_.*"
  }
}
```

#### 401 - Token 过期

```json
{
  "message": "Token has expired",
  "code": "TOKEN_EXPIRED",
  "details": {
    "expiredAt": "2024-10-06T10:00:00Z"
  }
}
```

#### 404 - 视频不存在

```json
{
  "message": "Video not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": {
    "videoId": "1video_1728234567890_abc123def456_ghi789"
  }
}
```

#### 429 - 限流

```json
{
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "remaining": 0,
    "resetAt": "2024-10-06T11:00:00Z"
  }
}
```

#### 500 - 服务器错误

```json
{
  "message": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

### 错误代码列表

| 错误代码 | HTTP 状态码 | 说明 | 客户端处理 |
|---------|------------|------|------------|
| `INVALID_PARAMETER` | 400 | videoId 格式无效 | 显示错误提示 |
| `TOKEN_EXPIRED` | 401 | Token 已过期 | 跳转登录页 |
| `INVALID_TOKEN` | 401 | Token 无效 | 跳转登录页 |
| `INSUFFICIENT_PERMISSIONS` | 403 | 权限不足 | 显示权限提示 |
| `RESOURCE_NOT_FOUND` | 404 | 视频不存在 | 显示"视频不存在"提示 |
| `RATE_LIMIT_EXCEEDED` | 429 | 超过速率限制 | 等待后重试 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 | 自动重试 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 | 自动重试 |

---

## 完整示例

### 示例 1：点赞成功（首次点赞）

**请求**：
```http
POST /api/v1/videos/1video_1728234567890_abc123def456_ghi789/like HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Content-Length: 0
```

**响应**：
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 180

{
  "success": true,
  "message": "Video liked successfully",
  "data": {
    "videoId": "1video_1728234567890_abc123def456_ghi789",
    "isLiked": true,
    "likeCount": 1234
  }
}
```

**客户端处理**：
- 更新 UI 显示点赞状态（高亮点赞按钮）
- 更新点赞数显示为 1234
- 更新本地缓存中的 `isLiked` 状态

---

### 示例 2：重复点赞（幂等性）

**请求**：
```http
POST /api/v1/videos/1video_1728234567890_abc123def456_ghi789/like HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Content-Length: 0
```

**响应**：
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 180

{
  "success": true,
  "message": "Video already liked",
  "data": {
    "videoId": "1video_1728234567890_abc123def456_ghi789",
    "isLiked": true,
    "likeCount": 1234
  }
}
```

**说明**：
- 重复点赞返回 200 成功（幂等操作）
- `likeCount` 不增加
- `message` 提示"已点赞"

---

### 示例 3：取消点赞成功

**请求**：
```http
DELETE /api/v1/videos/1video_1728234567890_abc123def456_ghi789/like HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应**：
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 180

{
  "success": true,
  "message": "Like removed successfully",
  "data": {
    "videoId": "1video_1728234567890_abc123def456_ghi789",
    "isLiked": false,
    "likeCount": 1233
  }
}
```

**客户端处理**：
- 更新 UI 显示未点赞状态（取消点赞按钮高亮）
- 更新点赞数显示为 1233
- 更新本地缓存中的 `isLiked` 状态

---

### 示例 4：取消不存在的点赞（幂等性）

**请求**：
```http
DELETE /api/v1/videos/1video_1728234567890_abc123def456_ghi789/like HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应**：
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 180

{
  "success": true,
  "message": "Like not found, no action taken",
  "data": {
    "videoId": "1video_1728234567890_abc123def456_ghi789",
    "isLiked": false,
    "likeCount": 1233
  }
}
```

**说明**：
- 取消不存在的点赞返回 200 成功（幂等操作）
- `likeCount` 不变化
- `message` 提示"未找到点赞记录"

---

### 示例 5：视频不存在

**请求**：
```http
POST /api/v1/videos/999video_nonexistent/like HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Content-Length: 0
```

**响应**：
```http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{
  "message": "Video not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": {
    "videoId": "999video_nonexistent"
  }
}
```

**客户端处理**：
- 显示"视频不存在"提示
- 不更新 UI 状态
- 不进行重试

---

### 示例 6：认证失败

**请求**：
```http
POST /api/v1/videos/1video_1728234567890_abc123def456_ghi789/like HTTP/1.1
Host: api.example.com
Authorization: Bearer invalid_token_here
Content-Type: application/json
Content-Length: 0
```

**响应**：
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8

{
  "message": "Token has expired",
  "code": "TOKEN_EXPIRED",
  "details": {
    "expiredAt": "2024-10-06T10:00:00Z"
  }
}
```

**客户端处理**：
- 清除本地存储的 Token
- 跳转到登录页
- 不进行重试

---

### 示例 7：限流

**请求**：
```http
POST /api/v1/videos/1video_1728234567890_abc123def456_ghi789/like HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Content-Length: 0
```

**响应**：
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json; charset=utf-8
Retry-After: 60

{
  "message": "Rate limit exceeded. Please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "remaining": 0,
    "resetAt": "2024-10-06T11:00:00Z",
    "retryAfter": 60
  }
}
```

**客户端处理**：
- 自动等待 `retryAfter` 秒后重试
- 使用指数退避策略（1s → 2s → 4s）
- 最多重试 3 次

---

## 客户端实现要点

### 1. 乐观更新策略

为了提供最佳用户体验，建议使用乐观更新：先更新 UI，再发送请求，失败时回滚。

**实现示例**：
```typescript
async function toggleLike(videoId: string, currentIsLiked: boolean) {
  // 1. 乐观更新 UI（立即响应）
  const newIsLiked = !currentIsLiked;
  updateUI(videoId, {
    isLiked: newIsLiked,
    likeCount: currentLikeCount + (newIsLiked ? 1 : -1)
  });

  try {
    // 2. 发送 API 请求
    const response = newIsLiked
      ? await likeVideo(videoId)
      : await unlikeVideo(videoId);

    // 3. 使用服务器返回的真实数据更新 UI
    updateUI(videoId, {
      isLiked: response.data.isLiked,
      likeCount: response.data.likeCount
    });

    // 4. 更新本地缓存
    updateCache(videoId, { isLiked: response.data.isLiked });

  } catch (error) {
    // 5. 失败时回滚 UI
    updateUI(videoId, {
      isLiked: currentIsLiked,
      likeCount: currentLikeCount
    });

    // 6. 显示错误提示
    if (error.isAuthError()) {
      navigation.navigate('Login');
    } else {
      toast.error('操作失败，请重试');
    }
  }
}
```

### 2. 幂等性处理

**重要**：本 API 具有幂等性，重复操作不会产生副作用。

- 重复点赞：返回 200，`likeCount` 不增加
- 重复取消点赞：返回 200，`likeCount` 不减少

**客户端无需担心重复请求**：
```typescript
// ✅ 安全：即使网络抖动导致重复请求，也不会有副作用
await likeVideo(videoId);
await likeVideo(videoId); // 第二次调用不会增加点赞数
```

### 3. 缓存同步

点赞/取消点赞后，需要同步更新相关缓存：

**需要更新的缓存**：
- 视频元数据缓存（`isLiked` 字段）
- 点赞列表缓存
- Feed 流缓存

**实现示例**：
```typescript
async function likeVideo(videoId: string) {
  const response = await httpClient.post<LikeActionResponse>(
    `/api/v1/videos/${videoId}/like`
  );

  // 更新视频元数据缓存
  updateVideoMetaCache(videoId, {
    isLiked: response.data.isLiked,
    likeCount: response.data.likeCount
  });

  // 更新点赞列表缓存
  addToLikedVideos(videoId);

  // 触发 Feed 流重新渲染
  invalidateFeedCache();

  return response;
}
```

### 4. 错误处理

**认证错误**（401/403）：
```typescript
if (error.isAuthError()) {
  await clearToken();
  navigation.navigate('Login');
}
```

**视频不存在**（404）：
```typescript
if (error.statusCode === 404) {
  toast.show({
    type: 'error',
    title: '视频不存在',
    message: '该视频可能已被删除'
  });
  navigation.goBack();
}
```

**网络错误**：
```typescript
if (error.isNetworkError()) {
  toast.show({
    type: 'error',
    title: '网络错误',
    message: '请检查网络连接后重试'
  });
  // 不回滚 UI，让用户手动重试
}
```

### 5. 重试策略

**自动重试的场景**：
- 网络错误（NETWORK_ERROR, NETWORK_OFFLINE）
- 服务器错误（5xx）
- 限流错误（429）

**不重试的场景**：
- 参数错误（400）
- 认证错误（401, 403）
- 视频不存在（404）

**重试配置**：
```typescript
{
  maxRetries: 3,           // 最多重试 3 次
  retryDelay: 1000,        // 初始延迟 1 秒
  backoffMultiplier: 2,    // 指数退避系数
  timeout: 10000           // 请求超时 10 秒
}
```

### 6. 防抖处理

避免用户快速点击导致的重复请求：

```typescript
import { debounce } from 'lodash';

const debouncedToggleLike = debounce(
  async (videoId: string, isLiked: boolean) => {
    // 执行点赞/取消点赞逻辑
  },
  300, // 300ms 防抖
  { leading: true, trailing: false } // 立即执行第一次，忽略后续
);
```

### 7. 离线支持

**可选**：支持离线点赞，网络恢复后同步

```typescript
// 离线时保存到本地队列
if (!isOnline) {
  await saveToOfflineQueue({
    action: 'like',
    videoId,
    timestamp: Date.now()
  });

  // 乐观更新 UI
  updateUI(videoId, { isLiked: true });
  return;
}

// 网络恢复后同步
onNetworkRestore(async () => {
  const queue = await getOfflineQueue();
  for (const item of queue) {
    await syncLikeAction(item);
  }
});
```

---

## RESTful API 设计说明

### 为什么使用路径参数？

本 API 使用 `/api/v1/videos/{videoId}/like` 的设计，原因如下：

#### 1. 表达资源层级关系
点赞是对**特定视频**的操作，路径参数清晰表达这种关系：

```
✅ POST /videos/123/like        表达："对视频 123 进行点赞"
❌ POST /likes?video_id=123     表达："创建一个点赞，视频 ID 是 123"
```

#### 2. RESTful 语义准确
```
POST   /videos/123/like         ← 点赞视频 123
DELETE /videos/123/like         ← 取消点赞视频 123
POST   /videos/123/favorite     ← 收藏视频 123
DELETE /videos/123/favorite     ← 取消收藏视频 123
```
所有操作都针对"视频 123"这个资源。

#### 3. 符合行业标准
主流 API 都采用类似设计：

```
GitHub:   PUT    /user/starred/{owner}/{repo}
          DELETE /user/starred/{owner}/{repo}

Twitter:  POST   /tweets/{id}/like
          DELETE /tweets/{id}/like

YouTube:  POST   /videos/{videoId}/like
          DELETE /videos/{videoId}/like
```

### 为什么使用 POST 和 DELETE？

**POST** - 创建点赞记录
- 语义：创建一个新的点赞关系
- 幂等性：✅ 重复点赞返回相同结果

**DELETE** - 删除点赞记录
- 语义：删除已存在的点赞关系
- 幂等性：✅ 重复取消点赞返回相同结果

**为什么不用 PUT？**
- PUT 通常用于"替换整个资源"
- 点赞是"创建/删除"关系，不是"替换"
- POST + DELETE 语义更清晰

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2024-10-06 | 初始版本 |

---

## 相关文档

- [HTTP 状态码与错误代码完整指南](./http-status-codes.md)
- [Feed API 文档](./feed-api-protocol.md)
- [视频元数据 API 文档](./video-meta-api-protocol.md)
- [视频字幕 API 文档](./subtitle-api-protocol.md)
- [视频收藏 API 文档](./video-favorite-api-protocol.md)
- [认证 API 文档](./auth-api-protocol.md)

---

**最后更新**：2024-10-06
**维护者**：开发团队
**联系方式**：dev-team@example.com
