# Theme Toggle Feature

## 概述

主题切换功能特性，允许用户在浅色、深色和自动模式之间切换应用主题。

## 架构位置

根据 Feature-Sliced Design (FSD) 架构：
- **层级**: `features` (功能层)
- **切片**: `theme-toggle`
- **职责**: 封装用户主题偏好设置的完整交互流程

## 功能特点

- 🎨 三种主题模式：浅色、深色、跟随系统
- 📱 响应式设计，适配不同屏幕尺寸
- ♿ 完整的无障碍支持
- 🚀 高性能：样式缓存和组件拆分优化
- 🎯 符合项目设计令牌规范

## 使用方式

```typescript
import { ThemeToggle } from '@/features/theme-toggle';

// 在 Profile 页面中使用
<ThemeToggle style={styles.themeToggle} />
```

## 依赖关系

- `@/shared/providers/ThemeProvider` - 主题状态管理
- `@/shared/config/theme/tokens` - 设计令牌
- `@/shared/lib/metrics` - 响应式工具

## 为什么在 features 层？

1. **业务价值**: 提供用户主题偏好设置的完整功能
2. **用户交互**: 封装完整的用户操作流程
3. **独立性**: 可以独立开发、测试和维护
4. **复用性**: 虽然目前仅在 Profile 页面使用，但作为功能特性可以在其他地方复用

## 文件结构

```
src/features/theme-toggle/
├── ui/
│   ├── ThemeToggle.tsx    # 主组件
│   └── index.ts           # UI 导出
├── index.ts               # 功能导出
└── README.md              # 文档
```