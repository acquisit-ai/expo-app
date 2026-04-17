# modalfy

{% hint style="info" %}
Function that exposes Modalfy's API outside of React's context. The object returned by `modalfy()`is covered in [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop).
{% endhint %}

{% hint style="danger" %} <mark style="color:red;">**Note: Do not use if you're inside a React component.**</mark> <mark style="color:red;"></mark><mark style="color:red;">Please consider</mark> [<mark style="color:red;">**`useModal()`**</mark>](https://colorfy-software.gitbook.io/react-native-modalfy/api/usemodal) <mark style="color:red;">or</mark> [<mark style="color:red;">**`withModal()`**</mark>](https://colorfy-software.gitbook.io/react-native-modalfy/api/withmodal) <mark style="color:red;">instead.</mark>
{% endhint %}

{% tabs %}
{% tab title="TypeScript" %}

```typescript
const modalfy = <
  P extends ModalfyParamsm,
  M extends keyof P
>(): UsableModalProp<P> => {
  const context: UsableModalProp<P> = React.useContext(ModalContext);
  return {
    closeAllModals: (callback?: () => void) => {
      ModalState.queueClosingAction({ action: "closeAllModals", callback });
    },

    closeModals: (modalName: M, callback?: () => void) =>
      ModalState.queueClosingAction({
        action: "closeModals",
        modalName,
        callback,
      }),

    closeModal: (modalName?: M, callback?: () => void) => {
      ModalState.queueClosingAction({
        action: "closeModal",
        modalName,
        callback,
      });
    },

    currentModal: ModalState.getState<P>()?.currentModal,

    openModal: (modalName: M, params?: P[M], callback?: () => void) =>
      ModalState.openModal(modalName, params, true, callback),
  };
};
```

{% endtab %}
{% endtabs %}

{% embed url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/lib/ModalState.ts#L314-L398>" %}

{% hint style="info" %}
If you're using TypeScript and have [your params types](https://colorfy-software.gitbook.io/react-native-modalfy/guides/typing#modalprop), you can get some nice autocomplete by utilizing `modalfy()`like this:

```typescript
import { ModalStackParamsList } from "App";
// ...
const { openModal } = modalfy<ModalStackParamsList>();
```

{% endhint %}
