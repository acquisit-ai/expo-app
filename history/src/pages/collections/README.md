# Collections Pages (单词本页面)

## 概述

单词本页面模块负责管理用户收藏的单词、学习进度跟踪，以及个人词汇库的组织和展示。

## 页面结构

### CollectionsPage (单词本页面)
- **文件**: `ui/CollectionsPage.tsx`
- **功能**: 展示用户收藏的单词列表和学习进度
- **状态**: 当前为基础页面框架，等待功能实现

## 当前实现

### 基础框架
```typescript
export function CollectionsPage() {
  const { theme } = useTheme();

  return (
    <TabPageLayout>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={titleStyle}>
          单词本
        </Text>
        {/* 这里可以添加单词本相关的内容 */}
      </View>
    </TabPageLayout>
  );
}
```

### 现有特性
- **主题集成**: 使用 `useTheme` hook 获取当前主题
- **标准布局**: 基于 `TabPageLayout` 的一致布局
- **标题显示**: 居中显示的页面标题

## 计划功能架构

### 核心功能模块

#### 1. 单词收藏管理
- **添加单词**: 从学习页面或搜索中收藏单词
- **删除单词**: 移除不需要的单词
- **批量操作**: 支持批量删除、移动等操作
- **同步机制**: 与服务器端单词库同步

#### 2. 单词展示系统
- **列表视图**: 紧凑的单词列表展示
- **卡片视图**: 详细的单词卡片显示
- **搜索功能**: 在个人单词本中搜索
- **排序选项**: 按时间、字母、难度排序

#### 3. 学习进度跟踪
- **掌握状态**: 未学习、学习中、已掌握
- **复习提醒**: 基于遗忘曲线的复习计划
- **学习统计**: 每日学习量、掌握进度等
- **视觉化展示**: 进度条、图表等

#### 4. 分类组织系统
- **自定义分类**: 用户创建的词汇分类
- **标签系统**: 多标签支持(难度、主题等)
- **智能分组**: 基于词性、难度自动分组
- **快速筛选**: 多维度筛选功能

### 数据结构设计

#### Word Entity
```typescript
interface Word {
  id: string;
  word: string;              // 单词本体
  phonetic: string;          // 音标
  pronunciation_url?: string; // 发音音频URL
  definitions: Definition[]; // 词义列表
  examples: Example[];       // 例句
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];           // 标签
  created_at: Date;         // 收藏时间
  updated_at: Date;         // 最后更新时间
}

interface Definition {
  part_of_speech: string;   // 词性 (noun, verb, etc.)
  meaning: string;          // 中文释义
  english_definition?: string; // 英文释义
}

interface Example {
  sentence: string;         // 例句
  translation: string;     // 中文翻译
  source?: string;         // 来源
}
```

#### Learning Progress
```typescript
interface WordProgress {
  word_id: string;
  user_id: string;
  status: 'new' | 'learning' | 'mastered';
  review_count: number;     // 复习次数
  correct_count: number;    // 正确次数
  last_reviewed: Date;      // 最后复习时间
  next_review: Date;        // 下次复习时间
  mastery_level: number;    // 掌握程度 (0-100)
}
```

### UI组件规划

#### WordCard 组件
```typescript
interface WordCardProps {
  word: Word;
  progress?: WordProgress;
  onPress: (word: Word) => void;
  onStar: (word: Word) => void;
  onDelete: (word: Word) => void;
  variant?: 'compact' | 'detailed';
}
```

#### CollectionsList 组件
```typescript
interface CollectionsListProps {
  words: Word[];
  progress: Record<string, WordProgress>;
  viewMode: 'list' | 'grid';
  sortBy: 'date' | 'alphabetical' | 'difficulty';
  filterBy: WordFilter;
  onWordAction: (action: WordAction, word: Word) => void;
}
```

#### SearchBar 组件
```typescript
interface SearchBarProps {
  value: string;
  onSearch: (query: string) => void;
  onFilter: (filters: WordFilter) => void;
  placeholder?: string;
}
```

### 布局系统设计

#### 响应式布局
```typescript
// 与其他页面保持一致的响应式系统
const { width: screenWidth } = Dimensions.get('window');
const dynamicGap = screenWidth * 0.05;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: dynamicGap,
    paddingBottom: dynamicGap,
    paddingHorizontal: 16,
  },
  contentContainer: {
    gap: dynamicGap,
  },
  // ... 其他样式
});
```

#### 工具栏区域
- **搜索栏**: 顶部搜索和筛选
- **视图切换**: 列表/网格视图切换
- **排序选项**: 下拉或模态选择器
- **批量操作**: 选择模式工具栏

### 状态管理架构

#### Collections Store (Zustand)
```typescript
interface CollectionsState {
  // 数据状态
  words: Word[];
  progress: Record<string, WordProgress>;
  categories: Category[];

  // UI状态
  viewMode: 'list' | 'grid';
  sortBy: SortOption;
  filterBy: FilterOption;
  searchQuery: string;
  selectedWords: Set<string>;

  // 操作方法
  addWord: (word: Word) => void;
  removeWord: (wordId: string) => void;
  updateProgress: (wordId: string, progress: Partial<WordProgress>) => void;
  searchWords: (query: string) => void;
  filterWords: (filters: FilterOption) => void;
  // ... 其他方法
}
```

#### API集成
```typescript
// collections/api/collectionsApi.ts
export const collectionsApi = {
  fetchUserWords: async (userId: string): Promise<Word[]> => {},
  addWordToCollection: async (userId: string, word: Word): Promise<void> => {},
  removeWordFromCollection: async (userId: string, wordId: string): Promise<void> => {},
  updateWordProgress: async (userId: string, progress: WordProgress): Promise<void> => {},
  syncCollections: async (userId: string): Promise<void> => {},
};
```

### 学习功能集成

#### 复习系统
- **间隔重复算法**: 基于SM-2或类似算法
- **复习队列**: 今日需要复习的单词
- **复习模式**: 拼写、选择、听力等多种模式
- **进度反馈**: 实时学习效果反馈

#### 测试功能
- **快速测试**: 随机选择单词进行测试
- **分类测试**: 按分类或标签测试
- **错误回顾**: 错误单词的集中复习
- **成绩统计**: 测试结果和改进建议

### 集成依赖

#### 内部依赖
- `@/entities/user` - 用户状态管理
- `@/shared/ui` - UI组件库 (BlurCard, BlurList等)
- `@/shared/providers/ThemeProvider` - 主题系统
- `@/shared/lib/logger` - 日志记录
- `@/features/word-management` - 单词管理功能 (待创建)

#### 外部依赖
- `react-native-paper` - UI组件和主题
- `@expo/vector-icons` - 图标库
- `@react-navigation/native` - 导航系统
- `react-native-sound` - 音频播放 (发音功能)

### 性能优化策略

#### 数据优化
- **虚拟列表**: 大量单词的高效渲染
- **分页加载**: 按需加载单词数据
- **缓存策略**: 本地缓存常用数据
- **离线支持**: 离线模式下的功能可用性

#### 渲染优化
- **React.memo**: 单词卡片组件优化
- **useMemo/useCallback**: 计算和事件处理优化
- **图片懒加载**: 单词图片的按需加载

## 实现优先级

### Phase 1: 基础功能
1. 单词列表展示
2. 基础的添加/删除功能
3. 简单的搜索功能
4. 与学习页面的集成

### Phase 2: 核心功能
1. 学习进度跟踪
2. 分类和标签系统
3. 复习提醒机制
4. 统计和分析功能

### Phase 3: 高级功能
1. 智能复习算法
2. 多种学习模式
3. 社交功能 (分享、竞赛等)
4. 数据导入/导出

## 注意事项

- **数据同步**: 确保多设备间的数据一致性
- **离线功能**: 关键功能的离线可用性
- **性能监控**: 大数据量下的性能表现
- **用户体验**: 直观的交互设计和反馈机制