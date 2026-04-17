后端无状态,只获得请求数量和 jwt,永远一定有更多,无需分页
⸻

🎬 视频 Feed 列表设计方案

1. 需求说明

目标：构建一个 视频软件的推荐 Feed 流，满足以下要求： 1. 分页加载
• 每次请求 10 条视频（调用后端 API）。
• 初次进入时拉取 10 条。
• 下滑到接近底部时自动加载更多。 2. 滑动窗口
• Feed entity 管理列表，最多保留 500 条记录。
• 当新数据追加超过 500 条时，自动丢弃顶部的最旧数据。 3. 当前播放状态
• 根据用户滑动位置，FlatList 实时计算「屏幕显示的第一个视频卡片」作为当前卡片。
• FeedVideoCard UI 组件已存在，列表负责传入正确的 videoMetadata 并决定哪个在播放。 4. 请求认证
• 请求后端时带上 JWT Token。

⸻

2. 技术栈 & 框架设计

基础
• 状态管理：Zustand
• UI 渲染：FlatList（虚拟化 + 性能优化）
• 架构模式：FSD (Feature-Sliced Design)

模块划分

1. Entity: feed
   • 由 Zustand 管理视频队列。
   • 数据特征：头部出、尾部入（队列形式）。
   • 存储状态：feed[]、isLoading、currentFeedIndex。
   • 提供方法：
   • initFeed()
   • loadMore()
   • setCurrentFeedIndex()

2. Feature: feed-fetching
   • 封装 API 调用逻辑。现在没有实际后端,所以留个模板代码
   • 加载数据并存储到 entity,负责「追加新数据」,然后调用 entity 保存, entity 自动删除最前的来维护 50 的上限.
   • 请求时自动携带 JWT。

3. Feature: feed-list（UI 层逻辑）
   • 渲染 FlatList + FeedVideoCard。
   • 监听 onViewableItemsChanged → 更新当前播放 index。
   • 触发 feed-fetching 方法，订阅并更新 entity 状态。

示例代码：

const onViewableItemsChanged = useRef(({ viewableItems }) => {
if (viewableItems.length > 0) {
setCurrentFeedIndex(viewableItems[0].index ?? 0);
}
}).current;

4. Page: FeedPage
   • 负责组合 feature：
   • 初始化 feed（调用 initFeed）。
   • 传递 onEndReached → loadMore。
   • 渲染 feed-list。
   • 作用：防止 feature 之间直接互相调用。

⸻

3. 数据模型设计

已存在

type VideoMetadata = {
readonly meta: {
id: string;
title: string;
description: string;
video_url: string;
tags: string[];
duration?: number;
};
};

需要创建

type FeedStore = {
feed: VideoMetadata[];
isLoading: boolean;
currentFeedIndex: number;
initFeed: () => Promise<void>;
loadMore: () => Promise<void>;
setCurrentFeedIndex: (index: number) => void;
};

⸻

4. 数据流示例
   1. 进入页面
      • 调用 initFeed()。
      • 拉取 10 条 → feed = [10]。
   2. 滚动列表
      • onViewableItemsChanged 触发 → setCurrentFeedIndex(idx)。
      • UI 根据 currentFeedIndex 只播放当前视频。
   3. 滑到底部
      • onEndReached 触发 → 调用 loadMore()。配合属性：onEndReachedThreshold 决定「距离底部多少比例时触发」=1 → 滑到距离底部剩 100% 屏幕高度时触发
      • 拉取 10 条 → feed = [20]。
      • 超过 500 条时 → 自动裁剪掉前 10 条。
   4. 无限下滑
      • 用户可以一直下拉，列表始终平滑显示最新 500 条。

⸻

5. 优点
   • 简单清晰：只维护一个全局 feed 队列。
   • 稳定性能：最多 500 条，避免内存爆炸。
   • 流畅体验：FlatList + 虚拟化，不卡顿。
   • 精准播放控制：依赖 currentFeedIndex，保证始终有一个视频在播放。
   • 安全性：所有请求统一带上 JWT Token。

⸻

6. 未来优化(暂时不做)

   - loadMore() 时如果失败，可以决定是否重试或维持旧列表。

   - 幂等性 / 重复请求保护.当用户快速滑动到底部时，可能会触发多次 onEndReached。loadMore 里加保护 if (get().isLoading) return;
   - ✅ 已优化：分离可见项跟踪和播放切换逻辑。onViewableItemsChanged 仅跟踪可见项，onMomentumScrollEnd 时才切换播放，避免快速滑动时频繁切换。
