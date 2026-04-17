# TabBar Widget Documentation

*This file documents the tab-bar widget implementation patterns within the widgets layer.*

## Overview

The tab-bar widget provides a modern, animated bottom navigation bar for the application. It has been migrated from Expo Router to React Navigation and now offers two implementations:

1. **BlurTabBar**: Uses `expo-blur` for a frosted glass effect (cross-platform)
2. **LiquidGlassTabBar**: Uses `expo-glass-effect` for native iOS liquid glass effect (iOS 18+)

## Architecture

### Navigation System Integration

- **Framework**: React Navigation v6 (`@react-navigation/bottom-tabs`)
- **Props Interface**: `BottomTabBarProps` from `@react-navigation/bottom-tabs`
- **Route Naming**: PascalCase (e.g., `Collections`, `Feed`, `Profile`)
- **Migration Context**: Previously used Expo Router with kebab-case routes (e.g., `collections`, `feed`)

### Component Structure

```
src/widgets/tab-bar/
├── index.ts                     # Module exports
├── config/tabConfig.ts          # Icon mapping and configuration
├── lib/iconUtils.ts            # Utility functions for icons and labels
├── types/index.ts              # TypeScript type definitions
└── ui/
    ├── BlurTabBar.tsx          # Blur effect implementation
    ├── LiquidGlassTabBar.tsx   # Liquid glass implementation
    └── TabBarItem.tsx          # Individual tab item component
```

## Implementation Patterns

### 1. Dual Implementation Strategy

The widget provides two TabBar implementations that can be switched dynamically:

```tsx
const useLiquidGlass = isLiquidGlassAvailable();

<Tab.Navigator
  tabBar={(props) =>
    useLiquidGlass ? (
      <LiquidGlassTabBar {...props} />
    ) : (
      <BlurTabBar {...props} />
    )
  }
>
```

**BlurTabBar** (Default):
- Cross-platform compatibility (iOS + Android)
- Uses `expo-blur` `BlurView` component
- Light mode: 50 intensity, light tint
- Dark mode: 40 intensity, regular tint, with highlight border
- Standard shadow effects in light mode

**LiquidGlassTabBar** (iOS 18+):
- Native iOS liquid glass effect
- Uses `expo-glass-effect` `GlassView` component
- Light mode: `rgba(255, 255, 255, 0.4)` background
- Dark mode: `rgba(0, 0, 0, 0.4)` background
- Enhanced shadow effects (larger offset and radius)
- Requires device capability check via `isLiquidGlassAvailable()`

### 2. Performance Optimization

**Component-Level Optimization**:
- Both TabBar components wrapped in `React.memo` with custom comparison functions
- Only re-render when `state.index` or `state.routes.length` changes
- Navigation and style props compared for stability

**TabBarItem Optimization**:
- Wrapped in `React.memo` with custom comparison
- Only re-renders when visual properties change (focus state, colors, labels)
- Event handlers cached with `useCallback`

**Style Calculation**:
- Static styles computed once with `useMemo`
- Dynamic styles (focus-dependent) computed separately
- Responsive positioning calculated based on screen dimensions

**Data Pre-computation**:
- Tab items data pre-computed outside render loop
- Icon and label lookups happen once per navigation state change

### 3. Responsive Design

Both implementations use responsive positioning:

```tsx
const responsivePosition = useMemo(() => {
  const dynamicBottom = screenHeight * 0.0168;    // 1.68% of screen height
  const dynamicHorizontal = screenWidth * 0.06;   // 6% of screen width

  return { bottom: dynamicBottom, horizontal: dynamicHorizontal };
}, [screenHeight, screenWidth]);
```

### 4. Theme Integration

**Color System**:
- Active state: `theme.colors.primary`
- Inactive state: `theme.colors.textMedium`
- Colors pre-computed at theme level to avoid repeated calculations

**Configuration Tokens** (`@/shared/config/theme/tokens.ts`):
```ts
export const tabBar = {
  height: 70,
  borderRadius: 40,
  horizontalPadding: 16,
  iconSize: 24,
  labelFontSize: 11,
  labelMarginTop: 4,
  effects: {
    activeOpacity: 0.7,
    blurIntensity: { light: 50, dark: 40 },
    shadow: { /* shadow configuration */ },
    highlightBorderColor: 'rgba(255, 255, 255, 0.1)',
  },
};
```

### 5. Icon Configuration System

**Declarative Icon Mapping**:
```ts
export const TAB_ICON_MAP: Record<string, TabIconConfig> = {
  Collections: {
    focused: 'library',
    outline: 'library-outline'
  },
  Feed: {
    focused: 'sparkles',
    outline: 'sparkles-outline'
  },
  Profile: {
    focused: 'person',
    outline: 'person-outline'
  },
};
```

**Icon Utility Function**:
```ts
export const getTabIcon: TabIconGetter = (routeName: string, focused: boolean): IoniconsName => {
  const iconSet = TAB_ICON_MAP[routeName] ?? DEFAULT_TAB_ICON;
  return focused ? iconSet.focused : iconSet.outline;
};
```

### 6. Haptic Feedback

TabBarItem provides selection feedback on press:

```tsx
const handlePress = useCallback(() => {
  Haptics.selectionAsync();  // Light "tick" sensation
  onPress();
}, [onPress]);
```

## Type System

### Core Types

```ts
// Main props interface (shared by both implementations)
export interface BlurTabBarProps extends BottomTabBarProps {
  style?: object;
}

// Tab item props
export interface TabBarItemProps {
  routeKey: string;
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  iconName: IoniconsName;
  iconColor: string;
  labelColor: string;
}

// Icon configuration
export interface TabIconConfig {
  focused: IoniconsName;
  outline: IoniconsName;
}

// Utility function type
export type TabIconGetter = (routeName: string, focused: boolean) => IoniconsName;
```

## Integration Points

### 1. React Navigation

**Used in**: `src/app/navigation/MainTabNavigator.tsx`

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurTabBar, LiquidGlassTabBar } from '@/widgets/tab-bar';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const useLiquidGlass = isLiquidGlassAvailable();

  return (
    <Tab.Navigator
      tabBar={(props) => useLiquidGlass ? <LiquidGlassTabBar {...props} /> : <BlurTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Collections" component={CollectionsScreen} options={{ title: '单词本' }} />
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: '动态' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}
```

### 2. Theme Provider

Consumes theme context for dynamic theming:

```tsx
const { theme, isDark } = useTheme();
```

### 3. Vector Icons

Uses Ionicons from `@expo/vector-icons` for consistent iconography.

### 4. Device Capabilities

Uses `expo-glass-effect` to check liquid glass availability:

```tsx
import { isLiquidGlassAvailable } from 'expo-glass-effect';
```

## Key Design Decisions

### 1. Shared Props Interface

Both BlurTabBar and LiquidGlassTabBar use the same `BlurTabBarProps` interface to ensure they can be swapped without changing calling code.

### 2. PascalCase Route Names

React Navigation uses PascalCase route names (`Collections`, `Feed`, `Profile`), different from Expo Router's kebab-case (`collections`, `feed`, `profile`). The icon configuration system must match this naming convention.

### 3. Layered Architecture (LiquidGlassTabBar)

The liquid glass implementation uses a layered approach:
- Base container with shadow
- `GlassView` for the glass effect
- Tab items container with `pointerEvents="box-none"` to allow touch through

### 4. Conditional Visual Effects

Both implementations apply shadow effects only in light mode to maintain visual clarity while avoiding overwhelming dark mode designs.

### 5. Custom Memo Comparison

Both implementations use custom comparison functions for `React.memo` to precisely control re-renders based on actual visual changes rather than shallow prop comparison.

## Development Patterns

### Adding a New Tab

1. **Update Icon Configuration**:
```ts
// config/tabConfig.ts
export const TAB_ICON_MAP: Record<string, TabIconConfig> = {
  // ... existing tabs
  Settings: { focused: 'settings', outline: 'settings-outline' },
};
```

2. **Add Route to Navigator**:
```tsx
<Tab.Screen
  name="Settings"
  component={SettingsScreen}
  options={{ title: '设置' }}
/>
```

### Customizing Visual Effects

All visual effects are controlled through the theme system:

```ts
// @/shared/config/theme/tokens.ts
export const tabBar = {
  // Modify these values to customize appearance
  height: 70,
  borderRadius: 40,
  effects: {
    blurIntensity: { light: 50, dark: 40 },
    // ...
  },
};
```

### Testing Different Implementations

For development/testing purposes, you can force a specific implementation:

```tsx
// Force BlurTabBar
<Tab.Navigator tabBar={(props) => <BlurTabBar {...props} />}>

// Force LiquidGlassTabBar (will only work on supported devices)
<Tab.Navigator tabBar={(props) => <LiquidGlassTabBar {...props} />}>
```

## Performance Characteristics

- **Initial Render**: Fast due to pre-computed styles and data
- **Re-render Frequency**: Minimal - only on actual tab changes
- **Memory Footprint**: Low - no heavy computations or large state
- **Animation Performance**: Smooth - 60fps on modern devices

## Migration Notes

### From Expo Router to React Navigation

**Changed**:
- Route naming: kebab-case → PascalCase
- Props interface: Custom → `BottomTabBarProps`
- Navigation API: Expo Router API → React Navigation API
- Import paths: `@/widgets/navigation` → `@/widgets/tab-bar`

**Added**:
- LiquidGlassTabBar implementation
- Device capability detection
- Enhanced visual effects for liquid glass
- Haptic feedback integration

**Maintained**:
- Performance optimization patterns
- Theme integration
- Icon configuration system
- Type safety

## Best Practices

1. **Always check liquid glass availability** before using LiquidGlassTabBar
2. **Use theme tokens** for all styling rather than hardcoded values
3. **Add new routes to TAB_ICON_MAP** with PascalCase names
4. **Test on both iOS and Android** when modifying BlurTabBar
5. **Verify iOS 18+ behavior** when modifying LiquidGlassTabBar
6. **Keep custom memo comparisons updated** when adding new props

## Known Limitations

- LiquidGlassTabBar only works on iOS 18+ with capable hardware
- Android doesn't support native liquid glass effects
- Shadow effects may appear differently across Android devices
- BlurView intensity has platform-specific limits

---

*This documentation reflects the current state of the tab-bar widget as of the React Navigation migration (commit de1fd12).*
