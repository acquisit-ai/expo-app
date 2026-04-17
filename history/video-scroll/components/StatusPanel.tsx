import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VideoPlayerStatus } from 'expo-video';
import { VideoItem } from '../data/videos';

// 状态面板组件类型定义
interface StatusPanelProps {
  currentIndexInSource: number; // 当前视频在数据源中的真实索引
  totalVideos: number;
  windowStartIndex: number; // 窗口起始位置
  windowSize: number; // 窗口大小
  currentIndex: number; // 当前视频在窗口中的位置
  getVideoStatus: (videoId: string) => VideoPlayerStatus | 'unknown';
  videoData: VideoItem[];
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  currentIndexInSource,
  totalVideos,
  windowStartIndex,
  windowSize,
  currentIndex,
  getVideoStatus,
  videoData
}) => {
  const currentVideo = videoData[currentIndexInSource];
  const currentStatus = currentVideo ? getVideoStatus(currentVideo.metaId) : 'unknown';

  return (
    <View style={styles.statusPanel}>
      <Text style={styles.statusText}>
        📍 数据源: {currentIndexInSource + 1} / {totalVideos}
      </Text>
      <Text style={styles.statusText}>
        🪟 窗口: [{windowStartIndex}~{windowStartIndex + windowSize - 1}] 位置: {currentIndex}
      </Text>
      <Text style={styles.statusText}>
        📊 状态: {currentStatus}
      </Text>

      <View style={styles.divider} />

      {/* 显示前面2个视频的状态 */}
      <Text style={styles.statusTextLabel}>⬆️ 向上:</Text>
      {[-2, -1].map(offset => {
        const idxInSource = currentIndexInSource + offset;
        if (idxInSource < 0) return null;
        const video = videoData[idxInSource];
        const status = video ? getVideoStatus(video.metaId) : 'unknown';
        const statusIcon = status === 'readyToPlay' ? '✅' :
          status === 'loading' ? '⏳' :
            status === 'error' ? '❌' : '⚪';

        return (
          <Text key={idxInSource} style={styles.statusTextSecondary}>
            {offset}: {statusIcon} {status}
          </Text>
        );
      })}

      <View style={styles.divider} />

      {/* 显示接下来3个视频的状态 */}
      <Text style={styles.statusTextLabel}>⬇️ 向下:</Text>
      {[1, 2, 3].map(offset => {
        const idxInSource = currentIndexInSource + offset;
        if (idxInSource >= videoData.length) return null;
        const video = videoData[idxInSource];
        const status = video ? getVideoStatus(video.metaId) : 'unknown';
        const statusIcon = status === 'readyToPlay' ? '✅' :
          status === 'loading' ? '⏳' :
            status === 'error' ? '❌' : '⚪';

        return (
          <Text key={idxInSource} style={styles.statusTextSecondary}>
            +{offset}: {statusIcon} {status}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  statusPanel: {
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
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  statusTextLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  statusTextSecondary: {
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
