# 视频滑动窗口与缓存窗口重构方案

## 背景

- 全屏播放页 (`VideoFullscreenPage`) 目前直接把 `player-pool` 的 `mainPoolQueue` 当作滑动窗口与缓存窗口。窗口固定为 13 条视频（点击视频 ±6 条）。
- 当屏幕向下扩展时，需要频繁依赖 `windowStartVideoId` 同步滚动位置；Feed 列表首项会因为裁剪而变化，`ScrollView` 位置经常被重新计算，引发可见的跳跃。
- 滑动窗口与缓存窗口耦合，导致“首条固定、向上无限滑、向下按需扩展”的交互难以实现。

## 重构目标

1. **滑动窗口 (Sliding Window)**  
   - 直接从 `feedStore.videoIds` 派生，不创建额外数据源。  
   - 起点固定为 0（首条视频），确保向上滑动永不越界；尾部根据 `currentIndex + 6` 动态扩展。  
   - 扩展时只调整 `windowEndIndex`，不影响缓存队列，真正做到“无限”滑动。

2. **缓存窗口 (Caching Window)**  
   - `mainPoolQueue` 始终维护固定数量的播放器实例（默认 13 个）。  
   - 缓存圈围绕当前播放索引构建（`currentIndex ± 6`），上/下滑时按“头出尾进”的方式滑动更新；available pool 负责提前换源。

3. **Feed 列表行为保持不变**  
   - `feedStore.videoIds` 依旧作为全信息列表；`maintainVisibleContentPosition` 继续依赖首项锚点。

## 状态规划

### 新增字段

| 字段 | 建议位置 | 含义 |
| --- | --- | --- |
| `enteredIndex: number` | `playerPoolStore` 或新的 feature store | 首次进入全屏时点击视频的 Feed 索引（滑动窗口起点） |
| `currentIndex: number` | 同上 | 当前播放视频的 Feed 索引 |
| `windowEndIndex: number` | 同上 | 滑动窗口尾端索引（`currentIndex + 6`，不超过 Feed 长度） |
| `windowVideoIds?: string[]` | 可选（也可动态派生） | `videoIds.slice(enteredIndex, windowEndIndex)` |

### 现有缓存状态

- `mainPoolQueue`: 缓存窗口（13 个播放器实例）。  
- `pendingLoads`: 缓存窗口内尚未完成换源的 videoId 集合。  
- `availableQueue`: 预加载缓冲池（4 个播放器实例）。

## 核心流程重写

### 1. 进入全屏

1. Feature (`VideoWindowManagement.enterFullscreenMode`) 获取点击视频在 Feed 列表中的索引 `clickedIndex`。  
2. 设置窗口状态：  
   - `enteredIndex = cacheWindow.start`（滑动窗口起点与缓存圈起点对齐）  
   - `currentIndex = clickedIndex`  
   - `windowEndIndex = Math.max(clickedIndex + 7, cacheWindow.end + 1)`（覆盖当前播放及缓冲区）  
3. 构建缓存圈：以 `currentIndex ± 6` 为目标范围复用/换源 13 条播放器实例，缺失项进入 `pendingLoads`。  
4. `loadPendingVideos()` 异步补齐 pending，available 队列加载完成后再滑动缓存圈。

### 2. `useFullscreenScrollWindow` 改造

| 现状 | 调整后 |
| --- | --- |
| 通过订阅 `mainPoolQueue` 直接得到 `windowVideoIds` | 使用 `feedVideoIds.slice(0, windowEndIndex)` 生成 `windowVideoIds`（起点固定），缓存 Map 来自 `mainPoolQueue` |
| `handleScroll` 更新 `currentVideoId` 并触发扩展 | `handleScroll` 计算全局 Feed 索引 → 更新 `currentIndex` → 滑动缓存圈（保持 ±6），并在接近尾部时扩展 `windowEndIndex` |
| 未命中缓存的视频无法渲染 | 未命中时渲染占位符；缓存圈换源完成后自动命中刷新 |
| `useLayoutEffect` 依赖 `windowStartVideoId` 调整滚动位置 | 直接依靠 `maintainVisibleContentPosition` 与固定起点，无需强制 `scrollTo` |

### 3. 缓存对齐 (`playerPoolManager.alignCacheWindow`)

| 步骤 | 说明 |
| --- | --- |
| 输入目标索引 | 由 `handleScroll` 计算的全局 Feed 索引 |
| 计算目标范围 | `targetStart = clamp(targetIndex - 6)`, `targetEnd = targetStart + 13 - 1`（根据 Feed 长度调整） |
| 向前滑动缓存圈 | 如果 `cachedStart > targetStart`，使用 available pool 换源新视频，插入队头并弹出队尾 |
| 向后滑动缓存圈 | 如果 `cachedEnd < targetEnd`，换源新视频插入队尾并弹出队头 |
| 更新状态 | 写回 `mainPoolQueue/availableQueue`，同步 `enteredIndex/currentIndex/windowEndIndex` |

### 4. Feed 列表保持全量

- `feedStore.videoIds` 继续 append。  
- `maintainWindowSize` 仅在超过上限时裁剪尾部（不要裁剪头部以免越界）。  
- `FeedList` 逻辑保持原状。

## 阶段性任务

1. **状态层**  
   - 增加 `enteredIndex/currentIndex/windowEndIndex` 及 setter / selector。  
   - 移除 `windowStartVideoId`、`updateWindowState`、`getWindowStartIndex`。  
2. **进入全屏**  
   - 改写 `enterFullscreenMode`：设置窗口索引 → 构建缓存窗口。  
   - 新增 `buildInitialCache(currentIndex)`，替代 `replaceMainQueueWithWindow`。  
3. **滚动 Hook**  
   - 使用新的滑动窗口数据源和缓存 Map。  
   - 删除基于 `windowStartVideoId` 的滚动矫正。  
4. **缓存扩展**  
   - 重写 `extendWindowNext/Prev`：以窗口尾部新增 videoId 列表为输入。  
   - 确保 `pendingLoads` 等逻辑只针对 13 条缓存窗口。  
5. **清理与验证**  
   - 删除旧字段、旧选择器与相关日志。  
   - 更新开发日志与 Debug 面板输出。  
   - `npm run type-check` + 手动测试上下滑动、扩展、退出重进。  

## 需删除或替换的冗余代码

| 文件 | 位置 | 说明 |
| --- | --- | --- |
| `src/pages/video-fullscreen/ui/VideoFullscreenPage.tsx` | `useLayoutEffect` (行 99-129) | 基于 `windowStartVideoId` 的滚动同步逻辑 |
| `src/entities/player-pool/model/store.ts` | `windowStartVideoId`、`updateWindowState`、`getWindowStartIndex` | 旧窗口标记与原子更新 |
| `src/entities/player-pool/model/manager.ts` | `replaceMainQueueWithWindow` 与相关调用 | 按整段窗口重建主池的旧方案 |
| 同上 | `windowStartVideoId` 相关日志与推算代码 | `enterFullscreenMode`、`extendWindowCore` 等 |
| `src/features/video-window-management/lib/video-operations.ts` | 旧的窗口操作封装 | 需要改写为新的 API |

## 风险 & 对策

| 风险 | 对策 |
| --- | --- |
| `windowVideoIds` 较长导致 ScrollView 渲染压力 | 保留占位符策略，必要时引入可见区虚拟化或分页 |
| 缓存窗口与滑动窗口不同步 | 扩展流程：先更新滑动窗口索引，再触发缓存扩展；DEV 环境增加断言与日志 |
| Feed 列表刷新或裁剪导致索引失效 | 监听 `feedVideoIds` 变动，窗口索引越界时重置全屏状态 |
| 多入口进入全屏 | 可扩展：进入前设置不同的 `enteredIndex` 即可复用同一机制 |

## 验证清单

- `npm run type-check`  
- 手动测试：  
  - 向上滑动几十条 → 起点保持不变，缓存命中正常。  
  - 向下滑动 → 每次扩展前都完成 4 条缓存加载，滚动不抖动。  
  - 快速切换全屏 → 状态复位正确。  
- DEV 日志：  
  - 输出 `enteredIndex/currentIndex/windowEndIndex`、缓存命中率、pending 数量。  
  - 监控扩展冷却是否如预期触发。  

## 后续优化

- 如滑动窗口超大，可考虑懒加载或分页渲染策略。  
- 当 Feed 尾部被裁剪时，及时调整 `windowEndIndex`，防止索引越界。  
- 在 Debug 面板中展示缓存充足度、pending 列表等，可快速定位预加载滞后问题。  
- 未来支持自定义入口 / 分享链接时，只需设定合适的 `enteredIndex` 即可复用完整流程。

---

# 附录：全屏滑动改用 FlatList 的方案

## 目标

- 将 `VideoFullscreenPage` 的滚动容器从 `ScrollView` 切换到 `FlatList`，利用其虚拟化能力（惰性挂载、可见区复用）提升性能与稳定性。  
- 保持现有滑动窗口/缓存窗口架构与扩展逻辑不变，只替换渲染层实现。

## 要点概览

| 项目 | 调整内容 |
| --- | --- |
| 数据源 | `FlatList.data = windowVideoIds`（滑动窗口派生数组） |
| 渲染 | `renderItem` 复用缓存命中/占位符逻辑，item 高度 = `itemHeight` |
| 引导滚动 | `flatListRef.current?.scrollToOffset` 替代 `scrollViewRef.scrollTo` |
| 事件 | `onScroll`、`onMomentumScrollEnd` 直接套用；可选改用 `onViewableItemsChanged` 更新 currentIndex |
| 分页 | 保留 `pagingEnabled`、`decelerationRate="fast"`、`scrollEnabled={!isLandscape}` |
| 计算偏移 | `getItemLayout` 返回 `{ length: itemHeight, offset: itemHeight * index, index }` |
| 初始化 | 仍通过 `InteractionManager.runAfterInteractions` + `requestAnimationFrame` 滚动到点击项 |
| 扩展逻辑 | `alignCacheWindow` 在 `handleScroll` 中按需调用，保持缓存圈围绕当前索引 |

## 实施步骤

1. **替换容器**
   - `useFullscreenScrollWindow` 中 `scrollViewRef` 改为 `flatListRef = useRef<FlatList<string>>(null)`。  
   - `VideoFullscreenPage` 将 `<ScrollView>` 改为 `<FlatList>`；补充 `renderItem`、`keyExtractor`、`getItemLayout`。

2. **事件迁移**
   - `onScroll={handleScroll}`、`onMomentumScrollEnd={handleMomentumScrollEnd}` 保持现有逻辑。  
   - 设置 `scrollEventThrottle={16 或 50}`。  
   - 若使用 `onViewableItemsChanged` 替代 `handleScroll`：  
     - 配置 `viewabilityConfig`（如 `itemVisiblePercentThreshold: 50`）。  
     - 在回调中根据 `viewableItems` 更新 `currentIndex`、触发窗口扩展。

3. **滚动控制**
   - 原有 `scrollViewRef.current?.scrollTo({ y })` → `flatListRef.current?.scrollToOffset({ offset, animated })`。  
   - 横竖屏切换或 `itemHeight` 改变时同样调用 `scrollToOffset`。

4. **虚拟化参数（可选）**
   - `initialNumToRender={3}`、`maxToRenderPerBatch={3}`、`windowSize={5}`，确保当前 ±1 块稳定渲染。  
   - `removeClippedSubviews` 默认为 true，保留即可。

5. **占位符策略**
   - 保留“缓存命中 → 播放器 / 未命中 → 占位符”的实现；`FlatList` 会负责卸载滑出视口的元素，相当于“真正虚拟化 + 轻量占位符”。

6. **日志 & Debug**
   - 更新调试输出和 ref 命名（`flatListRef`）。  
   - 验证 `maintainVisibleContentPosition` 兼容性：若需要保持首项锚点，可继续设置 `maintainVisibleContentPosition={{ minIndexForVisible: 0 }}`。

## 风险与验证

| 风险 | 检查点 |
| --- | --- |
| `FlatList + pagingEnabled` 动画体验 | 实机测试 iOS/Android，观察分页是否平滑 |
| `onViewableItemsChanged` 与 `onScroll` 重复触发 | 若两者并存需做好去重判断 |
| 滑动窗口较大时占位符过多 | 可结合 `initialNumToRender/windowSize` 控制，必要时实现延迟渲染 |

**验证流程**
1. `npm run type-check`。  
2. 手测上下滑动、横竖屏切换、向下扩展；观察首项是否稳定。  
3. 监控 `currentIndex`、缓存命中与 `alignCacheWindow` 调用时机是否符合预期。  
4. 退出全屏再进入，确认 `flatListRef` 的初始滚动仍然正确。

---

# TODO 清单（按步骤执行并勾选）

## 状态与窗口拆分
- [x] 新增 `enteredIndex/currentIndex/windowEndIndex` 状态及 setter
- [x] 移除 `windowStartVideoId/updateWindowState/getWindowStartIndex` 及相关调用
- [x] 更新 Debug/日志输出，反映新的窗口状态

## 进入全屏逻辑重写
- [x] 在 `enterFullscreenMode` 中设置窗口索引 (`enteredIndex/currentIndex/windowEndIndex`)
- [x] 替换 `replaceMainQueueWithWindow` → 新的缓存重建实现
- [x] 校验 `pendingLoads` 的初始化与 `loadPendingVideos` 触发

## 滚动 Hook (`useFullscreenScrollWindow`)
- [x] 使用 `feedVideoIds.slice(enteredIndex, windowEndIndex)` 作为 `windowVideoIds`
- [x] 依赖缓存 Map (`mainPoolQueue`) 区分命中/未命中渲染
- [x] 删除基于 `windowStartVideoId` 的 `useLayoutEffect` 滚动同步
- [x] 更新 `handleScroll`/`currentIndex` 写入逻辑，触发窗口扩展

## 缓存扩展 (`playerPoolManager`)
- [x] 实现 `alignCacheWindow`：统一管理缓存圈滑动
- [x] 确保缓存窗口始终维持 13 条（淘汰/复用逻辑正确）
- [x] 调整 `loadPendingVideos`，仅关注缓存窗口中的未换源项

## FlatList 渲染层重构
- [x] 将 ScrollView 替换为 `FlatList`
- [x] 确保 `renderItem`、`getItemLayout`、`scrollToOffset` 等 API 正常工作
- [x] 配置 `pagingEnabled`/`scrollEnabled`/`scrollEventThrottle`
- [ ] 评估是否采用 `onViewableItemsChanged` 替代自定义 `handleScroll`

## 测试与验证
- [x] 运行 `npm run type-check`
- [ ] 手动测试上下滑动、横竖屏切换、向下扩展
- [ ] 验证退出/重新进入全屏时窗口状态重置正常
- [ ] DEV 模式观察日志：窗口索引、缓存命中率、pending 数量
