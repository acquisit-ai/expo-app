# Playback Settings Feature Documentation

*This file documents the playback settings feature implementation and modal architecture.*

## Feature Architecture

The playback settings feature implements a **Modal-Based Configuration Interface** providing users with streamlined video playback controls through a bottom-sheet design:

### Core Components
- **PlaybackSettingsModal** - Centralized playback configuration interface
- **PlaybackRate Configuration** - Segmented control for speed adjustment
- **Volume/Mute Toggle** - Binary audio control interface
- **BlurModal Integration** - Native bottom-sheet modal architecture

### Component Architecture

#### PlaybackSettingsModal
The main configuration interface implements sophisticated user interaction patterns:

**Modal Integration Excellence**:
```typescript
<BlurModal type="bottom-sheet" padding="none" variant="default" showHandle>
  <View style={modalStyles.contentContainer}>
    {renderPlaybackRateItem()}
    {renderVolumeItem()}
  </View>
</BlurModal>
```

**Key Architecture Features**:
- **Bottom-Sheet Design**: Native iOS-style modal presentation
- **Blur Background**: Integrated with shared blur effects system
- **Handle Affordance**: Standard bottom-sheet interaction handle
- **Structured Layout**: Icon + Label + Control triadic layout pattern

#### Segmented Control Architecture
Advanced speed control implementation using `@react-native-segmented-control`:

```typescript
// 播放速度配置
const playbackRateValues: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
const playbackRateLabels = ['0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x'];
const selectedSpeedIndex = playbackRateValues.findIndex(rate => Math.abs(rate - playbackRate) < 0.01);

// 防御性编程：防止selectedIndex为-1
const safeSelectedIndex = selectedSpeedIndex >= 0 ? selectedSpeedIndex : 2; // 默认选中1x
```

**Robust Design Patterns**:
- **Float Comparison Safety**: Uses epsilon comparison for playback rate matching
- **Defensive Programming**: Fallback to default 1x speed if index calculation fails
- **Type Safety**: Strong typing with `PlaybackRate` union type
- **Label-Value Separation**: Decoupled display labels from actual rate values

#### Volume Control Architecture
Binary mute toggle with enhanced visual feedback:

```typescript
<Switch
  value={isMuted}
  onValueChange={toggleMute}
  trackColor={{
    false: theme.colors.outline,
    true: theme.colors.primary
  }}
  thumbColor={isMuted ? theme.colors.onPrimary : theme.colors.surface}
  ios_backgroundColor={theme.colors.outline}
/>
```

**Interaction Enhancement**:
- **Haptic Feedback**: `Haptics.selectionAsync()` on toggle actions
- **Theme Integration**: Full theme color system compliance
- **Dual Activation**: Both TouchableOpacity wrapper and Switch respond to user input
- **Visual Feedback**: Theme-aware state indication

## Implementation Patterns

### Modal Lifecycle Integration

**Entity Integration**:
```typescript
const { playbackRate, isMuted, setPlaybackRate, toggleMute } = useVideoPlayer();
```

**Integration Benefits**:
- **Direct Entity Access**: No prop drilling through component hierarchy
- **Real-time Synchronization**: Changes immediately reflect in video player
- **State Consistency**: Single source of truth through video entity
- **Type Safety**: Full TypeScript integration with entity hooks

### Haptic Feedback Strategy
Enhanced user experience through strategic haptic integration:

```typescript
const handlePress = useCallback(() => {
  Haptics.selectionAsync();  // Tactile feedback before state change
  toggleMute();              // State update follows haptic cue
}, [toggleMute]);
```

**Feedback Architecture**:
- **Pre-action Feedback**: Haptic occurs before state change for immediate response
- **Selection Type**: Uses `selectionAsync()` for subtle configuration feedback
- **Memoized Handlers**: Callback optimization prevents unnecessary re-renders

### Theme-Aware Styling
Comprehensive theme system integration:

```typescript
// Dynamic color application
fontStyle={{ color: theme.colors.textMedium }}
activeFontStyle={{ color: theme.colors.textDark }}
trackColor={{
  false: theme.colors.outline,
  true: theme.colors.primary
}}
```

**Styling Excellence**:
- **Semantic Color Usage**: Meaningful color role assignments
- **State-Aware Styling**: Different colors for active/inactive states
- **Platform Consistency**: iOS-specific styling considerations
- **Accessibility Support**: Sufficient contrast ratios through theme colors

### Type System Architecture

**Playback Rate Type Safety**:
```typescript
export type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
```

**Type Benefits**:
- **Constraint Enforcement**: Only valid playback rates allowed
- **IDE Support**: Autocompletion and error checking
- **Configuration Validation**: Type-safe configuration objects
- **Runtime Safety**: Prevents invalid rate assignments

## Integration Points

### Entity Layer Integration
- **useVideoPlayer Hook**: Direct access to playback controls without intermediate state
- **Real-time Updates**: Changes immediately propagate to video player instance
- **State Synchronization**: Modal reflects current video player state

### Modal System Integration
- **Shared Modal Stack**: Integrates with `AppModalStackParamsList`
- **BlurModal Foundation**: Built on shared blur modal components
- **Modal Type Safety**: Full TypeScript integration with modal system

### UI System Integration
- **Theme Provider**: Complete theme system compliance
- **Icon System**: Ionicons integration for consistent iconography
- **Component Library**: Leverages React Native Paper Text components

### Platform Integration
- **Expo Haptics**: Native tactile feedback integration
- **Platform Optimization**: iOS-specific styling and behavior
- **Segmented Control**: Native-like control component integration

### Long Press Trigger Integration
Modal activation through sophisticated gesture coordination:

```typescript
// From video-control-overlay feature
const handleLongPress = useCallback(() => {
  openModal('PlaybackSettingsModal');
}, [openModal]);
```

**Activation Architecture**:
- **Cross-Feature Integration**: Triggered from video-control-overlay long press gesture
- **Modal Stack Coordination**: Uses shared modal system for consistent presentation
- **Gesture Context**: Provides contextual settings access during video interaction

## Performance Characteristics

- **Render Optimization**: Memoized render functions prevent unnecessary re-renders
- **Callback Stability**: useCallback ensures stable function references
- **Theme Performance**: Efficient theme color resolution
- **Haptic Efficiency**: Minimal overhead haptic feedback integration

## Configuration Constants

Modal behavior configured through structured styling:
- **Layout Constants**: Consistent spacing and sizing
- **Animation Integration**: Smooth modal presentation/dismissal
- **Interaction Areas**: Optimized touch targets for accessibility

---

*This feature demonstrates modal-based configuration patterns with sophisticated user interaction design, haptic feedback integration, and seamless entity state synchronization.*