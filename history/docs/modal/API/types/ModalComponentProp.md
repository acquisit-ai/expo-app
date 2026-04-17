# ModalComponentProp

{% hint style="info" %}
Interface of the `modal` prop exposed by the library specifically to modal components.
{% endhint %}

{% hint style="success" %}
**Note:** `ModalComponentProp` reuses the same types as [`ModalProp`](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop) and only adds 4 more on top of them. Starting with `v3.5.0`, `ModalProps` is a simplified way of using`ModalComponentProp`.
{% endhint %}

{% tabs %}
{% tab title="TypeScript" %}

```typescript
export type ModalComponentProp<
  P extends ModalfyParams,
  Props = unknown,
  M = keyof P
> = Props & {
  modal: UsableModalComponentProp<P, M>
}

export type ModalProps<
  N extends keyof ModalfyParams = keyof ModalfyParams,
  P = void
> = ModalComponentProp<
  ModalfyParams,
  P,
  N
>

// ------------------ INTERNAL TYPES ------------------ //

type ModalfyParams = { [key: string]: any }

interface UsableModalComponentProp<
  P extends ModalfyParams,
  M extends keyof P
> extends<UsableModalProp<P>> {
  addListener: ModalListener
  getParam: <N extends keyof P[M], D extends P[M][N]>(
    paramName: N,
    defaultValue?: D,
  ) => D extends P[M][N] ? P[M][N] : undefined
  params?: P[M]
  removeAllListeners: () => void
  setModalOptions: (modalOptions: ModalOptions) => void
}

type ModalListener = (
  eventName: ModalEventName,
  callback: ModalEventCallback,
) => ModalEventListener

type ModalOnAnimateEventCallback = (value?: number) => void
type ModalOnCloseEventCallback = (closingAction: {
  type: ModalClosingActionName
  origin: ModalClosingActionOrigin
}) => void
type ModalClosingActionName = 'closeModal' | 'closeModals' | 'closeAllModals'
type ModalClosingActionOrigin = 'default' | 'fling' | 'backdrop'
type ModalEventCallback = ModalOnAnimateEventCallback | ModalOnCloseEventCallback

type ModalEventListener = { remove: () => boolean }
```

{% endtab %}
{% endtabs %}

{% @github-files/github-code-block url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/types.ts#L429-L452>" %}

## API reference

### `addListener`&#x20;

```typescript
addListener: ModalListener;
```

Function that allows you to hook a listener to the modal component you're in. Right now, only 2 listener types are supported: `'onAnimate'` and `'onClose'`.

**Example:**&#x20;

{% tabs %}
{% tab title="TypeScript React" %}
{% code title="./modals/AlertModal.tsx" %}

```tsx
import {
  ModalProps,
  ModalEventListener,
  ModalOnCloseEventCallback,
  ModalOnAnimateEventCallback,
} from 'react-native-modalfy'
import React, { useRef } from 'react'

const AlertModal = ({ modal: { addListener } }: ModalProps<'AlertModal'>) => {
  const onAnimateListener = useRef<ModalEventListener | undefined>()
  const onCloseListener = useRef<ModalEventListener | undefined>()

  const handleAnimation: ModalOnAnimateEventCallback = useCallback((value) => {
    console.log('🆕 Modal animatedValue:', value)
  }, [])

  const handleClose: ModalOnCloseEventCallback = useCallback(
    closingAction => {
      console.log(`👋 Modal closed by: ${closingAction.type} • ${closingAction.origin}`)
    },
    []
  )

  useEffect(() => {
    onAnimateListener.current = addListener('onAnimate', handleAnimation)
    onCloseListener.current = addListener('onClose', handleClose)

    return () => {
      onAnimateListener.current?.remove()
      onCloseListener.current?.remove()
    }
  }, [addListener, handleAnimation, handleClose])

  return (
    //...
  )
}

export default AlertModal
```

{% endcode %}
{% endtab %}
{% endtabs %}

### `getParam`&#x20;

```typescript
getParam: <N extends keyof P[M], D extends P[M][N]>(
  paramName: N,
  defaultValue?: D,
) => D extends P[M][N] ? P[M][N] : undefined
```

Function that looks inside `params` and returns you the value of the key corresponding to `paramName`. Returns the provided `defaultValue` if nothing was found.

**Example:**&#x20;

{% tabs %}
{% tab title="React JSX" %}
{% code title="./modals/ErrorModal.js" %}

```tsx
import React from "react";
import { Button, Text, View } from "react-native";

const TITLES = {
  login: "We could not log you in",
  signup: "We could not create your account",
  unknown: "An error has occurred!",
};

const ErrorModal = ({ modal: { closeModal, getParam } }) => {
  const origin = getParam("origin", "unknown");
  const message = getParam("message", "Something went wrong... 🤔");

  return (
    <View>
      {/* 'An error has occurred!' */}
      <Text>{TITLES[origin]}</Text>
      {/* 'Your token has expired user' */}
      <Text>{message}</Text>
      <Button onPress={closeModal} title="OK" />
    </View>
  );
};

export default ErrorModal;
```

{% endcode %}
{% endtab %}
{% endtabs %}

### `params`&#x20;

```javascript
params?: P[M]
```

Optional params you provided when opening the modal you're in.

**Example:**

{% tabs %}
{% tab title="React JSX" %}
{% code title="./modals/ErrorModal.js" %}

```tsx
import React from "react";
import { Button, Text, View } from "react-native";

const ErrorModal = ({ modal: { closeModal, params } }) => (
  <View>
    <Text>{params?.title}</Text>
    <Text>{params?.message}</Text>
    <Button title="Close" onPress={closeModal} />
  </View>
);

export default ErrorModal;
```

{% endcode %}
{% endtab %}
{% endtabs %}

### `removeAllListeners`&#x20;

```javascript
removeAllListeners: () => void
```

Removes all the listeners connected to the modal component you're in.

**Example:**&#x20;

{% tabs %}
{% tab title="TypeScript React" %}
{% code title="./modals/AlertModal.tsx" %}

```tsx
import React, { useCallback, useEffect, useRef } from 'react'
import { ModalEventCallback, ModalEventListener } from 'react-native-modalfy'

const AlertModal = ({ modal: { addListener, removeAllListeners }) => {
  const onAnimateListener = useRef<ModalEventListener | undefined>()
  const onCloseListener = useRef<ModalEventListener | undefined>()

  const handleAnimation: ModalEventCallback = useCallback((value) => {
    console.log('🆕 Modal animatedValue:', value)
  }, [])

  const handleClose: ModalEventCallback = useCallback(() => {
    console.log('👋 Modal closed')
  }, [])

  useEffect(() => {
    onAnimateListener.current = addListener('onAnimate', handleAnimation)
    onCloseListener.current = addListener('onClose', handleClose)

    return () => {
      removeAllListeners()
    }
  }, [handleAnimation, handleClose, removeAllListeners])

  return (
    //...
  )
}

export default AlertModal
```

{% endcode %}

{% endtab %}
{% endtabs %}

### `setModalOptions`&#x20;

```javascript
setModalOptions: (modalOptions: ModalOptions) => void
```

Allows you to dynamically change the modal options of to the modal component you're in.

This is an alternative to the static approach: `MyModal.modalOptions = { ... }`.

[You can learn more about it here](https://colorfy-software.gitbook.io/react-native-modalfy/guides/typing#modalcomponentwithoptions).

**Example:**&#x20;

{% tabs %}
{% tab title="TypeScript React" %}
{% code title="./modals/AlertModal.tsx" %}

```tsx
import React, { useEffect } from "react";
import { Button, Text, View } from "react-native";

const ErrorModal = ({ modal: { closeModal, params, setModalOptions } }) => {
  useEffect(() => {
    if (params.type === "important") {
      setModalOptions({
        position: "center",
        disableFlingGesture: true,
        backdropColor: "#FF000040",
      });
    }
  }, [params.type, setModalOptions]);

  return (
    <View>
      <Text>{params?.title}</Text>
      <Text>{params?.message}</Text>
      <Button title="Close" onPress={closeModal} />
    </View>
  );
};

export default ErrorModal;
```

{% endcode %}

{% endtab %}
{% endtabs %}
