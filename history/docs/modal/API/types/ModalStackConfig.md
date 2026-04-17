# ModalStackConfig

{% hint style="info" %}
Interface of the modal stack configuration. These settings will let Modalfy know what modals you will be rendering and how.
{% endhint %}

{% tabs %}
{% tab title="TypeScript" %}

```typescript
interface ModalStackConfig {
  [key: string]: React.ComponentType<any> | ModalOptions;
}
```

{% endtab %}
{% endtabs %}

{% @github-files/github-code-block url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/types.ts#L222-L230>" %}
