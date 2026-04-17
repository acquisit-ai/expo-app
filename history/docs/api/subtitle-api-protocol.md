# Subtitle API 前后端交互协议

## 目录

- [概述](#概述)
- [认证机制](#认证机制)
- [API 端点](#api-端点)
- [数据类型定义](#数据类型定义)
- [错误响应](#错误响应)
- [完整示例](#完整示例)

---

## 概述

Subtitle API 提供视频字幕数据的获取服务，支持按视频 ID 查询字幕内容。

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

### **GET** `/api/v1/videos/{videoId}/subtitles`

根据视频 ID 获取字幕数据。

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `videoId` | `string` | 是 | 视频唯一标识符 | `1video_1728234567890_abc123def456_ghi789` |

**参数约束**：
- `videoId` 必须为非空字符串
- `videoId` 必须与 Feed API 或 Video Meta API 返回的视频 ID 一致

#### 请求示例

```http
GET /api/v1/videos/1video_1728234567890_abc123def456_ghi789/subtitles HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

#### 响应格式

**成功响应** - HTTP 200 OK

```json
{
  "video_id": "string",
  "subtitle_json": "string",
  "updated_at": "string"
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `video_id` | `string` | 是 | 视频唯一标识符 |
| `subtitle_json` | `string` | 是 | JSON 字符串格式的字幕数据（需要解析） |
| `updated_at` | `string` | 是 | 字幕更新时间（ISO 8601 格式） |

#### 响应状态码

| 状态码 | 说明 | 客户端处理 |
|--------|------|------------|
| **200** | 成功 | 正常处理数据 |
| **400** | 参数错误（videoId 格式无效） | 显示错误提示，不重试 |
| **401** | 未授权 | 跳转到登录页 |
| **403** | 权限不足 | 显示权限不足提示 |
| **404** | 视频或字幕不存在 | 显示"字幕暂不可用"提示 |
| **429** | 请求过于频繁 | 等待后重试（自动） |
| **500** | 服务器错误 | 自动重试（最多 3 次） |
| **502** | 网关错误 | 自动重试（最多 3 次） |
| **503** | 服务不可用 | 自动重试（最多 3 次） |

---

## 数据类型定义

### SubtitleApiResponse

字幕 API 响应数据结构。

```typescript
interface SubtitleApiResponse {
  /** 视频唯一标识符 */
  video_id: string;

  /** JSON 字符串格式的字幕数据 */
  subtitle_json: string;

  /** 字幕更新时间（ISO 8601） */
  updated_at: string;
}
```

**字段详解**：

#### `video_id` - 视频 ID
- **格式**：字符串，与 Feed API 返回的 video_id 一致
- **示例**：`"1video_1728234567890_abc123def456_ghi789"`
- **用途**：关联字幕与视频

#### `subtitle_json` - 字幕数据
- **格式**：JSON 字符串，需要通过 `JSON.parse()` 解析
- **内容**：包含完整的字幕数据结构（详见 SubtitleJson 类型）
- **大小**：通常 50KB - 500KB
- **说明**：
  - 必须是有效的 JSON 字符串
  - 解析后得到 `SubtitleJson` 对象
  - 包含句子、token、时间戳等完整信息

#### `updated_at` - 更新时间
- **格式**：ISO 8601 日期时间字符串
- **示例**：`"2024-10-06T15:45:30Z"`
- **时区**：UTC
- **用途**：
  - 缓存失效判断
  - 版本控制

---

### SubtitleJson

字幕数据的 JSON 结构（从 `subtitle_json` 字段解析得到）。

```typescript
interface SubtitleJson {
  /** 总句子数 */
  total_sentences: number;

  /** 总 token 数 */
  total_tokens: number;

  /** 所有句子的扁平化数组（按时间排序） */
  sentences: Sentence[];
}
```

### Sentence

句子数据结构。

```typescript
interface Sentence {
  /** 句子全局编号（在整个字幕中的顺序） */
  index: number;

  /** 句子开始时间（秒） */
  start: number;

  /** 句子结束时间（秒） */
  end: number;

  /** 句子的完整文本 */
  text: string;

  /** 句子整体解释/翻译 */
  explanation: string;

  /** 该句子的 token 总数 */
  total_tokens: number;

  /** 句子中的所有 tokens */
  tokens: SubtitleToken[];
}
```

### SubtitleToken

Token（单词或标点）数据结构。

```typescript
interface SubtitleToken {
  /** token 在句子中的顺序（从 0 开始） */
  index: number;

  /** token 文本内容 */
  text: string;

  /** token 的开始时间（秒，可选） */
  start?: number;

  /** token 的结束时间（秒，可选） */
  end?: number;

  /** token 的注释/解释 */
  explanation: string;

  /** 对应的语义元素 */
  semanticElement: SemanticElement | null;
}
```

### SemanticElement

语义元素数据结构。

```typescript
interface SemanticElement {
  /** 全局唯一 ID */
  id: number;

  /** 语义元素类型（如 word、phrase） */
  kind?: string;

  /** 展示标签（用于Modal副标题） */
  label?: string;

  /** 词性标注 */
  pos?: string;

  /** 中文短标签 */
  chinese_label?: string;

  /** 中文详细释义 */
  chinese_def?: string;
}
```

**数据结构说明**：

1. **层级关系**：
   ```
   SubtitleJson
   └── sentences[]
       └── tokens[]
           └── semanticElement
   ```

2. **时间戳**：
   - Sentence 必须有 start/end
   - Token 的 start/end 是可选的
   - 所有时间单位为秒，支持小数

3. **索引**：
   - Sentence.index：全局编号（0, 1, 2, ...）
   - Token.index：句子内编号（0, 1, 2, ...）

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

#### 404 - 字幕不存在（视频存在但无字幕）

```json
{
  "message": "Subtitle not found for video",
  "code": "SUBTITLE_NOT_FOUND",
  "details": {
    "videoId": "1video_1728234567890_abc123def456_ghi789"
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
| `SUBTITLE_NOT_FOUND` | 404 | 字幕不存在（视频存在） | 显示"字幕暂不可用" |
| `RATE_LIMIT_EXCEEDED` | 429 | 超过速率限制 | 等待后重试 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 | 自动重试 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 | 自动重试 |

---

## 完整示例

### 示例 1：成功请求

**请求**：
```http
GET /api/v1/videos/1video_1728234567890_abc123def456_ghi789/subtitles HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

**响应**：
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 15420

{
  "video_id": "1video_1728234567890_abc123def456_ghi789",
  "subtitle_json": "{\"total_sentences\":10,\"total_tokens\":85,\"sentences\":[{\"index\":0,\"start\":0.5,\"end\":3.2,\"text\":\"Hello, welcome to our English learning course.\",\"explanation\":\"你好，欢迎来到我们的英语学习课程。\",\"total_tokens\":8,\"tokens\":[{\"index\":0,\"text\":\"Hello\",\"start\":0.5,\"end\":0.8,\"explanation\":\"打招呼\",\"semanticElement\":{\"id\":1,\"kind\":\"word\",\"label\":\"hello\",\"pos\":\"interjection\",\"chinese_label\":\"你好\",\"chinese_def\":\"用于打招呼的感叹词\"}}]}]}",
  "updated_at": "2024-10-06T15:45:30Z"
}
```

**解析 `subtitle_json` 后的数据**：
```json
{
  "total_sentences": 10,
  "total_tokens": 85,
  "sentences": [
    {
      "index": 0,
      "start": 0.5,
      "end": 3.2,
      "text": "Hello, welcome to our English learning course.",
      "explanation": "你好，欢迎来到我们的英语学习课程。",
      "total_tokens": 8,
      "tokens": [
        {
          "index": 0,
          "text": "Hello",
          "start": 0.5,
          "end": 0.8,
          "explanation": "打招呼",
          "semanticElement": {
            "id": 1,
            "kind": "word",
            "label": "hello",
            "pos": "interjection",
            "chinese_label": "你好",
            "chinese_def": "用于打招呼的感叹词"
          }
        },
        {
          "index": 1,
          "text": ",",
          "explanation": "标点符号",
          "semanticElement": {
            "id": 2,
            "kind": "word",
            "label": ",",
            "pos": "punctuation",
            "chinese_label": "逗号",
            "chinese_def": "标点符号"
          }
        },
        {
          "index": 2,
          "text": "welcome",
          "start": 1.0,
          "end": 1.5,
          "explanation": "欢迎",
          "semanticElement": {
            "id": 3,
            "kind": "word",
            "label": "welcome",
            "pos": "verb",
            "chinese_label": "欢迎",
            "chinese_def": "表示欢迎、接待的动词"
          }
        }
      ]
    }
  ]
}
```

---

### 示例 2：视频不存在

**请求**：
```http
GET /api/v1/videos/999video_nonexistent/subtitles HTTP/1.1
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
    "videoId": "999video_nonexistent"
  }
}
```

**客户端处理**：
- 显示"视频不存在"提示
- 返回上一页或跳转到首页

---

### 示例 3：字幕不存在（视频存在但无字幕）

**请求**：
```http
GET /api/v1/videos/4video_1728234567890_abc123def456_ghi789/subtitles HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

**响应**：
```http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{
  "message": "Subtitle not found for video",
  "code": "SUBTITLE_NOT_FOUND",
  "details": {
    "videoId": "4video_1728234567890_abc123def456_ghi789"
  }
}
```

**客户端处理**：
- 显示"字幕暂不可用"提示
- 可以提供无字幕播放模式
- 不进行重试

---

### 示例 4：videoId 格式错误

**请求**：
```http
GET /api/v1/videos/invalid-id/subtitles HTTP/1.1
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
    "value": "invalid-id",
    "expected": "string matching pattern: ^[0-9]video_.*"
  }
}
```

---

### 示例 5：认证失败

**请求**：
```http
GET /api/v1/videos/1video_1728234567890_abc123def456_ghi789/subtitles HTTP/1.1
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

## 客户端实现要点

### 1. 字幕数据解析

**步骤**：
```typescript
// 1. 获取 API 响应
const response: SubtitleApiResponse = await fetchSubtitle(videoId);

// 2. 解析 subtitle_json 字符串
const subtitleData: SubtitleJson = JSON.parse(response.subtitle_json);

// 3. 使用字幕数据
console.log(`Total sentences: ${subtitleData.total_sentences}`);
console.log(`First sentence: ${subtitleData.sentences[0].text}`);
```

**注意事项**：
- 必须进行 JSON 解析错误处理
- 验证解析后的数据结构
- 处理可能的数据缺失

### 2. 缓存策略

**建议**：
- 使用本地存储缓存字幕数据
- 缓存键：`subtitle_${video_id}`
- 缓存有效期：7 天
- 根据 `updated_at` 判断是否需要更新
- 字幕数据较大，优先使用磁盘缓存

**实现示例**：
```typescript
async function getSubtitle(videoId: string): Promise<SubtitleJson> {
  // 1. 检查缓存
  const cached = await cache.get(`subtitle_${videoId}`);
  if (cached && isCacheValid(cached.updated_at)) {
    return JSON.parse(cached.subtitle_json);
  }

  // 2. 请求 API
  const response = await fetchSubtitle(videoId);

  // 3. 存入缓存
  await cache.set(`subtitle_${videoId}`, response, { ttl: 7 * 24 * 60 * 60 });

  // 4. 返回解析后的数据
  return JSON.parse(response.subtitle_json);
}
```

### 3. 错误处理

**字幕不存在**（404）：
```typescript
if (error.status === 404) {
  toast.show({
    type: 'info',
    title: '字幕暂不可用',
    message: '该视频暂无字幕，请稍后再试'
  });
  // 可以提供无字幕播放模式
}
```

**网络错误**：
```typescript
if (error.isNetworkError()) {
  toast.show({
    type: 'error',
    title: '网络错误',
    message: '无法加载字幕，请检查网络连接'
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
    message: '字幕加载失败，请稍后重试'
  });
}
```

### 4. 重试策略

**自动重试的场景**：
- 网络错误（NETWORK_ERROR, NETWORK_OFFLINE）
- 服务器错误（5xx）
- 限流错误（429）

**不重试的场景**：
- 参数错误（400 - videoId 格式无效）
- 认证错误（401, 403）
- 视频不存在（404 - RESOURCE_NOT_FOUND）
- 字幕不存在（404 - SUBTITLE_NOT_FOUND）

**重试配置**：
```typescript
{
  maxRetries: 3,           // 最多重试 3 次
  retryDelay: 1000,        // 初始延迟 1 秒
  backoffMultiplier: 2,    // 指数退避系数
  timeout: 15000           // 请求超时 15 秒（字幕文件较大）
}
```

### 5. 性能优化

**预加载策略**：
- 在视频开始播放前预加载字幕
- 在 Feed 列表中预加载下一个视频的字幕
- 根据用户观看历史预测需要的字幕

**数据压缩**：
- 服务端使用 gzip 压缩
- 客户端自动解压缩

**内存管理**：
- 及时释放不再使用的字幕数据
- 使用虚拟化技术渲染长字幕列表

---

## RESTful API 设计说明

### 为什么使用路径参数而非查询参数？

本 API 使用 `/api/v1/videos/{videoId}/subtitles` 而不是 `/api/v1/subtitles?video_id={videoId}`，原因如下：

#### 1. 表达资源层级关系
字幕是视频的**子资源**，路径参数能清晰表达这种从属关系：

```
✅ /videos/123/subtitles       表达："视频 123 的字幕"
❌ /subtitles?video_id=123     表达："查询视频 ID 为 123 的字幕"
```

#### 2. RESTful 语义更准确
```
GET /videos/123                ← 获取视频本身
GET /videos/123/subtitles      ← 获取视频的字幕
GET /videos/123/comments       ← 获取视频的评论
PUT /videos/123/like           ← 点赞视频
```
所有操作都针对"视频 123"这个资源，层级结构清晰。

#### 3. URL 结构更直观
```
/videos/{videoId}/subtitles    ← 清晰的层级结构，易于理解
/subtitles?video_id={videoId}  ← 扁平化，看不出从属关系
```

#### 4. 缓存友好
路径参数形式的 URL 更容易被 CDN、代理服务器缓存：
```
✅ /videos/123/subtitles       → 每个 videoId 是独立的缓存键
❌ /subtitles?video_id=123     → 查询参数可能被缓存系统忽略
```

#### 5. 符合行业标准
主流 API 都采用路径参数表达资源层级：
```
GitHub:   GET /repos/{owner}/{repo}/issues
Twitter:  GET /tweets/{id}/replies
Stripe:   GET /customers/{customer_id}/subscriptions
```

### 查询参数的使用场景

查询参数应该用于**过滤、排序、分页**等操作，而不是资源定位：

```
✅ GET /videos?category=business&page=1        ← 过滤视频列表
✅ GET /videos/123/comments?sort=date&limit=10 ← 过滤评论列表
❌ GET /subtitles?video_id=123                 ← 定位单个资源（不推荐）
```

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2024-10-06 | 初始版本 |
| v1.1 | 2024-10-06 | 修改为 RESTful 路径参数设计 |

---

## 相关文档

- [HTTP 状态码与错误代码完整指南](./http-status-codes.md)
- [Feed API 文档](./feed-api-protocol.md)
- [视频元数据 API 文档](./video-meta-api-protocol.md)
- [认证 API 文档](./auth-api-protocol.md)

---

**最后更新**：2024-10-06
**维护者**：开发团队
**联系方式**：dev-team@example.com
