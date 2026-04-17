/**
 * 玻璃态效果系统
 * 独立的玻璃态设计配置，与主题系统解耦
 */

/**
 * 玻璃态效果配置
 * 定义玻璃态设计的所有视觉属性
 */
export const glassmorphism = {
  /** 背景渐变主题 */
  backgrounds: {
    aurora: ['#4a90a4', '#83a4d4', '#b6b3d6'],     // 浅色模式 - 极光蓝紫
    midnight: ['#000000', '#000000'],              // 深色模式 - 纯黑
    lightBlue: ['#D3E6FF', '#FFFFFF'],             // 浅蓝色到白色
    creamyWhite: ['#fcfbf8', '#ffffff'],          // 奶糖色到白色
    ocean: ['#667eea', '#764ba2'],                 // 可选 - 海洋蓝
    sunset: ['#c73650', '#8b5a5a', '#4a4a4a'],    // 可选 - 日落橙红
    forest: ['#134e5e', '#71b280'],               // 可选 - 森林绿
    space: ['#2c3e50', '#4ca1af'],                // 可选 - 太空蓝
    fire: ['#fc4a1a', '#f7b733'],                 // 可选 - 火焰橙
  },
  
  /** 模糊效果配置 */
  blur: {
    intensity: 15,                                // 模糊强度
    tint: 'light' as const,                      // 模糊色调
  },
  
  /** 透明度系统 */
  opacity: {
    card: 0.15,                                   // 卡片背景透明度
    cardBorder: 0.3,                             // 卡片边框透明度
    input: 0.1,                                   // 输入框背景透明度
    inputBorder: 0.3,                            // 输入框边框透明度
    button: 0.1,                                  // 按钮背景透明度
    buttonPrimary: 0.2,                          // 主按钮背景透明度
    buttonBorder: 0.3,                           // 按钮边框透明度
    buttonPrimaryBorder: 0.4,                    // 主按钮边框透明度
    socialButton: 0.08,                          // 社交按钮背景透明度
    socialButtonBorder: 0.15,                    // 社交按钮边框透明度
    text: 0.8,                                    // 文本透明度
    textSecondary: 0.6,                          // 次要文本透明度
    textPrimary: 1.0,                            // 主要文本透明度
    separator: 0.2,                              // 分隔线透明度
    errorBackground: 0.15,                       // 错误背景透明度
    errorBorder: 0.3,                            // 错误边框透明度
  },
  
  /** 渐变配置 */
  gradient: {
    start: { x: 0, y: 0 },                       // 渐变起点
    end: { x: 1, y: 1 },                         // 渐变终点
  },
} as const;

/**
 * 玻璃态效果类型
 */
export type GlassmorphismConfig = typeof glassmorphism;

/**
 * 背景主题类型
 */
export type BackgroundTheme = keyof typeof glassmorphism.backgrounds;

/**
 * 获取背景渐变颜色
 */
export const getBackgroundGradient = (theme: BackgroundTheme): string[] => {
  return [...glassmorphism.backgrounds[theme]];
};

/**
 * 根据主题模式获取推荐的背景主题
 */
export const getRecommendedBackground = (isDark: boolean): BackgroundTheme => {
  return isDark ? 'midnight' : 'aurora';
};

/**
 * 创建带透明度的颜色
 */
export const withOpacity = (color: string, opacity: number): string => {
  // 如果颜色已经包含透明度，直接返回
  if (color.includes('rgba') || color.includes('hsla')) {
    return color;
  }
  
  // 处理十六进制颜色
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `#${hex}${alpha}`;
  }
  
  // 处理 rgb 颜色
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', `rgba(`).replace(')', `, ${opacity})`);
  }
  
  // 默认返回原色
  return color;
};

/**
 * TabBar 玻璃态专用配置
 * 为 TabBar 组件提供的玻璃态效果参数
 */
export const tabBarGlass = {
  height: 70,
  borderRadius: 40,
  horizontalMargin: 20,
  bottomMargin: 20,
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
      offset: { width: 0, height: 10 },
      opacity: 0.25,
      radius: 25,
      elevation: 18,
    },
    androidShadowBg: 'rgba(255, 255, 255, 0.01)',
  },
} as const;