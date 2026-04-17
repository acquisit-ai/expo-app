# Three-Layer Architecture in Feature-Sliced Design

This document explains the three-layer architecture implementation in our React Native learning app, with the video entity as an exemplary demonstration of how FSD layers work together to create enterprise-grade functionality.

## Overview

Feature-Sliced Design (FSD) organizes code into distinct layers with clear responsibilities and dependency rules. Our three-layer architecture demonstrates how the **Entity**, **Feature**, and **Widget** layers collaborate to build complex functionality while maintaining separation of concerns.

## The Three Core Layers

### 1. Entity Layer (Business Logic Foundation)
**Location**: `src/entities/`
**Purpose**: Core business models and domain logic
**Dependencies**: Only shared layer

The entity layer defines fundamental business concepts and manages their state. Entities are self-contained, reusable across multiple features, and contain no UI logic.

### 2. Feature Layer (User Interactions)
**Location**: `src/features/`
**Purpose**: Complete user interaction flows and business features
**Dependencies**: Entities + shared layer

Features encapsulate specific user actions and business workflows. They consume entities to provide complete, testable user experiences.

### 3. Widget Layer (Composite UI Components)
**Location**: `src/widgets/`
**Purpose**: Complex UI compositions combining multiple features
**Dependencies**: Features + entities + shared layer

Widgets are sophisticated UI components that orchestrate multiple features and entities to create rich, composite user experiences.

## Video System: Exemplary Three-Layer Implementation

Our video system demonstrates enterprise-grade three-layer architecture through sophisticated state management, modular hook systems, and clean separation of concerns.

### Entity Layer: Video Entity (`src/entities/video/`)

The video entity implements **enterprise-grade state management** with a modular hook architecture that serves as a reference implementation for complex state coordination.

#### Core Architecture Features

**1. Modular Hook System (v3.0.0)**
- **Player Control Module**: `useVideoPlayer()`, `useVideoPlaybackStatus()`, `useVideoPlayerControls()`
- **Instance Management Module**: `usePlaybackPageManager()`, `usePlaybackPageState()`, `usePlaybackNavigation()`
- **VideoView Sync Module**: `usePlayerEventSync()`, `useTimeUpdateInterval()`
- **Overlay Management**: `useVideoOverlayManager()` for session state and controls
- **Current Video Data**: `useCurrentVideoData()` for metadata management

**2. Enterprise-Grade State Coordination**
```typescript
// Three-state synchronization architecture
Zustand Store ↔ SharedValues ↔ VideoPlayer Instance

// Functional responsibility separation
player-control/     → Playback state and controls
instance-management/ → Lifecycle and page management
videoview-sync/     → Native component synchronization
```

**3. Advanced State Machine Patterns**
- **Interactive State Isolation**: Progress dragging doesn't disrupt core playback
- **Non-Destructive Interactions**: Preview states before committing changes
- **Memory Safety**: Component lifecycle tracking and automatic cleanup
- **Performance Optimization**: Selective subscriptions prevent render cascades

#### Entity Responsibilities
- ✅ **Current Video Management**: Metadata and lifecycle
- ✅ **Playback State Management**: Play/pause, progress, volume, playback rate
- ✅ **Session State Management**: User interactions (like, favorite, subtitles)
- ✅ **Instance Management**: Player lifecycle and page state coordination
- ✅ **Overlay Control**: Controls visibility and auto-hide behavior
- ✅ **Animation Integration**: SharedValues for high-performance animations

### Feature Layer: Video Player (`src/features/video-player/`)

The video player feature demonstrates **strategy pattern UI architecture** with context providers and entity-centric design.

#### Core Architecture Features

**1. Strategy Pattern Controls**
- **SmallScreenControls**: Compact mobile interface
- **FullscreenPortraitControls**: Portrait fullscreen layout
- **FullscreenLandscapeControls**: Landscape fullscreen layout

**2. Entity-Centric Integration**
```typescript
// Clean integration with video entity
const { isPlaying, togglePlay, currentTime } = useVideoPlayer();
const { controlsVisible, handleVideoTap } = useVideoOverlayManager();
const { setCurrentVideo, clearCurrentVideo } = useCurrentVideoData();
```

**3. Component Composition**
- **VideoPlayerDisplay**: Unified display component with three-layer rendering
- **VideoControlsOverlay**: Strategy selector for adaptive controls
- **VideoProgressBar**: Progress display and interaction handling

#### Feature Responsibilities
- ✅ **UI Rendering**: Visual representation of video entity state
- ✅ **User Interaction Handling**: Touch events, gestures, button presses
- ✅ **Control Strategy Selection**: Adaptive UI based on screen mode
- ✅ **Animation Coordination**: UI animations using entity SharedValues
- ✅ **Event Delegation**: User actions translated to entity operations

### Widget Layer: Video Player Section (`src/widgets/video-player-section/`)

The video player section widget demonstrates **high-level UI composition** with advanced animation coordination.

#### Core Architecture Features

**1. Multi-Feature Composition**
```typescript
// Orchestrates multiple features and entities
<VideoPlayerSection>
  <VideoPlayer />           // features/video-player
  <VideoDetailInfo />       // features/video-detail
  <VideoInteractionBar />   // features/video-detail
</VideoPlayerSection>
```

**2. Advanced Animation Coordination**
- **SharedValue Integration**: Smooth animations across component boundaries
- **Scroll-Driven Animations**: Coordinated scroll behavior with video state
- **Performance Optimization**: Efficient rendering with minimal re-renders

#### Widget Responsibilities
- ✅ **Feature Orchestration**: Combining video player with related features
- ✅ **Layout Management**: Complex responsive layouts across screen modes
- ✅ **Animation Coordination**: Smooth transitions and interactions
- ✅ **Context Bridging**: Connecting different feature contexts

## Architecture Benefits

### 1. Clear Separation of Concerns

**Entity Focus**: Pure business logic and state management
```typescript
// Entity only knows about data and business rules
const videoStore = {
  currentVideo: CurrentVideo | null,
  playback: VideoPlaybackState,
  session: VideoSessionState
};
```

**Feature Focus**: User interaction and UI logic
```typescript
// Feature focuses on user interaction patterns
function VideoControls() {
  const { togglePlay, seek } = useVideoPlayer();
  return <TouchableOpacity onPress={togglePlay} />;
}
```

**Widget Focus**: Composition and layout
```typescript
// Widget orchestrates multiple features
function VideoPlayerSection() {
  return (
    <Container>
      <VideoPlayer />
      <VideoInteractionBar />
      <RecommendationsList />
    </Container>
  );
}
```

### 2. Enhanced Testability

**Entity Testing**: Pure state management
```typescript
// Test business logic in isolation
test('video playback state transitions', () => {
  const { play, pause } = useVideoPlayer();
  // Test state machine logic
});
```

**Feature Testing**: User interaction flows
```typescript
// Test complete user interactions
test('video controls respond to user input', () => {
  // Test UI interaction patterns
});
```

**Widget Testing**: Component composition
```typescript
// Test composite behavior
test('video section coordinates multiple features', () => {
  // Test orchestration logic
});
```

### 3. Scalable Architecture

**Independent Development**: Teams can work on different layers simultaneously
- Entity team: State management and business logic
- Feature team: User interaction patterns
- Widget team: Complex UI compositions

**Reusable Components**: Entities and features can be reused across widgets
```typescript
// Video entity used across multiple features
import { useVideoPlayer } from '@/entities/video';

// Used in main player
function VideoPlayerFeature() {
  const { isPlaying } = useVideoPlayer();
}

// Used in mini player
function MiniPlayerWidget() {
  const { isPlaying } = useVideoPlayer();
}
```

### 4. Performance Optimization

**Selective Subscriptions**: Fine-grained state access prevents unnecessary re-renders
```typescript
// Only subscribe to needed state slices
function ProgressBar() {
  const { currentTime, duration } = useVideoPlayer();
  // Only re-renders when time changes
}

function PlayButton() {
  const { isPlaying, togglePlay } = useVideoPlayer();
  // Only re-renders when play state changes
}
```

**Modular Loading**: Features and widgets can be code-split
```typescript
// Lazy load complex widgets
const VideoPlayerSection = lazy(() => import('@/widgets/video-player-section'));
```

## Implementation Patterns

### 1. Entity-First Design

Start with entities that model your business domain:
```typescript
// 1. Define business model
interface CurrentVideo {
  meta: VideoMetadata;
}

interface VideoPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

// 2. Create entity hooks
function useVideoPlayer() {
  // Business logic implementation
}
```

### 2. Feature Integration

Build features that consume entities:
```typescript
// 3. Create UI features
function VideoPlayer() {
  const { isPlaying, togglePlay } = useVideoPlayer();

  return (
    <TouchableOpacity onPress={togglePlay}>
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </TouchableOpacity>
  );
}
```

### 3. Widget Composition

Compose widgets from multiple features:
```typescript
// 4. Compose complex widgets
function VideoPlayerSection() {
  return (
    <VideoPlayerProvider>
      <VideoPlayer />
      <VideoControls />
      <VideoProgress />
    </VideoPlayerProvider>
  );
}
```

## Best Practices

### 1. Dependency Direction

Always follow the dependency rule:
```
shared ← entities ← features ← widgets ← pages
```

### 2. State Management Strategy

- **Entities**: Business state and logic
- **Features**: UI state for specific interactions
- **Widgets**: Coordination state for complex compositions

### 3. Hook Design Patterns

**Entity Hooks**: Focus on business operations
```typescript
// ✅ Good: Business-focused hook
function useVideoPlayer() {
  return {
    play, pause, seek,
    isPlaying, currentTime, duration
  };
}
```

**Feature Hooks**: Focus on UI interactions
```typescript
// ✅ Good: UI-focused hook
function useVideoControls() {
  return {
    showControls, hideControls,
    handleVideoTap, resetAutoHideTimer
  };
}
```

### 4. Component Composition

Use composition over inheritance:
```typescript
// ✅ Good: Composition pattern
function VideoPlayerWidget() {
  return (
    <VideoPlayerSection>
      <VideoDisplay />
      <VideoControls />
      <VideoProgress />
    </VideoPlayerSection>
  );
}
```

## Conclusion

The three-layer architecture in FSD provides a robust foundation for building scalable, maintainable React Native applications. Our video system demonstrates how entities, features, and widgets work together to create sophisticated functionality while maintaining clear separation of concerns.

Key takeaways:
- **Entities** manage business logic and state
- **Features** handle user interactions and UI
- **Widgets** compose multiple features into complex UIs
- **Clean dependencies** enable independent development and testing
- **Modular design** supports performance optimization and code reuse

This architecture scales from simple applications to enterprise-grade systems while maintaining code quality and developer productivity.