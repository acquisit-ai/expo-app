# React Native Modalfy API Documentation

## 📂 文件结构

```
docs/modal/API/
├── README.md                           # 本文档 - API总览和导航
├── ModalProvider.md                    # 应用级模态提供者组件文档
├── createModalStack.md                 # 模态栈配置工厂函数文档
├── useModal.md                         # 函数组件模态Hook文档
├── withModal.md                        # 类组件模态HOC文档
├── modalfy.md                          # 非React上下文API文档
└── types/                              # 类型定义文档目录
    ├── ModalOptions.md                 # 模态配置选项接口
    ├── ModalProp.md                    # 普通组件模态属性接口
    ├── ModalStackConfig.md             # 模态栈配置结构接口
    ├── ModalComponentProp.md           # 模态组件专用属性接口
    ├── ModalProps.md                   # 简化模态属性类型别名
    └── ModalComponentWithOptions.md    # 带选项的模态组件类型
```

---

This directory contains comprehensive API documentation for React Native Modalfy, a modal management library for React Native applications that provides declarative modal management with stack-based architecture.

## 📁 API文件概览

### 🚀 核心组件与功能

#### [`ModalProvider.md`](./ModalProvider.md) - 应用级模态提供者
应用根级别的Context Provider，为整个应用提供模态渲染能力。使用React Context API管理全局模态状态，在应用最上层渲染模态。

#### [`createModalStack.md`](./createModalStack.md) - 模态栈配置工厂
将模态配置转换为可用的模态栈对象，是整个模态系统的配置核心。接受模态组件配置和默认选项，返回栈配置给ModalProvider。

#### [`useModal.md`](./useModal.md) - 函数组件模态Hook
为函数组件提供完整的模态API访问能力。提供openModal、closeModal、closeModals、closeAllModals和currentModal等方法，支持TypeScript类型安全。

#### [`withModal.md`](./withModal.md) - 类组件模态HOC
为类组件注入模态功能的高阶组件，通过modal属性提供API访问。是useModal的类组件替代方案。

#### [`modalfy.md`](./modalfy.md) - 非React上下文API
在React组件外部访问模态API的独立函数，用于服务层、中间件或工具函数。不依赖React Context，可在任何地方调用。

### 🔧 类型定义系统

#### [`types/ModalOptions.md`](./types/ModalOptions.md) - 模态配置选项
定义模态外观、行为和动画的完整配置接口。包含动画系统、背景控制、交互行为和样式定制等配置项。

#### [`types/ModalProp.md`](./types/ModalProp.md) - 普通组件模态属性
定义通过useModal或withModal暴露给普通组件的模态API接口。包含模态开启、关闭、状态查询等方法定义。

#### [`types/ModalStackConfig.md`](./types/ModalStackConfig.md) - 模态栈配置结构
定义传递给createModalStack的配置对象结构。简单的键值对象，映射模态名称到React组件或模态选项。

#### [`types/ModalComponentProp.md`](./types/ModalComponentProp.md) - 模态组件专用属性
为模态组件本身提供的增强API接口，包含所有ModalProp功能plus事件监听、参数处理、动态配置等模态专用特性。

#### [`types/ModalProps.md`](./types/ModalProps.md) - 简化模态属性
v3.5.0引入的简化版ModalComponentProp，提供更清洁的TypeScript使用体验。为模态组件开发提供便利的类型定义。

#### [`types/ModalComponentWithOptions.md`](./types/ModalComponentWithOptions.md) - 带选项的模态组件
为带有静态modalOptions属性的函数组件提供类型定义。用于函数组件定义自己的默认模态选项。


## 🚀 快速开始指南

### 1. 基础设置
```tsx
// App.tsx
import { ModalProvider, createModalStack } from 'react-native-modalfy';
import { ErrorModal, LoadingModal } from './modals';

const modalConfig = { ErrorModal, LoadingModal };
const defaultOptions = { backdropOpacity: 0.6 };
const stack = createModalStack(modalConfig, defaultOptions);

export default function App() {
  return (
    <ModalProvider stack={stack}>
      <YourAppContent />
    </ModalProvider>
  );
}
```

### 2. 创建模态组件
```tsx
// modals/ErrorModal.tsx
import { ModalProps } from 'react-native-modalfy';

const ErrorModal = ({ modal }: ModalProps<'ErrorModal'>) => {
  const message = modal.getParam('message', '发生错误');

  return (
    <View>
      <Text>{message}</Text>
      <Button onPress={modal.closeModal} title="确定" />
    </View>
  );
};

export default ErrorModal;
```

### 3. 使用模态
```tsx
// components/SomeScreen.tsx
import { useModal } from 'react-native-modalfy';

const SomeScreen = () => {
  const { openModal } = useModal();

  const showError = () => {
    openModal('ErrorModal', { message: '网络连接失败' });
  };

  return (
    <Button onPress={showError} title="显示错误" />
  );
};
```

### 4. TypeScript类型定义
```tsx
// types/modal.ts
export interface ModalStackParamsList {
  ErrorModal: { message: string; code?: number };
  LoadingModal: { text?: string };
  UserModal: { userId: number; mode: 'edit' | 'view' };
}

// 在组件中使用
const { openModal } = useModal<ModalStackParamsList>();
```

## 📖 核心概念

### 🏗️ 架构设计
- **分层架构**: Provider → Stack → Modal → Component
- **栈式管理**: 多模态叠加显示，LIFO管理策略
- **上下文驱动**: React Context统一状态管理
- **声明式API**: 配置驱动，减少命令式代码

### 🔒 类型安全
- **完整类型覆盖**: 从配置到使用的全链路类型安全
- **泛型支持**: 参数类型自动推断和检查
- **编译时验证**: 捕获模态名称和参数错误
- **智能提示**: IDE自动补全和类型提示

### 🎬 动画系统
- **内置动画**: 默认提供流畅的进入/退出动画
- **自定义动画**: 支持复杂的自定义动画组合
- **插值系统**: 基于栈位置的智能插值计算
- **性能优化**: Native Driver支持，60fps流畅体验

### 🎯 事件系统
- **生命周期事件**: 模态打开、关闭、动画等事件
- **用户交互事件**: 背景点击、手势滑动等交互
- **清理机制**: 自动和手动的事件监听器清理
- **回调链**: 支持操作完成回调的链式调用

### 📦 参数传递
- **类型安全传递**: 编译时验证参数类型正确性
- **默认值支持**: getParam方法支持默认值机制
- **深度嵌套**: 支持复杂对象和数组参数传递
- **序列化友好**: 参数支持JSON序列化存储

## 🎯 最佳实践

### 📝 命名规范
- **模态组件**: PascalCase + Modal后缀 (`UserProfileModal`)
- **参数接口**: PascalCase + Params后缀 (`UserProfileParams`)
- **配置对象**: camelCase + Config后缀 (`modalConfig`)

### 🏗️ 项目结构
```
src/
├── modals/                    # 模态组件目录
│   ├── index.ts              # 统一导出
│   ├── ErrorModal.tsx        # 错误提示模态
│   ├── LoadingModal.tsx      # 加载状态模态
│   └── UserProfileModal.tsx  # 用户资料模态
├── types/
│   └── modal.ts              # 模态类型定义
└── config/
    └── modal.ts              # 模态配置
```

### 🔧 性能优化
- **懒加载**: 使用React.lazy延迟加载模态组件
- **批量操作**: 使用closeModals批量关闭同类型模态
- **事件清理**: 及时清理事件监听器防止内存泄漏
- **栈深度控制**: 避免过深的模态栈影响性能

### 🛡️ 错误处理
- **兜底机制**: 为关键参数提供合理默认值
- **错误边界**: 在模态组件外包装错误边界
- **状态恢复**: 异常情况下的模态栈状态恢复
- **调试信息**: 开发环境下的详细错误信息

## 🔗 相关文档

### 📚 官方文档
- [React Native Modalfy GitBook](https://colorfy-software.gitbook.io/react-native-modalfy/) - 完整使用指南
- [GitHub Repository](https://github.com/colorfy-software/react-native-modalfy) - 源码和示例
- [TypeScript Guide](https://colorfy-software.gitbook.io/react-native-modalfy/guides/typing) - 类型系统详解

### 🛠️ 开发工具
- [React Native](https://reactnative.dev/) - 基础框架文档
- [TypeScript](https://www.typescriptlang.org/) - 类型系统文档
- [React Context](https://react.dev/reference/react/useContext) - Context API文档

### 🎨 相关生态
- [React Native Paper](https://callstack.github.io/react-native-paper/) - UI组件库
- [React Navigation](https://reactnavigation.org/) - 导航解决方案
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) - 手势交互