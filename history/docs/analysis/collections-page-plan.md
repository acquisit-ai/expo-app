# Collections 页面改造方案（临时无分页）

## 1. 目标与约束

- **统一风格**：沿用 Profile 页面的磨砂玻璃 UI（`TabPageLayout`、`BlurCard`、`BlurList` 等），保持视觉一致与主题联动。
- **单一数据源**：`CollectionsPage` 只从 `entities/word-collection` 读取数据；所有网络请求及数据缓存均在实体与 Feature 层处理。
- **加载策略**：首次进入页面自动请求一次列表；支持下拉刷新触发同一请求并覆盖旧数据。
- **当前阶段**：后端尚未接入，API 层保留完整结构但返回模拟数据（随机 1000 条单词 + 0-100 的进度）。
- **性能要求**：列表使用虚拟化（优先 FlashList），即使无分页也能流畅展示上千条记录。

## 2. 模块划分与文件结构

```text
src/
├── entities/
│   └── word-collection/
│       ├── api/
│       ├── model/
│       │   ├── types.ts                     # WordItem, WordCollectionState
│       │   └── store.ts                     # Zustand store：items/loading/error
│       ├── hooks/
│       │   └── useWordCollectionEntity.ts   # 统一访问实体层（selectors + actions）
│       └── index.ts                         # 对外导出
├── features/
│   └── word-collection-list/
│       ├── hooks/useWordCollectionList.ts   # 组合实体 + API + 刷新
│       ├── ui/
│       │   ├── WordCollectionList.tsx       # FlatList/FlashList 包装
│       │   └── WordListItem.tsx             # 单词项（标题、来源、进度）
│       └── index.ts
└── pages/
    └── collections/
        ├── ui/CollectionsPage.tsx           # Header + List 组合
        └── index.ts
```

## 3. 数据类型设计

```ts
// src/entities/word-collection/model/types.ts
export type WordSource = 'book' | 'custom';

export interface WordItem {
  id: string;             // semanticElement.id
  kind: 'word' | 'phrase';
  label: string;
  pos: string;
  chineseLabel: string;
  chineseDef: string;
  source: WordSource;
  progress: number;       // 0-100
  addedAt: string;        // ISO 时间戳
  tags?: string[];
}

export interface WordCollectionState {
  entities: Record<string, WordItem>;
  order: string[];
  sorted: string[];
  isLoading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
}
```

## 4. 实体 Store 职责（2025-11-05 重构）

- Zustand state 改为 `entities + order + sorted` 三段：
  - `entities[id]`：语义元素 ID → 词条。
  - `order`：API 返回顺序，保证刷新的稳定性。
  - `sorted`：缓存当前排序结果（可按需填充/清空）。
- Actions：`setLoading`、`setError`、`replaceItems`、`upsertItem`、`removeItem`、`clearSorted`、`reset`。
  - `upsertItem`：新增/更新同一语义词条（收藏、进度变化等）。
  - `removeItem`：根据主键删除（用于取消收藏）。
  - `replaceItems`：重建 state 并清空排序缓存。
- `useWordCollectionEntity()` 返回 `{ items, entities, order, actions }`，其中 `items` 为 `order.map(id => entities[id])` 的派生值，供 Feature 层直接使用。

> 语义元素（semanticElement.id）成为词条唯一主键，文本可重复，收藏/取消收藏只需操作同一 id。

## 5. API 层（mock 实现）

- `fetchWordCollection.ts`
  - 使用 `useQuery(['word-collection', collectionId])`。
  - 请求函数：`await wait(400~600ms)` 后生成 1000 条 mock 数据，直接返回扁平化字段：
    ```ts
    const createItem = (idx: number): WordItem => ({
      id: String(idx + 1000),
      kind: idx % 5 === 4 ? 'phrase' : 'word',
      label: randomWord(idx),
      pos: POS_LIST[idx % POS_LIST.length],
      chineseLabel: randomShortMeaning(idx),
      chineseDef: randomLongMeaning(idx),
      source: Math.random() < 0.3 ? 'custom' : 'book',
      progress: Math.floor(Math.random() * 101),
      addedAt: dayjs().subtract(idx, 'hour').toISOString(),
    });
    ```
  - `onSuccess` → 调用实体层 `replaceItems`（内部会构建 `entities` + `order`）。
  - `onError` → `setError(message)` 并保持旧数据。
- 下拉刷新调用 `refetch()`，覆盖式写入。
- 未来接入真实 API 时，只需替换 `queryFn` 即可。

## 6. Feature Hook：`useWordCollectionList`

职责：
1. 订阅实体 store，返回 `items`, `isLoading`, `error`, `lastSyncedAt`.
2. 在 Feature 内使用 `useQuery` 调用 mock API（后续可替换为真实接口），成功时写入实体，失败时记录错误。
3. 输出给 UI：
   ```ts
 return {
    items,           // order => entities 映射后的派生数组
    isLoading,
    isRefreshing: queryResult.isRefetching,
    error,
    onRefresh: () => refetch(),
    lastSyncedAt,
    entities,        // 需要时可直接读取主键字典
  };
  ```

## 7. UI 组件细节

### 7.1 `WordCollectionList`
- 使用 FlashList（若暂未安装，可先用 FlatList 并标注 TODO）。
- Props：`items`, `loading`, `onRefresh`, `error`.

## 9. 排序控制设计（更新：2025-11-04）

- **排序选项（WordCollectionSort）**：
  - `alphabet-asc`：字母表正序（A → Z）。
  - `alphabet-desc`：字母表倒序（Z → A）。
  - `time-asc`：时间正序（所有 `source === 'custom'` 的单词排在前面，内部按 `addedAt` 升序；`book` 来源在后，内部按字母序升序）。
  - `time-desc`：时间倒序（`custom` 在前，内部按 `addedAt` 降序；`book` 在后，内部按字母序降序）。
  - `progress-asc`：学习进度从低到高，相同进度时按字母序。
  - `progress-desc`：学习进度从高到低，相同进度时按字母序倒排。

- **职责划分**：
  - **Entity 层**：继续只维护原始列表（`items`），不关心排序或 UI 状态，确保单一事实来源（SSOT）。
  - **Feature 层**：在 `features/word-collection-list` 内部维护排序状态，导出 `sortedItems` 和 `setSort`。排序逻辑对实体层的原始数据做纯函数转换。
  - **页面层**：仅负责渲染和控制交互（下拉菜单/排序按钮），通过 props 使用 Feature 提供的数据和操作。

- **实现要点**：
  - 引入 `WordCollectionSort` 枚举及 `SORT_LABELS` 映射，后续 UI 可直接消费。
  - 在 `useWordCollectionList` Hook 内部使用 `useState<WordCollectionSort>` 管理当前排序，`useMemo` + `comparators` 对原始列表排序。
  - `comparators: Record<WordCollectionSort, (a: WordItem, b: WordItem) => number>` 中统一处理：
    - `addedAt` 为空时使用 `Number.MIN_SAFE_INTEGER` / `Number.MAX_SAFE_INTEGER` 进行兜底，保证排序稳定。
    - 将 `source` 转换为可比较的权重（custom = 0，book = 1），满足时间排序的 grouping 规则。
    - 为字母序比较调用 `localeCompare` 并统一大小写。
  - Feature 返回值新增 `sortedItems`, `sort`, `setSort`，页面只渲染 `sortedItems`，实体原始 `items` 仍可用于统计（如 header 显示总量）。

- **Header 排序控件**：
  - Header 卡片维持与列表相同的宽度控制（左右 5% 边距）。
  - 借助共享组件 `NativePickerModalContent` + `NativePickerModal`，在页面中调用 `useNativePickerModal` 打开原生滚轮弹窗；弹窗位于屏幕中央（`BlurModal`），标题/选项/按钮三段式布局。
  - 选项文案：`字母表 A-Z`、`字母表 Z-A`、`按添加时间（最早优先）`、`按添加时间（最新优先）`、`按进度（从低到高）`、`按进度（从高到低）`。
  - 选择排序后调用 `setSort`，`useMemo` 自动计算新的 `sortedItems`，FlatList 重新渲染。

- **状态持久化（未来扩展）**：
  - 当前阶段排序状态只在页面会话内生效；后续若需要跨页面或全局持久，可在 Feature 内升级为 zustand slice，或写入 AsyncStorage。

- **测试计划**：
  - 单元测试 `comparators`（`__tests__/word-collection-sort.spec.ts`），覆盖 custom/book 混合、缺少 `addedAt`、同进度词汇等边界。
  - Hook 测试可 mock `useWordCollectionEntity`，验证切换排序时输出顺序正确。
  - UI 层后续可考虑 e2e 测试验证菜单交互，当前阶段以手动验证为主。

- 下拉刷新：`refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}`。
- 通过 `ListHeaderComponent` 注入顶部信息卡片，让头部与列表同步滚动，并让虚拟列表负责整屏滚动。
- 通过 `contentPaddingBottom` 给虚拟列表注入底部安全间距，避免 TabBar 遮挡并允许滚动到屏幕底部。
- 空态/错误处理：
  - `error` → 显示 `BlurCard` + “重试”按钮（调用 `onRefresh`）。
  - `!items.length && !loading` → 显示友好空态文案。

### 7.2 `WordListItem`
- 元素结构：
  - 顶部显示 `label`；下方展示中文释义（`chineseLabel` 优先，其次 `chineseDef`），并在同一块区域标明 `source`。
  - 右侧仍然是百分比数值与固定宽度进度条。
- 使用 `BlurCard` 包装每个条目，保持与其他卡片一致的边框/阴影。
- 进度条改为纯视图实现，带底色轨道，即使 0% 时仍可见。
- 点击处理保留 `onPress` 预留接口与日志记录。

## 8. 页面布局 `CollectionsPage`


> 注意：当页面包含 FlatList/FlashList 等虚拟化列表时，调用 `TabPageLayout` 时需传入 `scrollable={false}`，由列表自身承担滚动以避免嵌套警告。
> 布局实现：`TabPageLayout` 新增 `scrollable` 与 `contentStyle` 参数，禁用 ScrollView 时仍提供背景/安全区，并由 `FlatList` 填满高度（`style={{flex:1}}`）。

```tsx
export function CollectionsPage({ route }) {
  const params = route.params ?? {};
  const collectionId = params.collectionId ?? 'default';
  const headerTitle = params.title ?? '我的词汇本';
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get('window');
  const {
    items,
    isLoading,
    isRefreshing,
    error,
    onRefresh,
    lastSyncedAt,
  } = useWordCollectionList({ collectionId });

  const listBottomPadding = useMemo(() => {
    const tabBarBottom = screenHeight * 0.0168;
    const tabSpace = tabBarBottom + tabBar.height;
    const relativeMin = screenHeight * 0.05;
    const base = Math.max(tabSpace, relativeMin);
    return base + screenHeight * 0.02 + insets.bottom;
  }, [screenHeight, insets.bottom]);

  const header = (
    <BlurCard style={styles.headerCard}>
      <Text variant="titleLarge">{headerTitle}</Text>
      <Text variant="bodyMedium">{`共 ${items.length} 个单词`}</Text>
      {lastSyncedAt && (
        <Text variant="bodySmall">上次同步：{formatDateTime(lastSyncedAt)}</Text>
      )}
      <BlurButton primary loading={isLoading && !isRefreshing} onPress={onRefresh}>
        手动刷新
      </BlurButton>
      {error && (
        <Text variant="bodySmall">加载失败：{error}</Text>
      )}
    </BlurCard>
  );

  return (
    <TabPageLayout scrollable={false}>
      <WordCollectionList
        items={items}
        loading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        onRefresh={onRefresh}
        headerComponent={header}
        contentPaddingBottom={listBottomPadding}
        contentPaddingHorizontal={horizontalPadding}
      />
    </TabPageLayout>
  );
}
```

> `formatDateTime` 可放在 `shared/lib/date` 或 Feature 内部 util。
> 依赖：需要从 `react-native-safe-area-context` 导入 `useSafeAreaInsets`，从 `react-native` 导入 `Dimensions`，并引入 `tabBar` 常量以计算底部留白。

## 9. 流程时序

1. 进入页面 → `useWordCollectionList` 初始化 → `queryFn` 返回 mock 数据。
2. `onSuccess` → `replaceItems` 更新 entity。
3. UI 自动读取最新 `items` → 渲染列表。
4. 用户下拉刷新 → 调用 `refetch()` → 重复步骤 2。
5. 错误时：实体保留旧数据并暴露 `error`，UI 提示可重试。

## 10. Mock 数据说明

- 随机单词来源可用固定词库或 `faker`（若项目允许额外依赖）。
- 每次刷新重新生成 1000 条，模拟真实网络响应。
- 通过 `Math.random()` 控制来源与进度分布，必要时可扩展更多字段（如词性、释义）。

## 11. 开发顺序建议

1. 新建 `word-collection` entity（types、store、hook）。
2. 实现 mock API（Feature 层 useQuery + TanStack Query）。
3. 编写 Feature hook & UI 列表组件。
4. 重构 `CollectionsPage`，调用 Feature 输出。
5. 为 Profile 的 “我的词汇本” 条目添加导航到新页面。
6. 本地验证：首次加载、刷新、滚动、空态/错误。
7. 记录日志（`log('collections', ...)`）并更新 Storybook/文档（若有）。

## 12. 后续扩展

- 支持分页与搜索（`useInfiniteQuery` + query params）。
- 将 `source` 扩展为更多维度（词书版本、导入来源等）。
- 列表项点击跳转到单词详情或触发 Modal。
- 缓存多个词书（store 使用 Map<collectionId, WordCollectionState>）。
- 接入真实 API 时去掉 mock 逻辑，只需替换 `queryFn`。

---

**现阶段交付**：在保持 UI 风格一致的前提下，搭建实体 → Feature → 页面完整路径，即使数据来自 mock，也能完整串通刷新、显示和日志链路，为后续接入真实服务端打下基础。

## TODO 列表

1. **实体层** *(完成：初始类型、store、hook、API 框架)*
   - [x] 新建 `src/entities/word-collection/model/types.ts` 定义 `WordItem`、`WordCollectionState`、`WordSource`。
   - [x] 实现 `src/entities/word-collection/model/store.ts`（Zustand store）及 actions。
   - [x] 提供 `src/entities/word-collection/hooks/useWordCollectionEntity.ts`（封装 selector + actions）。
   - [x] 在 Feature 层通过 TanStack Query 集成 mock 数据拉取逻辑。

2. **Feature 层** *(完成：列表 Feature 构建)*
   - [x] 创建 `src/features/word-collection-list/hooks/useWordCollectionList.ts`，组合实体与 API 逻辑。
   - [x] 开发 `src/features/word-collection-list/ui/WordCollectionList.tsx`（FlatList 包装、刷新、空态）。
   - [x] 编写 `src/features/word-collection-list/ui/WordListItem.tsx`（单词、来源、进度展示）。
   - [x] 导出 Feature 公共接口 `src/features/word-collection-list/index.ts`。

3. **页面层** *(完成：Collections 页面改造)*
   - [x] 重构 `src/pages/collections/ui/CollectionsPage.tsx`：组合 Header 卡片 + Feature 列表，接入 `useWordCollectionList`。
   - [x] 为 Header 卡片添加总词数、上次同步时间和手动刷新按钮。
   - [x] 更新 `src/pages/profile/ui/ProfilePage.tsx`，在 “我的词汇本” 条目导航到新的 Collections 页面。

4. **UI/主题** *(完成：风格微调与日志)*
   - [x] 封装进度条显示（单词项中使用 `ProgressBar` 展示）。
   - [x] 确保列表、按钮、字体颜色全部使用 `theme.colors` 与 `spacing`。
   - [x] 为列表项点击预留 `onPress` 接口，并记录日志 `log('collections', ...)`。

5. **Mock 数据与工具** *(完成：随机数据生成与刷新)*
   - [x] 在 API 层编写随机单词生成函数（当前集成在 mock fetch 中）。
   - [x] 确认下拉刷新逻辑正确更新 store（`replaceItems` + `lastSyncedAt` 由 Feature 触发）。
   - [x] 在实体层提供基本重置能力（`reset`）以支持测试。

6. **验证与文档** *(完成：检查与记录)*
   - [x] 手动测试首次加载、下拉刷新、滚动性能、错误/空态（待进一步补充自动化）。
   - [ ] 添加必要的单元/组件测试（如 store 行为、列表渲染）。
   - [x] 在 README 或内部文档记录使用说明（本文件已更新，可后续在主文档挂链）。

7. **排序控制实现** *(进行中：新增交互与逻辑)*
   - [x] 在 `useWordCollectionList` 内新增 `sort` 状态与 `setSort`。
   - [x] 定义 `WordCollectionSort` 枚举及 `comparators` 映射，生成 `sortedItems`。
   - [x] 更新返回值结构，区分 `items`（原始数据）与 `sortedItems`（渲染数据）。
   - [x] 在 `CollectionsPage` Header 中接入排序下拉菜单，调用 Feature 提供的接口。
   - [x] 调整列表渲染使用 `sortedItems`，确认统计/刷新逻辑保持正确。
   - [ ] 补充文档与测试计划，创建排序 comparator 的初始测试骨架（待实现）。
   - [x] 抽象共享 `NativePickerModal`，供其他下拉场景复用。
