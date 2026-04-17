/**
 * 字幕数据源 API 类型定义
 */

/**
 * 字幕 API 响应数据
 */
export interface SubtitleApiResponse {
  /** 视频唯一标识符 */
  video_id: string;
  /** JSON 字符串格式的字幕数据 */
  subtitle_json: string;
  /** 字幕更新时间（ISO 8601） */
  updated_at: string;
}

// 字幕获取选项已移除 - 只需要 video_id
// 语言固定为英文，不需要额外配置

// 旧的错误类型已移除
// 现在使用统一的 ApiError (@/shared/lib/http-client)