/**
 * Feed API 客户端
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
import type { FeedApiResponse } from '../model/types';
import type { VideoMetaData } from '@/shared/types';

/**
 * 真实视频数据池 (循环使用)
 * 9个演示视频 (001_hls - 009_hls)
 */
const REAL_VIDEO_POOL = [
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/demo-hls/001_hls/playlist.m3u8',
    thumbnail_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/webp/001_hls.webp',
    duration: 86.43,
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/demo-hls/002_hls/playlist.m3u8',
    thumbnail_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/webp/002_hls.webp',
    duration: 53.52,
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/demo-hls/003_hls/playlist.m3u8',
    thumbnail_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/webp/003_hls.webp',
    duration: 125.40,
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/demo-hls/004_hls/playlist.m3u8',
    thumbnail_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/webp/004_hls.webp',
    duration: 17.31,
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/demo-hls/005_hls/playlist.m3u8',
    thumbnail_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/webp/005_hls.webp',
    duration: 145.37,
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/demo-hls/006_hls/playlist.m3u8',
    thumbnail_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/webp/006_hls.webp',
    duration: 37.12,
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/demo-hls/007_hls/playlist.m3u8',
    thumbnail_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/webp/007_hls.webp',
    duration: 38.18,
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/demo-hls/008_hls/playlist.m3u8',
    thumbnail_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/webp/008_hls.webp',
    duration: 63.28,
  },
  {
    video_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/demo-hls/009_hls/playlist.m3u8',
    thumbnail_url: 'https://storage.googleapis.com/demo-vedios-cyberdinzhen/webp/009_hls.webp',
    duration: 77.17,
  },
] as const;

/**
 * 学习内容标题模板
 */
const TITLE_TEMPLATES = [
  '商务英语对话', '日常口语练习', '旅游英语必备', '学术英语写作',
  '科技词汇解析', '文化交流话题', '新闻英语听力', '面试英语技巧',
  '生活场景对话', '职场沟通技能', '英语语法精讲', '发音训练课程',
  '听力理解训练', '阅读技巧提升', '写作能力强化', '词汇记忆方法',
  '英语思维培养', '跨文化交际', '演讲表达技巧', '英语辩论训练'
];

/**
 * 全局ID计数器，确保绝对唯一性
 * 即使在同一毫秒内生成多个ID，counter 也能保证不重复
 */
let idCounter = 0;

/**
 * 生成唯一ID，带有类型前缀
 *
 * ID 结构: {prefix}video_{timestamp}_{counter}_{random}
 * - prefix: 1-9，对应视频类型（用于字幕映射）
 * - timestamp: 毫秒级时间戳
 * - counter: 全局递增计数器（36进制4位，支持 1,679,616 个唯一值）
 * - random: 额外的随机字符串（13位，增强唯一性）
 *
 * 唯一性保证：
 * - Counter 每次调用递增，永不重复
 * - 即使 timestamp 相同，counter 也能区分
 * - Random 部分作为额外保障
 */
function generateUniqueId(typeIndex: number): string {
  const timestamp = Date.now();
  const counter = (++idCounter).toString(36).padStart(4, '0'); // 36进制4位
  const randomPart = Math.random().toString(36).substring(2, 15); // 13位随机字符
  const typePrefix = typeIndex + 1; // 1-9 对应九种视频类型
  return `${typePrefix}video_${timestamp}_${counter}_${randomPart}`;
}

/**
 * 生成随机标题
 */
function generateRandomTitle(): string {
  const template = TITLE_TEMPLATES[Math.floor(Math.random() * TITLE_TEMPLATES.length)];
  const episode = Math.floor(Math.random() * 999) + 1;
  return `${template} - 第${episode}课`;
}

/**
 * 生成模拟数据
 */
function generateMockFeedResponse(count: number): FeedApiResponse {
  const videos: VideoMetaData[] = Array.from({ length: count }, (_, i) => {
    const videoPoolIndex = i % REAL_VIDEO_POOL.length;
    const uniqueId = generateUniqueId(videoPoolIndex);
    const randomTitle = generateRandomTitle();
    const videoData = REAL_VIDEO_POOL[videoPoolIndex];

    return {
      id: uniqueId,
      title: randomTitle,
      tags: ['video', `cat-${i % 3}`],
      description: `Video description ${uniqueId}`,
      thumbnail_url: videoData.thumbnail_url,
      video_url: videoData.video_url,
      duration: videoData.duration,
      // Feed API 不返回用户交互状态，客户端默认为 false
      isLiked: false,
      isFavorited: false,
    };
  });

  return { videos };
}

/**
 * 获取 Feed 数据
 *
 * 开发环境：返回 mock 数据
 * 生产环境：调用真实 API（使用 HTTP 客户端自动处理认证、重试、错误）
 */
export async function fetchFeed(count: number = 10): Promise<FeedApiResponse> {
  log('feed-api', LogType.INFO, `Fetching ${count} videos`);

  // 开发环境：返回 mock 数据
  if (isDevelopment()) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    const response = generateMockFeedResponse(count);
    log('feed-api', LogType.INFO, `[MOCK] Generated ${response.videos.length} videos`);
    return response;
  }

  // 生产环境：调用真实 API
  try {
    const response = await httpClient.get<FeedApiResponse>(
      `/api/v1/feed?count=${count}`
    );

    // Feed API 不返回用户交互状态，为所有视频添加默认值
    const videosWithInteractionState: VideoMetaData[] = response.videos.map(video => ({
      ...video,
      isLiked: false,
      isFavorited: false,
    }));

    log('feed-api', LogType.INFO, `Fetched ${response.videos.length} videos`);
    return { videos: videosWithInteractionState };
  } catch (error) {
    // HTTP 客户端已经统一处理错误，这里只需重新抛出
    if (error instanceof ApiError) {
      log('feed-api', LogType.ERROR, `Failed to fetch feed: ${error.message}`);
    }
    throw error;
  }
}
