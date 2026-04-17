# 主题系统架构文档

## 概述

现代化的主题系统，基于 React Native Paper 和设计令牌，支持亮色/暗色主题切换和玻璃态效果。系统经过 2025-09-18 优化重构，移除重复代码，代码量减少 20.6%，提升了可维护性和性能。

## 🏗️ 架构设计

### 设计原则

- **Paper 基础** - 基于 Material Design 3 标准
- **设计令牌系统** - 标准化的视觉属性管理
- **玻璃态效果** - 独立的 glassmorphism 模块
- **无重复设计** - 单一颜色系统，消除冗余
- **类型安全** - 完整的 TypeScript 类型支持

### 目录结构

```
src/shared/config/theme/
├── index.ts           # 统一导出入口 (47行)
├── paper-theme.ts     # Paper 主题配置 (146行) ⚡️ 重构
├── colors.ts          # 颜色系统 (213行) ✨ 新增
├── tokens.ts          # 设计令牌 (197行)
├── types.ts           # TypeScript类型 (35行) ⚡️ 简化
└── glass/             # 玻璃态效果模块
    ├── index.ts       # 玻璃态导出
    ├── glassmorphism.ts # 玻璃态配置
    └── factory.ts     # 样式工厂
```

**总计: 638 行 (三次优化后，结构更清晰)**

## 📦 模块详解

### 1. Paper Theme 模块 (`paper-theme.ts`)

**Material Design 3 主题配置**

基于 React Native Paper，提供完整的亮色/暗色主题，包含自定义颜色扩展。

```typescript
// 自定义功能色彩
const customColors = {
  success: '#34C759',
  warning: '#FF9500',
  info: '#007AFF',
};

// 扩展的主题接口
export interface ExtendedTheme extends MD3Theme {
  colors: MD3Theme['colors'] & {
    success: string;
    warning: string;
    info: string;
    // ... 更多自定义颜色
  };
}
```

### 2. Tokens 模块 (`tokens.ts`)

**设计令牌系统**

定义所有视觉属性的标准值，包括间距、字体、圆角、阴影等。

### 3. Types 模块 (`types.ts`)

**TypeScript 类型定义**

基于 Paper ExtendedTheme 的完整类型系统，确保类型安全。

### 4. Glass 模块 (`glass/`)

**玻璃态效果系统**

独立的 glassmorphism 效果模块，提供模糊背景和透明度效果。

## 📈 优化历史

### 2025-09-18 Phase 1 优化
- ❌ 移除重复的 `palette.ts` 和 `colors.ts` (159 行)
- ✅ 统一到 Paper 主题系统
- 📉 代码量减少 20.6% (844 → 670 行)
- 🔧 简化类型系统，消除重复定义

### 2025-09-18 Phase 2 重构
- ⚡️ 重构 `paper-theme.ts` (279 → 146 行，减少 47.7%)
- ✨ 新增优化的 `colors.ts` 颜色系统 (213 行)
- 🎯 提取颜色常量，消除硬编码
- 🔧 创建主题生成函数，提升可维护性

### 2025-09-18 Phase 3 类型简化
- ⚡️ 简化 `types.ts` (152 → 35 行，减少 77.0%)
- 🗑️ 移除冗余的类型别名和工具类型
- 🎯 直接从主题对象推导键名类型
- 📉 累计优化: 755 → 638 行 (减少 15.5%)

定义所有视觉属性的标准值，包括间距、字体、圆角、阴影等。

#### 主要令牌类型

- **间距系统** - 基于4的倍数，确保视觉一致性
- **字体系统** - 大小、权重、行高的标准化
- **形状系统** - 圆角半径、边框宽度
- **效果系统** - 阴影、动画持续时间
- **排版预设** - 常用的文字样式组合

```typescript
// 间距系统
export const spacing = {
  xxs: 2,   xs: 4,    sm: 8,    md: 12,
  lg: 16,   xl: 24,   xxl: 32,  xxxl: 48,
} as const;

// 排版预设
export const typography = {
  h1: { size: 'xxxl', weight: 'bold', lineHeight: 'tight' },
  body: { size: 'md', weight: 'regular', lineHeight: 'normal' },
  caption: { size: 'sm', weight: 'regular', lineHeight: 'normal' },
} as const;
```

### 3. Colors 模块 (`colors.ts`)

**语义化颜色系统**

基于调色板创建语义化的颜色映射，分别为亮色和暗色主题定义。

#### 颜色类别

- **主要颜色** - primary, primaryPressed
- **背景颜色** - background, surface, backgroundSecondary
- **文本颜色** - text, textSecondary, textOnPrimary
- **边框颜色** - border, borderFocus, borderLight
- **功能颜色** - success, error, warning, info（含背景色）
- **状态颜色** - disabled, overlay

```typescript
// 浅色主题颜色
export const lightColors = {
  primary: palette.blue500,
  background: palette.white,
  text: palette.gray900,
  success: palette.green500,
  // ...
} as const;

// 深色主题颜色
export const darkColors = {
  primary: palette.blue600,
  background: palette.gray900,  
  text: palette.white,
  success: palette.green600,
  // ...
} as const;
```

### 4. Themes 模块 (`themes.ts`)

**完整主题对象**

组合所有设计令牌和颜色方案为完整的主题对象。

```typescript
export const lightTheme = {
  colors: lightColors,
  spacing,
  fontSize,
  fontWeight,
  // ... 所有设计令牌
} as const;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;
```

### 5. Types 模块 (`types.ts`)

**完整类型系统**

提供所有主题相关的 TypeScript 类型定义。

#### 类型分类

- **基础类型** - PaletteColors, ColorScheme, ThemeColors
- **令牌类型** - ThemeSpacing, ThemeFontSize, ThemeBorderRadius等
- **完整主题** - Theme, ThemeConfig
- **工具类型** - KeyOf, ValueOf, 各种Key类型
- **组件类型** - ButtonVariant, InputState, TextAlign等

### 6. Index 模块 (`index.ts`)

**统一导出入口**

提供完整的主题系统API，支持按需导入和统一导入。

## 🚀 使用指南

### 导入方式

```typescript
// 方式1: 精确导入 (推荐，支持tree-shaking)
import { palette } from '@/shared/config/theme/palette';
import { lightTheme, spacing } from '@/shared/config/theme/themes';
import type { Theme } from '@/shared/config/theme/types';

// 方式2: 统一导入
import { palette, lightTheme, spacing } from '@/shared/config/theme';
import type { Theme, ThemeColors } from '@/shared/config/theme';
```

### 基础使用

#### 1. 在组件中使用主题

```typescript
import React from 'react';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { createThemedStyles } from '@/shared/lib/styles';

function MyComponent() {
  const { theme } = useTheme();
  
  const styles = createThemedStyles((theme) => ({
    container: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
    },
    text: {
      color: theme.colors.text,
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
    },
  }))(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
}
```

#### 2. 直接使用设计令牌

```typescript
import { spacing, colors } from '@/shared/config/theme';

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,        // 16
    margin: spacing.md,         // 12  
    backgroundColor: lightColors.surface,
    borderRadius: borderRadius.lg, // 16
  },
});
```

#### 3. 类型安全的主题使用

```typescript
import type { Theme, ColorKey, SpacingKey } from '@/shared/config/theme';

interface ThemedComponentProps {
  backgroundColor?: ColorKey;     // 'primary' | 'surface' | 'error' | ...
  padding?: SpacingKey;          // 'xs' | 'sm' | 'md' | 'lg' | ...
}

function ThemedComponent({ backgroundColor = 'surface', padding = 'md' }: ThemedComponentProps) {
  const { theme } = useTheme();
  
  return (
    <View style={{
      backgroundColor: theme.colors[backgroundColor],
      padding: theme.spacing[padding],
    }}>
      {/* content */}
    </View>
  );
}
```

### 扩展主题

#### 1. 添加新的颜色

```typescript
// 在 palette.ts 中添加新颜色
export const palette = {
  // ... 现有颜色
  purple500: '#8E44AD',
  purple600: '#9B59B6',
} as const;

// 在 colors.ts 中使用
export const lightColors = {
  // ... 现有颜色
  accent: palette.purple500,
} as const;
```

#### 2. 添加新的设计令牌

```typescript
// 在 tokens.ts 中添加新令牌
export const iconSize = {
  xs: 12,
  sm: 16, 
  md: 24,
  lg: 32,
  xl: 48,
} as const;

// 在 themes.ts 中包含到主题对象
export const lightTheme = {
  // ... 现有属性
  iconSize,
} as const;
```

#### 3. 创建新主题变体

```typescript
// 在 colors.ts 中定义新主题颜色
export const highContrastColors = {
  primary: '#0000FF',
  background: '#FFFFFF', 
  text: '#000000',
  // ... 其他颜色
} as const;

// 在 themes.ts 中创建新主题
export const highContrastTheme = {
  colors: highContrastColors,
  spacing,
  fontSize,
  // ... 其他令牌
} as const;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  highContrast: highContrastTheme,
} as const;
```

## 📋 最佳实践

### 1. 颜色使用规范

```typescript
// ✅ 好的做法：使用语义化颜色
backgroundColor: theme.colors.surface
color: theme.colors.textSecondary

// ❌ 避免：直接使用调色板颜色
backgroundColor: palette.gray50
color: palette.gray400
```

### 2. 设计令牌使用

```typescript
// ✅ 好的做法：使用标准化令牌
padding: theme.spacing.lg
fontSize: theme.fontSize.md
borderRadius: theme.borderRadius.sm

// ❌ 避免：硬编码数值  
padding: 16
fontSize: 15
borderRadius: 8
```

### 3. 类型安全

```typescript
// ✅ 好的做法：使用类型约束
interface ButtonProps {
  size: ButtonSize;           // 'sm' | 'md' | 'lg'
  variant: ButtonVariant;     // 'primary' | 'secondary' | ...
}

// ✅ 好的做法：类型守卫
const isValidColorKey = (key: string): key is ColorKey => {
  return key in theme.colors;
};
```

### 4. 响应式设计

```typescript
// ✅ 好的做法：使用响应式样式工具
import { createResponsiveStyles } from '@/shared/lib/styles';

const styles = createResponsiveStyles({
  text: {
    fontSize: theme.fontSize.lg,    // 自动响应式缩放
    padding: theme.spacing.md,      // 自动响应式缩放  
  },
});
```

## 🔧 维护指南

### 添加新的设计令牌

1. 在对应的 `tokens.ts` 文件中添加新的令牌类型
2. 在 `types.ts` 中添加相应的类型定义
3. 在 `themes.ts` 中包含到主题对象中
4. 在 `index.ts` 中添加导出

### 扩展颜色系统

1. 在 `palette.ts` 中添加新的基础颜色
2. 在 `colors.ts` 中为每个主题定义语义化颜色
3. 更新 `types.ts` 中的颜色类型
4. 测试所有主题变体的视觉效果

### 版本兼容性

- 添加新令牌时保持向后兼容
- 使用 `@deprecated` 标记过时的属性
- 提供迁移指南和自动化工具

## 📈 性能优化

### Tree-shaking 支持

```typescript
// ✅ 按需导入，支持打包优化
import { spacing, lightColors } from '@/shared/config/theme';

// ❌ 全量导入，包体积较大
import * as theme from '@/shared/config/theme';
```

### 缓存和记忆化

```typescript
// ✅ 缓存主题计算结果
const styles = useMemo(() => createThemedStyles((theme) => ({
  // styles
}))(theme), [theme]);

// ✅ 条件渲染优化
const isDarkMode = theme === darkTheme;
```

## 🎯 设计系统集成

该主题系统与项目的设计系统完全集成：

- **UI组件库** - 所有组件使用统一主题
- **样式工具** - 与 `@/shared/lib/styles` 深度集成  
- **响应式设计** - 自动适配不同屏幕尺寸
- **可访问性** - 支持高对比度和大字体
- **国际化** - 支持RTL布局的样式调整

---

> 这个模块化主题系统为项目提供了灵活、可扩展、类型安全的视觉设计基础，大幅提升了设计一致性和开发效率。