# createModalStack

{% hint style="info" %}
**`createModalStack()`** is the function that's going to turn your configuration into a usable modal stack.
{% endhint %}

{% tabs %}
{% tab title="TypeScript" %}

```typescript
const createModalStack = (
  config: ModalStackConfig,
  customDefaultOptions?: ModalOptions
) => ModalStack;
```

{% endtab %}
{% endtabs %}

{% embed url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/lib/createModalStack.ts>" %}

**Argument:** [**`ModalStackConfig`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalstackconfig) _`config`_ - Modal stack configuration.

**Argument:** [**`ModalOptions`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modaloptions) _`customDefaultOptions`_ - Configuration options to apply to all modals by default (optional).

**Returns:** Modal stack configuration object to provide to [**`<ModalProvider/>`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/modalprovider)'s `stack` prop.

**Example:**

{% code title="./App.js" %}

```typescript
import { Dimensions } from "react-native";
import { PokedexEntryModal } from "./modals/PokedexEntryModal";

const { height } = Dimensions.get("screen");

createModalStack(
  { PokedexEntryModal },
  {
    animateInConfig: {
      easing: Easing.inOut(Easing.exp),
      duration: 900,
    },
    animateOutConfig: {
      easing: Easing.inOut(Easing.exp),
      duration: 900,
    },
    backdropOpacity: 0.9,
    backropColor: "deeppink",
    backBehavior: "clear",
    position: "bottom",
    containerStyle: {
      backgroundColor: "rebeccapurple",
    },
    transitionOptions: (animatedValue) => ({
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [height, 0, height],
          }),
        },
        {
          scale: animatedValue.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [0, 1, 0.9],
          }),
        },
      ],
    }),
  }
);
```

{% endcode %}
