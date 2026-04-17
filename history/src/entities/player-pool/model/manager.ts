/**
 * Player Pool Manager (纯业务逻辑层 + 纯 Queue 架构)
 *
 * Manager 不持有任何状态，所有数据都在 Store 中
 * Manager 只负责业务逻辑：
 * - 初始化播放器实例
 * - 执行 replaceAsync 操作
 * - 管理队列顺序（LRU、窗口替换）
 * - 模式切换逻辑
 *
 * 单例模式，整个应用生命周期内只有一个实例
 *
 * 🔑 重构 v7.0: 依赖注入
 * - 所有外部Entity依赖通过参数传入
 * - 符合FSD架构：Entity层不依赖其他Entity
 */

import { createVideoPlayer, type VideoPlayer } from 'expo-video';
import { log, LogType } from '@/shared/lib/logger';
import type {
  MainPlayerMeta,
  AvailablePlayer,
  PoolInfo,
  IPlayerPoolManager,
  VideoPlayerStatus,
  WindowCalculation,
} from './types';
import { PoolMode } from './types';
import { PLAYER_POOL_CONSTANTS } from '../lib/constants';
import { usePlayerPoolStore } from './store';

class PlayerPoolManager implements IPlayerPoolManager {
  private static instance: PlayerPoolManager;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): PlayerPoolManager {
    if (!PlayerPoolManager.instance) {
      PlayerPoolManager.instance = new PlayerPoolManager();
    }
    return PlayerPoolManager.instance;
  }

  /**
   * 初始化播放器池
   * 创建 13 个主池播放器 + 4 个 available 池播放器
   */
  async init(): Promise<void> {
    const state = usePlayerPoolStore.getState();

    if (state.isPoolInitialized) {
      log('player-pool', LogType.DEBUG, 'Player pool already initialized');
      return;
    }

    log('player-pool', LogType.INFO,
      `Initializing dual-pool: ${PLAYER_POOL_CONSTANTS.MAIN_POOL_SIZE} main + ${PLAYER_POOL_CONSTANTS.AVAILABLE_POOL_SIZE} available`);

    try {
      // 1. 创建主池播放器（13个）
      const mainQueue: MainPlayerMeta[] = [];
      for (let i = 0; i < PLAYER_POOL_CONSTANTS.MAIN_POOL_SIZE; i++) {
        const player = createVideoPlayer(null);
        if (!player) {
          throw new Error(`Failed to create main pool player ${i}`);
        }

        // 配置播放器
        player.loop = PLAYER_POOL_CONSTANTS.DEFAULT_PLAYER_CONFIG.loop;
        player.volume = PLAYER_POOL_CONSTANTS.DEFAULT_PLAYER_CONFIG.volume;
        player.muted = PLAYER_POOL_CONSTANTS.DEFAULT_PLAYER_CONFIG.muted;

        const key = `${PLAYER_POOL_CONSTANTS.EMPTY_KEY_PREFIX}${i}`;
        mainQueue.push({
          playerInstance: player,
          videoId: key,
        });
      }

      // 2. 创建 available 池播放器（4个）
      const availableQueue: AvailablePlayer[] = [];
      for (let i = 0; i < PLAYER_POOL_CONSTANTS.AVAILABLE_POOL_SIZE; i++) {
        const player = createVideoPlayer(null);
        if (!player) {
          throw new Error(`Failed to create available pool player ${i}`);
        }

        // 配置播放器
        player.loop = PLAYER_POOL_CONSTANTS.DEFAULT_PLAYER_CONFIG.loop;
        player.volume = PLAYER_POOL_CONSTANTS.DEFAULT_PLAYER_CONFIG.volume;
        player.muted = PLAYER_POOL_CONSTANTS.DEFAULT_PLAYER_CONFIG.muted;

        availableQueue.push({
          playerInstance: player,
          isLocked: false,
          loadingVideoId: null,
        });
      }

      // 3. 🔑 更新 Store（唯一数据源）
      state.updateMainQueue(mainQueue);
      state.updateAvailableQueue(availableQueue);
      state.setPoolInitialized(true);

      log('player-pool', LogType.INFO,
        `Pool initialized: ${mainQueue.length} main, ${availableQueue.length} available`);
    } catch (error) {
      log('player-pool', LogType.ERROR, `Failed to initialize player pool: ${error}`);
      throw error;
    }
  }

  /**
   * 预加载视频列表
   *
   * @param videos 要预加载的视频列表（包含videoId和videoUrl）
   *
   * 流程：
   * 1. 过滤：只加载两个pool都没有的视频
   * 2. 限制：最多3个
   * 3. 分配：从available pool找空闲player
   * 4. 丢弃：如果available pool全部上锁，直接丢弃
   */
  preloadVideos(videos: Array<{ videoId: string; videoUrl: string }>): Promise<void> {
    const state = usePlayerPoolStore.getState();

    if (!state.isPoolInitialized) {
      log('player-pool', LogType.WARNING, 'Cannot preload: pool not initialized');
      return Promise.resolve();
    }

    // Fullscreen 模式下跳过预加载（available pool 不可用）
    if (state.currentMode === PoolMode.FULLSCREEN || state.isClearingAvailablePool) {
      log('player-pool', LogType.DEBUG, 'Preload skipped in Fullscreen mode');
      return Promise.resolve();
    }

    log('player-pool', LogType.DEBUG, `Preload request: [${videos.map(v => v.videoId).join(', ')}]`);

    // 1. 过滤：选择两个pool都没有的视频
    const mainQueue = state.mainPoolQueue;
    const availableQueue = state.availableQueue;

    const toLoad = videos.filter(({ videoId }) => {
      // 检查主池（O(n)）
      if (mainQueue.some(m => m.videoId === videoId)) {
        return false;
      }

      // 检查available池（正在加载中）
      if (availableQueue.some(p => p.loadingVideoId === videoId)) {
        return false;
      }

      return true;
    }).slice(0, PLAYER_POOL_CONSTANTS.PRELOAD_BATCH_SIZE);

    if (toLoad.length === 0) {
      log('player-pool', LogType.DEBUG, 'All videos already cached or loading');
      return Promise.resolve();
    }

    log('player-pool', LogType.DEBUG,
      `Filtered to load: ${toLoad.length} videos: [${toLoad.map(v => v.videoId).join(', ')}]`);

    // 2. 🔑 串行执行预加载，避免并发卡顿
    return this.preloadVideosSequentially(toLoad);
  }

  /**
   * 🆕 串行预加载视频列表
   * 逐个执行 replaceAsync，减少网络带宽竞争和设备解码压力
   *
   * 🔑 每次迭代前检查模式，确保模式切换后立即停止
   */
  private async preloadVideosSequentially(videos: Array<{ videoId: string; videoUrl: string }>): Promise<void> {
    for (const video of videos) {
      // 🔑 关键：每次迭代前检查模式
      const state = usePlayerPoolStore.getState();
      if (state.currentMode === PoolMode.FULLSCREEN || state.isClearingAvailablePool) {
        log('player-pool', LogType.DEBUG,
          `Preload interrupted: mode changed to ${state.currentMode}`);
        break;  // ✅ 立即停止串行队列
      }

      // 串行执行，等待每个视频加载完成后再加载下一个
      await this.startPreloadAsync(video.videoId, video.videoUrl);
    }
  }

  /**
   * 🆕 异步启动单个视频的预加载
   * 返回 Promise，支持串行执行
   */
  private async startPreloadAsync(videoId: string, videoUrl: string): Promise<void> {
    const state = usePlayerPoolStore.getState();
    const availableQueue = [...state.availableQueue];

    // 1. 查找空闲的available player
    const availIndex = availableQueue.findIndex(p => !p.isLocked);

    // 2. 如果全部上锁，直接丢弃
    if (availIndex === -1) {
      log('player-pool', LogType.DEBUG,
        `All available players locked, discarding preload: ${videoId}`);
      return;
    }

    const availablePlayer = availableQueue[availIndex];

    // 3. 上锁（不可变更新）
    availableQueue[availIndex] = {
      ...availablePlayer,
      isLocked: true,
      loadingVideoId: videoId,
    };
    state.updateAvailableQueue(availableQueue);

    log('player-pool', LogType.DEBUG,
      `Locked available player ${availIndex} for: ${videoId}`);

    // 4. 异步加载并等待完成
    await this.loadInAvailableQueue(availIndex, videoId, videoUrl);
  }

  /**
   * 在available pool中加载视频，完成后移入主池
   */
  private async loadInAvailableQueue(
    availIndex: number,
    videoId: string,
    videoUrl: string
  ): Promise<void> {
    try {
      // 1. 检查视频URL
      if (!videoUrl) {
        throw new Error(`Video URL not provided for: ${videoId}`);
      }

      log('player-pool', LogType.DEBUG, `Loading in available pool: ${videoId}`);

      // 2. 在available player上加载视频
      const state = usePlayerPoolStore.getState();
      const availablePlayer = state.availableQueue[availIndex];

      const videoSource = {
        uri: videoUrl,
        contentType: 'hls' as const,
        useCaching: false,
      };

      await availablePlayer.playerInstance.replaceAsync(videoSource);

      log('player-pool', LogType.INFO, `Video loaded successfully: ${videoId}`);

      // 3. 加载成功，根据模式决定是否移入主池
      const currentState = usePlayerPoolStore.getState();
      if (currentState.isClearingAvailablePool) {
        log('player-pool', LogType.DEBUG, `Clearing mode: ${videoId} loaded but discarded`);
      } else {
        this.moveToMainQueue(availIndex, videoId);
      }

    } catch (error) {
      log('player-pool', LogType.ERROR, `Failed to load ${videoId}: ${error}`);
    } finally {
      // 4. 解锁available player
      const state = usePlayerPoolStore.getState();
      const availableQueue = [...state.availableQueue];
      const availablePlayer = availableQueue[availIndex];

      availableQueue[availIndex] = {
        ...availablePlayer,
        isLocked: false,
        loadingVideoId: null,
      };
      state.updateAvailableQueue(availableQueue);

      log('player-pool', LogType.DEBUG,
        `Unlocked available player ${availIndex} (was loading: ${videoId})`);

      // 5. 重置为null源（恢复初始状态）
      try {
        await availablePlayer.playerInstance.replaceAsync(null);
        log('player-pool', LogType.DEBUG, 'Available player reset to null source');
      } catch (error) {
        log('player-pool', LogType.WARNING,
          `Failed to reset available player: ${error}`);
      }
    }
  }

  /**
   * 将加载完成的available player移入主池
   *
   * 策略：替换主池的第一个（LRU最旧的）
   * 实现：通过交换player实例
   */
  private moveToMainQueue(availIndex: number, videoId: string): void {
    const state = usePlayerPoolStore.getState();
    const mainQueue = [...state.mainPoolQueue];  // 不可变更新
    const availableQueue = [...state.availableQueue];

    // 1. 淘汰最旧的（索引0）
    const oldest = mainQueue.shift();
    if (!oldest) {
      throw new Error('Main queue is empty, this should not happen');
    }

    log('player-pool', LogType.DEBUG,
      `Moving to main queue: ${videoId}, evicting: ${oldest.videoId}`);

    // 2. 暂停被淘汰的播放器
    oldest.playerInstance.pause();

    // 3. 交换播放器实例
    const oldPlayer = oldest.playerInstance;
    const availablePlayer = availableQueue[availIndex];
    const newPlayer = availablePlayer.playerInstance;

    // 将被淘汰的旧播放器给 available pool
    availableQueue[availIndex] = {
      ...availablePlayer,
      playerInstance: oldPlayer,
    };

    // 4. 新播放器加入主池末尾（最新）
    mainQueue.push({
      playerInstance: newPlayer,
      videoId: videoId,
    });

    // 5. 🔑 更新 Store
    state.updateMainQueue(mainQueue);
    state.updateAvailableQueue(availableQueue);

    log('player-pool', LogType.INFO,
      `Main queue updated: ${videoId} in, ${oldest.videoId} out. Size: ${mainQueue.length}`);
  }

  /**
   * 获取播放器实例（用户点击视频）
   *
   * 场景1：在主池 → LRU更新
   * 场景2：在available池（正在加载）→ 直接返回
   * 场景3：都不在 → 立即加载
   */
  async acquire(videoId: string, videoUrl?: string): Promise<VideoPlayer> {
    const state = usePlayerPoolStore.getState();

    if (!state.isPoolInitialized) {
      throw new Error('Player pool not initialized. Call init() first.');
    }

    log('player-pool', LogType.DEBUG, `Acquiring player for: ${videoId}`);

    // === 场景1：主池命中（O(n) 查找）===
    const mainQueue = state.mainPoolQueue;
    const index = mainQueue.findIndex(m => m.videoId === videoId);

    if (index !== -1) {
      const meta = mainQueue[index];

      log('player-pool', LogType.DEBUG, `Main queue hit: ${videoId}`);

      // 🔑 关键：Fullscreen 模式下不使用 LRU（保持窗口顺序）
      if (state.currentMode !== PoolMode.FULLSCREEN) {
        // Feed List 模式：LRU更新（移到末尾）
        const newQueue = [...mainQueue];
        newQueue.splice(index, 1);
        newQueue.push(meta);
        state.updateMainQueue(newQueue);

        log('player-pool', LogType.DEBUG, `LRU updated for: ${videoId}`);
      } else {
        log('player-pool', LogType.DEBUG, `Fullscreen mode: skipping LRU update`);
      }

      return meta.playerInstance;
    }

    // === 场景2：available池命中（正在加载中）===
    const availableQueue = state.availableQueue;
    const loadingPlayer = availableQueue.find(p => p.loadingVideoId === videoId);

    if (loadingPlayer) {
      log('player-pool', LogType.INFO,
        `Video loading in available queue: ${videoId}, returning instance directly`);

      // 直接返回正在加载的实例
      return loadingPlayer.playerInstance;
    }

    // === 场景3：缓存未命中，立即加载 ===
    if (!videoUrl) {
      throw new Error(
        `Video URL required for immediate load: ${videoId}. ` +
        `Cache miss occurred but no URL provided.`
      );
    }

    log('player-pool', LogType.INFO, `Cache miss: ${videoId}, loading immediately`);

    return this.acquireImmediate(videoId, videoUrl);
  }

  /**
   * 缓存未命中时的立即加载
   */
  private async acquireImmediate(videoId: string, videoUrl: string): Promise<VideoPlayer> {
    const state = usePlayerPoolStore.getState();

    // 1. 检查 Fullscreen 模式（available pool 不可用）
    if (state.isClearingAvailablePool) {
      throw new Error(
        `Cannot acquire ${videoId}: available pool is unavailable in Fullscreen mode. ` +
        `Video should be in main pool window.`
      );
    }

    // 2. 查找空闲的available player
    const availableQueue = [...state.availableQueue];
    const availIndex = availableQueue.findIndex(p => !p.isLocked);

    if (availIndex === -1) {
      throw new Error(
        `No available player for immediate load: ${videoId}. ` +
        `All ${PLAYER_POOL_CONSTANTS.AVAILABLE_POOL_SIZE} available players are locked.`
      );
    }

    const availablePlayer = availableQueue[availIndex];

    // 3. 上锁
    availableQueue[availIndex] = {
      ...availablePlayer,
      isLocked: true,
      loadingVideoId: videoId,
    };
    state.updateAvailableQueue(availableQueue);

    log('player-pool', LogType.DEBUG,
      `Locked available player ${availIndex} for immediate acquire: ${videoId}`);

    try {
      // 4. 检查视频URL
      if (!videoUrl) {
        throw new Error(`Video URL not provided for: ${videoId}`);
      }

      // 5. 加载视频
      const videoSource = {
        uri: videoUrl,
        contentType: 'hls' as const,
        useCaching: false,
      };

      log('player-pool', LogType.DEBUG, `Loading immediately: ${videoId}`);

      await availablePlayer.playerInstance.replaceAsync(videoSource);

      log('player-pool', LogType.INFO, `Immediate load completed: ${videoId}`);

      // 6. 移入主池（仅在Feed List模式下）
      if (state.currentMode === PoolMode.FEED_LIST) {
        this.moveToMainQueue(availIndex, videoId);
      }

      // 7. 返回播放器实例
      return state.availableQueue[availIndex].playerInstance;

    } catch (error) {
      log('player-pool', LogType.ERROR,
        `Immediate acquire failed for ${videoId}: ${error}`);
      throw error;
    } finally {
      // 8. 解锁并重置
      const currentState = usePlayerPoolStore.getState();
      const currentAvailableQueue = [...currentState.availableQueue];
      const currentAvailablePlayer = currentAvailableQueue[availIndex];

      currentAvailableQueue[availIndex] = {
        ...currentAvailablePlayer,
        isLocked: false,
        loadingVideoId: null,
      };
      currentState.updateAvailableQueue(currentAvailableQueue);

      try {
        await currentAvailablePlayer.playerInstance.replaceAsync(null);
      } catch (error) {
        log('player-pool', LogType.WARNING,
          `Failed to reset available player after immediate acquire: ${error}`);
      }
    }
  }

  /**
   * 获取池信息（调试用）
   */
  getPoolInfo(currentVideoId?: string | null): PoolInfo {
    const state = usePlayerPoolStore.getState();

    return {
      mode: state.currentMode,
      mainPoolVideos: state.mainPoolQueue.map(m => m.videoId),
      availablePoolSize: state.availableQueue.length,
      pendingLoads: Array.from(state.pendingLoads),
      windowStartVideoId: state.windowStartVideoId,
      currentVideoId: currentVideoId ?? null,
      isInitialized: state.isPoolInitialized,
    };
  }

  /**
   * 计算 Fullscreen 窗口
   * 点击视频 ± 6 个，共 13 个
   */
  private calculateWindow(
    clickedIndex: number,
    feedVideoIds: string[]
  ): WindowCalculation {
    const WINDOW_SIZE = 13;
    const HALF_WINDOW = 6;

    // 1. 以点击位置为中心
    let start = Math.max(0, clickedIndex - HALF_WINDOW);
    let end = Math.min(feedVideoIds.length - 1, start + WINDOW_SIZE - 1);

    // 2. 边界修正：确保窗口大小为 13（如果 feed 足够长）
    if (end - start + 1 < WINDOW_SIZE && feedVideoIds.length >= WINDOW_SIZE) {
      start = Math.max(0, end - WINDOW_SIZE + 1);
    }

    // 3. 获取窗口视频 IDs
    const videoIds = feedVideoIds.slice(start, end + 1);

    return { start, end, videoIds };
  }

  /**
   * 在主池播放器上直接换源
   */
  private async replaceOnMainQueuePlayer(
    player: VideoPlayer,
    videoId: string,
    getVideoUrl: (id: string) => string | null
  ): Promise<void> {
    try {
      // 1. 获取视频 URL
      const videoUrl = getVideoUrl(videoId);
      if (!videoUrl) {
        throw new Error(`Video URL not found for: ${videoId}`);
      }

      // 2. 直接在主池播放器上 replaceAsync
      const videoSource = {
        uri: videoUrl,
        contentType: 'hls' as const,
        useCaching: false,
      };

      await player.replaceAsync(videoSource);

      log('player-pool', LogType.INFO, `Loaded on main queue: ${videoId}`);
    } catch (error) {
      log('player-pool', LogType.ERROR,
        `Failed to load ${videoId} on main queue: ${error}`);
      throw error;
    }
  }

  /**
   * 按窗口顺序直接替换主池（两步加载策略）
   *
   * 🔑 关键：这是一个同步方法，立即返回（几毫秒）
   * - 同步更新队列（立即完成）
   * - 只加载当前点击的视频（最高优先级）
   * - 其他视频标记为 pending，延后加载
   * - UI 不会被阻塞
   *
   * ⚠️ 重要：Fullscreen 模式下必须保持窗口顺序
   *
   * @param windowVideoIds 窗口视频列表
   * @param priorityVideoId 优先加载的视频ID（当前点击的视频）
   * @param getVideoUrl 获取视频URL的回调
   */
  private replaceMainQueueWithWindow(
    windowVideoIds: string[],
    priorityVideoId: string,
    getVideoUrl: (id: string) => string | null
  ): void {
    const state = usePlayerPoolStore.getState();

    // 清空上次的待加载队列
    state.clearPendingLoads();

    // 🔑 第一步：收集可以复用的 player instances
    const mainQueue = state.mainPoolQueue;
    const reusableMap = new Map<string, MainPlayerMeta>();
    for (const meta of mainQueue) {
      if (windowVideoIds.includes(meta.videoId)) {
        reusableMap.set(meta.videoId, meta);
      }
    }

    // 🔑 第二步：收集剩余的 player instances（用于新视频）
    const availablePlayers: VideoPlayer[] = [];
    for (const meta of mainQueue) {
      if (!reusableMap.has(meta.videoId)) {
        availablePlayers.push(meta.playerInstance);
      }
    }

    // 🔑 第三步：按窗口顺序构建新队列
    const newQueue: MainPlayerMeta[] = [];
    let availablePlayerIndex = 0;

    for (let i = 0; i < windowVideoIds.length && i < 13; i++) {
      const targetVideoId = windowVideoIds[i];

      if (reusableMap.has(targetVideoId)) {
        // 情况1：复用已缓存的 player
        newQueue.push(reusableMap.get(targetVideoId)!);
      } else {
        // 情况2：需要加载新视频
        if (availablePlayerIndex >= availablePlayers.length) {
          throw new Error('Not enough player instances for window replacement');
        }

        const playerInstance = availablePlayers[availablePlayerIndex++];

        // 立即添加到队列（同步）
        newQueue.push({
          playerInstance,
          videoId: targetVideoId,
        });

        // 🔑 关键改动：两步加载策略
        if (targetVideoId === priorityVideoId) {
          // ✅ 当前点击的视频：立即加载（最高优先级）
          log('player-pool', LogType.INFO,
            `Loading priority video immediately: ${targetVideoId}`);

          this.replaceOnMainQueuePlayer(playerInstance, targetVideoId, getVideoUrl)
            .catch(error => {
              log('player-pool', LogType.ERROR,
                `Priority video load failed: ${targetVideoId}: ${error}`);
            });
        } else {
          // ✅ 其他未缓存的视频：标记为 pending，延后加载
          state.addPendingLoad(targetVideoId);

          log('player-pool', LogType.DEBUG,
            `Marked as pending: ${targetVideoId}`);
        }
      }
    }

    // 🔑 更新 Store
    state.updateMainQueue(newQueue);

    log('player-pool', LogType.INFO,
      `Main queue rebuilt: ${newQueue.length} videos, ` +
      `${state.pendingLoads.size} pending loads`);
  }

  /**
   * 等待播放器就绪（复制模板逻辑）
   * @param player - 播放器实例
   * @param timeout - 超时时间（默认10秒）
   */
  private waitForPlayerReady(player: VideoPlayer, timeout = 10000): Promise<void> {
    return new Promise((resolve) => {
      // 如果已经 ready，立即 resolve
      if (player.status === 'readyToPlay' || player.status === 'error') {
        log('player-pool', LogType.DEBUG, `Player already ready: ${player.status}`);
        resolve();
        return;
      }

      log('player-pool', LogType.DEBUG,
        `Waiting for player ready, current status: ${player.status}`);

      let resolved = false;

      // 监听状态变化
      const listener = player.addListener('statusChange', ({ status }) => {
        log('player-pool', LogType.DEBUG, `Player status changed: ${status}`);

        if (status === 'readyToPlay' || status === 'error') {
          if (!resolved) {
            resolved = true;
            listener.remove();
            resolve();
          }
        }
      });

      // 超时保护
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          listener.remove();
          log('player-pool', LogType.WARNING,
            `Timeout waiting for player ready (status: ${player.status})`);
          resolve(); // 超时也继续
        }
      }, timeout);
    });
  }

  /**
   * 🔑 窗口扩展核心逻辑（私有通用方法）
   *
   * @param direction 扩展方向
   * @param feedVideoIds Feed视频ID列表
   * @param getVideoUrl 获取视频URL的回调
   * @param currentVideoId 当前视频ID（可选）
   * @returns Promise
   *
   * 统一的扩展流程：
   * 1. 原子检查并设置锁
   * 2. 计算要加载的视频范围（根据方向）
   * 3. 查找空闲 available players
   * 4. 并发加载视频到 available pool
   * 5. 交换播放器实例（根据方向）
   * 6. 原子更新 store
   */
  private async extendWindowCore(
    direction: 'next' | 'prev',
    feedVideoIds: string[],
    getVideoUrl: (id: string) => string | null,
    currentVideoId?: string | null
  ): Promise<void> {
    let state = usePlayerPoolStore.getState();

    if (state.currentMode !== PoolMode.FULLSCREEN) {
      log('player-pool', LogType.WARNING, 'Cannot extend: not in Fullscreen mode');
      return;
    }

    // 🔑 关键：原子检查并设置扩展标志（防止竞态条件）
    let shouldProceed = false;
    usePlayerPoolStore.setState((prevState) => {
      if (prevState.isExtendingWindow) {
        return prevState;
      }
      shouldProceed = true;
      return { ...prevState, isExtendingWindow: true };
    });

    if (!shouldProceed) {
      log('player-pool', LogType.WARNING, 'Window extension already in progress, skipping');
      return;
    }

    state = usePlayerPoolStore.getState();

    try {
      const batchSize = 4;
      const mainQueue = [...state.mainPoolQueue];

      // === 步骤1: 基于 windowStartVideoId 计算当前窗口位置 ===
      // 🆕 v5.0: 完全基于 videoId，Feed 裁剪不影响
      if (!state.windowStartVideoId) {
        log('player-pool', LogType.ERROR, 'No windowStartVideoId, cannot extend');
        return;
      }

      const currentWindowStartIndex = feedVideoIds.indexOf(state.windowStartVideoId);

      if (currentWindowStartIndex === -1) {
        log('player-pool', LogType.ERROR,
          `Window start video ${state.windowStartVideoId} not in feed, cannot extend`);
        return;
      }

      // === 步骤2: 计算要加载的视频（根据方向）===
      let startIdx: number;
      let endIdx: number;
      let videosToLoad: string[];

      if (direction === 'next') {
        startIdx = currentWindowStartIndex + mainQueue.length;
        endIdx = Math.min(startIdx + batchSize, feedVideoIds.length);

        if (startIdx >= feedVideoIds.length) {
          log('player-pool', LogType.DEBUG, 'Already at the end of video source');
          return;
        }

        videosToLoad = feedVideoIds.slice(startIdx, endIdx);
        log('player-pool', LogType.INFO,
          `⬇️ Extending window next: loading ${videosToLoad.length} videos [${videosToLoad.join(', ')}]`);
      } else {
        endIdx = currentWindowStartIndex;

        if (endIdx <= 0) {
          log('player-pool', LogType.DEBUG, 'Already at the beginning of video source');
          return;
        }

        startIdx = Math.max(0, endIdx - batchSize);
        videosToLoad = feedVideoIds.slice(startIdx, endIdx);
        log('player-pool', LogType.INFO,
          `⬆️ Extending window prev: loading ${videosToLoad.length} videos [${videosToLoad.join(', ')}]`);
      }

      // === 步骤2: 查找空闲 available players ===
      const availableQueue = [...state.availableQueue];
      const availableIndices: number[] = [];

      for (let i = 0; i < availableQueue.length && availableIndices.length < videosToLoad.length; i++) {
        if (!availableQueue[i].isLocked) {
          availableIndices.push(i);
        }
      }

      if (availableIndices.length < videosToLoad.length) {
        log('player-pool', LogType.ERROR,
          `Not enough available players: need ${videosToLoad.length}, got ${availableIndices.length}`);
        return;
      }

      // === 步骤3: 上锁 available players ===
      for (let i = 0; i < videosToLoad.length; i++) {
        const idx = availableIndices[i];
        availableQueue[idx] = {
          ...availableQueue[idx],
          isLocked: true,
          loadingVideoId: videosToLoad[i],
        };
      }

      // === 步骤4: 并发加载所有视频 ===
      try {
        const loadPromises = availableIndices.map(async (idx, i) => {
          const videoId = videosToLoad[i];
          const player = availableQueue[idx].playerInstance;

          try {
            const videoUrl = getVideoUrl(videoId);
            if (!videoUrl) {
              throw new Error(`Video URL not found for: ${videoId}`);
            }

            const videoSource = {
              uri: videoUrl,
              contentType: 'hls' as const,
              useCaching: false,
            };

            await player.replaceAsync(videoSource);
            await this.waitForPlayerReady(player);
            log('player-pool', LogType.INFO, `✅ ${videoId} ready`);
          } catch (error) {
            log('player-pool', LogType.ERROR, `Failed to load ${videoId}: ${error}`);
            throw error;
          }
        });

        await Promise.all(loadPromises);
        log('player-pool', LogType.INFO, '✅ All videos loaded and ready');

      } catch (error) {
        // 加载失败，解锁 available players
        for (let i = 0; i < availableIndices.length; i++) {
          const idx = availableIndices[i];
          availableQueue[idx] = {
            ...availableQueue[idx],
            isLocked: false,
            loadingVideoId: null,
          };
        }
        state.updateAvailableQueue(availableQueue);
        log('player-pool', LogType.ERROR, `extendWindow${direction} failed: ${error}`);
        return;
      }

      // 🔒 步骤4.5: 加载完成后再次检查模式（防止加载期间模式切换）
      const currentState = usePlayerPoolStore.getState();
      if (currentState.currentMode !== PoolMode.FULLSCREEN) {
        log('player-pool', LogType.WARNING,
          `Mode changed to ${currentState.currentMode} during window extension, aborting state update`);

        // 解锁 available queue（已加载但不使用）
        for (let i = 0; i < availableIndices.length; i++) {
          const idx = availableIndices[i];
          availableQueue[idx] = {
            playerInstance: availableQueue[idx].playerInstance,
            isLocked: false,
            loadingVideoId: null,
          };
        }
        state.updateAvailableQueue(availableQueue);

        return;
      }

      // === 步骤5: 交换播放器实例（根据方向）===
      if (direction === 'next') {
        // 后向扩展：添加到尾部，移除头部
        for (let i = 0; i < videosToLoad.length; i++) {
          const idx = availableIndices[i];
          const videoId = videosToLoad[i];
          const newPlayer = availableQueue[idx].playerInstance;

          mainQueue.push({
            playerInstance: newPlayer,
            videoId: videoId,
          });
        }
        log('player-pool', LogType.INFO,
          `Added ${videosToLoad.length} videos to tail, window now ${mainQueue.length} videos`);
      } else {
        // 前向扩展：添加到头部（反向插入保持顺序），移除尾部
        for (let i = videosToLoad.length - 1; i >= 0; i--) {
          const idx = availableIndices[i];
          const videoId = videosToLoad[i];
          const newPlayer = availableQueue[idx].playerInstance;

          mainQueue.unshift({
            playerInstance: newPlayer,
            videoId: videoId,
          });
        }
        log('player-pool', LogType.INFO,
          `Added ${videosToLoad.length} videos to head, window now ${mainQueue.length} videos`);
      }

      // 移除对侧的视频
      const removedMetas = direction === 'next'
        ? mainQueue.splice(0, videosToLoad.length)
        : mainQueue.splice(-videosToLoad.length, videosToLoad.length);

      log('player-pool', LogType.INFO,
        `Removed ${removedMetas.length} videos from ${direction === 'next' ? 'head' : 'tail'}: ` +
        `${removedMetas.map(m => m.videoId).join(', ')}`);

      // 暂停被移除的播放器
      for (const removed of removedMetas) {
        removed.playerInstance.pause();
      }

      // 将被移除的播放器放回 available pool
      for (let i = 0; i < removedMetas.length; i++) {
        const idx = availableIndices[i];
        const oldPlayer = removedMetas[i].playerInstance;

        availableQueue[idx] = {
          playerInstance: oldPlayer,
          isLocked: false,
          loadingVideoId: null,
        };
      }

      // 将旧播放器置空（异步，不阻塞）
      for (const removed of removedMetas) {
        removed.playerInstance.replaceAsync(null).catch((error) => {
          log('player-pool', LogType.WARNING,
            `Failed to clear player for ${removed.videoId}: ${error}`);
        });
      }

      // === 步骤6: 原子更新 store ===
      const newWindowStartIndex = direction === 'next'
        ? currentWindowStartIndex + videosToLoad.length
        : startIdx;

      // 🆕 v6.0: 计算新的窗口起始视频 ID
      // currentVideoId 由 video entity 管理，滚动位置同步由 useLayoutEffect 处理
      const newWindowStartVideoId = feedVideoIds[newWindowStartIndex];

      state.updateWindowState({
        mainQueue,
        availableQueue,
        windowStartVideoId: newWindowStartVideoId,
        isExtendingWindow: false,
      });

      log('player-pool', LogType.INFO,
        `✅ Window extended ${direction}: windowStartVideoId=${newWindowStartVideoId}`);

    } finally {
      // 🔑 如果发生异常，确保解锁
      const currentState = usePlayerPoolStore.getState();
      if (currentState.isExtendingWindow) {
        currentState.setIsExtendingWindow(false);
        log('player-pool', LogType.WARNING, 'Window extension failed, lock released in finally');
      }
    }
  }

  /**
   * 🆕 向后扩展窗口
   *
   * 当用户滑到窗口底部时触发
   */
  async extendWindowNext(
    feedVideoIds: string[],
    getVideoUrl: (id: string) => string | null,
    currentVideoId?: string | null
  ): Promise<void> {
    return this.extendWindowCore('next', feedVideoIds, getVideoUrl, currentVideoId);
  }

  /**
   * 🆕 向前扩展窗口
   *
   * 当用户滑到窗口顶部时触发
   */
  async extendWindowPrev(
    feedVideoIds: string[],
    getVideoUrl: (id: string) => string | null,
    currentVideoId?: string | null
  ): Promise<void> {
    return this.extendWindowCore('prev', feedVideoIds, getVideoUrl, currentVideoId);
  }

  /**
   * 进入 Fullscreen 模式
   *
   * 🔑 关键：这是一个同步方法，立即返回（几毫秒）
   * - 同步更新主池队列
   * - 异步下发视频加载任务（后台，不等待）
   * - 方法返回时，队列已更新，可以立即 acquire()
   * - UI 不会被阻塞
   */
  enterFullscreenMode(
    clickedVideoId: string,
    feedVideoIds: string[],
    getVideoUrl: (id: string) => string | null
  ): void {
    const state = usePlayerPoolStore.getState();

    // 🆕 v5.0: 基于 videoId 查找索引
    const clickedIndex = feedVideoIds.indexOf(clickedVideoId);

    if (clickedIndex === -1) {
      log('player-pool', LogType.ERROR,
        `Cannot enter fullscreen: video ${clickedVideoId} not in feed`);
      return;
    }

    log('player-pool', LogType.INFO,
      `Entering Fullscreen mode, clicked video: ${clickedVideoId} (index: ${clickedIndex})`);

    // === 步骤1：设置模式（保持 available pool 活跃，用于窗口扩展）===
    state.setMode(PoolMode.TRANSITIONING);

    // === 步骤2：计算窗口 ===
    const window = this.calculateWindow(clickedIndex, feedVideoIds);

    log('player-pool', LogType.INFO,
      `Window calculated: [${window.start}, ${window.end}], ${window.videoIds.length} videos`);

    // 🆕 v6.0: 保存窗口起始视频 ID
    // currentVideoId 由外部调用方管理（video entity）
    const windowStartVideoId = feedVideoIds[window.start];
    state.setWindowStartVideoId(windowStartVideoId);

    // === 步骤3：批量替换主池（同步更新队列，立即完成）===
    this.replaceMainQueueWithWindow(window.videoIds, clickedVideoId, getVideoUrl);

    log('player-pool', LogType.INFO,
      `Initialized: windowStartVideoId=${windowStartVideoId}`);

    state.setMode(PoolMode.FULLSCREEN);
    log('player-pool', LogType.INFO,
      'Fullscreen mode activated, available pool kept active for window extension');

    // 🔑 此时队列已更新，外部可以立即调用 acquire()
    // 视频加载在后台异步进行，不阻塞 UI
  }

  /**
   * 🆕 批量加载所有待加载的视频
   * 页面挂载后调用，后台异步加载
   *
   * 🔑 关键设计：下发 replaceAsync 后立即从队列移除
   * - 避免与 exitFullscreenMode 的并发竞态
   * - 已下发的视频不会在退出时被重置
   */
  loadPendingVideos(getVideoUrl: (id: string) => string | null): void {
    const state = usePlayerPoolStore.getState();

    if (state.pendingLoads.size === 0) {
      log('player-pool', LogType.DEBUG, 'No pending videos to load');
      return;
    }

    const pendingArray = Array.from(state.pendingLoads);

    log('player-pool', LogType.INFO,
      `Loading ${pendingArray.length} pending videos in background: [${pendingArray.join(', ')}]`);

    // 批量下发 replaceAsync 任务
    for (const videoId of pendingArray) {
      const meta = state.mainPoolQueue.find(m => m.videoId === videoId);

      if (!meta) {
        log('player-pool', LogType.WARNING,
          `Pending video not in main queue: ${videoId}`);
        continue;
      }

      // 🔑 关键：下发任务后立即从队列移除（防止并发竞态）
      state.removePendingLoad(videoId);

      // 异步下发任务（fire-and-forget）
      this.replaceOnMainQueuePlayer(meta.playerInstance, videoId, getVideoUrl)
        .then(() => {
          log('player-pool', LogType.INFO, `Pending video loaded: ${videoId}`);
        })
        .catch(error => {
          log('player-pool', LogType.ERROR,
            `Pending video load failed: ${videoId}: ${error}`);

          // 🔧 可选：加载失败时重置为 null（避免显示旧内容）
          meta.playerInstance.replaceAsync(null).catch(() => {});
        });
    }

    log('player-pool', LogType.DEBUG,
      `All pending tasks dispatched, pending queue cleared`);
  }

  /**
   * 退出 Fullscreen 模式，回到 Feed List 模式
   *
   * 🔑 关键设计：
   * 1. 先拿快照并立即清空队列（最小化竞态窗口）
   * 2. 将 pending 视频替换为空 key（保留 player 实例）
   * 3. 异步重置为 null source（防止缓存污染）
   */
  exitFullscreenMode(): void {
    const state = usePlayerPoolStore.getState();

    if (state.currentMode !== PoolMode.FULLSCREEN) {
      log('player-pool', LogType.DEBUG, 'Already in Feed List mode');
      return;
    }

    log('player-pool', LogType.INFO, 'Exiting Fullscreen mode');

    // 🔑 步骤1：先拿快照并立即清空（最小化竞态窗口）
    const pendingArray = Array.from(state.pendingLoads);
    state.clearPendingLoads();

    // 🔑 步骤2：清理 pending 视频
    if (pendingArray.length > 0) {
      log('player-pool', LogType.INFO,
        `Cleaning up ${pendingArray.length} pending videos: [${pendingArray.join(', ')}]`);

      // 🚀 性能优化：使用 Set 替代 Array.includes (O(1) vs O(n))
      const pendingSet = new Set(pendingArray);

      const mainQueue = [...state.mainPoolQueue];
      let emptyIndex = 0;

      for (let i = 0; i < mainQueue.length; i++) {
        const meta = mainQueue[i];

        if (pendingSet.has(meta.videoId)) {
          // pending 视频 → 替换为空 key
          const emptyKey = `${PLAYER_POOL_CONSTANTS.EMPTY_KEY_PREFIX}${emptyIndex++}`;

          mainQueue[i] = {
            playerInstance: meta.playerInstance,  // ✅ 保留实例
            videoId: emptyKey,
          };

          log('player-pool', LogType.DEBUG,
            `Replaced pending ${meta.videoId} with ${emptyKey}`);

          // ✅ 异步重置为 null source（防止缓存污染）
          meta.playerInstance.replaceAsync(null)
            .catch(error => {
              log('player-pool', LogType.WARNING,
                `Failed to reset pending player: ${error}`);
            });
        }
      }

      // 更新主池
      state.updateMainQueue(mainQueue);

      log('player-pool', LogType.INFO,
        `Cleaned ${pendingArray.length} pending videos, main queue: ${mainQueue.length}`);
    }

    // 🔑 步骤3：切换模式
    state.setMode(PoolMode.FEED_LIST);
    state.setWindowStartVideoId(null);  // 🆕 v6.0: 清空窗口起始 videoId
    // currentVideoId 由 video entity 管理，使用方负责清理
    state.setIsClearingAvailablePool(false);

    log('player-pool', LogType.INFO, 'Feed List mode activated');
  }

  /**
   * 后台异步清理 available pool
   */
  private clearAvailableQueueInBackground(): void {
    (async () => {
      try {
        const state = usePlayerPoolStore.getState();

        log('player-pool', LogType.DEBUG, 'Starting available queue cleanup');

        // 等待所有正在加载的完成
        while (state.availableQueue.some(p => p.isLocked)) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 重置为 null 源
        const availableQueue = state.availableQueue;
        for (const p of availableQueue) {
          await p.playerInstance.replaceAsync(null);
        }

        const currentState = usePlayerPoolStore.getState();
        currentState.setIsClearingAvailablePool(false);
        log('player-pool', LogType.INFO, 'Available queue cleared');
      } catch (error) {
        log('player-pool', LogType.ERROR,
          `Failed to clear available queue: ${error}`);
        const currentState = usePlayerPoolStore.getState();
        currentState.setIsClearingAvailablePool(false);
      }
    })();
  }

  /**
   * 销毁池（应用退出时）
   */
  destroy(): void {
    log('player-pool', LogType.INFO, 'Destroying player pool...');

    const state = usePlayerPoolStore.getState();

    // 释放主池
    for (const meta of state.mainPoolQueue) {
      try {
        meta.playerInstance.pause();
        meta.playerInstance.release();
      } catch (error) {
        log('player-pool', LogType.DEBUG, `Error releasing main queue player: ${error}`);
      }
    }

    // 释放available池
    for (const p of state.availableQueue) {
      try {
        p.playerInstance.pause();
        p.playerInstance.release();
      } catch (error) {
        log('player-pool', LogType.DEBUG, `Error releasing available queue player: ${error}`);
      }
    }

    state.resetPool();

    log('player-pool', LogType.INFO, 'Player pool destroyed');
  }
}

// 导出单例
export const playerPoolManager = PlayerPoolManager.getInstance();

// 开发环境调试
if (__DEV__) {
  (globalThis as any).__playerPoolManager = playerPoolManager;
  (globalThis as any).__playerPoolDebug = {
    getInfo: () => playerPoolManager.getPoolInfo(),
    destroy: () => playerPoolManager.destroy(),
  };
}
