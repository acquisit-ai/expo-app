/**
 * Player Pool Entity
 *
 * 独立的播放器池管理模块
 * 使用 LRU 策略管理固定数量的视频播放器实例
 *
 * @module player-pool
 */

// === 核心管理器 ===
export { playerPoolManager } from './model/manager';

// === Store ===
export { usePlayerPoolStore, playerPoolSelectors } from './model/store';

// === Hooks ===
// 注意：所有 hooks 已被移除，直接使用 usePlayerPoolStore 和 playerPoolSelectors

// === 类型定义 ===
export type {
  MainPlayerMeta,
  AvailablePlayer,
  VideoPlayerStatus,
  PlayerPoolConfig,
  PoolInfo,
  PlayerPoolStore,
  IPlayerPoolManager,
  WindowCalculation,
} from './model/types';

export { PoolMode } from './model/types';

// === 常量 ===
export { PLAYER_POOL_CONSTANTS } from './lib/constants';