/**
 * 视频控件覆盖层 Widget
 * Widget层组件 - 组合多个Feature层功能
 */

import React from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { VideoDisplayMode, type PlayerMeta } from '@/shared/types';
import { useVideoControlsComposition } from '../hooks/useVideoControlsComposition';
import { VideoCoreControlsProvider } from '@/features/video-core-controls';
import { AnimatedPlayButton } from './AnimatedPlayButton';
import { SeekFeedback } from './SeekFeedback';

export interface VideoControlsOverlayProps {
  playerMeta: PlayerMeta; // 播放器元数据（包含 videoId 和 playerInstance）
  displayMode: VideoDisplayMode;
  isActiveVideo: boolean; // 是否为当前活跃视频（由 Widget 层判断）
  onToggleFullscreen?: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  scrollY?: SharedValue<number>;
  isPlayingShared?: SharedValue<boolean>;
}

/**
 * 视频控件覆盖层 Widget
 *
 * 🎯 Widget 层职责：
 * - 多 Feature 组合：video-core-controls + video-gestures + subtitle-display
 * - 状态协调：控件可见性、自动隐藏、滚动感知
 * - 布局选择：根据displayMode选择不同布局策略
 * - 事件编排：手势 → 播放控制 → 字幕导航
 */
export const VideoControlsOverlay: React.FC<VideoControlsOverlayProps> = React.memo((props) => {
  // 🎯 单一数据源 - 所有状态、配置、逻辑的统一来源
  const {
    coreControlsProps,
    gestureProps,
    animationProps,
    LayoutComponent,
  } = useVideoControlsComposition(props);

  return (
    <>
      {/* 快进回退反馈系统 */}
      <SeekFeedback
        forwardOpacity={gestureProps.seekFeedbackTrigger.forwardOpacity}
        backwardOpacity={gestureProps.seekFeedbackTrigger.backwardOpacity}
      />

      <View style={{ flex: 1 }}>
        {/* 手势检测层 - 处理背景交互 */}
        <GestureDetector gesture={gestureProps.tapGesture}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        </GestureDetector>

        {/* 控件渲染层 - 所有可见控件 */}
        <Animated.View
          style={[
            {
              flex: 1,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            },
            animationProps.animatedStyle
          ]}
          pointerEvents="box-none"
        >
          {/* 🎯 统一数据流：组合Hook → video-core-controls */}
          <VideoCoreControlsProvider {...coreControlsProps}>
            {/* 中央播放按钮 */}
            <AnimatedPlayButton visible={animationProps.shouldShowPlayButton} />
            {/* 动态布局系统 */}
            <LayoutComponent />
          </VideoCoreControlsProvider>
        </Animated.View>
      </View>
    </>
  );
});

VideoControlsOverlay.displayName = 'VideoControlsOverlay';
