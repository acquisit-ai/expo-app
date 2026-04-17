/**
 * 视频播放器头部按钮栏组件
 * 包含左中右三个按钮位置，支持统一的动画效果
 */

import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { AnimatedButton } from './AnimatedButton';
import { useButtonAnimation } from '../../hooks/useButtonAnimation';
import { VIDEO_PLAYER_CONSTANTS } from '../../model/constants';

const { INTERACTION, LAYOUT } = VIDEO_PLAYER_CONSTANTS;
const { BACK_BUTTON_SIZE, BACK_BUTTON_POSITION, BUTTON_COLORS } = INTERACTION;

/**
 * 头部按钮栏组件Props
 */
export interface HeaderButtonBarProps {
  /** 有效滚动位置的SharedValue */
  effectiveScrollY: SharedValue<number>;
  /** 返回按钮点击处理器 */
  onBackPress: () => void;
  /** 播放状态 - 必须由父组件传入 */
  isPlaying: boolean;
}

/**
 * 视频播放器头部按钮栏
 * 左边：返回按钮（可点击）
 * 中间：播放/暂停指示器（不可点击）
 * 右边：预留位置
 */
export const HeaderButtonBar = React.memo(function HeaderButtonBar({
  effectiveScrollY,
  onBackPress,
  isPlaying,
}: HeaderButtonBarProps) {

  // 为每个按钮创建独立的动画效果
  const backButtonAnimation = useButtonAnimation(effectiveScrollY, {
    showStart: 0.6,
    showEnd: 0.9,
  });

  const playButtonAnimation = useButtonAnimation(effectiveScrollY, {
    showStart: 0.6,
    showEnd: 0.9,
  });

  // 根据播放状态选择图标
  const playIconName = isPlaying ? 'pause-circle' : 'play-circle';

  return (
    <View style={styles.container}>
      {/* 左侧：返回按钮 */}
      <AnimatedButton
        iconType="paper"
        icon="chevron-left"
        iconColor={BUTTON_COLORS.WHITE_TRANSPARENT}
        size={BACK_BUTTON_SIZE}
        onPress={onBackPress}
        containerStyle={styles.leftButton}
        animatedStyle={backButtonAnimation}
      />

      {/* 中间：播放状态指示器（不可点击） */}
      <AnimatedButton
        iconType="ionicons"
        icon={playIconName}
        iconColor={BUTTON_COLORS.WHITE_TRANSPARENT}
        size={LAYOUT.PLAY_BUTTON_SIZE}
        disabled={true}  // 不可点击
        containerStyle={styles.centerButton}
        animatedStyle={playButtonAnimation}
        showShadow={true}
      />

      {/* 右侧：预留位置 */}
      <View style={styles.rightButton} />
    </View>
  );
});

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: BACK_BUTTON_POSITION.top,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 15,
    pointerEvents: 'box-none', // 允许触摸穿透到下层，但按钮本身可以接收触摸
  },
  leftButton: {
    marginLeft: BACK_BUTTON_POSITION.left,
  },
  centerButton: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - LAYOUT.PLAY_BUTTON_SIZE / 2,
    top: -6,  // 向上移动15像素，使其更靠近顶部
  },
  rightButton: {
    width: BACK_BUTTON_SIZE + BACK_BUTTON_POSITION.left,  // 保持对称
  },
});