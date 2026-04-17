# ModalProp

{% hint style="info" %}
Interface of the `modal` prop exposed by the library to regular components.
{% endhint %}

{% tabs %}
{% tab title="TypeScript" %}

```typescript
type ModalProp<P extends ModalfyParams, Props = unknown> = Props & {
  modal: UsableModalProp<P>;
};

// ------------------ INTERNAL TYPES ------------------ //

type ModalfyParams = { [key: string]: any };

interface UsableModalProp<
  P extends ModalfyParams,
  M extends Exclude<keyof P, symbol | number> = Exclude<
    keyof P,
    symbol | number
  >
> {
  closeAllModals: (callback?: () => void) => void;

  closeModal: (modalName?: M, callback?: () => void) => void;

  closeModals: (modalName: M, callback?: () => void) => boolean;

  currentModal: M | null;

  openModal: (modalName: M, params?: P[M], callback?: () => void) => void;
}
```

{% endtab %}
{% endtabs %}

{% embed url="<https://github.com/colorfy-software/react-native-modalfy/blob/main/src/types.ts#L408-L427>" %}

## API reference

### `closeAllModals`&#x20;

```javascript
closeAllModals: (callback?: () => void) => void
```

This function closes every open modal.

**Example:** `modal.closeAllModals()`

```
modalfy().closeAllModals()

modalfy().closeAllModals(() => console.log('All modals closed'))
```

### `closeModal`&#x20;

```javascript
closeModal: (modalName?: M, callback?: () => void) => void
```

This function closes the currently displayed modal by default. Incidentally, you can also provide a `modalName` if you want to close a different modal than the latest opened.

**Examples:**&#x20;

```
modalfy().closeModal()

modalfy().closeModal('UserModal', () => console.log('Latest UserModal modal closed'))

modalfy().closeModal(undefined, () => console.log('Latest modal closed'))
```

### `closeModals`&#x20;

```javascript
closeModals: (modalName: M, callback?: () => void) => boolean;
```

This function closes all the instances of a given modal. You can use it whenever you have the same modal opened several times, to close all of them at once.

**Example:**&#x20;

```
modalfy().closeModals(
  'ErrorModal',
  () => console.log('All ErrorModal modals closed')
)
```

**Returns:** boolean indicating whether or not Modalfy found any open modal corresponding to the provided `modalName` (and then closed them).

### `currentModal`&#x20;

```typescript
currentModal: M | null;
```

This value returns the current open modal (`null` if none).

**Example:** `modal.currentValue`

### `openModal`&#x20;

```typescript
openModal: (modalName: M, params?: P[M], callback?: () => void) => void
```

This function opens a modal based on the provided `modalName`. It will look at the stack passed to `<ModalProvider>` and add the corresponding component to the current stack of open modals. Alternatively, you can also provide some `params` that will be accessible to that component.

**Example:**&#x20;

```
modalfy().openModal(
  'PokedexEntryModal',
  { id: 619, name: 'Lin-Fu' },
  () => console.log('PokédexEntryModal modal opened'),
)
```
