# Modal System Documentation

*This file documents the global modal management system implementation within the shared/lib layer.*

## Modal System Architecture

The modal system implements a **centralized stack-based architecture** using React Native Modalfy for enterprise-grade modal management across the entire application:

### Core Components
- **ModalProvider** - Global modal management provider wrapping the application (shared/lib)
- **createModalStack** - Modal stack factory with customizable configurations (shared/lib)
- **Modal Registry** - Application-level modal registration center (app/config) ⭐
- **AppModalStackParamsList** - Type-safe parameter definitions for all modal types (app/config)

### 🏗️ Architecture Layers

```
app/config/modal-registry.ts    ← 应用级 Modal 注册中心（可依赖所有 Features）
         ↓ 使用
shared/lib/modal                 ← 通用 Modal 系统（不依赖 Features）
         ↓ 提供
ModalProvider, createModalStack  ← 底层工具
```

**设计原则：**
- ✅ **Shared 层**：提供通用 Modal 系统，不依赖任何 Feature
- ✅ **App 层**：聚合所有 Feature Modals，统一注册
- ✅ **符合 FSD 架构**：依赖方向正确（App → Features → Shared）

### Stack-Based Modal Management

#### Modal Registry Configuration (`app/config/modal-registry.ts`)

**⚠️ 注意：** `shared/lib/modal/config/modal-stack.ts` 已废弃，请使用 `app/config/modal-registry.ts`

```typescript
// app/config/modal-registry.ts
export interface AppModalStackParamsList {
  // Demo modals
  DemoModal: { origin: string; color: string; name: string; };
  IntroModal: undefined;
  // Feature modals
  ElementExplanationModal: {
    word: string;
    translation: string;
    label: string;
    definition: string;
    dictionaryLabel?: string;
    clearModalHighlight?: () => void;
  };
}

export const modalStack = createModalStack<AppModalStackParamsList>(modalConfig);
```

#### Modal Factory Pattern (`config/createModalStack.ts`)
- **Default Configuration**: Sophisticated animation presets with Bezier easing curves
- **Customizable Options**: Backdrop opacity, transition animations, and timing configurations
- **Animation System**: Complex interpolation with scale, rotation, and translation transforms
- **TypeScript Safety**: Full type safety across all modal parameters and configurations

### Implementation Patterns

#### Provider Integration Architecture
```typescript
// app/App.tsx
import { ModalProvider } from '@/shared/lib/modal';
import { modalStack } from '@/app/config/modal-registry';

function App() {
  return (
    <ModalProvider stack={modalStack}>
      {/* Application content */}
    </ModalProvider>
  );
}
```

#### Feature Modal Integration
- **Cross-Feature Integration**: Features can register modals in the global stack
- **Type-Safe Parameters**: Full TypeScript support for modal parameters
- **Lifecycle Management**: Automatic cleanup and state management
- **Theme Integration**: Modal components inherit application theme system

### Modal Configuration Patterns

#### Advanced Animation Configuration
```typescript
const modalConfig: ModalStackConfig = {
  ElementExplanationModal: {
    modal: ElementExplanationModal,
    backdropOpacity: 0.4,
    animateInConfig: {
      easing: Easing.inOut(Easing.exp),
      duration: 300,
    },
    transitionOptions: (animatedValue) => ({
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [1000, 0, 1000],
          }),
        },
      ],
    }),
  },
};
```

#### Modal Component Integration
- **BlurModal Integration**: Seamless integration with shared blur UI components
- **Theme Consistency**: Automatic theme system integration across all modals
- **Callback Patterns**: Support for cleanup callbacks and cross-modal communication

## Integration Points

### Feature Layer Integration
- **ElementExplanationModal**: Integrated from `@/features/subtitle-display` for word explanations
- **Parameter Passing**: Type-safe parameter validation and passing between features
- **State Coordination**: Modal state coordination with feature-level state management

### Shared UI Integration
- **BlurModal Components**: Leverages shared blur effect system for consistent visual design
- **Theme System**: Full integration with application theme provider system
- **Animation Coordination**: Coordinated animations with existing animation systems

### Provider System Integration
- **Application Level**: Integrated at the root provider level alongside theme and auth systems
- **Global Accessibility**: Modal system accessible from any component throughout the application
- **Memory Management**: Automatic modal stack cleanup and memory optimization

## Performance Characteristics

- **Stack Management**: Efficient modal stack with proper memory cleanup
- **Animation Performance**: Hardware-accelerated animations with React Native Reanimated integration
- **Type Safety**: Zero runtime type errors through comprehensive TypeScript integration
- **Lazy Loading**: Modal components loaded only when needed to optimize bundle size

## Usage Patterns

### Opening Modals
```typescript
import { useModal } from '@/shared/lib/modal';
import type { AppModalStackParamsList } from '@/app/config/modal-registry';

function ExampleComponent() {
  const { openModal } = useModal<AppModalStackParamsList>();

  const handleShowExplanation = () => {
    openModal('ElementExplanationModal', {
      word: 'example',
      translation: '示例',
      label: 'example',
      dictionaryLabel: '示例（词典）',
      definition: 'A representative example...',
      clearModalHighlight: () => {
        // Cleanup logic
      },
    });
  };
}
```

### Modal Component Implementation
```typescript
import type { ModalComponentProp, ModalComponentWithOptions } from '@/shared/lib/modal';
import type { AppModalStackParamsList } from '@/app/config/modal-registry';

const ExampleModal: ModalComponentWithOptions<
  ModalComponentProp<AppModalStackParamsList, void, 'ExampleModal'>
> = ({ modal: { addListener, currentModal, getParam } }) => {
  // Modal implementation with type-safe parameter access
  const word = getParam('word', 'default');

  return (
    <BlurModal type="square" sizeRatio={0.85}>
      {/* Modal content */}
    </BlurModal>
  );
};

// Optional: override default modal options
ExampleModal.modalOptions = {
  backdropOpacity: 0.6,
};
```

---

*This modal system demonstrates enterprise-grade modal management with sophisticated stack-based architecture, comprehensive TypeScript integration, and seamless feature-level modal registration patterns.*
