# Shared Hooks - 通用Hook系统上下文

> **版本**: v2.0
> **最后更新**: 2025-10-10

## 文档目的

本文档为 AI 智能体和开发者提供 Shared Hooks 模块的深层架构理解，聚焦于通用 Hook 设计模式、性能优化策略和最佳实践。

---

## 架构概览

### 核心定位

Shared Hooks 是**shared层的核心工具库**，提供业务无关的通用 React Hooks，采用以下设计原则：
- **零业务依赖**：不依赖任何业务Entity或Feature
- **性能优先**：所有Hooks都经过性能优化和内存安全设计
- **TypeScript完备**：完整的类型定义和泛型支持
- **可组合性**：Hooks可以自由组合使用

### Hook分类体系

```
Shared Hooks (src/shared/hooks/)
├── 状态管理类
│   ├── useMountedState       # 组件挂载状态跟踪
│   └── useAsyncSafeState     # 异步安全的状态管理
├── 性能优化类
│   ├── useDebounce          # 防抖Hook
│   └── useAfterInteractions # 交互完成后执行（NEW v2.0）
├── 导航与交互类
│   ├── useFocusState        # 页面焦点状态（NEW v2.0）
│   ├── useEventSubscription # 事件订阅管理
│   └── useBackHandler       # 硬件返回键控制
├── 设备特性类
│   ├── useOrientationDetection # 屏幕方向检测
│   └── useForceStatusBarStyle  # 强制状态栏样式（v2.0 优化）
├── 时间管理类
│   ├── useTimer             # 单一定时器
│   ├── useSingleTimer       # 简化定时器
│   └── useMultiTimer        # 多定时器管理
└── 视频专用类
    ├── usePlayerPlaying     # 播放状态订阅
    └── usePlayerReadyState  # 播放器就绪状态（v2.0 优化）
```

---

## 🆕 v2.0 新增Hooks

### 1. useAfterInteractions - 交互完成后执行

**设计目的**：在导航动画或用户交互完成后执行回调，优化性能和用户体验。

#### 核心架构

```typescript
/**
 * 在交互完成后执行回调的 Hook
 *
 * @param callback - 要执行的回调函数
 * @param deps - 依赖数组（类似 useEffect）
 * @param useRAF - 是否使用 requestAnimationFrame（默认 true）
 */
export function useAfterInteractions(
  callback: () => void,
  deps: React.DependencyList,
  useRAF: boolean = true
): void;
```

#### 关键设计决策

**Ref存储模式**（避免闭包陷阱）：
```typescript
// 🔑 关键：使用 ref 存储最新的 callback，避免闭包陷阱
const callbackRef = useRef(callback);

// 始终保持最新的回调引用
useEffect(() => {
  callbackRef.current = callback;
}, [callback]);

// 执行时使用最新的callback
InteractionManager.runAfterInteractions(() => {
  if (useRAF) {
    requestAnimationFrame(() => {
      callbackRef.current();  // ✅ 执行最新的 callback
    });
  } else {
    callbackRef.current();
  }
});
```

#### 使用场景

| 场景 | useRAF | 示例 |
|------|--------|------|
| **滚动位置恢复** | true（默认） | 导航完成后滚动到保存的位置 |
| **数据加载** | false | 页面加载后异步获取数据 |
| **复杂动画** | true | 确保UI更新后执行 |
| **非视觉操作** | false | 后台数据处理 |

#### 实际应用

```typescript
// 示例1：导航完成后滚动（全屏视频页面）
useAfterInteractions(() => {
  const currentIndex = windowVideoIds.indexOf(currentVideoId);
  if (currentIndex >= 0) {
    scrollViewRef.current?.scrollTo({ y: currentIndex * itemHeight });
  }
}, [currentVideoId, itemHeight]);

// 示例2：页面加载后获取数据（不需要RAF）
useAfterInteractions(() => {
  loadPendingData();
}, [], false);
```

#### 延迟变体：useAfterInteractionsWithDelay

**设计目的**：支持多帧延迟，适用于复杂动画场景。

```typescript
/**
 * 在交互完成后执行回调，支持自定义帧延迟
 *
 * @param callback - 要执行的回调函数
 * @param deps - 依赖数组
 * @param frameDelay - 延迟的帧数（默认 1 帧）
 */
export function useAfterInteractionsWithDelay(
  callback: () => void,
  deps: React.DependencyList,
  frameDelay: number = 1
): void;
```

**使用场景**：
```typescript
// 等待 2 帧后执行（确保复杂动画完成）
useAfterInteractionsWithDelay(() => {
  loadHeavyContent();
}, [], 2);
```

---

### 2. useFocusState - 页面焦点状态

**设计目的**：简化 React Navigation 焦点状态管理，替代重复的 `useFocusEffect` 模式。

#### 核心架构

```typescript
/**
 * 页面焦点状态 Hook
 *
 * @returns isFocused - 当前页面是否聚焦
 */
export function useFocusState(): boolean {
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  return isFocused;
}
```

#### 设计优势

**简化前后对比**：

```typescript
// ❌ v1.0 - 重复代码模式
function MyPage() {
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  // 使用 isFocused...
}

// ✅ v2.0 - 使用 useFocusState
function MyPage() {
  const isFocused = useFocusState();

  // 使用 isFocused...
}
```

#### 实际应用

**防竞态条件导航控制**：
```typescript
// FeedPage.tsx - 全屏返回滚动控制
function FeedPage() {
  const isFocused = useFocusState();

  const handleVideoPress = useCallback(async (video) => {
    if (!isFocused) return; // 防止导航过程中的点击

    await enterVideoDetail(video.meta);
    loadSubtitle(video.meta.id, { background: true });
  }, [isFocused]);

  return <FeedList onVideoPress={handleVideoPress} />;
}
```

**条件化Hook启用**：
```typescript
// VideoFullscreenPage.tsx - 硬件返回键控制
function VideoFullscreenPage() {
  const { isLandscape } = useOrientationDetection();
  const isFocused = useFocusState();

  // 只在横屏且页面聚焦时拦截返回键
  useBackHandler(
    () => {
      log('Hardware back blocked in landscape');
      return true;
    },
    isLandscape && isFocused
  );

  return <FullscreenContent />;
}
```

---

## 🔧 v2.0 Hook优化

### useForceStatusBarStyle优化

**优化内容**：简化实现，移除冗余状态管理。

```typescript
// ❌ v1.0 - 复杂状态管理
const [currentStyle, setCurrentStyle] = useState<StatusBarStyle>(style);

useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    setCurrentStyle(style);
    StatusBar.setBarStyle(style);
  });

  return unsubscribe;
}, [navigation, style]);

// ✅ v2.0 - 直接设置，无需中间状态
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    StatusBar.setBarStyle(style);
  });

  return unsubscribe;
}, [navigation, style]);
```

**优势**：
- 减少不必要的状态变量
- 降低重渲染次数
- 代码更简洁清晰

### usePlayerReadyState优化

**优化内容**：使用 `useFocusState` 替代手动焦点管理。

```typescript
// ❌ v1.0 - 手动管理焦点状态
const [isPageFocused, setIsPageFocused] = useState(false);

useFocusEffect(
  useCallback(() => {
    setIsPageFocused(true);
    return () => setIsPageFocused(false);
  }, [])
);

// ✅ v2.0 - 使用 useFocusState
const isPageFocused = useFocusState();
```

---

## 核心设计模式

### 1. Ref存储模式（避免闭包陷阱）

**问题场景**：
```typescript
// ❌ 问题：回调闭包捕获旧值
const [count, setCount] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // 永远是 0（闭包捕获）
  }, 1000);

  return () => clearInterval(timer);
}, []); // 空依赖，callback永不更新
```

**解决方案**：
```typescript
// ✅ 解决：使用 ref 存储最新值
const callbackRef = useRef(callback);

useEffect(() => {
  callbackRef.current = callback;
}, [callback]);

useEffect(() => {
  const timer = setInterval(() => {
    callbackRef.current(); // 总是执行最新的callback
  }, 1000);

  return () => clearInterval(timer);
}, []); // 依赖安全
```

**应用Hook**：`useAfterInteractions`, `useDebounce`, `useTimer`

---

### 2. 条件化Hook模式

**设计目的**：通过参数控制Hook是否生效，避免不必要的订阅。

```typescript
// 示例：useBackHandler
export function useBackHandler(
  handler: () => boolean,
  enabled: boolean = true  // 条件参数
): void {
  useEffect(() => {
    if (!enabled) return; // 不启用时跳过

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handler
    );

    return () => subscription.remove();
  }, [handler, enabled]);
}
```

**应用场景**：
```typescript
// 只在横屏时拦截返回键
useBackHandler(handleBack, isLandscape);

// 只在页面聚焦时启用某功能
useEventSubscription(event, handler, isFocused);
```

---

### 3. 组合Hook模式

**设计目的**：多个Hook组合使用，实现复杂功能。

```typescript
// 示例：全屏视频页面的Hook组合
function VideoFullscreenPage() {
  // 1️⃣ 焦点状态
  const isFocused = useFocusState();

  // 2️⃣ 方向检测
  const { isLandscape } = useOrientationDetection();

  // 3️⃣ 条件化返回键控制
  useBackHandler(() => true, isLandscape && isFocused);

  // 4️⃣ 交互后滚动
  useAfterInteractions(() => {
    scrollToCurrentVideo();
  }, [currentVideoId]);

  return <Content />;
}
```

---

## 性能优化策略

### 1. 最小依赖数组

**原则**：只在必要的依赖变化时触发Effect。

```typescript
// ❌ 过多依赖
useEffect(() => {
  doSomething();
}, [a, b, c, d, e]); // 任何一个变化都会触发

// ✅ 最小依赖（使用 ref 存储不变的值）
const bRef = useRef(b);
const cRef = useRef(c);

useEffect(() => {
  bRef.current = b;
  cRef.current = c;
}, [b, c]);

useEffect(() => {
  doSomething(a, bRef.current, cRef.current);
}, [a]); // 仅在 a 变化时触发
```

---

### 2. RAF性能优化

**原理**：使用 `requestAnimationFrame` 确保在浏览器下一帧执行，避免布局抖动。

```typescript
// 导航完成后滚动（避免视觉跳动）
useAfterInteractions(() => {
  scrollViewRef.current?.scrollTo({ y: savedPosition });
}, [savedPosition]); // useRAF 默认为 true
```

**性能对比**：
- **无RAF**：可能在渲染中间执行，导致布局闪烁
- **有RAF**：在下一帧开始前执行，流畅无闪烁

---

### 3. InteractionManager优化

**原理**：延迟非关键操作到交互完成后，避免阻塞用户操作。

```typescript
// 页面加载优先级分离
function MyPage() {
  // 1️⃣ 关键渲染（立即）
  const [criticalData, setCriticalData] = useState(initialData);

  // 2️⃣ 非关键数据（延迟）
  useAfterInteractions(() => {
    loadHeavyData().then(setHeavyData);
  }, [], false);

  return <View>{criticalData}</View>;
}
```

---

## 内存安全保证

### 1. 组件卸载检查

**所有Hooks都实现cleanup逻辑**：

```typescript
// 示例：useEventSubscription
useEffect(() => {
  const subscription = EventEmitter.addListener(event, handler);

  return () => {
    subscription.remove(); // ✅ 卸载时清理
  };
}, [event, handler]);
```

### 2. 异步操作保护

**结合 `useMountedState` 使用**：

```typescript
function MyComponent() {
  const isMounted = useMountedState();

  useAfterInteractions(async () => {
    const data = await fetchData();

    if (isMounted()) {
      setData(data); // ✅ 仅在组件仍挂载时更新
    }
  }, []);
}
```

---

## 测试最佳实践

### 1. Hook测试模式

```typescript
import { renderHook, act } from '@testing-library/react-hooks';

// 测试 useFocusState
test('returns focus state correctly', () => {
  const { result } = renderHook(() => useFocusState());

  // 初始状态
  expect(result.current).toBe(false);

  // 模拟焦点获得
  act(() => {
    // Trigger focus event
  });

  expect(result.current).toBe(true);
});
```

### 2. 异步Hook测试

```typescript
// 测试 useAfterInteractions
test('executes callback after interactions', async () => {
  const callback = jest.fn();
  const { waitForNextUpdate } = renderHook(() =>
    useAfterInteractions(callback, [])
  );

  // 等待InteractionManager完成
  await waitForNextUpdate();

  expect(callback).toHaveBeenCalled();
});
```

---

## 使用指南

### 何时创建新Hook

**创建新Hook的标准**：
1. **重复使用**：相同逻辑在3个以上地方使用
2. **可组合**：可以与其他Hook组合使用
3. **业务无关**：不依赖特定业务逻辑
4. **性能优化**：提供明确的性能收益
5. **类型安全**：完整的TypeScript支持

### 命名规范

```
use + 功能描述 + 类型
│     │         └─ State/Effect/Callback/Handler
│     └─ 清晰的功能描述
└─ 固定前缀

示例：
- useFocusState      # 焦点状态
- useAfterInteractions # 交互后执行
- useBackHandler     # 返回键处理
- usePlayerReadyState # 播放器就绪状态
```

---

## 常见问题

### Q: 何时使用 useAfterInteractions vs useEffect？

**A:**
- **useEffect**: 关键逻辑，需要立即执行
- **useAfterInteractions**: 非关键逻辑，可延迟到交互完成后

### Q: useFocusState vs 手动 useFocusEffect？

**A:**
- **useFocusState**: 只需要焦点状态布尔值
- **useFocusEffect**: 需要在焦点变化时执行副作用

### Q: 何时使用 useRAF 参数？

**A:**
- **useRAF=true**: 涉及UI更新（滚动、动画、布局）
- **useRAF=false**: 纯数据操作（网络请求、状态更新）

---

## 未来扩展

### 规划中的Hooks

1. **useThrottle** - 节流Hook，限制函数执行频率
2. **usePrevious** - 访问上一次的值
3. **useMediaQuery** - 响应式布局支持
4. **useKeyboard** - 键盘状态管理

---

## 维护注意事项

1. **保持零依赖**：不引入业务Entity或Feature
2. **完整类型定义**：所有参数和返回值都有类型
3. **文档完备**：JSDoc注释 + 使用示例
4. **性能优先**：避免不必要的重渲染和内存泄漏
5. **测试覆盖**：单元测试覆盖所有分支逻辑

---

**文档版本**: v2.0
**最后更新**: 2025-10-10
**维护者**: Shared Hooks Team
**相关文档**: `src/shared/hooks/index.ts`, FeedPage CONTEXT.md, VideoFullscreenPage CONTEXT.md
