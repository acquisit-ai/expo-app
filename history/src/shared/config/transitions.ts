/**
 * Reanimated Shared Element Transitions 配置
 * 用于页面间的共享元素动画
 */

/**
 * 共享元素标签常量
 * 确保在不同页面使用相同的标签
 *
 * 使用说明：
 * - SmallVideoPlayer 和 FullscreenVideoPlayer 容器上使用相同的 sharedTransitionTag
 * - Reanimated 会自动识别并执行共享元素过渡动画
 * - 自动处理位置、大小、透明度等属性的平滑过渡
 * - 默认使用 500ms 的 timing 动画
 *
 * 实现位置：
 * - src/features/video-player/ui/SmallVideoPlayer.tsx
 * - src/features/video-player/ui/FullscreenVideoPlayer.tsx
 * - 通过 Widget 层传递：SmallVideoPlayerSection 和 FullscreenVideoPlayerSection
 */
export const SHARED_ELEMENT_TAGS = {
  VIDEO_PLAYER: 'videoPlayerContainer',
} as const;
