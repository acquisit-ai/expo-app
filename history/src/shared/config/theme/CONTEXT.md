# Theme System Architecture Documentation

*This file documents the complete theme system architecture, including React Native Paper integration and glassmorphism effects.*

## Theme System Overview

The theme system is built on React Native Paper (Material Design 3) with consolidated color management and high-performance glassmorphism effects. Refactored in 2025-09-18 with 20.6% code reduction, removing styled-components and consolidating around Paper architecture.

### Core Architecture
- **Paper Foundation**: React Native Paper ExtendedTheme for Material Design 3
- **Unified Colors**: Single `colors.ts` system (replaced separate palette)
- **Glass Effects**: Independent glassmorphism module with factory pattern
- **Type Safety**: Simplified types system (77% size reduction)

*For complete architectural documentation, see [README.md](./README.md)*

## Visual Effects Architecture

The application implements two complementary visual effect systems: **Glassmorphism** and **Blur Effects**. Both systems use identical factory-based architectures for high-performance, precomputed styles with intelligent caching, completely decoupled from the main theme system.

### Glassmorphism Architecture

The glassmorphism system implements gradient-based glass effects with blur backgrounds for premium visual appeal.

### Core Components

#### **GlassStyleFactory** (`glass-factory.ts`)
- **Pattern**: Singleton factory for style generation
- **Performance**: Dual-layer caching system (styles + colors)
- **Features**: Precomputed styles, memory management, development monitoring
- **Integration**: Used by GlassProvider for style distribution

#### **Glassmorphism Configuration** (`glassmorphism.ts`)  
- **Purpose**: Core glass effects configuration
- **Features**: 14 opacity levels, 7 background themes, utility functions
- **Extensions**: TabBar-specific configurations, responsive parameters
- **Integration**: Consumed by factory for style generation

#### **Glass Presets** (`glass-presets.ts`)
- **Purpose**: Component-specific glass effect variations
- **Categories**: Card, Button, Input, Navigation presets
- **Features**: Responsive configurations, preset generator, type-safe selectors
- **Usage**: Factory consumes presets for component-specific style generation

## Implementation Patterns

### Factory Pattern
```typescript
// Singleton factory instance
const glassStyleFactory = GlassStyleFactory.getInstance();

// Precomputed styles with caching
const styles = glassStyleFactory.getStyles(isDark);
```

### Style Precomputation
- All styles calculated once per theme mode
- Color calculations cached with opacity mappings  
- StyleSheet.create() called only during initialization
- Runtime access through precomputed object properties

### Memory Management
- Cache size monitoring in development mode
- Manual cache clearing for memory optimization
- Component lifecycle tracking to prevent leaks

## Integration Points

### GlassProvider Integration
- Factory provides precomputed styles to `GlassProvider`
- Provider distributes styles through specialized hooks
- Context optimized with useMemo for performance

### Component Integration  
- Glass components use factory-generated styles directly
- No runtime style calculations in components
- Specialized hooks provide component-specific style subsets

### Performance Characteristics
- **Cold Start**: ~5ms for complete style generation
- **Warm Access**: <1ms with cache hits
- **Memory Usage**: ~2KB for complete style cache
- **Cache Hit Rate**: >95% in typical usage

## Blur Effects Architecture

The blur system implements semantic color-based blur effects with animation support, providing a modern alternative to glassmorphism for different use cases.

### Core Components

#### **BlurStyleFactory** (`blur/factory.ts`)
- **Pattern**: Singleton factory identical to GlassStyleFactory pattern
- **Performance**: Dual-layer caching system (styles + colors)
- **Features**: Precomputed styles, memory management, development monitoring
- **Integration**: Used by BlurProvider for style distribution

#### **Blurism Configuration** (`blur/blurism.ts`)
- **Purpose**: Core blur effects configuration with semantic color system
- **Features**: 10 color variants (default, success, error, etc.), light/dark mode support
- **Color System**: Semantic colors vs glassmorphism's single white base
- **Integration**: Consumed by factory for component-specific style generation

### Implementation Patterns

#### **Factory Pattern** (Identical to Glass System)
```typescript
// Singleton factory instance
const blurStyleFactory = BlurStyleFactory.getInstance();

// Precomputed styles with caching
const styles = blurStyleFactory.getStyles(isDark);
```

#### **Semantic Color System**
- 10 color variants for different UI states and contexts
- Light/dark mode adaptive color calculations
- Component-specific color mappings with opacity variations
- Contrast-optimized colors for accessibility

#### **Animation Integration**
- Reanimated scale animations for interactive components
- Smooth press feedback with configurable timing
- Performance-optimized animation values (0.96 scale factor)

### Integration Points

#### **BlurProvider Integration**
- Factory provides precomputed styles to `BlurProvider`
- Provider distributes styles through specialized hooks
- Context optimized with useMemo for performance
- **4-Provider Hierarchy**: Theme → Glass → **Blur** → Toast → Auth

#### **Component Integration**
- Blur components use factory-generated styles directly
- No runtime style calculations in components
- Specialized hooks provide component-specific style subsets
- **Component Coverage**: BlurCard, BlurButton, BlurList (3 components)

#### **Blur vs Glass Comparison**

| Feature | Glassmorphism | Blur Effects |
|---------|---------------|--------------|
| **Visual Style** | LinearGradient + BlurView | BlurView only |
| **Color System** | Single white with opacity | 10 semantic variants |
| **Background** | 4-color gradient | Solid color with transparency |
| **Animation** | None | Reanimated scale |
| **Components** | 4 (Card, Button, Input, Social) | 3 (Card, Button, List) |
| **Use Cases** | Premium feel, brand emphasis | State indication, accessibility |

### Performance Characteristics
- **Cold Start**: ~5ms for complete style generation (identical to glass)
- **Warm Access**: <1ms with cache hits
- **Memory Usage**: ~2KB for complete style cache
- **Cache Hit Rate**: >95% in typical usage
- **Dual Factory Memory**: <4KB total for both glass and blur systems

### Selection Guidelines

#### **Use Glassmorphism When:**
- Premium brand experience needed
- Subtle, elegant backgrounds preferred
- Input forms and social login buttons
- Consistent gradient aesthetic required

#### **Use Blur Effects When:**
- Semantic state indication needed (success, error, warning)
- Interactive feedback required (animations)
- List interfaces and structured content
- High contrast and accessibility important

---

*This file documents both glassmorphism and blur factory architectures that provide high-performance visual effects throughout the application.*