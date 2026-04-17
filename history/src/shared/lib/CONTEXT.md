# Shared Libraries - 组件上下文（第2层）

> **注意**：这是共享库特定上下文。参见根目录 **CLAUDE.md** 了解主项目上下文和编码标准。

## 用途
共享库模块提供与业务无关的、可在全应用范围内复用的基础代码，包括工具函数、客户端实例、响应式工具和通知系统。

## 当前状态：生产就绪 ✅
核心工具库已完全实现，包括日志记录、响应式缩放、Supabase客户端和Toast通知系统。所有模块遵循FSD架构原则，提供类型安全的API接口。

## 组件特定开发指南
- **架构原则**：FSD shared层，与业务逻辑解耦
- **模块化设计**：每个功能独立模块，清晰的导入导出
- **类型安全**：完整TypeScript支持，严格类型定义
- **性能优先**：单例模式、缓存机制、内存安全
- **集成模式**：通过Provider系统集成到应用架构

## 关键组件结构

### 核心模块 (`src/shared/lib/`)
- **modal/** - 全局Modal管理系统 (企业级架构)
  - **config/createModalStack.ts** - Modal栈创建工具和默认配置
  - **config/modal-stack.ts** - 应用级Modal配置集成
  - **provider/ModalProvider.tsx** - React Native Modalfy封装Provider
  - **examples/** - 示例Modal组件 (DemoModal, IntroModal)
  - **index.ts** - 统一导出接口
- **toast/** - Toast通知系统 (依赖注入架构)
  - **index.ts** - 依赖注入服务入口和公共API
  - **lib/toastManager.tsx** - ToastManager核心管理器
  - **ui/ToastView.tsx** - 主题化Toast组件 (React.memo优化)
  - **types.ts** - 品牌类型和运行时验证
  - **constants.ts** - 常量定义和默认配置
  - **README.md** - 完整文档说明
- **logger.ts** - 结构化日志记录工具
- **metrics.ts** - 响应式尺寸计算工具
- **private-data-masking.ts** - 数据脱敏工具 (重命名自security.ts)
- **index.ts** - 统一导出接口

## 实现亮点

### Toast通知系统 (重构版)
- **架构模式**：依赖注入模式，解决循环依赖问题
- **类型安全**：品牌类型(Brand Types)和运行时验证
- **组件架构**：React Native Paper 实现，完全分离样式与逻辑
- **主题集成**：与ThemeProvider深度集成，支持深色/浅色模式
- **位置管理**：统一位置配置(`TOP_OFFSET: -20`)，集成在Provider中
- **性能优化**：React.memo优化、延迟加载、组件缓存
- **常量管理**：提取魔法数字为命名常量，提升可维护性
- **文档完整**：企业级README文档，包含API参考和最佳实践

### 响应式系统
- **设备适配**：基于react-native-size-matters的智能缩放
- **工具函数**：scale、verticalScale、moderateScale三种缩放模式
- **集成点**：与UI组件库、主题系统无缝集成

### 日志系统
- **结构化输出**：JSON格式，支持日志级别和上下文信息
- **开发友好**：彩色输出，便于调试和问题排查
- **生产就绪**：支持日志收集和监控集成

### 数据脱敏系统
- **隐私保护**：提供邮箱、手机号、用户ID等敏感信息的脱敏处理
- **安全日志**：确保敏感数据在日志和错误报告中被安全处理
- **类型安全**：完整TypeScript支持，明确的输入输出类型定义
- **跨功能使用**：被认证模块和其他需要数据保护的功能使用

## 关键实现细节

### Toast依赖注入模式
**架构决策**：采用依赖注入解决循环依赖，提升代码质量

```typescript
export class ToastManager {
  private config: Required<GlobalToastConfig> = { ...DEFAULT_TOAST_CONFIG };
  private queue: ToastId[] = [];
  private renderer: ToastRenderer | null = null;

  // 依赖注入：设置渲染器避免循环依赖
  public setRenderer(renderer: ToastRenderer): void {
    this.renderer = renderer;
  }

  // 品牌类型确保类型安全
  public show(cfg: ToastConfig): ToastId | null {
    if (!isValidToastConfig(cfg) || !this.renderer) {
      return null;
    }
    return this.showInternal(cfg);
  }
}
```

### 初始化与渲染器注入
**集成描述**：通过延迟加载和依赖注入初始化Toast系统

```typescript
export function initToast(isDark: boolean = false): void {
  // 延迟导入避免循环依赖
  const createRenderer = (): ToastRenderer => {
    let ToastViewComponent: React.ComponentType<ToastViewProps> | undefined;
    
    return (props: ToastViewProps) => {
      if (!ToastViewComponent) {
        ToastViewComponent = require('./ui/ToastView').ToastView;
      }
      return React.createElement(ToastViewComponent, props);
    };
  };

  // 依赖注入设置渲染器
  toastManager.setRenderer(createRenderer());
  toastManager.updateConfig({ isDark });
}
```

### 品牌类型与类型安全
**类型系统**：使用品牌类型确保编译时和运行时类型安全

```typescript
// 品牌类型定义
export type ToastId = string & { readonly __toastIdBrand: unique symbol };

// 运行时类型验证
export function isValidToastConfig(cfg: unknown): cfg is ToastConfig {
  if (!cfg || typeof cfg !== 'object') return false;
  const config = cfg as Record<string, unknown>;
  
  return typeof config.title === 'string' &&
         config.title.length <= TOAST_CONSTANTS.MAX_TITLE_LENGTH &&
         isValidToastType(config.type);
}

// 类型安全的ID创建
export function createToastId(): ToastId {
  return `toast_${Date.now()}_${Math.random()}` as ToastId;
}
```

### 常量管理系统
**设计原则**：集中管理魔法数字和配置，提升可维护性

```typescript
// constants.ts - 统一常量定义
export const TOAST_CONSTANTS = {
  DEFAULT_DURATION: 4000,
  MAX_TOASTS: 2,
  MAX_TITLE_LENGTH: 100,
  MAX_MESSAGE_LENGTH: 200,
  ANIMATION_DURATION: 300,
  TOP_OFFSET: -20,           // 负值让Toast更靠近顶部
} as const;

// 不可变的默认配置
export const DEFAULT_TOAST_CONFIG: Readonly<Required<GlobalToastConfig>> = 
  Object.freeze({
    maxToasts: TOAST_CONSTANTS.MAX_TOASTS,
    position: 'top',
    defaultDuration: TOAST_CONSTANTS.DEFAULT_DURATION,
    isDark: false,
  } as const);
```

## 开发注意事项

### 当前架构优势
- **依赖注入**：解决循环依赖问题，提升代码质量
- **类型安全**：品牌类型和运行时验证，确保类型正确性
- **FSD兼容**：完全符合Feature-Sliced Design架构原则
- **常量管理**：统一管理魔法数字，提升可维护性
- **性能优化**：React.memo缓存、延迟加载、内存安全
- **文档完整**：企业级文档，包含完整API参考和最佳实践

### 性能与质量保证
- **组件优化**：React.memo减少不必要渲染
- **内存安全**：组件挂载状态跟踪，防止内存泄漏
- **错误处理**：完善的错误捕获和友好提示
- **队列管理**：智能Toast队列，防止UI过载
- **类型检查**：编译时和运行时双重类型验证

---

*此组件文档为共享库模块内的 AI 辅助开发提供上下文。有关系统级模式和标准，请参考主 CLAUDE.md 文件。*