/**
 * 视频播放器浮动动画工具函数
 *
 * 提供视频播放器功能专用的浮动/滚动动画逻辑和插值计算函数
 * 实现视频播放器特有的浮动效果动画
 */

import { interpolate, SharedValue } from 'react-native-reanimated';
import { VIDEO_PLAYER_CONSTANTS } from '../model/constants';

const { ANIMATION, LAYOUT } = VIDEO_PLAYER_CONSTANTS;

/**
 * 视频容器滚动变换动画参数
 */
export interface VideoScrollTransformParams {
  /** 有效滚动位置 */
  effectiveScrollY: SharedValue<number>;
  /** 播放过渡动画值 */
  playingTransition: SharedValue<number>;
}

/**
 * 遮罩层动画参数
 */
export interface OverlayAnimationParams {
  /** 有效滚动位置 */
  effectiveScrollY: SharedValue<number>;
  /** 播放过渡动画值 */
  playingTransition: SharedValue<number>;
}

/**
 * 🚀 优化: 预计算插值范围，避免重复计算
 */
const INTERPOLATION_RANGES = {
  input: [0, ANIMATION.MAX_SCROLL] as const,
  playingTransition: [0, 1] as const,

  // 视频容器动画
  scrollTranslateY: [0, -ANIMATION.MAX_SCROLL] as const,

  // 遮罩层动画
  overlayOpacity: [0, 0.6] as const,
} as const;

/**
 * 计算视频容器的滚动变换
 *
 * @param params 动画参数
 * @returns 变换样式对象
 */
export const calculateVideoScrollTransform = ({
  effectiveScrollY,
  playingTransition,
}: VideoScrollTransformParams) => {
  'worklet';

  // 🚀 优化: 使用预定义的插值范围
  const scrollTranslateY = interpolate(
    effectiveScrollY.value,
    INTERPOLATION_RANGES.input,
    INTERPOLATION_RANGES.scrollTranslateY,
    'clamp'
  );

  const translateY = interpolate(
    playingTransition.value,
    INTERPOLATION_RANGES.playingTransition,
    [scrollTranslateY, 0],
    'clamp'
  );

  return {
    transform: [{ translateY }],
  };
};

/**
 * 计算遮罩层的动画样式
 *
 * @param params 动画参数
 * @returns 遮罩层样式对象
 */
export const calculateOverlayAnimation = ({
  effectiveScrollY,
  playingTransition,
}: OverlayAnimationParams) => {
  'worklet';

  // 🚀 优化: 使用预定义的插值范围
  const scrollOpacity = interpolate(
    effectiveScrollY.value,
    INTERPOLATION_RANGES.input,
    INTERPOLATION_RANGES.overlayOpacity,
    'clamp'
  );

  const opacity = interpolate(
    playingTransition.value,
    INTERPOLATION_RANGES.playingTransition,
    [scrollOpacity, 0],
    'clamp'
  );

  return {
    backgroundColor: `rgba(0, 0, 0, ${opacity})`,
  };
};

/**
 * 滚动处理逻辑工具函数
 */
export const createVideoScrollLogic = () => {
  /**
   * 处理播放状态下的滚动逻辑
   *
   * @param scrollY 当前滚动位置
   * @param scrollOffsetRaw 原始滚动偏移量
   * @param effectiveScrollY 有效滚动位置
   * @param isPlayAnimating 是否正在播放动画
   */
  const handlePlayingScroll = (
    scrollY: number,
    scrollOffsetRaw: SharedValue<number>,
    effectiveScrollY: SharedValue<number>,
    isPlayAnimating: boolean
  ) => {
    'worklet';

    // 如果不在播放动画中，才设置effectiveScrollY
    if (!isPlayAnimating) {
      effectiveScrollY.value = 0;
    }
    // 实时更新偏移量
    scrollOffsetRaw.value = scrollY;
  };

  /**
   * 处理暂停状态下的滚动逻辑
   *
   * @param scrollY 当前滚动位置
   * @param scrollOffset 滚动偏移基准
   * @param scrollOffsetRaw 原始滚动偏移量
   * @param effectiveScrollY 有效滚动位置
   */
  const handlePausedScroll = (
    scrollY: number,
    scrollOffset: SharedValue<number>,
    scrollOffsetRaw: SharedValue<number>,
    effectiveScrollY: SharedValue<number>
  ) => {
    'worklet';

    // 暂停状态：计算相对于暂停时位置的滚动
    const relativeScroll = scrollY - scrollOffset.value;

    // 如果向上滚动（relativeScroll < 0），保持视频完整大小，并更新偏移量
    if (relativeScroll < 0) {
      effectiveScrollY.value = 0;
      // 更新偏移量到当前位置
      scrollOffsetRaw.value = scrollY;
    } else {
      // 向下滚动，根据滚动距离压缩
      effectiveScrollY.value = Math.min(relativeScroll, ANIMATION.MAX_SCROLL);

      // 如果已经压缩到最小，重置偏移量到初始位置（0）
      if (relativeScroll >= ANIMATION.MAX_SCROLL) {
        scrollOffsetRaw.value = 0;
      }
    }
  };

  return {
    handlePlayingScroll,
    handlePausedScroll,
  };
};

/**
 * 动画预设配置（重新导出）
 */
export const ANIMATION_PRESETS = VIDEO_PLAYER_CONSTANTS.PRESETS;

/**
 * 动画常量（重新导出）
 */
export const ANIMATION_CONSTANTS = VIDEO_PLAYER_CONSTANTS.ANIMATION;