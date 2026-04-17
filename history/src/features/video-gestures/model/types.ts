/**
 * Video Gestures Feature - Type Definitions
 * 视频手势功能的类型定义
 */

/**
 * 手势类型枚举
 */
export enum GestureType {
  SINGLE_TAP = 'SINGLE_TAP',
  DOUBLE_TAP_LEFT = 'DOUBLE_TAP_LEFT',
  DOUBLE_TAP_RIGHT = 'DOUBLE_TAP_RIGHT',
  LONG_PRESS = 'LONG_PRESS',
  SWIPE_LEFT = 'SWIPE_LEFT',
  SWIPE_RIGHT = 'SWIPE_RIGHT',
  SWIPE_UP = 'SWIPE_UP',
  SWIPE_DOWN = 'SWIPE_DOWN',
  PINCH = 'PINCH',
}

/**
 * 手势事件数据
 */
export interface GestureEvent {
  /** 手势类型 */
  type: GestureType;
  /** 时间戳 */
  timestamp: number;
  /** 手势位置 */
  position: {
    x: number;
    y: number;
  };
  /** 额外元数据 */
  metadata?: {
    velocity?: number;
    distance?: number;
    scale?: number;
    [key: string]: any;
  };
}

/**
 * 视频手势回调函数集合
 */
export interface VideoGestureCallbacks {
  /** 单击回调 */
  onSingleTap?: () => void;
  /** 左侧双击回调 */
  onDoubleTapLeft?: () => void;
  /** 右侧双击回调 */
  onDoubleTapRight?: () => void;
  /** 长按回调 */
  onLongPress?: () => void;
  /** 左滑回调 */
  onSwipeLeft?: (velocity: number) => void;
  /** 右滑回调 */
  onSwipeRight?: (velocity: number) => void;
  /** 上滑回调 */
  onSwipeUp?: (velocity: number) => void;
  /** 下滑回调 */
  onSwipeDown?: (velocity: number) => void;
  /** 捏合缩放回调 */
  onPinch?: (scale: number) => void;
}

/**
 * 手势配置选项
 */
export interface VideoGestureConfig {
  /** 手势识别参数 */
  recognition?: {
    /** 单击延迟（ms） */
    singleTapDelay?: number;
    /** 双击最大间隔（ms） */
    doubleTapMaxDelay?: number;
    /** 长按最小持续时间（ms） */
    longPressMinDuration?: number;
    /** 滑动最小速度 */
    swipeMinVelocity?: number;
    /** 滑动最小距离 */
    swipeMinDistance?: number;
    /** 手势最大移动距离（用于区分点击和滑动） */
    maxMovement?: number;
  };

  /** 区域配置 */
  zones?: {
    /** 左侧区域占比（0-1） */
    leftZoneRatio?: number;
    /** 右侧区域占比（0-1） */
    rightZoneRatio?: number;
    /** 中间死区占比（0-1） */
    centerDeadZone?: number;
  };

  /** 反馈配置 */
  feedback?: {
    /** 是否启用触觉反馈 */
    haptic?: boolean;
  };

  /** 调试配置 */
  debug?: {
    /** 是否启用日志 */
    logging?: boolean;
    /** 是否显示手势区域 */
    showZones?: boolean;
    /** 是否显示手势轨迹 */
    showTrail?: boolean;
  };
}

// 注意：GestureFeedbackState 已移除，视觉反馈应由使用方自行实现

/**
 * 手势控制接口
 */
export interface GestureControls {
  /** 启用手势 */
  enable: () => void;
  /** 禁用手势 */
  disable: () => void;
  /** 更新配置 */
  updateConfig: (config: Partial<VideoGestureConfig>) => void;
  /** 重置配置 */
  resetConfig: () => void;
  /** 获取当前状态 */
  getState: () => {
    enabled: boolean;
    config: VideoGestureConfig;
  };
}

/**
 * 屏幕上下文信息
 */
export interface ScreenContext {
  /** 屏幕宽度 */
  width: number;
  /** 屏幕高度 */
  height: number;
  /** 是否横屏 */
  isLandscape: boolean;
  /** 设备像素密度 */
  pixelDensity?: number;
}

/**
 * UseVideoGestures Hook 的选项
 */
export interface UseVideoGesturesOptions {
  /** 手势回调函数 */
  callbacks: VideoGestureCallbacks;
  /** 手势配置 */
  config?: VideoGestureConfig;
  /** 屏幕上下文 */
  screenContext?: ScreenContext;
  /** 是否启用（默认 true） */
  enabled?: boolean;
}

/**
 * UseVideoGestures Hook 的返回值
 */
export interface UseVideoGesturesReturn {
  /** 手势处理器（用于 GestureDetector） */
  gestureHandler: any; // 实际类型为 GestureType，但避免直接依赖
  /** 手势控制方法 */
  controls: GestureControls;
  /** 当前手势事件 */
  currentGesture: GestureEvent | null;
}