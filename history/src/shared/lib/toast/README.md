# Toast 通知系统

企业级 Toast 通知系统，基于 Feature-Sliced Design (FSD) 架构，提供类型安全的全局通知功能。

## 📋 目录

- [快速开始](#快速开始)
- [架构设计](#架构设计)
- [API 文档](#api-文档)
- [类型定义](#类型定义)
- [配置选项](#配置选项)
- [最佳实践](#最佳实践)

## 🚀 快速开始

### 1. 初始化 Toast 服务

```typescript
// App.tsx
import { initToast } from '@/shared/lib/toast';
import { useTheme } from '@/shared/providers/ThemeProvider';

export default function App() {
  const { theme } = useTheme();
  
  // 在应用启动时初始化
  useEffect(() => {
    initToast(theme.isDark);
  }, [theme.isDark]);

  return <YourAppContent />;
}
```

### 2. 显示 Toast 通知

```typescript
import { toast } from '@/shared/lib/toast';

// 基本用法
toast.show({
  type: 'success',
  title: '操作成功',
  message: '数据保存完成',
});

// 自定义持续时间
toast.show({
  type: 'error',
  title: '网络错误',
  message: '请检查网络连接',
  duration: 6000,
});

// 手动关闭
const toastId = toast.show({
  type: 'info',
  title: '处理中...',
});

if (toastId) {
  setTimeout(() => toast.dismiss(toastId), 3000);
}
```

## 🏗️ 架构设计

### 文件结构

```
src/shared/lib/toast/
├── README.md           # 文档说明（当前文件）
├── index.ts           # 主入口，依赖注入
├── constants.ts       # 常量定义
├── types.ts          # 类型定义与验证
├── lib/
│   └── toastManager.tsx  # 核心管理器
└── ui/
    └── ToastView.tsx     # UI 组件
```

### 核心模块

#### 1. **ToastManager (lib/toastManager.tsx)**
- 单例模式管理 Toast 队列
- 依赖注入解决循环依赖
- 状态管理与生命周期控制

#### 2. **类型系统 (types.ts)**
- 品牌类型 (Brand Types) 确保类型安全
- 运行时类型验证
- 严格的接口定义

#### 3. **UI 组件 (ui/ToastView.tsx)**
- 基于 React Native Paper 的现代化设计
- React.memo 性能优化
- 支持深色/浅色主题
- 保持玻璃态模糊效果

#### 4. **依赖注入 (index.ts)**
- 延迟加载机制
- 避免循环依赖
- 清晰的服务边界

#### 5. **Provider集成 (ToastProvider.tsx)**
- 统一位置配置管理 (`TOP_OFFSET: -20`)
- 主题响应式集成
- 组件生命周期管理
- 集成 Toasts 组件和 extraInsets 配置

## 📚 API 文档

### toast 对象

```typescript
const toast = {
  show(config: ToastConfig): ToastId | null
  dismiss(id: ToastId): void
  clear(): void
  getQueue(): readonly ToastId[]
}
```

### 初始化函数

```typescript
// 初始化 Toast 服务
initToast(isDark?: boolean): void

// 更新全局配置
updateToastConfig(params: GlobalToastConfig): void

// 获取当前配置
getToastConfig(): Required<GlobalToastConfig>

// 设置自定义渲染器
setToastRenderer(renderer: ToastRenderer): void
```

## 🔧 类型定义

### ToastConfig

```typescript
interface ToastConfig {
  readonly type: ToastType;           // 'success' | 'error' | 'warning' | 'info'
  readonly title: string;             // 主标题（必填）
  readonly message?: string;          // 副标题（可选）
  readonly duration?: number;         // 持续时间（毫秒）
}
```

### GlobalToastConfig

```typescript
interface GlobalToastConfig {
  readonly maxToasts?: number;        // 最大显示数量
  readonly position?: ToastPosition;  // 'top' | 'bottom'
  readonly defaultDuration?: number;  // 默认持续时间
  readonly isDark?: boolean;          // 深色模式
}
```

### 品牌类型

```typescript
// 类型安全的 Toast ID
type ToastId = string & { readonly __toastIdBrand: unique symbol };

// 运行时验证
function isValidToastConfig(cfg: unknown): cfg is ToastConfig;
function createToastId(): ToastId;
```

## ⚙️ 配置选项

### 默认配置 (constants.ts)

```typescript
const DEFAULT_TOAST_CONFIG = {
  maxToasts: 2,           // 最多同时显示 2 个
  position: 'top',        // 顶部显示
  defaultDuration: 4000,  // 4 秒自动消失
  isDark: false,          // 浅色模式
} as const;
```

### 样式常量

```typescript
const TOAST_CONSTANTS = {
  DEFAULT_DURATION: 4000,      // 默认持续时间
  MAX_TOASTS: 2,              // 最大数量
  MAX_TITLE_LENGTH: 100,      // 标题最大长度
  MAX_MESSAGE_LENGTH: 200,    // 消息最大长度
  ANIMATION_DURATION: 300,    // 动画时长
  TOP_OFFSET: -20,            // 顶部偏移量(-20px更靠近顶部)
} as const;
```

## 🎯 最佳实践

### 1. 错误处理

```typescript
// ✅ 好的做法：检查返回值
const toastId = toast.show({
  type: 'error',
  title: '操作失败',
});

if (toastId) {
  // Toast 显示成功
  console.log('Toast 已显示:', toastId);
} else {
  // Toast 显示失败，可能配置无效
  console.error('Toast 显示失败');
}

// ✅ 批量操作时先清空
toast.clear();
toast.show({ type: 'success', title: '批量操作完成' });
```

### 2. 类型安全

```typescript
// ✅ 使用类型守卫
import { isValidToastType } from '@/shared/lib/toast';

function showDynamicToast(type: string, title: string) {
  if (isValidToastType(type)) {
    toast.show({ type, title });
  } else {
    console.error('无效的 Toast 类型:', type);
  }
}

// ✅ 严格类型定义
const config: ToastConfig = {
  type: 'success',
  title: '保存成功',
  message: '数据已同步到云端',
  duration: 3000,
};
```

### 3. 性能优化

```typescript
// ✅ 避免频繁调用
let pendingToastId: ToastId | null = null;

function showProgressToast(message: string) {
  if (pendingToastId) {
    toast.dismiss(pendingToastId);
  }
  
  pendingToastId = toast.show({
    type: 'info',
    title: '处理中',
    message,
  });
}

// ✅ 组件卸载时清理
useEffect(() => {
  return () => {
    toast.clear();
  };
}, []);
```

### 4. 调试支持

```typescript
// 开发环境下的调试工具
if (__DEV__) {
  // 查看当前队列
  console.log('当前 Toast 队列:', toast.getQueue());
  
  // 访问全局调试对象
  (globalThis as any).__TOAST_DEBUG__.clear();
}
```

## ⚠️ 注意事项

### 1. 初始化顺序
- 必须在使用前调用 `initToast()`
- 建议在 App 组件的 useEffect 中初始化

### 2. 内存管理
- Toast 会自动管理队列和清理
- 超过 `maxToasts` 的通知会自动移除最旧的

### 3. 类型验证
- 配置对象会进行运行时验证
- 无效配置会在开发环境输出错误日志

### 4. 主题同步
- Toast 主题会跟随全局主题变化
- 需要在主题切换时调用 `updateToastConfig({ isDark })`

### 5. 位置配置
- 位置调整通过 `TOAST_CONSTANTS.TOP_OFFSET` 统一管理
- 负值让Toast更靠近顶部，正值增加距离
- 配置集成在 `ToastProvider` 中，遵循FSD架构原则
- 避免在组件中硬编码位置参数

## 🔍 故障排除

### 常见问题

1. **Toast 不显示**
   - 检查是否调用了 `initToast()`
   - 验证配置对象是否有效

2. **样式异常**
   - 确认 React Native Paper 主题是否正确配置
   - 检查是否正确导入了 Paper 组件

3. **类型错误**
   - 确保使用了正确的 TypeScript 类型
   - 检查是否启用了严格类型检查

4. **位置异常**
   - Toast位置不合适时，调整 `TOAST_CONSTANTS.TOP_OFFSET` 值
   - 确认 `ToastProvider` 正确集成在应用架构中
   - 检查是否存在多个 `<Toasts />` 组件导致冲突

---

## 📞 技术支持

如有问题或建议，请查看项目文档或联系开发团队。

**版本**: 2.0.0
**最后更新**: 2025-09-18
**架构**: Feature-Sliced Design (FSD)
**依赖**: @backpackapp-io/react-native-toast, react-native-paper, expo-blur