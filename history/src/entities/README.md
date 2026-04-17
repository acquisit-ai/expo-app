# Entities Layer Documentation

*Comprehensive documentation of the business domain entities layer in the Feature-Sliced Design (FSD) architecture.*

## Overview

**实体层定位**: Entity层是Feature-Sliced Design架构的核心业务域层，负责管理应用的核心业务数据和状态。每个entity代表一个独立的业务领域模型，提供纯数据管理接口，不包含UI逻辑或业务流程。

**Entity数量**: 7个核心实体

**架构原则**:
- **单一数据源 (SSOT)**: 每个业务数据有且仅有一个管理者
- **零依赖设计**: Entity层不依赖其他层级，保持完全独立
- **Zustand状态管理**: 统一使用Zustand实现轻量级状态管理
- **类型安全**: 100% TypeScript覆盖，完整的类型定义

## Entity架构设计

### 核心设计原则

**数据职责单一**: Entity只负责数据的存储、查询和更新，不处理业务逻辑（由Feature层实现）或UI渲染（由Widget/Page层实现）。

**状态机模式**: 复杂entity（如video、player-pool）采用状态机模式管理状态转换，确保状态一致性。

**性能优化策略**:
- Map数据结构替代Object，提升查找性能
- 细粒度selector减少不必要的重渲染
- 条件订阅机制（video entity v5.0）优化多实例场景
- LRU缓存策略（player-pool、subtitle）管理内存占用

### 依赖方向规则

```
Pages/Widgets → Features → Entities
                    ↓
                  Shared
```

**正确模式**:
```typescript
// ✅ Feature层使用Entity
import { useVideoStore } from '@/entities/video';

// ✅ Widget层使用Entity
import { useFeedStore } from '@/entities/feed';
```

**禁止模式**:
```typescript
// ❌ Entity层不能依赖Feature
import { ... } from '@/features/...';

// ❌ Entity层不能依赖Widget
import { ... } from '@/widgets/...';
```

## 实现的实体 (7个)

### ✅ Player Pool Entity (`player-pool/`) - **[完整文档](/src/entities/player-pool/CONTEXT.md)**

**版本**: v5.0.0 (VideoId-Based Architecture)

**位置**: `src/entities/player-pool/`

**职责**: 管理17个视频播放器实例（13主池+4available池），实现LRU缓存策略和双模式管理，支持Feed List流式预加载和Fullscreen窗口批量替换。

**核心架构**:
- **双池双模式**: 主池（13实例，LRU缓存）+ Available池（4实例，预加载专用）
- **VideoId-Based状态**: 完全基于videoId管理，Feed裁剪完全免疫
- **动态索引计算**: 所有索引通过videoId实时计算，无存储索引
- **窗口扩展功能**: extendWindowNext/Prev支持动态窗口滑动

**关键文件**:
```
src/entities/player-pool/
├── model/
│   ├── PlayerPoolManager.ts  # 核心管理器，双池逻辑
│   ├── PreloadScheduler.ts   # 三层预加载调度器
│   └── types.ts              # 类型定义
├── hooks/
│   └── usePlayerPool.ts      # Hook接口
└── CONTEXT.md               # v5.0架构文档
```

**关键特性**:
- **Feed裁剪免疫**: windowStartVideoId存储，动态indexOf查找
- **O(1) LRU操作**: Map数据结构，所有操作O(1)时间复杂度
- **双模式隔离**: Feed List和Fullscreen模式完全独立
- **O(1)任务取消**: PreloadScheduler取消操作无性能开销

**性能指标**:
- Fullscreen模式缓存命中率: ~95%
- Map同步更新: ~4ms
- 13并发加载: ~500ms (vs 单池2000ms)
- 内存占用: 固定85MB上限

**集成示例**:
```typescript
// 进入全屏模式（v5.0 API）
playerPoolManager.enterFullscreenMode(videoId);

// 获取播放器实例
const player = await playerPoolManager.acquire(videoId);

// 窗口扩展
playerPoolManager.extendWindowNext(); // 向后扩展4个
playerPoolManager.extendWindowPrev(); // 向前扩展4个
```

---

### ✅ Video Entity (`video/`) - **[完整文档](/src/entities/video/CONTEXT.md)**

**版本**: v5.0.0 (条件订阅架构)

**位置**: `src/entities/video/`

**职责**: 管理当前播放会话的视频状态，提供播放器指针管理和事件驱动状态同步，支持条件订阅优化多视频场景性能。

**核心架构**:
- **单一指针架构**: currentPlayerMeta绑定videoId和playerInstance
- **条件订阅机制**: useConditionalVideoPlayer支持enabled参数
- **事件驱动同步**: usePlayerEventSync自动监听播放器事件
- **细粒度订阅**: 每个字段独立selector，减少重渲染

**状态结构**:
```typescript
interface VideoEntityState {
  currentPlayerMeta: PlayerMeta | null;  // 播放器指针
  playback: {
    currentTime: number;      // 当前播放时间
    bufferedTime: number;     // 已缓冲时间
  };
}
```

**关键文件**:
```
src/entities/video/
├── model/
│   ├── store.ts           # Zustand Store
│   ├── types.ts           # 类型定义
│   └── selectors.ts       # 细粒度selectors
├── hooks/
│   ├── useVideoPlayer.ts           # 统一播放器接口
│   ├── useConditionalVideoPlayer.ts # 条件订阅hooks
│   ├── useVideoDataLogic.ts        # Player Pool集成
│   ├── useVideoEntitySync.ts       # 事件同步
│   └── videoview-sync/             # 同步辅助模块
└── CONTEXT.md            # v5.0架构文档
```

**关键特性 (v5.0)**:
- **条件订阅**: enabled=false时零订阅开销，多视频场景性能提升99%
- **Store精简**: 移除session状态，职责更清晰
- **Widget层判断**: isActiveVideo由Widget层判断传入
- **useSyncExternalStore**: 保证并发安全的订阅机制

**性能优化**:
```typescript
// 条件订阅API
const currentTime = useConditionalCurrentTime(isActiveVideo);
const bufferedTime = useConditionalBufferedTime(isActiveVideo);
const duration = useConditionalDuration(isActiveVideo);

// 组合Hook
const { currentTime, bufferedTime, duration } =
  useConditionalVideoPlayer(isActiveVideo);
```

**集成示例**:
```typescript
// Widget层判断活跃视频
const currentVideoId = useVideoStore(selectCurrentVideoId);
const isActiveVideo = videoId === currentVideoId;

// Feature层条件订阅
const currentTime = useConditionalCurrentTime(isActiveVideo);

// 播放控制
import { playVideo, seekVideo } from '@/shared/lib/player-controls';
playVideo(playerInstance);
seekVideo(playerInstance, 10);
```

---

### ✅ Subtitle Entity (`subtitle/`) - **[完整文档](/src/entities/subtitle/CONTEXT.md)**

**版本**: v2.0 (时间单位统一架构)

**位置**: `src/entities/subtitle/`

**职责**: 管理字幕数据存储和高性能搜索引擎，提供O(1)顺序播放和O(log n)随机跳转性能。

**核心架构**:
- **时间单位统一**: 所有时间数据统一使用秒（与视频播放器原生一致）
- **扁平化数据模型**: 移除段落层级，维护扁平sentences数组
- **指针优化搜索**: currentIndex指针+智能三层搜索算法
- **防抖更新机制**: 60fps限制避免高频状态更新

**数据结构**:
```typescript
interface SubtitleJson {
  language: string;
  total_sentences: number;
  sentences: Sentence[];  // 扁平化，连续编号
}

interface Sentence {
  index: number;        // 全局编号0,1,2,3...
  start: number;        // 开始时间（秒）
  end: number;          // 结束时间（秒）
  text: string;
  tokens: SubtitleToken[];
}
```

**关键文件**:
```
src/entities/subtitle/
├── model/
│   ├── store.ts              # Zustand Store (Map结构)
│   ├── types.ts              # 类型定义（秒单位）
│   └── SubtitleSearchEngine.ts # 高性能搜索引擎
├── hooks/
│   ├── useSubtitleEntity.ts  # 主要实体接口
│   ├── useSubtitleSearch.ts  # 搜索接口
│   └── useSubtitleSync.ts    # 时间同步接口
└── CONTEXT.md               # v2.0架构文档
```

**关键特性**:
- **智能三层搜索**: O(1)当前位置→O(1-5)双向线性→O(log n)二分
- **零转换开销**: 统一秒单位消除时间转换（每字幕节省2N次乘法）
- **连续编号保证**: sentences[i].index === i，O(1)随机访问
- **异步索引更新**: setTimeout(0)避免渲染阻塞

**性能指标**:
- 90%场景O(1)性能（顺序播放）
- 快进快退O(1-5)性能（双向搜索最大5步）
- 随机跳转O(log n)性能（二分兜底）
- 60fps防抖更新（16ms间隔）

**集成示例**:
```typescript
// 时间同步查询
const { getSentenceAtTime } = useSubtitleSync();
const sentence = getSentenceAtTime(currentTime); // 秒单位

// 导航辅助
const nextSentence = getNextSentence();
const prevSentence = getPreviousSentence();
```

---

### ✅ Feed Entity (`feed/`)

**位置**: `src/entities/feed/`

**职责**: 管理视频Feed流的状态，维护50条视频ID滑动窗口，提供加载状态和播放状态管理。

**核心架构**:
- **videoId数组**: 只存储videoId，VideoMetaData由video-meta entity管理（SSOT原则）
- **滑动窗口**: 最大50条限制，自动维护窗口大小
- **加载状态管理**: 区分initial/refresh/loadMore三种加载类型
- **播放状态追踪**: currentFeedIndex和visibleIndexes管理

**状态结构**:
```typescript
interface FeedStore {
  videoIds: string[];  // 最多50条

  loading: {
    isLoading: boolean;
    error: string | null;
    loadingType: 'initial' | 'refresh' | 'loadMore' | null;
  };

  playback: {
    currentFeedIndex: number;
    visibleIndexes: number[];
  };
}
```

**关键文件**:
```
src/entities/feed/
├── model/
│   ├── store.ts       # Zustand Store
│   ├── types.ts       # 类型定义
│   └── selectors.ts   # Selectors
└── hooks/
    ├── useFeedActions.ts        # Actions Hook
    ├── useFeedLoading.ts        # 加载状态Hook
    └── useCurrentVideoInfo.ts   # 当前视频信息Hook
```

**关键特性**:
- **SSOT遵循**: 不存储VideoMetaData，只存储ID引用
- **窗口维护**: maintainWindowSize()自动裁剪超过50条的数据
- **状态分离**: 加载状态和播放状态独立管理
- **快速访问**: getCurrentVideoId() O(1)获取当前视频ID

**集成示例**:
```typescript
// 添加视频ID
appendVideoIds(['video1', 'video2', 'video3']);

// 维护窗口大小
maintainWindowSize(); // 自动裁剪到50条

// 获取当前视频
const videoId = getCurrentVideoId();
const videoMeta = useVideoMetaStore(state => state.getVideo(videoId));
```

---

### ✅ Video Meta Entity (`video-meta/`)

**位置**: `src/entities/video-meta/`

**职责**: VideoMetaData的单一数据源（SSOT），管理所有视频元数据的缓存和CRUD操作。

**核心架构**:
- **Map缓存结构**: Map<videoId, VideoMetaData>，O(1)查找性能
- **SSOT原则**: 项目中所有VideoMetaData统一从此entity获取
- **纯内存缓存**: 暂不实现LRU淘汰或持久化（未来可扩展）
- **批量操作支持**: addVideos批量添加，updateVideo部分更新

**状态结构**:
```typescript
interface VideoMetaStore {
  videos: Map<string, VideoMetaData>;

  addVideo: (video: VideoMetaData) => void;
  addVideos: (videos: VideoMetaData[]) => void;
  updateVideo: (videoId: string, updates: Partial<VideoMetaData>) => void;
  getVideo: (videoId: string) => VideoMetaData | null;
  hasVideo: (videoId: string) => boolean;
}
```

**关键文件**:
```
src/entities/video-meta/
├── model/
│   ├── store.ts       # Zustand Store (Map结构)
│   ├── types.ts       # 类型定义
│   └── selectors.ts   # Selectors
└── hooks/
    └── useVideoMetaActions.ts  # Actions Hook
```

**关键特性**:
- **O(1)查找**: Map结构保证常数时间查找
- **部分更新**: updateVideo支持Partial<VideoMetaData>
- **批量添加**: addVideos一次性添加多个视频
- **简单API**: 无复杂业务逻辑，纯CRUD操作

**集成示例**:
```typescript
// 添加视频元数据
addVideo(videoMetaData);

// 批量添加
addVideos([video1, video2, video3]);

// 更新元数据（如点赞）
updateVideo(videoId, { isLiked: true, likeCount: likeCount + 1 });

// 获取元数据
const video = getVideo(videoId);
```

---

### ✅ User Entity (`user/`)

**位置**: `src/entities/user/`

**职责**: 管理用户会话状态，提供Supabase Session的内存缓存和派生数据快速访问。

**核心架构**:
- **Session缓存**: Supabase Session的内存缓存（持久化由Supabase SDK处理）
- **派生数据**: 从Session解析出user/userId/email等便捷字段
- **令牌管理**: accessToken/refreshToken和过期时间管理
- **事件驱动同步**: useSupabaseAuthSync监听Supabase事件自动更新

**状态结构**:
```typescript
interface UserStore {
  // 核心数据
  session: Session | null;
  user: User | null;
  userId: string | null;
  email: string | null;

  // 认证状态
  isAuthenticated: boolean;
  hasPassword: boolean;
  provider: string | null;

  // 令牌管理
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;

  // 操作方法
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  refreshSession: () => Promise<void>;
  isTokenValid: () => boolean;
}
```

**关键文件**:
```
src/entities/user/
├── model/
│   ├── store.ts    # Zustand Store
│   └── types.ts    # 类型定义
└── hooks/
    └── selectors.ts  # 细粒度选择器Hooks
```

**关键特性**:
- **Supabase集成**: 监听SIGNED_IN/SIGNED_OUT/TOKEN_REFRESHED事件
- **细粒度选择器**: useUserId/useUserEmail等独立Hook
- **令牌有效性检查**: isTokenValid()检查过期时间
- **组合选择器**: useAuthStatus/useUserProfile等便捷Hook

**集成示例**:
```typescript
// 使用细粒度选择器
const userId = useUserId();
const email = useUserEmail();
const isAuthenticated = useIsAuthenticated();

// 组合选择器
const { isAuthenticated, hasPassword, provider } = useAuthStatus();

// 令牌检查
const isValid = store.isTokenValid();
```

---

### ✅ Global Settings Entity (`global-settings/`)

**位置**: `src/entities/global-settings/`

**职责**: 管理应用级全局设置，包括播放器实例配置（playbackRate/isMuted）和UI显示设置（showSubtitles/showTranslation）。

**核心架构**:
- **两类设置**: PlayerInstance配置（应用到播放器）+ UI显示设置（仅影响渲染）
- **默认值管理**: DEFAULT_PLAYER_INSTANCE_SETTINGS/DEFAULT_UI_DISPLAY_SETTINGS
- **部分更新支持**: updatePlayerInstanceSettings/updateUIDisplaySettings
- **重置功能**: resetToDefaults恢复默认配置

**状态结构**:
```typescript
interface GlobalSettingsStore {
  playerInstance: {
    playbackRate: number;                            // 播放速率
    isMuted: boolean;                                // 静音状态
    staysActiveInBackground: boolean;                // 后台播放
    startsPictureInPictureAutomatically: boolean;    // 自动画中画
  };

  uiDisplay: {
    showSubtitles: boolean;      // 显示字幕
    showTranslation: boolean;    // 显示翻译
  };
}
```

**关键文件**:
```
src/entities/global-settings/
├── model/
│   ├── store.ts       # Zustand Store
│   ├── types.ts       # 类型定义
│   ├── selectors.ts   # Selectors
│   └── defaults.ts    # 默认值配置
└── index.ts          # 统一导出
```

**关键特性**:
- **设置分类**: 播放器配置和UI配置独立管理
- **细粒度选择器**: selectPlaybackRate/selectIsMuted等独立selector
- **默认值**: 统一默认配置，支持一键重置
- **部分更新**: 只更新需要变更的字段

**集成示例**:
```typescript
// 读取设置
const playbackRate = useGlobalSettings(selectPlaybackRate);
const isMuted = useGlobalSettings(selectIsMuted);
const showSubtitles = useGlobalSettings(selectShowSubtitles);

// 更新设置
const updateSettings = useGlobalSettings(selectUpdatePlayerInstanceSettings);
updateSettings({ isMuted: true, playbackRate: 1.5 });

// 重置为默认
const reset = useGlobalSettings(selectResetToDefaults);
reset();
```

---

## Entity架构模式

### Zustand Store模式

所有Entity统一使用Zustand实现状态管理：

```typescript
// 标准Entity Store结构
export const useEntityStore = create<EntityStore>((set, get) => ({
  // 状态数据
  data: initialData,

  // 状态管理方法
  updateData: (updates) => set((state) => ({
    data: { ...state.data, ...updates }
  })),

  // 获取方法
  getData: () => get().data,
}));
```

**设计优势**:
- 轻量级：无需Redux样板代码
- 类型安全：完整TypeScript支持
- DevTools：支持Redux DevTools调试
- 性能优化：自动批处理更新

### Selector模式

细粒度selector减少重渲染：

```typescript
// ✅ 推荐：细粒度selector
export const selectUserId = (state: UserStore) => state.userId;
export const selectEmail = (state: UserStore) => state.email;

// Hook使用
const userId = useUserStore(selectUserId);  // 只订阅userId

// ❌ 避免：粗粒度订阅
const user = useUserStore(state => state.user);  // user任何字段变化都重渲染
```

### Hook抽象模式

提供便捷的Hook接口：

```typescript
// 直接使用selector的Hook
export const useUserId = () => useUserStore(selectUserId);
export const useEmail = () => useUserStore(selectEmail);

// 组合Hook
export const useAuthStatus = () => {
  const isAuthenticated = useIsAuthenticated();
  const hasPassword = useHasPassword();
  const provider = useAuthProvider();
  return { isAuthenticated, hasPassword, provider };
};
```

## Entity集成模式

### Feature → Entity集成

Feature层使用Entity提供的数据和方法：

```typescript
// features/subtitle-display/ui/SubtitleDisplay.tsx
import { useSubtitleEntity } from '@/entities/subtitle';

export const SubtitleDisplay = ({ videoId }: Props) => {
  const { getSentenceAtTime, getNextSentence } = useSubtitleEntity(videoId);
  const currentTime = useConditionalCurrentTime(isActiveVideo);

  const sentence = getSentenceAtTime(currentTime);
  // 渲染字幕UI...
};
```

### Widget → Entity集成

Widget层组合多个Entity的数据：

```typescript
// widgets/video-player-section/ui/SmallVideoPlayerSection.tsx
import { useVideoStore, selectCurrentVideoId } from '@/entities/video';
import { useFeedStore, selectVideoIds } from '@/entities/feed';

export const SmallVideoPlayerSection = ({ videoId }: Props) => {
  const currentVideoId = useVideoStore(selectCurrentVideoId);
  const isActiveVideo = videoId === currentVideoId;

  // 组合多个Entity数据...
};
```

### Entity ↔ Entity通信

Entity间通过Feature层协调（依赖注入模式）：

```typescript
// features/video-window-management/lib/windowExtension.ts

// ❌ 错误：Entity直接依赖Entity
// playerPoolManager内部直接调用subtitle entity

// ✅ 正确：Feature层协调多Entity
export const createExtendWindowCallbacks = () => {
  // Feature层读取多个Entity数据
  const videoMeta = useVideoMetaStore.getState().getVideo(videoId);
  const subtitle = useSubtitleStore.getState().subtitles.get(videoId);

  // 创建回调传给Player Pool
  return {
    getVideoMetadata: (id) => useVideoMetaStore.getState().getVideo(id),
    getSubtitle: (id) => useSubtitleStore.getState().subtitles.get(id),
  };
};
```

## Entity开发规范

### 命名约定

- **Entity目录**: kebab-case (例: `player-pool`, `video-meta`)
- **Store名称**: `use{Entity}Store` (例: `useVideoStore`)
- **Selector**: `select{Field}` (例: `selectCurrentVideoId`)
- **Hook**: `use{Field}` (例: `useCurrentVideoId`)

### 文件组织

标准Entity目录结构：

```
src/entities/{entity-name}/
├── model/
│   ├── store.ts       # Zustand Store定义
│   ├── types.ts       # 类型定义
│   ├── selectors.ts   # Selector函数
│   └── defaults.ts    # 默认值（可选）
├── hooks/
│   ├── use{Entity}Actions.ts  # Actions Hook（可选）
│   └── selectors.ts           # Selector Hooks（可选）
├── lib/                       # 辅助工具（可选）
├── index.ts                  # 统一导出
├── CONTEXT.md               # 架构文档（推荐）
└── README.md                # 使用文档（可选）
```

### 导出规范

Entity的`index.ts`应导出：

```typescript
// Store
export { useEntityStore } from './model/store';

// Types
export type { EntityStore, EntityState } from './model/types';

// Selectors
export { selectField1, selectField2 } from './model/selectors';

// Hooks (可选)
export { useField1, useField2 } from './hooks/selectors';
```

### 性能优化指南

1. **使用Map替代Object**: 大量数据查找场景（如video-meta, subtitle）
2. **细粒度selector**: 每个字段独立selector，避免粗粒度订阅
3. **条件订阅**: 多实例场景使用条件订阅（如video entity）
4. **防抖更新**: 高频更新场景使用防抖（如subtitle的60fps限制）
5. **LRU缓存**: 内存占用大的场景实施LRU淘汰策略（如player-pool）

## 架构演进历史

### 已完成的架构升级

**Player Pool v5.0 (2025-10-09)**: VideoId-Based架构，Feed裁剪完全免疫
**Video Entity v5.0 (2025-10-07)**: 条件订阅架构，多视频场景性能提升99%
**Subtitle Entity v2.0**: 时间单位统一，零转换开销，指针优化搜索
**Feed Entity重构**: videoId数组，SSOT原则，移除VideoMetaData存储

### 未来优化方向

**Video Meta Entity**: 实施LRU淘汰策略，限制缓存大小
**Global Settings Entity**: 持久化存储，AsyncStorage集成
**User Entity**: 离线支持，本地数据缓存
**Subtitle Entity**: 持久化缓存，减少网络请求

## 相关文档

**Tier 1 (基础文档)**:
- [项目结构](/docs/ai-context/project-structure.md) - 完整技术栈和系统架构
- [主上下文](/CLAUDE.md) - 编码标准和开发协议

**Tier 2 (组件级文档)**:
- [功能层文档](/src/features/CONTEXT.md) - Feature层架构和集成模式
- [共享层文档](/src/shared/CONTEXT.md) - Shared层工具和提供器

**Tier 3 (Entity特定文档)**:
- [Player Pool架构](/src/entities/player-pool/CONTEXT.md) - v5.0 VideoId-Based架构
- [Video Entity架构](/src/entities/video/CONTEXT.md) - v5.0 条件订阅架构
- [Subtitle Entity架构](/src/entities/subtitle/CONTEXT.md) - v2.0 时间单位统一架构

---

*本文档反映了my-word-app项目Entity层的当前实现状态（v1.0）。Entity层作为业务域核心，遵循FSD架构原则，提供稳定、高性能的数据管理接口。*

**文档版本**: v1.0
**最后更新**: 2025-10-10
**维护者**: Entity Layer Team
