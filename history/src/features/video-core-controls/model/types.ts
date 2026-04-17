/**
 * Video Core Controls - 类型定义
 * 统一的视频控制组件类型系统
 */

export type ControlSize = 'small' | 'medium' | 'large';
export type ControlPosition = 'top' | 'bottom' | 'floating';
export type GradientDirection = 'top' | 'bottom' | 'floating' | 'none';
export type ControlLayout = 'horizontal' | 'vertical' | 'portrait-fullscreen';
export type ControlAlign = 'left' | 'center' | 'right' | 'space-between' | 'space-around';

/**
 * 所有控制组件的基础Props接口
 */
export interface BaseControlProps {
  /** 控件尺寸 */
  size: ControlSize;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onPress?: () => void;
  /** 交互回调 - 用于重置自动隐藏定时器 */
  onInteraction?: () => void;
  /** 测试ID */
  testID?: string;
}

/**
 * 控制栏容器Props
 */
export interface ControlBarProps {
  /** 位置 */
  position: ControlPosition;
  /** 尺寸 */
  size: ControlSize;
  /** 是否透明 */
  transparent?: boolean;
  /** 渐变方向 */
  gradient?: GradientDirection;
  /** 是否自动隐藏 */
  autoHide?: boolean;
  /** 底部额外间距（像素） */
  bottomPadding?: number;
  /** 顶部额外间距（像素） */
  topPadding?: number;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 控制栏区段Props
 */
export interface ControlBarSectionProps {
  /** 排列方向 */
  direction?: 'horizontal' | 'vertical';
  /** 对齐方式 */
  align?: ControlAlign;
  /** 主轴对齐 */
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  /** 弹性系数 */
  flex?: number;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 控制组分组Props
 */
export interface ControlGroupProps {
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 间距 */
  spacing?: 'xs' | 'sm' | 'md' | 'lg';
  /** 弹性系数 */
  flex?: number;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 播放按钮Props
 */
export interface PlayButtonProps extends BaseControlProps {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 切换播放状态 */
  onToggle: () => void;
  /** 是否显示文字标签 */
  showLabel?: boolean;
}

/**
 * 进度条Props
 */
export interface ProgressBarProps extends BaseControlProps {
  /** 拖拽开始回调 */
  onDragStart?: () => void;
  /** 拖拽结束回调 */
  onDragEnd?: (value: number) => void;
  /** 值变化回调 */
  onValueChange?: (value: number) => void;
  /** 是否显示缓冲 */
  showBuffer?: boolean;
  /** 是否显示缩略图 */
  showThumbnail?: boolean;
  /** 是否可拖拽 */
  draggable?: boolean;

  // 数据传递 - 避免直接依赖entity
  /** 当前时间 */
  currentTime?: number;
  /** 缓冲时间 */
  bufferedTime?: number;
  /** 视频总时长 */
  duration?: number;
  /** 跳转回调 */
  onSeek?: (time: number) => void;
  /** 拖拽状态变化回调 */
  onDragStateChange?: (isDragging: boolean, dragValue?: number) => void;
}

/**
 * 全屏切换按钮Props
 */
export interface FullscreenToggleProps extends BaseControlProps {
  /** 是否全屏 */
  isFullscreen: boolean;
  /** 切换全屏状态 */
  onToggle: () => void;
  /** 是否显示文字标签 */
  showLabel?: boolean;
}

/**
 * 返回按钮Props
 */
export interface BackButtonProps extends BaseControlProps {
  /** 是否显示文字标签 */
  showLabel?: boolean;
  /** 返回前是否需要确认 */
  confirmBeforeBack?: boolean;
}

/**
 * 时间显示Props
 */
export interface TimeDisplayProps extends Omit<BaseControlProps, 'onPress'> {
  /** 时间格式 */
  format?: 'mm:ss' | 'h:mm:ss' | 'auto';
  /** 是否显示剩余时间 */
  showRemaining?: boolean;
  /** 当前时间 */
  currentTime?: number;
  /** 视频总时长 */
  duration?: number;
}

/**
 * 顶部控制栏Props
 */
export interface VideoTopBarProps {
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 返回按钮回调 */
  onBack?: () => void;
  /** 标题 */
  title?: string;
  /** 是否显示标题 */
  showTitle?: boolean;
  /** 是否显示设置按钮 */
  showSettings?: boolean;
  /** 设置按钮回调 */
  onSettings?: () => void;
  /** 尺寸 */
  size: ControlSize;
  /** 是否透明 */
  transparent?: boolean;
  /** 交互回调 */
  onInteraction?: () => void;
  /** 顶部内边距 */
  topPadding?: number;
}

/**
 * 底部控制栏Props
 */
export interface VideoBottomBarProps {
  /** 是否显示播放按钮 */
  showPlayButton?: boolean;
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 是否显示时间 */
  showTime?: boolean;
  /** 是否显示全屏按钮 */
  showFullscreen?: boolean;
  /** 是否显示音量控制 */
  showVolume?: boolean;
  /** 布局模式 */
  layout: ControlLayout;
  /** 尺寸 */
  size: ControlSize;
  /** 是否全屏 */
  isFullscreen?: boolean;
  /** 全屏切换回调 */
  onToggleFullscreen?: () => void;
  /** 进度交互回调 */
  onProgressInteraction?: () => void;
  /** 交互回调 */
  onInteraction?: () => void;

  // 数据传递 - 避免直接依赖entity
  /** 当前播放状态 */
  isPlaying?: boolean;
  /** 播放切换回调 */
  onPlayToggle?: () => void;
  /** 当前时间 */
  currentTime?: number;
  /** 缓冲时间 */
  bufferedTime?: number;
  /** 视频总时长 */
  duration?: number;
  /** 跳转回调 */
  onSeek?: (time: number) => void;
}