/**
 * 视频播放器功能模块统一导出
 *
 * 这个模块封装了完整的视频播放器功能，包括：
 * - 视频播放控制逻辑
 * - 播放器UI组件
 * - 动画工具函数
 * - 相关类型定义
 */

// 模型层导出
export * from './model';

// UI组件导出
export * from './ui';

// 动画Hook导出
export { useButtonAnimation } from './hooks/useButtonAnimation';

// 工具库导出
export * from './lib';