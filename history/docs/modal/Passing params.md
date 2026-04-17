# Passing params

#### [> ModalProp API](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop)

#### [**> ModalComponentProp API**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop)

One of the reasons we love React so much is how easy it is to reuse the same component wherever it makes sense. We might want to do something similar here: calling different modals, but rendering the same React component under the hood. Being able to change the content depending on which context that modal was called from is a major key to success, hence the need for `params`!

They are a two-step-use tool:

1. We pass params to a modal by putting them as [**`openModal()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop#openmodal) second argument, ie: `openModal('ErrorModal', { message: 'No Internet connection' })`
2. We access the params in the modal component through `modal.params`.

{% tabs %}
{% tab title="Step 1" %}
{% code title="./screens/Login.js" %}

```javascript
import React from "react";
import { Button, Text, View } from "react-native";
import { useModal } from "react-native-modalfy";

const Login = () => {
  const { openModal } = useModal();
  const onPressLogin = () =>
    openModal("ErrorModal", { message: "No Internet connection" });

  return (
    <View>
      <Text>Welcome!</Text>
      <Button onPress={onPressLogin} title="Login" />
    </View>
  );
};

export default Login;
```

{% endcode %}
{% endtab %}

{% tab title="Step 2" %}
{% code title="./modals/ErrorModal.js" %}

```jsx
import React from "react";
import { Button, Text, View } from "react-native";

const ErrorModal = ({ modal: { closeModal, params } }) => (
  <View>
    <Text>An error occured!</Text>
    <Text>{params.message}</Text>
    <Button onPress={closeModal} title="OK" />
  </View>
);

export default ErrorModal;
```

{% endcode %}
{% endtab %}
{% endtabs %}

Since Modalfy v2, you can even have granular access to your params if you used an object as `params` (which you should by default) and even provide a default value:

{% tabs %}
{% tab title="React JSX" %}
{% code title="./modals/ErrorModal.js" %}

```javascript
import React from "react";
import { Button, Text, View } from "react-native";

const TITLES = {
  login: "We could not log you in",
  signup: "We could not create your account",
  unknown: "An error has occurred!",
};

const ErrorModal = ({ modal: { closeModal, getParam } }) => {
  // We didn't pass any `origin` key to our params
  // so `'unknown'` will be used by default
  const origin = getParam("origin", "unknown");
  const message = getParam("message", "Something went wrong... 🤔");

  return (
    <View>
      {/* 'An error has occurred!' */}
      <Text>{TITLES[origin]}</Text>
      {/* 'No Internet connection' */}
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

{% hint style="info" %}
Checkout the [**`ModalComponentProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop) API reference to learn more about `getParam().`
{% endhint %}
