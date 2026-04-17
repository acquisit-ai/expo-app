# 基于 Feature-Sliced Design 的 React Native 跨平台应用架构设计文档

[ui的颜色和大小，位置都不要hardcode，这样方便后续适配不同屏幕大小的机型，这样如何处理最好](https://www.notion.so/ui-hardcode-2697742dc03a80579377e8f3f31ca153?pvs=21)

## 第一部分：架构基础 - 功能切片设计蓝图

本部分旨在为所提议的单词学习应用奠定坚实的架构基础。我们将采用功能切片设计（Feature-Sliced Design, FSD）方法论，并将其核心原则特别针对 React Native 和 Expo 的移动开发环境进行调整。此蓝图将超越通用的 Web 应用示例，为项目提供一个量身定制的、可扩展的结构，确保其在不断变化的业务需求面前保持高度的可维护性和稳定性 1。

### 1.1. 在移动应用上下文中解构功能切片设计

功能切片设计（FSD）是一种用于构建前端应用的前沿架构方法论，其核心目标是通过一套标准化的代码组织规则和约定，来应对大型项目中日益增长的复杂性 1。与传统按技术类型（如

`components`, `services`）分层不同，FSD 强调以业务和用户需求为导向，将应用分解为更易于理解和管理的模块 3。对于功能丰富的移动应用而言，这种方法论尤为适用，因为它能显著提升团队协作效率和项目的长期健康度。

FSD 的结构由七个明确定义的层级构成，这些层级自上而下排列，并遵循严格的依赖规则：上层模块可以依赖下层模块，但反之则不行。同层模块之间也禁止相互依赖。这种单向依赖流是 FSD 架构稳定性的基石，它确保了模块的隔离性，使得修改和重构能够被控制在有限的范围内，而不会引发不可预见的连锁反应 1。

以下是 FSD 七个层级在本单词学习应用中的具体职责和示例：

1. **`app` 层 (应用层)**
    - **职责**: 应用的入口和全局配置中心。这是整个应用的组合根，负责初始化所有全局上下文提供者（Providers）、配置根导航器、注入全局样式和字体，以及执行应用启动时所需的引导逻辑。
    - **示例**: 在 `app/_layout.tsx` 中初始化 `QueryClientProvider` (用于 TanStack Query)、`SQLiteProvider` (用于 expo-sqlite)、主题提供者，并配置 Expo Router 的根布局（如 `Stack` 导航器）2。
2. **`pages` 层 (页面层)**
    - **职责**: 代表应用中的完整屏幕或页面，与路由直接对应。每个页面都是由下层的 `widgets`、`features` 和 `entities` 组合而成的独立单元。
    - **核心规则**: `pages` 层的切片（Slices）之间严禁相互导入。例如，`LearningPage` 不能直接导入 `CollectionsPage` 的任何代码。这一规则强制实现了页面级别的解耦，是 FSD 架构的关键约束之一 6。
    - **示例**: `LearningPage` (单词学习页)、`CollectionsPage` (收藏列表页)、`UserProfilePage` (用户个人资料页)。
3. **`widgets` 层 (部件层)**
    - **职责**: 组合 `features` 和 `entities` 形成独立的、有意义的 UI 功能块。这些部件通常是页面中可复用的较大组成部分，但不包含复杂的业务流程逻辑。
    - **示例**: `WordCardViewer` (单词卡片查看器，包含卡片内容、前后导航按钮、收藏功能)、`CollectionList` (收藏列表，包含卡片列表和分页控件)、`UserProfileHeader` (用户资料页的头部信息展示区)。
4. **`features` 层 (功能层)**
    - **职责**: 封装能够为用户带来直接业务价值的原子化交互操作。一个 `feature` 通常代表一个完整的用户动作，如点击按钮、提交表单等。这是应用中大部分用户交互逻辑的所在地。
    - **示例**: `toggle-favorite-word` (切换单词收藏状态)、`submit-feedback` (提交用户反馈)、`update-user-profile` (更新用户个人信息)、`auth-by-email` (通过邮箱登录) 1。
5. **`entities` 层 (实体层)**
    - **职责**: 定义应用的核心业务实体（或称领域模型）。每个实体不仅包含其数据结构（类型、接口），还可包含与之直接相关的 UI 组件（如卡片、头像）和基础业务逻辑（如数据格式化）。实体是“什么”（What），而功能是“用它做什么”（What you do with it）7。
    - **示例**: `user` (用户实体，包含用户数据模型、`Avatar` 组件)、`wordCard` (单词卡片实体，代表 `ParsedFeedItem`，包含卡片内容的展示组件)、`collection` (收藏夹实体)。
6. **`shared` 层 (共享层)**
    - **职责**: 存放整个应用可复用的、与具体业务逻辑无关的基础代码。这是 FSD 架构的最底层，可以被任何上层模块安全地依赖。
    - **示例**: UI Kit (如 `Button`, `Input`, `Modal` 等纯 UI 组件)、API 客户端实例、工具函数 (`lib`)、全局配置 (`config`)、类型定义等 1。
7. **`processes` 层 (流程层)**
    - **职责**: (已废弃) 在旧版 FSD 中，此层用于处理跨越多个页面的复杂业务流程，如多步注册流程。在新版 FSD 中，这类逻辑通常被移至 `features` 层或通过路由状态管理来处理。因此，在本项目中将不使用此层。

**切片 (Slices) 与段 (Segments)**

为了进一步细化组织结构，FSD 引入了切片和段的概念：

- **切片 (Slices)**: 在 `pages`、`widgets`、`features` 和 `entities` 层内，代码按业务领域进行垂直分区，每一个分区就是一个切片。切片通常以文件夹的形式存在，使得与同一业务领域相关的代码聚合在一起，极大地提高了代码库的可导航性 1。例如，
    
    `entities/user` 和 `features/auth-by-email` 都是切片。
    
- **段 (Segments)**: 在每个切片（或 `shared` 层）内部，代码按其技术用途进行水平分区，这些分区被称为段。段也是文件夹，其名称有通用约定，用于清晰地分离不同职责的代码 1。
    - `ui`: 存放与界面展示相关的代码，如 React 组件、样式、格式化函数等。
    - `model`: 存放业务逻辑和数据模型，如状态管理（stores）、类型定义、校验 schema、业务 hooks 等。
    - `api`: 存放与后端 API 交互的代码，如数据请求函数、数据传输对象（DTO）类型等。
    - `lib`: 存放该切片内部使用的辅助函数或库代码。

通过这种“层 -> 切片 -> 段”的三级结构，FSD 为大型应用提供了一个高度规范化、可预测且易于扩展的架构蓝图。

### 1.2. 最终项目目录结构

基于上述 FSD 原则，为本项目设计的完整 `src` 目录结构如下。该结构将作为开发团队组织代码的权威指南，确保所有成员遵循统一的规范。

`/src
├── app/
│   ├── providers/      # 全局上下文提供者 (QueryClient, Theme, etc.)
│   ├── styles/         # 全局样式和主题
│   └── index.ts        # app 层的公共 API (通常为空或导出类型)
│
├── pages/
│   ├── learning/       # 学习页面切片
│   │   ├── ui/
│   │   │   └── LearningPage.tsx
│   │   └── index.ts
│   ├── collections/    # 收藏页面切片
│   │   ├── ui/
│   │   │   └── CollectionsPage.tsx
│   │   └── index.ts
│   └── user-profile/   # 用户资料页面切片
│       ├── ui/
│       │   └── UserProfilePage.tsx
│       └── index.ts
│
├── widgets/
│   ├── word-card-viewer/ # 单词卡片查看器部件
│   │   ├── ui/
│   │   └── index.ts
│   └── collection-list/    # 收藏列表部件
│       ├── ui/
│       └── index.ts
│
├── features/
│   ├── auth-by-email/      # 邮箱认证功能
│   │   ├── ui/
│   │   ├── model/
│   │   └── index.ts
│   ├── toggle-favorite-word/ # 切换单词收藏功能
│   │   ├── ui/
│   │   ├── model/
│   │   └── index.ts
│   └──...                 # 其他功能切片
│
├── entities/
│   ├── user/               # 用户实体
│   │   ├── ui/             # 例如: Avatar, UserInfoCard
│   │   ├── model/          # 例如: userStore, types, schemas
│   │   └── index.ts        # 实体的公共 API
│   ├── wordCard/           # 单词卡片实体
│   │   ├── ui/             # 例如: WordCardContent
│   │   ├── model/          # 例如: types, schemas
│   │   └── index.ts
│   └──...                 # 其他实体切片
│
└── shared/
    ├── api/                # API 客户端、请求实例、端点定义
    ├── lib/                # 通用库/工具函数 (日期、haptics、缓存服务)
    ├── config/             # 应用配置 (环境变量、常量)
    └── ui/                 # 基础 UI 组件库 (Button, Input, Modal, etc.)`

每个切片的根目录下都有一个 `index.ts` 文件，它定义了该模块的公共 API（Public API）。外部模块只能通过这个入口文件导入所需内容，而不能直接访问切片内部的文件。这一机制强制实现了封装，是 FSD 架构中控制依赖关系的核心手段 6。

### 1.3. FSD 层级职责矩阵表

为了在开发过程中消除关于代码放置位置的歧义，并加速新成员的融入，下表将 FSD 的抽象规则转化为针对本项目的具体、可操作的指南。它将作为架构决策的“单一事实来源”，确保代码组织的一致性。当开发者不确定某段逻辑应归属于 `feature` 还是 `widget` 时，此表可提供明确的判断依据，从而避免不必要的争论并提高开发效率 1。

| 层级 (Layer) | 在本项目中的核心职责 | 示例模块/切片 |
| --- | --- | --- |
| **`app`** | 应用入口与全局上下文配置。初始化所有服务、提供者和根导航。 | `app/providers` (QueryClientProvider, SQLiteProvider), `app/styles` (全局主题), `app/_layout.tsx` (根导航器配置) |
| **`pages`** | 构成一个完整的、可路由的屏幕。负责组合 `widgets` 和 `features` 来构建用户界面。 | `learning/`, `collections/`, `user-profile/`, `settings/` |
| **`widgets`** | 可复用的、由多个 `features` 和 `entities` 组成的复合 UI 块。它们是页面的主要构成部分。 | `word-card-viewer/`, `collection-list/`, `user-profile-header/`, `search-results-list/` |
| **`features`** | 封装单一、完整的用户交互逻辑，为用户提供直接的业务价值。连接 UI 操作与业务模型/API 调用。 | `toggle-favorite-word/`, `auth-by-email/`, `reset-password/`, `search-global/`, `change-theme/`, `submit-feedback/` |
| **`entities`** | 定义核心业务领域模型及其相关的数据、UI 和基础逻辑。它们是应用操作的对象。 | `user/` (用户数据模型, Avatar), `wordCard/` (单词卡片数据, 内容展示组件), `collection/` (收藏夹状态管理), `achievement/` (成就数据) |
| **`shared`** | 存放与业务无关的、可在全应用范围内复用的基础代码。是所有其他层的基础。 | `shared/ui` (Button, Input), `shared/api` (Axios 实例), `shared/lib` (缓存服务, haptics), `shared/config` (API 地址) |

## 第二部分：核心系统与横切关注点

本部分将详细阐述支撑整个应用功能的基础技术系统。这些系统被设计为横切关注点（Cross-Cutting Concerns），它们的服务能力将贯穿所有功能模块，同时其实现将严格遵循 FSD 的分层和解耦原则，确保架构的整洁与高效。

### 2.1. 混合式状态管理策略：为恰当的任务选择恰当的工具

在现代前端应用中，状态并非铁板一块。将其笼统地放入单一的全局存储中，往往会导致不必要的复杂性和性能问题。一个成熟的架构应当能够识别不同类型的状态，并为其选择最合适的管理工具。本项目中的状态可以明确地分为三类：

1. **服务端状态 (Server State)**: 存在于后端服务器上的异步数据，如单词卡片、用户个人资料等。这类状态的特点是应用无法直接控制其来源，它可能在用户不知情的情况下被其他客户端修改，因此会“过时”（stale）。管理它需要复杂的机制，包括缓存、后台同步、数据更新等 8。
2. **客户端状态 (Client State)**: 应用内部的、同步的、通常是短暂的 UI 状态。例如，当前的主题模式（浅色/深色）、模态框的可见性、表单输入值等。这类状态的管理相对简单，主要关注于在组件间高效地共享和更新。
3. **持久化本地状态 (Persistent Local State)**: 需要在设备上永久存储以支持离线访问的数据。例如，已缓存的单词卡片内容、用户的收藏单词 ID 列表等。这类状态需要通过本地数据库或文件系统进行管理。

许多开发团队倾向于使用单一的状态管理库（如 Redux 或 Zustand）来处理所有类型的状态，但这是一种常见的架构误区。将需要复杂缓存和同步逻辑的服务端状态强行塞入为同步客户端状态设计的管理器中，会导致开发者手动编写大量冗余的模板代码来处理加载、错误和缓存状态。反之，使用功能强大的服务端状态管理器来处理简单的 UI 开关状态，则属于“杀鸡用牛刀”，增加了不必要的复杂性。

因此，本项目将采用一种**混合式状态管理策略**。这并非增加了复杂性，而是架构成熟度的体现。它通过为不同类型的状态选择专门优化的工具，使得每部分代码都更简洁、更高效、更易于维护，从而实现了更高层次的关注点分离和解耦。

### 2.2. 服务端状态与离线同步：TanStack Query

对于服务端状态的管理，**TanStack Query** (原 React Query) 是当前业界的黄金标准 8。它通过一套强大的 hooks API，将数据获取、缓存、同步和更新的复杂逻辑抽象化，让开发者可以专注于业务功能。其对 React Native 的支持非常完善，提供了处理移动端特定场景（如应用聚焦时重新获取数据、网络状态管理）的专门 API 9。

- **选择理由**: TanStack Query 极大地简化了服务端状态的管理，内置了缓存、后台更新、数据过期、分页、无限滚动等高级功能。更重要的是，它为实现强大的离线优先（Offline-First）体验提供了完整的解决方案，完美契合了本项目的核心需求。
- **FSD 整合**:
    - `QueryClient` 实例将在 `shared/lib` 中创建和配置，然后在 `app/providers` 中通过 `QueryClientProvider` 提供给整个应用。
    - 所有的数据获取 hooks (如 `useQuery`, `useMutation`) 将在 `features` 和 `entities` 层的 `model` 或 `api` 段中使用。
- **离线优先策略的实现**:
    1. **网络状态管理 (`onlineManager`)**: TanStack Query 的 `onlineManager` 将与 `@react-native-community/netinfo`库集成。通过 `onlineManager.setEventListener`，应用可以实时监听网络连接状态的变化。当设备离线时，TanStack Query 会自动暂停所有正在进行的网络请求（queries 和 mutations）；当网络恢复时，它会自动恢复这些请求。这一切都是自动完成的，无需手动干预 9。
    2. **查询缓存持久化 (`persistQueryClient`)**: 为了在应用关闭并重新打开后仍能访问已缓存的数据，我们将使用 `@tanstack/react-query-persist-client` 插件。该插件需要一个 `persister`（持久化适配器）。虽然官方示例多使用 AsyncStorage，但考虑到性能和结构化数据的存储需求，我们将为其创建一个基于 `expo-sqlite` 键值存储（`kv-store`）的自定义异步 persister。这将把所有查询结果（包括数据和元信息）序列化后存入 SQLite 数据库，实现高效、可靠的本地持久化 10。
    3. **自动化的网络请求队列**: 用户的多个需求，如“异步网络队列”、“数据同步队列”和“学习数据上报”，都可以通过 TanStack Query 的**暂停突变 (Paused Mutations)** 机制优雅地实现，而无需引入额外的队列管理库。
        - **工作原理**: 当用户在离线状态下执行一个操作（如提交反馈、同步收藏），对应的 `useMutation`hook 会被调用。由于网络不可用，该 mutation 会被自动置于“暂停”状态，并连同其变量一起被 `persistQueryClient` 持久化到本地。
        - **自动恢复**: 当应用恢复在线状态时（可能是在当前会话中，也可能是在下次启动应用并成功从本地存储恢复后），我们将在 `PersistQueryClientProvider` 的 `onSuccess` 回调中调用 `queryClient.resumePausedMutations()`。此方法会自动重试所有被暂停的 mutations，形成一个先进先出（FIFO）的、持久化的、自动执行的网络请求队列 10。这种方法不仅功能强大，而且代码量极少，完美地利用了库的内置能力。

### 2.3. 全局客户端状态：Zustand

对于全局客户端状态的管理，我们将采用 **Zustand**。与 Redux Toolkit 相比，Zustand 提供了一个极其简约、基于 hooks 的 API，几乎没有模板代码，非常适合管理那些不需要复杂异步逻辑的简单状态 11。

- **选择理由**: Zustand 的学习曲线平缓，API 直观，体积小巧。对于管理主题切换、模态框状态、用户偏好设置等全局 UI 状态而言，它既轻量又强大，避免了 Redux 带来的额外复杂性 13。
- **FSD 整合**:
    - 所有的 Zustand stores 将被定义在 `shared/model` 段中，例如 `themeStore.ts`、`modalStore.ts`。
    - 由于 `shared` 层可以被任何上层模块访问，因此这些 stores 可以在应用的任何地方通过简单的 hooks 调用来使用 (`useThemeStore()`)，而不会违反 FSD 的依赖规则。

### 2.4. 本地持久化层：`expo-sqlite` 与 Drizzle ORM

对于需要结构化存储在本地的持久化数据（如缓存的单词卡片），我们将使用 **`expo-sqlite`** 作为底层的数据库引擎。然而，直接编写原始 SQL 查询字符串容易出错、难以维护，且缺乏类型安全。为了解决这个问题，我们将在 `expo-sqlite` 之上引入 **Drizzle ORM**。

- **选择理由**: Drizzle 是一个“无头”（headless）的 TypeScript ORM，它能将数据库 schema 直接映射为完全类型安全的查询构建器。这意味着所有的数据库操作都将在 TypeScript 编译时进行检查，从而杜绝了因字段名拼写错误、数据类型不匹配等问题导致的运行时错误，极大地提升了开发体验和代码的健壮性 14。
- **FSD 整合与配置**:
    1. **配置**: 遵循 Drizzle 的官方文档，我们将配置 `babel.config.js` 和 `metro.config.js` 以支持 `.sql` 文件的内联导入，并在 `drizzle.config.ts` 中指定 `driver: 'expo'` 15。
    2. **Schema 定义**: 数据库表的 schema 将在各自所属的实体切片中定义，例如 `entities/wordCard/model/schema.ts`。这使得数据模型与其所属的业务领域紧密耦合。
    3. **迁移管理**: 我们将使用 `drizzle-kit` 命令行工具来根据 schema 的变化自动生成 SQL 迁移文件。这些文件将被打包进应用中，并在应用启动时通过 `drizzle-orm/expo-sqlite/migrator` 提供的 `useMigrations` hook 自动应用到本地数据库。这个流程确保了数据库结构的演进是安全、可控且自动化的 14。
    4. **`LearningCacheService`**: 为了封装数据库操作的复杂性，我们将创建一个名为 `LearningCacheService` 的服务模块，位于 `shared/lib/` 或 `entities/wordCard/lib/`。该服务将暴露一组高级 API（如 `getCardById`, `saveCards`, `clearExpiredCards`），内部则使用 Drizzle ORM 执行所有与 SQLite 的交互。应用的其他部分（如 TanStack Query 的 `queryFn`）将只与这个服务接口交互，从而将数据库实现细节完全隔离。

### 2.5. 共享服务设计 (API、网络与队列)

- **中心化 API 客户端 (`shared/api`)**:
    - 我们将创建一个单例的 API 客户端（推荐使用 Axios，因其强大的拦截器功能）。这个客户端将封装所有通用配置，包括 API 的 `baseURL`、`headers`（如 `Content-Type`）以及最重要的——JWT 令牌的自动刷新逻辑。
    - **JWT 刷新拦截器**: 客户端将配置一个响应拦截器。当任何 API 请求返回 401 Unauthorized 错误时，该拦截器会触发。它将：
        1. 将失败的原始请求暂停并放入一个队列中。
        2. 使用存储在安全位置的刷新令牌（refresh token）向 Supabase Auth 发起一个获取新访问令牌（access token）的请求。
        3. 成功获取新令牌后，更新本地存储的令牌和 API 客户端实例的默认 `Authorization` 头。
        4. 重试所有在队列中等待的请求。
        5. 如果刷新令牌也已过期，则将用户重定向到登录页面。
    - 这个过程对所有调用 API 的业务代码都是完全透明的，极大地简化了身份认证逻辑的处理。
- **网络状态监控 (`shared/lib`)**:
    - 我们将创建一个简单的 `useNetworkStatus` hook，它内部使用 `@react-native-community/netinfo` 来监听网络状态。该 hook 会返回一个布尔值（`isOnline`），供 UI 组件根据网络状态显示不同的内容（如离线提示）。
    - 这个服务的状态变化也将被用来驱动 TanStack Query 的 `onlineManager`，确保数据获取层与实际网络状态保持同步 9。

## 第三部分：将应用功能映射至 FSD 架构

本部分是架构设计的核心，它将用户提出的 12 个具体功能需求逐一分解，并将其精确地映射到我们已经建立的 FSD 结构中。这种映射不仅展示了 FSD 的实践应用，也为开发团队提供了一份清晰的实现路线图。

### 3.1. 用户认证与账户管理 (需求 1)

这是一个典型的跨越多个模块的复杂功能，FSD 的分层结构能够清晰地组织其各个部分。

- **`pages`**:
    - `pages/login/`: 登录页面。
    - `pages/register/`: 注册页面。
    - `pages/reset-password/`: 密码重置页面。
    - 这些页面负责组合相关的 `features` 和 `entities` UI，构建完整的用户界面。
- **`features`**:
    - `features/auth-by-email/`: 包含邮箱/密码登录表单、提交逻辑以及与 Supabase Auth 的交互。
    - `features/auth-otp-verify/`: 包含 OTP 输入框和验证逻辑，用于注册或登录过程中的邮箱验证。
    - `features/reset-password-request/`: 包含请求密码重置邮件的表单。
    - `features/update-user-profile-form/`: 包含用户编辑个人资料的表单和提交逻辑。
    - `features/logout-button/`: 包含登出按钮及其点击后清除用户会话的逻辑。
- **`entities`**:
    - `entities/user/`: 这是用户领域的核心。
        - `model/`: 定义 `User` 类型、Supabase 返回的用户会话类型、以及使用 `zod` 库定义的登录、注册和个人资料更新的表单验证 schemas 16。同时，可以包含一个
            
            `userStore` (Zustand) 来存储当前登录用户的信息，供全应用访问。
            
        - `ui/`: 包含如 `Avatar`, `ProfileInfo` 等展示用户信息的纯组件。
- **`shared`**:
    - `features/auth/api/supabase.ts`: 封装所有与 Supabase Auth SDK 直接交互的函数，如 `signInWithPassword`, `signUp`, `signOut`, `onAuthStateChange` 等。
    - `shared/lib/sessionManager.ts`: 负责安全地存储（使用 `expo-secure-store`）和读取 JWT 和刷新令牌。
- **推荐库**:
    - **`react-hook-form`**: 用于处理所有表单的状态管理。它能有效减少重渲染，并提供强大的 API 来处理输入、校验和提交 18。
    - **`zod`**: 用于声明式地定义表单验证 schema。通过 `@hookform/resolvers/zod` 与 `react-hook-form` 集成，可以实现类型安全、易于维护的表单验证逻辑 16。

### 3.2. 单词卡片学习系统 (需求 2)

这是应用的核心学习功能，其实现将深度依赖于我们设计的离线优先数据流。

- **`pages`**:
    - `pages/learning/`: 学习主页面，它将组合 `WordCardViewer` 部件。
- **`widgets`**:
    - `widgets/word-card-viewer/`: 这是学习界面的核心部件。它负责展示当前的单词卡片，并集成 `navigate-card` 功能（前进/后退按钮）和学习进度指示器。
- **`features`**:
    - `features/navigate-card/`: 包含“下一个”和“上一个”按钮的 UI 和逻辑。点击时，它会更新当前正在查看的卡片 ID。
    - `features/track-learning-progress/`: 一个无 UI 的功能，可能是一个 hook (`useTrackProgress`)。当用户完成一张卡片的学习或在卡片间导航时，它负责记录学习进度并与本地和远程同步。
- **`entities`**:
    - `entities/wordCard/`: 代表 `ParsedFeedItem` 实体。
        - `model/`: 定义 `WordCard` 的 TypeScript 类型。包含一个核心的 hook，如 `useWordCard(cardId)`。这个 hook 内部使用 TanStack Query (`useQuery`) 来获取指定 ID 的卡片数据。
        - `ui/`: 包含 `WordCardDisplay` 组件，负责渲染单个卡片的详细内容。
- **`shared`**:
    - `shared/lib/LearningCacheService.ts`: 如第二部分所述，这是与 SQLite 交互的服务，使用 Drizzle ORM 实现对单词卡片的增删改查。

离线学习的数据流详解:

实现无缝的离线学习体验是该模块成功的关键。以下是当 useWordCard(cardId) hook 被调用时的详细数据处理流程：

1. **TanStack Query 触发**: `useWordCard` hook 内部的 `useQuery` 被激活，其 `queryKey` 为 `['wordCard', cardId]`。
2. **执行 `queryFn`**: `useQuery` 的 `queryFn` 函数开始执行。
3. **优先查询本地缓存**: `queryFn` 首先会调用 `LearningCacheService.getCardById(cardId)`，尝试从本地 SQLite 数据库中获取数据。
4. **本地命中**: 如果在 SQLite 中找到了数据，`queryFn` 会立即返回该数据。TanStack Query 会将其缓存到内存中并提供给 UI 组件。流程结束。
5. **本地未命中 & 网络在线**: 如果 SQLite 中没有数据，`queryFn` 会检查当前的网络状态（通过 `onlineManager`）。如果在线，它会继续向后端的 RESTful API 发起网络请求。
6. **API 数据获取与持久化**: 成功从 API 获取到数据后，`queryFn` *不会* 立即返回。它会先调用 `LearningCacheService.saveCard(data)` 将新数据写入本地 SQLite 数据库，以备将来离线使用。
7. **返回数据**: 数据成功存入本地数据库后，`queryFn` 才将数据返回。TanStack Query 随后将其缓存并更新 UI。
8. **本地未命中 & 网络离线**: 如果 SQLite 中没有数据，且设备处于离线状态，`queryFn` 将抛出一个错误或返回一个表示离线的特定状态。UI 层可以捕获此状态并向用户显示相应的提示信息。

这个分层的数据获取策略确保了只要一张卡片被成功加载过一次，它就会被持久化到本地，从而在后续的离线访问中可用，完美地实现了“离线学习支持”和“根据 card ID 复用和获取未缓存卡片”的需求。

### 3.3. 收藏功能 (需求 3)

- **`pages`**:
    - `pages/collections/`: 展示用户收藏列表的页面。
- **`widgets`**:
    - `widgets/collection-list/`: 负责渲染收藏卡片的列表，并处理分页、搜索等交互。
- **`features`**:
    - `features/toggle-favorite-word/`: 一个可复用的功能组件（通常是一个星形图标按钮）。它封装了收藏/取消收藏一个单词的全部逻辑。这个 feature 将被用在 `WordCardViewer` 部件和 `CollectionList` 部件中的每个卡片上。
    - `features/search-in-collection/`: 收藏列表页面内的搜索框功能。
    - `features/batch-collection-actions/`: 用于实现批量收藏/取消收藏的操作界面和逻辑。
- **`entities`**:
    - `entities/collection/`: 管理收藏状态的实体。
        - `model/`: 包含一个 `collectionStore` (可以使用 Zustand 实现)。这个 store 内部使用 `AsyncStorage` 来快速、同步地持久化收藏的单词 ID 列表。选择 `AsyncStorage` 是因为它对于简单的键值存储（如 ID 数组）非常高效。同时，该 store 会暴露 `add`, `remove`, `isFavorite` 等方法。
- **`shared`**:
    - `shared/lib/CollectionSyncService.ts`: 一个后台同步服务。它会监听 `collectionStore` 的变化，并将本地的收藏列表与后端服务器进行同步。这种同步可以是定时的，也可以是在应用启动或网络恢复时触发。这确保了用户在多设备间的收藏数据一致性。

### 3.4. 学习交互功能 (需求 4)

这些功能通常是嵌入在单词卡片内部的微交互。

- **`features`**:
    - `features/word-interaction/`: 一个高阶组件或 hook，用于包裹单词卡片句子中的每个单词。当用户点击一个被包裹的单词时，它会触发一个事件（如打开一个 Modal 或 Tooltip），并将该单词的相关信息（如词本身、上下文）传递出去。
    - `features/copy-to-clipboard/`: 一个可复用的功能，接收文本作为输入，点击后将其复制到剪贴板，并显示一个 Tooltip 提示“已复制”。
- **`widgets`**:
    - `widgets/grammar-analysis-display/`: 一个在 Modal 中显示的部件，用于展示单词的语法分析结果。
    - `widgets/definition-display/`: 同样在 Modal 中显示，用于展示单词的定义，并可以包含动画效果。
- **`shared`**:
    - `shared/lib/haptics.ts`: 封装 `expo-haptics` 库的简单工具函数，提供如 `lightImpact`, `mediumImpact` 等便捷的触觉反馈调用。
    - `shared/ui/Tooltip.tsx`: 一个可在全应用复用的 Tooltip 提示组件。
    - `shared/ui/Highlighter.tsx`: 一个句子渲染组件，可以根据输入高亮特定单词。

### 3.5. 反馈与数据收集 (需求 5)

- **`features`**:
    - `features/track-learning-event/`: 一个无 UI 的 hook (`useTrackEvent`)。其他 `features`（如 `navigate-card`, `word-interaction`）可以在其逻辑中调用这个 hook 来记录用户的学习行为（点击、展开、完成等）。
- **`entities`**:
    - `entities/feedback/`:
        - `model/`: 定义 `FeedbackDataModel` 的 TypeScript 类型，以及用于数据上报的 `useSubmitFeedback`mutation hook (基于 TanStack Query)。
- **`shared`**:
    - `shared/api/feedback.ts`: 包含调用学习数据上报 API 端点的函数。
    - **`FeedbackNetworkQueue` 的实现**: 正如 2.2 节所述，这个需求将通过 TanStack Query 的暂停突变机制自动实现。`useSubmitFeedback` hook 在离线时会将其 mutation 自动加入队列，并在网络恢复后自动发送。

### 3.6. 搜索功能 (需求 6)

- **`pages`**:
    - `pages/search/`: 全局搜索页面，可能是应用的一个独立 Tab。
- **`features`**:
    - `features/global-search-bar/`: 全局搜索的输入框和逻辑。
    - `features/search-in-collection/`: 已在 3.3 节中定义，用于收藏页面。
- **`widgets`**:
    - `widgets/search-results-list/`: 一个通用的搜索结果展示部件，可以根据传入的 props 显示全局搜索结果或收藏内搜索结果。

### 3.7. 用户偏好设置 (需求 7)

- **`pages`**:
    - `pages/settings/`: 用户设置页面。
- **`features`**:
    - `features/toggle-theme/`: 主题切换开关（浅色/深色模式）及其逻辑。
    - `features/manage-topics/`: 选择学习主题偏好的界面。
    - `features/customize-background/`: 自定义背景图片或颜色的功能。
- **`shared`**:
    - `shared/model/themeStore.ts`: 使用 Zustand 实现的全局主题状态 store。当 `toggle-theme` feature 修改这个 store 时，整个应用的 UI 会自动响应并重新渲染。
    - `shared/model/preferencesStore.ts`: 另一个 Zustand store，用于存储和持久化（使用 `zustand/middleware/persist` 和 AsyncStorage）其他用户偏好，如学习主题、背景设置等。

### 3.8. 缓存管理 (需求 8)

- **`features`**:
    - `features/clear-cache-button/`: 在设置页面的一个按钮，点击后会调用 `CacheManagerService` 的手动清理函数。
    - `features/cache-stats-display/`: 在设置页面展示缓存统计信息（如已缓存卡片数量、占用空间等）的 UI。
- **`shared`**:
    - `shared/lib/CacheManagerService.ts`: 一个关键的后台服务模块。
        - **自动清理**: 包含一个 `runAutoCleanup` 方法，该方法将在应用每次启动时（在 `app/_layout.tsx` 中调用）被触发。它会检查上次清理的时间，如果超过 24 小时，则执行清理任务。
        - **清理逻辑**: 清理任务会查询 SQLite 数据库中所有超过 7 天未被访问的单词卡片，并确保这些卡片不在用户的收藏列表中，然后将它们删除。
        - **统计功能**: 提供 `getCacheStats` 方法，供 `cache-stats-display` feature 调用。

### 3.9. 学习统计与成就 (需求 9)

- **`pages`**:
    - `pages/stats/`: 展示学习统计和成就的页面。
- **`widgets`**:
    - `widgets/learning-progress-chart/`: 使用图表库（如 `react-native-svg-charts`）进行学习数据可视化的部件。
    - `widgets/achievements-list/`: 展示用户已获得和未获得的成就列表。
- **`entities`**:
    - `entities/achievement/`: 定义成就的数据模型和单个成就的 UI 展示组件。
    - `entities/stats/`: 定义学习统计数据的模型和相关的 `useStats` 查询 hook。
- **`features`**:
    - `features/sync-progress/`: 一个后台功能，可能是一个定时或在特定事件（如完成一个学习单元）后触发的 TanStack Query `useQuery` 或 `useMutation`，用于将本地的学习进度和统计数据同步到服务器。

### 3.10. 报告与反馈 (需求 10)

- **`features`**:
    - `features/report-issue/`: 一个按钮或菜单项，点击后打开一个报告问题的 Modal。
        - **上下文收集**: 在打开 Modal 时，该 feature 会自动收集上下文信息，如当前路由、用户 ID、应用版本、设备信息等。
        - **表单提交**: Modal 内包含一个表单，用户填写问题描述后，通过一个 `useSubmitReport` mutation hook 将报告和上下文信息一同提交到服务器。

### 3.11. 网络与同步 (需求 11)

这是一个横切关注点，其实现已分布在第二部分设计的核心系统中。

- **网络状态监测**: 由 `shared/lib` 中的 `useNetworkStatus` hook 提供，并集成到 TanStack Query 的 `onlineManager`9。
- **API 错误处理与自动重试**:
    - **请求错误**: 由 `shared/api` 中的 Axios 拦截器统一处理（如 4xx, 5xx 错误），并可转换为用户友好的提示。
    - **自动重试**: TanStack Query 对 `useQuery` 默认提供自动重试机制。对于 `useMutation`，可以在离线后通过 `resumePausedMutations` 实现重试。

### 3.12. 导航架构 (需求 12)

这部分将由 Expo Router 负责，其与 FSD 的整合将在第四部分详细阐述。

### 3.13. 功能至 FSD 映射总表

下表为所有功能需求提供了一个快速索引，将其直接映射到 FSD 架构中的具体位置。这对于新加入的开发者快速定位代码、理解项目结构至关重要。

| 功能需求 | 主要 FSD 位置 | 关键切片/模块 |
| --- | --- | --- |
| JWT 认证与刷新 | `shared/api`, `shared/lib` | `api/axiosInstance.ts`, `lib/sessionManager.ts` |
| 邮箱注册/登录/重置 | `pages`, `features`, `entities/user` | `features/auth-by-email`, `features/reset-password-request` |
| 用户 Profile 管理 | `pages`, `features`, `entities/user` | `pages/user-profile`, `features/update-user-profile-form` |
| REST API 获取学习内容 | `entities/wordCard/model` | `useWordCard` hook (使用 TanStack Query) |
| SQLite 本地缓存 | `shared/lib`, `entities/wordCard` | `lib/LearningCacheService.ts`, `entities/wordCard/model/schema.ts` |
| 卡片导航与进度追踪 | `widgets`, `features` | `widgets/word-card-viewer`, `features/navigate-card` |
| 离线学习支持 | `entities/wordCard/model`, `shared/lib` | `useWordCard` 的数据流设计, `lib/LearningCacheService.ts` |
| 卡片收藏/取消收藏 | `features`, `entities/collection` | `features/toggle-favorite-word`, `entities/collection/model/collectionStore.ts` |
| 收藏列表与管理 | `pages`, `widgets` | `pages/collections`, `widgets/collection-list` |
| 单词点击与语法/定义展示 | `features`, `widgets` | `features/word-interaction`, `widgets/definition-display` |
| 复制功能与 Haptic 反馈 | `features`, `shared/lib` | `features/copy-to-clipboard`, `lib/haptics.ts` |
| 用户学习行为追踪 | `features`, `entities/feedback` | `features/track-learning-event`, `entities/feedback/model/useSubmitFeedback.ts` |
| 网络队列与数据上报 | `entities/feedback/model` | `useSubmitFeedback` (使用 TanStack Query 暂停突变) |
| 全局/收藏内搜索 | `pages`, `features`, `widgets` | `pages/search`, `features/global-search-bar`, `widgets/search-results-list` |
| 主题切换与用户偏好 | `pages`, `features`, `shared/model` | `features/toggle-theme`, `shared/model/themeStore.ts` |
| 缓存自动/手动清理 | `features`, `shared/lib` | `features/clear-cache-button`, `lib/CacheManagerService.ts` |
| 学习统计与成就 | `pages`, `widgets`, `entities` | `pages/stats`, `widgets/learning-progress-chart`, `entities/achievement` |
| 问题报告功能 | `features` | `features/report-issue` |
| Tab 导航与 Modal 系统 | `/app` (Expo Router), `shared/ui` | `/app/(tabs)/_layout.tsx`, `shared/ui/Modal.tsx` |

## 第四部分：UI 组合与 Expo Router 导航

本部分将阐述如何将遵循 FSD 架构的 UI 组件与 Expo Router 的文件系统路由机制进行无缝集成。我们将展示 FSD 的模块化思想与 Expo Router 的声明式路由如何协同工作，共同构建一个既结构清晰又易于维护的导航系统。

### 4.1. 实现基于 Tab 的导航布局

Expo Router 通过目录和文件约定来定义应用的导航结构，这使得创建标准的导航模式（如 Tabs 和 Stacks）变得非常直观 19。对于本项目要求的三个 Tab（学习、收藏、用户 Profile），我们将采用以下文件结构：

**`/app` 目录结构:**

`/app
├── _layout.tsx      # 根布局: 定义全局 Stack 导航器和应用级 Provider
└── (tabs)/
    ├── _layout.tsx  # Tab 布局: 定义 Tabs 导航器本身，配置 Tab 的图标和标签
    ├── learn.tsx    # 学习 Tab 对应的路由文件
    ├── collections.tsx # 收藏 Tab 对应的路由文件
    └── profile.tsx  # 用户 Profile Tab 对应的路由文件`

**结构解析:**

1. **`app/_layout.tsx` (根布局)**: 这是应用的顶层布局。它通常会导出一个 `Stack` 导航器。这个根 `Stack` 的作用是为整个应用提供一个统一的导航容器，可以用来管理非 Tab 屏幕（如登录页、设置详情页）或 Modal 弹窗。同时，这里也是包裹整个应用的全局提供者（Providers）的最佳位置 20。
2. **`(tabs)` (路由组)**: Expo Router 中，用括号包裹的目录名 `(tabs)` 表示这是一个“路由组”。它不会出现在 URL 路径中，但可以用来组织一组相关的路由，并为它们应用一个共享的布局 22。
3. **`app/(tabs)/_layout.tsx` (Tab 布局)**: 这是实现 Tab 导航的核心文件。它将导出一个 `Tabs` 组件，并在其中为每个 Tab 定义一个 `Tabs.Screen`。这里可以集中配置所有 Tab 的外观和行为，如激活颜色、图标、标签文字等 21。TypeScript
    
    **示例 `app/(tabs)/_layout.tsx`:**
    
    `import { Tabs } from 'expo-router';
    import FontAwesome from '@expo/vector-icons/FontAwesome';
    
    export default function TabLayout() {
      return (
        <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
          <Tabs.Screen
            name="learn"
            options={{
              title: '学习单词',
              tabBarIcon: ({ color }) => <FontAwesome size={28} name="book" color={color} />,
            }}
          />
          <Tabs.Screen
            name="collections"
            options={{
              title: '我的收藏',
              tabBarIcon: ({ color }) => <FontAwesome size={28} name="star" color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: '个人中心',
              tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
            }}
          />
        </Tabs>
      );
    }`
    
4. **`learn.tsx`, `collections.tsx`, `profile.tsx`**: 这些文件分别对应 Tab 导航器中的一个屏幕。文件名（不含扩展名）将作为 `Tabs.Screen` 的 `name` 属性值，将路由文件与 Tab 配置关联起来。

### 4.2. 组合屏幕：以“学习页面”为例

FSD 架构与 Expo Router 之间存在一种优雅的协同关系，关键在于理解它们各自的职责并保持清晰的界限。一个常见的误区是将复杂的页面逻辑直接写在 Expo Router 的路由文件（`/app` 目录下）中。正确的做法是维持关注点分离：**Expo Router 的 `/app` 目录只负责定义路由结构和导航行为，而页面的实际内容和复杂逻辑则完全在 FSD 的 `/src/pages` 层中构建**。

这种模式的优势在于：

- **解耦**: 导航逻辑与页面实现完全分离。如果未来需要更换路由库，只需修改 `/app` 目录，而 `/src` 内的所有业务代码都无需改动。
- **可测试性**: `/src/pages` 中的页面组件是纯粹的 React 组件，可以独立于路由系统进行单元测试和故事书（Storybook）展示。
- **代码清晰度**: `/app` 目录保持简洁，只包含路由“脚手架”，而所有业务实现都集中在结构化的 `/src` 目录中，遵循 FSD 的规范 23。

**实现流程:**

1. **在 FSD 中构建页面**: 在 `/src/pages/learning/ui/LearningPage.tsx` 中，我们通过组合来自下层 FSD 模块的组件来构建完整的学习页面。TypeScript
    
    `// /src/pages/learning/ui/LearningPage.tsx
    import React from 'react';
    import { View, StyleSheet } from 'react-native';
    import { WordCardViewer } from '@/widgets/word-card-viewer';
    import { useCurrentLearningCard } from '@/entities/learning-session'; // 假设的实体 hook
    
    export function LearningPage() {
      const { currentCardId } = useCurrentLearningCard();
    
      return (
        <View style={styles.container}>
          {/* WordCardViewer 是一个复杂的 widget */}
          <WordCardViewer cardId={currentCardId} />
        </View>
      );
    }
    
    const styles = StyleSheet.create({
      container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    });`
    
2. **在 Expo Router 中引用页面**: 对应的路由文件 `/app/(tabs)/learn.tsx` 变得极其简单，它只做一件事：导入并导出在 FSD 中构建好的页面组件。TypeScript
    
    `// /app/(tabs)/learn.tsx
    import { LearningPage } from '@/pages/learning';
    
    export default LearningPage;`
    

可视化组件组合流程:

这种自上而下的依赖关系是 FSD 的核心。我们可以清晰地看到“学习页面”是如何由不同层级的模块构成的：

- **`pages/learning`** (页面层)
    - 导入并使用 **`widgets/word-card-viewer`** (部件层)
        - `WordCardViewer` 内部导入并使用：
            - **`features/toggle-favorite-word`** (功能层)
            - **`features/navigate-card`** (功能层)
            - **`entities/wordCard/ui/WordCardDisplay`** (实体层)
                - `toggle-favorite-word` 功能内部导入并使用：
                    - **`shared/ui/IconButton`** (共享层)
                    - **`shared/lib/haptics`** (共享层)

这个清晰的依赖链条展示了 FSD 如何将一个复杂的屏幕分解为一系列独立的、可复用的、职责单一的模块。每一层都只依赖于其下方的层，确保了整个系统的松耦合和高内聚。

## 第五部分：综合与最终建议

本部分对整个架构设计进行总结，并提供一份整合的库堆栈参考，旨在为项目的启动和长期发展提供一个清晰、统一的技术蓝图。

### 5.1. 架构决策摘要

本设计方案的核心是为应用构建一个可扩展、可维护的骨架，以应对未来的功能迭代和团队扩张。关键的架构决策及其战略优势如下：

1. **采用功能切片设计 (FSD)**: FSD 作为核心组织原则，通过其严格的分层和模块化规则，强制实现了业务逻辑的高度解耦。这不仅降低了代码的认知负荷，也使得并行开发和安全重构成为可能，直接满足了用户对“高可维护性”和“模块解耦”的首要需求。
2. **实施混合式状态管理**: 我们明确区分了服务端状态、客户端状态和持久化本地状态，并为之选择了最优的工具组合（TanStack Query + Zustand）。这种策略避免了“一刀切”方案的弊端，使状态管理代码更简洁、高效，并利用 TanStack Query 的强大功能原生解决了离线同步和请求队列等复杂问题。
3. **引入类型安全的 ORM (Drizzle ORM)**: 在 `expo-sqlite` 之上增加 Drizzle ORM，将本地数据持久化操作从易错的原始 SQL 字符串提升为完全类型安全的 TypeScript 代码。这一决策旨在从根本上提高数据层的代码质量和开发效率，减少运行时错误。
4. **导航与实现分离**: 通过将 Expo Router 的路由定义（`/app`）与 FSD 的页面实现（`/src/pages`）分离，我们建立了一个清晰的架构边界。这确保了导航逻辑的简洁性，同时让核心业务代码保持独立和可移植。

这些决策共同构成了一个健壮、灵活且面向未来的架构，为打造一款高质量的跨平台应用奠定了坚实的基础。

### 5.2. 整合技术库堆栈表

下表汇总了本项目推荐使用的核心第三方库。它不仅是一个依赖列表，更是一份架构宣言，阐明了每个工具在应用中的确切角色、选择该工具的理由以及其在 FSD 架构中的主要集成点。这份表格将作为项目设置和技术选型的权威参考。

| 库 (Library) | 版本/标签 | 在应用中的角色 | 选择理由 | 主要 FSD 集成位置 |
| --- | --- | --- | --- | --- |
| **`@tanstack/react-query`** | `v5` | 服务端状态管理、缓存、离线同步、突变队列。 | 业界管理服务端状态的标杆。其强大的离线和持久化支持，无需自定义队列系统即可满足复杂的数据同步需求 8。 | 在 `app/providers` 中配置，通过 hooks 在 `features` 和 `entities` 的 `model` 或 `api` 段中使用。 |
| **`zustand`** | `latest` | 全局客户端状态管理（UI 状态）。 | 极简的 API，几乎无模板代码，学习成本低。非常适合管理主题、模态框等简单的全局状态，避免了 Redux 的复杂性 11。 | Stores 定义在 `shared/model`中，可在全应用通过 hooks 消费。 |
| **`drizzle-orm` & `drizzle-kit`** | `latest` | 类型安全的 SQLite ORM，用于本地数据持久化和迁移。 | 提供编译时的 SQL 查询校验，杜绝运行时错误。与 `expo-sqlite` 完美集成，极大提升了数据库操作的开发体验和安全性 14。 | Schema 定义在 `entities/{slice}/model`，服务封装在 `shared/lib`，迁移在 `app` 层启动时运行。 |
| **`expo-sqlite`** | `next` | 底层 SQLite 数据库驱动。 | Expo 生态系统内建的、高性能的本地数据库解决方案，为 Drizzle ORM 提供基础支持 24。 | 被 `drizzle-orm` 的 expo 驱动程序封装，对上层代码透明。 |
| **`react-hook-form`** | `v7` | 高性能、灵活的表单状态管理。 | 通过非受控组件的方式减少不必要的重渲染，API 功能强大，社区生态成熟，是处理复杂表单的最佳选择 18。 | 主要在 `features` 层的 UI 组件中使用，如登录、注册、反馈表单。 |
| **`zod`** | `latest` | 声明式的 schema 验证库。 | 提供类型推断，与 TypeScript 结合紧密。语法简洁表达力强，通过解析器可与 `react-hook-form` 无缝集成 16。 | Schemas 定义在 `entities/{slice}/model` 中，与业务实体的数据模型放在一起。 |
| **`expo-router`** | `v3` | 文件系统基础的声明式导航。 | 简化了 React Native 的导航设置，自动处理深层链接。与 Expo 生态紧密集成，提供了接近 Web 开发的路由体验 19。 | 路由定义在项目根目录的 `/app` 文件夹中。 |
| **`@supabase/supabase-js`** | `latest` | 与 Supabase 后端服务（特别是 Auth）交互的官方客户端库。 | 官方支持，提供了处理用户认证、会话管理等所有功能的便捷 API。 | 封装在 `features/auth/api/supabase.ts` 模块中。 |
| **`axios`** | `latest` | 基于 Promise 的 HTTP 客户端。 | 强大的拦截器功能是实现 JWT 自动刷新的关键。API 易用，是构建中心化 API 客户端的理想选择。 | 实例在 `shared/api` 中创建和配置。 |
| **`@react-native-community/netinfo`** | `latest` | 提供网络连接状态信息的库。 | 准确检测设备的在线/离线状态，是实现离线优先功能和驱动 TanStack Query `onlineManager` 的基础 9。 | 封装在 `shared/lib` 的网络状态服务或 hook 中。 |
| **`expo-secure-store`** | `latest` | 在设备上安全地存储键值对（如令牌）。 | 提供加密存储，是安全保存敏感信息（如 JWT 和刷新令牌）的标准做法。 | 封装在 `shared/lib/sessionManager.ts`中。 |