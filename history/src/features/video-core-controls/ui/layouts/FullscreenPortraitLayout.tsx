/**
 * 全屏竖屏布局组件
 * 适用于移动端全屏视频播放、短视频应用等场景
 *
 * 特点：
 * - 增强尺寸控件，适合全屏操作
 * - TikTok风格侧边栏
 * - 社交功能集成（Like、Favorite）
 * - 内容功能（字幕、翻译）
 * - 触觉反馈增强体验
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VideoTopBar } from '../bars/VideoTopBar';
import { VideoBottomBar } from '../bars/VideoBottomBar';
import { useVideoCoreControls } from '../../hooks/VideoCoreControlsContext';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { getBarDimensions } from '../../model/constants';
import { palette } from '@/shared/config/theme';

// 社交按钮颜色配置
const SOCIAL_BUTTON_COLORS = {
  like: '#FF4569',
  favorite: '#FFA500',
  translation: '#00BFFF',
  subtitles: '#00BFFF',
} as const;


/**
 * 侧边栏按钮配置
 */
interface SideBarButtonConfig {
  key: string;
  icon: string;
  iconLibrary: 'MaterialCommunityIcons' | 'Ionicons';
  isActive?: boolean;
  onPress: () => void;
  activeColor?: string;
  enableHaptics?: boolean;
}

/**
 * 全屏竖屏布局配置接口
 */
export interface FullscreenPortraitLayoutProps {
  // 基础控制栏
  showTopBar?: boolean;
  showBottomBar?: boolean;
  showBackButton?: boolean;

  // 社交功能
  showLikeButton?: boolean;
  showFavoriteButton?: boolean;
  showShareButton?: boolean;

  // 内容功能
  showSubtitlesToggle?: boolean;
  showTranslationToggle?: boolean;
  showCommentsButton?: boolean;

  // 侧边栏配置
  sideBarPosition?: 'right' | 'left';
  customSideBarButtons?: SideBarButtonConfig[];

  // 样式增强
  enhancedSize?: boolean;
}

/**
 * TikTok风格图标按钮
 */
const TikTokStyleIcon: React.FC<{
  iconName: string;
  iconLibrary: 'MaterialCommunityIcons' | 'Ionicons';
  isActive?: boolean;
  onPress: () => void;
  activeColor?: string;
  enableHaptics?: boolean;
  iconSize?: number;
  buttonSize?: number;
}> = ({
  iconName,
  iconLibrary,
  isActive = false,
  onPress,
  activeColor = SOCIAL_BUTTON_COLORS.like,
  enableHaptics = false,
  iconSize = 32,
  buttonSize = 56,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const IconComponent = iconLibrary === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

  return (
    <TouchableOpacity
      style={[
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          justifyContent: 'center',
          alignItems: 'center',
          // 阴影效果
          shadowColor: palette.black,
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5, // Android 阴影
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <IconComponent
        name={iconName as any}
        size={iconSize}
        color={isActive ? `${activeColor}D9` : `${palette.white}D9`} // 85% 透明度
      />
    </TouchableOpacity>
  );
};

/**
 * 全屏竖屏布局组件
 * 提供TikTok风格的用户界面和丰富的交互功能
 */
export const FullscreenPortraitLayout: React.FC<FullscreenPortraitLayoutProps> = ({
  showTopBar = true,
  showBottomBar = true,
  showBackButton = true,
  showLikeButton = true,
  showFavoriteButton = true,
  showShareButton = false,
  showSubtitlesToggle = true,
  showTranslationToggle = true,
  showCommentsButton = false,
  sideBarPosition = 'right',
  customSideBarButtons,
  enhancedSize = true,
}) => {
  const {
    size,
    isFullscreen,
    onBack,
    showBackButton: contextShowBackButton,
    onInteraction,
    // 社交功能
    isLiked,
    isFavorited,
    onToggleLike,
    onToggleFavorite,
    // 内容功能
    showSubtitles,
    showTranslation,
    onToggleSubtitles,
    onToggleTranslation,
  } = useVideoCoreControls();

  const { theme } = useTheme();

  // 计算控件尺寸
  const controlSize = enhancedSize ? 'large' : size;

  // 响应式尺寸计算 - 使用 useMemo 缓存
  const responsiveSizes = useMemo(() => {
    const { width, height } = Dimensions.get('window');
    const buttonSize = width * 0.13;

    // 计算底部控制栏的实际高度
    const bottomBarDimensions = getBarDimensions(controlSize);
    const bottomBarPadding = height * 0.05; // 底部控制栏的内部底边距
    const bottomBarTotalHeight = bottomBarDimensions.height + bottomBarPadding;

    // 计算顶部控制栏的内边距
    const topBarPadding = height * 0.03; // 顶部控制栏的内部顶边距

    return {
      buttonSize,
      iconSize: Math.round(buttonSize * 0.57),
      horizontalPadding: width * 0.04,
      verticalSpacing: height * 0.015,
      bottomBarTotalHeight,
      topBarPadding,
    };
  }, [controlSize]); // 依赖 controlSize，确保尺寸变化时重新计算

  // 分离按钮状态和按钮显示配置
  const buttonState = useMemo(() => ({
    isLiked,
    isFavorited,
    showTranslation,
    showSubtitles,
  }), [isLiked, isFavorited, showTranslation, showSubtitles]);

  const buttonHandlers = useMemo(() => ({
    onToggleLike,
    onToggleFavorite,
    onToggleTranslation,
    onToggleSubtitles,
  }), [onToggleLike, onToggleFavorite, onToggleTranslation, onToggleSubtitles]);

  const buttonVisibility = useMemo(() => ({
    showLikeButton,
    showFavoriteButton,
    showTranslationToggle,
    showSubtitlesToggle,
  }), [showLikeButton, showFavoriteButton, showTranslationToggle, showSubtitlesToggle]);

  // 构建侧边栏按钮 - 更精细的依赖管理
  const sideBarButtons = useMemo(() => {
    if (customSideBarButtons) {
      return customSideBarButtons;
    }

    const buttonConfigs = [
      {
        show: buttonVisibility.showLikeButton,
        handler: buttonHandlers.onToggleLike,
        config: {
          key: 'like',
          icon: 'heart',
          iconLibrary: 'Ionicons' as const,
          isActive: buttonState.isLiked,
          onPress: buttonHandlers.onToggleLike,
          activeColor: SOCIAL_BUTTON_COLORS.like,
          enableHaptics: true,
        }
      },
      {
        show: buttonVisibility.showFavoriteButton,
        handler: buttonHandlers.onToggleFavorite,
        config: {
          key: 'favorite',
          icon: 'star',
          iconLibrary: 'MaterialCommunityIcons' as const,
          isActive: buttonState.isFavorited,
          onPress: buttonHandlers.onToggleFavorite,
          activeColor: SOCIAL_BUTTON_COLORS.favorite,
          enableHaptics: true,
        }
      },
      {
        show: buttonVisibility.showTranslationToggle,
        handler: buttonHandlers.onToggleTranslation,
        config: {
          key: 'translation',
          icon: 'translate',
          iconLibrary: 'MaterialCommunityIcons' as const,
          isActive: buttonState.showTranslation,
          onPress: buttonHandlers.onToggleTranslation,
          activeColor: SOCIAL_BUTTON_COLORS.translation,
        }
      },
      {
        show: buttonVisibility.showSubtitlesToggle,
        handler: buttonHandlers.onToggleSubtitles,
        config: {
          key: 'subtitles',
          icon: 'subtitles',
          iconLibrary: 'MaterialCommunityIcons' as const,
          isActive: buttonState.showSubtitles,
          onPress: buttonHandlers.onToggleSubtitles,
          activeColor: SOCIAL_BUTTON_COLORS.subtitles,
        }
      },
    ];

    return buttonConfigs
      .filter(({ show, handler }) => show && handler)
      .map(({ config }) => ({
        ...config,
        onPress: config.onPress || (() => {}), // 确保 onPress 不为undefined
      }));
  }, [customSideBarButtons, buttonState, buttonHandlers, buttonVisibility]);


  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 顶部控制栏 - 绝对定位 */}
      {showTopBar && (
        <VideoTopBar
          showBack={showBackButton && contextShowBackButton}
          onBack={onBack}
          size={controlSize}
          onInteraction={onInteraction}
          topPadding={responsiveSizes.topBarPadding}
        />
      )}

      {/* 中间区域 - 包含视频内容和侧边栏 */}
      <View style={[
        styles.middleArea,
        {
          paddingHorizontal: responsiveSizes.horizontalPadding,
          paddingBottom: responsiveSizes.bottomBarTotalHeight + responsiveSizes.verticalSpacing, // 为底部控制栏留出足够空间
        },
        sideBarPosition === 'left' && { flexDirection: 'row-reverse' }
      ]}>
        {/* 主要内容区域 */}
        <View style={styles.mainContent} />

        {/* TikTok风格侧边栏 */}
        {sideBarButtons.length > 0 && (
          <View style={[
            styles.sideBar,
            {
              gap: responsiveSizes.verticalSpacing,
              paddingBottom: responsiveSizes.verticalSpacing,
            }
          ]}>
            {sideBarButtons.map((button) => (
              <TikTokStyleIcon
                key={button.key}
                iconName={button.icon}
                iconLibrary={button.iconLibrary}
                isActive={button.isActive}
                onPress={button.onPress}
                activeColor={button.activeColor}
                enableHaptics={button.enableHaptics}
                iconSize={responsiveSizes.iconSize}
                buttonSize={responsiveSizes.buttonSize}
              />
            ))}
          </View>
        )}
      </View>

      {/* 底部控制栏 - 绝对定位 */}
      {showBottomBar && (
        <VideoBottomBar
          layout="portrait-fullscreen"
          showPlayButton={true}
          showProgress={true}
          showTime={true}
          showFullscreen={true}
          bottomPadding={responsiveSizes.bottomBarTotalHeight - getBarDimensions(controlSize).height}
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
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  mainContent: {
    flex: 1,
  },
  sideBar: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  // sideBarButton 样式已移动到 TikTokStyleIcon 组件内部
});

FullscreenPortraitLayout.displayName = 'FullscreenPortraitLayout';