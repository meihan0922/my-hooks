# useLatest

不觸發 render 的快照，回傳 ref，ref.current 永遠存最新的值。

- 典型用途：避免 closure 拿到舊的 state/props，但又不想為了更新去改 callback dependency 或是重新綁定事件。
- 典型搭配： `useEventListener` `useInterval` `useTimeout` `useRequest`

```jsx
const valRef = useLatest<T>(val: T): Readonly<{ current: T }>;
```

## Basic

```jsx
// 待更新
```
