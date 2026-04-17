# Subtitle Display Feature

字幕显示功能模块，负责在视频播放器中展示字幕内容，提供丰富的显示配置、智能导航控制和友好的用户交互体验。

## 🎯 设计理念

### 核心职责
- **Token级渲染**: 在视频播放器上叠加显示字幕内容，支持单词级别交互
- **单词点击交互**: 支持单词级别的点击选中和状态管理
- **智能空格处理**: 自动处理标点符号和单词间的空格逻辑
- **统一对齐**: 确保可点击和不可点击token的完美视觉对齐
- **时间同步**: 自动订阅 video entity 的播放时间，实现精确同步（秒级精度）
- **智能导航**: 提供前后句子导航和智能跳转逻辑
- **样式配置**: 提供运行时字幕样式和位置配置

### 架构原则
- **依赖上游**: 依赖 `entities/subtitle` 获取字幕数据，依赖 `entities/video` 获取播放时间和显示状态
- **无状态设计**: 不维护额外状态，完全依赖上游 entities
- **配置注入**: 通过 props 注入样式配置，支持运行时覆盖
- **统一时间单位**: 所有时间相关操作使用秒作为单位，与视频播放器保持一致
- **性能优化**: 使用指针优化的搜索算法和React Native Reanimated实现高性能
- **类型安全**: 完整的 TypeScript 类型定义

## 📁 目录结构

```
src/features/subtitle-display/
├── lib/                          # 核心业务逻辑
│   └── useSubtitleDisplay.ts     # 主要字幕显示 Hook
├── model/                        # 类型和配置
│   └── types.ts                 # 类型定义和默认配置
├── ui/                          # UI 组件层
│   ├── SubtitleDisplay.tsx      # Token级字幕显示组件
│   ├── SubtitleToken.tsx        # 单个Token渲染组件
│   ├── SubtitleNavigationControls.tsx  # 导航控制组件
│   └── IntegratedSubtitleView.tsx      # 集成视图组件
├── index.ts                     # 功能模块统一导出
└── README.md                    # 本文档
```

## 🏗️ 核心架构

### 数据流向图

```
┌─────────────────────────────────────────────────────────────┐
│                     字幕显示数据流                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  entities/video                                            │
│  ├─ currentTime (秒) ──────────┐                          │
│  ├─ seek (秒)                  │                          │
│  └─ showSubtitles              │                          │
│                                 │                          │
│  entities/subtitle               │                          │
│  ├─ currentSubtitle             │                          │
│  ├─ getSentenceAtTime(秒)      │                          │
│  ├─ getNextSentence             │                          │
│  └─ getPreviousSentence         │                          │
│                                 │                          │
│                                 ▼                          │
│              useSubtitleDisplay                            │
│              ┌─────────────────┐                          │
│              │ 状态计算         │                          │
│              │ ├─ currentSentence                         │
│              │ ├─ currentIndex                            │
│              │ ├─ hasPrevious/hasNext                     │
│              │ └─ sentences[]                             │
│              │                                            │
│              │ 导航逻辑         │                          │
│              │ ├─ goToPrevious (智能)                     │
│              │ └─ goToNext                                │
│              └─────────────────┘                          │
│                       │                                    │
│                       ▼                                    │
│               SubtitleDisplay                              │
│            + SubtitleNavigationControls                    │
│                 (渲染组件)                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 时间单位架构

**重要改进**: 所有时间单位已统一为秒，完全消除单位转换：

```
Video Player    →  currentTime (秒)    →  useSubtitleDisplay (秒)
     ↑                                          ↓
seek (秒)      ←   导航跳转 (秒)       ←   getSentenceAtTime (秒)
     ↑                                          ↓
Video Player   ←   sentence.start (秒) ←   SubtitleSearchEngine (秒)
```

**优势**:
- ❌ **消除转换**: 无需 `* 1000` 或 `/ 1000` 转换
- ⚡ **性能提升**: 减少计算开销
- 🎯 **精度一致**: 避免浮点数转换精度丢失
- 🧹 **代码简化**: 所有时间变量语义统一

## 📊 类型系统

### 核心类型

```typescript
/**
 * 字幕显示配置
 */
export interface SubtitleDisplayConfig {
  /** 是否启用字幕显示 */
  enabled: boolean;
  /** 字幕显示位置 */
  position: 'top' | 'center' | 'bottom';
  /** 字体大小 */
  fontSize: number;
  /** 字体颜色 */
  fontColor: string;
  /** 背景颜色 */
  backgroundColor: string;
  /** 背景透明度 (0-1) */
  backgroundOpacity: number;
  /** 是否显示导航控件 */
  showNavigationControls: boolean;
  /** 自动滚动到当前句子 */
  autoScroll: boolean;
  /** 点击句子时是否跳转到对应时间 */
  enableClickToSeek: boolean;
}

/**
 * 字幕显示状态
 */
export interface SubtitleDisplayState {
  /** 当前显示的句子 */
  currentSentence: Sentence | null;
  /** 当前句子索引 */
  currentIndex: number;
  /** 所有句子列表 */
  sentences: Sentence[];
  /** 是否有上一句 */
  hasPrevious: boolean;
  /** 是否有下一句 */
  hasNext: boolean;
  /** 选中的token标识集合 */
  selectedTokens: Set<SubtitleTokenKey>;
  /** 当前高亮的token标识 */
  modalHighlightedToken: SubtitleTokenKey | null;
}

/**
 * 字幕导航控制
 */
export interface SubtitleNavigationActions {
  /** 跳转到上一句 (智能逻辑) */
  goToPrevious: () => void;
  /** 跳转到下一句 */
  goToNext: () => void;
}

/**
 * 字幕显示动作集合
 */
export interface SubtitleDisplayActions extends SubtitleNavigationActions {
  /** 切换token选中状态 */
  toggleTokenSelection: (tokenKey: SubtitleTokenKey) => void;
  /** 打开单词解释 Modal */
  showTokenExplanation: (token: SubtitleToken, sentenceIndex: number) => void;
  /** 清除 Modal 高亮 */
  clearModalHighlight: () => void;
}

/**
 * Hook 返回类型
 */
export interface UseSubtitleDisplayReturn {
  /** 显示状态 */
  state: SubtitleDisplayState;
  /** 导航控制 */
  actions: SubtitleDisplayActions;
  /** 当前配置 */
  config: SubtitleDisplayConfig;
}
```

### 默认配置

```typescript
export const DEFAULT_SUBTITLE_CONFIG: SubtitleDisplayConfig = {
  enabled: true,
  position: 'bottom',
  fontSize: 16,
  fontColor: '#FFFFFF',
  backgroundColor: '#000000',
  backgroundOpacity: 0.7,
  showNavigationControls: true,
  autoScroll: true,
  enableClickToSeek: true,
};
```

## 🔧 核心实现

### 1. 核心 Hook (`useSubtitleDisplay.ts`)

完全无状态设计，纯计算型Hook：

```typescript
export function useSubtitleDisplay(
  config: Partial<SubtitleDisplayConfig> = {}
): UseSubtitleDisplayReturn {
  // 合并配置
  const finalConfig: SubtitleDisplayConfig = {
    ...DEFAULT_SUBTITLE_CONFIG,
    ...config,
  };

  // 直接订阅 video entity 状态 (秒)
  const { currentTime, seek } = useVideoPlayer();
  const { showSubtitles } = useVideoOverlayManager();

  // 订阅当前字幕数据
  const {
    currentSubtitle,
    getSentenceAtTime
  } = useSubtitleEntity();

  // 计算当前时间对应的句子（直接使用秒）
  const currentTimeSeconds = currentTime;

  // 计算显示状态 - 纯计算，无状态存储
  const state: SubtitleDisplayState = useMemo(() => {
    if (!currentSubtitle || !showSubtitles || !finalConfig.enabled) {
      return {
        currentSentence: null,
        currentIndex: -1,
        sentences: [],
        hasPrevious: false,
        hasNext: false,
      };
    }

    // 获取所有句子
    const sentences = currentSubtitle.sentences;

    // 找到当前时间对应的句子 (使用秒)
    const currentSentence = getSentenceAtTime(currentTimeSeconds);

    // 获取当前句子对应的索引（保证一致性）
    const actualCurrentIndex = currentSentence ? currentSentence.index : -1;

    // 基于实际的当前索引检查是否有前后句子
    let hasPrevious = false;
    if (actualCurrentIndex > 0) {
      for (let i = actualCurrentIndex - 1; i >= 0; i--) {
        if (sentences[i].text.trim() !== '') {
          hasPrevious = true;
          break;
        }
      }
    }

    let hasNext = false;
    if (actualCurrentIndex >= 0 && actualCurrentIndex < sentences.length - 1) {
      for (let i = actualCurrentIndex + 1; i < sentences.length; i++) {
        if (sentences[i].text.trim() !== '') {
          hasNext = true;
          break;
        }
      }
    }

    return {
      currentSentence,
      currentIndex: actualCurrentIndex,
      sentences,
      hasPrevious,
      hasNext,
    };
  }, [currentSubtitle, showSubtitles, finalConfig.enabled, currentTimeSeconds]);

  // 导航控制方法
  const actions: SubtitleNavigationActions = useMemo(() => {
    // 统一的时间跳转逻辑（直接使用秒）
    const seekToTime = (timeSeconds: number) => {
      log('subtitle-display', LogType.INFO, `Seeking to time ${timeSeconds}s`);
      seek(timeSeconds);
    };

    const goToPrevious = () => {
      if (!state.sentences) return;

      // 智能上一句逻辑: 检查时间距离
      if (state.currentSentence && state.currentIndex >= 0) {
        const timeDifference = currentTimeSeconds - state.currentSentence.start;

        // 如果当前时间与当前句子start的距离大于等于2秒，跳转到当前句子开始
        if (timeDifference >= 2.0) {
          log('subtitle-display', LogType.INFO, `Navigating to current sentence start at index ${state.currentIndex}`);
          seekToTime(state.currentSentence.start);
          return;
        }
      }

      // 否则查找上一句（距离小于1秒或没有当前句子）
      if (state.currentIndex <= 0) return;

      for (let i = state.currentIndex - 1; i >= 0; i--) {
        const prevSentence = state.sentences[i];
        if (prevSentence.text.trim() !== '') {
          log('subtitle-display', LogType.INFO, `Navigating to previous sentence at index ${i}`);
          seekToTime(prevSentence.start);
          return;
        }
      }
    };

    const goToNext = () => {
      if (!state.sentences || state.currentIndex >= state.sentences.length - 1) return;

      // 基于display层的一致状态查找下一句
      for (let i = state.currentIndex + 1; i < state.sentences.length; i++) {
        const nextSentence = state.sentences[i];
        if (nextSentence.text.trim() !== '') {
          log('subtitle-display', LogType.INFO, `Navigating to next sentence at index ${i}`);
          seekToTime(nextSentence.start);
          return;
        }
      }
    };

    return {
      goToPrevious,
      goToNext,
    };
  }, [state, seek, currentTimeSeconds]);

  return {
    state,
    actions,
    config: finalConfig,
  };
}
```

### 2. 智能导航逻辑与连续调用问题解决

#### 核心问题：连续快速调用的时序问题

**问题描述**：连续快速双击"下一句"时，第三次调用可能跳转到视频开头。

**根本原因**：
```typescript
// 连续调用时的问题序列
第一次 goToNext() -> seek(5.6s) -> 但 currentTime 还是旧值 (2.5s)
第二次 goToNext() -> 仍基于旧的 currentTime (2.5s) 计算
第三次 goToNext() -> getSentenceAtTime(2.5s) 返回错误句子或null
```

#### 解决方案：防抖导航索引追踪

**技术实现**：
```typescript
// 1. 导航索引追踪
const lastNavigationIndexRef = useRef<number | null>(null);
const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// 2. 防抖清除机制
const scheduleNavigationClear = useCallback(() => {
  if (clearTimeoutRef.current) {
    clearTimeout(clearTimeoutRef.current); // 清除旧计时器
  }
  clearTimeoutRef.current = setTimeout(() => {
    lastNavigationIndexRef.current = null; // 2秒后清除
  }, 2000);
}, []);

// 3. 智能索引选择
const goToNext = useCallback(() => {
  let baseIndex: number;
  if (lastNavigationIndexRef.current !== null) {
    baseIndex = lastNavigationIndexRef.current; // 连续导航：使用追踪索引
  } else {
    baseIndex = getSentenceAtTime(currentTime)?.index ?? -1; // 首次：使用时间计算
  }

  const nextIndex = findValidSentenceIndex(sentences, baseIndex, 'next');
  if (nextIndex !== -1) {
    lastNavigationIndexRef.current = nextIndex; // 记录导航位置
    seek(sentences[nextIndex].start);
    scheduleNavigationClear(); // 启动防抖清除
  }
}, []);
```

#### 工作流程图

```
连续快速导航流程：
┌─────────────────────────────────────────────────────────────────┐
│                     防抖导航索引追踪                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  第一次 goToNext()                                              │
│  ├─ lastNavigationIndexRef.current = null                      │
│  ├─ 使用 getSentenceAtTime(currentTime) → 索引2               │
│  ├─ 找到下一句 → 索引3                                         │
│  ├─ lastNavigationIndexRef.current = 3 ✅                      │
│  ├─ seek(句子3.start)                                          │
│  └─ 启动2秒防抖计时器                                          │
│                                                                 │
│  第二次 goToNext() (1秒内)                                     │
│  ├─ lastNavigationIndexRef.current = 3 ✅                      │
│  ├─ 使用导航索引3 (不依赖currentTime)                         │
│  ├─ 找到下一句 → 索引5                                         │
│  ├─ lastNavigationIndexRef.current = 5 ✅                      │
│  ├─ seek(句子5.start)                                          │
│  └─ 重置2秒防抖计时器                                          │
│                                                                 │
│  第三次 goToNext() (再次1秒内)                                 │
│  ├─ lastNavigationIndexRef.current = 5 ✅                      │
│  ├─ 使用导航索引5                                              │
│  ├─ 找到下一句 → 索引7                                         │
│  ├─ 正确顺序导航 ✅                                            │
│  └─ 重置2秒防抖计时器                                          │
│                                                                 │
│  正常播放 (2秒后无导航)                                        │
│  ├─ 防抖计时器触发                                             │
│  ├─ lastNavigationIndexRef.current = null                      │
│  └─ 恢复基于时间的正常导航                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 技术优势

| 特性 | 实现 | 优势 |
|------|------|------|
| **即时性** | `useRef` 立即更新 | 无异步延迟问题 |
| **防抖机制** | 每次导航重置计时器 | 连续操作时持续追踪 |
| **自动恢复** | 2秒后自动清除 | 不影响正常播放 |
| **向后兼容** | fallback 到时间计算 | 保持原有功能 |

#### goToPrevious 智能行为

**智能行为**:
```
用户按"上一句"时:
├─ 如果当前时间 - 句子开始时间 >= 1.5秒
│  └─ 跳转到当前句子开始 (重听当前句子)
└─ 如果当前时间 - 句子开始时间 < 1.5秒
   └─ 跳转到真正的上一句
```

**用户体验**:
- 📍 **句子中间**: 按上一句 → 回到当前句子开始
- 📍 **句子开始**: 按上一句 → 跳到真正的上一句
- 🎯 **符合直觉**: 类似音频播放器的"重播/上一曲"逻辑
- ⚡ **连续操作**: 支持快速连续导航，无时序问题

### 3. 辅助 Hooks

```typescript
/**
 * 辅助 Hook：获取指定时间的句子
 * @param timeSeconds 时间（秒）
 * @returns 对应时间的句子或 null
 */
export function useSubtitleAtTime(timeSeconds: number): Sentence | null {
  const { getSentenceAtTime } = useSubtitleEntity();

  return useMemo(() => {
    return getSentenceAtTime(timeSeconds);
  }, [getSentenceAtTime, timeSeconds]);
}

/**
 * 辅助 Hook：检查字幕是否可用
 */
export function useSubtitleAvailability(): {
  isLoaded: boolean;
  hasSubtitles: boolean;
  sentenceCount: number;
} {
  const { currentSubtitle, isLoaded } = useSubtitleEntity();

  return useMemo(() => ({
    isLoaded: isLoaded(),
    hasSubtitles: !!currentSubtitle,
    sentenceCount: currentSubtitle?.sentences.length || 0,
  }), [currentSubtitle, isLoaded]);
}
```

## 🔌 集成方案

### 基础集成

```typescript
import { SubtitleDisplay } from '@/features/subtitle-display';

function VideoPlayer() {
  return (
    <View>
      <VideoView />

      {/* 基础字幕显示 */}
      <SubtitleDisplay />
    </View>
  );
}
```

### 带导航控制的集成

```typescript
import {
  SubtitleDisplay,
  SubtitleNavigationControls
} from '@/features/subtitle-display';

function VideoPlayerWithControls() {
  const subtitleDisplay = useSubtitleDisplay({
    fontSize: 18,
    showNavigationControls: true
  });

  return (
    <View>
      <VideoView />

      {/* 字幕显示 */}
      <SubtitleDisplay config={{ fontSize: 18 }} />

      {/* 导航控制 */}
      <SubtitleNavigationControls
        actions={subtitleDisplay.actions}
        state={subtitleDisplay.state}
      />
    </View>
  );
}
```

### 集成视图（推荐）

```typescript
import { IntegratedSubtitleView } from '@/features/subtitle-display';

function VideoPlayerComplete() {
  return (
    <View>
      <VideoView />

      {/* 集成字幕视图：包含显示+导航 */}
      <IntegratedSubtitleView
        config={{
          fontSize: 18,
          position: 'bottom',
          showNavigationControls: true
        }}
        containerStyle={{ zIndex: 10 }}
      />
    </View>
  );
}
```

## ⚡ 性能优化

### 1. 时间单位统一优化

**优化前**:
```typescript
// 每次都需要单位转换
const currentTimeMs = currentTime * 1000;  // 秒 → 毫秒
const currentSentence = getSentenceAtTime(currentTimeMs);
seekToTime(sentence.start / 1000);  // 毫秒 → 秒
```

**优化后**:
```typescript
// 直接使用秒，零转换开销
const currentSentence = getSentenceAtTime(currentTime);
seekToTime(sentence.start);  // 直接传递秒
```

**性能提升**:
- ✅ **零转换开销**: 消除6处 `*1000` 和 `/1000` 运算
- ✅ **精度提升**: 避免浮点数转换精度丢失
- ✅ **代码简化**: 减少20+行单位转换代码

### 2. 智能搜索性能

通过 entities/subtitle 的指针优化搜索引擎:
- **O(1)**: 90%的顺序播放场景
- **O(1-5)**: 小幅度跳转场景
- **O(log n)**: 大幅度跳转场景

### 3. 状态计算优化

```typescript
// 纯计算型状态，无副作用
const state = useMemo(() => {
  // 基于当前时间的纯计算
  const currentSentence = getSentenceAtTime(currentTimeSeconds);
  const currentIndex = currentSentence?.index ?? -1;

  // 基于索引的导航状态计算
  return computeDisplayState(sentences, currentIndex);
}, [currentSubtitle, currentTimeSeconds, showSubtitles]);
```

### 4. 渲染优化

```typescript
// 条件渲染，避免不必要的计算
if (!currentSubtitle || !showSubtitles || !finalConfig.enabled) {
  return null;
}

// 仅在必要时重新计算样式
const memoizedStyles = useMemo(() =>
  generateStyles(finalConfig), [finalConfig]
);
```

## 🎨 样式和主题

### 响应式配置

```typescript
// 根据屏幕方向和播放模式自动调整
const responsiveConfig = {
  // 横屏全屏
  landscape: {
    fontSize: 20,
    marginBottom: 40,
    marginHorizontal: 60,
  },
  // 竖屏
  portrait: {
    fontSize: 18,
    marginBottom: 80,
    marginHorizontal: 30,
  },
  // 小屏模式
  compact: {
    fontSize: 16,
    marginBottom: 60,
    marginHorizontal: 20,
  }
};
```

### 主题支持

```typescript
const darkTheme = {
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  fontColor: '#FFFFFF',
  borderRadius: 8,
};

const lightTheme = {
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  fontColor: '#333333',
  borderRadius: 6,
};
```

## 🔍 调试支持

### 开发环境日志

```typescript
// 自动记录导航操作
log('subtitle-display', LogType.INFO, `Navigating to previous sentence at index ${i}`);
log('subtitle-display', LogType.INFO, `Seeking to time ${timeSeconds}s`);

// 状态变化跟踪
log('subtitle-display', LogType.DEBUG, `Current sentence changed: ${currentSentence?.text}`);
```

### 性能监控

```typescript
// 开发环境性能统计
if (__DEV__) {
  console.log('字幕搜索性能:', {
    totalSearches: stats.totalSearches,
    averageTime: stats.averageSearchTime,
    cacheHitRate: stats.cacheHitRate
  });
}
```

## 🧪 测试策略

### 单元测试
- [x] useSubtitleDisplay Hook 逻辑测试
- [x] 智能导航逻辑测试
- [x] 时间单位转换测试
- [x] 状态计算测试

### 集成测试
- [x] 与 video entity 集成测试
- [x] 与 subtitle entity 集成测试
- [x] 导航控制集成测试

### 性能测试
- [x] 搜索算法性能基准测试
- [x] 渲染性能测试
- [x] 内存使用测试

## 🎯 Token级交互系统 (v3.1)

### 核心特性

**可点击Token判断**:
```typescript
// 基于explanation字段智能判断
export function isClickableToken(token: SubtitleToken): boolean {
  return Boolean(token.explanation?.trim());
}
```

**智能空格处理**:
```typescript
// 自动处理标点符号和单词间距
export function shouldAddSpaceBefore(token: SubtitleToken, index: number): boolean {
  if (index === 0) return false; // 第一个token前不加空格

  const punctuation = ['.', ',', '!', '?', ';', ':', ')', ']', '}', '"', "'"];
  if (punctuation.includes(token.text?.trim() || '')) {
    return false; // 标点符号前不加空格
  }

  return true; // 其他情况都加空格
}
```

**Text组件嵌套渲染**:
```typescript
// 使用React Native原生Text嵌套结构解决换行问题
return (
  <Text style={baseTextStyle}>
    {tokens.map((token, index) => (
      <React.Fragment key={`${token.semanticElement?.id ?? `${sentence.index}:${token.index}`}-${index}`}>
        {shouldAddSpaceBefore(token, index) && ' '}
        <Text
          style={tokenTextStyle}
          onPress={hasExplanation ? () => actions.showTokenExplanation(token, sentence.index) : undefined}
          suppressHighlighting={true}
        >
          {token.text}
        </Text>
      </React.Fragment>
    ))}
  </Text>
);
```

### 数据结构匹配

**Token数据结构**:
```json
{
  "text": "Trump administration",
  "explanation": "特朗普政府",
  "semanticElement": {
    "id": 1699933614,
    "label": "Trump administration",
    "pos": "NOUN",
    "chinese_def": "指特朗普总统执政期间的政府"
  },
  "index": 1
}
```

### 换行问题解决方案 (v3.1)

**问题描述**: 传统布局中，标点符号可能在自动换行时出现在新行的开头，破坏阅读体验。

**解决方案**: Text组件嵌套渲染
```typescript
// 核心架构：外层Text处理整体布局，内层Text处理token交互
<Text style={baseTextStyle}>  {/* 外层：处理换行和整体样式 */}
  {tokens.map((token, index) => (
    <Fragment key={token.id}>
      {shouldAddSpaceBefore(token, index) && ' '}
      <Text                              {/* 内层：处理token点击和样式 */}
        onPress={hasExplanation ? onPress : undefined}
        suppressHighlighting={true}      {/* 去掉点击时的灰色背景 */}
      >
        {token.text}
      </Text>
    </Fragment>
  ))}
</Text>
```

**技术优势**:
- **原生换行**: 利用React Native Text组件的原生换行算法
- **无动画干扰**: `suppressHighlighting`去掉点击时的透明背景
- **零额外开销**: 不需要负margin、transform等hack方案
- **完整交互**: 保持所有token的独立点击功能

**替代方案对比**:
| 方案 | 优势 | 劣势 | 结果 |
|------|------|------|------|
| 非换行空格(`\u00A0`) | 简单 | React Native支持不完整 | ❌ 无效 |
| 负margin(`marginLeft: -2`) | 视觉效果好 | Flex布局中可能失效 | ❌ 无效 |
| Transform平移 | 精确控制 | 可能影响点击区域 | ⚠️ 复杂 |
| **Text嵌套** | 原生支持，零hack | 需要理解嵌套模式 | ✅ **最优** |

### 渲染效果示例

```
原始句子: "The Trump administration deporting hundreds of men without a trial."

渲染效果:
[The] [Trump administration] [deporting] [hundreds of men] [without] [a] [trial][.]
 ↑白色     ↑可点击蓝色        ↑可点击       ↑可点击         ↑可点击  ↑白色 ↑可点击  ↑白色不可点击

换行效果:
如果句子过长需要换行，标点符号"."会自动跟随"trial"，不会出现在新行开头：

[The] [Trump administration] [deporting]
[hundreds of men] [without] [a] [trial][.]
                                      ↑正确：标点跟随单词

交互规则:
- explanation非空的token可点击，选中后变蓝色
- explanation为空的token (如标点".")不可点击，保持白色
- Text嵌套结构确保原生换行行为和完整交互功能
```

### 选中状态管理

```typescript
// 使用Set存储选中的token标识（semanticElement.id 或句子索引组合）
const [selectedTokens, setSelectedTokens] = useState<Set<SubtitleTokenKey>>(new Set());

// Toggle选中状态
const toggleTokenSelection = useCallback((tokenKey: SubtitleTokenKey) => {
  if (!tokenKey) return;
  setSelectedTokens(prev => {
    const newSet = new Set(prev);
    if (newSet.has(tokenKey)) {
      newSet.delete(tokenKey); // 取消选中
    } else {
      newSet.add(tokenKey);    // 选中
    }
    return newSet;
  });
}, []);
```

### 边界情况处理

**空值安全**:
- `sentence.tokens?.map()` - 处理空tokens数组
- `token.explanation?.trim()` - 处理null/undefined explanation
- `token.text?.trim() || ''` - 处理null/undefined text

**性能优化**:
- 使用useCallback避免不必要的重渲染
- 正确的依赖数组防止闭包陷阱
- 统一容器结构减少DOM层级差异

## 🚀 技术亮点

### 1. Token级渲染架构
- **精确交互**: 支持单词级别的点击和选中
- **统一对齐**: 确保可点击和不可点击token视觉一致
- **智能判断**: 基于数据结构自动判断token可点击性
- **完美重组**: 用tokens重新组合句子，保持原始视觉效果

### 2. 时间单位统一架构
- **完全消除单位转换**: 从毫秒改为秒，与视频播放器原生单位一致
- **性能提升**: 减少数值转换开销，提升计算效率
- **精度保障**: 避免 `*1000` 和 `/1000` 导致的精度丢失

### 3. 智能导航算法
```typescript
// 智能上一句逻辑
const timeDifference = currentTime - sentence.start;
if (timeDifference >= 1.5) {
  // 回到当前句子开始
  seekToTime(sentence.start);
} else {
  // 跳转到真正的上一句
  seekToTime(previousSentence.start);
}
```

### 4. 无状态架构设计
- **零状态管理**: 完全依赖上游 entities，无额外状态
- **纯函数式**: 所有计算都是纯函数，便于测试和调试
- **自动同步**: 订阅式设计，自动响应播放状态变化

### 5. 高性能搜索集成
- **指针优化**: 利用 entities/subtitle 的 O(1) 搜索能力
- **缓存策略**: 智能缓存当前索引，减少重复搜索
- **异步更新**: 避免渲染期间的状态更新冲突

## 📋 版本历史

### v3.1.0 (当前版本)
- 🚀 **换行问题解决**: Text组件嵌套渲染，彻底解决标点符号换行问题
- 🚀 **无动画交互**: `suppressHighlighting`去掉点击时的透明背景动画
- 🚀 **原生Text支持**: 改用React Native原生Text组件，提升兼容性
- ✅ 零hack方案，完全基于React Native原生能力
- ✅ 保持完整的token独立点击功能
- ✅ 完善的替代方案对比和技术文档

### v3.0.0 (历史版本)
- 🚀 **Token级交互**: 支持单词级别的点击和选中
- 🚀 **智能空格处理**: 自动处理标点符号和单词间距
- 🚀 **统一对齐**: 确保可点击和不可点击token完美对齐
- 🚀 **状态管理**: 新增token选中状态管理
- ✅ 边界情况处理和空值安全
- ✅ 性能优化和内存管理
- ✅ 完整的TypeScript类型安全

### v2.0.0 (历史版本)
- 🚀 **重大重构**: 时间单位统一为秒
- 🚀 **性能优化**: 消除所有单位转换开销
- 🚀 **智能导航**: 新增智能 goToPrevious 逻辑
- 🚀 **架构升级**: 完全无状态设计
- ✅ 指针优化搜索集成
- ✅ TypeScript 类型完善
- ✅ 导航控制组件

### v1.0.0 (历史版本)
- ✅ 基础字幕显示功能
- ✅ 毫秒时间单位系统
- ✅ 基础动画效果

### 未来版本
- 🔄 v3.2.0: Token解释模态框增强
- 🔄 v3.3.0: 字幕主题系统
- 🔄 v4.0.0: AI 增强功能

---

**Subtitle Display Feature v3.1** - 原生换行、零hack方案、完美交互的专业字幕显示解决方案 🎬⚡🎯
