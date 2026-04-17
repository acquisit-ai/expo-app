# useModal

{% hint style="info" %}
Hooks that exposes Modalfy's API. The object returned by `useModal()`is covered in [, you can get some nice autocomplete by utilizing **`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop).
{% endhint %}

{% hint style="danger" %} <mark style="color:red;">**Note:**</mark> <mark style="color:red;"></mark><mark style="color:red;">Prefer</mark> [<mark style="color:red;">**`withModal()`**</mark>](https://colorfy-software.gitbook.io/react-native-modalfy/api/withmodal) <mark style="color:red;">HOC if you're using a Class component.</mark>
{% endhint %}

{% tabs %}
{% tab title="TypeScript" %}

```typescript
const useModal = <P extends ModalfyParams>(): UsableModalProp<P> => {
  const context: UsableModalProp<P> = React.useContext(ModalContext)
  const { closeModal, closeModals, closeAllModals } = modalfy<P>()
  return {
    closeAllModals: closeAllModals: closeAllModals as UsableModalProp<P>['closeAllModals'],

    closeModals: closeModals as UsableModalProp<P>['closeModals'],

    closeModal: closeModal as UsableModalProp<P>['closeModal'],

    currentModal: context.currentModal,

    openModal: context.openModal,
  }
}
```

{% endtab %}
{% endtabs %}

{% embed url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/lib/useModal.ts>" %}

{% hint style="info" %}
If you're using TypeScript and have [your params types](https://colorfy-software.gitbook.io/react-native-modalfy/guides/typing#modalprop), you can get some nice autocomplete by utilizing`useModal()`like this:

```typescript
import { ModalStackParamsList } from "App";
// ...
const { openModal } = useModal<ModalStackParamsList>();
```

{% endhint %}
