/**
 * Video Meta Entity - 类型定义
 *
 * VideoMetaData 的 SSOT (Single Source of Truth)
 * 所有 VideoMetaData 的唯一数据源
 */

import type { VideoMetaData } from '@/shared/types';

/**
 * Video Meta Store
 *
 * 设计原则：
 * - 简单缓存：使用 Map 结构，O(1) 查找
 * - 无淘汰策略：暂不实现 LRU（未来可扩展）
 * - 无持久化：纯内存缓存
 * - 职责单一：只管理 VideoMetaData，不管理列表顺序
 */
export interface VideoMetaStore {
  /** 视频缓存：Map<videoId, VideoMetaData> */
  videos: Map<string, VideoMetaData>;

  // ===== 基本操作 =====

  /** 添加单个视频到缓存 */
  addVideo: (video: VideoMetaData) => void;

  /** 批量添加视频到缓存 */
  addVideos: (videos: VideoMetaData[]) => void;

  /** 更新视频元数据（用于点赞、收藏等用户交互） */
  updateVideo: (videoId: string, updates: Partial<VideoMetaData>) => void;

  /** 获取视频元数据 */
  getVideo: (videoId: string) => VideoMetaData | null;

  /** 检查视频是否在缓存中 */
  hasVideo: (videoId: string) => boolean;

  /** 移除单个视频 */
  removeVideo: (videoId: string) => void;

  /** 清空所有缓存 */
  clear: () => void;
}
