# MCP 助手规则 - My Word App

## 项目上下文
一个使用 React Native 构建的移动应用，旨在帮助用户学习和记忆单词。项目遵循 Feature-Sliced Design (FSD) 架构。

### 核心愿景与架构
- **产品目标**：提供一个简单、高效的移动端单词学习体验。
- **目标平台**：移动端 (iOS, Android)
- **架构**：Feature-Sliced Design (FSD)
- **关键技术**：TypeScript, React Native, Expo, Zustand, TanStack Query, Drizzle ORM

### 关键技术原则
- **模块化与可扩展性**: 严格遵循 Feature-Sliced Design (FSD) 架构，确保代码高内聚、低耦合。
- **声明式UI与组件化**: 使用 React 构建可复用、可组合的 UI 组件。
- **类型安全**: 全面拥抱 TypeScript，在编码阶段捕获潜在错误。
- **关注点分离**: 将业务逻辑、UI 和状态管理清晰分离。

**注意：**完整的项目结构和技术栈在附加的 `project-structure.md` 文件中提供。

## 关键项目标准

### 核心原则
- 遵循 KISS、YAGNI 和 DRY - 优先选择经过验证的解决方案而不是自定义实现。
- 永远不要模拟、使用占位符或省略代码 - 始终完全实现。
- 对想法的好坏要坦率诚实。
- **遵循已建立的 FSD 模式进行代码组织和功能开发。**

### 代码组织
- 保持文件在 350 行以内 - 通过提取工具、常量、类型或自定义 Hook 来拆分。
- 每个文件单一职责，目的明确。
- 优先组合而非继承。
- 遵循 Feature-Sliced Design (FSD) 的分层结构（app, pages, features, entities, shared）。

### TypeScript & React Native 标准
- **类型安全**: 始终使用 TypeScript 进行类型定义，避免使用 `any`。在 `package.json` 中应配置 `tsc --noEmit` 或类似的脚本用于类型检查。
- **命名约定**:
  - 组件/类/接口/类型: `PascalCase`
  - 函数/方法/变量: `camelCase`
  - 常量: `UPPER_SNAKE_CASE`
- **文档要求**: 使用 JSDoc 为导出的函数、模块和类型添加注释。
- **错误处理**: 使用 `try...catch` 块处理异步操作和可能失败的逻辑，并提供有意义的错误信息。

### 错误处理与日志记录
- 使用具体异常，提供有用消息。
- 日志应为 JSON 格式，包含 `timestamp`, `level`, `message`, 和可选的 `context` 对象。
- 每个请求都需要关联 ID 用于追踪。

### API 设计
[如适用 - 定义 API 标准]
- RESTful，URL 模式一致
- 从第一天开始版本化（/v1/、/v2/）
- 一致的响应格式
- 正确的 HTTP 状态码

### 安全与状态
- 永远不要信任外部输入 - 在边界处验证。
- **状态管理**: 使用 `Zustand` 进行全局状态管理，组件内部状态使用 React Hooks (`useState`, `useReducer`)。
- **数据保留**: 敏感用户数据不应在设备上长期存储。使用 Expo 的 `SecureStore` API 处理认证令牌等敏感信息。
- 仅在环境变量中保存秘钥。

## 项目特定指南
[添加 AI 助手应该知道的任何项目特定指南]

### 领域特定规则
[添加特定于你问题领域的规则]

### 集成点
[列出关键集成点或外部服务]

### 性能考虑
[添加任何性能关键方面]

## 重要约束
- 你不能创建、修改或执行代码
- 你在只读支持能力中运作
- 你的建议是给主要 AI（Claude Code）实现的
- 专注于分析、理解和咨询支持

## 快速参考
- **关键命令**:
  - `npm start` 或 `npx expo start`: 启动 Metro Bundler.
  - `npm run android`: 在 Android 模拟器或设备上运行应用.
  - `npm run ios`: 在 iOS 模拟器或设备上运行应用.
  - `npm run type-check`: 检查 TypeScript 类型错误.
- **重要路径**:
  - `src/`: 应用源代码根目录.
  - `app/`: Expo 文件路由目录.
  - `drizzle.config.ts`: Drizzle ORM 配置文件.
  - `app.json`: Expo 配置文件.
- **文档链接**:
  - `docs/ai-context/project-structure.md`
  - `docs/human-context/FeatureSlicedDesign.md`