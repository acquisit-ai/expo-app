/**
 * 全屏横屏布局组件
 * 适用于横屏全屏视频播放、桌面端播放等场景
 *
 * 特点：
 * - 横屏布局优化，充分利用宽屏空间
 * - 侧边控制区域（音量、亮度等）
 * - 自动隐藏机制
 * - 屏幕方向控制
 * - 投屏功能支持
 * - 桌面端适配
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VideoTopBar } from '../bars/VideoTopBar';
import { VideoBottomBar } from '../bars/VideoBottomBar';
import { useVideoCoreControls } from '../../hooks/VideoCoreControlsContext';
import { log, LogType } from '@/shared/lib/logger';


/**
 * 全屏横屏布局配置接口
 */
export interface FullscreenLandscapeLayoutProps {
  // 基础控制栏
  showTopBar?: boolean;
  showBottomBar?: boolean;
  showBackButton?: boolean;

  // 横屏特有控制
  enableOrientationControl?: boolean;

  // 布局配置
  controlsAutoHide?: boolean;
  autoHideDelay?: number;
  showMouseCursor?: boolean; // 桌面端适配
}


/**
 * 全屏横屏布局组件
 * 提供桌面级的视频播放体验
 */
export const FullscreenLandscapeLayout: React.FC<FullscreenLandscapeLayoutProps> = ({
  showTopBar = true,
  showBottomBar = true,
  showBackButton = true,
  enableOrientationControl = true,
}) => {
  const {
    size,
    onBack,
    showBackButton: contextShowBackButton,
    onInteraction,
  } = useVideoCoreControls();

  // 横屏响应式间距计算
  const landscapeSizes = useMemo(() => {
    const { width, height } = Dimensions.get('window');
    // 横屏时，宽度 > 高度
    const isLandscape = width > height;
    return {
      horizontalPadding: isLandscape ? width * 0.05 : 0, // 5%横屏左右间距
      verticalPadding: isLandscape ? height * 0.03 : 0,   // 3%横屏上下间距
    };
  }, []);


  // 处理屏幕方向控制
  const handleOrientationBack = async () => {
    if (enableOrientationControl) {
      try {
        // 1. 锁定屏幕为竖屏
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        log('fullscreen-landscape-layout', LogType.INFO, 'Locked orientation to portrait');

        // 2. 等待屏幕旋转生效
        await new Promise(resolve => setTimeout(resolve, 100));

        // 3. 执行返回操作
        onBack?.();
      } catch (error) {
        log('fullscreen-landscape-layout', LogType.ERROR, `Error handling orientation back: ${error}`);
        // 如果方向控制失败，直接执行返回
        onBack?.();
      }
    } else {
      onBack?.();
    }
  };


  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 顶部控制栏 - 绝对定位 */}
      {showTopBar && (
        <VideoTopBar
          showBack={showBackButton && contextShowBackButton}
          onBack={handleOrientationBack}
          size={size}
          onInteraction={onInteraction}
          topPadding={Dimensions.get('window').height * 0.03}
        />
      )}

      {/* 中间区域（播放按钮等可以放在这里） */}
      <View style={[
        styles.middleArea,
        {
          paddingHorizontal: landscapeSizes.horizontalPadding,
          paddingVertical: landscapeSizes.verticalPadding,
        }
      ]} />

      {/* 底部控制栏 - 绝对定位 */}
      {showBottomBar && (
        <VideoBottomBar
          layout="horizontal"
          showPlayButton={true}
          showProgress={true}
          showTime={true}
          showFullscreen={true}
          showVolume={false}
          bottomPadding={Dimensions.get('window').height * 0.03}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  middleArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

FullscreenLandscapeLayout.displayName = 'FullscreenLandscapeLayout';