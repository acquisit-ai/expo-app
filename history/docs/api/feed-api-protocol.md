# Feed API 前后端交互协议

## 目录

- [概述](#概述)
- [认证机制](#认证机制)
- [API 端点](#api-端点)
- [数据类型定义](#数据类型定义)
- [错误响应](#错误响应)
- [完整示例](#完整示例)

---

## 概述

Feed API 提供视频内容流的获取服务，支持分页加载、下拉刷新等功能。

**基础信息**：
- **Base URL**: `https://api.example.com` (生产环境)
- **协议**: HTTPS
- **数据格式**: JSON
- **编码**: UTF-8
- **认证方式**: Bearer Token

---

## 认证机制

所有 API 请求都需要在 HTTP Header 中包含有效的 Bearer Token。

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

### **GET** `/api/v1/feed`

获取视频内容流列表。

#### 请求参数

| 参数名 | 类型 | 位置 | 必填 | 说明 | 默认值 | 示例 |
|--------|------|------|------|------|--------|------|
| `count` | `integer` | Query | 是 | 请求的视频数量 | - | `10` |

**参数约束**：
- `count` 必须为正整数（> 0）
- 建议范围：1-50
- 超出范围时服务器可能调整为合理值

#### 请求示例

```http
GET /api/v1/feed?count=10 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

#### 响应格式

**成功响应** - HTTP 200 OK

```json
{
  "videos": [
    {
      "id": "string",
      "title": "string",
      "tags": ["string"],
      "description": "string",
      "thumbnail_url": "string",
      "video_url": "string",
      "duration": 123
    }
  ]
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `videos` | `array` | 是 | 视频列表 |
| `videos[].id` | `string` | 是 | 视频唯一标识符，可用于请求字幕 |
| `videos[].title` | `string` | 是 | 视频标题 |
| `videos[].tags` | `array<string>` | 是 | 视频标签/关键词列表 |
| `videos[].description` | `string` | 是 | 视频描述/简介 |
| `videos[].thumbnail_url` | `string` | 是 | 视频缩略图 URL |
| `videos[].video_url` | `string` | 是 | 视频播放地址（HLS 格式） |
| `videos[].duration` | `number` | 是 | 视频时长（秒），支持小数 |

#### 响应状态码

| 状态码 | 说明 | 客户端处理 |
|--------|------|------------|
| **200** | 成功 | 正常处理数据 |
| **400** | 参数错误 | 显示错误提示，不重试 |
| **401** | 未授权 | 跳转到登录页 |
| **403** | 权限不足 | 显示权限不足提示 |
| **429** | 请求过于频繁 | 等待后重试（自动） |
| **500** | 服务器错误 | 自动重试（最多 3 次） |
| **502** | 网关错误 | 自动重试（最多 3 次） |
| **503** | 服务不可用 | 自动重试（最多 3 次） |

---

## 数据类型定义

### VideoMetaData

视频元数据核心数据结构。

```typescript
interface VideoMetaData {
  /** 视频唯一标识符，可用于请求字幕 */
  readonly id: string;

  /** 视频标题 */
  readonly title: string;

  /** 标签/关键词列表 */
  readonly tags: string[];

  /** 视频简介/描述 */
  readonly description: string;

  /** 视频缩略图 URL */
  readonly thumbnail_url: string;

  /** 视频文件 URL（HLS 格式） */
  readonly video_url: string;

  /** 视频时长（秒），支持小数（如 123.456 秒） */
  readonly duration: number;
}
```

**字段详解**：

#### `id` - 视频 ID
- **格式**：字符串，建议使用 UUID 或带前缀的唯一标识符
- **示例**：`"1video_1728234567890_abc123def456_ghi789"`
- **用途**：
  - 客户端缓存键
  - 字幕关联
  - 播放记录追踪

#### `title` - 标题
- **格式**：UTF-8 字符串
- **长度**：建议 1-200 字符
- **示例**：`"商务英语对话 - 第123课"`

#### `description` - 描述
- **格式**：UTF-8 字符串，支持换行符
- **长度**：建议 1-1000 字符
- **示例**：`"本课程介绍商务场景中的常用对话技巧..."`

#### `thumbnail_url` - 缩略图 URL
- **格式**：HTTPS URL，指向视频缩略图
- **示例**：`"https://picsum.photos/seed/video1/640/360"`
- **要求**：
  - 必须是可公开访问的 HTTPS URL
  - 支持常见图片格式（JPEG, PNG, WebP）
  - 建议尺寸：640x360 或更高（16:9 比例）
  - 支持 CORS（允许客户端跨域请求）
- **用途**：
  - 视频列表缩略图
  - 播放器加载前的占位图
  - 分享卡片预览图

#### `video_url` - 视频地址
- **格式**：HTTPS URL，指向 HLS playlist (m3u8)
- **示例**：`"https://storage.googleapis.com/demo-videos/video123_hls/playlist.m3u8"`
- **要求**：
  - 必须是可公开访问的 HTTPS URL
  - 必须是 HLS 格式（.m3u8）
  - 支持 CORS（允许客户端跨域请求）

#### `tags` - 标签
- **格式**：字符串数组
- **示例**：`["business", "conversation", "beginner"]`
- **用途**：
  - 内容分类
  - 搜索过滤
  - 推荐算法

#### `duration` - 时长（必填）
- **格式**：数字（秒），支持小数
- **示例**：
  - `615` (表示 10 分 15 秒)
  - `123.456` (表示 2 分 3.456 秒)
- **用途**：
  - 显示视频时长
  - 进度条计算
  - 播放完成判断
- **说明**：
  - 必须为正数（> 0）
  - 可以包含小数部分，精度取决于视频源
  - 通常从视频文件元数据中获取

### FeedApiResponse

Feed API 响应数据结构。

```typescript
interface FeedApiResponse {
  /** 视频列表 */
  videos: VideoMetaData[];
}
```

**约束**：
- `videos` 数组可以为空（表示没有更多内容）
- 数组长度通常与请求的 `count` 参数一致
- 如果可用视频少于 `count`，返回实际可用数量

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
  "message": "Invalid parameter: count must be a positive integer",
  "code": "INVALID_PARAMETER",
  "details": {
    "parameter": "count",
    "value": "-1",
    "expected": "positive integer"
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

#### 403 - 权限不足

```json
{
  "message": "Insufficient permissions to access this resource",
  "code": "INSUFFICIENT_PERMISSIONS",
  "details": {
    "requiredRole": "premium",
    "currentRole": "free"
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
| `INVALID_PARAMETER` | 400 | 请求参数无效 | 显示错误提示 |
| `MISSING_PARAMETER` | 400 | 缺少必需参数 | 显示错误提示 |
| `TOKEN_EXPIRED` | 401 | Token 已过期 | 跳转登录页 |
| `INVALID_TOKEN` | 401 | Token 无效 | 跳转登录页 |
| `INSUFFICIENT_PERMISSIONS` | 403 | 权限不足 | 显示权限提示 |
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在 | 显示不存在提示 |
| `RATE_LIMIT_EXCEEDED` | 429 | 超过速率限制 | 等待后重试 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 | 自动重试 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 | 自动重试 |

---

## 完整示例

### 示例 1：成功请求

**请求**：
```http
GET /api/v1/feed?count=2 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

**响应**：
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 512

{
  "videos": [
    {
      "id": "1video_1728234567890_abc123def456_ghi789",
      "title": "商务英语对话 - 第123课",
      "tags": ["business", "conversation", "intermediate"],
      "description": "本课程介绍商务场景中的常用对话技巧",
      "thumbnail_url": "https://picsum.photos/seed/video1/640/360",
      "video_url": "https://storage.googleapis.com/demo-videos/video1_hls/playlist.m3u8",
      "duration": 615.234
    },
    {
      "id": "2video_1728234567891_def456ghi789_jkl012",
      "title": "日常口语练习 - 第45课",
      "tags": ["daily", "conversation", "beginner"],
      "description": "日常生活中的实用口语表达",
      "thumbnail_url": "https://picsum.photos/seed/video2/640/360",
      "video_url": "https://storage.googleapis.com/demo-videos/video2_hls/playlist.m3u8",
      "duration": 420.5
    }
  ]
}
```

---

### 示例 2：参数错误

**请求**：
```http
GET /api/v1/feed?count=-1 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

**响应**：
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "message": "Invalid parameter: count must be a positive integer",
  "code": "INVALID_PARAMETER",
  "details": {
    "parameter": "count",
    "value": "-1",
    "expected": "positive integer (1-50)"
  }
}
```

---

### 示例 3：认证失败

**请求**：
```http
GET /api/v1/feed?count=10 HTTP/1.1
Host: api.example.com
Authorization: Bearer invalid_token_here
Accept: application/json
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

---

### 示例 4：限流

**请求**：
```http
GET /api/v1/feed?count=10 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
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

### 示例 5：空结果

**请求**：
```http
GET /api/v1/feed?count=10 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

**响应**：
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "videos": []
}
```

**客户端处理**：
- 停止加载更多
- 显示"没有更多内容"提示

---

## 客户端实现要点

### 1. 重试策略

**自动重试的场景**：
- 网络错误（NETWORK_ERROR, NETWORK_OFFLINE）
- 服务器错误（5xx）
- 限流错误（429）

**不重试的场景**：
- 参数错误（400）
- 认证错误（401, 403）
- 资源不存在（404）
- 请求超时（408）

**重试配置**：
```typescript
{
  maxRetries: 3,           // 最多重试 3 次
  retryDelay: 1000,        // 初始延迟 1 秒
  backoffMultiplier: 2,    // 指数退避系数
  timeout: 10000           // 请求超时 10 秒
}
```

### 2. 缓存策略

**建议**：
- 使用内存缓存存储 Feed 数据
- 缓存有效期：5-10 分钟
- 下拉刷新时清除缓存
- 使用滑动窗口管理内存（最多保留 500 个视频）

### 3. 错误处理

**认证错误**（401/403）：
```typescript
if (error.isAuthError()) {
  // 清除本地 token
  await clearToken();
  // 跳转到登录页
  navigation.navigate('Login');
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
}
```

**服务器错误**（自动重试）：
```typescript
if (error.isServerError()) {
  // HTTP 客户端会自动重试
  // 如果重试 3 次后仍失败，显示提示
  toast.show({
    type: 'error',
    title: '服务器错误',
    message: '服务暂时不可用，请稍后重试'
  });
}
```

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2024-10-06 | 初始版本 |

---

## 相关文档

- [HTTP 状态码与错误代码完整指南](./http-status-codes.md)
- [认证 API 文档](./auth-api-protocol.md)
- [字幕 API 文档](./subtitle-api-protocol.md)

---

**最后更新**：2024-10-06
**维护者**：开发团队
**联系方式**：dev-team@example.com
