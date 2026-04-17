/**
 * Player Pool Entity 类型定义
 *
 * 播放器池的核心数据结构和接口定义
 * Entity 层只负责状态管理，不涉及业务逻辑
 */

import type { VideoPlayer } from 'expo-video';

/**
 * 播放器池模式
 */
export enum PoolMode {
  /** Feed List 模式：Available pool 流式进入主池 */
  FEED_LIST = 'feed_list',
  /** Fullscreen 模式：直接在主池操作，窗口批量替换 */
  FULLSCREEN = 'fullscreen',
  /** 模式切换中 */
  TRANSITIONING = 'transitioning',
}

/**
 * 主池播放器元数据
 *
 * 特征：
 * - replaceAsync 已完成（不管成功或失败）
 * - 没有正在进行的异步换源操作
 * - playerInstance.status 可以是任何状态
 *
 * 注意：与 @/shared/types 的 PlayerMeta 的区别
 * - shared PlayerMeta: videoId 可以为 null（支持空闲播放器）
 * - MainPlayerMeta: videoId 永远非 null（主池中都是已加载视频）
 * - 类型兼容：MainPlayerMeta 可赋值给 PlayerMeta（string 兼容 string | null）
 */
export interface MainPlayerMeta {
  playerInstance: VideoPlayer;
  videoId: string;  // 永远非 null
}

/**
 * Available 池播放器
 *
 * 特征：
 * - videoSource 固定为 null（空闲时）
 * - 专门用于执行 replaceAsync 操作
 * - isLocked = true 表示 replaceAsync 正在执行
 */
export interface AvailablePlayer {
  playerInstance: VideoPlayer;
  isLocked: boolean;              // replaceAsync 是否正在执行
  loadingVideoId: string | null;  // 正在加载的视频ID
}

/**
 * VideoPlayer 状态（来自 expo-video）
 */
export type VideoPlayerStatus = 'idle' | 'loading' | 'readyToPlay' | 'error';

/**
 * 播放器池配置
 */
export interface PlayerPoolConfig {
  /** 主池大小 */
  mainPoolSize: number;
  /** Available池大小 */
  availablePoolSize: number;
  /** 每次预加载数量 */
  preloadBatchSize: number;
}

/**
 * 池信息（调试用）
 * 简化版：返回 Store 的关键状态
 */
export interface PoolInfo {
  /** 当前模式 */
  mode: PoolMode;
  /** 主池视频列表 */
  mainPoolVideos: string[];
  /** Available 池大小 */
  availablePoolSize: number;
  /** 待加载视频列表 */
  pendingLoads: string[];
  /** 🆕 v5.0: 窗口起始视频 ID */
  windowStartVideoId: string | null;
  /** 🆕 v5.0: 当前视频 ID */
  currentVideoId: string | null;
  /** 是否已初始化 */
  isInitialized: boolean;
}

/**
 * 播放器池 Store 接口（纯 Queue 架构）
 */
export interface PlayerPoolStore {
  // === 状态 ===
  /** 池是否已初始化 */
  isPoolInitialized: boolean;

  /** 主池队列（双端队列，索引0=最旧，末尾=最新） */
  mainPoolQueue: MainPlayerMeta[];

  /** Available 池队列（预加载专用） */
  availableQueue: AvailablePlayer[];

  /** 当前模式 */
  currentMode: PoolMode;

  /** 🆕 v5.0: 窗口起始视频的 ID（基于 videoId，Feed 裁剪不影响） */
  windowStartVideoId: string | null;

  /** 待加载视频集合（两步加载策略） */
  pendingLoads: Set<string>;

  /** Available 池清理标志 */
  isClearingAvailablePool: boolean;

  /** 窗口扩展进行中标志（防止重复触发） */
  isExtendingWindow: boolean;

  // === Actions ===
  /** 设置池初始化状态 */
  setPoolInitialized: (value: boolean) => void;

  /** 更新主池队列 */
  updateMainQueue: (queue: MainPlayerMeta[]) => void;

  /** 更新 Available 池队列 */
  updateAvailableQueue: (queue: AvailablePlayer[]) => void;

  /** 设置模式 */
  setMode: (mode: PoolMode) => void;

  /** 添加待加载视频 */
  addPendingLoad: (videoId: string) => void;

  /** 移除待加载视频 */
  removePendingLoad: (videoId: string) => void;

  /** 清空待加载队列 */
  clearPendingLoads: () => void;

  /** 设置 Available 池清理标志 */
  setIsClearingAvailablePool: (value: boolean) => void;

  /** 设置窗口扩展标志 */
  setIsExtendingWindow: (value: boolean) => void;

  /** 🆕 v5.0: 设置窗口起始视频 ID */
  setWindowStartVideoId: (videoId: string | null) => void;

  /** 🆕 v6.0: 原子更新窗口状态（窗口扩展专用，防止闪烁）*/
  updateWindowState: (update: {
    mainQueue: MainPlayerMeta[];
    availableQueue: AvailablePlayer[];
    windowStartVideoId: string | null;
    isExtendingWindow?: boolean;
  }) => void;

  /** 重置池 */
  resetPool: () => void;
}

/**
 * 窗口计算结果
 */
export interface WindowCalculation {
  /** 窗口起始索引 */
  start: number;
  /** 窗口结束索引 */
  end: number;
  /** 窗口内的视频ID列表 */
  videoIds: string[];
}

/**
 * 播放器池管理器接口（双池架构 + 双模式）
 */
export interface IPlayerPoolManager {
  /** 初始化池（应用启动时调用） */
  init(): Promise<void>;

  /** 获取播放器实例（LRU 策略）
   * @param videoId - 视频ID
   * @param videoUrl - 视频URL（可选，仅在缓存未命中时需要）
   */
  acquire(videoId: string, videoUrl?: string): Promise<VideoPlayer>;

  /** 预加载视频列表（Feed List 模式）
   * @param videos - 要预加载的视频列表（包含videoId和videoUrl）
   * @returns Promise - 串行加载完成后 resolve
   */
  preloadVideos(videos: Array<{ videoId: string; videoUrl: string }>): Promise<void>;

  /** 进入 Fullscreen 模式（同步，立即返回）
   * @param clickedVideoId - 用户点击的视频 ID
   * @param feedVideoIds - Feed视频ID列表
   * @param getVideoUrl - 获取视频URL的回调
   */
  enterFullscreenMode(
    clickedVideoId: string,
    feedVideoIds: string[],
    getVideoUrl: (id: string) => string | null
  ): void;

  /** 退出 Fullscreen 模式 */
  exitFullscreenMode(): void;

  /** 获取池信息（调试用）
   * @param currentVideoId - 当前视频ID（可选）
   */
  getPoolInfo(currentVideoId?: string | null): PoolInfo;

  /** 销毁池（应用退出时） */
  destroy(): void;
}