# TabBar Navigation Widget

这是一个现代化的底部导航栏组件，专为 React Native 应用设计，提供优雅的底部导航体验。支持模糊透明效果和液态玻璃效果两种实现。

## 📁 项目结构

```
src/widgets/tab-bar/
├── README.md                    # 本文档
├── CONTEXT.md                   # 技术上下文文档
├── index.ts                     # 导出文件
├── config/
│   └── tabConfig.ts            # Tab 配置和常量
├── lib/
│   └── iconUtils.ts            # 工具函数
├── types/
│   └── index.ts                # 类型定义
└── ui/
    ├── BlurTabBar.tsx          # 模糊透明 TabBar 组件
    ├── LiquidGlassTabBar.tsx   # 液态玻璃 TabBar 组件
    └── TabBarItem.tsx          # Tab 项子组件
```

## ✨ 特性

- 🎨 **双重效果支持** - `BlurTabBar` (expo-blur) 和 `LiquidGlassTabBar` (expo-glass-effect)
- 🌓 **主题支持** - 完整的明暗主题适配
- ⚡ **性能优化** - React.memo 和 useMemo/useCallback 优化
- 🎯 **类型安全** - 完整的 TypeScript 支持
- 📳 **触觉反馈** - 使用 expo-haptics 提供触觉反馈
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🔧 **高度可配置** - 易于自定义和扩展

## 🚀 快速开始

### 基础使用 (React Navigation)

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurTabBar, LiquidGlassTabBar } from '@/widgets/tab-bar';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  // 检查液态玻璃效果是否可用（iOS 18+ 且支持）
  const useLiquidGlass = isLiquidGlassAvailable();

  return (
    <Tab.Navigator
      tabBar={(props) =>
        useLiquidGlass ? (
          <LiquidGlassTabBar {...props} />
        ) : (
          <BlurTabBar {...props} />
        )
      }
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Collections" component={CollectionsScreen} options={{ title: "单词本" }} />
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: "动态" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "我的" }} />
    </Tab.Navigator>
  );
}
```

### 仅使用模糊效果

```tsx
<Tab.Navigator
  tabBar={(props) => <BlurTabBar {...props} />}
  screenOptions={{ headerShown: false }}
>
  {/* ... screens */}
</Tab.Navigator>
```

### 仅使用液态玻璃效果

```tsx
<Tab.Navigator
  tabBar={(props) => <LiquidGlassTabBar {...props} />}
  screenOptions={{ headerShown: false }}
>
  {/* ... screens */}
</Tab.Navigator>
```

### 自定义样式

```tsx
<BlurTabBar
  {...props}
  style={{
    // 自定义容器样式
    marginBottom: 10,
  }}
/>
```

## 🔧 配置

### 添加新的 Tab

1. 更新 `config/tabConfig.ts` 中的图标映射：

```ts
export const TAB_ICON_MAP: Record<string, TabIconConfig> = {
  Collections: { focused: 'library', outline: 'library-outline' },
  Feed: { focused: 'sparkles', outline: 'sparkles-outline' },
  Profile: { focused: 'person', outline: 'person-outline' },
  // 添加新的 Tab (注意：使用 PascalCase)
  Settings: { focused: 'settings', outline: 'settings-outline' },
};
```

2. 在路由配置中添加新的 Screen：

```tsx
<Tab.Screen
  name="Settings"
  component={SettingsScreen}
  options={{ title: "设置" }}
/>
```

### 修改样式常量

样式常量现在统一在主题系统中管理。编辑 `@/shared/config/theme/tokens.ts` 中的 `tabBar`：

```ts
export const tabBar = {
  height: 70,              // TabBar 高度
  borderRadius: 40,        // 圆角半径
  horizontalPadding: 16,   // 水平内边距
  iconSize: 24,            // 图标尺寸
  labelFontSize: 11,       // 标签字体大小
  labelMarginTop: 4,       // 标签上边距
  // ... 其他常量
};
```

## 📚 组件 API

### BlurTabBar / LiquidGlassTabBar Props

两个组件共享相同的 Props 接口（`BlurTabBarProps`），均继承自 `BottomTabBarProps`：

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `state` | `NavigationState` | - | 导航状态（由 React Navigation 提供） |
| `descriptors` | `Record<string, Descriptor>` | - | 路由描述符（由 React Navigation 提供） |
| `navigation` | `NavigationHelpers` | - | 导航对象（由 React Navigation 提供） |
| `insets` | `EdgeInsets` | - | 安全区域边距（由 React Navigation 提供） |
| `style` | `ViewStyle` | `undefined` | 自定义容器样式 |

### TabBarItem Props

| 属性 | 类型 | 描述 |
|------|------|------|
| `routeKey` | `string` | 路由键值 |
| `routeName` | `string` | 路由名称 |
| `label` | `string` | 显示标签 |
| `isFocused` | `boolean` | 是否为激活状态 |
| `onPress` | `() => void` | 点击事件处理器 |
| `iconName` | `IoniconsName` | 图标名称 |
| `iconColor` | `string` | 图标颜色 |
| `labelColor` | `string` | 标签颜色 |

## 🎨 两种实现的区别

### BlurTabBar (模糊透明效果)

- **技术**: 使用 `expo-blur` 的 `BlurView` 组件
- **平台支持**: iOS 和 Android
- **视觉效果**:
  - 浅色模式：50 intensity，light tint
  - 深色模式：40 intensity，regular tint，带高光边框
- **阴影**: 浅色模式下使用标准阴影效果
- **适用场景**: 通用场景，兼容性好

### LiquidGlassTabBar (液态玻璃效果)

- **技术**: 使用 `expo-glass-effect` 的 `GlassView` 组件
- **平台支持**: 仅 iOS 18+ 且支持液态玻璃效果的设备
- **视觉效果**:
  - 原生 iOS 液态玻璃效果
  - 浅色模式：`rgba(255, 255, 255, 0.4)` 背景
  - 深色模式：`rgba(0, 0, 0, 0.4)` 背景
- **阴影**: 增强的阴影效果（更大的偏移和半径）
- **适用场景**: 追求最新 iOS 设计语言的应用
- **检测方式**: 使用 `isLiquidGlassAvailable()` 检测是否可用

## 🎨 主题定制

TabBar 完全集成了项目的设计系统，支持以下主题属性：

- `theme.colors.primary` - 激活状态颜色
- `theme.colors.textMedium` - 未激活状态颜色
- `tabBar.borderRadius` - 圆角半径
- `tabBar.height` - TabBar 高度
- `tabBar.iconSize` - 图标尺寸
- `tabBar.effects.*` - 视觉效果配置（模糊强度、阴影等）

## 🔍 工具函数

### getTabIcon(routeName, focused)

根据路由名称和焦点状态返回对应的图标名称。

```ts
const iconName = getTabIcon('Collections', true);
// 返回: 'library'
```

### getTabLabel(options, routeName)

从路由选项中提取标签文本。

```ts
const label = getTabLabel({ title: '单词本' }, 'Collections');
// 返回: '单词本'
```

## 🛠 开发指南

### 添加新功能

1. **新增图标支持**: 在 `tabConfig.ts` 中添加图标映射
2. **样式修改**: 使用设计系统的令牌而非硬编码值
3. **性能优化**: 确保使用适当的 React 优化 hooks
4. **类型安全**: 为新功能添加适当的 TypeScript 类型

### 代码规范

- 使用主题系统中的 `tabBar` 配置创建样式
- 所有配置项应在 `tabConfig.ts` 中定义
- 保持组件的单一职责原则
- 添加适当的 JSDoc 注释

### 重要说明

- **路由命名**: React Navigation 使用 PascalCase 路由名称（如 `Collections`、`Feed`），与之前的 Expo Router 的 kebab-case（如 `collections`、`feed`）不同
- **类型系统**: 使用 `BottomTabBarProps` 而非 Expo Router 的类型
- **触觉反馈**: 使用 `Haptics.selectionAsync()` 提供轻快的"嘀嗒"反馈

## 🐛 常见问题

### 图标不显示

检查 `TAB_ICON_MAP` 中是否包含对应的路由名称配置（注意使用 PascalCase）。

### 液态玻璃效果不生效

1. 检查设备是否为 iOS 18+
2. 使用 `isLiquidGlassAvailable()` 检测设备是否支持
3. 确保已安装 `expo-glass-effect` 依赖

### 样式不生效

确保使用了主题系统中的 `tabBar` 配置，而不是硬编码值。

### 类型错误

确保导入了正确的类型定义：

```ts
import type { BlurTabBarProps, TabBarItemProps } from '@/widgets/tab-bar';
```

## 📈 性能考虑

- 使用 `React.memo` 包装组件防止不必要的重渲染
- 自定义 memo 比较函数只检查关键属性
- 事件处理器使用 `useCallback` 缓存
- 样式计算使用 `useMemo` 优化
- Tab 项数据预计算，避免在渲染过程中重复计算
- 避免在渲染过程中创建新对象

## 🔄 更新日志

- **v3.0.0**: 迁移到 React Navigation，添加液态玻璃效果支持
- **v2.0.0**: 结构化重构，模块化架构，性能优化
- **v1.0.0**: 初始版本，基础 TabBar 功能

## 🤝 贡献指南

1. 遵循现有的代码结构和命名规范
2. 添加适当的类型定义和文档
3. 确保所有修改都通过类型检查
4. 更新相关文档

---

更多详细信息，请参考 CONTEXT.md 和各个模块的具体文档。
