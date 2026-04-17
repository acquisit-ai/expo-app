# ModalProps

{% hint style="info" %}
Interface of the `modal` prop exposed by the library specifically to modal components.
{% endhint %}

{% tabs %}
{% tab title="TypeScript" %}

```typescript
export type ModalComponentProp<
  P extends ModalfyParams,
  Props = unknown,
  M = keyof P
> = Props & {
  modal: UsableModalComponentProp<P, M>;
};

export type ModalProps<
  N extends keyof ModalfyParams = keyof ModalfyParams,
  P = void
> = ModalComponentProp<ModalfyParams, P, N>;
```

{% endtab %}
{% endtabs %}

{% embed url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/types.ts#L454-L469>" %}

## API reference

{% hint style="info" %}
Please refer to [**`ModalComponentProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop) directly as it's the interface used under the hood by `ModalProps`.
{% endhint %}
