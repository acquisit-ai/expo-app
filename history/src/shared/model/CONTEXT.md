# 状态管理系统文档

*项目的全局状态管理架构和实现策略*

---

## 1. 架构概述

本项目采用**简化的状态管理策略**，避免过度工程化的全局状态管理复杂度。

### 核心原则
- **优先局部状态**: 使用React hooks管理组件级状态
- **必要时全局化**: 仅在真正需要跨组件共享时使用全局状态
- **上下文优先**: 使用React Context进行跨组件状态传递
- **避免过度抽象**: 保持状态管理的简洁性和可维护性

## 2. 状态分层架构

项目遵循 **Feature-Sliced Design (FSD)** 的状态管理分层原则：

```
src/shared/model/          # 全局共享状态 (当前为空，状态管理已简化)
├── index.ts               # ✅ 状态模型统一导出 (已实现)
└── CONTEXT.md             # 状态管理系统文档

src/entities/[entity]/model/   # 业务实体状态
src/features/auth/model/       # ✅ 认证功能状态管理 (已实现)
├── useAuthFlow.ts             # 认证流程状态管理钩子
├── useEmailCodeForm.ts        # 邮箱验证码表单管理钩子
├── usePasswordResetForm.ts    # 密码重置表单管理钩子
src/widgets/[widget]/model/    # 组件状态
```

## 3. 当前状态管理实现

### ✅ 认证状态管理
**实现**: `src/features/auth/providers/AuthProvider.tsx`
- React Context + useState 模式，使用状态机架构
- 会话持久化到 AsyncStorage
- 完整的认证生命周期管理
- API冷却保护机制，内置速率限制
- 错误处理通过全局Toast系统统一管理

### ✅ 主题状态管理
**实现**: `src/shared/providers/ThemeProvider.tsx`
- React Context + useState 模式
- 主题偏好持久化
- 支持浅色/深色/自动模式

### ✅ 认证状态集成增强
**实现**: 增强的 `src/features/auth/providers/AuthProvider.tsx`
- 集成cooldown管理(`sendCodeCooldown`, `verifyCooldown`)到认证状态
- AuthOperations类依赖注入模式，实现关注点分离
- 增强内存安全模式，完整的组件挂载状态跟踪
- Toast集成，改善用户反馈体验

## 4. 开发指导原则

### 状态选择策略
1. **组件内状态** → 使用 `useState` 或 `useReducer`
2. **跨组件传递** → 使用 props 或 Context
3. **全局共享状态** → 考虑是否真的需要，优先简化方案

### 性能优化模式
- **Provider优化**: 使用 `useMemo` 缓存Context值
- **状态机模式**: 使用枚举替代多个布尔状态
- **派生状态**: 从核心状态计算派生值
- **最小依赖**: 减少useEffect依赖数组

### 内存安全保证
- **组件挂载跟踪**: 使用 `useRef` 防止内存泄漏
- **异步操作保护**: 检查组件挂载状态
- **清理函数**: 及时清理定时器和订阅

## 5. 扩展指南

### 如果需要添加全局状态
1. **评估必要性**: 确认无法通过局部状态或Context解决
2. **选择工具**: 优先考虑React内置方案，必要时使用Zustand
3. **遵循FSD**: 将状态放在合适的架构层级
4. **文档更新**: 在本文档中记录新增的状态管理

### 推荐的状态管理库
- **React内置**: `useState`, `useReducer`, `useContext`
- **轻量级全局状态**: `zustand` (项目已安装但未使用)
- **表单状态**: `react-hook-form` (项目中已使用)

---

## 总结

当前项目的状态管理架构**简洁而实用**，避免了不必要的复杂度。通过React内置的状态管理方案和合理的架构分层，实现了高效的状态管理。

如需扩展全局状态，应遵循"先简化，后复杂化"的原则，确保每个状态管理决策都有明确的业务价值。