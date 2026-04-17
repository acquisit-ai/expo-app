/**
 * 播放器同步 Hooks 统一导出
 * 包含播放器实例与 video entity store 之间的同步机制
 */

// 播放器事件同步（同步到 Store）
export { usePlayerEventSync } from './usePlayerEventSync';

// 时间更新间隔管理
export { useTimeUpdateInterval } from './useTimeUpdateInterval';