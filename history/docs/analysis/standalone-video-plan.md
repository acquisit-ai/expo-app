# 独立单视频播放页面方案（初稿）

> 场景：收藏（Favorites）及历史（History）列表点击后进入的「单视频播放」体验，复用现有 Detail/Fullscreen UI，但不依赖播放器缓存池。

---

## 1. 目标与约束
- **独立播放器实例**：进入页面前直接通过 `expo-video` 创建播放器，不触发 `playerPoolManager`。
- **完全复用既有 UI**：Detail 页面、全屏页面、字幕、控制层、横竖屏切换沿用现有组件。
- **状态一致性**：仍使用 `video` entity 作为单一来源，只是手动写入 `currentPlayerMeta`。
- **生命周期完善**：进入时创建、退出时销毁实例，避免泄漏或污染 Feed 模式。
- **导航解耦**：收藏/历史调用全新的入口，不影响 Feed → VideoStack 的现有流程。

---

## 2. 现状梳理

| 模块 | 当前行为 | 与需求冲突点 |
| --- | --- | --- |
| `useVideoNavigation` | 使用缓存池获取实例并导航到 `VideoStack` | standalone 模式需跳过池操作 |
| `VideoFullscreenPage` | 依赖 `playerPoolStore.mainPoolQueue` 渲染上下滑动窗口 | 独立播放只有单个视频，需禁用窗口逻辑 |
| `playerPoolManager` | 负责窗口计算、预加载、窗口扩展 | 不参与 standalone 流程 |
| `video` entity | 保存 `currentPlayerMeta`、控制播放状态 | 可复用，但需新增 `playbackContext` 区分模式 |
| 收藏 & 历史入口 | 当前点击 → 进入 `SavedFeedScreen`（Feed-like 列表） | 需扩展为：进入 standalone Detail 页面 |

---

## 3. 架构方案概览

1. **新增 Feature：`features/standalone-video`**
   - `enterStandaloneVideo(videoId: string)`：校验 `VideoMeta` → 创建播放器 → 写入 `videoStore` → 导航到 standalone 栈。
   - `exitStandaloneVideo()`：暂停 + 释放播放器 → 清理 `videoStore` 元数据。
   - 辅助选择器/Hook：提供 `useStandaloneVideoContext()` 读取当前模式。

2. **扩展 `video` entity**
   - 状态新增 `playbackContext: 'pool' | 'standalone' | null`。
   - `setCurrentPlayerMeta` 时同步标记上下文；`clearCurrentVideo` 重置。

3. **导航栈设计**
   - RootStack 增加 `StandaloneVideoStack`：
     - `StandaloneVideoDetail`
     - `StandaloneVideoFullscreen`
   - 收藏/历史页面点击时调用 `enterStandaloneVideo` → `navigation.navigate('StandaloneVideoStack', …)`。

4. **Detail 页面复用**
   - 新建 `pages/standalone-video/StandaloneVideoDetailPage.tsx`：
     - 组合现有 Detail widgets（词汇信息、收藏按钮等）。
     - 播放器区域使用与 Feed Detail 相同组件，只是 `onToggleFullscreen` 走 standalone 路由。

5. **Fullscreen 页面复用**
   - 在 `VideoFullscreenPage` 中注入模式判断：
     - `pool`：沿用 `useFullscreenScrollWindow`（上下滑动）。
     - `standalone`：新的 `useStandaloneFullscreenWindow`，返回固定 `windowVideoIds=[videoId]`，禁用 ScrollView 滑动/窗口扩展。
   - 两种模式共享 `FullscreenVideoPlayerSection`，保持控制层/字幕一致。

6. **资源生命周期**
   - `enterStandaloneVideo` 内部流程：
     1. 从收藏/历史实体获取 `VideoMeta`。
     2. `const player = createVideoPlayer(null)` → `await player.replaceAsync({ uri, contentType: 'hls' })`。
     3. 更新 `videoStore.setCurrentPlayerMeta`（含 `playbackContext: 'standalone'`）。
     4. 记录 player 引用（feature 内部 `WeakMap` 或局部持有）。
   - `exitStandaloneVideo`：
     1. 获取当前 `currentPlayerMeta?.playerInstance`。
     2. `pause()` → `replaceAsync(null)` → `release()`。
     3. 调用 `clearCurrentVideo()`。
   - 在 Detail & Fullscreen 页面 `useEffect` 中监听 navigation `blur` / `beforeRemove`，确保异常退出时也释放。

---

## 4. 数据流与调用链

```
Favorites/History item press
  └─ enterStandaloneVideo(videoId)
       ├─ resolve VideoMeta（必需：video_url）
       ├─ createVideoPlayer + replaceAsync(source)
       ├─ videoStore.setCurrentPlayerMeta({ videoId, playerInstance, context: 'standalone' })
       └─ navigation.navigate('StandaloneVideoStack', { screen: 'StandaloneVideoDetail' })

StandaloneVideoDetail
  ├─ 读取 videoStore.currentPlayerMeta（单个实例）
  ├─ 共用播放器 widget（与现有 Detail 相同）
  └─ onToggleFullscreen → navigation.navigate('StandaloneVideoFullscreen')

StandaloneVideoFullscreen
  ├─ 判断 playbackContext === 'standalone'
  ├─ useStandaloneFullscreenWindow() → { videoIds: [videoId], playerMeta map }
  ├─ 渲染 FullscreenVideoPlayerSection（autoPlay=true）
  └─ onExitFullscreen → navigation.replace('StandaloneVideoDetail')

离开 Standalone 栈
  └─ exitStandaloneVideo()（暂停+release+清理 store）
```

---

## 5. 组件与 Hook 调整

### 5.1 `video` entity
- `state.playbackContext`；选择器 `selectPlaybackContext`。
- `setCurrentPlayerMeta(meta, context)`：参数增加 context。
- `clearCurrentVideo()`：重置 context = null。

### 5.2 `VideoFullscreenPage`
- 提炼 `const playbackContext = useVideoStore(selectPlaybackContext)`。
- `if (playbackContext === 'standalone')` → 使用新 Hook：

```ts
const { playerMetaMap, currentVideoId } = useStandaloneFullscreenWindow();
// 返回: windowVideoIds=[currentVideoId], isLandscape 处理保持原有逻辑
```

- ScrollView：
  - standalone 模式下可直接渲染单个 View（无 ScrollView）或禁用滚动。
  - 选择方案 B：保留 ScrollView，但 `pagingEnabled=false`、`scrollEnabled=false`，content 只有一个子项。

### 5.3 新 Hook：`useStandaloneFullscreenWindow`
- 输入：`isLandscape`（用于决定是否允许横屏全屏单视频）。
- 输出：
  - `windowVideoIds: [videoId]`
  - `allPlayerMetas: Map(videoId → meta)`
  - `currentIndex: 0`
  - `handleScroll / handleMomentumScrollEnd` 均为空函数。
  - `itemHeight` 直接取窗口高度。
  - `isInitialMount=false`（无需懒加载逻辑）。

### 5.4 Standalone Detail 页面
- 读取 `currentPlayerMeta` → 传递给播放器 widget（复用 `SmallVideoPlayerSection`）。
- 其他布局沿用 Video Detail（词汇解释、互动区域），必要时抽取共用 `VideoDetailContent` 以避免重复。
- 顶部 header 提供返回按钮，返回时触发 `exitStandaloneVideo`。

### 5.5 Standalone Fullscreen 页面
- 基于现有 Screen，新增一个轻量包装：
  - `StandaloneVideoFullscreenScreen` 复用 `VideoFullscreenPage`，只需通过 navigation param 或全局 store 标记模式。
  - `useVideoFullscreenLogic` 中对 `backToFeed` 的逻辑：在 standalone 模式下 `parent.goBack()` 即可，不涉及 MainTabs。

---

## 6. 收藏/历史入口调整

1. `SavedFeedList`（或对应 widget）中的 `onPress` 改为调用 `enterStandaloneVideo(videoId)`。
2. 异常情况（VideoMeta 缺失、URL 缺失）→ toast 提示并不导航。
3. 保留原来的“无效点击”占位逻辑，后端接通后只需把 `VideoMeta` 填充完整即可。

---

## 7. 风险与对策

| 风险 | 对策 |
| --- | --- |
| 与现有池模式交叉使用时状态污染 | `playbackContext` 明确区分；进入 Feed 时 `useVideoNavigation` 始终设置 `'pool'` |
| 播放器实例遗留（内存泄漏） | 在 Feature 内集中管理释放；Detail/Fullscreen `useEffect` + navigation 监听 |
| 全屏 Hook 分叉导致逻辑重复 | 将公共逻辑封装在共享函数，standalone 仅替换数据来源 |
| 收藏/历史数据不包含完整 Meta | 进入前校验 `video_url`，缺失时 toast 提示「暂无可播放资源」 |
| Subtitles、控制层依赖当前 VideoId | `currentPlayerMeta` 仍提供 videoId，确保自动加载字幕与交互状态正常工作 |

---

## 8. 验证清单

- [ ] 收藏列表点击后进入 Detail，视频正常播放，返回释放资源。  
- [ ] Detail → 全屏 → 返回 Detail，画面与控制层正常。  
- [ ] 横屏旋转 & 全屏手势在 standalone 模式下工作、不会触发布局异常。  
- [ ] 与 Feed 流程交替切换，全屏上下滑动仍可用，且池状态正常。  
- [ ] 收藏/历史同时快速打开多个视频，实例均被正确销毁。  
- [ ] 错误场景（无 URL）提示友好且不会崩溃。

---

## 9. TODO 列表

- [x] 新增 `features/standalone-video`（enter/exit + Hook）。  
- [x] 扩展 `video` entity：添加 `playbackContext` 与相关选择器。  
- [x] 新增 `StandaloneVideoStack` 导航及两页面壳组件。  
- [x] 抽取/复用 Detail UI，创建 `StandaloneVideoDetailPage`。  
- [x] 实现 `useStandaloneFullscreenWindow` 并在 `VideoFullscreenPage` 分支调用。  
- [x] 更新 `useVideoFullscreenLogic`，根据 context 区分返回逻辑。  
- [x] 收藏/历史按钮接入 standalone 入口（保留 toast 错误处理）。  
- [x] 编写释放逻辑与导航 `beforeRemove` 监听，确保播放器销毁。  
- [x] 处理字幕加载失败时清空激活字幕，避免显示旧内容。  
- [x] 同步收藏/历史 mock 视频 ID 以兼容字幕映射。  
- [x] 历史记录 mock 根据观看进度动态生成并分页返回。  
- [ ] 手动 QA：点击流程、全屏切换、横竖屏、返回场景、与 Feed 容错。  
- [x] 运行 `npm run type-check` 并记录结果。
- [x] 调整收藏/历史入口默认进入全屏，保留 Detail 作为回退。

---

## 10. 执行进度

| 步骤 | 内容 | 状态 | 备注 |
| --- | --- | --- | --- |
| 1 | 更新方案文档，建立执行日志与步骤 | ✅ | 2025-11-05 建立执行进度表 |
| 2 | 实现 standalone 视频 Feature 与 store 扩展 | ✅ | 已落地 feature、扩展 video store 与 selectors |
| 3 | 集成导航/页面并接入收藏与历史入口 | ✅ | 已完成导航整合、页面复用与入口逻辑 |
| 4 | QA 与类型检查 | 🔄 | `npm run type-check` ✅；待完成手动 QA（待验证默认全屏流程） |
