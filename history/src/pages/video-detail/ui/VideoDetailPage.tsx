/**
 * 小屏视频详情页
 * 重构自 VideoDetailPageContent
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';

import { useTheme } from '@/shared/providers/ThemeProvider';
import { SmallVideoPlayerSection } from '@/widgets/small-video-player-section';
import { VideoInfoDisplaySection } from '@/features/detail-info-display';
import { VIDEO_PLAYER_CONSTANTS } from '@/features/video-player';
import { useVideoStore, selectCurrentPlayerMeta } from '@/entities/video';
import { useVideoMetaStore } from '@/entities/video-meta';
import { VideoDisplayMode } from '@/shared/types';
import { log, LogType } from '@/shared/lib/logger';
import { useForceStatusBarStyle } from '@/shared/hooks/useForceStatusBarStyle';

// 🆕 使用页面特定逻辑 Hook
import { useVideoDetailLogic } from '../model/useVideoDetailLogic';

const { DERIVED } = VIDEO_PLAYER_CONSTANTS;

/**
 * 小屏视频详情页
 */
export function VideoDetailPage() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // 🔑 Page 层读取 Store：获取当前播放器元数据
  const currentPlayerMeta = useVideoStore(selectCurrentPlayerMeta);

  // 从 Video Meta Entity 获取视频数据
  const videoMetaData = useVideoMetaStore(state =>
    currentPlayerMeta?.videoId ? state.getVideo(currentPlayerMeta.videoId) : null
  );

  const isReady = !!currentPlayerMeta?.playerInstance && !!videoMetaData;

  // 🔑 页面特定逻辑
  const { enterFullscreen, backToFeed } = useVideoDetailLogic();

  // 🎨 强制状态栏为白色（不受系统主题影响）
  useForceStatusBarStyle('light');

  // 📝 页面挂载日志
  React.useEffect(() => {
    log('video-detail-page', LogType.INFO, `Page mounted for video: ${videoMetaData?.id}`);
  }, [videoMetaData?.id]);

  // 📜 滚动处理
  const [scrollHandler, setScrollHandler] = useState<
    ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) | null
  >(null);

  const handleScrollHandler = useCallback(
    (handler: (event: NativeSyntheticEvent<NativeScrollEvent>) => void) => {
      setScrollHandler(() => handler);
    },
    []
  );

  // 🎨 动态样式
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          minHeight: '100%',
          backgroundColor: theme.colors.background,
        },
      }),
    [theme]
  );

  const scrollViewStyle = useMemo(
    () => [
      styles.scrollView,
      { flex: 1, backgroundColor: theme.colors.background },
    ],
    [theme.colors.background]
  );

  // 🚫 错误状态
  if (!isReady || !currentPlayerMeta) {
    return (
      <View style={styles.errorContainer}>
        <Text
          variant="headlineSmall"
          style={{ color: theme.colors.onBackground, marginBottom: 16 }}
        >
          视频未找到
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          请从视频列表重新选择
        </Text>
      </View>
    );
  }

  return (
    <>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* 小屏视频播放器区域 - Widget 层通过 props 接收数据 */}
        <SmallVideoPlayerSection
          playerMeta={currentPlayerMeta}
          onScrollHandler={handleScrollHandler}
          onToggleFullscreen={enterFullscreen}
          onBack={backToFeed}
          displayMode={VideoDisplayMode.SMALL}
        />

        {/* 视频内容区域 */}
        <Animated.ScrollView
          style={scrollViewStyle}
          contentContainerStyle={dynamicStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={1}
          onScroll={scrollHandler || undefined}
        >
          {/* 占位空间 */}
          <View style={{ height: DERIVED.PLACEHOLDER_HEIGHT + insets.top }} />

          {/* 视频信息区域 */}
          <VideoInfoDisplaySection />
        </Animated.ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
