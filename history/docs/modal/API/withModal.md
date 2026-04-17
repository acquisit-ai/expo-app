# withModal

{% hint style="info" %}
HOC that provides the `modal` prop to a wrapped Class component. The `modal` prop injected by`withodal()`is covered in [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop).
{% endhint %}

{% hint style="danger" %} <mark style="color:red;">**Note:**</mark> <mark style="color:red;"></mark><mark style="color:red;">Prefer</mark>[<mark style="color:red;">**`useModal()`**</mark>](https://colorfy-software.gitbook.io/react-native-modalfy/api/usemodal)<mark style="color:red;">Hooks if you're using a functional component.</mark>
{% endhint %}

{% tabs %}
{% tab title="TypeScript" %}

```tsx
const withModal = <P extends ModalfyParams, Props extends object>(
  Component: React.ComponentClass<Props>
) => {
  const { closeModal, closeModals, closeAllModals } = modalfy<P>();
  class WithModalComponent extends React.Component<ModalProp<P, Props>> {
    render() {
      return (
        <ModalContext.Consumer>
          {(context) => (
            <Component
              modal={{
                closeModal,
                closeModals,
                closeAllModals,
                openModal: context.openModal,
                currentModal: context.currentModal,
              }}
            />
          )}
        </ModalContext.Consumer>
      );
    }
  }

  return WithModalComponent;
};
```

{% endtab %}
{% endtabs %}

{% embed url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/lib/withModal.tsx>" %}

## API reference

```tsx
import React, { Component } from "react";
import { Button, Text } from "react-native";
import { withModal } from "react-native-modalfy";

class ProfileScreen extends Component {
  render() {
    return (
      <View>
        <Text>Welcome!</Text>
        <Button
          title="Edit"
          onPress={() => this.props.modal.openModal("EditProfile")}
        />
      </View>
    );
  }
}

export default withModal(ProfileScreen);
```

Using **`withModal()`** will give you access to:

- `this.props.modal`
  - `currentModal`: name of the currently displayed modal if there's one
  - `openModal`: open a specific modal
  - `closeModal`: close a modal
  - `closeModals`: close every instance of a given modal
  - `closeAllModals`: close all open modals

as seen in [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop).
