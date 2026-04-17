/**
 * 字幕 API 调用封装
 *
 * 使用统一的 HTTP 客户端，开发环境自动返回 mock 数据
 *
 * Mock 数据策略说明：
 * - Feed API: 内存生成（数据结构简单）
 * - Subtitle API: 从 Google Cloud Storage 获取（数据结构复杂，需要真实字幕）
 */

import { httpClient, ApiError } from '@/shared/lib/http-client';
import { isDevelopment } from '@/shared/config/environment';
import { log, LogType } from '@/shared/lib/logger';
import type { SubtitleApiResponse } from './types';

/**
 * 字幕文件 URL 基础路径
 * 9个演示字幕 (001-cleaned-gemini.json - 009-cleaned-gemini.json)
 */
const SUBTITLE_BASE_URL = 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/demo-subtitle';
/**
 * 根据视频ID获取模拟数据URL
 *
 * 映射逻辑：videoId 首位数字 → 字幕文件编号
 * - 1video_xxx → 001-cleaned-gemini.json
 * - 2video_xxx → 002-cleaned-gemini.json
 * - ...
 * - 9video_xxx → 009-cleaned-gemini.json
 */
function getMockDataUrl(videoId: string): string | null {
  const firstDigit = videoId.charAt(0);

  // 验证首位数字是否有效 (1-9)
  if (!/^[1-9]$/.test(firstDigit)) {
    return null;
  }

  // 转换为三位数字格式：'1' → '001'
  const paddedNum = firstDigit.padStart(3, '0');

  return `${SUBTITLE_BASE_URL}/${paddedNum}-cleaned-gemini_resolved.json`;
}

/**
 * 开发环境模拟字幕数据获取
 */
async function fetchMockSubtitle(videoId: string): Promise<SubtitleApiResponse> {
  log('subtitle-api', LogType.INFO, `[MOCK] Fetching subtitle for video ${videoId}`);

  const mockUrl = getMockDataUrl(videoId);

  if (!mockUrl) {
    log('subtitle-api', LogType.WARNING, `[MOCK] No mock data found for video ${videoId}`);
    throw new ApiError(`No mock subtitle data available for video ${videoId}`, 404, 'NOT_FOUND');
  }

  try {
    const response = await fetch(mockUrl);

    if (!response.ok) {
      throw new ApiError(`Failed to fetch mock data: ${response.status}`, response.status, 'MOCK_FETCH_ERROR');
    }

    const subtitleData = await response.json();

    // 构造标准的API响应格式
    const apiResponse: SubtitleApiResponse = {
      video_id: videoId,
      subtitle_json: JSON.stringify(subtitleData),
      updated_at: new Date().toISOString()
    };

    log('subtitle-api', LogType.INFO, `[MOCK] Successfully fetched subtitle for video ${videoId}`);
    return apiResponse;

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    log('subtitle-api', LogType.ERROR, `[MOCK] Failed to fetch subtitle: ${error}`);
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      500,
      'MOCK_ERROR',
      error
    );
  }
}

/**
 * 字幕 API 封装类
 */
export class SubtitleAPI {
  /**
   * 根据视频 ID 获取字幕数据
   *
   * 开发环境：返回 mock 数据
   * 生产环境：调用真实 API（使用 HTTP 客户端自动处理认证、重试、错误）
   */
  static async fetchSubtitle(videoId: string): Promise<SubtitleApiResponse> {
    log('subtitle-api', LogType.INFO, `Fetching subtitle for video ${videoId}`);

    // 开发环境：返回 mock 数据
    if (isDevelopment()) {
      return fetchMockSubtitle(videoId);
    }

    // 生产环境：调用真实 API
    try {
      const data = await httpClient.get<SubtitleApiResponse>(
        `/api/v1/videos/${videoId}/subtitles`
      );

      log('subtitle-api', LogType.INFO, `Successfully fetched subtitle for video ${data.video_id}`);
      return data;

    } catch (error) {
      // HTTP 客户端已经统一处理错误，这里只需记录日志并重新抛出
      if (error instanceof ApiError) {
        log('subtitle-api', LogType.ERROR, `Failed to fetch subtitle: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 检查 API 健康状态
   */
  static async healthCheck(): Promise<boolean> {
    // 开发环境跳过健康检查
    if (isDevelopment()) {
      return true;
    }

    try {
      await httpClient.get('/api/v1/health', {
        timeout: 5000,
        skipAuth: true // 健康检查不需要认证
      });
      return true;
    } catch (error) {
      log('subtitle-api', LogType.WARNING, `Health check failed: ${error}`);
      return false;
    }
  }
}

/**
 * 导出单个 API 方法，便于按需导入
 */
export const {
  fetchSubtitle,
  healthCheck
} = SubtitleAPI;
