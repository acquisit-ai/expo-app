# Project Architecture & Tech Stack

---

## 1. Core Architecture: Feature-Sliced Design (FSD)

This project adopts **Feature-Sliced Design (FSD)** as its core code organization method. FSD decomposes the app into manageable, highly decoupled business-domain modules through strict, standardized layering and modularization rules.

**Project maturity**: This project has reached an enterprise-grade standard. All layers are fully implemented, the architecture is stable, and there is no technical debt.

### FSD Layers and Responsibilities

The codebase lives under `/src` and is divided into layers. Dependencies are one-way: **upper layers may depend on lower layers, but lower layers must never depend on upper layers. Dependencies across the same layer are also forbidden.**

| Layer          | Directory (`/src`) | Core Responsibility                                                                                                                                                                                                                                                                                                  |
| :------------- | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`app`**      | `app/`             | App entry, global configuration, and navigation architecture. Initializes services, global context providers (Providers), and composes React Navigation navigators. **Reference**: `app/navigation/` — conditional stack rendering, Modal Presentation, Replace mode.                                                |
| **`pages`**    | `pages/`           | A complete, routable screen. Composes `widgets` and `features` to build UI. Uses React Navigation for page navigation.                                                                                                                                                                                               |
| **`widgets`**  | `widgets/`         | Reusable composite UI blocks built from multiple `features` and `entities`. Main building blocks of pages. **Reference**: `widgets/small-video-player-section/` and `widgets/fullscreen-video-player-section/` — multi-feature composition, SharedValue animation coordination, cross-widget communication patterns. |
| **`features`** | `features/`        | Encapsulates a single, complete user interaction that directly delivers business value (e.g., tap a button, submit a form). **Reference**: `features/video-player/` — strategy-pattern UI architecture, Props-based data flow, Context Provider pattern.                                                             |
| **`entities`** | `entities/`        | Defines core domain models (e.g., user, video) and their related data, UI, and foundational logic. **Reference**: `entities/video/` — v6.0.0 single-pointer architecture; `entities/video-meta/` — SSOT architecture; `entities/player-pool/` — LRU cache management.                                                |
| **`shared`**   | `shared/`          | Business-agnostic, app-wide reusable foundations (e.g., UI Kit, API clients, utilities).                                                                                                                                                                                                                             |

### Slices and Segments

* **Slices**: Within `pages`, `widgets`, `features`, `entities`, code is vertically partitioned by business domain (e.g., `entities/user`).
* **Segments**: Within each slice, code is horizontally partitioned by technical purpose; folders are typically named `ui`, `model`, `api`, `lib`.

**Key rule:** External modules may only import from the slice’s root `index.ts`, enforcing encapsulation.

### Reference Enterprise Implementation: FSD “Three-Layer” Pattern

The project’s **Video system** and **Feed system** are perfect examples of a three-layer FSD coordination pattern and serve as enterprise-grade reference implementations:

#### Video System Architecture (⭐ v5.0.0 conditional subscription refactor completed — multi-video performance optimization)

* **entities/video/**: v5.0.0 conditional subscription architecture (`useConditionalVideoPlayer`) + single-pointer architecture (`currentPlayerMeta: {playerInstance, videoId}`) + store simplification (remove session state) + fine-grained subscriptions + player-controls utility library + 99% performance improvement
* **entities/video-meta/**: SSOT architecture + Map-based O(1) storage + `subscribeWithSelector` optimization + reactive updates + unified user-interaction data management (`isLiked/isFavorited/viewCount`, etc.)
* **entities/player-pool/**: v5.0.0 VideoId-based architecture + fully immune to Feed trimming + LRU cache management (17 instances: 13 main pool + 4 available) + window extension (`extendWindowNext/Prev`) + dynamic index computation (`indexOf`) + PreloadScheduler three-layer scheduling + O(1) task cancellation + dual-lock mechanism + dual-pool dual-mode management
* **features/video-player/**: Props-based data flow + component split (SmallVideoPlayer / FullscreenVideoPlayer) + HLS support (300ms debounce) + auto-play
* **features/video-core-controls/**: strategy-pattern UI reference implementation + three specialized layout strategies (SmallScreen / FullscreenPortrait / FullscreenLandscape) + VideoCoreControlsProvider + independent Context design
* **features/video-gestures/**: cross-feature gesture coordination + multi-layer event handling + SharedValue gesture handling + non-destructive interaction model
* **features/video-window-management/**: v1.0 dependency-injection architecture + feature-layer coordination module + resolves Player Pool’s dependency on other Entities + multi-entity data coordination + callback factory pattern + window extension API encapsulation
* **widgets/video-controls-overlay/**: v2.2 multi-feature composition widget + FSD-compliant architecture + composes `video-core-controls` + `video-gestures` + `subtitle-display` + cross-feature state coordination + conditional subscription integration + layout strategy selection
* **features/playback-settings/**: 6 speed levels + volume control + background playback + long-press trigger (500ms)
* **features/detail-info-display/**: Context isolation architecture + single-point coupling design + display-only feature
* **features/detail-interaction-bar/**: zero-state Context proxy + fine-grained subscription + four interaction controls (like / favorite / translate / subtitles)
* **features/fullscreen-feed-list/**: TikTok-style fullscreen swipe list (planned) + paginated scrolling + single video per screen
* **features/subtitle-display/**: v3.2 conditional subscription + independent hook `useSubtitleNavigation` + enhanced subtitle system + smart navigation logic + click-to-seek support
* **widgets/small-video-player-section/**: v2.0 active video detection + conditional rendering optimization + small player composition + dual-mode scroll animation + 4+ feature integrations + 90% performance improvement
* **widgets/fullscreen-video-player-section/**: v2.0 conditional subscription support + fullscreen player composition + three-layer composition architecture + static config optimization + architectural consistency
* **widgets/tab-bar/**: dual TabBar implementations (BlurTabBar + LiquidGlassTabBar) + React Navigation integration + dynamic selection + haptic feedback
* **app/navigation/**: RootNavigator conditional rendering + VideoStack Modal Presentation + Replace strategy + Screen wrapper pattern

#### Feed System Architecture (⭐ v2.3 VideoId-based scroll sync completed)

* **entities/feed/**: v2.0.0 ID-based architecture + stores `videoIds` (not full objects) + Video Meta Entity integration + 50-item sliding window queue + playback state management + `maintainVisibleContentPosition` integration
* **features/feed-fetching/**: stateless API design + JWT auth + business coordination + enhanced collision-resistant mock data generation + full `isLoading` lifecycle management
* **features/feed-list/**: v1.4 ref forwarding + FlatList integration + video card rendering + visibility management + sensitivity tuning (`onEndReachedThreshold: 0.5`) + FEED_CONSTANTS export + `getItemLayout` optimization
* **pages/feed/**: v2.3 smart scroll sync + immune to Feed trimming (`indexOf videoId`) + auto-scroll on fullscreen return + Player Pool v5.0 integration + init flow + load-more control + 1-second debounce
* **pages/video-fullscreen/**: v3.0 VideoId-based window management + Feed trimming immunity + window extension integration + refactored `useFullscreenScrollWindow` + dynamic index computation + orientation switching + hardware back button handling

These two “three-layer” implementations demonstrate FSD best practices and can serve as architectural references for new feature development.

---

## 2. Tech Stack

The table below summarizes the project’s key third-party libraries and how they fit into the FSD architecture.

| Library                                                                                              | Role                                           | Why Chosen                                                                                       | FSD Integration                                                                                                                              |
| :--------------------------------------------------------------------------------------------------- | :--------------------------------------------- | :----------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **`@tanstack/react-query`** & **`@tanstack/react-query-persist-client`**                             | Server state management, caching, offline sync | Industry standard; strong offline + persistence; natively solves data sync and request queueing. | Used via hooks in `features` and `entities` under `model` or `api`.                                                                          |
| **`zustand`**                                                                                        | Global client state (UI state)                 | Minimal API, no boilerplate; great for simple global state like theme, modals.                   | Stores in `shared/model`, consumed app-wide via hooks.                                                                                       |
| **`drizzle-orm`** & **`drizzle-kit`**                                                                | Type-safe SQLite ORM + migrations              | Compile-time SQL validation to avoid runtime errors; improves robustness.                        | Schema in `entities/{slice}/model`; service wrappers in `shared/lib`.                                                                        |
| **`expo-sqlite`**                                                                                    | Low-level SQLite driver                        | Built-in high-performance local DB solution in Expo ecosystem.                                   | Wrapped by Drizzle’s Expo driver; transparent to upper layers.                                                                               |
| **`react-hook-form`** & **`@hookform/resolvers`** & **`zod`**                                        | Form state + validation                        | High-performance, type-safe form processing.                                                     | Mostly used in `features` UI; schemas in `entities/{slice}/model`.                                                                           |
| **`@react-navigation/native`** & **`@react-navigation/stack`** & **`@react-navigation/bottom-tabs`** | Navigation system                              | Industry standard; supports Stack/Tab/Modal; fully type-safe.                                    | Navigator config in `src/app/navigation/` (Root/MainTab/VideoStack/AuthStack).                                                               |
| **`expo-glass-effect`**                                                                              | iOS 18+ “Liquid Glass” effect                  | Expo’s next-gen visual effect library; native iOS liquid-glass effect; high performance.         | Used in `widgets/tab-bar/` LiquidGlassTabBar; gated by `isLiquidGlassAvailable()`.                                                           |
| **`react-native-size-matters`**                                                                      | Responsive scaling                             | Smart scaling for consistent cross-device UI.                                                    | Wrapped in `shared/lib/metrics.ts` for style utilities.                                                                                      |
| **`@react-native-async-storage/async-storage`**                                                      | Local persistence                              | Cross-platform async storage for user preferences.                                               | Used in `shared/providers/ThemeProvider.tsx` (theme persistence) and `features/auth/api/supabase.ts` (session persistence).                  |
| **`@supabase/supabase-js`**                                                                          | BaaS: auth + realtime DB                       | Leading BaaS; complete auth + realtime + cloud DB; RN-optimized.                                 | Client in `features/auth/api/supabase.ts`; auth logic in `features/auth`; user data in `entities/user` with event-driven separation.         |
| **`react-native-reanimated`**                                                                        | High-performance animation                     | Native-performance smooth animations.                                                            | Used in UI components and transitions; video pages use advanced animation architecture (scroll offset management, SharedValue coordination). |
| **`react-native-safe-area-context`**                                                                 | Safe area handling                             | Adapts for notches/status bars.                                                                  | Used in layout components.                                                                                                                   |
| **`react-native-screens`**                                                                           | Native screen management                       | More efficient rendering.                                                                        | Automatically integrated with navigation.                                                                                                    |
| **`@expo/vector-icons`**                                                                             | Icon library                                   | Official Expo icon library.                                                                      | Used in UI components.                                                                                                                       |
| **`@backpackapp-io/react-native-toast`**                                                             | Unified Toast system                           | High-performance native toast with gesture support and lifecycle management.                     | DI architecture in `shared/lib/toast/` (ToastManager, branded type validation, React.memo optimization) to avoid circular deps.              |
| **`react-native-modalfy`**                                                                           | Modal management                               | Centralized modal stack with type safety.                                                        | Config in `shared/lib/modal/`; modal definitions in features; unified `AppModalStackParamsList`.                                             |
| **`@react-native-segmented-control/segmented-control`**                                              | Segmented control                              | Native iOS segmented control.                                                                    | Used in `features/playback-settings` for speed selection with theme integration.                                                             |
| **`expo-haptics`**                                                                                   | Haptic feedback                                | Native haptics.                                                                                  | Used for interaction feedback (e.g., playback toggles).                                                                                      |
| **`react-native-paper`**                                                                             | Material Design UI                             | Full component system + theming + responsive support.                                            | Replaces styled-components; used heavily in Toast + UI system with deep theme integration.                                                   |
| **`expo-video`**                                                                                     | Modern video player                            | Expo’s next-gen player; replaces `expo-av`; improved performance and stability.                  | Used in `features/video-player` and related components.                                                                                      |
| **`react-native-awesome-slider`**                                                                    | High-performance slider                        | Reanimated-based native-performance slider with advanced gestures.                               | Used for progress and volume controls.                                                                                                       |
| **`react-native-progress`**                                                                          | Progress indicators                            | Multiple progress/loading styles with animation.                                                 | Used for buffering/loading states.                                                                                                           |
| **`expo-glass-effect`** & **`expo-blur`**                                                            | Visual effects combo                           | Official glass + blur effects; native performance.                                               | Dual visual-effect system: Glassmorphism and Blur Effects run in parallel.                                                                   |
| **Performance Optimization Libraries**                                                               | Style caching & precomputation                 | Reduces runtime compute, improves render performance, prevents memory leaks.                     | StyleSheet caching and Paper theme optimization across layers; dedicated hooks in `shared/providers/`.                                       |

---

## 3. UI & Styling Architecture

The project uses a **Design System** approach to ensure visual consistency and development efficiency.

### 3.1 Design Tokens

**Location**: `src/shared/config/theme.ts`

Design tokens are the single source of truth for visual properties, including:

* **Palette**: centralized raw color values
* **Semantic colors**: functional mappings (primary, success, error, etc.)
* **Spacing**: unified 4-based spacing (4px, 8px, 12px…)
* **Typography**: standardized font size/weight/line-height
* **Radius**: unified borderRadius rules
* **Shadows**: layered shadow definitions
* **Animation durations**: consistent timing values

### 3.2 Theming

**Location**: `src/shared/providers/ThemeProvider.tsx`

* **Modes**: light, dark, follow system
* **Persistence**: saved locally automatically
* **Type-safe**: full TypeScript support
* **Hot switching**: instant theme switch without app restart

### 3.3 React Native Paper Architecture

**Location**: `src/shared/ui/`

* **Paper components**: modern React Native Paper components
* **Theme integration**: automatic light/dark integration
* **Type safety**: full TypeScript support
* **Responsive support**: integrates `react-native-size-matters`
* **Performance**: StyleSheet + precomputed styles improve rendering

### 3.4 UI Component Library

**Location**: `src/shared/ui/`

A complete themed component library:

| Component         | Purpose              | Highlights                                |
| ----------------- | -------------------- | ----------------------------------------- |
| `Button`          | Button               | variants, sizes, loading, icons           |
| `Input`           | Input                | label, error, helper text, icons          |
| `Card`            | Card container       | configurable padding/radius/shadow/border |
| `Typography`      | Text                 | semantic H1/H2/H3/Body/Caption/Label      |
| `Container`       | Layout container     | safe area, scroll, center, background     |
| `Row/Column`      | Layout               | Flexbox wrappers, spacing, alignment      |
| `Spacer`          | Spacing              | unified vertical/horizontal spacing       |
| `PageContainer`   | Page container       | unified page layout + safe area           |
| `Avatar`          | Avatar               | circular avatar + placeholder             |
| `ListItem`        | List item            | configurable icon/title/description       |
| `Switch`          | Switch               | iOS-style toggle                          |
| `SectionTitle`    | Section title        | unified style                             |
| `ListSection`     | List group container | grouped lists                             |
| `PageHeader`      | Page header          | standardized header                       |
| `CenteredContent` | Centered layout      | center content                            |
| `StatCard`        | Stats card           | data display card                         |
| `Alert`           | Alert utilities      | preset alert helper functions             |

### 3.5 Responsive System

**Location**: `src/shared/lib/metrics.ts`

* smart scaling based on `react-native-size-matters`
* scaling functions: `scale`, `verticalScale`, `moderateScale`
* seamless style integration

### 3.6 Development Rules

**Strictly forbidden:**

* hard-coded colors (e.g., `color: '#333333'`)
* hard-coded sizes (e.g., `width: 300`)
* raw numeric spacing (e.g., `margin: 10`)

**Must use:**

* theme colors: `theme.colors.primary`
* spacing tokens: `theme.spacing.md`
* responsive tools: `moderateScale(16)`
* UI library components: `<Button>` instead of `<TouchableOpacity>`

### 3.7 Visual Effects Architecture

The project implements two enterprise-grade visual effect systems: **Glassmorphism** and **Blur Effects**. Both use the same factory pattern, precomputed caching, and performance-monitoring architecture.

#### Glassmorphism Architecture

**Location**: `src/shared/config/theme/glass-factory.ts` and `src/shared/providers/GlassProvider.tsx`

An enterprise glass effect system combining gradient + transparency + blur.

**Core components**

* **GlassStyleFactory**: singleton factory; precomputes and caches all glass styles; supports a two-level cache
* **GlassProvider**: dedicated glass context manager decoupled from ThemeProvider; exposes specialized hooks
* **Glass Presets**: component-specific preset configs (Card/Input/Button, etc.)
* **Specialized Hooks**: component-specific hooks (`useGlassCard`, `useGlassButton`, etc.) for optimized access

**Performance optimizations**

* precompute all styles once at Provider init to avoid runtime overhead
* two-level cache:

  * layer 1: style object cache (`isDark` → full style set)
  * layer 2: opacity calculation cache (reduces repeated rgba conversions)
* memory safety: lifecycle tracking + automatic memory management to prevent leaks
* hook specialization: reduces unnecessary rerenders; supports React.memo optimization

**Factory usage**

```typescript
// Singleton factory instance (global unique)
const glassStyleFactory = GlassStyleFactory.getInstance();

// Precomputed styles + smart caching + performance monitoring
const styles = glassStyleFactory.getStyles(isDark);
const cardPreset = glassStyleFactory.getPreset('card', isDark);
```

**Integration**

* provider hierarchy: GlassProvider sits between ThemeProvider and BlurProvider, receiving `isDark`
* component usage: glass components use specialized hooks with precomputed styles; supports hot switching
* dev monitoring: cache size monitoring, performance warnings, recompute tracing
* production optimizations: cache warm-up, style compression, batch update optimization

#### Blur Effects Architecture

**Location**: `src/shared/config/theme/blur/` and `src/shared/providers/BlurProvider.tsx`

An enterprise blur system combining semantic colors + animation.

**Core components**

* **BlurStyleFactory**: singleton factory; precomputes and caches blur styles; two-level cache
* **BlurProvider**: independent blur context manager running in parallel with GlassProvider; exposes specialized hooks
* **Blurism Configuration**: semantic configuration system with 10 color variants (success/error/warning/etc.)
* **Specialized Hooks**: component-specific hooks (`useBlurCard`, `useBlurButton`, `useBlurList`) for optimized access

**Performance optimizations**

* precompute at Provider init
* two-level cache:

  * style object cache (`isDark` → full style set)
  * opacity calc cache (reduces repeated rgba conversions)
* memory safety: lifecycle tracking + automatic management
* animation optimization: Reanimated integration; preset animated values to avoid runtime compute

**Semantic color system**

```typescript
// 10 semantic color variants, supports light/dark
type ColorVariant = 'default' | 'success' | 'error' | 'warning' | 'info'
                  | 'primary' | 'secondary' | 'neutral' | 'highlight' | 'disabled';
```

**Factory usage**

```typescript
// Singleton factory instance, runs parallel to GlassStyleFactory
const blurStyleFactory = BlurStyleFactory.getInstance();

// Precomputed styles + smart caching + performance monitoring
const styles = blurStyleFactory.getStyles(isDark);
```

**Integration**

* provider hierarchy: BlurProvider runs parallel with GlassProvider and receives `isDark`
* component usage: blur components use specialized hooks; supports animated feedback
* dev monitoring: cache size monitoring, performance warnings, recompute tracing
* dual-system coordination: independent operation; total memory usage < 4KB

**Dual-system advantages**

* **GlassProvider**: gradient + transparency + blur; ideal for elegant background scenes
* **BlurProvider**: semantic color + animation; ideal for status indication and interaction feedback
* independent caches; total memory < 4KB
* theme-synced via shared `isDark`

**Usage guidance**

* Glassmorphism: branding experience, forms, social login, elegant backgrounds
* Blur Effects: status, interaction feedback, lists, semantic color states
* performance: Glass for static beauty, Blur for dynamic interaction

---

## 4. Full Project Structure

```text
/
├── app/                     # Expo app entry
│   ├── _layout.tsx          # Root layout (5-provider hierarchy)
│   └── index.tsx            # App entry component
│
├── src/
│   ├── app/                 # ✅ App layer (navigation architecture) - fully implemented
│   │   ├── navigation/      # React Navigation architecture
│   │   │   ├── README.md    # Navigation docs
│   │   │   ├── CONTEXT.md   # Navigation technical docs
│   │   │   ├── index.ts     # Unified exports
│   │   │   ├── RootNavigator.tsx           # Root navigator (conditional rendering)
│   │   │   ├── MainTabNavigator.tsx        # Main tab navigator
│   │   │   ├── VideoStackNavigator.tsx     # Video stack (Modal)
│   │   │   ├── AuthStackNavigator.tsx      # Auth stack
│   │   │   └── screens/                    # Screen wrappers
│   │   │       ├── FeedScreen.tsx
│   │   │       ├── CollectionsScreen.tsx
│   │   │       ├── ProfileScreen.tsx
│   │   │       ├── VideoDetailScreen.tsx
│   │   │       ├── VideoFullscreenScreen.tsx
│   │   │       ├── LoginScreen.tsx
│   │   │       ├── VerifyCodeScreen.tsx
│   │   │       └── PasswordManageScreen.tsx
│   │   └── AppContent.tsx   # App content component
│   │
│   ├── pages/               # ✅ Pages layer (screens) - fully implemented
│   │   ├── auth/            # Auth pages
│   │   │   ├── README.md
│   │   │   └── ui/
│   │   │       ├── AuthPageLayout.tsx
│   │   │       ├── LoginPage.tsx
│   │   │       ├── PasswordManagePage.tsx
│   │   │       └── VerifyCodePage.tsx
│   │   ├── feed/            # Feed pages
│   │   │   ├── README.md
│   │   │   ├── CONTEXT.md
│   │   │   └── ui/
│   │   │       ├── FeedPage.tsx
│   │   │       └── FeedPageContent.tsx
│   │   ├── collections/
│   │   │   ├── README.md
│   │   │   └── ui/CollectionsPage.tsx
│   │   ├── profile/
│   │   │   ├── README.md
│   │   │   └── ui/ProfilePage.tsx
│   │   ├── video-detail/
│   │   │   ├── README.md
│   │   │   ├── CONTEXT.md
│   │   │   └── ui/
│   │   │       ├── VideoDetailPage.tsx
│   │   │       └── VideoDetailPageContent.tsx
│   │   └── video-fullscreen/
│   │       ├── README.md
│   │       ├── CONTEXT.md
│   │       ├── docs/
│   │       │   └── fullscreen-window-extension.md
│   │       ├── hooks/
│   │       │   └── useFullscreenScrollWindow.ts
│   │       └── ui/
│   │           ├── VideoFullscreenPage.tsx
│   │           ├── VideoFullscreenPageContent.tsx
│   │           └── debug/
│   │               └── FullscreenDebugPanel.tsx
│   │
│   ├── widgets/             # ✅ Widgets layer (composite UI blocks) - fully implemented
│   │   ├── CONTEXT.md
│   │   ├── index.ts
│   │   ├── tab-bar/
│   │   │   ├── CONTEXT.md
│   │   │   ├── README.md
│   │   │   ├── config/
│   │   │   │   └── tabConfig.ts
│   │   │   ├── index.ts
│   │   │   ├── lib/
│   │   │   │   └── iconUtils.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── ui/
│   │   │       ├── BlurTabBar.tsx
│   │   │       ├── LiquidGlassTabBar.tsx
│   │   │       └── TabBarItem.tsx
│   │   ├── small-video-player-section/
│   │   │   ├── CONTEXT.md
│   │   │   ├── README.md
│   │   │   ├── index.ts
│   │   │   └── ui/
│   │   │       └── SmallVideoPlayerSection.tsx
│   │   ├── fullscreen-video-player-section/
│   │   │   ├── CONTEXT.md
│   │   │   ├── README.md
│   │   │   ├── index.ts
│   │   │   └── ui/
│   │   │       └── FullscreenVideoPlayerSection.tsx
│   │   ├── video-controls-overlay/
│   │   │   ├── CONTEXT.md
│   │   │   ├── index.ts
│   │   │   ├── ui/
│   │   │   │   ├── VideoControlsOverlay.tsx
│   │   │   │   ├── AnimatedPlayButton.tsx
│   │   │   │   └── SeekFeedback.tsx
│   │   │   └── hooks/
│   │   │       ├── useVideoControlsComposition.ts
│   │   │       ├── useVideoGestureCallbacks.ts
│   │   │       ├── useControlsAutoHide.ts
│   │   │       ├── useScrollAwareVisibility.ts
│   │   │       └── useVideoAnimation.ts
│   │   └── video-player-section/     # ⚠️ Deprecated (split into the two modules above)
│   │       └── CONTEXT.md
│   │
│   ├── features/            # ✅ Features layer (user interactions) - extended implementation
│   │   ├── auth/            # Auth UI feature module (class-based architecture)
│   │   │   ├── model/
│   │   │   │   ├── auth-state-manager.ts
│   │   │   │   ├── auth-types.ts
│   │   │   │   ├── cooldown-manager.ts
│   │   │   │   ├── validation.ts
│   │   │   │   ├── CONTEXT.md
│   │   │   │   └── index.ts
│   │   │   ├── api/
│   │   │   │   ├── auth-api.ts
│   │   │   │   ├── supabase.ts
│   │   │   │   └── index.ts
│   │   │   ├── lib/
│   │   │   │   ├── auth-helpers.ts
│   │   │   │   ├── auth-operations.ts
│   │   │   │   ├── config.ts
│   │   │   │   ├── error-utils.ts
│   │   │   │   ├── useFormValidation.ts
│   │   │   │   └── index.ts
│   │   │   ├── ui/
│   │   │   │   ├── AuthLoginCard.tsx
│   │   │   │   ├── BaseAuthCard.tsx
│   │   │   │   ├── PasswordToggleIcon.tsx
│   │   │   │   ├── ForgotPasswordLink.tsx
│   │   │   │   ├── SocialLoginButtons.tsx
│   │   │   │   ├── AuthEmailCodeCard.tsx
│   │   │   │   ├── AuthResetPasswordCard.tsx
│   │   │   │   ├── LoginHeader.tsx
│   │   │   │   ├── FormField.tsx
│   │   │   │   └── index.ts
│   │   │   ├── README.md
│   │   │   └── index.ts
│   │   ├── theme/
│   │   │   └── ui/ThemeCard.tsx
│   │   ├── video-player/
│   │   │   ├── CONTEXT.md
│   │   │   ├── README.md
│   │   │   ├── ui/
│   │   │   │   ├── SmallVideoPlayer.tsx
│   │   │   │   ├── FullscreenVideoPlayer.tsx
│   │   │   │   └── components/
│   │   │   ├── hooks/
│   │   │   ├── model/
│   │   │   ├── lib/
│   │   │   └── index.ts
│   │   ├── video-core-controls/
│   │   │   ├── CONTEXT.md
│   │   │   ├── README.md
│   │   │   └── ui/
│   │   ├── video-gestures/
│   │   │   ├── CONTEXT.md
│   │   │   ├── README.md
│   │   │   └── ui/
│   │   ├── video-window-management/
│   │   │   ├── CONTEXT.md
│   │   │   └── index.ts
│   │   ├── playback-settings/
│   │   │   ├── CONTEXT.md
│   │   │   ├── README.md
│   │   │   └── ui/
│   │   ├── detail-info-display/
│   │   │   ├── README.md
│   │   │   ├── CONTEXT.md
│   │   │   ├── hooks/
│   │   │   │   └── VideoInfoDisplayContext.tsx
│   │   │   ├── model/
│   │   │   │   └── types.ts
│   │   │   ├── ui/
│   │   │   │   ├── VideoInfoDisplaySection.tsx
│   │   │   │   └── VideoInfoSection.tsx
│   │   │   └── index.ts
│   │   ├── detail-interaction-bar/
│   │   │   ├── README.md
│   │   │   ├── CONTEXT.md
│   │   │   ├── hooks/
│   │   │   │   └── VideoInteractionContext.tsx
│   │   │   ├── ui/
│   │   │   │   ├── VideoInteractionSection.tsx
│   │   │   │   └── VideoInteractionBar.tsx
│   │   │   └── index.ts
│   │   ├── fullscreen-feed-list/     # Planned
│   │   │   ├── README.md
│   │   │   ├── CONTEXT.md
│   │   │   ├── lib/
│   │   │   ├── model/
│   │   │   ├── ui/
│   │   │   └── index.ts
│   │   ├── feed-list/
│   │   │   ├── README.md
│   │   │   ├── lib/
│   │   │   │   └── constants.ts
│   │   │   └── ui/
│   │   ├── feed-fetching/
│   │   │   ├── README.md
│   │   │   └── api/
│   │   ├── subtitle-fetching/
│   │   │   ├── README.md
│   │   │   ├── CONTEXT.md
│   │   │   ├── USAGE.md
│   │   │   ├── index.ts
│   │   │   ├── api/
│   │   │   │   ├── subtitle-api.ts
│   │   │   │   └── types.ts
│   │   │   ├── lib/
│   │   │   │   ├── subtitle-fetcher.ts
│   │   │   │   ├── subtitle-cache.ts
│   │   │   │   ├── data-transformer.ts
│   │   │   │   ├── error-handler.ts
│   │   │   │   └── CACHE_DOCUMENTATION.md
│   │   │   ├── hooks/
│   │   │   │   ├── useSubtitleDataSource.ts
│   │   │   │   └── useSubtitleLoader.ts
│   │   │   └── model/
│   │   │       ├── types.ts
│   │   │       └── store.ts
│   │   ├── subtitle-display/
│   │   │   ├── README.md
│   │   │   ├── CONTEXT.md
│   │   │   ├── index.ts
│   │   │   ├── lib/
│   │   │   │   └── useSubtitleDisplay.ts
│   │   │   ├── model/
│   │   │   │   └── types.ts
│   │   │   └── ui/
│   │   │       ├── SubtitleDisplay.tsx
│   │   │       ├── SubtitleNavigationControls.tsx
│   │   │       └── IntegratedSubtitleView.tsx
│   │   └── index.ts
│   │
│   ├── entities/            # ✅ Entities layer (domain models) - extended implementation
│   │   ├── user/
│   │   │   ├── README.md
│   │   │   ├── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useSession.ts
│   │   │   │   ├── useTokens.ts
│   │   │   │   ├── useUserActions.ts
│   │   │   │   └── useUserProfile.ts
│   │   │   └── model/
│   │   │       ├── store.ts
│   │   │       └── types.ts
│   │   ├── subtitle/
│   │   │   ├── README.md
│   │   │   ├── CONTEXT.md
│   │   │   ├── index.ts
│   │   │   ├── model/
│   │   │   │   ├── subtitle.ts
│   │   │   │   ├── raw-types.ts
│   │   │   │   └── store.ts
│   │   │   ├── lib/
│   │   │   │   └── search.ts
│   │   │   └── hooks/
│   │   │       └── useSubtitleEntity.ts
│   │   └── video/
│   │       ├── README.md
│   │       ├── CONTEXT.md
│   │       ├── index.ts
│   │       ├── hooks/
│   │       │   ├── player-control/
│   │       │   │   ├── index.ts
│   │       │   │   ├── useVideoPlayer.ts
│   │       │   │   ├── useVideoPlaybackStatus.ts
│   │       │   │   └── useVideoPlayerControls.ts
│   │       │   ├── instance-management/
│   │       │   │   ├── index.ts
│   │       │   │   ├── usePlaybackPageManager.ts
│   │       │   │   ├── usePlaybackPageState.ts
│   │       │   │   ├── usePlaybackNavigation.ts
│   │       │   │   ├── usePlaybackBusinessLogic.ts
│   │       │   │   └── usePlayerLifecycle.ts
│   │       │   ├── videoview-sync/
│   │       │   │   ├── index.ts
│   │       │   │   ├── usePlayerEventSync.ts
│   │       │   │   └── useTimeUpdateInterval.ts
│   │       │   ├── useCurrentVideoData.ts
│   │       │   └── useVideoOverlayManager.ts
│   │       └── model/
│   │           ├── store.ts
│   │           ├── types.ts
│   │           ├── selectors.ts
│   │           └── playbackPageTypes.ts
│   │
│   └── shared/              # ✅ Shared layer (business-agnostic foundations) - fully implemented
│       ├── lib/
│       │   ├── index.ts
│       │   ├── logger.ts
│       │   ├── metrics.ts
│       │   ├── private-data-masking.ts
│       │   └── toast/
│       │       ├── README.md
│       │       ├── index.ts
│       │       ├── types.ts
│       │       ├── constants.ts
│       │       ├── lib/
│       │       │   └── toastManager.tsx
│       │       └── ui/
│       │           └── ToastView.tsx
│       ├── config/
│       │   ├── index.ts
│       │   ├── environment.ts
│       │   └── theme/
│       │       ├── CONTEXT.md
│       │       ├── README.md
│       │       ├── colors.ts
│       │       ├── glass/
│       │       │   ├── index.ts
│       │       │   ├── glassmorphism.ts
│       │       │   └── factory.ts
│       │       ├── blur/
│       │       │   ├── index.ts
│       │       │   ├── blurism.ts
│       │       │   └── factory.ts
│       │       ├── index.ts
│       │       ├── paper-theme.ts
│       │       ├── tokens.ts
│       │       └── types.ts
│       ├── hooks/
│       │   ├── index.ts
│       │   ├── CONTEXT.md
│       │   ├── useAfterInteractions.ts
│       │   ├── useFocusState.ts
│       │   ├── useForceStatusBarStyle.ts
│       │   ├── usePlayerReadyState.ts
│       │   ├── useMountedState.ts
│       │   ├── useAsyncSafeState.ts
│       │   ├── useDebounce.ts
│       │   ├── useOrientationDetection.ts
│       │   ├── useEventSubscription.ts
│       │   ├── useBackHandler.ts
│       │   ├── useTimer.ts
│       │   └── usePlayerPlaying.ts
│       ├── model/
│       │   ├── CONTEXT.md
│       │   └── index.ts
│       ├── providers/
│       │   ├── CONTEXT.md
│       │   ├── ThemeProvider.tsx
│       │   ├── GlassProvider.tsx
│       │   ├── BlurProvider.tsx
│       │   ├── ToastProvider.tsx
│       │   ├── AuthProvider.tsx
│       │   └── index.ts
│       ├── types/
│       │   └── index.ts
│       └── ui/
│           ├── README.md
│           ├── CONTEXT.md
│           ├── Button.tsx
│           ├── Input.tsx
│           ├── Card.tsx
│           ├── Typography.tsx
│           ├── Container.tsx
│           ├── Spacer.tsx
│           ├── PageContainer.tsx
│           ├── Avatar.tsx
│           ├── ListItem.tsx
│           ├── Switch.tsx
│           ├── SectionTitle.tsx
│           ├── ListSection.tsx
│           ├── PageHeader.tsx
│           ├── CenteredContent.tsx
│           ├── StatCard.tsx
│           ├── VIPBadge.tsx
│           ├── Alert.tsx
│           ├── LoadingScreen.tsx
│           ├── EmailInput.tsx
│           ├── InputIcon.tsx
│           ├── OTPInputWithButton.tsx
│           ├── Separator.tsx
│           ├── animated/
│           ├── animations/
│           ├── glass/
│           │   ├── GlassButton.tsx
│           │   ├── GlassCard.tsx
│           │   ├── GlassInput.tsx
│           │   ├── SocialButton.tsx
│           │   └── index.ts
│           ├── blur/
│           │   ├── BlurButton.tsx
│           │   ├── BlurCard.tsx
│           │   ├── BlurList.tsx
│           │   ├── VideoCard.tsx
│           │   └── index.ts
│           ├── layouts/
│           │   ├── Row.tsx
│           │   ├── Column.tsx
│           │   ├── Stack.tsx
│           │   └── index.ts
│           └── index.ts
│
├── docs/                    # Project documentation
│   ├── README.md
│   ├── ai-context/
│   │   ├── docs-overview.md
│   │   ├── project-structure.md
│   │   ├── session-sync-analysis.md
│   │   ├── system-integration.md
│   │   ├── deployment-infrastructure.md
│   │   └── handoff.md
│   ├── human-context/
│   │   ├── FeatureSlicedDesign.md
│   │   ├── library.md
│   │   ├── supabase.md
│   │   └── ui.md
│   ├── auth-api-guide.md
│   ├── auth-architecture.md
│   ├── auth-error-handling-guide.md
│   ├── auth-implementation-test.md
│   ├── password-merge-validation.md
│   ├── styled-components-migration-report.md
│   ├── ui-components-reference.md
│   ├── verify-code-merge-validation.md
│   ├── CONTEXT-tier2-component.md
│   └── CONTEXT-tier3-feature.md
│
├── assets/                  # Static assets (fonts, images)
│   ├── fonts/
│   └── images/
├── examples/
│   └── python-project/
├── specs-test/
├── .claude/
│   ├── hooks/
│   └── commands/
├── CLAUDE.md
├── MCP-ASSISTANT-RULES.md
├── app.json
├── babel.config.js
├── drizzle.config.ts
├── expo-env.d.ts
├── metro.config.js
├── package.json
└── tsconfig.json
```

---

## 5. Backend Integration Architecture

### 5.1 Supabase BaaS

The project integrates Supabase as the primary backend service, providing a complete auth system and cloud data services:

* **Auth**: email+password, OTP, password reset, etc.
* **Session management**: auto token refresh, persisted sessions, cross-device sync
* **Realtime**: realtime subscriptions and push notifications
* **Type safety**: deep TypeScript integration for end-to-end type safety

### 5.2 Advanced Auth Architecture Integration

The project implements enterprise-grade auth architecture with three coordination components, unified interfaces, and memory-safety guarantees:

**Three coordination components**

* **AuthOperations**: business logic coordinator; DI via constructor (Supabase client, Toast service, Logger, etc.)
* **AuthStateManager**: state machine managing auth state transitions/sync; `initializing | unauthenticated | authenticated | verifying`
* **CooldownManager**: rate-limit/cooldown manager; dual cooldowns (`sendCode: 60s`, `verify: 3s`)

**Unified interface design**

* **Parameterized mode switching**: `sendCode(email, mode: 'login' | 'forgotPassword')` and `verifyCode(email, code, mode)` unify login + password reset
* **Silent mode**: `signOut(silent?: boolean)` distinguishes user-initiated logout vs system cleanup
* **Decorator protection**: `withCooldownProtection` uniformly applies rate limiting to all API calls
* **Smart error classification**: `AuthHelpers.isUserError()` differentiates user vs system errors for different logging behavior

### 5.3 Environment Configuration Management

```bash
# Supabase backend config
EXPO_PUBLIC_SUPABASE_URL=https://hdipohslwswuhywkehwe.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API backend config
# Development
EXPO_PUBLIC_API_DEV_HOST=34.56.132.171
EXPO_PUBLIC_API_DEV_PORT=8000

# Staging
EXPO_PUBLIC_API_STAGING_BASE_URL=https://api-staging.acquisit.ai
```

**Environment variable categories**

* **Supabase config**: connection params for auth, database, realtime
* **API backend config**: multi-environment endpoints (dev/staging)
* **`EXPO_PUBLIC_`**: prefix for client-accessible vars
* **Provider system config**: theme storage keys, Toast queue limits, glass cache size, etc.

**Config files**

* `src/shared/config/environment.ts` — unified env var management + Supabase config validation
* `src/features/auth/api/supabase.ts` — Supabase client instance + AsyncStorage integration
* `.env` — local env file (contains actual values)

### 5.4 Auth Refactor Details (⭐ Latest Architecture)

#### Core Principles

The project uses an **event-driven auth architecture**, fully aligned with FSD, achieving clean separation between auth operations and user data management:

```text
Supabase SDK (auth APIs)
    ↓ (events)
features/auth (auth operations)
    ↓ (data sync)
entities/user (user data)
    ↓ (selectors)
UI Components
```

#### Layer Responsibilities

| Layer             | Responsibility           | Key Files                                | State Scope                                                 |
| ----------------- | ------------------------ | ---------------------------------------- | ----------------------------------------------------------- |
| **features/auth** | Auth business operations | `AuthProvider.tsx`, `auth-operations.ts` | auth flow state (`status`, `isSendingCode`, cooldown state) |
| **entities/user** | User data management     | `store.ts`, `hooks/`                     | session data (`user`, `tokens`, `email`, etc.)              |
| **UI Components** | Presentation             | pages/components                         | stateless; consumes via hooks                               |

#### Session Sync Mechanism

**Full event coverage**

* `INITIAL_SESSION`
* `SIGNED_IN`
* `SIGNED_OUT`
* `TOKEN_REFRESHED`
* `USER_UPDATED`
* `PASSWORD_RECOVERY`

**Sync flow**

```typescript
handleAuthStateChange(event, session)
  → syncUserStore(session)
  → UserStore.setSession()
```

#### Performance Optimization

**Fine-grained hooks**

* 25 specialized hooks grouped into 5 modules (auth status, session, tokens, profile, actions)
* components subscribe only to required fragments
* batched state updates reduce render cycles

**Memory safety**

* unmount checks: verify `isMountedRef.current` before async updates
* sync fault-tolerance: UserStore sync failure won’t break auth flow
* double-cleanup guarantee: signOut clears local state regardless of API success/failure

### 5.5 Multi-Provider Integration Architecture

**Five-provider hierarchy v2.0**

```typescript
ThemeProvider              // L1: theme state (light/dark/system) + persistence
└─ GlassProvider          // L2: glass effect system (receives isDark) + precomputed cache
   └─ BlurProvider        // L3: blur effect system (semantic colors + animation) (NEW v2.0)
      └─ ToastProvider    // L4: global notifications (Paper integration + DI)
         └─ AuthProvider  // L5: auth events (Supabase + UserStore sync)
```

**Event-driven refactor (⭐ Important update)**

* auth responsibility split: `features/auth` for operations; `entities/user` for data
* 4-state Provider machine: `initializing | unauthenticated | authenticated | verifying`
* AuthProvider listens to all Supabase events and syncs UserStore
* double data clearing: signOut uses a double-safety mechanism
* fine-grained hooks optimize rerenders

**Memory safety**

* unified `isMountedRef` pattern for Providers and Pages
* cleanup sets `isMountedRef.current = false` immediately
* async ops always check mount state
* `useMemo` caches Context values

**Cooldown protection**

* dual cooldowns: sendCode 60s, verify 3s
* CooldownManager owns timer lifecycles
* Toast feedback for cooldown states
* decorator applies cooldown uniformly

**Error handling & config**

* structured error types: `'validation' | 'network' | 'verification' | 'routing' | 'unknown'`
* smart classification: `AuthHelpers.isUserError()`
* centralized AuthConfig for cooldowns and Toast strings
* global Toast integration for feedback

**Class-based architecture benefits**

* unified friendly-error formatter (`getFriendlyErrorMessage`)
* state-machine transition control for error states
* structured logging via `shared/lib/logger.ts`

**Type system**

* extends Supabase native types (`AppUser`, `AppSession`)
* complete auth status enums (`AuthStatus`) and interfaces
* Supabase type system enables end-to-end safety

**Session persistence**

* React Native AsyncStorage integration
* session retained across app launches
* automatic refresh and expiry handling

---

## 6. Database Architecture

### SQLite + Drizzle ORM

* **DB file**: local SQLite via `expo-sqlite`
* **Schema**: `src/entities/{entity}/model/schema.ts`
* **Migrations**: generated scripts under `drizzle/`
* **Config**: `drizzle.config.ts`

### Data Persistence Strategy

* offline-first: fully usable without network
* incremental sync with Supabase
* compile-time type checks for all DB operations

---

## 7. Current Project Status (2025-01)

### 7.1 Implementation Completeness

**✅ Fully implemented layers**

* **app**: React Navigation architecture, RootNavigator conditional rendering, four-layer navigators (Root/MainTab/VideoStack/AuthStack), Screen wrapper pattern, five-provider integration
* **pages**: Feed (v1.1), video detail, fullscreen video, auth suite (Login/VerifyCode/PasswordManage), Collections scaffold, Profile scaffold
* **widgets**:

  * tab-bar (BlurTabBar + LiquidGlassTabBar, iOS 18+ support)
  * small-video-player-section (dual-mode scroll animation, 4+ features)
  * fullscreen-video-player-section (three-layer composition, enhanced subtitles)
* **features**:

  * video playback: video-player, video-core-controls, video-gestures, video-window-management, video-controls-overlay widget, playback-settings
  * video detail: detail-info-display, detail-interaction-bar
  * feed: feed-fetching, feed-list, fullscreen-feed-list (planned)
  * subtitles: subtitle-fetching (v2.0 pipeline), subtitle-display (smart navigation)
  * auth: auth (three-part coordination + event-driven)
* **entities**:

  * video entity v6.0.0 (single-pointer + state machine + Video Meta integration)
  * video-meta entity v1.0 (SSOT + Map O(1) + selector optimizations)
  * player-pool entity v3.0.0 (LRU + PreloadScheduler + dual locks)
  * feed entity v2.0 (ID-based + 50-item sliding window)
  * subtitle entity v2.0 (unified time units + pointer-optimized search)
  * user entity (event-driven sync + 25 fine-grained hooks)
* **shared**: UI library (22 Paper components + glass/blur components), five-provider architecture, dual visual effects, Toast system, theme system, shared hooks v2.0

**⏳ Pending features**

* learning: vocab learning, practice modes, progress tracking
* favorites: word favorites, categorization, review system
* data layer: local DB integration, offline sync, vocabulary management
* video content: data fetching, categorization, recommendation integration

### 7.2 Architecture Maturity

**Enterprise-grade features**

* full React Navigation architecture (conditional stacks, Modal Presentation, Replace strategy, Screen wrapper, type-safe routing)
* video entity v6.0.0: SSOT + single-pointer + state machine + 3-way sync + streamlined hooks
* three-layer video architecture reference: entities/video + entities/video-meta + entities/player-pool ↔ features/video-player ↔ widgets sections
* Props-based data flow + Context sharing to avoid prop drilling
* dual TabBar with dynamic selection
* subtitle system v2.0: unified time units + pointer-optimized search + smart navigation + three-layer coordination
* Feed v1.1: triple race-condition protection + `maintainVisibleContentPosition` + improved mock data

### 7.3 Feed System v1.1 Optimization Details

**Latest commit** (2025-09-28):

#### Triple race-condition protection

1. UI debounce: `FeedPage.tsx` ignores repeated `onEndReached` within 1 second via timestamp ref
2. Service-level checks: `feedService.ts` guards `isLoading` across `initializeFeed`, `loadMoreFeed`, `refreshFeed`
3. Data integrity guard: `store.ts` sets `isLoading=false` only after all data processing (including `maintainWindowSize`) completes

#### Smart index management

* removed manual index adjustments; relies on RN `maintainVisibleContentPosition`
* `onViewableItemsChanged` updates index after view stabilizes
* eliminates index-inaccuracy conflicts from manual computation

#### Enhanced mock data generation

* collision-resistant IDs: `video_{timestamp}_{randomPart}_{extraRandom}`
* 20 learning-content title templates + random lesson numbers (1–999)
* 19,980 possible title combinations for realism

#### FlatList sensitivity tuning

* `onEndReachedThreshold` from 1.0 → 0.5 to reduce false triggers
* scroll anchor: `minIndexForVisible: 0` preserves continuity when trimming

#### Full loading lifecycle

```text
trigger → isLoading=true → API request → append data → maintain window → isLoading=false
```

Also includes:

* event-driven auth architecture separation + fine-grained hooks + dual cooldown protection
* complete documentation system: 20+ module README.md + CONTEXT.md covering core modules

**Developer experience**

* 100% FSD-compliant, clear boundaries
* end-to-end TypeScript safety
* type-safe React Navigation routing
* detailed docs and guides
* modular components for easy extension

### 7.3 Navigation Refactor Details (2025-10)

**Expo Router → React Navigation migration**

#### Core changes

1. file-based routing → configuration-based navigators under `src/app/navigation/`
2. route naming normalized: kebab-case (`/auth/login`) → PascalCase (`Login`)
3. unified navigation API: `useNavigation()` + `CommonActions`
4. four-layer navigators:

   * RootNavigator: conditional root switching (`isAuthenticated && hasPassword`)
   * MainTabNavigator: Collections / Feed / Profile
   * VideoStackNavigator: VideoDetail / VideoFullscreen, Modal Presentation
   * AuthStackNavigator: Login / VerifyCode / PasswordManage

#### Advantages

* safer conditional rendering of stacks
* modal presentation with gesture close + transparent backgrounds
* Replace strategy from detail → fullscreen to prevent back-stack and save memory
* Screen wrapper pattern simplifies config
* type-safe ParamList definitions

### 7.4 Technical Debt Status

**Architecture strengths**

* zero technical debt: all code follows best practices
* unified coding standards and patterns
* complete test coverage (navigation module as benchmark)
* performance: precompute, caching, memory safety

**Ready to scale**

* standardized module structures for fast feature integration
* reusable component library and utilities
* event-driven architecture supports complex business logic
* type-safe data flows and state management

---

## 8. More Structural Information

If you think you need more project details—such as structure or recommended libraries—check the markdown files under `docs/human-context`.
