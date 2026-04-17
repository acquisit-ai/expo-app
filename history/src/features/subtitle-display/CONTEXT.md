# Subtitle Display Feature Context

## 核心设计原则

**无状态架构设计** - 完全依赖上游entities，零状态管理，通过纯计算实现所有显示逻辑，确保数据一致性和架构简洁性。

**时间单位统一架构** - 所有时间操作直接使用秒单位，与视频播放器原生单位一致，消除单位转换开销和精度丢失。

**智能导航逻辑** - 实现类似音频播放器的"重播/上一曲"直觉行为：1.5秒内跳当前句子开始，超过1.5秒跳真正上一句。支持跨Feature手势集成，可通过视频手势调用。

**Token级交互系统v3.1** - 精确的单词级别交互控制，Text组件嵌套渲染解决换行问题，支持token点击显示解释，高亮状态管理，Modal生命周期协调。

**条件订阅集成v3.2** - 支持多视频场景性能优化，通过`isActiveVideo`参数控制是否订阅video entity，非活跃视频零订阅开销。字幕导航功能提取为独立Hook（`useSubtitleNavigation`），支持跨Feature复用。

## 架构职责边界

**纯显示层职责**:
- Token级字幕内容渲染和样式配置
- 单词级别的点击交互和选中状态管理
- 时间同步显示（订阅video entity的currentTime）
- 智能导航控制（goToPrevious/goToNext）
- 统一对齐的可点击和不可点击token渲染
- Modal集成的单词解释功能（ElementExplanationModal）
- Modal高亮状态管理和生命周期协调

**依赖关系（v3.2更新）**:
```
entities/video (条件订阅currentTime秒) → useSubtitleNavigation → 智能导航
                                         ↘
entities/subtitle (getSentenceAtTime秒) → useSubtitleDisplay → 纯计算状态
shared/lib/modal (useModal, openModal) ↗ → ElementExplanationModal
```

**不负责的事项**:
- ❌ 数据存储和状态管理
- ❌ API调用和数据处理
- ❌ 时间单位转换

## 条件订阅架构 (v3.2)

### 架构动机

**多视频实例性能问题**：
- 场景：小屏和全屏widget同时存在
- 问题：非活跃视频的字幕组件也订阅video entity
- 解决：提取导航功能为独立Hook，支持条件订阅

### useSubtitleNavigation Hook

**职责**：从`useSubtitleDisplay`中提取完整的字幕导航逻辑，支持条件订阅。

**文件位置**：`src/features/subtitle-display/hooks/useSubtitleNavigation.ts`

**核心实现**：

```typescript
/**
 * 字幕导航Hook（条件订阅版）
 *
 * @param playerInstance - 播放器实例
 * @param isActiveVideo - 是否为活跃视频（控制订阅）
 * @returns 导航方法（goToPrevious, goToNext）
 */
export function useSubtitleNavigation(
  playerInstance: VideoPlayer | null,
  isActiveVideo: boolean
): SubtitleNavigationActions {
  // ✅ 条件订阅：仅活跃视频订阅currentTime
  const currentTime = useConditionalCurrentTime(isActiveVideo);

  // 🎯 订阅字幕数据（按需读取store，避免持续订阅）
  const { getSentenceAtTime } = useSubtitleEntity();

  const goToPrevious = useCallback(() => {
    // ✅ 早期退出：非活跃视频不执行任何逻辑
    if (!isActiveVideo || !playerInstance) return;

    try {
      // 🎯 仅在导航时读取store（避免持续订阅）
      const subtitleState = useSubtitleStore.getState();
      const currentSubtitle = subtitleState.currentSubtitle;
      if (!currentSubtitle?.sentences?.length) return;

      // 智能导航逻辑：1.5秒内跳上一句，超过1.5秒跳当前句开始
      const realTimeCurrentSentence = getSentenceAtTime(currentTime);
      if (realTimeCurrentSentence) {
        const timeDifference = currentTime - realTimeCurrentSentence.start;
        if (timeDifference >= 1.5) {
          // 跳到当前句子开始
          seekVideo(playerInstance, realTimeCurrentSentence.start);
          return;
        }
      }

      // 查找上一个有效句子
      const baseIndex = realTimeCurrentSentence?.index ?? -1;
      const prevIndex = findValidSentenceIndex(
        currentSubtitle.sentences,
        baseIndex,
        'prev'
      );

      if (prevIndex !== -1) {
        seekVideo(playerInstance, currentSubtitle.sentences[prevIndex].start);
      } else {
        seekVideo(playerInstance, 0); // 跳到开头
      }
    } catch (error) {
      log('subtitle-navigation', LogType.ERROR, 'goToPrevious failed', error);
    }
  }, [isActiveVideo, playerInstance, currentTime, getSentenceAtTime]);

  const goToNext = useCallback(() => {
    // ✅ 早期退出：非活跃视频不执行任何逻辑
    if (!isActiveVideo || !playerInstance) return;

    try {
      const subtitleState = useSubtitleStore.getState();
      const currentSubtitle = subtitleState.currentSubtitle;
      if (!currentSubtitle?.sentences?.length) return;

      const realTimeCurrentSentence = getSentenceAtTime(currentTime);
      const baseIndex = realTimeCurrentSentence?.index ?? -1;
      const nextIndex = findValidSentenceIndex(
        currentSubtitle.sentences,
        baseIndex,
        'next'
      );

      if (nextIndex !== -1) {
        seekVideo(playerInstance, currentSubtitle.sentences[nextIndex].start);
      }
    } catch (error) {
      log('subtitle-navigation', LogType.ERROR, 'goToNext failed', error);
    }
  }, [isActiveVideo, playerInstance, currentTime, getSentenceAtTime]);

  return { goToPrevious, goToNext };
}
```

**性能优化特征**：
- **条件订阅**：`enabled=false`时零订阅开销
- **按需读取**：导航时才读取`useSubtitleStore.getState()`，不持续订阅
- **早期退出**：非活跃视频在函数开头立即返回
- **细粒度订阅**：只订阅`currentTime`，不订阅整个字幕数据

### 使用模式

#### video-control-overlay内部使用

```typescript
// useVideoControlsComposition.ts
const subtitleNavigation = useSubtitleNavigation(playerInstance, isActiveVideo);

// 传递给控件组件
return {
  ...coreControlsProps,
  subtitleNavigation,
};
```

#### useSubtitleDisplay集成

```typescript
// useSubtitleDisplay.ts
export function useSubtitleDisplay(config) {
  // ✅ 使用提取的导航Hook
  // IntegratedSubtitleView只在活跃视频渲染，所以传true
  const { goToPrevious, goToNext } = useSubtitleNavigation(playerInstance, true);

  // Token交互功能（保留）
  const showTokenExplanation = useCallback(...);

  return {
    state,
    actions: {
      goToPrevious,
      goToNext,
      showTokenExplanation,
      // ...
    },
  };
}
```

### 架构优势

**1. 功能解耦**：
- 导航逻辑独立，可在不同Feature复用
- `useSubtitleDisplay`职责更清晰（Token交互 + 显示状态）

**2. 性能优化**：
- 支持条件订阅，多视频场景零开销
- 早期退出模式，避免不必要的计算

**3. 灵活集成**：
- video-control-overlay可直接使用导航功能
- 不需要通过props传递`subtitleNavigation`

## 新架构设计 (v2.0 Context架构)

### Context分层架构

**SubtitleDisplayProvider** - Feature级别的Context管理：
```typescript
// 集中管理字幕显示所需的所有状态和方法
export interface SubtitleDisplayContextType {
  state: SubtitleDisplayState;         // 显示状态（包含selectedTokens + modalHighlightedToken）
  actions: SubtitleNavigationActions;  // 导航控制+token选中管理+Modal交互
  config: SubtitleDisplayConfig;       // 当前配置
  theme: { colors: ... };             // 主题数据
}
```

**单点耦合设计** - 只有 `IntegratedSubtitleView` 与外部实体耦合：
```typescript
// 主要集成组件 - 作为Context Provider
export function IntegratedSubtitleView() {
  const { state, actions, config } = useSubtitleDisplay(config);

  const contextValue = useMemo(() => ({
    state, actions, config, theme
  }), [state, actions, config, theme]);

  return (
    <SubtitleDisplayProvider value={contextValue}>
      <SubtitleDisplay />  {/* 纯Context消费者 */}
      <SubtitleNavigationControls />  {/* 纯Context消费者 */}
    </SubtitleDisplayProvider>
  );
}
```

### 核心Hook重构 (v2.0 + Modal集成)

**useSubtitleDisplay** - 完全无状态的纯计算Hook + Modal交互（v3.2更新）:
```typescript
// ✅ v3.2：导航功能已提取到useSubtitleNavigation
const { goToPrevious, goToNext } = useSubtitleNavigation(playerInstance, true);

// 直接订阅entities状态，零中间状态
const { currentTime } = useVideoPlayer();
const { showSubtitles } = useGlobalSettings(selectShowSubtitles);
const { currentSubtitle, getSentenceAtTime } = useSubtitleEntity();
const { openModal } = useModal(); // Modal系统集成

// Token选中状态和Modal高亮状态管理
const [selectedTokens, setSelectedTokens] = useState<Set<SubtitleTokenKey>>(new Set());
const [modalHighlightedToken, setModalHighlightedToken] = useState<number | null>(null);

// 实时计算显示状态（纯函数）
const state: SubtitleDisplayState = useMemo(() => {
  if (!currentSubtitle || !finalConfig.enabled || !showSubtitles) {
    return emptyState;
  }

  const currentSentence = getSentenceAtTime(currentTime); // 直接秒单位
  const actualCurrentIndex = currentSentence ? currentSentence.index : -1;

  // ✅ v3.2：简化hasPrevious/hasNext计算（导航逻辑在useSubtitleNavigation）
  const hasPrevious = currentSubtitle.sentences.some(
    (s, i) => i < actualCurrentIndex && s.text.trim() !== ''
  );
  const hasNext = currentSubtitle.sentences.some(
    (s, i) => i > actualCurrentIndex && s.text.trim() !== ''
  );

  return {
    currentSentence,
    currentIndex: actualCurrentIndex,
    sentences: currentSubtitle.sentences,
    hasPrevious,
    hasNext,
    selectedTokens,
    modalHighlightedToken,
  };
}, [currentTime, currentSubtitle, showSubtitles, selectedTokens, modalHighlightedToken]);

// Token交互方法
const createTokenKey = useCallback((token: SubtitleToken, sentenceIndex: number) => {
  return token.semanticElement?.id != null
    ? String(token.semanticElement.id)
    : `${sentenceIndex}:${token.index}`;
}, []);

const showTokenExplanation = useCallback((token: SubtitleToken, sentenceIndex: number) => {
  // ✅ 检查播放状态，暂停播放
  const wasPlayingBeforeModal = playerInstance?.playing ?? false;
  if (wasPlayingBeforeModal) {
    pauseVideo(playerInstance);
  }

  const tokenKey = createTokenKey(token, sentenceIndex);

  setModalHighlightedToken(tokenKey);
  openModal('ElementExplanationModal', {
    word: token.text,
    translation: token.explanation,
    ...(token.semanticElement
      ? (() => {
          const label = token.semanticElement.label ?? token.text;
          const kind = token.semanticElement.kind?.toLowerCase();
          let posValue: string | undefined;
          if (kind === 'phrase') {
            posValue = 'PHRASE';
          } else if (kind === 'word') {
            posValue = token.semanticElement.pos ? token.semanticElement.pos.toUpperCase() : undefined;
          } else {
            posValue = token.semanticElement.pos?.toUpperCase() ?? token.semanticElement.kind?.toUpperCase();
          }
          return {
            label,
            definition: token.semanticElement.chinese_def ?? '',
            dictionaryLabel: token.semanticElement.chinese_label ?? '',
            ...(posValue ? { pos: posValue } : {}),
          };
        })()
      : {}),
    clearModalHighlight: () => setModalHighlightedToken(null),
    wasPlayingBeforeModal,
    resumePlayback: () => playVideo(playerInstance),
  });
}, [openModal, playerInstance, createTokenKey]);

// ✅ v3.2：返回导航方法
return {
  state,
  actions: {
    goToPrevious,
    goToNext,
    showTokenExplanation,
    toggleTokenSelection,
    clearModalHighlight,
  },
};
```

### 组件分离模式

**SubtitleDisplay** - Text嵌套Token级渲染组件 (v3.1)：
```typescript
// Text组件嵌套架构，解决换行问题的同时保持完整交互
export function SubtitleDisplay() {
  const { state, actions, config } = useSubtitleDisplayContext();
  const { theme } = useTheme();

  if (!state.currentSentence) return null;

  return (
    <Text style={baseTextStyle}>  {/* 外层Text：处理整体布局和换行 */}
      {state.currentSentence.tokens?.map((token, index) => {
        const tokenKey = token.semanticElement?.id != null
          ? String(token.semanticElement.id)
          : `${state.currentSentence?.index ?? 0}:${token.index}`;
        const isSelected = state.selectedTokens.has(tokenKey);
        const isModalHighlighted = state.modalHighlightedToken === tokenKey;
        const hasExplanation = Boolean(token.explanation?.trim());

        const tokenTextStyle = [
          flattenedTextStyle,
          isModalHighlighted && hasExplanation && { color: theme.colors.primary },
          !isModalHighlighted && isSelected && hasExplanation && { color: theme.colors.primary },
        ];

        return (
          <React.Fragment key={`${tokenKey}-${index}`}>
            {shouldAddSpaceBefore(token, index) && ' '}
            <Text  {/* 内层Text：处理token交互和样式 */}
              style={tokenTextStyle}
              onPress={hasExplanation ? () => actions.showTokenExplanation(token, state.currentSentence?.index ?? 0) : undefined}
              suppressHighlighting={true}  {/* 去掉点击动画 */}
            >
              {token.text}
            </Text>
          </React.Fragment>
        );
      })}
    </Text>
  );
}
```

**SubtitleNavigationControls** - 纯控制组件：
```typescript
// 完全依赖Context，零外部依赖
export function SubtitleNavigationControls() {
  const { state, actions } = useSubtitleDisplayContext();

  return (
    <View>
      <Button onPress={actions.goToPrevious} disabled={!state.hasPrevious} />
      <Button onPress={actions.goToNext} disabled={!state.hasNext} />
    </View>
  );
}
```

## 智能导航算法

**goToPrevious智能逻辑** (优化版):
```
用户按"上一句"时:
├─ 计算: timeDifference = currentTime - sentence.start
├─ 如果 timeDifference >= 1.5秒
│  └─ 跳转到当前句子开始 (重听当前句子)
├─ 如果 timeDifference < 1.5秒 且 有上一句
│  └─ 跳转到真正的上一句开始
└─ 如果没有上一句
   └─ 跳转到视频开头 (0秒)
```

**goToNext逻辑**:
```
用户按"下一句"时:
├─ 如果有下一句
│  └─ 跳转到下一句开始
└─ 如果没有下一句
   └─ 什么也不做 (保持当前位置)
```

**用户体验优化**:
- 📍 **句子中后段** - 按上一句 → 回到当前句子开始（重听）
- 📍 **句子开始附近** - 按上一句 → 跳到真正的上一句
- 📍 **边界处理** - 无上一句时跳开头，无下一句时保持不动
- 🎯 **符合直觉** - 类似Spotify等音频应用的导航体验
- 🎮 **手势集成** - 支持通过视频播放器左右双击手势调用

## 数据流架构 (v3.2 条件订阅模式)

```
Entities Layer (外部依赖)
├─ Video Entity: useConditionalCurrentTime(isActiveVideo) - 条件订阅
├─ Subtitle Entity: getSentenceAtTime(秒), currentSubtitle
├─ Global Settings: showSubtitles
└─ Modal System: useModal, openModal, ElementExplanationModal

          ↓ (双Hook解耦)

useSubtitleNavigation Hook (独立导航)
├─ useConditionalCurrentTime(isActiveVideo) - 条件订阅
├─ 智能导航算法（1.5秒判断）
└─ 返回: { goToPrevious, goToNext }

          ↓

IntegratedSubtitleView (Context Provider)
├─ useSubtitleDisplay Hook (显示状态)
│  ├─ useSubtitleNavigation(playerInstance, true)
│  ├─ 订阅entities状态
│  ├─ 纯计算显示状态
│  └─ Token交互管理
└─ SubtitleDisplayProvider (Context分发)

          ↓ (Context消费)

UI Components (纯Context消费者)
├─ SubtitleDisplay: 字幕文本显示
└─ SubtitleNavigationControls: 导航控制按钮

         ↓ (动作触发)

导航动作执行: seekVideo(playerInstance, timeSeconds) → Video Player
```

### Context数据流模式

**单向数据流**：
1. **Entities** → 提供原始状态数据
2. **useSubtitleDisplay** → 纯计算转换为显示状态
3. **Context** → 统一分发状态和动作
4. **UI Components** → 消费Context，触发动作
5. **动作执行** → 回调到Entities，形成闭环

**零中间状态**：所有UI状态都是基于entities的实时计算，无本地状态存储，确保数据一致性。

## Video Control Overlay Hand Gesture Integration

### 跨Feature手势集成架构v3.0
字幕导航功能与视频控制覆盖层的手势系统深度集成：

```typescript
// video-control-overlay 手势集成
const { tapGesture, seekFeedbackTrigger } = useOverlayGesture({
  subtitleNavigation: { // 字幕导航功能注入
    goToPrevious,    // 智能上一句导航
    goToNext,        // 下一句导航
    hasPrevious,     // 上一句可用性
    hasNext          // 下一句可用性
  },
  onLongPress: handleLongPress,
});
```

**集成优势**:
- **智能集成优先级**: 字幕导航优先于时间跳转的备用机制
- **视觉反馈统一**: 左右分布式动画显示"上一句/下一句"
- **手势语义化**: 双击左侧=上一句，双击右侧=下一句
- **状态协调**: 手势可用性基于字幕导航状态动态确定

### 手势交互模式
**双击导航模式**:
```typescript
// 双击左侧视频区域：智能上一句
if (isLeftSide && subtitleNavigation?.hasPrevious) {
  subtitleNavigation.goToPrevious();
  showFeedback('上一句', 'left');
}

// 双击右侧视频区域：下一句
if (!isLeftSide && subtitleNavigation?.hasNext) {
  subtitleNavigation.goToNext();
  showFeedback('下一句', 'right');
}
```

**Fallback机制**:
- 当字幕导航不可用时，自动降级到时间跳转模式
- 保持用户交互的一致性和预期性
- 渐进式功能增强，向后兼容

### 语义化手势设计
**空间映射逻辑**:
- **左侧区域** = "前进到过去" = 上一句/回退10秒
- **右侧区域** = "前进到未来" = 下一句/前进10秒
- **中央区域** = 播放/暂停控制

**视觉反馈系统**:
- 即时动画反馈显示操作结果
- 左右分布式显示增强空间认知
- 智能文本显示："上一句"/"下一句"或"±10秒"

## 性能优化特征

**时间单位统一性能**:
```typescript
// 优化前（需要转换）
const currentTimeMs = currentTime * 1000;
const currentSentence = getSentenceAtTime(currentTimeMs);
seekToTime(sentence.start / 1000);

// 优化后（零转换）
const currentSentence = getSentenceAtTime(currentTime);
seekToTime(sentence.start);
```

**性能提升**:
- ✅ **零转换开销** - 消除6处`*1000`和`/1000`运算
- ✅ **精度保障** - 避免浮点数转换精度丢失
- ✅ **代码简化** - 减少20+行单位转换代码

**计算优化** (v2.1算法优化):
- **纯函数式状态** - 基于当前时间的纯计算，无副作用
- **指针优化集成** - 利用entities/subtitle的O(1)搜索性能
- **条件渲染** - 仅在必要时进行计算和渲染
- **索引缓存** - 预计算前后句子索引(_prevIndex, _nextIndex)，减少重复计算
- **算法复杂度优化** - 从O(2n)优化到O(n)，避免重复循环

## 组件集成方案 (v2.0 Context架构)

### 标准集成模式（推荐）

**完整集成** - IntegratedSubtitleView：
```typescript
// 最简单的使用方式 - 包含所有功能
<IntegratedSubtitleView
  config={{
    enabled: true,
    showNavigationControls: true,
    fontSize: 18,
    position: 'bottom'
  }}
  containerStyle={{ zIndex: 10 }}
/>
```

**自定义样式集成**：
```typescript
<IntegratedSubtitleView
  config={{ showNavigationControls: true }}
  containerStyle={styles.subtitleContainer}
  subtitleStyle={styles.customSubtitle}
  controlsStyle={styles.customControls}
/>
```

### 高级自定义集成

**使用Context Provider模式**：
```typescript
// 自定义Provider使用
function CustomSubtitleSection() {
  const { state, actions, config } = useSubtitleDisplay({
    fontSize: 20,
    showNavigationControls: false
  });

  const contextValue = useMemo(() => ({
    state, actions, config, theme
  }), [state, actions, config, theme]);

  return (
    <SubtitleDisplayProvider value={contextValue}>
      {/* 自定义布局 */}
      <View style={customLayout}>
        <SubtitleDisplay />
        {/* 自定义控件 */}
        <CustomNavigationControls />
      </View>
    </SubtitleDisplayProvider>
  );
}
```

**纯组件复用**：
```typescript
// 在已有Context内复用组件
function VideoPlayerWithSubtitles() {
  return (
    <IntegratedSubtitleView config={{ showNavigationControls: false }}>
      <VideoPlayer />

      {/* 在任意位置使用字幕组件 */}
      <View style={styles.overlay}>
        <SubtitleDisplay />

        {/* 自定义布局的导航控件 */}
        <View style={styles.customNav}>
          <SubtitleNavigationControls config={{ showLabels: true }} />
        </View>
      </View>
    </IntegratedSubtitleView>
  );
}
```

### 架构优势总结

**v2.0 Context架构创新**：
- **单点耦合**：只有 `IntegratedSubtitleView` 与entities耦合，其他组件完全解耦
- **Context分发**：统一的数据和方法分发，避免prop drilling
- **组件纯净**：`SubtitleDisplay` 和 `SubtitleNavigationControls` 成为纯Context消费者
- **灵活集成**：支持完整集成、自定义Provider、纯组件复用多种模式

## 配置系统

**运行时配置**:
```typescript
interface SubtitleDisplayConfig {
  enabled: boolean;
  position: 'top' | 'center' | 'bottom';
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  showNavigationControls: boolean;
  enableClickToSeek: boolean;
}
```

**响应式支持** - 根据屏幕方向和播放模式自动调整字体大小和边距。

## 换行问题解决方案 (v3.1)

### 问题背景

**核心问题**: 在token级渲染中，标点符号可能在自动换行时出现在新行的开头，破坏阅读体验：
```
❌ 错误效果：
[The] [Trump administration] [deporting]
[.] [hundreds of men] [without] [a] [trial]
 ↑ 标点符号独立成行，视觉不佳
```

### 解决方案演进

**v3.0 TouchableOpacity + Flex方案**:
- 使用`flexDirection: 'row'` + `flexWrap: 'wrap'`
- 通过`marginLeft: -2`让标点符号贴近前面的单词
- **问题**: 负margin在React Native中支持不稳定

**v3.1 Text嵌套方案** (最终采用):
- 外层Text组件处理整体文本流和换行
- 内层Text组件处理每个token的交互和样式
- 利用React Native原生Text换行算法

### 核心实现

**架构设计**:
```typescript
// 双层Text结构
<Text style={baseTextStyle}>           // 外层：整体布局
  {tokens.map((token, index) => (
    <Fragment key={token.id}>
      {shouldAddSpaceBefore(token, index) && ' '}
      <Text                            // 内层：token交互
        onPress={hasExplanation ? onPress : undefined}
        suppressHighlighting={true}    // 关键：去掉点击动画
      >
        {token.text}
      </Text>
    </Fragment>
  ))}
</Text>
```

**技术细节**:
1. **原生Text换行**: React Native自动处理标点符号换行逻辑
2. **suppressHighlighting**: 关闭点击时的灰色背景动画
3. **空格逻辑保持**: 继续使用`shouldAddSpaceBefore`函数
4. **交互完整性**: 每个token保持独立的onPress事件

### 优势对比

| 特性 | TouchableOpacity方案 | Text嵌套方案 |
|------|---------------------|-------------|
| 换行控制 | 依赖负margin hack | 原生Text换行算法 |
| 兼容性 | Flex布局可能失效 | React Native原生支持 |
| 点击动画 | activeOpacity控制 | suppressHighlighting |
| 代码复杂度 | 需要自定义样式 | 简洁的嵌套结构 |
| 维护性 | 依赖hack方案 | 标准React Native模式 |
| **综合评价** | ⚠️ 可用但不稳定 | ✅ **最优解** |

## Token级交互系统 (v3.1)

### 核心功能

**可点击Token判断**:
```typescript
// 基于explanation字段判断是否可点击
export function isClickableToken(token: SubtitleToken): boolean {
  return Boolean(token.explanation?.trim());
}
```

**智能空格处理**:
```typescript
// 标点符号前不加空格，其他token前加空格
export function shouldAddSpaceBefore(token: SubtitleToken, index: number): boolean {
  if (index === 0) return false;

  const punctuation = ['.', ',', '!', '?', ';', ':', ')', ']', '}', '"', "'"];
  if (punctuation.includes(token.text?.trim() || '')) {
    return false;
  }

  return true;
}
```

**统一容器对齐**:
```typescript
// 所有token使用相同的TouchableOpacity容器确保完美对齐
function TokenContainer({ token, isSelected, onPress, isClickable }) {
  return (
    <TouchableOpacity
      disabled={!isClickable}
      onPress={isClickable ? onPress : undefined}
      activeOpacity={isClickable ? 0.7 : 1}
      hitSlop={isClickable ? { top: 4, bottom: 4, left: 2, right: 2 } : { top: 0, bottom: 0, left: 0, right: 0 }}
    >
      <Text style={[baseStyle, isSelected && isClickable && { color: theme.colors.primary }]}>
        {token.text}
      </Text>
    </TouchableOpacity>
  );
}
```

### 交互逻辑

**选中状态管理**:
- 使用`Set<SubtitleTokenKey>`存储选中的token标识（优先使用semanticElement.id，缺失时回退到句子索引+token索引）
- 支持toggle操作：点击选中/取消选中
- 选中时显示蓝色（`theme.colors.primary`），未选中时显示原色

**数据结构匹配**:
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

**渲染输出示例**:
```
原始: "The Trump administration deporting hundreds of men without a trial."
渲染: [The] [Trump administration] [deporting] [hundreds of men] [without] [a] [trial][.]
      ↑白色  ↑可点击/蓝色    ↑可点击      ↑可点击        ↑可点击  ↑白色 ↑可点击 ↑白色不可点击
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

## 高级技术实现细节

### 连续导航问题解决方案 (v2.2 关键架构优化)

**问题诊断**:
连续双击导航时出现跳转到视频开头的bug，根本原因是React Hook状态更新的异步特性：

```typescript
// 问题：连续调用时currentTime状态未及时更新
const realTimeCurrentSentence = getSentenceAtTime(currentTime); // 获取过时的currentTime
baseIndex = realTimeCurrentSentence?.index ?? -1; // 基于过时时间计算错误索引
```

**技术方案对比**:

| 方案 | 原理 | 优势 | 缺陷 | 结果 |
|------|------|------|------|------|
| 复杂状态管理 | 额外状态变量追踪导航位置 | 状态独立管理 | 状态同步复杂，容易不一致 | ❌ 失败 |
| 实时计算 | 直接计算当前时间对应句子 | 减少状态依赖 | 仍依赖过时的currentTime | ❌ 失败 |
| **简化ref追踪** | useRef记录导航位置，防抖清除 | **零状态同步问题，简洁可靠** | 需要理解ref模式 | ✅ **成功** |

### 最终解决方案：简化导航索引追踪

**核心技术架构**:
```typescript
// 关键ref：记录最后一次导航到的句子索引
const lastNavigationIndexRef = useRef<number | null>(null);
// 清除计时器ref：防抖清除导航索引
const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// 防抖清除机制：避免连续导航时过早清除
const scheduleNavigationClear = useCallback(() => {
  // 清除之前的计时器
  if (clearTimeoutRef.current) {
    clearTimeout(clearTimeoutRef.current);
  }
  // 设置2秒延时清除，确保连续操作不被中断
  clearTimeoutRef.current = setTimeout(() => {
    lastNavigationIndexRef.current = null;
    clearTimeoutRef.current = null;
    log('subtitle-display', LogType.DEBUG, 'Navigation index cleared after timeout');
  }, 2000);
}, []);
```

**智能索引切换逻辑**:
```typescript
// 确定起始索引：优先使用上次导航的位置，fallback到时间计算
let baseIndex: number;
if (lastNavigationIndexRef.current !== null) {
  // 导航模式：使用记录的位置（解决连续导航问题）
  baseIndex = lastNavigationIndexRef.current;
  log('subtitle-display', LogType.DEBUG, `Using last navigation index: ${baseIndex}`);
} else {
  // 时间模式：基于当前播放时间计算（正常播放时的导航）
  const realTimeCurrentSentence = getSentenceAtTime(currentTime);
  baseIndex = realTimeCurrentSentence?.index ?? -1;
  log('subtitle-display', LogType.DEBUG, `Using time-based index: ${baseIndex}`);
}
```

**关键技术优势**:
1. **零状态同步** - useRef不触发重渲染，避免React状态更新延迟
2. **防抖清除** - 2秒缓冲期避免快速操作时的状态清除
3. **双模式切换** - 自动在导航模式和时间模式间无缝切换
4. **日志追踪** - 完整的调试日志便于问题排查

### React Hook时序问题深度分析

**异步状态更新本质**:
```typescript
// 问题场景重现
seek(nextSentence.start);  // 立即更新播放时间
// 但currentTime状态要等到下次渲染才更新！

// 下一次双击时：
getSentenceAtTime(currentTime); // 仍然是上一次的旧值！
```

**传统方案失败原因**:
- **状态依赖链**: 任何依赖currentTime的方案都会受到状态更新延迟影响
- **时序竞争**: 用户操作速度快于React状态更新频率
- **闭包陷阱**: useCallback依赖的值可能过时

**ref方案成功原理**:
- **即时更新**: `ref.current = value` 立即生效，不等渲染周期
- **共享引用**: 所有函数访问同一个ref引用，避免闭包问题
- **防抖保护**: 计时器机制防止快速操作时的状态清除

### 触觉反馈集成技术

**expo-haptics库集成**:
```typescript
import * as Haptics from 'expo-haptics';

// 轻量级选择反馈（字幕导航）
Haptics.selectionAsync();

// 中等强度冲击反馈（按钮交互）
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

**触觉反馈层级系统**:
1. **Light**: 最轻微，适合频繁操作
2. **Soft**: 柔和，适合选择操作
3. **Medium**: 中等，适合确认操作
4. **Heavy**: 强烈，适合重要操作
5. **Rigid**: 刚性，适合错误提示

**集成位置策略**:
- **双击导航**: `selectionAsync()` - 频繁使用，选择轻量
- **按钮交互**: `impactAsync(Medium)` - 明确反馈，选择中等
- **错误处理**: 保留，可用`impactAsync(Heavy)`

## 技术亮点

**架构创新**:
- **简化ref追踪** - 解决React Hook时序问题的最优方案，零状态同步复杂度
- **防抖清除机制** - 2秒缓冲期确保连续操作的流畅性
- **双模式智能切换** - 导航模式与时间模式的无缝切换
- **Text嵌套渲染** - Text组件双层结构，解决换行问题的同时保持完整交互
- **原生换行算法** - 利用React Native原生Text换行，零hack方案
- **Token级交互** - 支持单词级别的精确点击控制和状态管理
- **完全无状态** - 零状态管理，完全依赖上游数据源
- **纯函数式** - 所有计算都是纯函数，便于测试和调试
- **自动同步** - 订阅式设计，自动响应播放状态变化

**用户体验**:
- **智能导航** - 1.5秒阈值的智能上一句逻辑
- **连续操作保障** - 解决快速双击导航的跳转问题
- **触觉反馈集成** - 分层级的触觉反馈增强交互体验
- **精确交互** - 单词级别的点击和选中反馈
- **原生换行** - 标点符号永远不会出现在新行开头
- **无动画干扰** - suppressHighlighting去掉点击时的灰色背景
- **流畅交互** - 保持完整的token独立点击功能

**性能特征**:
- **O(1)搜索** - 集成entities/subtitle的指针优化搜索
- **零转换** - 完全消除时间单位转换开销
- **原生渲染** - 基于React Native原生Text组件，性能最优
- **零hack开销** - 不使用负margin、transform等性能消耗方案
- **边界安全** - 完善的空值和异常情况处理
- **即时响应** - ref机制确保用户操作的即时响应
