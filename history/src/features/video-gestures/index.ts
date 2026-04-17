/**
 * Video Gestures Feature
 * 视频手势功能模块
 *
 * 提供独立的视频手势识别和处理功能，支持：
 * - 单击播放/暂停
 * - 双击左侧回退
 * - 双击右侧快进
 * - 长按设置菜单
 * - 自定义手势配置
 * - 触觉反馈
 */

// 主要 Hook 导出
export { useVideoGestures } from './lib/hooks/useVideoGestures';

// 注意：基础手势 Hooks 不再导出，仅供内部使用

// 工具函数导出（仅导出核心功能）
export {
  getCurrentScreenContext,
  calculateGestureZones,
  getGestureZone,
} from './lib/utils/screenUtils';

// 配置和常量导出
export {
  GESTURE_CONSTANTS,
  DEFAULT_RECOGNITION_CONFIG,
  DEFAULT_ZONE_CONFIG,
  DEFAULT_FEEDBACK_CONFIG,
  DEFAULT_DEBUG_CONFIG,
  getDefaultGestureConfig,
  mergeGestureConfig,
  adjustForScreenDensity,
  calculateScreenDensity,
} from './model/config';

// 类型导出
export type {
  GestureType,
  GestureEvent,
  VideoGestureCallbacks,
  VideoGestureConfig,
  GestureControls,
  ScreenContext,
  UseVideoGesturesOptions,
  UseVideoGesturesReturn,
} from './model/types';

// 注意：视觉反馈组件已移除，应由使用方自行实现

// 便捷类型别名
export { GestureType as VideoGestureType } from './model/types';

/**
 * 使用示例：
 *
 * ```typescript
 * import { useVideoGestures } from '@/features/video-gestures';
 *
 * function VideoPlayer() {
 *   const { gestureHandler } = useVideoGestures({
 *     callbacks: {
 *       onSingleTap: () => togglePlay(),
 *       onDoubleTapLeft: () => seek(currentTime - 5),
 *       onDoubleTapRight: () => seek(currentTime + 5),
 *       onLongPress: () => openSettings(),
 *     },
 *     config: {
 *       feedback: { haptic: true }, // 只保留触觉反馈
 *       zones: { leftZoneRatio: 0.4, rightZoneRatio: 0.4 },
 *     },
 *   });
 *
 *   return (
 *     <View>
 *       <GestureDetector gesture={gestureHandler}>
 *         <VideoView />
 *       </GestureDetector>
 *       // 视觉反馈由使用方自行实现
 *     </View>
 *   );
 * }
 * ```
 */