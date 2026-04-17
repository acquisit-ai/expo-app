/**
 * 视频底部控制栏
 * 使用VideoCoreControlsContext的独立组件
 *
 * 架构原则：
 * - 完全依赖Context，无props
 * - 通过Context获取统一的时间和状态管理
 * - 支持flexible布局配置
 */

import React from 'react';
import { View } from 'react-native';
import { ControlBar } from '../shared/ControlBar';
import { ControlBarSection } from '../shared/ControlBarSection';
import { ControlGroup } from '../shared/ControlGroup';
import { PlayButton } from '../controls/PlayButton';
import { FullscreenToggle } from '../controls/FullscreenToggle';
import { TimeDisplay } from '../controls/TimeDisplay';
import { ProgressBar } from '../controls/ProgressBar';
import { useVideoCoreControls } from '../../hooks/VideoCoreControlsContext';

/**
 * 视频底部控制栏配置接口
 */
export interface VideoBottomBarConfig {
  showPlayButton?: boolean;
  showProgress?: boolean;
  showTime?: boolean;
  showFullscreen?: boolean;
  showVolume?: boolean;
  layout?: 'horizontal' | 'portrait-fullscreen';
  bottomPadding?: number;
}

/**
 * 视频底部控制栏 - 独立组件
 *
 * 职责：
 * - 从Context获取所有数据和状态
 * - 组织控件布局
 * - 处理交互回调
 */
export const VideoBottomBar: React.FC<VideoBottomBarConfig> = React.memo(({
  showPlayButton = true,
  showProgress = true,
  showTime = true,
  showFullscreen = true,
  showVolume = false,
  layout = 'horizontal',
  bottomPadding = 0,
}) => {
  // 从Context获取所有数据和状态
  const {
    displayTime,
    isPlaying,
    onPlayToggle,
    bufferedTime,
    duration,
    size,
    isFullscreen,
    progressHandlers,
    onToggleFullscreen,
    onInteraction,
  } = useVideoCoreControls();

  // 简单的回调封装
  const handlePlayToggle = React.useCallback(() => {
    onPlayToggle?.();
    onInteraction?.();
  }, [onPlayToggle, onInteraction]);

  const handleFullscreenToggle = React.useCallback(() => {
    onToggleFullscreen?.();
    onInteraction?.();
  }, [onToggleFullscreen, onInteraction]);

  // 竖屏全屏布局
  if (layout === 'portrait-fullscreen') {
    return (
      <ControlBar position="bottom" size={size} bottomPadding={bottomPadding}>
        <ControlBarSection direction="vertical">
          {/* 进度条区域 */}
          {showProgress && (
            <View style={{ width: '100%', marginBottom: 2 }}>
              <ProgressBar
                size={size}
                currentTime={displayTime}
                bufferedTime={bufferedTime}
                duration={duration}
                onInteraction={onInteraction}
                onDragStart={progressHandlers.onDragStart}
                onValueChange={progressHandlers.onDragUpdate}
                onDragEnd={progressHandlers.onDragEnd}
              />
            </View>
          )}

          {/* 控制按钮区域 */}
          <ControlBarSection direction="horizontal" justify="space-between">
            {/* 左侧组 */}
            <ControlGroup align="left" spacing="md">
              {showPlayButton && (
                <PlayButton
                  isPlaying={isPlaying}
                  onToggle={handlePlayToggle}
                  size={size}
                  onInteraction={onInteraction}
                />
              )}
              {showTime && (
                <TimeDisplay
                  size={size}
                  currentTime={displayTime}
                  duration={duration}
                />
              )}
            </ControlGroup>

            {/* 右侧组 */}
            <ControlGroup align="right" spacing="md">
              {showTime && (
                <TimeDisplay
                  size={size}
                  currentTime={displayTime}
                  duration={duration}
                  showRemaining
                />
              )}
              {showFullscreen && (
                <FullscreenToggle
                  isFullscreen={isFullscreen}
                  onToggle={handleFullscreenToggle}
                  size={size}
                  onInteraction={onInteraction}
                />
              )}
            </ControlGroup>
          </ControlBarSection>
        </ControlBarSection>
      </ControlBar>
    );
  }

  // 横向布局（默认）
  return (
    <ControlBar position="bottom" size={size} bottomPadding={bottomPadding}>
      <ControlBarSection direction="horizontal" align="center">
        {/* 播放按钮 */}
        <ControlGroup align="left">
          {showPlayButton && (
            <PlayButton
              isPlaying={isPlaying}
              onToggle={handlePlayToggle}
              size={size}
              onInteraction={onInteraction}
            />
          )}
        </ControlGroup>

        {/* 时间和进度条 */}
        <ControlGroup flex={1} spacing="sm">
          {showTime && (
            <TimeDisplay
              size={size}
              currentTime={displayTime}
              duration={duration}
            />
          )}

          {showProgress && (
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <ProgressBar
                size={size}
                currentTime={displayTime}
                bufferedTime={bufferedTime}
                duration={duration}
                onInteraction={onInteraction}
                onDragStart={progressHandlers.onDragStart}
                onValueChange={progressHandlers.onDragUpdate}
                onDragEnd={progressHandlers.onDragEnd}
              />
            </View>
          )}

          {showTime && (
            <TimeDisplay
              size={size}
              currentTime={displayTime}
              duration={duration}
              showRemaining
            />
          )}
        </ControlGroup>

        {/* 附加控制 */}
        <ControlGroup align="right" spacing="sm">
          {showVolume && (
            // 音量控制占位符
            <View style={{ width: 32, height: 32 }} />
          )}
          {showFullscreen && (
            <FullscreenToggle
              isFullscreen={isFullscreen}
              onToggle={handleFullscreenToggle}
              size={size}
              onInteraction={onInteraction}
            />
          )}
        </ControlGroup>
      </ControlBarSection>
    </ControlBar>
  );
});

VideoBottomBar.displayName = 'VideoBottomBar';