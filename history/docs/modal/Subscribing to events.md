# Subscribing to events

#### [**> ModalComponentProp API**](https://colorfy-software.gitbook.io/react-native-modalfy/api/types/modalcomponentprop)

Once in a while, we might want to perform some animations alongside the ones applied to our modals.

One example could be animating the modal and something inside it at the same time. But to do so and have those animations happening in sync, we'd need to have access to the `animatedValue` Modalfy uses under the hood.

Another example could be that you'd like to be notified when your modal is about to be closed by Modalfy. Being able to access a `closingAction` could be very valuable here!

Use cases like this are the reason why we decided to provide a way to hook into the library's internal events, thanks to `modal.addListener()`:

{% tabs %}
{% tab title="React JSX" %}
{% code title="./modals/EmptyModal.tsx" %}

```jsx
import React, { useEffect, useRef }  from 'react'

const EmptyModal = ({ modal: { addListener }) => {
  const onAnimateListener = useRef()
  const onCloseListener = useRef()


  const handleAnimation = (value) => {
    console.log('Modal animatedValue:', value)
  }

  const handleClose = useCallback(
    closingAction => {
      console.log(`Modal by: ${closingAction.type} • ${closingAction.origin}`)
    },
  )

  useEffect(() => {
    onAnimateListener.current = addListener('onAnimate', handleAnimation)
    onCloseListener.current = addListener('onClose', handleClose)

    return () => {
      onAnimateListener.current?.remove()
      onCloseListener.current?.remove()
    }
  }, [])

  return (
    //...
  )
}

export default EmptyModal
```

{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
`onAnimate` & `onClose` are the only events we support for now. If there is another one you'd like to have, please: [let us know](https://github.com/colorfy-software/react-native-modalfy/issues/new)!
{% endhint %}
