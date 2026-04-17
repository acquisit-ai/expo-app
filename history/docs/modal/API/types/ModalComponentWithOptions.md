# ModalComponentWithOptions

{% hint style="info" %}
Interface for a React component containing its props and the `modalOption` static property.
{% endhint %}

{% hint style="danger" %} <mark style="color:red;">**Note:**</mark> <mark style="color:red;"></mark><mark style="color:red;">Only use with</mark> <mark style="color:red;"></mark><mark style="color:red;">**Hooks modal components**</mark> <mark style="color:red;"></mark><mark style="color:red;">(present in your</mark> <mark style="color:red;"></mark><mark style="color:red;">`createModalStack()`</mark><mark style="color:red;">'s config). If you're working with a</mark> <mark style="color:red;"></mark><mark style="color:red;">**Class modal component**</mark><mark style="color:red;">, you can directly use</mark> <mark style="color:red;"></mark><mark style="color:red;">`static modalOptions: ModalOptions.`</mark>
{% endhint %}

{% tabs %}
{% tab title="TypeScript" %}

```typescript
export type ModalComponentWithOptions<Props = unknown> =
  React.ComponentType<Props> & {
    modalOptions?: ModalOptions;
  };
```

{% endtab %}
{% endtabs %}

{% embed url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/types.ts#L471-L483>" %}
