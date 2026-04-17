# Pages Architecture Documentation

*This file documents the page-level architecture, navigation system, and routing implementation within `/src/pages/` and `/app/`.*

## Pages Architecture

### **Routing Strategy (Expo Router)**
- **File-Based Routing**: App routing follows `app/` directory structure
- **Feature-Page Separation**: Business logic in `src/pages/`, routing wrappers in `app/`
- **Tab Navigation**: Bottom tab layout with three main screens
- **Modal Support**: Overlay modal system with stack navigation

### **Page Organization Pattern**
```
src/pages/
├── auth/              # 认证模块
│   ├── ui/
│   │   ├── LoginPage.tsx       # 登录页面组件
│   │   ├── PasswordManagePage.tsx  # 密码管理页面组件
│   │   ├── VerifyCodePage.tsx  # 验证码页面组件
│   │   ├── AuthPageLayout.tsx  # 认证页面通用布局组件
│   │   └── index.ts            # UI组件导出
│   └── index.ts               # 认证模块导出
├── learning/           # 学习模块
│   ├── ui/
│   │   └── LearningPage.tsx    # 主页面组件
│   └── index.ts               # 模块导出
├── collections/        # 单词本模块  
│   ├── ui/
│   │   └── CollectionsPage.tsx # 主页面组件
│   └── index.ts               # 模块导出
├── profile/           # 个人中心模块
│   ├── ui/
│   │   └── ProfilePage.tsx    # 主页面组件
│   └── index.ts               # 模块导出
└── index.ts           # 所有页面统一导出
```

### **Routing Layer (app/ directory)**
```
app/
├── _layout.tsx        # 根布局 + ThemeProvider + AuthProvider
├── index.tsx          # 认证路由控制器
├── modal.tsx          # 示例模态页面
├── video-player.tsx   # 视频播放页面
└── (tabs)/           # Tab导航分组
    ├── _layout.tsx    # Tab导航配置
    ├── collections.tsx # 单词本路由入口
    ├── learn.tsx      # 学习页面路由入口
    └── profile.tsx    # 个人中心路由入口
```

### **Authentication-Based Routing**
`app/index.tsx` 使用框架原生机制实现简洁的认证路由控制：

```typescript
// 认证路由控制逻辑 - 极简哲学版本
export default function Index() {
  const { session, isInitializing } = useAuth();

  // 加载中：显示加载界面
  if (isInitializing) {
    return <LoadingScreen />;
  }

  // 未登录：显示登录页面
  if (!session) {
    return <LoginPage />;
  }

  // 已登录：使用 Expo Router 原生重定向组件
  // 框架会自动处理导航时机、状态管理、内存清理等所有问题
  return <Redirect href="/(tabs)/learn" />;
}
```

**路由控制特性**：
- **框架原生**: 利用 Expo Router 的 `<Redirect>` 组件，无需手动状态管理
- **简洁设计**: 32行代码替代之前127行的复杂导航管理逻辑
- **自动处理**: 框架自动管理导航时机、内存清理和状态同步
- **状态驱动**: 基于 AuthProvider 的认证状态进行界面渲染
- **无副作用**: 无需防重复导航、定时器管理或手动清理

## Implementation Patterns

### **Page Component Architecture**
```typescript
// 标准页面组件结构
import { Container, H1, Body, Button } from '@/shared/ui';
import { useTheme } from '@/shared/providers/ThemeProvider';

export function PageComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Container safe padding="lg">
      <H1>页面标题</H1>
      <Body>页面内容</Body>
      {/* UI组件组合 */}
    </Container>
  );
}
```

### **Authentication Page Architecture**
认证页面采用统一的`AuthPageLayout`组件架构，提供一致的玻璃态设计体验：

```typescript
// src/pages/auth/ui/AuthPageLayout.tsx - 通用认证布局组件
import { AuthPageLayout } from './AuthPageLayout';
import { AuthLoginCard, AuthEmailCodeCard, AuthResetPasswordCard } from '@/features/auth';

// 所有认证页面使用统一布局
export function LoginPage() {
  return (
    <AuthPageLayout>
      <AuthLoginCard />
    </AuthPageLayout>
  );
}

// AuthPageLayout内部实现
export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  const { isDark } = useTheme();
  const { config } = useGlass();
  
  const backgroundColors = isDark
    ? config.backgrounds.midnight
    : config.backgrounds.aurora;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={backgroundColors}>
        <SafeAreaView style={{ flex: 1 }}>
          <GlassCard widthRatio={0.95}>
            {children}
          </GlassCard>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}
```

**认证布局架构特性**：
- **统一布局组件**: `AuthPageLayout`提供认证页面通用布局模式，确保界面一致性
- **玻璃态集成**: 完整的glassmorphism设计，支持主题感知的渐变背景（aurora/midnight）
- **键盘交互**: 内置`TouchableWithoutFeedback`和`Keyboard.dismiss`，优化移动端输入体验
- **安全区域支持**: 自动处理不同设备的安全区域，确保内容正确显示
- **响应式容器**: `GlassCard`使用0.95宽度比例，在不同屏幕尺寸下保持最佳显示效果
- **组合模式**: 认证页面通过children属性注入具体表单内容，保持组件职责清晰分离

### **FSD页面模块结构**
```typescript
// src/pages/feature-name/index.ts - 导出模式
export { FeaturePage } from './ui/FeaturePage';

// app/(tabs)/feature.tsx - 路由连接
import { FeaturePage } from '@/pages/feature-name';
export default FeaturePage;
```

### **Tab Navigation Configuration**
```typescript
// app/(tabs)/_layout.tsx - 导航配置
<Tabs
  screenOptions={{
    tabBarStyle: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      height: 84,
    },
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textSecondary,
  }}
>
  <Tabs.Screen name="collections" options={{ title: "单词本" }} />
  <Tabs.Screen name="learn" options={{ title: "学习" }} />  
  <Tabs.Screen name="profile" options={{ title: "我的" }} />
</Tabs>
```

## Key Files and Structure

### **Current Page Implementations**
| Page | Path | Purpose | Key Features |
|------|------|---------|--------------|
| **登录页面** | `src/pages/auth/ui/LoginPage.tsx` | 用户认证入口 | AuthPageLayout集成、社交登录、统一玻璃态界面 |
| **验证码页面** | `src/pages/auth/ui/VerifyCodePage.tsx` | OTP验证流程 | AuthPageLayout集成、8状态状态机、智能路由、冷却保护 |
| **密码管理页面** | `src/pages/auth/ui/PasswordManagePage.tsx` | 密码设置/重置 | AuthPageLayout集成、密码强度验证、模式切换 |
| **认证布局组件** | `src/pages/auth/ui/AuthPageLayout.tsx` | 认证页面通用布局 | 玻璃态背景、键盘交互、安全区域、主题感知 |
| **学习页面** | `src/pages/learning/ui/LearningPage.tsx` | 主要学习功能入口 | VideoCard集成、响应式布局、导航传递 |
| **单词本页面** | `src/pages/collections/ui/CollectionsPage.tsx` | 单词集管理 | 自动主题设置、卡片展示 |
| **个人中心页面** | `src/pages/profile/ui/ProfilePage.tsx` | 用户设置和信息 | 主题状态指示器、完整主题切换 |
| **视频播放页面** | `app/video-player.tsx` | 高级视频播放界面 | React Native Reanimated、滚动偏移管理、播放/暂停状态协调、60fps动画性能 |
| **模态页面** | `app/modal.tsx` | 示例弹窗页面 | 导航返回、简单内容展示 |

### **Navigation Configuration**
| File | Purpose | Configuration |
|------|---------|---------------|
| `app/_layout.tsx` | 根导航布局 | ThemeProvider包装、Stack导航 |
| `app/(tabs)/_layout.tsx` | Tab导航配置 | 底部导航栏、图标、主题化样式 |
| `app/index.tsx` | 认证路由控制器 | 基于认证状态的智能路由，框架原生重定向 |

### **Advanced Video Player Architecture**
视频播放页面采用高性能动画架构，实现类似YouTube的交互体验：

**核心技术栈**：
- **React Native Reanimated 2**: UI线程动画，60fps流畅性能
- **滚动偏移管理系统**: 智能状态机协调播放/暂停与滚动行为
- **共享值架构**: `scrollY`、`effectiveScrollY`、`scrollOffset`、`playingTransition`五值协调
- **动画过渡系统**: 300ms缓动过渡，支持播放状态切换和滚动压缩

**偏移量管理规则**：
- **播放中**: 视频固定顶部，实时更新scrollOffset
- **暂停后向上滚动**: 视频保持完整，继续更新scrollOffset
- **暂停后向下滚动**: 视频压缩，scrollOffset锁定作为参考点
- **边界保护**: 偏移量永不为负数，处理iOS弹性滚动

**性能优化**：
- 所有动画使用`transform`和`opacity`，避免layout重排
- `scrollEventThrottle={1}`获得最流畅滚动体验
- 稳定60fps动画性能，UI线程运行避免JS桥接延迟

### **Page Statistics**
- **Total Pages**: 5 (3 tab pages + 1 video player + 1 modal)
- **Lines of Code**: ~500 lines across all page components (含视频播放器高级动画逻辑)
- **TypeScript Coverage**: 100% with strict typing
- **Theme Integration**: All pages use design system components
- **Navigation Icons**: Ionicons integration for tab bar

## Integration Points

### **FSD Layer Communication**
```typescript
// 页面层使用共享层组件
import { Container, Button, Card, H1 } from '@/shared/ui';
import { useTheme } from '@/shared/providers/ThemeProvider';

// 清晰的导入路径分离
// @/pages/* - 业务页面组件
// @/shared/* - 共享组件和工具
```

### **Theme System Integration**
- **Dynamic Theming**: 每个页面都响应主题变化
- **Different Theme Controls**: 不同页面展示不同主题切换方法：
  - **学习页**: `toggleLightDark()` - 浅色/深色直接切换
  - **单词本页**: `setThemeMode('auto')` - 系统跟随设置
  - **个人中心**: `toggleTheme()` - 完整三模式循环

### **Expo Router Integration**
```typescript
// 认证感知的根重定向配置
export default function Index() {
  const { session, isInitializing } = useAuth();

  if (isInitializing) return <LoadingScreen />;
  if (!session) return <LoginPage />;
  
  return <Redirect href="/(tabs)/learn" />;
}

// Tab Screen配置
<Tabs.Screen
  name="learn"
  options={{
    title: "学习",
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="book-outline" size={size} color={color} />
    ),
  }}
/>
```

### **Modal System Integration**
```typescript
// Stack配置支持模态展示
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
</Stack>
```

## Development Patterns

### **Page Creation Guidelines**
1. **Feature-First Organization**: 在`src/pages/feature-name/`创建新页面
2. **UI Component Separation**: 页面组件放在`ui/`子目录
3. **Index Export**: 通过`index.ts`提供模块导出
4. **Route Connection**: 在`app/`目录创建对应路由文件
5. **Theme Integration**: 始终使用设计系统组件

### **Navigation Patterns**
```typescript
// 页面间导航
import { router } from 'expo-router';

// 编程式导航
router.push('/modal');
router.back();
router.replace('/(tabs)/profile');

// Tab切换（自动处理）
// 用户点击tab bar自动切换
```

### **Content Organization Strategy**
```typescript
// ✅ 推荐模式 - 组件组合
<Container safe padding="lg">
  <Column gap="xl">
    <Card padding="xl" shadow="sm">
      <H1>功能标题</H1>
      <Body color="textSecondary">功能描述</Body>
    </Card>
    <Button title="操作按钮" onPress={handleAction} />
  </Column>
</Container>

// ❌ 避免模式 - 直接样式
<View style={{ flex: 1, padding: 16 }}>
  <Text style={{ fontSize: 24, color: '#000' }}>标题</Text>
</View>
```

### **Responsive Spacing Patterns**
```typescript
// 动态响应式间距系统
import { Dimensions } from 'react-native';
import { spacing } from '@/shared/config/theme';

const { width: screenWidth } = Dimensions.get('window');
const dynamicGap = screenWidth * 0.05; // 屏幕宽度的5%

// ✅ 推荐模式 - 统一间距容器
<View style={styles.contentContainer}>
  <BlurCard style={styles.card}>
    <Text>内容1</Text>
  </BlurCard>
  <BlurCard style={styles.card}>
    <Text>内容2</Text>
  </BlurCard>
</View>

const styles = StyleSheet.create({
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: dynamicGap, // 统一的响应式间距
  },
  card: {
    // 移除 marginBottom，由容器gap统一管理
  },
});

// 混合使用设计令牌和动态间距
marginRight: dynamicGap * 0.8,    // 动态间距的80%
gap: spacing.sm,                  // 8px - 静态设计令牌
paddingTop: dynamicGap,           // 动态顶部间距
```

**响应式间距设计原则**:
- **5%规则**: 主要间距使用屏幕宽度的5%，确保在不同设备上保持比例一致
- **相对比例**: 使用动态间距的倍数调整（0.6x, 0.8x）实现层次化间距
- **容器化间距**: 使用`contentContainer`的`gap`属性统一管理子元素间距
- **混合策略**: 结合静态设计令牌（`spacing.sm`）和动态间距，平衡一致性与响应性

### **State Management Approach**
- **Local State**: `useState` for component-specific state
- **Theme State**: Global theme context via ThemeProvider
- **Navigation State**: Expo Router automatic state management
- **Persistent State**: AsyncStorage for user preferences

### **Testing Strategy**
- **Page Testing**: Jest + React Native Testing Library
- **Navigation Testing**: Mock Expo Router for unit tests
- **Integration Testing**: E2E testing with Detox (planned)
- **Theme Testing**: Test theme switching across pages

---

*This documentation reflects the current page architecture implementing a clean separation between routing infrastructure and business logic, following FSD principles with comprehensive theme integration.*