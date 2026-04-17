/**
 * 视频播放器内容组件 - 可复用版本
 * 提供统一的视频播放器渲染逻辑，包含加载状态、错误状态和播放按钮
 * 可同时被SmallVideoPlayer和FullscreenVideoPlayer使用
 */

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { VideoView, type VideoPlayer } from 'expo-video';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerReadyState } from '@/shared/hooks';

export interface VideoPlayerContentProps {
  /** 播放器实例 */
  playerInstance: VideoPlayer;
  /** 视频URL */
  videoUrl: string;
  /** 是否自动启动画中画 */
  startsPictureInPictureAutomatically: boolean;
  /** 视频显示区域样式 */
  videoDisplayStyle: StyleProp<ViewStyle>;
  /** 遮罩层动画样式 */
  overlayAnimatedStyle?: AnimatedStyle<ViewStyle>;
  /** 是否允许画中画 */
  allowsPictureInPicture?: boolean;
  /** 全屏选项配置 */
  fullscreenOptions?: {
    enable: boolean;
    resizeMode: 'contain' | 'cover' | 'stretch';
  };
}

/**
 * 动画遮罩层组件
 * 提供始终覆盖在播放器上的透明度动画效果
 */
const AnimatedOverlay: React.FC<{
  animatedStyle?: AnimatedStyle<any>;
}> = ({ animatedStyle }) => {
  if (!animatedStyle) return null;

  return (
    <Animated.View
      style={[styles.overlay, animatedStyle]}
      pointerEvents="none"
    />
  );
};

/**
 * 视频播放器内容组件
 *
 * 功能特性：
 * - 根据播放器状态智能切换显示内容
 * - 统一的加载和错误状态处理
 * - 遮罩层集成
 * - 高度可配置的样式和行为
 */
export const VideoPlayerContent: React.FC<VideoPlayerContentProps> = ({
  playerInstance,
  videoUrl,
  startsPictureInPictureAutomatically,
  videoDisplayStyle,
  overlayAnimatedStyle,
  allowsPictureInPicture = true, // 默认启用画中画支持
  fullscreenOptions = { enable: true, resizeMode: 'contain' },
}) => {
  // ✅ 本地状态：每个播放器实例独立跟踪自己的 isPlayerReady
  // 不从 Entity Store 读取（Entity Store 只维护当前播放器的全局状态）
  const { isPlayerReady } = usePlayerReadyState(playerInstance);

  // 视频配置
  const showNativeControls = false;

  // 状态判断
  const playerStatus = playerInstance?.status || 'idle';
  const isLoading = !isPlayerReady && playerStatus === 'loading';
  const hasError = playerStatus === 'error';

  // 显示逻辑
  const shouldShowVideoPlayer = isPlayerReady && videoUrl && playerInstance;

  // UI 层额外保护：一旦视频显示过，就不再显示 loading 动画
  // 这是最后一层防护，确保即使源头有状态切换也不会影响用户体验
  const [hasShownVideo, setHasShownVideo] = useState(false);

  // 跟踪视频URL变化，重置"已显示"标志
  useEffect(() => {
    setHasShownVideo(false);
  }, [videoUrl]);

  // 一旦视频显示，标记为已显示
  useEffect(() => {
    if (shouldShowVideoPlayer && !hasShownVideo) {
      setHasShownVideo(true);
    }
  }, [shouldShowVideoPlayer, hasShownVideo]);

  // 最终的 loading 状态：只在首次加载且未显示过视频时才显示
  const shouldShowLoading = isLoading && !hasShownVideo;

  return (
    <>
      {/* 内容层：根据播放器状态显示不同内容 */}
      {shouldShowVideoPlayer ? (
        // 播放器准备就绪：显示VideoView
        <VideoView
          style={videoDisplayStyle}
          player={playerInstance}
          fullscreenOptions={fullscreenOptions}
          allowsPictureInPicture={allowsPictureInPicture}
          startsPictureInPictureAutomatically={startsPictureInPictureAutomatically}
          nativeControls={showNativeControls}
          allowsVideoFrameAnalysis={false}
          pointerEvents="none"
        />
      ) : (
        // 播放器未准备：显示状态指示
        <View style={[videoDisplayStyle, styles.placeholderContainer]} pointerEvents="none">
          {/* 加载状态指示器 - 只在首次加载时显示 */}
          {shouldShowLoading && (
            <View style={styles.statusOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Loading video...</Text>
              </View>
            </View>
          )}

          {/* 错误状态指示器 */}
          {hasError && (
            <View style={styles.statusOverlay}>
              <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={48} color="#FF6B6B" style={styles.errorIcon} />
                <Text style={styles.errorTitle}>播放失败</Text>
                <Text style={styles.errorMessage}>视频加载遇到问题</Text>
                <View style={styles.retryHint}>
                  <Ionicons name="refresh-outline" size={16} color="#888888" />
                  <Text style={styles.retryText}>请退出重试</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* 动画遮罩层 - 始终覆盖在整个播放器上 */}
      <AnimatedOverlay animatedStyle={overlayAnimatedStyle} />
    </>
  );
};

/**
 * 组件样式
 */
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderContainer: {
    backgroundColor: '#000000', // 黑色背景作为视频加载前的占位
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // 更深的背景提高对比度
  },
  // 加载状态样式
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  // 错误状态样式
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    maxWidth: 280,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  retryText: {
    color: '#888888',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
});