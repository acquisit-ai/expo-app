# UI组件系统文档

*此文件记录共享UI组件库的架构、设计模式和实现细节。*

## UI组件架构

### 设计系统层次
- **基础组件** - Button, Input, Card, Container, Typography（23个核心组件）
- **交互组件** - SegmentedControl（原生iOS风格分段控制器）
- **布局组件** - Row, Column, Spacer, PageContainer
- **玻璃态组件** - GlassCard, GlassInput, GlassButton, GlassButton（4个Glass组件）
- **模糊态组件** - BlurCard, BlurButton, BlurList, VideoCard（4个Blur组件）
- **系统组件** - Alert, LoadingScreen, TabPageLayout

### 双视觉效果架构（v2.0）

本项目实现了两套并行运行的视觉效果系统：

#### **Blur Effects 系统**
**位置**: `src/shared/ui/blur/`

模糊态组件库采用语义化颜色系统和动画反馈：

```typescript
// 模糊态组件 API
<BlurCard variant="success" intensity="medium" animated>
<BlurButton variant="primary" onPress={handlePress} haptic>
<BlurList variant="neutral" items={data}>
<VideoCard aspect="16:9" variant="highlight">
```

**核心特性**:
- **语义化颜色**: 10种变体（success, error, warning, info, primary, secondary等）
- **预计算样式**: BlurProvider提供的缓存样式系统，性能优化
- **触觉反馈集成**: 支持iOS Haptic Feedback
- **动画效果**: 集成React Native Reanimated动画
- **16:9优化**: VideoCard专为视频内容优化的宽高比

#### **Glass Effects 系统**
**位置**: `src/shared/ui/glass/`

玻璃态组件库采用渐变透明效果：

```typescript
// 玻璃态组件 API
<GlassCard preset="card" style={customStyle}>
<GlassInput placeholder="输入内容" glassPreset="input">
<GlassButton title="确定" preset="button">
```

**核心特性**:
- **预设配置**: Card、Input、Button等专用预设
- **工厂模式**: GlassStyleFactory单例模式预计算样式
- **双层缓存**: 样式对象缓存 + 颜色计算缓存
- **主题响应**: 自动适配深色/浅色主题切换

### React Native Paper集成
组件库基于React Native Paper主题系统构建，确保平台一致性和无障碍访问。

## 实现模式

### Alert系统架构
Alert组件采用静态类方法设计，提供语义化的弹窗API：

```typescript
// 语义化方法 - 8种预设类型
Alert.info(title, message?, onOk?)           // 信息提示
Alert.confirm(title, message?, onConfirm?, onCancel?)  // 确认对话框
Alert.warning(title, message?, onOk?)        // 警告提示
Alert.error(title, message?, onOk?)          // 错误提示
Alert.success(title, message?, onOk?)        // 成功提示
Alert.delete(title?, message?, onConfirm?, onCancel?)  // 删除确认
Alert.exit(title?, message?, onConfirm?, onCancel?)    // 退出确认
Alert.show(options)                          // 自定义配置
```

**设计原则**:
- 基于React Native原生Alert系统，确保平台原生体验
- 静态方法调用，无需组件实例化
- 语义化命名，明确表达用户意图
- 统一的参数模式，降低学习成本

### 响应式设计模式
组件支持动态间距系统，基于屏幕尺寸计算：

```typescript
// 动态间距计算
const { width: screenWidth } = Dimensions.get('window');
const dynamicGap = screenWidth * 0.05; // 屏幕宽度的5%

// 在样式中应用
gap: dynamicGap,
paddingTop: dynamicGap,
marginRight: dynamicGap * 0.8  // 相对比例调整
```

### 交互控制模式
组件支持禁用状态和触觉反馈的统一实现：

```typescript
// VideoCard交互控制模式
<VideoCard
  video={videoData}
  disabled={!isInteractionEnabled}  // 禁用所有交互和视觉反馈
  onPress={handlePress}             // 触发轻微震动反馈
/>

// 内部实现模式
const handlePress = () => {
  if (!disabled && onPress) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }
};
```

**设计原则**:
- 禁用状态完全阻止交互，`activeOpacity`设为1.0避免视觉反馈
- 轻微震动反馈使用`expo-haptics`提供触觉确认
- 状态控制与外部逻辑解耦，支持导航感知的交互管理

### 主题系统集成
所有组件都与核心主题系统集成，支持：
- 浅色/深色模式切换
- 设计令牌一致性（颜色、间距、字体、圆角）
- 主题感知样式生成

## 组件分类

### 基础交互组件
- **Button** - 多变体按钮系统
- **Input** - 表单输入组件
- **Card** - 内容容器组件
- **SegmentedControl** - 原生iOS风格分段控制器，支持主题自动适配

### 布局系统组件
- **Container** - 页面级容器，支持安全区域和滚动
- **Row/Column** - Flexbox布局组件，统一gap系统
- **Spacer** - 间距控制组件

### 模糊态组件系列 (v2.0 架构)
基于新的 `BlurProvider` 架构，提供预计算样式缓存和性能优化的模糊态组件：

- **BlurCard** - 玻璃态卡片组件
  - 支持 5 种颜色变体：`default`, `primary`, `secondary`, `accent`, `neutral`
  - 动态宽度比例：`small` (≤0.8), `medium` (≤0.9), `large` (>0.9)
  - 4 级内边距：`xs`, `sm`, `md`, `lg`
  - 自动边框高亮和阴影效果

- **BlurButton** - 模糊背景按钮组件
  - Reanimated 2 微动画支持（按压缩放效果）
  - 触觉反馈集成（`Haptics.selectionAsync()`）
  - 加载状态管理和禁用控制
  - 预计算动画配置和样式缓存

- **BlurList** - 模糊列表容器组件
  - 支持自定义分割线和内容区域
  - 动态宽度变体和间距系统
  - 高性能样式预计算

- **VideoCard** - 专用视频卡片组件
  - 基于 BlurCard 实现，16:9 比例封面显示
  - 线性渐变遮罩和加载状态指示
  - 交互禁用控制和轻微震动反馈(`Haptics.impactAsync`)
  - 错误处理和占位符显示

### 系统级组件
- **Alert** - 原生弹窗系统包装，提供语义化API
- **LoadingScreen** - 全屏加载状态
- **TabPageLayout** - 标签页面布局容器

## 开发模式

### 组件导入模式
统一从`@/shared/ui`导入所有组件：

```typescript
import {
  Button, Input, Card, Container, Row, Column, Spacer,
  H1, H2, H3, Body, Caption, Label,
  BlurCard, BlurButton, BlurList, VideoCard,
  SegmentedControl, Alert, LoadingScreen, TabPageLayout
} from '@/shared/ui';
```

### 样式集成模式
组件与主题系统和样式工具深度集成：

```typescript
import { useTheme } from '@/shared/providers/ThemeProvider';
import { spacing } from '@/shared/config/theme';

// 主题感知样式
const { theme } = useTheme();
gap: spacing.sm,  // 8px - 静态设计令牌
marginRight: dynamicGap * 0.8  // 动态响应式间距
```

### 组件组合模式
优先使用组件组合而非继承，构建复杂UI：

```typescript
<Container safe padding="lg">
  <BlurCard>
    <Row gap="md" align="center">
      <H2>标题</H2>
      <Spacer flex />
      <Button variant="ghost" onPress={handleAction} />
    </Row>
  </BlurCard>
</Container>
```

## 集成点

### 与Provider系统协调
UI组件与五Provider架构集成：
- **ThemeProvider** - 主题状态和切换
- **GlassProvider** - 玻璃态效果配置
- **BlurProvider** - 模糊组件样式预计算和缓存管理
- **ToastProvider** - 通知系统集成
- **AuthProvider** - 认证状态响应

### 模糊态组件架构模式 (v2.0)

**预计算样式系统**：
```typescript
// BlurProvider 自动预计算所有模糊态样式
const { styles, colors, blur } = useBlurCard();

// 组件直接使用预计算样式，无运行时计算开销
<BlurView
  style={[styles.content.base, { backgroundColor: colors[variant] }]}
  tint={blur.tint}
  intensity={blur.intensity}
/>
```

**组件特化 Hook 模式**：
- `useBlurCard()` - 卡片专用样式和宽度变体逻辑
- `useBlurButton()` - 按钮专用样式和动画配置
- `useBlurList()` - 列表专用样式和分割线配置

**性能优化策略**：
- 样式预计算：主题切换时一次性计算，避免渲染时重复计算
- 缓存管理：`blurStyleFactory` 提供样式缓存和清理机制
- 内存监控：开发模式下自动监控缓存大小，防止内存泄漏
- 组件挂载跟踪：使用 `useRef` 防止卸载组件的异步更新

**触觉反馈集成**：
- `Haptics.selectionAsync()` - 按钮点击的轻快"嘀嗒"反馈
- `Haptics.impactAsync(Light)` - 卡片交互的轻微震动反馈
- 反馈与加载/禁用状态联动，避免无效触觉信号

### 与状态管理集成
组件通过标准化回调模式与Zustand状态层交互，避免直接耦合。

---

*此文档记录UI组件系统的当前实现状态，包括新增的Alert系统和响应式设计模式。*