# Saved Feed 模块方案（收藏 / 历史通用）

- **更新时间**：2025-11-05
- **适用范围**：收藏（favorites）、历史记录（history）两类视频列表
- **核心目标**：通过配置化 Controller + 通用列表组件，实现单一堆栈页面复用，避免重复实现。

---

## 架构概览

```
saved-feed/
├── controller: useSavedFeedController(kind)
├── config: SavedFeedConfig 映射 favorites/history
├── list feature: SavedFeedList (FlatList)
├── page: SavedFeedPage (布局、生命周期)
└── screen: SavedFeedScreen (共享 Stack Screen)
```

- **SavedFeedKind**：`'favorites' | 'history'`，可扩展至更多 saved 类列表。
- **配置驱动**：`savedFeedConfigs.ts` 根据 kind 返回文案、空态提示、数据源（store + service）。
- **数据源协议**：每种 kind 提供统一接口（`useIds`, `useLoading`, `initialize`, `loadMore`, `refresh`）。
- **列表复用**：`SavedFeedList` 仅依赖 `videoIds` 与加载状态，内部从 `video-meta` 获取详情，支持刷新/分页/空态。
- **页面复用**：`SavedFeedPage` 负责 header、空态、刷新/分页逻辑；点击当前仍占位，后续可在配置中注入真实交互。

---

## 模块细节

### 1. Entity 层
- `entities/favorites` 与 `entities/history` 结构一致：`ids + Set` 去重、`loading`、`pagination`。
- Hooks：`useFavoriteIds/useFavoritesLoading`、`useHistoryIds/useHistoryLoading` 提供列表与状态。
- 可扩展：后续可在 history store 增加 `visitedAt` 映射而不影响页面。

### 2. Feature 层
- `features/favorites-fetching`、`features/history-fetching`：
  - Mock API (`*api.mock.ts`) 支持 limit/cursor、随机延迟与失败。
  - Service (`*Service.ts`) 负责：
    1. 调用 API。
    2. 将视频写入 `video-meta`。
    3. 更新对应实体的 ids / pagination。
    4. 统一日志 + toast 错误处理。
- 返回 Promise<void> 供 Controller 调用。

### 3. Saved Feed Controller
- `useSavedFeedController(kind)`：
  - 获取配置，订阅列表/状态。
  - 暴露 `initialize/loadMore/refresh`、标题、空态文案、列表 ids。
  - 保持返回引用稳定，便于组件使用 `useCallback`。
- 配置示例：

```ts
const SAVED_FEED_CONFIGS = {
  favorites: {
    title: '我的收藏',
    emptyState: {...},
    dataSource: {
      useIds: useFavoriteIds,
      useLoading: mapFavoritesLoading,
      initialize: () => initializeFavorites(),
      loadMore: () => loadMoreFavorites(),
      refresh: () => refreshFavorites(),
    },
  },
  history: {
    title: '历史记录',
    emptyState: {...},
    dataSource: {
      useIds: useHistoryIds,
      useLoading: mapHistoryLoading,
      initialize: () => initializeHistory(),
      loadMore: () => loadMoreHistory(),
      refresh: () => refreshHistory(),
    },
  },
};
```

### 4. 页面与导航
- `SavedFeedPage`：
  - Header 文案来自配置。
  - `useFocusEffect` 触发初始化；`useDebounce` 控制 `onEndReached`。
  - 默认空态组件使用配置文案，可通过 config 自定义 `listEmptyComponent`。
  - 点击逻辑默认 Toast，可在 config 注入 `onItemPress`。
- `SavedFeedScreen`：单一 Stack screen，根据 route 名推断 kind；Root Stack 注册 `Favorites`、`History` 两个路由，但组件相同。
- Profile 入口：`navigation.navigate('Favorites' | 'History')`。

### 5. Mock 数据策略
- 收藏与历史使用独立 mock 数据池，保持列表差异性。
- 可通过配置修改 limit、cursor 逻辑，后续接入真实接口时仅需替换 API 层。

---

## TODO 检查清单

| 状态 | 任务 |
| :--- | :--- |
| ✅ | 建立 `saved-feed-list` 通用组件，支持刷新/分页/空态 |
| ✅ | 编写 `useSavedFeedController` 与配置映射 favorites/history |
| ✅ | Favorites → SavedFeed 接入，删除旧 `FavoritesPage/FavoritesList` |
| ✅ | 新增 History entity & fetching（mock 数据）并完成接入 |
| ✅ | RootStack 注册 `Favorites`、`History` → `SavedFeedScreen`，Profile 入口更新 |
| ☐ | 手动验证：收藏/历史首屏加载、刷新、触底、空态显示 |
| ☐ | 规划播放入口：配置 `onItemPress` 调用播放器（待真实需求） |
| ☐ | 视需要引入历史时间戳/清空功能，扩展数据结构 |

---

## 后续迭代建议
1. **播放集成**：在配置中注入 `onItemPress`，复用播放器导航逻辑，实现点击进入全屏。
2. **数据扩展**：历史记录可在实体中保存 `visitedAt`，列表展示最近观看时间。
3. **批量操作**：为收藏/历史增加批量删除或清空操作，可通过 config 注入额外工具栏。
4. **真实接口**：切换 API 层至后端服务，保留 service/实体接口不变。
5. **更多列表类型**：如“稍后再看”，仅需新增 kind + 配置即可接入。
