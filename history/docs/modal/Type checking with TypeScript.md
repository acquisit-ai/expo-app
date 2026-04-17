# Type checking with TypeScript

There are **6** main interfaces that you'll use throughout your experience with Modalfy:

- [**`ModalStackConfig`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalstackconfig) - Interface of the modal stack configuration (needed once).
- [**`ModalOptions`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modaloptions) - Interface of the modal configuration options.
- [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop) **-** Interface of the `modal` prop exposed by the library.
- [**`ModalComponentProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop) **/** [**`ModalProps`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprops) - Interface of the `modal` prop exposed by the library (specifically for modal components).
- [**`ModalComponentWithOptions`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentwithoptions) - Interface that adds type support of the `modalOptions` property (specifically for Hooks modal components).

The 6th and last main interface will actually be provided **by you**, as Modalfy v2 brought support for modal params type. That interface is going to be used mainly by [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop), [**`ModalComponentProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop) and [**`modalfy()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/modalfy). But for now: let's see how to use the other interfaces we just mentioned.

{% hint style="info" %}
Please refer to the [**Types**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types) section of the API reference to get a complete overview of each of these interfaces.
{% endhint %}

## **ModalStackConfig & ModalOptions** <a href="#config-and-options" id="config-and-options"></a>

#### [**> ModalStackConfig API**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalstackconfig)

#### [**> ModalOptions API**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modaloptions)

These interfaces should be the ones you use the less. They're the ones that will ensure the type safety of the 2 arguments [**`createModalStack()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack). So if we were to reuse the same initial example we say in the [**Creating a stack section**](https://colorfy-software.gitbook.io/react-native-modalfy/guides/stack), we'd now have:

{% tabs %}
{% tab title="TypeScript" %}
{% code title="./App.tsx" %}

```javascript
import React from "react";
import {
  ModalOptions,
  ModalStackConfig,
  createModalStack,
  ModalProvider,
} from "react-native-modalfy";

import Navigation from "./navigation.ts";
import { ErrorModal } from "./components/Modals.ts";

const modalConfig: ModalStackConfig = { ErrorModal };
const defaultOptions: ModalOptions = { backdropOpacity: 0.6 };

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

And from there, the type checker will get to work and let you know if you're doing something wrong.

{% hint style="info" %}
If you directly provide the 2 objects instead of using variables like so:

```javascript
createModalStack({ ErrorModal }, { backdropOpacity: 0.6 });
```

No need to use these 2 interfaces as`createModalStack()`is already doing it under the hood.
{% endhint %}

## ModalProp

#### [> ModalProp API](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop)

This interface allows you to type check the `modal` prop that your regular component will get access to by using [**`withModal()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/withmodal) HOC. This means that you'll have to keep a few things in mind:

{% hint style="danger" %}

- <mark style="color:red;">If you're inside</mark> <mark style="color:red;"></mark><mark style="color:red;">**a modal component and not a "regular" component,**</mark> <mark style="color:red;"></mark><mark style="color:red;">you should use</mark> <mark style="color:red;"></mark><mark style="color:red;">**`ModalComponentProp`**</mark><mark style="color:red;">**&#x20;**</mark><mark style="color:red;">**instead**</mark><mark style="color:red;">.</mark>
- If you're using <mark style="color:red;">**`useModal()`**</mark><mark style="color:red;">**&#x20;**</mark><mark style="color:red;">**Hook**</mark>**,** no need to employ`ModalProp`**a**s the Hook itself will take care of all the typing. <mark style="color:red;">**Simply provide your params interface to the Hook as such**</mark><mark style="color:red;">**&#x20;**</mark><mark style="color:red;">**`useModal<ModalStackParams>()`**</mark>(explained below)**.**
- The main and potentially <mark style="color:red;">**only use case for**</mark> <mark style="color:red;"></mark><mark style="color:red;">`ModalProp`</mark> <mark style="color:red;"></mark><mark style="color:red;">**then is when you're using a Class component**</mark>.
  {% endhint %}

Now that we've covered the gotchas, let's see [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop) in action. In this example, we created a `<PokedexCard/>` component that's will open a modal with the full details about a specific Pokemon, with its name, type and entry number in the [Pokédex](https://www.pokemon.com/pokedex):

{% tabs %}
{% tab title="Class" %}
{% code title="./components/PokedexCard.tsx" %}

```typescript
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { ModalProp, withModal } from 'react-native-modalfy'

import { ModalStackParams } from '../types/modals.ts'

interface OwnProps {
  pokemon: ModalStackParams['PokedexEntryModal']['name']
  type: ModalStackParams['PokedexEntryModal']['type']
  id: ModalStackParams['PokedexEntryModal']['id']
}

type Props = ModalProp<ModalStackParams, OwnProps>

class PokedexCard extends React.Component<Props> {
  onPress = () => {
    const {
      modal: { openModal },
      pokemon,
      type,
      id,
    } = this.props

    openModal('PokedexEntryModal', { id, name: pokemon, type })
  }

  render() {
    const { id, pokemon, type } = this.props
    return (
      <TouchableOpacity onPress={this.onPress}>
        <View>
          <Text>Nr. {id}Text>
          <Text>{pokemon}</Text>
          <Text>{type}</Text>
          <Text>Show more</Text>
        </View>
      </TouchableOpacity>
    )
  }
}

export default withModal(PokedexCard)
```

{% endcode %}
{% endtab %}

{% tab title="Hooks" %}

```
// ❌ Don't use ModalProp with the useModal() Hook. If you want to fully type it
// simply provide your params interface as such: useModal<ModalStackParams>()
// (ModalStackParams is explained below).
```

{% endtab %}
{% endtabs %}

Lots of things are happening in this snippet, but if you're already familiar with [TypeScript generics](https://www.typescriptlang.org/docs/handbook/generics.html), this should get you excited! Let's dissect this snippet.

`#L5` with `ModalStackParams`. It's an interface you'll have to build that will represent the complete tree of your modals and the types their params are expecting.&#x20;

From `#L7` to `#L11`, we're letting TypeScript know that `<PokedexCard/>` expects 3 props that should comply with the types specified in `ModalStackParams`. We're doing this to ensure the type safety of these 3 props because we're using them `L#24` to open `'PokedexEntryModal'` and pass them as params.

If we were to write `ModalStackParams`, we can now _guesstimate_ that it could look something like this a minima:

{% tabs %}
{% tab title="TypeScript" %}

```typescript
interface ModalStackParams {
  PokedexEntryModal: {
    name: string;
    type: string;
    id: number;
  };
}
```

{% endtab %}
{% endtabs %}

{% hint style="info" %}
You can have a look at the Example provided [in the repository](https://github.com/colorfy-software/react-native-modalfy/tree/master/Example) and available [on Expo](https://snack.expo.io/@charles.m/react-native-modalfy) to see what `ModalStackParams`could look like/be used in a real-world scenario.
{% endhint %}

You'd also realize that we didn't pass `ModalStackParams` as a generic to [**`withModal()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/withmodal) `#L42`, instead, we directly provided it to `React.Component` `#L15`, via `Props` created `#L13`. As you may know, with TypeScript, `React.Component` is a [generic class](https://www.typescriptlang.org/docs/handbook/generics.html#generic-classes) that accepts up to 2 arguments: `React.Component<Props, State>`. That's why `ModalProp` also accepts up to 2 arguments, your params interface and your component props and returns a type with your props type + the new `modal` prop. There are a few things to notice here:

- If you have any `State` interface, you'll have to provide it to `React.Component` as a second argument, not [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop).
- If your component doesn't expect any props, you don't have to provide a second argument to `ModalProp`. If you want, you can even use it without providing the params type. This means that the most basic way of using [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop) is `class PokedexCard extends React.Component<ModalProp>`
- On the contrary, providing your params types to [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop) gives you access to some sweet autocompleting experience (try to see what you get when you trigger it on [**`openModal()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop#openmodal) for instance)!

## **ModalComponentProp & ModalProps**

#### [**> ModalComponentProp API**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop)

#### [**> ModalProps API**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprops)

These types work on the same principles as [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop) with just some key differences to keep in mind. The first and most important is:

{% hint style="danger" %} <mark style="color:red;">`ModalComponentProp`</mark><mark style="color:red;">/</mark><mark style="color:red;">`ModalProps`</mark> <mark style="color:red;">**should only be used with modal components (rendered by Modalfy)!**</mark>
{% endhint %}

&#x20;If the component you're working on is not rendered by Modalfy directly/part of your [**`createModalStack()`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/createmodalstack) config, you should use [**`ModalProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprop) instead.

Given that we're in a specific modal component, [**`ModalComponentProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop) accepts a 3rd argument, corresponding to the name of the modal the component you're writing represents:

```typescript
type Props = ModalComponentProp<ModalStackParams, void, "PokedexEntryModal">;
```

But starting with `v3.5.0`, we now have a simplified version of `ModalComponentProp` named [**`ModalProps`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprops).

If we reuse our Pokédex example, first we'd need to define our `ModalStackParams` as explained at the end of the previous section.&#x20;

{% code title="./types/modals.ts" overflow="wrap" %}

```typescript
export interface ModalStackParams {
  PokedexEntryModal: {
    name: string;
    type: string;
    id: number;
  };
}
```

{% endcode %}

And then, our `'PokedexEntryModal'` modal could look like this (granted [you've properly set up your declaration file](#optional-provisioning-of-params-generic)):

{% tabs %}
{% tab title="Hooks" %}
{% code title="./modals/PokedexEntryModal.tsx" %}

```typescript
import React from 'react'
import { ModalProps } from 'react-native-modalfy'

type Props = ModalProps<'PokedexEntryModal'>

const PokedexEntryModal = (props: Props) => {
  return (
    // ...
  )
}

export default PokedexEntryModal
```

{% endcode %}
{% endtab %}

{% tab title="Class" %}
{% code title="./modals/PokedexEntryModal.tsx" %}

```typescript
import React from 'react'
import { ModalProps } from 'react-native-modalfy'

type Props = ModalProps<'PokedexEntryModal'>

class PokedexEntryModal extends React.Component<Props> {
  render() {
    return (
      // ...
    )
  }
}

export default PokedexEntryModal
```

{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
Given that you can reuse the same component for several modals, you can replace that 1st argument with a [union type](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#union-types) to make everything work.

{% code overflow="wrap" %}

```typescript
type Props = ModalProps<"PokedexEntryModal" | "FavouritePokemonModal">;
```

{% endcode %}
{% endhint %}

Although you'll never manually render `<PokedexEntryModal>`yourself, [**`ModalComponentProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop) / [**`ModalProps`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprops) voluntarily expects props types as your modal component could be getting props from some HOCs. ie:

{% tabs %}
{% tab title="Class" %}
{% code title="./modals/PokedexEntryModal.tsx" %}

```typescript
// ...

import { connect } from "react-redux";

// ...

import { ReduxState } from "../types/redux.ts";

interface OwnProps {
  favouritePokemon: ReduxState["user"]["favouritePokemon"];
}

type Props = ModalProps<"PokedexEntryModal", OwnProps>;

class PokedexEntryModal extends React.Component<Props> {
  //...
}

const mapStateToProps = (state: ReduxState): OwnProps => {
  favouritePokemon: state.user.favouritePokemon;
};

export default connect(mapStateToProps)(PokedexEntryModal);
```

{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
Please check out the [**`ModalComponentProp`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop)`/`[**`ModalProps`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalprops)API reference to have an exhaustive list of what it brings with it.
{% endhint %}

## **ModalComponentWithOptions**

#### [**> ModalComponentWithOptions API**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentwithoptions)

{% hint style="danger" %} <mark style="color:red;">`ModalComponentWithOptions`</mark> <mark style="color:red;">**is only meant to be used with Hooks modal components**</mark><mark style="color:red;">.</mark> <mark style="color:red;">If you're working with classes, simply use the</mark> <mark style="color:red;">static</mark><mark style="color:red;">`modalOptions`</mark><mark style="color:red;">property as explained below.</mark>
{% endhint %}

As we saw in the [**Configuring a stack**](https://colorfy-software.gitbook.io/react-native-modalfy/stack#configuring-the-stack) guide, you have 3 different ways to provide options to a modal. While the first 2 are type-checked during the modal stack creation, only the 3rd one involves typing `modalOptions` from within the modal component itself.&#x20;

To do so, simply pass your component props to [**`ModalComponentWithOptions`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentwithoptions) and you're done! The interface will also directly take care of the fact that you're using it on a component, so no need to use `React.FC` with it. ie:

{% tabs %}
{% tab title="Hooks" %}
{% code title="./modals/PokedexEntryModal.tsx" %}

```typescript
import React from 'react'
import { ModalComponentWithOptions, ModalProps } from 'react-native-modalfy'

import { ModalStackParams } from '../types/modals.ts'

type Props = ModalProps<'PokedexEntryModal'>

const PokedexEntryModal: ModalComponentWithOptions<Props> = () => {
  return (
    // ...
  )
}

PokedexEntryModal.modalOptions = {
  backdropColor = "rebeccapurple"
}

export default PokedexEntryModal
```

{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
Notice how`ModalComponentWithOptions<Props>` is used right after the modal variable name, not inside the parenthesis of the arrow function!
{% endhint %}

If you're working with a class, you'll just have to directly type the static`modalOptions` property with the same [**`ModalOptions`**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modaloptions) we used to type our modal stack. eg:

{% tabs %}
{% tab title="Class" %}
{% code title="./modals/PokedexEntryModal.tsx" %}

```typescript
import React from 'react'
import {
  ModalComponentProp,
  ModalOptions
} from 'react-native-modalfy'

import { ModalStackParams } from '../types/modals.ts'

type Props = ModalComponentProp<
  ModalStackParams,
  void,
  'PokedexEntryModal',
>

class PokedexEntryModal extends React.Component<Props> {
  static modalOptions: ModalOptions = {
    backdropColor: 'rebeccapurple'
  }

  render() {
    return (
      // ...
    )
  }
}

export default PokedexEntryModal
```

{% endcode %}
{% endtab %}
{% endtabs %}

## Ease of life

### Optional provisioning of params generic

Starting with `v3.5.0` you're now able to omit to provide your equivalent of `ModalStackParams` to modalfy's methods. In order to do so:

1. Declare your own `ModalStackParams` type:

{% code title="./types/modals.ts" %}

```typescript
export type ModalStackParams = {
  AlertModal: { title: string; message: string };
};
```

{% endcode %}

2. Create a `react-native-modalfy.d.ts` declaration file. Could be at the same file level where `createModalStack` is called and add:

{% code title="./src/react-native-modalfy.d.ts" %}

```typescript
import 'react-native-modalfy';
import type { ModalStackParams } './types/modal.types';

declare module 'react-native-modalfy' {
  interface ModalfyCustomParams extends ModalStackParams {}
}
```

{% endcode %}

3. Get full support of types out of the box:

{% code title="./App.tsx" %}

```diff
const AlertModal = () => {
  // No need to manually pass ModalStackParams anymore 👇
-  const { openModal } = useModal<ModalStackParams>();
+  const { openModal } = useModal();

  const openDialog = () => {
    // Type checking/autocompleting still works well here 👇
    openModal('AlertModal', { title: 'Hello', message: 'Welcome aboard!' });
  };
  // ...
}
```

{% endcode %}
