/**
 * Player Pool 常量配置（双池架构）
 */

export const PLAYER_POOL_CONSTANTS = {
  /** 主池大小 */
  MAIN_POOL_SIZE: 13,

  /** Available池大小 */
  AVAILABLE_POOL_SIZE: 4,

  /** 每次预加载数量 */
  PRELOAD_BATCH_SIZE: 3,

  /** 空播放器 key 前缀 */
  EMPTY_KEY_PREFIX: '__EMPTY__',

  /** 默认播放器配置 */
  DEFAULT_PLAYER_CONFIG: {
    loop: false,
    volume: 1.0,
    muted: false,
  },
} as const;