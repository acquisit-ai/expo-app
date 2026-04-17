# UI系统使用指南

本项目已经实现了完整的**设计系统 (Design System)**，采用设计令牌理念，确保UI的一致性和可维护性。

## ✅ 已实现的UI框架

我们的UI系统基于以下核心原则：
- **设计令牌 (Design Tokens)** - 所有视觉属性的单一事实来源
- **主题化 (Theming)** - 支持浅色/深色/自动模式
- **响应式设计** - 智能适配不同屏幕尺寸
- **组件化** - 完整的主题化UI组件库
- **类型安全** - 完整的TypeScript支持

---

## 🎨 核心概念

### 1. 设计令牌系统

**位置**: `src/shared/config/theme.ts`

所有的视觉设计属性都在主题文件中统一定义：

```typescript
// ✅ 正确 - 使用设计令牌
const theme = useTheme();
<View style={{ backgroundColor: theme.colors.primary }} />

// ❌ 错误 - 硬编码样式
<View style={{ backgroundColor: '#007AFF' }} />
```

设计令牌包括：
- **调色板** - 原始颜色值 (`palette.blue500`)
- **语义化颜色** - 按功能分类 (`theme.colors.primary`)
- **间距系统** - 统一间距 (`theme.spacing.md`)
- **字体系统** - 字号字重 (`theme.fontSize.lg`)
- **圆角阴影** - 视觉层次 (`theme.borderRadius.md`)

### 2. 主题提供器

**位置**: `src/shared/providers/ThemeProvider.tsx`

主题系统特性：
- **三种模式**: `light` | `dark` | `auto`
- **持久化**: 用户选择自动保存
- **热切换**: 实时切换无需重启

```typescript
import { useTheme } from '@/shared/providers/ThemeProvider';

function MyComponent() {
  const { theme, isDark, toggleTheme, setThemeMode } = useTheme();
  
  return (
    <Button title="切换主题" onPress={toggleTheme} />
  );
}
```

---

## 📦 UI组件库

### 基础组件

**位置**: `src/shared/ui/`

我们的UI系统包含两大类组件：

#### 🔹 标准UI组件
基于主题系统的常规UI组件，适用于大多数场景。

#### 🌟 Blur模糊态组件
独立的模糊态设计系统，提供更现代的视觉效果。

#### Button 按钮组件

```typescript
import { Button } from '@/shared/ui';

// 基本用法
<Button title="点击我" onPress={() => {}} />

// 不同变体
<Button title="主要" variant="primary" />
<Button title="次要" variant="secondary" />
<Button title="幽灵" variant="ghost" />
<Button title="危险" variant="danger" />

// 不同尺寸
<Button title="小" size="sm" />
<Button title="中" size="md" />
<Button title="大" size="lg" />

// 特殊状态
<Button title="加载中" loading />
<Button title="禁用" disabled />
<Button title="全宽" fullWidth />

// 带图标
<Button 
  title="下载" 
  icon={<Icon name="download" />} 
  iconPosition="left" 
/>
```

#### Typography 文本组件

```typescript
import { H1, H2, H3, Body, Caption, Label } from '@/shared/ui';

// 语义化文本
<H1>主标题</H1>
<H2>副标题</H2>
<H3>三级标题</H3>
<Body>正文内容</Body>
<Caption>描述文本</Caption>
<Label>表单标签</Label>

// 自定义文本
<Text 
  size="lg" 
  weight="bold" 
  color="primary"
  align="center"
>
  自定义文本
</Text>
```

#### Input 输入框组件

```typescript
import { Input } from '@/shared/ui';

// 基本输入框
<Input
  label="用户名"
  placeholder="请输入用户名"
  value={username}
  onChangeText={setUsername}
/>

// 带验证的输入框
<Input
  label="邮箱地址"
  placeholder="请输入邮箱"
  error={emailError}
  helper="我们不会分享您的邮箱"
  keyboardType="email-address"
/>

// 带图标的输入框
<Input
  label="密码"
  placeholder="请输入密码"
  secureTextEntry
  leftIcon={<Icon name="lock" />}
  rightIcon={<Icon name="eye" />}
/>
```

#### Card 卡片组件

```typescript
import { Card } from '@/shared/ui';

// 基本卡片
<Card>
  <Text>卡片内容</Text>
</Card>

// 自定义卡片
<Card
  padding="xl"
  radius="lg" 
  shadow="md"
  pressable
  onPress={() => {}}
>
  <Text>可点击的卡片</Text>
</Card>
```

### 布局组件

#### Container 容器组件

```typescript
import { Container } from '@/shared/ui';

// 页面容器
<Container safe scroll padding="lg">
  <Text>页面内容</Text>
</Container>

// 居中容器
<Container centered>
  <Text>居中内容</Text>
</Container>
```

#### Row/Column 布局组件

```typescript
import { Row, Column } from '@/shared/ui';

// 水平布局
<Row gap="md" align="center" justify="space-between">
  <Text>左侧</Text>
  <Text>右侧</Text>
</Row>

// 垂直布局
<Column gap="lg" align="center">
  <Text>顶部</Text>
  <Text>底部</Text>
</Column>
```

#### Spacer 间距组件

```typescript
import { Spacer } from '@/shared/ui';

// 垂直间距
<Text>上方文本</Text>
<Spacer size="md" />
<Text>下方文本</Text>

// 水平间距
<Row>
  <Text>左侧</Text>
  <Spacer size="sm" horizontal />
  <Text>右侧</Text>
</Row>

// 弹性间距
<Column>
  <Text>顶部固定</Text>
  <Spacer flex />
  <Text>底部固定</Text>
</Column>
```

---

## 🛠 样式工具

### 样式创建工具

**位置**: `src/shared/lib/styles.ts`

```typescript
import { createThemedStyles, createButtonStyle } from '@/shared/lib/styles';

// 主题化样式表
const useStyles = createThemedStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
  },
}));

// 在组件中使用
function MyComponent() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>标题</Text>
    </View>
  );
}
```

### 预设样式生成器

```typescript
import { 
  createButtonStyle, 
  createInputStyle, 
  createCardStyle,
  createTextStyle 
} from '@/shared/lib/styles';

function CustomComponent() {
  const { theme } = useTheme();
  
  const buttonStyle = createButtonStyle(theme, 'primary', 'lg');
  const inputStyle = createInputStyle(theme, 'focused');
  const cardStyle = createCardStyle(theme, { padding: 'xl', shadow: 'lg' });
  const textStyle = createTextStyle(theme, { size: 'lg', weight: 'bold' });
  
  // 使用生成的样式...
}
```

---

## 📏 响应式设计

### 响应式工具

**位置**: `src/shared/lib/metrics.ts`

```typescript
import { moderateScale, scale, verticalScale } from '@/shared/lib/metrics';

const styles = StyleSheet.create({
  container: {
    // 智能缩放 - 推荐用于字体和间距
    fontSize: moderateScale(16),
    padding: moderateScale(12),
    
    // 宽度缩放
    width: scale(200),
    
    // 高度缩放
    height: verticalScale(100),
  },
});
```

### 自动响应式样式

```typescript
import { createResponsiveStyles } from '@/shared/lib/styles';

// 样式会自动根据屏幕尺寸缩放
const styles = createResponsiveStyles({
  button: {
    fontSize: 16,        // 自动缩放
    padding: 12,         // 自动缩放
    borderRadius: 8,     // 自动缩放
  },
});
```

---

## ✨ 使用示例

### 完整页面示例

```typescript
import React from 'react';
import { 
  Container, 
  Column, 
  Row, 
  H1, 
  Body, 
  Button, 
  Card,
  Input,
  Spacer 
} from '@/shared/ui';
import { useTheme } from '@/shared/providers/ThemeProvider';

export function ExamplePage() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Container safe scroll padding="lg">
      <Column gap="xl">
        {/* 页面标题 */}
        <Card>
          <H1>欢迎使用</H1>
          <Body color="textSecondary">
            这是使用UI组件库构建的页面
          </Body>
        </Card>
        
        {/* 表单区域 */}
        <Card padding="lg">
          <Column gap="md">
            <Input
              label="用户名"
              placeholder="请输入用户名"
            />
            <Input
              label="密码"
              placeholder="请输入密码"
              secureTextEntry
            />
            
            <Spacer size="md" />
            
            <Button title="登录" fullWidth />
            <Button 
              title="切换主题" 
              variant="ghost" 
              onPress={toggleTheme} 
            />
          </Column>
        </Card>
        
        {/* 按钮组 */}
        <Row gap="sm" wrap>
          <Button title="主要" variant="primary" />
          <Button title="次要" variant="secondary" />
          <Button title="危险" variant="danger" />
        </Row>
      </Column>
    </Container>
  );
}
```

---

## 🚫 开发规范

### 严格禁止

❌ **硬编码颜色**
```typescript
// 错误
<View style={{ backgroundColor: '#007AFF' }} />
```

❌ **硬编码尺寸**
```typescript
// 错误
<View style={{ width: 300, height: 200 }} />
```

❌ **硬编码间距**
```typescript
// 错误
<View style={{ margin: 16, padding: 12 }} />
```

❌ **直接使用RN原生组件**
```typescript
// 错误
<TouchableOpacity>
  <Text>按钮</Text>
</TouchableOpacity>
```

### 必须使用

✅ **主题颜色**
```typescript
// 正确
const { theme } = useTheme();
<View style={{ backgroundColor: theme.colors.primary }} />
```

✅ **间距令牌**
```typescript
// 正确
<View style={{ 
  margin: theme.spacing.lg, 
  padding: theme.spacing.md 
}} />
```

✅ **响应式工具**
```typescript
// 正确
<View style={{ width: moderateScale(300) }} />
```

✅ **UI组件库**
```typescript
// 正确
<Button title="点击我" onPress={() => {}} />
```

---

## 🎯 最佳实践

### 1. 组件优先原则
优先使用现有的UI组件，而不是从头构建。

### 2. 主题一致性
所有颜色、字体、间距都通过主题系统获取。

### 3. 响应式优先
所有尺寸相关的数值都使用响应式工具处理。

### 4. 语义化命名
使用语义化的颜色名称（primary、success）而不是具体颜色值。

### 5. 组合优于定制
通过组合现有组件创建复杂UI，而不是大量自定义样式。

---

## 🌟 Blur 模糊态组件系统

### 架构概述

Blur模糊态组件是一个独立的设计系统，提供现代化的模糊玻璃效果：

**架构层级**:
- **配置层**: `src/shared/config/theme/blur/` - 设计令牌和样式配置
- **Provider层**: `src/shared/providers/BlurProvider.tsx` - 上下文管理和性能优化
- **组件层**: `src/shared/ui/blur/` - 预制模糊态组件

### 核心特性

#### 🔧 性能优化
- **样式预计算**: 启动时预计算所有样式，避免运行时计算
- **双层缓存**: 样式缓存 + 颜色缓存机制
- **内存安全**: 组件卸载保护，防止内存泄漏

#### 🎨 设计一致性
- **10种颜色变体**: default, success, error, warning, info, primary, secondary, neutral, highlight, disabled
- **3级内边距**: sm, md, lg
- **响应式宽度**: 自动适配小、中、大三种尺寸
- **主题感知**: 自动适配浅色/深色模式

### Blur组件列表

#### BlurCard 模糊卡片
```typescript
import { BlurCard } from '@/shared/ui';

<BlurCard widthRatio={0.9} padding="md" variant="default">
  <Text>模糊背景卡片</Text>
</BlurCard>
```

#### BlurButton 模糊按钮
```typescript
import { BlurButton } from '@/shared/ui';

<BlurButton variant="primary" onPress={() => {}}>
  模糊背景按钮
</BlurButton>
```

#### BlurList 模糊列表
```typescript
import { BlurList } from '@/shared/ui';

const items = [
  { id: '1', title: '设置', icon: <Icon />, onPress: () => {} },
  { id: '2', title: '关于', subtitle: '版本信息' },
];

<BlurList items={items} variant="highlight" />
```

### Provider集成

Blur组件需要 `BlurProvider` 包装：

```typescript
// app/_layout.tsx
import { BlurProvider } from '@/shared/providers/BlurProvider';

function App() {
  const { isDark } = useTheme();

  return (
    <BlurProvider isDark={isDark}>
      {/* 应用内容 */}
    </BlurProvider>
  );
}
```

### 使用场景

- **现代界面**: 需要视觉层次感的现代化界面
- **品牌差异化**: 与标准UI组件形成视觉对比
- **特殊功能**: 设置页面、弹窗、特殊操作区域

---

这个UI系统确保了代码的可维护性、视觉一致性和开发效率。所有样式都是非硬编码的，可以轻松修改和扩展。Blur模糊态组件系统为应用提供了额外的视觉表现力和现代感。