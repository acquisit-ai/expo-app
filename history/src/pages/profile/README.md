# Profile Pages (个人资料页面)

## 概述

个人资料页面模块负责展示用户信息、提供个人设置功能，以及用户账户相关的操作入口。

## 页面结构

### ProfilePage (个人资料页面)
- **文件**: `ui/ProfilePage.tsx`
- **功能**: 用户信息展示、功能导航、主题设置、账户管理
- **布局**: 响应式垂直布局，使用BlurCard组件系统

## 核心功能

### 用户信息展示
- **头像显示**: 支持用户上传头像或默认头像
- **用户名显示**: 优先级顺序
  1. `username` (用户设置的用户名)
  2. `full_name` (完整姓名)
  3. `email前缀` (邮箱@前部分)
  4. `"User"` (默认值)
- **邮箱显示**: 显示用户当前邮箱地址

### 功能导航菜单
- **编辑个人资料**: 跳转到个人信息编辑页面
- **学习统计**: 显示学习进度和统计数据
- **我的词汇本**: 个人收藏的单词列表
- **设置**: 应用设置和偏好配置

### 主题系统集成
- **主题切换器**: `ThemeToggle` 组件
- **即时预览**: 主题变化实时生效
- **持久化存储**: 主题偏好自动保存

### 帮助和支持
- **意见反馈**: 用户反馈收集入口
- **关于应用**: 应用信息和版本详情

### 账户管理
- **退出登录**: 带确认对话框的安全退出
- **状态清理**: 完整的本地状态清理

## 技术实现

### 数据获取策略
```typescript
// 使用 entities/user 的 selectors
const userEmail = useUserEmail();
const userProfile = useUserProfile();

// 派生用户显示信息
const displayName = userProfile?.user_metadata?.username ||
                   userProfile?.user_metadata?.full_name ||
                   userEmail?.split('@')[0] ||
                   'User';
```

### 响应式布局系统
```typescript
const { width: screenWidth } = Dimensions.get('window');
const dynamicGap = screenWidth * 0.05; // 屏幕宽度的5%

// 布局结构
<View style={styles.container}>
  <View style={styles.contentContainer}>
    {/* 内容区域使用动态间距 */}
  </View>
</View>
```

### 内存安全模式
```typescript
const isMountedRef = useRef(true);

// AuthOperations 内存安全配置
const authOperations = new AuthOperations({
  isMountedRef,
  setAuthState: () => {} // Profile页面不需要管理认证状态
});

// 组件卸载清理
React.useEffect(() => {
  return () => {
    isMountedRef.current = false;
  };
}, []);
```

### 退出登录流程
```typescript
const handleLogout = () => {
  Alert.exit(
    '确认退出',
    '确定要退出登录吗？',
    async () => {
      await signOut();
      // 退出登录后，清空导航栈，回到登录页
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'AuthStack' }],
        })
      );
    }
  );
};
```

## UI组件架构

### BlurCard组件系统
- **用户信息卡片**: 头像 + 用户信息展示
- **功能列表卡片**: `BlurList` 组件展示导航菜单
- **主题设置卡片**: 独立的主题切换区域
- **帮助支持卡片**: `BlurList` 组件展示帮助选项

### 图标系统
- **Ionicons 集成**: 统一的图标风格
- **主题感知**: 图标颜色跟随主题变化
- **语义化命名**: 图标选择符合功能语义

### 样式系统
```typescript
// 动态样式计算
const usernameStyle = {
  fontSize: 24,
  fontWeight: '600' as const,
  color: theme.colors.textMedium,
};

// 响应式间距
avatar: {
  marginRight: dynamicGap * 0.8, // 动态间距的80%
},
```

## 功能列表详情

### 个人资料功能
```typescript
const profileFunctionItems: BlurListItem[] = [
  {
    id: 'edit-profile',
    title: '编辑个人资料',
    icon: <Ionicons name="person-outline" />,
    onPress: () => {/* TODO: 导航到编辑页面 */}
  },
  // ... 其他功能项
];
```

### 帮助支持功能
```typescript
const helpItems: BlurListItem[] = [
  {
    id: 'feedback',
    title: '意见反馈',
    icon: <Ionicons name="chatbubble-outline" />,
    onPress: () => {/* TODO: 打开反馈功能 */}
  },
  // ... 其他帮助项
];
```

## 布局规范

### 响应式间距系统
- **容器间距**: `paddingTop: dynamicGap`，`paddingBottom: dynamicGap`
- **内容间距**: `gap: dynamicGap` (自动管理组件间距)
- **头像间距**: `marginRight: dynamicGap * 0.8` (相对比例调整)
- **主题标题间距**: `marginBottom: dynamicGap * 0.6`

### 宽度管理
- **容器宽度**: `width: '100%'` (全屏宽度)
- **内容居中**: `alignItems: 'center'` (中心对齐)
- **按钮宽度**: `width: '90%'` (与medium变体一致)

## 集成和依赖

### 核心依赖
- `@/entities/user` - 用户状态和数据
- `@/features/auth` - 认证操作 (仅用于退出登录)
- `@/features/theme-toggle` - 主题切换组件
- `@/shared/ui` - UI组件库 (BlurCard, BlurList, Alert等)

### 外部依赖
- `@react-navigation/native` - 核心导航
- `react-native-paper` - 主题系统
- `@expo/vector-icons` - 图标库

### Provider集成
- `ThemeProvider` - 主题状态管理
- `BlurProvider` - 模糊效果配置
- 用户状态通过selectors自动同步

## 安全和性能

### 内存安全
- 组件卸载状态跟踪
- 异步操作中的挂载状态检查
- AuthOperations实例的安全配置

### 性能优化
- 动态样式对象缓存
- 图片组件的自动缓存机制
- 主题变化时的渲染优化

## 待实现功能

1. **编辑个人资料页面**: 用户信息编辑功能
2. **学习统计页面**: 学习进度和数据分析
3. **我的词汇本页面**: 个人单词收藏管理
4. **设置页面**: 应用偏好和配置选项
5. **意见反馈系统**: 用户反馈收集和处理
6. **关于应用页面**: 版本信息和帮助文档