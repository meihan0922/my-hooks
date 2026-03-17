# useLatest

不觸發 render 的快照，回傳 ref，ref.current 永遠存最新的值。

- 典型用途：避免 closure 拿到舊的 state/props，但又不想為了更新去改 callback dependency 或是重新綁定事件。
- 典型搭配： `useEventListener` `useInterval` `useTimeout` `useRequest`

## API

```typescript
const valRef = useLatest<T>(val: T): Readonly<{ current: T }>;
```

### Params

| Parameters | Details | Type | Default |
| ---------- | ------- | ---- | ------- |
| val        | 任意值  | `T`  | -       |

### Result

| Parameters | Details                          | Type     |
| ---------- | -------------------------------- | -------- |
| valRef     | ref 物件，current 永遠指向最新值 | `Ref<T>` |

## Basic

```jsx
import { useLatest } from '@my-hooks/hooks';

function Demo() {
  const [count, setCount] = React.useState(0);
  const countRef = useLatest(count);

  useEffect(() => {
    const timer = setInterval(() => {
      // 透過 ref.current 取得最新的 count，不會有 stale closure
      console.log('latest count:', countRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, []); // 空 deps，不需因 count 變動而重設 timer

  return (
    <div>
      <p>count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>increment</button>
    </div>
  );
}
```

## 搭配 useInterval / useTimeout

`useInterval`、`useTimeout` 內部就是用 `useLatest` 來確保 callback 永遠拿到最新的 props/state：

```jsx
import { useInterval } from '@my-hooks/hooks';

function Demo() {
  const [count, setCount] = React.useState(0);

  useInterval(() => {
    // callback 內永遠能拿到最新的 count
    setCount(c => c + 1);
  }, 1000);

  return <p>count: {count}</p>;
}
```

## 行為說明

- **不觸發 re-render**：更新 `ref.current` 不會造成元件重新渲染
- **穩定引用**：回傳的 ref 物件在整個生命週期保持同一引用
- **同步更新**：每次 render 時 `ref.current` 會同步更新為傳入的最新值
