/**
 * 小屏嵌入式布局组件
 * 适用于列表中的视频预览、小窗口播放等场景
 *
 * 特点：
 * - 简化的控件集合
 * - 紧凑的布局设计
 * - 基本播放控制
 * - 适合手机触控操作
 */

import React from 'react';
import { View } from 'react-native';
import { VideoTopBar } from '../bars/VideoTopBar';
import { VideoBottomBar } from '../bars/VideoBottomBar';
import { useVideoCoreControls } from '../../hooks/VideoCoreControlsContext';

/**
 * 小屏布局配置接口
 */
export interface SmallScreenLayoutProps {
  // 控制栏显示
  showTopBar?: boolean;
  showBottomBar?: boolean;

  // 导航控制
  showBackButton?: boolean;

  // 播放控制
  showPlayButton?: boolean;
  showProgress?: boolean;
  showTime?: boolean;
  showFullscreen?: boolean;

  // 样式定制
  compact?: boolean;
  transparent?: boolean;
}

/**
 * 小屏嵌入式布局组件
 * 从Context获取所有数据，提供简洁的控制界面
 */
export const SmallScreenLayout: React.FC<SmallScreenLayoutProps> = ({
  showTopBar = true,
  showBottomBar = true,
  showBackButton = true,
  showPlayButton = true,
  showProgress = true,
  showTime = true,
  showFullscreen = true,
  compact = false,
  transparent = false,
}) => {
  const {
    size,
    onBack,
    showBackButton: contextShowBackButton,
    onInteraction,
  } = useVideoCoreControls();

  return (
    <View style={{ flex: 1 }} pointerEvents="box-none">
      {/* 顶部控制栏 */}
      {showTopBar && (
        <VideoTopBar
          showBack={showBackButton && contextShowBackButton}
          onBack={onBack}
          size={compact ? 'small' : size}
          transparent={transparent}
          onInteraction={onInteraction}
          topPadding={0}
        />
      )}

      {/* 底部控制栏 */}
      {showBottomBar && (
        <VideoBottomBar
          layout="horizontal"
          showPlayButton={showPlayButton}
          showProgress={showProgress}
          showTime={showTime}
          showFullscreen={showFullscreen}
          showVolume={false} // 小屏模式不显示音量控制
          bottomPadding={0} // 小屏不需要底部间距
        />
      )}
    </View>
  );
};

SmallScreenLayout.displayName = 'SmallScreenLayout';