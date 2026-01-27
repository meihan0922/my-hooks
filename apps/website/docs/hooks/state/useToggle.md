---
title: useToggle
order: 2
group:
  title: 狀態管理
  order: 2
---

# useToggle

在兩個狀態切換的 hook，不僅限於布爾值，可以接受任意類型的值。

## API

```typescript
const [state, {toggle, set}] = useToggle<T, U>(
  defaultValue?: T,
  reverseValue?: U
);
```

### Params

| Parameters   | Details  | Type | Default         |
| ------------ | -------- | ---- | --------------- |
| defaultValue | optional | `T`  | `false`         |
| reverseValue | optional | `U`  | `!defaultValue` |

### Result

| Parameters    | Details          | Type                      |
| ------------- | ---------------- | ------------------------- |
| state         | 當前狀態         | `T \| U`                  |
| action.toggle | 切換狀態         | `() => void`              |
| action.set    | 設置狀態為指定值 | `(value: T \| U) => void` |

## Basic

```jsx
import { useToggle } from '@my-hooks/hooks';

function Demo() {
  const [state, { toggle, set }] = useToggle();

  return (
    <div>
      <p>current value: {String(state)}</p>
      <button onClick={toggle}>toggle</button>
      <button onClick={() => set(true)}>設為 true</button>
      <button onClick={() => set(false)}>設為 false</button>
    </div>
  );
}
```

## Toggle to any Type

```jsx
import { useToggle } from '@my-hooks/hooks';

function Demo() {
  const [state, { toggle, set }] = useToggle('中文', 'English');

  return (
    <div>
      <p>current value: {String(state)}</p>
      <button onClick={toggle}>toggle</button>
      <button onClick={() => set(on)}>設為 中文</button>
      <button onClick={() => set(off)}>設為 English</button>
    </div>
  );
}
```
