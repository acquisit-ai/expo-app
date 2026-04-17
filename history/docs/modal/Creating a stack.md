# Creating a stack

We'll need to use 2 things to get you up and running with React Native Modalfy:

**1.**[**`<ModalProvider/>`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/modalprovider), which is going to wrap the whole application and use React Context in order to display the modals on top of everything.

**2.** [**`createModalStack()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack), that we'll use to create the stack [**`<ModalProvider/>`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/modalprovider) needs to work as expected.

## Setting up the provider <a href="#provider" id="provider"></a>

#### [> ModalProvider API](https://colorfy-software.gitbook.io/react-native-modalfy/api/modalprovider)

Find the app root's component and put its current content inside [**`<ModalProvider/>`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/modalprovider) as so:

{% tabs %}
{% tab title="React JSX" %}
{% code title="./App.js" %}

```javascript
import React from "react";
import { Text, View } from "react-native";
import { ModalProvider } from "react-native-modalfy";

const App = () => (
  <ModalProvider>
    <Text>Welcome to React Native!</Text>
    <Text>To get started, edit App.js</Text>
  </ModalProvider>
);

export default App;
```

{% endcode %}
{% endtab %}
{% endtabs %}

You can be working on a more complex application with a lot of providers already. No worries to have here: React Native Modalfy can work wherever we render it in the app root component:

{% tabs %}
{% tab title="React JSX" %}
{% code title="./App.js" %}

```javascript
import React from "react";
import { Provider } from "react-redux";
import { ApolloProvider } from "react-apollo";
import { ModalProvider } from "react-native-modalfy";

import Navigation from "./navigation";
import reduxStore from "./redux";
import client from "./graphql";

const App = () => (
  <ApolloProvider client={client}>
    <Provider store={reduxStore}>
      <ModalProvider>
        <Navigation />
      </ModalProvider>
    </Provider>
  </ApolloProvider>
);

export default App;
```

{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
You'll notice that we put `<ModalProvider/>` inside of `<ApolloProvider/>` and Redux's `<Provider/>` just in case modal components might need data from them.
{% endhint %}

If we run the previous examples, we'd get an error from the library. That's because [**`<ModalProvider/>`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/modalprovider) is missing a stack of modals: let's fix that!

## Configuring the stack <a href="#configuring" id="configuring"></a>

#### [> createModalStack() API](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack)

For this step, we'll use [**`createModalStack()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack) and pass its output to [**`<ModalProvider/>`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/modalprovider) through the only prop the component accepts: `stack`. [**`createModalStack()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack) accepts 2 arguments: **a modal configuration object** (mandatory) and **a** **default options object** (optional):

{% tabs %}
{% tab title="React JSX" %}
{% code title="./App.js" %}

```javascript
import React from "react";
import { ModalProvider, createModalStack } from "react-native-modalfy";

import Navigation from "./navigation";
import ErrorModal from "./components/modals/ErrorModal";

const modalConfig = { ErrorModal };
const defaultOptions = { backdropOpacity: 0.6 };

const stack = createModalStack(modalConfig, defaultOptions);

const App = () => (
  <ModalProvider stack={stack}>
    <Navigation />
  </ModalProvider>
);

export default App;
```

{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
There are 3 ways to provide options to a modal:

1. Through `defaultOptions` in [**`createModalStack()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack)as we just did
2. Inside `modalConfig` by providing a [**`modalOptions`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modaloptions)object instead of just the component directly
3. Inside the modal component file itself, via `static modalOptions` (Class) or `MyModalComponent.modalOptions`(Hooks)
   {% endhint %}

In this example, `<ErrorModal/>` is a regular React component we're using as our 1st modal. React Native Modalfy will register it under the key `'ErrorModal'`.

Given that we're working with normal JavaScript objects here, you can change that key by simply changing the `modalConfig` key, ie: `const modalConfig = { MyCustomErrorModalName: ErrorModal }`.

{% hint style="info" %}
We only covered the simplest way of setting up a modal stack here. Feel free to check out the [**`createModalStack()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack) API reference to have more in-depth explanations of [**`createModalStack()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack)mechanics.
{% endhint %}

We now have a fully functional modal system, ready to be used and we'll see how in the following section.
