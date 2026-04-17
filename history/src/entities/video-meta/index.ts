/**
 * Video Meta Entity - 公共导出
 *
 * VideoMetaData 的 SSOT (Single Source of Truth)
 */

// Store
export { useVideoMetaStore } from './model/store';

// Types
export type { VideoMetaStore } from './model/types';

// Selectors
export {
  selectVideo,
  selectHasVideo,
  selectCacheSize,
  selectAllVideoIds,
  selectAllVideos,
} from './model/selectors';

// Hooks
export { useVideoMetaActions } from './hooks/useVideoMetaActions';
