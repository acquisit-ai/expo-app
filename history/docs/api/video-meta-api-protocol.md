# 视频元数据 API 前后端交互协议

## 目录

- [概述](#概述)
- [认证机制](#认证机制)
- [API 端点](#api-端点)
- [数据类型定义](#数据类型定义)
- [错误响应](#错误响应)
- [完整示例](#完整示例)

---

## 概述

视频元数据 API 提供根据视频唯一 ID 获取单个视频详细信息的服务，包括视频基础元数据和用户交互状态（点赞、收藏）。

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

### **GET** `/api/v1/videos/{videoId}`

根据视频唯一 ID 获取视频详细信息。

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `videoId` | `string` | 是 | 视频唯一标识符 | `1video_1728234567890_abc123def456_ghi789` |

#### 请求示例

```http
GET /api/v1/videos/1video_1728234567890_abc123def456_ghi789 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

#### 响应格式

**成功响应** - HTTP 200 OK

```json
{
  "id": "string",
  "title": "string",
  "tags": ["string"],
  "description": "string",
  "thumbnail_url": "string",
  "video_url": "string",
  "duration": 123.45,
  "isLiked": false,
  "isFavorited": false,
  "likeCount": 1234,
  "favoriteCount": 567
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 视频唯一标识符，可用于请求字幕 |
| `title` | `string` | 是 | 视频标题 |
| `tags` | `array<string>` | 是 | 视频标签/关键词列表 |
| `description` | `string` | 是 | 视频描述/简介 |
| `thumbnail_url` | `string` | 是 | 视频缩略图 URL |
| `video_url` | `string` | 是 | 视频播放地址（HLS 格式） |
| `duration` | `number` | 是 | 视频时长（秒），支持小数 |
| `isLiked` | `boolean` | 是 | 当前用户是否已点赞此视频 |
| `isFavorited` | `boolean` | 是 | 当前用户是否已收藏此视频 |
| `likeCount` | `number` | 是 | 视频总点赞数 |
| `favoriteCount` | `number` | 是 | 视频总收藏数 |

#### 响应状态码

| 状态码 | 说明 | 客户端处理 |
|--------|------|------------|
| **200** | 成功 | 正常处理数据 |
| **400** | 参数错误（videoId 格式无效） | 显示错误提示，不重试 |
| **401** | 未授权 | 跳转到登录页 |
| **403** | 权限不足 | 显示权限不足提示 |
| **404** | 视频不存在 | 显示"视频不存在"提示 |
| **429** | 请求过于频繁 | 等待后重试（自动） |
| **500** | 服务器错误 | 自动重试（最多 3 次） |
| **502** | 网关错误 | 自动重试（最多 3 次） |
| **503** | 服务不可用 | 自动重试（最多 3 次） |

---

## 数据类型定义

### VideoDetailResponse

视频详细信息响应数据结构。

```typescript
interface VideoDetailResponse {
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

  /** 当前用户是否已点赞此视频 */
  readonly isLiked: boolean;

  /** 当前用户是否已收藏此视频 */
  readonly isFavorited: boolean;

  /** 视频总点赞数 */
  readonly likeCount: number;

  /** 视频总收藏数 */
  readonly favoriteCount: number;
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

#### `tags` - 标签
- **格式**：字符串数组
- **示例**：`["business", "conversation", "beginner"]`
- **用途**：
  - 内容分类
  - 搜索过滤
  - 推荐算法

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

#### `video_url` - 视频地址
- **格式**：HTTPS URL，指向 HLS playlist (m3u8)
- **示例**：`"https://storage.googleapis.com/demo-videos/video123_hls/playlist.m3u8"`
- **要求**：
  - 必须是可公开访问的 HTTPS URL
  - 必须是 HLS 格式（.m3u8）
  - 支持 CORS（允许客户端跨域请求）

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

#### `isLiked` - 点赞状态
- **格式**：布尔值
- **示例**：`true` 或 `false`
- **说明**：
  - `true`：当前登录用户已点赞此视频
  - `false`：当前登录用户未点赞此视频
  - 用于前端显示点赞按钮状态（高亮/未高亮）
  - 此状态是用户相关的，同一视频对不同用户可能不同

#### `isFavorited` - 收藏状态
- **格式**：布尔值
- **示例**：`true` 或 `false`
- **说明**：
  - `true`：当前登录用户已收藏此视频
  - `false`：当前登录用户未收藏此视频
  - 用于前端显示收藏按钮状态（高亮/未高亮）
  - 此状态是用户相关的，同一视频对不同用户可能不同

#### `likeCount` - 点赞总数
- **格式**：非负整数
- **示例**：`1234`
- **说明**：
  - 该视频被所有用户点赞的总次数
  - 最小值为 `0`（无人点赞）
  - 实时更新，反映最新的点赞数
  - 此数据是全局统计，与当前用户无关
- **用途**：
  - 显示视频热度
  - 排序依据（按热度排序）
  - 推荐算法参考指标

#### `favoriteCount` - 收藏总数
- **格式**：非负整数
- **示例**：`567`
- **说明**：
  - 该视频被所有用户收藏的总次数
  - 最小值为 `0`（无人收藏）
  - 实时更新，反映最新的收藏数
  - 此数据是全局统计，与当前用户无关
- **用途**：
  - 显示视频受欢迎程度
  - 内容质量参考指标
  - 推荐算法权重因子

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

### 示例 1：成功请求（已点赞和收藏）

**请求**：
```http
GET /api/v1/videos/1video_1728234567890_abc123def456_ghi789 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

**响应**：
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 420

{
  "id": "1video_1728234567890_abc123def456_ghi789",
  "title": "商务英语对话 - 第123课",
  "tags": ["business", "conversation", "intermediate"],
  "description": "本课程介绍商务场景中的常用对话技巧，涵盖会议、谈判、邮件沟通等实用场景。",
  "thumbnail_url": "https://picsum.photos/seed/video1/640/360",
  "video_url": "https://storage.googleapis.com/demo-videos/video1_hls/playlist.m3u8",
  "duration": 615.234,
  "isLiked": true,
  "isFavorited": true,
  "likeCount": 1234,
  "favoriteCount": 567
}
```

---

### 示例 2：成功请求（未点赞和收藏）

**请求**：
```http
GET /api/v1/videos/2video_1728234567891_def456ghi789_jkl012 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

**响应**：
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 380

{
  "id": "2video_1728234567891_def456ghi789_jkl012",
  "title": "日常口语练习 - 第45课",
  "tags": ["daily", "conversation", "beginner"],
  "description": "日常生活中的实用口语表达，包括问候、购物、点餐等场景。",
  "thumbnail_url": "https://picsum.photos/seed/video2/640/360",
  "video_url": "https://storage.googleapis.com/demo-videos/video2_hls/playlist.m3u8",
  "duration": 420.5,
  "isLiked": false,
  "isFavorited": false,
  "likeCount": 856,
  "favoriteCount": 234
}
```

---

### 示例 3：视频不存在

**请求**：
```http
GET /api/v1/videos/nonexistent_video_id HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

**响应**：
```http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{
  "message": "Video not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": {
    "videoId": "nonexistent_video_id"
  }
}
```

**客户端处理**：
- 显示"视频不存在"或"该视频已被删除"提示
- 返回上一页或跳转到首页
- 不进行重试

---

### 示例 4：参数格式错误

**请求**：
```http
GET /api/v1/videos/123 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

**响应**：
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "message": "Invalid video ID format",
  "code": "INVALID_PARAMETER",
  "details": {
    "parameter": "videoId",
    "value": "123",
    "expected": "string matching pattern: ^[0-9]video_.*"
  }
}
```

---

### 示例 5：认证失败

**请求**：
```http
GET /api/v1/videos/1video_1728234567890_abc123def456_ghi789 HTTP/1.1
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

**客户端处理**：
- 清除本地存储的 Token
- 跳转到登录页
- 不进行重试

---

### 示例 6：限流

**请求**：
```http
GET /api/v1/videos/1video_1728234567890_abc123def456_ghi789 HTTP/1.1
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
- 使用内存缓存存储视频详情数据
- 缓存有效期：5-10 分钟
- 缓存键：`video_detail_${videoId}`
- 用户交互状态变化时（点赞/收藏）立即更新缓存

### 3. 错误处理

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

**认证错误**（401/403）：
```typescript
if (error.isAuthError()) {
  await clearToken();
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

### 4. 状态同步

**点赞/收藏状态变化**：
- 用户点赞/取消点赞后，立即更新本地缓存中的 `isLiked` 和 `likeCount` 状态
- 用户收藏/取消收藏后，立即更新本地缓存中的 `isFavorited` 和 `favoriteCount` 状态
- 乐观更新：先更新 UI，再发送请求，失败时回滚

**示例**：
```typescript
// 乐观更新点赞状态
const toggleLike = async (videoId: string, currentIsLiked: boolean, currentLikeCount: number) => {
  // 1. 立即更新 UI（乐观更新）
  const newIsLiked = !currentIsLiked;
  const newLikeCount = currentLikeCount + (newIsLiked ? 1 : -1);

  updateCache(videoId, {
    isLiked: newIsLiked,
    likeCount: newLikeCount
  });

  try {
    // 2. 发送 API 请求
    const response = await likeVideo(videoId);

    // 3. 使用服务器返回的真实数据更新缓存
    updateCache(videoId, {
      isLiked: response.data.isLiked,
      likeCount: response.data.likeCount
    });
  } catch (error) {
    // 4. 失败时回滚
    updateCache(videoId, {
      isLiked: currentIsLiked,
      likeCount: currentLikeCount
    });
    toast.error('操作失败，请重试');
  }
};
```

**重要提示**：
- `likeCount` 和 `favoriteCount` 是全局统计数据，应优先使用服务器返回的值
- 乐观更新时的计数器变化（±1）仅用于临时 UI 反馈
- 收到服务器响应后，必须用真实数据覆盖乐观更新的值

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2024-10-06 | 初始版本 |
| v1.1 | 2024-10-06 | 新增 `likeCount` 和 `favoriteCount` 字段 |

---

## 相关文档

- [HTTP 状态码与错误代码完整指南](./http-status-codes.md)
- [Feed API 文档](./feed-api-protocol.md)
- [视频点赞 API 文档](./video-like-api-protocol.md)
- [视频字幕 API 文档](./subtitle-api-protocol.md)
- [认证 API 文档](./auth-api-protocol.md)

---

**最后更新**：2024-10-06
**维护者**：开发团队
**联系方式**：dev-team@example.com
