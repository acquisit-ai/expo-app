# Favorites Entity

收藏列表实体负责维护用户收藏的视频 ID、加载状态与分页信息，为上层 Feature 和 Page 提供单一数据来源。

## 设计目标

- **单一事实源**：仅存储收藏 ID 和状态，视频详细信息仍由 `entities/video-meta` 管理。
- **类型安全**：完整的 `FavoritesStore` 类型描述状态结构，禁止使用 `any`。
- **可扩展性**：支持后续加入本地持久化、增量同步、批量操作等能力。
- **解耦**：不直接依赖任何 Feature，只暴露 Hook 和 Selector 供外部调用。

## 状态结构

```ts
interface FavoritesStore {
  favoriteIds: string[];        // 收藏 ID 列表
  favoriteIdSet: Set<string>;   // 用于去重
  loading: FavoritesLoadingState;
  pagination: FavoritesPaginationState;
  // 状态操作...
}
```

## 核心 API

| 方法 | 说明 |
| --- | --- |
| `appendFavoriteIds(ids)` | 追加收藏（自动去重） |
| `setFavoriteIds(ids)` | 使用新列表替换现有收藏 |
| `removeFavoriteId(id)` | 移除单个收藏 |
| `setLoading(isLoading, type)` | 更新加载状态 |
| `setPagination({ cursor, hasMore })` | 更新分页信息 |
| `resetFavorites()` | 清空收藏及状态 |

## Hooks & Selectors

- `useFavoriteIds()`：订阅收藏 ID 列表。
- `useFavoritesLoading()`：获取加载状态（`isLoading`、`loadingType`、`error`、`hasMore`）。
- `useFavoritesActions()`：组合实体层提供的所有状态操作。
- `favoritesSelectors.*`：用于按需订阅状态，优化渲染性能。

## 使用示例

```ts
import { useFavoriteIds, useFavoritesActions } from '@/entities/favorites';

function FavoritesContainer() {
  const favoriteIds = useFavoriteIds();
  const { appendFavoriteIds } = useFavoritesActions();

  // ...
}
```

## 与其他模块的关系

- 从 `features/favorites-fetching` 接收收藏 ID 并写入 store。
- 与视频详情 `entities/video-meta` 协作，列表仅保存 ID。
- Page 层（`FavoritesPage`）通过 Hook 获取状态并渲染 UI。

## 后续扩展点

- 收藏状态持久化到本地数据库（Drizzle）。
- 增加批量移除、分组管理、排序策略。
- 接入实时同步（Supabase Realtime / WebSocket 事件）。
