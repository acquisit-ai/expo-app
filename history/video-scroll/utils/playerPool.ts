import { createVideoPlayer } from 'expo-video';
import type { VideoPlayer, VideoSource } from 'expo-video';

/**
 * Player Pool 管理器
 *
 * 预创建固定数量的 player 实例，避免频繁创建/销毁的开销
 */
class PlayerPoolManager {
  private pool: VideoPlayer[] = [];
  private availablePlayers: Set<VideoPlayer> = new Set();
  private busyPlayers: Map<string, VideoPlayer> = new Map(); // videoId -> player

  /**
   * 初始化 pool
   * @param poolSize - pool 大小（窗口大小13 + 批次大小4 = 17）
   *                   窗口结构：前6 + 当前1 + 后6 = 13个
   */
  initialize(poolSize: number = 17) {
    console.log(`🏊 Initializing player pool with ${poolSize} players`);

    for (let i = 0; i < poolSize; i++) {
      // 创建 null 源的 player
      const player = createVideoPlayer(null);

      // 配置默认设置
      player.loop = true;
      player.muted = false;
      player.volume = 1.0;

      this.pool.push(player);
      this.availablePlayers.add(player);
    }

    console.log(`✅ Player pool initialized: ${this.availablePlayers.size} available`);
  }

  /**
   * 获取一个可用的 player
   * @param videoId - 视频 ID
   * @param videoUrl - 视频 URL
   * @returns player 实例
   */
  async acquirePlayer(videoId: string, videoUrl: string): Promise<VideoPlayer | null> {
    // 检查是否已经分配
    if (this.busyPlayers.has(videoId)) {
      console.warn(`⚠️  Player already acquired for ${videoId}`);
      return this.busyPlayers.get(videoId)!;
    }

    // 从 pool 获取一个可用 player
    const availablePlayersArray = Array.from(this.availablePlayers);
    if (availablePlayersArray.length === 0) {
      console.error('❌ No available players in pool!');
      return null;
    }

    const player = availablePlayersArray[0];
    this.availablePlayers.delete(player);

    console.log(`📤 Acquiring player for ${videoId} (available: ${this.availablePlayers.size})`);

    // 异步加载视频源
    try {
      await player.replaceAsync(videoUrl);
      console.log(`✅ Player source loaded for ${videoId}`);
    } catch (error) {
      console.error(`❌ Failed to load source for ${videoId}:`, error);
      // 加载失败，归还 player
      this.availablePlayers.add(player);
      return null;
    }

    // 标记为忙碌
    this.busyPlayers.set(videoId, player);

    return player;
  }

  /**
   * 释放 player（归还 pool）
   * @param videoId - 视频 ID
   */
  async releasePlayer(videoId: string): Promise<void> {
    const player = this.busyPlayers.get(videoId);

    if (!player) {
      console.warn(`⚠️  No player found for ${videoId}`);
      return;
    }

    console.log(`📥 Releasing player for ${videoId} (available: ${this.availablePlayers.size})`);

    // 清空源（保留 player）
    try {
      await player.replaceAsync(null);
      console.log(`✅ Player source cleared for ${videoId}`);
    } catch (error) {
      console.error(`❌ Failed to clear source for ${videoId}:`, error);
    }

    // 归还 pool
    this.busyPlayers.delete(videoId);
    this.availablePlayers.add(player);

    console.log(`✅ Player returned to pool (available: ${this.availablePlayers.size})`);
  }

  /**
   * 获取已分配的 player
   * @param videoId - 视频 ID
   */
  getPlayer(videoId: string): VideoPlayer | null {
    return this.busyPlayers.get(videoId) || null;
  }

  /**
   * 销毁整个 pool（App 退出时调用）
   */
  destroy(): void {
    console.log('🗑️  Destroying player pool');

    this.pool.forEach(player => {
      try {
        player.release();
      } catch (error) {
        console.error('Failed to release player:', error);
      }
    });

    this.pool = [];
    this.availablePlayers.clear();
    this.busyPlayers.clear();

    console.log('✅ Player pool destroyed');
  }

  /**
   * 获取 pool 状态
   */
  getStatus() {
    return {
      total: this.pool.length,
      available: this.availablePlayers.size,
      busy: this.busyPlayers.size,
    };
  }
}

// 单例
export const playerPool = new PlayerPoolManager();
