# Getting started

React Native Modalfy concept came from a need we felt at [colorfy](https://colorfy.me). Some of our apps required a very specific use of modals, with sometimes the necessity of displaying and hiding a lot of them, quite often.

Unfortunately, after trying some great solutions like React Native's own [Modal](https://reactnative.dev/docs/modal) component or [@react-native-community/react-native-modal](https://github.com/react-native-community/react-native-modal), they didn't fit our needs; as we ended up with really long files where the modals logic was getting too complex. That motivated us to opt for a homemade "_compile time focused_" API.&#x20;

From that, Modalfy promise took shape. We'll be working to allow you to do 3 things:

**1. Write your modals once, call them from anywhere in your app.**\
**2. Display several modals at once, stack as many as you like.**\
**3. Complete control over animations & transitions between each modal in the stack.**

We only provide the logic and how to manage your modals: you pass the modal components and have complete control over how they look. Here's a quick sneak peek of what you could achieve with Modalfy in a few lines of code:

![Snippet #1 - https://gist.github.com/iremlopsum/77e8549735c6c6ba7a243ea453c10147](https://i.imgur.com/q8QFajL.gif)

![Snippet #2 - https://gist.github.com/iremlopsum/17b4804a142a39525160df22e67410ea](https://i.imgur.com/wF0hTBm.gif)

![Snippet #3 - https://gist.github.com/iremlopsum/b40640264335545bf3b9e39622f5c423](https://i.imgur.com/C79UD6B.gif)

![Snippet #4 - https://gist.github.com/iremlopsum/f3dcb215d8e318c0d1912359fffd232b](https://i.imgur.com/Z6HsH59.gif)

After reading this documentation you'll realize that [React Navigation](https://reactnavigation.org) has been our main source of inspiration for this library. Without being it, we tried to keep an API as close as possible to reduce the mental overload from switching between working on your screens and your modals. **So huge props to all the contributors for its simple yet performant API!**

If you think about it: modals are simply another form of "navigating between screens". React Navigation being the navigation library we use at colorfy (and incidentally one of the most used in the React Native ecosystem), taking inspiration from their API looked like a natural choice.

{% hint style="danger" %} <mark style="color:red;">Given that React Native Modalfy uses the new React Context & Hooks APIs added respectively in React 16.3.0 and React 16.8.0,</mark> <mark style="color:red;"></mark><mark style="color:red;">**we'll require you to use at least**</mark><mark style="color:red;">**&#x20;**</mark><mark style="color:red;">**`react-native@^0.59.0`**</mark><mark style="color:red;">(that ships with React 16.8.3).</mark>
{% endhint %}

## Try it now

If you want to experience the library by yourself and then come back afterwards, there is a demo app [available on Expo](https://snack.expo.io/@charles.m/react-native-modalfy)!

![Scan it with the Expo Go app](https://4039742219-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LfOMMJ7hB6esz21gcdJ%2F-M7CWxD_JnQhmTkTzvKl%2F-M7CYe47VzPs5-hDtbkK%2FScreenshot%202020-05-13%20at%2012.21.45.png?alt=media&token=12349e05-a794-42bf-b28a-bbe14d1b9e77)
