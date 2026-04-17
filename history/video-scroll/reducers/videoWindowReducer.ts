import { VideoItem } from '../data/videos';

/**
 * 窗口状态类型
 *
 * 管理滑动窗口中的视频列表
 */
export interface WindowState {
  windowData: VideoItem[];      // 当前窗口的视频列表（最多13个：前6 + 当前1 + 后6）
  windowStartIndex: number;      // 窗口在数据源中的起始位置
}

// Reducer Actions
export type WindowAction =
  | { type: 'INITIALIZE'; payload: { videos: VideoItem[] } }
  | { type: 'LOAD_NEXT'; payload: { allVideos: VideoItem[] } }
  | { type: 'LOAD_PREV'; payload: { allVideos: VideoItem[] } };

// Reducer 函数
export function videoWindowReducer(state: WindowState, action: WindowAction): WindowState {
  switch (action.type) {
    case 'INITIALIZE': {
      const windowSize = 13; // 前6 + 当前1 + 后6
      const initialWindow = action.payload.videos.slice(
        0,
        Math.min(windowSize, action.payload.videos.length)
      );
      console.log(`🎬 Initialized window with ${initialWindow.length} videos`);
      return {
        windowData: initialWindow,
        windowStartIndex: 0,
      };
    }

    case 'LOAD_NEXT': {
      const batchSize = 4; // 一次加载4个视频
      const startIndexInSource = state.windowStartIndex + state.windowData.length;

      // 边界检查：至少要能加载1个视频
      if (startIndexInSource >= action.payload.allVideos.length) {
        console.log('📍 Already at the end of video source');
        return state;
      }

      // 计算实际能加载的数量（可能不足4个）
      const availableCount = action.payload.allVideos.length - startIndexInSource;
      const actualBatchSize = Math.min(batchSize, availableCount);

      // 批量获取视频
      const newVideos = action.payload.allVideos.slice(
        startIndexInSource,
        startIndexInSource + actualBatchSize
      );

      console.log(`⬇️ Loading ${actualBatchSize} videos: ${newVideos.map(v => v.metaId).join(', ')}`);

      const newWindow = [...state.windowData, ...newVideos];

      // 如果窗口超过13个，移除前4个
      if (newWindow.length > 13) {
        const toRemoveCount = Math.min(4, newWindow.length - 13);
        const removedVideos = newWindow.slice(0, toRemoveCount);
        console.log(`🗑️ Removing ${toRemoveCount} videos from window head: ${removedVideos.map(v => v.metaId).join(', ')}`);

        return {
          windowData: newWindow.slice(toRemoveCount),
          windowStartIndex: state.windowStartIndex + toRemoveCount,
        };
      }

      return {
        windowData: newWindow,
        windowStartIndex: state.windowStartIndex,
      };
    }

    case 'LOAD_PREV': {
      const batchSize = 4; // 一次加载4个视频

      // 边界检查：至少要能加载1个视频
      if (state.windowStartIndex <= 0) {
        console.log('📍 Already at the beginning of video source');
        return state;
      }

      // 计算实际能加载的数量（可能不足4个）
      const availableCount = state.windowStartIndex;
      const actualBatchSize = Math.min(batchSize, availableCount);

      // 计算起始索引（向前加载）
      const startIndexInSource = state.windowStartIndex - actualBatchSize;

      // 批量获取视频
      const newVideos = action.payload.allVideos.slice(
        startIndexInSource,
        state.windowStartIndex
      );

      console.log(`⬆️ Loading ${actualBatchSize} videos: ${newVideos.map(v => v.metaId).join(', ')}`);

      const newWindow = [...newVideos, ...state.windowData];

      // 如果窗口超过13个，移除后4个
      if (newWindow.length > 13) {
        const toRemoveCount = Math.min(4, newWindow.length - 13);
        const removedVideos = newWindow.slice(-toRemoveCount);
        console.log(`🗑️ Removing ${toRemoveCount} videos from window tail: ${removedVideos.map(v => v.metaId).join(', ')}`);

        return {
          windowData: newWindow.slice(0, -toRemoveCount),
          windowStartIndex: startIndexInSource,
        };
      }

      return {
        windowData: newWindow,
        windowStartIndex: startIndexInSource,
      };
    }

    default:
      return state;
  }
}
