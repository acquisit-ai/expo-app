# Graph Report - video-scroll  (2026-04-17)

## Corpus Check
- Corpus is ~2,873 words - fits in a single context window. You may not need a graph.

## Summary
- 29 nodes · 49 edges · 6 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.83)
- Token cost: 6,707 input · 3,300 output

## Community Hubs (Navigation)
- [[_COMMUNITY_PlayerPoolManager acquirePlayer|PlayerPoolManager acquirePlayer]]
- [[_COMMUNITY_MetaId based video identity ScrollView|MetaId based video identity ScrollView]]
- [[_COMMUNITY_components expo video|components expo video]]
- [[_COMMUNITY_Player Pool Manager Video load|Player Pool Manager Video load]]
- [[_COMMUNITY_reducers videoWindowReducer|reducers videoWindowReducer]]
- [[_COMMUNITY_data|data]]

## God Nodes (most connected - your core abstractions)
1. `PlayerPoolManager` - 7 edges
2. `acquirePlayerFromPool()` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Hyperedges (group relationships)
- **video_scroll_surface** — video-scroll/components/VideoPlayer.tsx, video-scroll/components/StatusPanel.tsx, video-scroll/data/videos.ts, video-scroll/pages/VideoFeedPage.tsx, video-scroll/reducers/videoWindowReducer.ts, video-scroll/utils/playerPool.ts [INFERRED 0.70]
- **feed_runtime_pipeline** — video-scroll/data/videos.ts, video-scroll/utils/playerPool.ts, video-scroll/reducers/videoWindowReducer.ts, video-scroll/pages/VideoFeedPage.tsx, video-scroll/components/VideoPlayer.tsx, video-scroll/components/StatusPanel.tsx [INFERRED 0.70]
- **player_pool_and_windowing** — video-scroll/utils/playerPool.ts, video-scroll/reducers/videoWindowReducer.ts, Player Pool Manager, Sliding window feed, MetaId-based video identity [INFERRED 0.70]

## Communities

### Community 0 - "PlayerPoolManager acquirePlayer"
Cohesion: 0.25
Nodes (2): PlayerPoolManager, acquirePlayerFromPool()

### Community 1 - "MetaId based video identity ScrollView"
Cohesion: 0.62
Nodes (3): MetaId-based video identity, ScrollView paging video feed, Sliding window feed

### Community 2 - "components expo video"
Cohesion: 0.6
Nodes (2): expo-video, react-native

### Community 3 - "Player Pool Manager Video load"
Cohesion: 0.6
Nodes (3): Player Pool Manager, Video load status tracking, expo

### Community 4 - "reducers videoWindowReducer"
Cohesion: 1.0
Nodes (0): 

### Community 5 - "data"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `reducers videoWindowReducer`** (2 nodes): `videoWindowReducer.ts`, `videoWindowReducer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `data`** (1 nodes): `videos.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `acquirePlayerFromPool()` connect `PlayerPoolManager acquirePlayer` to `components expo video`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._