/**
 * 设计令牌 - Design Tokens
 * 定义设计系统中的所有视觉属性标准
 */

/**
 * 间距系统
 * 基于4的倍数系统，确保视觉一致性
 */
export const spacing = {
  xxs: 2,   // 0.125rem
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  md: 12,   // 0.75rem
  lg: 16,   // 1rem
  xl: 24,   // 1.5rem
  xxl: 32,  // 2rem
  xxxl: 48, // 3rem
} as const;

/**
 * 字体大小系统
 * 遵循模块化尺寸比例
 */
export const fontSize = {
  xs: 11,   // 小号标签
  sm: 13,   // 辅助文本
  md: 15,   // 正文
  lg: 17,   // 强调文本
  xl: 20,   // 小标题
  xxl: 24,  // 大标题
  xxxl: 34, // 超大标题
} as const;

/**
 * 字体权重
 * 限制使用的字重，保持一致性
 */
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

/**
 * 行高系统
 * 针对不同场景的行间距
 */
export const lineHeight = {
  tight: 1.2,    // 紧凑，用于标题
  normal: 1.5,   // 标准，用于正文
  relaxed: 1.75, // 宽松，用于长文本
} as const;

/**
 * 圆角半径
 * 提供不同程度的圆角效果
 */
export const borderRadius = {
  xs: 4,     // 轻微圆角
  sm: 8,     // 小圆角
  md: 12,    // 中等圆角
  lg: 16,    // 大圆角
  xl: 20,    // 超大圆角
  full: 9999,// 完全圆形
} as const;

/**
 * 边框宽度
 * 标准化的边框粗细
 */
export const borderWidth = {
  thin: 0.5,   // 细边框
  normal: 1,   // 标准边框
  thick: 2,    // 粗边框
} as const;

/**
 * 基础颜色常量
 * 语义化的颜色值，用于特定场景
 */
export const colors = {
  white: '#ffffff',     // 纯白色，用于深色背景上的文字
  black: '#000000',     // 纯黑色，用于浅色背景上的文字
  transparent: 'transparent', // 透明色
} as const;

/**
 * 阴影系统
 * 提供层次感的阴影效果
 */
export const shadows = {
  none: undefined,
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

/**
 * 动画持续时间
 * 统一的动画时长标准
 */
export const duration = {
  instant: 0,   // 瞬间
  fast: 150,    // 快速
  normal: 250,  // 标准
  slow: 350,    // 缓慢
} as const;


/**
 * 图标尺寸系统
 * 标准化的图标大小规范
 */
export const iconSizes = {
  xs: 12,   // 极小图标
  sm: 16,   // 小图标
  md: 20,   // 标准图标
  lg: 24,   // 大图标
  xl: 32,   // 超大图标
} as const;

/**
 * 平台特定配置
 * 针对不同平台的适配参数
 */
export const platform = {
  keyboard: {
    behavior: {
      ios: 'padding' as const,
      android: 'height' as const,
    },
    verticalOffset: {
      ios: 0,
      android: 20,
    },
  },
} as const;

/**
 * TabBar 设计令牌
 * TabBar 组件的所有设计参数
 */
export const tabBar = {
  height: 70,
  borderRadius: 40,
  horizontalPadding: 16,
  iconSize: 24,
  labelFontSize: 11,
  labelMarginTop: 4,
  effects: {
    blurIntensity: {
      light: 50,
      dark: 40,
    },
    highlightBorderColor: 'rgba(255, 255, 255, 0.15)',
    activeOpacity: 0.7,
    shadow: {
      color: '#000',
      offset: { width: 0, height: 8 },
      opacity: 0.18,
      radius: 20,
      elevation: 12,
    },
    androidShadowBg: 'rgba(255, 255, 255, 0.01)',
  },
} as const;

/**
 * 排版预设
 * 常用的文字样式组合
 */
export const typography = {
  h1: { size: 'xxxl', weight: 'bold', lineHeight: 'tight' },
  h2: { size: 'xxl', weight: 'semibold', lineHeight: 'tight' },
  h3: { size: 'xl', weight: 'semibold', lineHeight: 'normal' },
  body: { size: 'md', weight: 'regular', lineHeight: 'normal' },
  caption: { size: 'sm', weight: 'regular', lineHeight: 'normal' },
  label: { size: 'sm', weight: 'medium', lineHeight: 'normal' },
} as const;