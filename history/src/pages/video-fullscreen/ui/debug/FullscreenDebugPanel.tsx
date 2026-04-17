/**
 * 全屏页面调试面板
 * 显示当前视频在 Feed、Player Pool、滑动窗口中的位置和状态
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFeedStore } from '@/entities/feed';
import { playerPoolManager, usePlayerPoolStore } from '@/entities/player-pool';
import { useVideoMetaStore } from '@/entities/video-meta';

interface FullscreenDebugPanelProps {
  /** 当前视频 ID */
  currentVideoId: string | null;
  /** 滑动窗口中的视频 ID 列表 */
  windowVideoIds: string[];
}

/**
 * 全屏调试面板组件
 * 仅在开发环境显示
 */
export const FullscreenDebugPanel: React.FC<FullscreenDebugPanelProps> = ({
  currentVideoId,
  windowVideoIds,
}) => {
  // 获取 Feed 中的所有视频 ID
  const feedVideoIds = useFeedStore(state => state.videoIds);

  // 🆕 v5.0: 订阅 windowStartVideoId，动态计算 index
  const windowStartVideoId = usePlayerPoolStore(state => state.windowStartVideoId);
  const windowStartIndex = windowStartVideoId
    ? feedVideoIds.indexOf(windowStartVideoId)
    : -1;

  // 🔑 关键：直接订阅 mainPoolQueue，确保窗口扩展时实时更新
  const mainPoolQueue = usePlayerPoolStore(state => state.mainPoolQueue);
  const availablePoolSize = usePlayerPoolStore(state => state.availableQueue.length);
  const pendingLoads = usePlayerPoolStore(state => state.pendingLoads);
  const poolMode = usePlayerPoolStore(state => state.currentMode);

  // 派生 pool 信息（响应式）
  const poolInfo = useMemo(() => ({
    mainPoolVideos: mainPoolQueue.map(m => m.videoId),
    availablePoolSize,
    pendingLoads: Array.from(pendingLoads),
    mode: poolMode,
  }), [mainPoolQueue, availablePoolSize, pendingLoads, poolMode]);

  // 窗口结束索引
  const windowEndIndex = windowStartIndex + windowVideoIds.length - 1;

  // 🔑 关键：实时计算当前视频在窗口中的索引（避免使用过时的 prop）
  const currentVisibleIndex = useMemo(() => {
    if (!currentVideoId) return -1;
    return windowVideoIds.indexOf(currentVideoId);
  }, [currentVideoId, windowVideoIds]);

  // 计算当前视频在 Feed 中的索引（方法1：通过窗口计算）
  const feedIndexFromWindow = useMemo(() => {
    if (!currentVideoId || currentVisibleIndex === -1) return -1;
    // Feed Index = windowStartIndex + currentVisibleIndex
    return windowStartIndex + currentVisibleIndex;
  }, [currentVideoId, windowStartIndex, currentVisibleIndex]);

  // 计算当前视频在 Feed 中的索引（方法2：直接查找，用于验证）
  const feedIndexDirect = useMemo(() => {
    if (!currentVideoId) return -1;
    return feedVideoIds.indexOf(currentVideoId);
  }, [currentVideoId, feedVideoIds]);

  // 使用方法1（更高效）
  const feedIndex = feedIndexFromWindow;

  // 计算当前视频在 Player Pool 主池中的索引
  const poolIndex = useMemo(() => {
    if (!currentVideoId) return -1;
    return poolInfo.mainPoolVideos.indexOf(currentVideoId);
  }, [currentVideoId, poolInfo]);

  // 获取视频元数据（用于显示标题等）
  const currentVideoMeta = useVideoMetaStore(state =>
    currentVideoId ? state.getVideo(currentVideoId) : null
  );

  if (!currentVideoId) {
    return null;
  }

  return (
    <View style={styles.panel}>
      {/* 核心位置信息 */}
      <Text style={styles.title}>🎬 视频位置信息</Text>

      <Text style={styles.primaryText}>
        📍 Feed Index: {feedIndex >= 0 ? `${feedIndex + 1} / ${feedVideoIds.length}` : 'N/A'}
      </Text>

      <Text style={styles.primaryText}>
        🎱 Pool Index: {poolIndex >= 0 ? `${poolIndex + 1} / ${poolInfo.mainPoolVideos.length}` : 'N/A'}
      </Text>

      <Text style={styles.primaryText}>
        🪟 Window: [{windowStartIndex + 1}~{windowEndIndex + 1}] Index: {currentVisibleIndex + 1}
      </Text>

      <View style={styles.divider} />

      {/* 索引验证（开发调试） */}
      {__DEV__ && feedIndexDirect !== feedIndex && (
        <View>
          <Text style={[styles.secondaryText, { color: '#ff6b6b' }]}>
            ⚠️ Index Mismatch: Calc={feedIndex + 1}, Direct={feedIndexDirect + 1}
          </Text>
          <View style={styles.divider} />
        </View>
      )}

      {/* 当前视频状态 */}
      <Text style={styles.sectionLabel}>📊 当前视频</Text>
      <Text style={styles.secondaryText}>
        ID: {currentVideoMeta?.id || 'unknown'}
      </Text>

      <View style={styles.divider} />

      {/* Pool 状态 */}
      <Text style={styles.sectionLabel}>🏊 Player Pool 状态</Text>
      <Text style={styles.secondaryText}>
        Main Pool: {poolInfo.mainPoolVideos.length} videos
      </Text>
      <Text style={styles.secondaryText}>
        Available Pool: {poolInfo.availablePoolSize} players
      </Text>
      <Text style={styles.secondaryText}>
        Pending Loads: {poolInfo.pendingLoads.length} videos
      </Text>
      <Text style={styles.secondaryText}>
        Mode: {poolInfo.mode}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  primaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  secondaryText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '400',
    marginVertical: 2,
    fontFamily: 'monospace',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '400',
    marginVertical: 2,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 8,
  },
});
