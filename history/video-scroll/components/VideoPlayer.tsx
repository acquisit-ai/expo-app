import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { VideoView, VideoPlayerStatus } from 'expo-video';
import type { VideoPlayer as VideoPlayerType } from 'expo-video';
import { useEventListener } from 'expo';
import { VideoItem } from '../data/videos';
import { playerPool } from '../utils/playerPool';

interface VideoPlayerProps {
  item: VideoItem;
  isVisible: boolean;
}

export interface VideoPlayerRef {
  play: () => void;
  stop: () => void;
  pause: () => void;
  release: () => void;
  getStatus: () => VideoPlayerStatus;
}

/**
 * 视频播放组件（使用 Player Pool）
 * 使用 forwardRef 暴露播放控制方法给父组件
 */
const VideoPlayerComponent = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ item, isVisible }, parentRef) => {
    console.log(`🎨 VideoPlayer ${item.metaId} rendering (isVisible: ${isVisible})`);

    // 跟踪视频加载状态
    const [isLoading, setIsLoading] = useState(true);

    // 从 player pool 获取 player
    const [player, setPlayer] = useState<VideoPlayerType | null>(null);

    // 从 pool 获取 player
    useEffect(() => {
      let mounted = true;

      const acquirePlayerFromPool = async () => {
        console.log(`🔍 Checking if player already exists for ${item.metaId}`);

        // 🔑 先检查是否已经预加载（使用 metaId 作为 Player Pool 的键）
        let acquiredPlayer = playerPool.getPlayer(item.metaId);

        if (acquiredPlayer) {
          console.log(`✅ Player already exists for ${item.metaId} (preloaded)`);
          if (mounted) {
            setPlayer(acquiredPlayer);
          }
          return;
        }

        // 如果没有预加载，正常获取
        console.log(`📤 Acquiring new player for ${item.metaId}`);
        acquiredPlayer = await playerPool.acquirePlayer(item.metaId, item.video_url);

        if (mounted && acquiredPlayer) {
          setPlayer(acquiredPlayer);
        }
      };

      acquirePlayerFromPool();

      return () => {
        mounted = false;
        // 组件卸载时释放 player（归还 pool）
        console.log(`🗑️  Component ${item.metaId} unmounting, releasing player`);
        playerPool.releasePlayer(item.metaId);
      };
    }, [item.metaId, item.video_url]);

    // 监听播放状态变化（调试用）
    useEffect(() => {
      if (!player) return;

      const playingListener = player.addListener('playingChange', ({ isPlaying }) => {
        console.log(`Video ${item.metaId} playing:`, isPlaying);
      });

      return () => {
        playingListener.remove();
      };
    }, [player, item.metaId]);

    // 监听视频加载状态变化
    useEffect(() => {
      if (!player) return;

      // 🔑 立即检查当前状态（处理预加载的情况）
      const currentStatus = player.status;
      console.log(`📊 Checking initial status for ${item.metaId}: ${currentStatus}`);

      if (currentStatus === 'readyToPlay' || currentStatus === 'error') {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      // 继续监听后续的状态变化
      const statusListener = player.addListener('statusChange', ({ status, oldStatus }) => {
        console.log(`Video ${item.metaId} status change: ${oldStatus} -> ${status}`);

        // 更新加载状态
        if (status === 'readyToPlay' || status === 'error') {
          setIsLoading(false);
        } else {
          setIsLoading(true);
        }
      });

      return () => {
        statusListener.remove();
      };
    }, [player, item.metaId]);

    // 暴露播放控制方法
    useImperativeHandle(parentRef, () => ({
      play: () => {
        if (player && !player.playing) {
          console.log(`Playing video: ${item.metaId}`);
          player.play();
        }
      },
      pause: () => {
        if (player && player.playing) {
          console.log(`Pausing video: ${item.metaId}`);
          player.pause();
        }
      },
      stop: () => {
        if (player) {
          console.log(`Stopping video: ${item.metaId}`);
          player.pause();
          player.currentTime = 0;
        }
      },
      release: () => {
        // Player Pool 管理释放，这里不需要手动调用
        console.log(`Release called for ${item.metaId} (managed by pool)`);
      },
      getStatus: () => {
        return player?.status || 'idle';
      },
    }), [player, item.metaId]);

    // 自动播放/暂停控制逻辑
    useEffect(() => {
      if (!player) return;

      if (isVisible) {
        console.log(`📺 Video ${item.metaId} visible - playing`);
        player.play();
      } else {
        console.log(`⏸️  Video ${item.metaId} hidden - pausing`);
        player.pause();
      }
    }, [isVisible, player, item.metaId]);

    // 如果 player 还未从 pool 获取，显示加载状态
    if (!player) {
      return (
        <View style={styles.container}>
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>初始化中...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        )}
      </View>
    );
  }
);

// 使用 React.memo 优化，只在 isVisible 或 item.metaId 变化时重新渲染
export const VideoPlayer = React.memo(VideoPlayerComponent, (prevProps, nextProps) => {
  // 检查所有相关 props：isVisible 和 item.metaId
  const shouldSkipRender =
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.item.metaId === nextProps.item.metaId;

  if (shouldSkipRender) {
    console.log(`⏭️  Video ${nextProps.item.metaId} skipped render (isVisible: ${nextProps.isVisible})`);
  } else {
    const reasons = [];
    if (prevProps.isVisible !== nextProps.isVisible) {
      reasons.push(`isVisible: ${prevProps.isVisible} → ${nextProps.isVisible}`);
    }
    if (prevProps.item.metaId !== nextProps.item.metaId) {
      reasons.push(`item.metaId: ${prevProps.item.metaId} → ${nextProps.item.metaId}`);
    }
    console.log(`🔄 Video ${nextProps.item.metaId} will re-render (${reasons.join(', ')})`);
  }

  return shouldSkipRender;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
});
