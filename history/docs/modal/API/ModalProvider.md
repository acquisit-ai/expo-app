# ModalProvider

{% hint style="info" %}
`<ModalProvider/>` is the component you're going to use to wrap your whole application, so it'll be able to display your modals on top of everything else, using React Context API.
{% endhint %}

{% hint style="success" %}
**Note:** `ModalProvider`wraps its `children` inside a `Fragment` so feel free to put as many siblings as you want inside of it (no need to wrap them inside a `View/Fragment` before passing the content to`ModalProvider`).
{% endhint %}

{% tabs %}
{% tab title="React JSX" %}
{% code title="./App.js" %}

```tsx
import React from "react";
import { ModalProvider, createModalStack } from "react-native-modalfy";

import Navigation from "./navigation";
import { ErrorModal } from "./components/Modals";

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

{% embed url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/lib/ModalProvider.tsx>" %}
