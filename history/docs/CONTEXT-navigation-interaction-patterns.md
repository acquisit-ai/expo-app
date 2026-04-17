# Navigation-Interaction Patterns Documentation

*This file documents navigation-aware interaction control patterns and their integration with the UI component system.*

## Focus-Based Interaction Control Pattern

### Problem Solved
Traditional timing-based interaction delays (e.g., 350ms blocks) are unreliable and create poor user experiences during navigation transitions. Race conditions occur when users interact with components before navigation completes, leading to unexpected behaviors.

### Solution Architecture
The focus-based pattern leverages React Navigation's `useFocusEffect` hook to create deterministic interaction control based on actual navigation state rather than arbitrary timing.

```typescript
// Core Pattern Implementation
const [isPageFocused, setIsPageFocused] = useState(false);

useFocusEffect(
  useCallback(() => {
    // Page gains focus - enable interactions
    setIsPageFocused(true);

    return () => {
      // Page loses focus - disable interactions
      setIsPageFocused(false);
    };
  }, [])
);

// Conditional interaction handling
const handleInteraction = useCallback(async (data) => {
  if (!isPageFocused) return; // Guard clause prevents race conditions

  // Safe to perform navigation or API calls
  await performAction(data);
}, [isPageFocused]);
```

### Component Integration Pattern
Components support the disabled state pattern for navigation-aware behavior:

```typescript
// Component-level disabled state propagation
<VideoCard
  disabled={!isPageFocused}  // Prevents interaction and visual feedback
  onPress={() => handleInteraction(video)}
/>

// TouchableOpacity behavior adjustment
<TouchableOpacity
  disabled={disabled}
  activeOpacity={disabled ? 1 : 0.8}  // No visual feedback when disabled
  onPress={handlePress}
/>
```

## Implementation Guidelines

### When to Apply This Pattern
- **Page-level interactions** that trigger navigation
- **Components with async operations** during navigation
- **Race condition prevention** in navigation-heavy flows
- **Form submissions** that change navigation state

### Integration with Existing Architecture
- **FSD Compatibility**: Aligns with Feature-Sliced Design principles
- **Component System**: Integrates with existing disabled prop patterns
- **Navigation System**: Leverages React Navigation focus system
- **Performance**: Eliminates arbitrary delays and improves responsiveness

### Migration from Timing-Based Approaches
```typescript
// ❌ Old Pattern - Unreliable timing
const [isClickDisabled, setIsClickDisabled] = useRef(false);

const handleClick = useCallback(() => {
  if (isClickDisabled.current) return;

  isClickDisabled.current = true;
  setTimeout(() => {
    isClickDisabled.current = false;
  }, 350); // Arbitrary delay

  performAction();
}, []);

// ✅ New Pattern - Navigation-aware control
const [isPageFocused, setIsPageFocused] = useState(false);

useFocusEffect(
  useCallback(() => {
    setIsPageFocused(true);
    return () => setIsPageFocused(false);
  }, [])
);

const handleClick = useCallback(() => {
  if (!isPageFocused) return; // Deterministic guard
  performAction();
}, [isPageFocused]);
```

## Advanced Patterns

### Reusable Hook Pattern
Extract the focus logic into a custom hook for reuse across pages:

```typescript
// Custom hook for navigation focus
function useNavigationFocus() {
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  return isFocused;
}

// Usage in pages
function SomePage() {
  const isFocused = useNavigationFocus();

  const handleAction = useCallback(() => {
    if (!isFocused) return;
    // Perform action
  }, [isFocused]);

  return (
    <InteractiveComponent
      disabled={!isFocused}
      onPress={handleAction}
    />
  );
}
```

### Multi-Component Coordination
Coordinate multiple components with shared focus state:

```typescript
function PageWithMultipleInteractions() {
  const isFocused = useNavigationFocus();

  return (
    <>
      <VideoCard disabled={!isFocused} onPress={handleVideo} />
      <Button disabled={!isFocused} onPress={handleSubmit} />
      <TouchableOpacity disabled={!isFocused} onPress={handleNav} />
    </>
  );
}
```

## Testing Considerations

### Unit Testing Focus State
```typescript
// Mock useFocusEffect for testing
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn()
}));

// Test focus state management
test('disables interactions when page loses focus', () => {
  const mockUseFocusEffect = useFocusEffect as jest.Mock;

  // Simulate page losing focus
  mockUseFocusEffect.mockImplementation((callback) => {
    const cleanup = callback();
    cleanup(); // Call cleanup to simulate focus loss
  });

  // Assert interactions are disabled
});
```

### Integration Testing
- Test navigation transitions with interaction attempts
- Verify component disabled states during navigation
- Confirm haptic feedback only occurs when enabled

## Performance Benefits

### Reduced Computational Overhead
- Eliminates timer management and cleanup
- Uses React Navigation's optimized focus system
- Prevents unnecessary API calls during navigation

### Improved User Experience
- Immediate visual feedback through disabled states
- Predictable behavior across all navigation scenarios
- Eliminates frustrating timing-based interaction blocks

### Maintainability Advantages
- Self-documenting navigation-aware behavior
- Clear separation of concerns between navigation and interaction logic
- Easy to test and debug compared to timing-based approaches

## Current Implementations

### Feed Page (Reference Implementation)
- **Location**: `src/pages/feed/ui/FeedPage.tsx`
- **Pattern**: Focus-controlled VideoCard interactions
- **Benefits**: Eliminates navigation race conditions, improves perceived performance

### VideoCard Component Integration
- **Location**: `src/shared/ui/blur/VideoCard.tsx`
- **Enhancement**: Disabled prop with haptic feedback control
- **Integration**: Works seamlessly with focus-based page control

---

*This documentation captures the focus-based navigation-interaction pattern as a Tier 2 architectural pattern, demonstrating sophisticated navigation-aware UI control that replaces timing-based approaches with deterministic, navigation-state-driven interaction management.*