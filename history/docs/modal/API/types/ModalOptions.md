# ModalOptions

{% hint style="info" %}
Interface of the modal configuration options. These settings will let Modalfy how to render and animate a modal.
{% endhint %}

{% hint style="success" %}
**Note:** Each key in this object has a default value and may be overridden either in the `modalConfig` & `defaultModalOptions` objects in [**createModalStack()**](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack) or directly in the modal component file through [**`modalOptions`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentwithoptions).
{% endhint %}

{% tabs %}
{% tab title="TypeScript" %}

```typescript
import { Animated, ViewStyle } from "react-native";

export interface ModalOptions {
  animateInConfig?: Pick<Animated.TimingAnimationConfig, "duration" | "easing">;

  animationIn?: (
    animatedValue: Animated.Value,
    toValue: number,
    callback?: () => void
  ) => Animated.CompositeAnimation | void;

  animateOutConfig?: Pick<
    Animated.TimingAnimationConfig,
    "duration" | "easing"
  >;

  animationOut?: (
    animatedValue: Animated.Value,
    toValue: number,
    callback: () => void
  ) => Animated.CompositeAnimation | void;

  backBehavior?: "clear" | "pop" | "none";

  backdropAnimationDuration?: number;

  backdropColor?: ViewStyle["backgroundColor"];

  backdropOpacity?: number;

  backdropPosition?: "root" | "belowLatest";

  containerStyle?: ViewStyle;

  disableFlingGesture?: boolean;

  modal?: React.ComponentType<any>;

  position?: "center" | "top" | "bottom";

  stackContainerStyle?:
    | ViewStyle
    | ((stackOpacity: Animated.Value) => ViewStyle);

  transitionOptions?: ModalTransitionOptions;
}

// ------------------ INTERNAL TYPES ------------------ //

export type ModalTransitionOptions = (animatedValue: Animated.Value) => {
  [key: string]:
    | {
        [key: string]: ModalTransitionValue;
      }[]
    | ModalTransitionValue;
};

export type ModalTransitionValue =
  | Animated.AnimatedInterpolation
  | string
  | number
  | undefined;
```

{% endtab %}
{% endtabs %}

{% embed url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/types.ts#L232-L406>" %}

## API reference

### `animateInConfig`

```typescript
animateInConfig?: Pick<Animated.TimingAnimationConfig, 'duration' | 'easing'>
```

Animation configuration used to animate a modal in, at the top of the stack. It uses `Animated.timing()` so if you want to use another animation type, see `animationIn`.&#x20;

**Note:** only `easing` and `duration` are needed.

**Default:** `{ easing: Easing.inOut(Easing.exp), duration: 450 }`

### `animationIn`

```typescript
animationIn?: (
  animatedValue: Animated.Value,
  toValue: number,
  callback?: () => void,
) => Animated.CompositeAnimation | void
```

Function that receives the `animatedValue` used by the library to animate the modal opening, and a `toValue` argument representing the modal position in the stack. Useful to implement your own animation [type](https://reactnative.dev/docs/animated#configuring-animations) and/or [composition](https://reactnative.dev/docs/animated#composing-animations) functions.

{% hint style="info" %}
Since Modalfy v3, the function receives a `callback` argument, which _can_ be called when the animation is finished, depending on whether or not you'll have a callback in a `openModal()`.
{% endhint %}

**Note:** If you just want to use `Animated.timing()`, check `animateInConfig`.

**Default:** -

**Example:**

```typescript
animationIn: (modalAnimatedValue, modalToValue, callback) => {
  Animated.parallel([
    Animated.timing(modalAnimatedValue, {
      toValue: modalToValue,
      duration: 300,
      easing: Easing.inOut(Easing.exp),
      useNativeDriver: true,
    }),
    Animated.timing(myOtherAnimatedValue, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.exp),
      useNativeDriver: true,
    }),
  ]).start(() => callback?.());
};
```

### `animateOutConfig`

```typescript
animateOutConfig?: Pick<Animated.TimingAnimationConfig, 'duration' | 'easing'>
```

Animation configuration used to animate a modal out (underneath other modals or when closing the last one).

**Note:** only `easing` and `duration` are needed.

**Default:** `{ easing: Easing.inOut(Easing.exp), duration: 450 }`

### `animationOut`

```typescript
animationOut?: (
  animatedValue: Animated.Value,
  toValue: number,
  callback: () => void,
) => Animated.CompositeAnimation | void
```

Function that receives the `animatedValue` used by the library to animate the modal closing, and a `toValue` argument representing the modal position in the stack. Useful to implement your own animation [type](https://reactnative.dev/docs/animated#configuring-animations) and/or [composition](https://reactnative.dev/docs/animated#composing-animations) functions.

{% hint style="danger" %} <mark style="color:red;">Since Modalfy v3, the function receives a</mark><mark style="color:red;">`callback`</mark> <mark style="color:red;"></mark><mark style="color:red;">argument, which</mark> <mark style="color:red;"></mark>_<mark style="color:red;">**must**</mark>_ <mark style="color:red;"></mark><mark style="color:red;">be called when the animation is finished.</mark>
{% endhint %}

**Note:** If you just want to use `Animated.timing()`, check `animateOutConfig`.

**Default:** -

**Example:**

```typescript
animationOut: (modalAnimatedValue, modalToValue, callback) => {
  Animated.parallel([
    Animated.timing(modalAnimatedValue, {
      toValue: modalToValue,
      duration: 300,
      easing: Easing.inOut(Easing.exp),
      useNativeDriver: true,
    }),
    Animated.timing(myOtherAnimatedValue, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.exp),
      useNativeDriver: true,
    }),
  ]).start(() => callback?.());
};
```

### `backBehavior`

```typescript
backBehavior?: 'clear' | 'pop' | 'none'
```

How you want the modal stack to behave when users press the backdrop, but also when the physical back button is pressed on Android.

**Notes:**&#x20;

- `'clear'` means that you want the whole stack to be cleared, whatever the amount of modals opened.
- `'pop'` means that you only want the modal at the top of the stack to be removed.
- `'none'` means that you don't want anything to happen, ie: users have to perform an action inside that modal before you programmatically remove it via `closeModal`.

**Default:** `'pop'`

### `backdropAnimationDuration`

```typescript
backdropAnimationDuration?: number
```

Number that defines how long the backdrop should take to animate in and out.

**Default:** `300`

### `backdropColor`

```typescript
backdropColor?: ViewStyle['backgroundColor']
```

Color of the modal stack backdrop.

**Default:** `'black'`

### `backdropOpacity`

```typescript
backdropOpacity?: number
```

Number between `0` and `1` that defines the backdrop opacity.

**Default:** `0.6`

### `backdropPosition`

```typescript
backdropPosition?: 'root' | 'belowLatest'
```

Where in the stack should the backdrop be displayed.

**Notes:**&#x20;

- `'root'` means the backdrop will be displayed below all the opened modals.
- `'belowLatest'` means the backdrop will only be displayed below the latest opened modal. The other opened modals will be below the backdrop.

**Default:** `'root'`

### `containerStyle`

```typescript
containerStyle?: ViewStyle
```

Styles applied to the `<View>` directly wrapping your modal component.

**Default:** `{}`

### `disableFlingGesture`

```typescript
disableFlingGesture?: boolean
```

Disable fling gesture detection to close the modal.

**Note:** the fling gesture handler is not enabled when `position` is `center`.

**Default:** `false`

### ‌`modal`

```typescript
modal?: React.ComponentType<any>
```

React component that will be rendered when you'll open the modal.

**Note:** only needed when you're using this inside `createModalStack()` 1st argument.

**Default:** -

### `pointerEventsBehavior`

```typescript
pointerEventsBehavior?: 'auto' | 'none' | 'current-modal-only' | 'current-modal-none'
```

How you want any modal to respond to a touch/click.

**Notes:**&#x20;

- `'auto'` means that you want the default behavior. The modal will catch touch events and propagate them automatically.
- `'none'` means that you don't want the modal to catch _any_ touch event. Touching/clicking on it will not trigger anything.
- `'current-modal-only'` means that you only want the modal at the top of the stack to be touchable/clickable. Interacting with any modal below will not be possible and will be considered as interacting with the backdrop instead.
- `'current-modal-none'` means that you don't want the current modal to be touchable/clickable. Nothing will happen when you'll interact with it but the modals below and the backdrop will still be reachable.

**Default:** `'auto'`

### `position`

```typescript
position?: 'center' | 'top' | 'bottom'
```

Vertical positioning of the modal.

**Default:** `'center'`

### `stackContainerStyle`

```typescript
stackContainerStyle?: ViewStyle | ((stackOpacity: Animated.Value) => ViewStyle)
```

Styles applied to the `<Animated.View>` directly wrapping the entire modal stack & backdrop.

The styles can be provided as a regular object or as a function (that will receive an `Animated.Value` representing the opacity of the modal stack as sole argument).&#x20;

`stackContainerStyle(animatedOpacityValue)` wil then need to return a React Native style object containing values (that can use the provided `animatedOpacityValue` to run animation interpolations).

**Note**: the object returned by `stackContainerStyle()` must contain keys that work with `useNativeDriver: true`.

**Default:** `{}`

### `transitionOptions`

```typescript
transitionOptions?: ModalTransitionOptions
```

`transitionOptions(animatedValue)` returns a React Native style object containing values that can use the provided `animatedValue` to run animation interpolations on a modal.

**Notes:**&#x20;

- Whenever you interpolate `animatedValue`, **the `inputRange` corresponds to the modal position in your stack**! `0` will translate to _"the modal is not rendered"_, `1` to _"this modal is on top of the stack/the only item in the stack"_, `2` to _"this modal is the 2nd item in the stack"_, etc.
- The last entry of `inputRange` will define how all the modals positioned at that index or more should animate. In the following example, any modal positioned 4th or more in the stack will have an opacity of `0`:

```typescript
opacity: animatedValue.interpolate({
  inputRange: [0, 1, 2, 3, 4],
  outputRange: [0, 1, 0.9, 0.6, 0],
});
```

- The object returned by `transitionOptions()` must contain keys that work with `useNativeDriver: true`. If some don't, consider using [`containerStyle`](#containerstyle).

**Default:** -
