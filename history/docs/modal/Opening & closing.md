# Opening & closing

As soon as our modal stack is set up, we can start using it from wherever we want in the code. Since Modal v2, we have 3 different ways to do so, depending on the situation:&#x20;

**1.** If we're inside a regular component

**2.** If we're inside a modal component specifically

**3.** Or if we're just in plain vanilla JavaScript, outside React

{% hint style="info" %}
If you want to execute some code _right after_ calling an initial [**`openModal()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop#openmodal)`/`[**`closeModal()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop#closemodal)(ie: opening/closing another modal? making API calls? etc) or any other Modalfy methds, you can use Modalfy's callback API to that effect. Please refer to our [**Triggering a callback**](https://colorfy-software.gitbook.io/react-native-modalfy/guides/triggering-a-callback) guide.
{% endhint %}

## 1. From a regular component

#### [> ModalProp API](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop)

This use case could be the most frequent: we're in a regular component, could be a screen in our app for instance and we want to open a modal from there. To do so, we'll use the [**`useModal()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/usemodal) Hooks (or [**`withModal()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/withmodal) HOC if we're dealing with a Class component) to access the `modal` prop we saw in the previous section.

From there, amongst other things, we'll cover later (if you can't wait, check out [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop) API reference), we'll have access to the [**`openModal()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop#openmodal) function:

{% tabs %}
{% tab title="React JSX" %}
{% code title="./components/Message.js" %}

```jsx
import React from 'react'
import { useModal } from 'react-native-modalfy'
import { Button, Text, View } from 'react-native'

const Message = () => {
  const { openModal } = useModal()

  const sendMessage = () => openModal('MessageSentModal'))

  return (
    <View>
      <Text>Just press send!</Text>
      <Button onPress={sendMessage} title="Send" />
    </View>
  )
}

export default Message

```

{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="warning" %}
Have a look at [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop) API reference to have a complete overview of what does `modal`brings with it. The most important thing to notice is that regular components ([**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop)) and modal components ([**`ModalComponentProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop)) do not have access to the same things inside `modal`.
{% endhint %}

## 2. From a modal component

#### [> ModalComponentProp API](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop)

Each component we put inside the `modalConfig` object we passed to [**`createModalStack()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack) will receive the `modal` prop. That's why we access it directly from the props, without the need of the Hooks/HOC:

{% tabs %}
{% tab title="React JSX" %}
{% code title="./modals/MessageSentModal.js" %}

```jsx
import React from "react";
import { Button, Text, View } from "react-native";

const MessageSentModal = ({ modal: { closeModal } }) => (
  <View>
    <Text>Your message was sent!</Text>
    <Button onPress={closeModal} title="OK" />
  </View>
);

export default MessageSentModal;
```

{% endcode %}
{% endtab %}
{% endtabs %}

You'll notice that to open a modal, Modalfy uses the keys we put inside `modalConfig`. So if the config looks like this:

{% tabs %}
{% tab title="React JSX" %}
{% code title="./App.js" %}

```jsx
import { ErrorModal, MessageSentModal } from "./components/Modals";

const modalConfig = {
  NoConnection: ErrorModal,
  APITimeout: ErrorModal,
  TokenExpired: ErrorModal,
  MessageSentModal,
};
```

{% endcode %}
{% endtab %}
{% endtabs %}

We can call `openModal('NoConnection')`, `openModal('MessageSentModal')`, etc.

## 3. From vanilla JavaScript

Since Modalfy v2, we can interact with the modal stack from outside React. Possible use cases for this could be opening/closing modals from API calls or when there is a specific change in the global state, etc.

If you want to learn more about this, head over to the [**Using outside of React**](https://colorfy-software.gitbook.io/react-native-modalfy/guides/outside-react) guide.
