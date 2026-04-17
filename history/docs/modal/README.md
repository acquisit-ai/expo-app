# React Native Modalfy 文档

本目录包含 React Native Modalfy 库的完整文档，这是一个专为 React Native 应用程序设计的模态窗口管理库。

## 📂 完整文档目录结构

```
docs/modal/
├── README.md                           # 本文档 - 完整导航和文件说明
├── getting started.md                  # 入门指南 - 设计理念和基本概念
├── Creating a stack.md                 # 创建模态栈 - Provider设置和栈配置
├── Opening & closing.md                # 模态操作 - 三种场景下的开关方法
├── Passing params.md                   # 参数传递 - 模态间数据传递机制
├── Subscribing to events.md            # 事件监听 - 生命周期事件处理
├── Triggering a callback.md            # 回调系统 - 操作完成后的回调机制
├── Type checking with TypeScript.md    # 类型系统 - 完整TS类型支持指南
└── API/                                # API参考文档目录
    ├── README.md                       # API导航中心 - 分类索引和学习路径
    ├── ModalProvider.md                # 应用根组件 - Context Provider API
    ├── createModalStack.md             # 栈配置工厂 - 配置转换函数API
    ├── useModal.md                     # 函数组件Hook - React Hook API
    ├── withModal.md                    # 类组件HOC - 高阶组件API
    ├── modalfy.md                      # 非React环境API - 独立函数API
    └── types/                          # 类型定义文档目录
        ├── ModalOptions.md             # 模态配置选项 - 完整配置接口
        ├── ModalProp.md                # 普通组件API - 标准模态属性接口
        ├── ModalStackConfig.md         # 栈配置结构 - 配置对象结构定义
        ├── ModalComponentProp.md       # 模态组件专用 - 增强API接口
        ├── ModalProps.md               # 简化类型 - v3.5.0简化版接口
        └── ModalComponentWithOptions.md # 带选项组件 - 静态选项组件类型
```

**文档统计**:
- **总计**: 19个文档文件
- **核心指南**: 7个文件 (包含README)
- **API参考**: 12个文件 (6个核心API + 6个类型定义)
- **文档总大小**: 约50KB+ 详细技术文档

---

## 📁 详细文档分析与导航

### 🚀 核心指南文件详解 (7个)

#### [`README.md`](./README.md) - 完整导航文档
**文档作用**: 本文档，提供完整的文档结构导航和使用指南
**查找方式**: 获取全部文档概览、学习路径建议、快速定位目标文档
**主要内容**: 文档目录结构、详细文件介绍、学习路径、快速查找指南
**文档大小**: 本文档 (导航中心)
**适用人群**: 所有使用者的起始导航点

#### [`getting started.md`](./getting%20started.md) - 入门指南
**文档作用**: Modalfy 库的设计理念、核心承诺和系统要求介绍
**查找方式**: 了解库的基本概念和设计思路，包含 Expo 在线体验链接
**主要内容**: 三大核心承诺、系统要求、GIF 演示效果、React Context 依赖说明
**文档大小**: 3,297 字节
**适用人群**: 初次接触 Modalfy 的开发者
**关键信息**: React Native >= 0.59.0 要求、在线演示链接

#### [`Creating a stack.md`](./Creating%20a%20stack.md) - 创建模态栈
**文档作用**: 详细指导如何设置 ModalProvider 和配置模态栈
**查找方式**: 学习基础设置流程和三种配置选项方式
**主要内容**: Provider 设置、createModalStack 使用、配置优先级说明
**文档大小**: 5,330 字节
**适用人群**: 需要进行基础配置的开发者
**关键信息**: 配置优先级、多Provider环境集成、错误处理

#### [`Opening & closing.md`](./Opening%20%26%20closing.md) - 打开和关闭模态
**文档作用**: 三种使用场景下的模态操作方法
**查找方式**: 掌握常规组件、模态组件、纯 JS 环境中的操作方式
**主要内容**: useModal Hook、模态组件 props、命名机制、回调支持
**文档大小**: 4,832 字节
**适用人群**: 需要实现模态操作功能的开发者
**关键信息**: 三种操作环境、命名约定、外部JavaScript调用

#### [`Passing params.md`](./Passing%20params.md) - 参数传递机制
**文档作用**: 模态间参数传递的完整流程和高级用法
**查找方式**: 学习两步骤参数流程和 getParam 方法使用
**主要内容**: 参数传递、参数接收、默认值设置、类型安全
**文档大小**: 3,230 字节
**适用人群**: 需要在模态间传递数据的开发者
**关键信息**: v2+ getParam方法、默认值机制、复杂对象传递

#### [`Subscribing to events.md`](./Subscribing%20to%20events.md) - 事件监听系统
**文档作用**: 模态生命周期事件监听和处理机制
**查找方式**: 了解 onAnimate 和 onClose 事件的监听方法
**主要内容**: 事件类型、监听器设置、内存管理、清理机制
**文档大小**: 1,914 字节
**适用人群**: 需要监听模态事件的高级开发者
**关键信息**: 仅支持2种事件类型、内存泄漏防护、监听器清理

#### [`Triggering a callback.md`](./Triggering%20a%20callback.md) - 回调函数系统
**文档作用**: v3 新增的模态操作完成回调机制
**查找方式**: 学习打开和关闭时的回调使用方法
**主要内容**: 回调时机、异步支持、链式调用、自定义动画注意事项
**文档大小**: 2,653 字节
**适用人群**: 需要操作完成通知的开发者
**关键信息**: v3新功能、替代setTimeout方案、自定义动画回调处理

#### [`Type checking with TypeScript.md`](./Type%20checking%20with%20TypeScript.md) - TypeScript 类型系统
**文档作用**: 完整的 TypeScript 类型支持和最佳实践指南
**查找方式**: 掌握 6 个核心接口和类型定义方法
**主要内容**: 接口概览、类型配置、Class/Hooks 组件使用、声明文件配置
**文档大小**: 18,987 字节 (最大文档)
**适用人群**: 使用 TypeScript 的开发者
**关键信息**: 6个核心接口、v3.5.0简化配置、Pokédex完整示例

---

### 🔧 API 参考文档详解 (12个)

#### [`API/`](./API/) - 完整 API 参考目录
**目录作用**: 包含所有 API 的详细参考文档和类型定义
**文档数量**: 12 个文档文件 (6个核心API + 6个类型定义)
**总文档大小**: 约45KB+ 技术参考文档
**组织结构**: 按功能分类的层次化文档结构

#### [`API/README.md`](./API/README.md) - API 导航中心
**文档作用**: API 文档的完整导航与学习路径指南
**查找方式**: 获取文档分类、阅读顺序建议、快速开始模板
**主要内容**: 文件结构图、分类说明、学习路径、核心概念、最佳实践
**文档大小**: 4,124 字节
**适用人群**: 需要系统学习 API 的开发者
**关键信息**: 三个学习阶段、按功能和组件类型的查找指南

#### 核心 API 文档详解 (6个)

##### [`API/ModalProvider.md`](./API/ModalProvider.md) - 应用根组件
**文档作用**: `<ModalProvider/>` 组件的完整 API 参考
**查找方式**: 了解 React Context 包装和 Fragment 机制
**主要内容**: Context 提供者设置、Fragment 包装说明、props 接口
**文档大小**: 1,187 字节
**适用人群**: 进行应用级配置的开发者
**关键信息**: 唯一必需的 stack prop、Fragment 自动包装、GitHub 源码链接

##### [`API/createModalStack.md`](./API/createModalStack.md) - 栈配置工厂
**文档作用**: `createModalStack()` 函数的完整 API 参考
**查找方式**: 学习函数签名、参数说明、高级配置选项
**主要内容**: 函数签名、参数类型、复杂配置示例、返回值说明
**文档大小**: 2,079 字节
**适用人群**: 需要自定义配置的开发者
**关键信息**: 两个参数接口、高级动画配置、插值动画示例

##### [`API/useModal.md`](./API/useModal.md) - 函数组件 Hook
**文档作用**: `useModal()` Hook 的完整 API 文档
**查找方式**: 了解 Hook 返回接口和 TypeScript 泛型使用
**主要内容**: Hook 实现、返回值接口、泛型类型使用、最佳实践
**文档大小**: 1,724 字节
**适用人群**: 使用函数组件的开发者
**关键信息**: 优先选择 Hook 而非 HOC、完整类型支持、Context 内部机制

##### [`API/withModal.md`](./API/withModal.md) - 类组件 HOC
**文档作用**: `withModal()` 高阶组件的完整 API 文档
**查找方式**: 学习 HOC 实现和类组件集成方法
**主要内容**: HOC 实现原理、类组件集成、props 注入、使用示例
**文档大小**: 2,408 字节
**适用人群**: 使用类组件的开发者
**关键信息**: 仅用于类组件、Context Consumer 包装、modal prop 注入

##### [`API/modalfy.md`](./API/modalfy.md) - 非 React 环境 API
**文档作用**: 脱离 React 上下文的独立模态操作函数
**查找方式**: 了解服务层集成和使用场景限制
**主要内容**: 独立函数接口、队列机制、使用场景、重要警告
**文档大小**: 2,241 字节
**适用人群**: 需要在非 React 环境调用的开发者
**关键信息**: 禁止在 React 组件内使用、队列状态管理、全局访问能力

#### 类型定义文档详解 (6个)

##### [`API/types/ModalOptions.md`](./API/types/ModalOptions.md) - 模态配置选项
**文档作用**: 模态外观、行为和动画的完整配置接口
**查找方式**: 学习动画系统、背景控制、交互行为、样式定制
**主要内容**: 动画配置、背景属性、行为控制、样式选项、指针事件
**文档大小**: 10,878 字节 (最大类型文档)
**适用人群**: 需要深度自定义模态的开发者
**关键信息**: 4大配置类别、配置优先级、Native Driver 支持

##### [`API/types/ModalProp.md`](./API/types/ModalProp.md) - 普通组件 API
**文档作用**: 通过 useModal/withModal 暴露的模态 API 接口
**查找方式**: 了解核心方法定义和类型安全机制
**主要内容**: 接口方法定义、参数类型、返回值、使用限制
**文档大小**: 3,013 字节
**适用人群**: 使用普通组件操作模态的开发者
**关键信息**: 5个核心方法、类型安全机制、与模态组件API的区别

##### [`API/types/ModalStackConfig.md`](./API/types/ModalStackConfig.md) - 栈配置结构
**文档作用**: createModalStack 的配置对象结构定义
**查找方式**: 理解配置对象的键值对结构
**主要内容**: 简单接口定义、配置方式说明、最佳实践
**文档大小**: 496 字节 (最小文档)
**适用人群**: 进行模态栈配置的开发者
**关键信息**: 键值对结构、组件映射、选项集成

##### [`API/types/ModalComponentProp.md`](./API/types/ModalComponentProp.md) - 模态组件专用
**文档作用**: 模态组件本身的增强 API 接口
**查找方式**: 学习事件监听、参数处理、动态配置等扩展功能
**主要内容**: 增强接口、事件监听、参数处理、动态配置、监听器管理
**文档大小**: 7,710 字节 (第二大类型文档)
**适用人群**: 开发模态组件的开发者
**关键信息**: 继承 ModalProp、5个扩展功能、事件清理机制

##### [`API/types/ModalProps.md`](./API/types/ModalProps.md) - 简化类型
**文档作用**: v3.5.0 引入的简化版 ModalComponentProp
**查找方式**: 了解新式简化类型使用方式
**主要内容**: 简化语法、类型别名、向后兼容、迁移指导
**文档大小**: 879 字节
**适用人群**: 追求简洁语法的 TypeScript 开发者
**关键信息**: v3.5.0新功能、简化泛型、完全兼容旧版

##### [`API/types/ModalComponentWithOptions.md`](./API/types/ModalComponentWithOptions.md) - 带选项组件
**文档作用**: 静态 modalOptions 属性的函数组件类型
**查找方式**: 学习函数组件静态选项配置方法
**主要内容**: 函数组件静态属性、类型定义、使用限制、配置优先级
**文档大小**: 1,217 字节
**适用人群**: 使用函数组件且需要静态配置的开发者
**关键信息**: 仅用于函数组件、静态属性支持、与类组件对比

---

## 🎯 文档使用指南

### 📚 学习路径建议

#### 🆕 新手入门路径 (推荐4-6小时)
1. **[getting started.md](./getting%20started.md)** (3.3KB) - 了解基本概念和设计理念
2. **[Creating a stack.md](./Creating%20a%20stack.md)** (5.3KB) - 学习基础设置和配置
3. **[Opening & closing.md](./Opening%20%26%20closing.md)** (4.8KB) - 掌握基本操作方法
4. **[API/useModal.md](./API/useModal.md)** (1.7KB) - 学习核心Hook使用
5. **[API/types/ModalOptions.md](./API/types/ModalOptions.md)** (10.9KB) - 了解配置选项

#### 🔧 进阶开发路径 (推荐6-8小时)
1. **[Passing params.md](./Passing%20params.md)** (3.2KB) - 掌握参数传递机制
2. **[Type checking with TypeScript.md](./Type%20checking%20with%20TypeScript.md)** (19KB) - 精通类型系统
3. **[Subscribing to events.md](./Subscribing%20to%20events.md)** (1.9KB) - 学习事件监听
4. **[Triggering a callback.md](./Triggering%20a%20callback.md)** (2.7KB) - 掌握回调机制
5. **[API/types/ModalComponentProp.md](./API/types/ModalComponentProp.md)** (7.7KB) - 深入组件开发

#### 📖 完整参考路径 (推荐10-12小时)
1. **核心指南文件 (7个,约40KB)** - 全面理解功能和概念
2. **API 参考文档 (12个,约45KB)** - 深入掌握技术细节
3. **实践项目开发** - 应用所学知识到实际项目

#### 🔍 专项深入路径
- **TypeScript专项**: `Type checking with TypeScript.md` + `API/types/` 全部6个文档
- **高级配置专项**: `API/types/ModalOptions.md` + `API/createModalStack.md`
- **事件系统专项**: `Subscribing to events.md` + `Triggering a callback.md`
- **组件开发专项**: `API/types/ModalComponentProp.md` + `API/types/ModalProps.md`

### 🔍 快速查找指南

#### 按功能分类查找
- **基础设置** (2文档,8.6KB): `getting started.md` + `Creating a stack.md`
- **基本操作** (2文档,6.5KB): `Opening & closing.md` + `API/useModal.md`
- **参数传递** (2文档,11KB): `Passing params.md` + `API/types/ModalComponentProp.md`
- **事件处理** (2文档,4.6KB): `Subscribing to events.md` + `Triggering a callback.md`
- **类型系统** (7文档,44KB): `Type checking with TypeScript.md` + `API/types/` 全部6个
- **高级配置** (2文档,13KB): `API/types/ModalOptions.md` + `API/createModalStack.md`

#### 按组件类型查找
- **函数组件** (2文档,2.6KB): `API/useModal.md` + `API/types/ModalProps.md`
- **类组件** (2文档,5.4KB): `API/withModal.md` + `API/types/ModalProp.md`
- **模态组件** (3文档,17.3KB): `API/types/ModalComponentProp.md` + `API/types/ModalProps.md` + `Subscribing to events.md`
- **非React环境** (1文档,2.2KB): `API/modalfy.md`

#### 按文档大小查找
- **大型文档** (>10KB): `Type checking with TypeScript.md` (19KB), `API/types/ModalOptions.md` (10.9KB)
- **中型文档** (3-8KB): `Creating a stack.md` (5.3KB), `Opening & closing.md` (4.8KB), `API/types/ModalComponentProp.md` (7.7KB)
- **小型文档** (<3KB): `Subscribing to events.md` (1.9KB), `API/useModal.md` (1.7KB), `API/types/ModalStackConfig.md` (496字节)

#### 按版本功能查找
- **v2+ 功能**: `Passing params.md` (getParam方法), `Opening & closing.md` (外部调用)
- **v3+ 功能**: `Triggering a callback.md` (回调系统)
- **v3.5+ 功能**: `API/types/ModalProps.md` (简化类型), `Type checking with TypeScript.md` (声明文件)

### 📊 文档统计信息

#### 文档规模分析
- **总文档数量**: 19个文件
- **总文档大小**: 约85KB+ 完整技术文档
- **平均文档大小**: 约4.5KB per文档
- **最大文档**: `Type checking with TypeScript.md` (18,987字节)
- **最小文档**: `API/types/ModalStackConfig.md` (496字节)

#### 内容覆盖度
- **完整API覆盖**: 100% (6个核心API + 6个类型定义)
- **使用场景覆盖**: 100% (新手→进阶→专家)
- **组件类型覆盖**: 100% (函数/类/模态组件 + 非React环境)
- **TypeScript支持**: 100% (完整类型系统文档)

### 📝 文档特点说明

#### 内容质量特征
- **技术深度**: 从基础概念到高级配置的完整技术栈覆盖
- **实用性**: 所有文档都包含实际可用的代码示例和最佳实践
- **时效性**: 包含最新v3.5.0功能和向后兼容说明
- **系统性**: 按功能模块组织的层次化文档结构
- **易用性**: 多维度查找指南和清晰的学习路径

#### 文档适用范围
- **开发阶段**: 涵盖从项目初始化到高级定制的全生命周期
- **技术栈**: 支持原生React Native和TypeScript项目
- **团队规模**: 适用于个人开发者到大型团队的不同需求
- **经验水平**: 从新手入门到专家级深度定制的分层指导

## 🔗 外部资源

- **官方文档**: [React Native Modalfy GitBook](https://colorfy-software.gitbook.io/react-native-modalfy/)
- **GitHub 仓库**: [colorfy-software/react-native-modalfy](https://github.com/colorfy-software/react-native-modalfy)
- **在线示例**: [Expo Snack 演示](https://snack.expo.io/@charles.m/react-native-modalfy)

---

*本文档提供完整的导航指引，帮助开发者快速定位所需的具体技术文档。每个文件都包含详细的实现方法和代码示例，请根据需求选择相应文档深入学习。*