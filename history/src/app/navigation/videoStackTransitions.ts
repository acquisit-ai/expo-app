/**
 * VideoStack 自定义转场动画配置
 * 为 Detail ↔ Fullscreen 切换提供平滑的 Fade 动画
 */

import { StackCardStyleInterpolator } from '@react-navigation/stack';

/**
 * 视频播放器 Fade 转场动画
 * Detail ↔ Fullscreen: 纯淡入淡出效果
 */
export const videoPlayerFadeTransition: StackCardStyleInterpolator = ({
  current,
  next,
}) => {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * 快速转场配置（250ms timing）
 */
export const videoTransitionSpec = {
  animation: 'timing' as const,
  config: {
    duration: 250,
  },
};
