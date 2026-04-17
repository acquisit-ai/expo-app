/**
 * 视频相关类型定义
 *
 * 集中管理所有视频元数据的类型定义，供整个应用使用
 */

import type { VideoPlayer } from 'expo-video';

/**
 * 视频基础元数据（不可变）
 * 来自服务器的基础视频信息，客户端不可修改
 */
export interface VideoBasicMetaData {
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

/**
 * 视频用户交互状态（可变）
 * 用户操作（点赞/收藏）可以修改这些字段
 */
export interface VideoUserInteractionState {
  /** 当前用户是否点赞了此视频 */
  isLiked: boolean;
  /** 当前用户是否收藏了此视频 */
  isFavorited: boolean;
}

/**
 * 完整的视频元数据
 * 包含基础元数据和用户交互状态
 *
 * 核心视频数据结构，用于整个应用的视频处理
 * 扁平化设计，移除无意义的 meta 嵌套
 */
export interface VideoMetaData extends VideoBasicMetaData, VideoUserInteractionState {}

/**
 * 播放器元数据
 * 表示一个播放器实例及其关联的视频ID
 *
 * ⚠️ 重构说明（方案A）：
 * - 只存储 videoId，不存储完整的 VideoMetaData 对象
 * - VideoMetaData 统一由 Video Meta Entity 管理（SSOT）
 * - 需要数据时通过 videoId 从 Video Meta Entity 获取
 *
 * 用途：
 * - player-pool 中的 LRU 缓存项
 * - 标识播放器当前加载的视频
 */
export interface PlayerMeta {
  /** 播放器实例 */
  playerInstance: VideoPlayer;
  /** 视频ID（null 表示空闲播放器）*/
  videoId: string | null;
  // 注：LRU 顺序由 Map 的插入顺序维护，无需额外的时间戳
}

/**
 * 视频显示模式
 * 用于区分不同的播放场景，提供最优的用户体验
 */
export enum VideoDisplayMode {
  /** 小屏模式 - 在滚动页面中显示 */
  SMALL = 'small',
  /** 全屏竖屏模式 - 占据整个屏幕，竖向布局 */
  FULLSCREEN_PORTRAIT = 'fullscreen-portrait',
  /** 全屏横屏模式 - 占据整个屏幕，横向布局 */
  FULLSCREEN_LANDSCAPE = 'fullscreen-landscape',
}