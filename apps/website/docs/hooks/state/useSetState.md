# useSetState

管理物件型的 state，用法與 class 組件的 `this.setState` 一致。

## API

```typescript
const [state, setState] = useSetState<T>(
  initialState: T | (() => T)
);
```

### Params

| Parameters   | Details  | Type             | Default |
| ------------ | -------- | ---------------- | ------- |
| initialState | 初始狀態 | `T \| (() => T)` | `-`     |

### Result

| Parameters | Details  | Type                                                     |
| ---------- | -------- | -------------------------------------------------------- |
| state      | 當前狀態 | `T extends Record<string, unknown>`                      |
| setState   | 切換狀態 | `Partial<T> \| ((prevState: Readonly<T>) => Partial<T>)` |

## Basic

```jsx
import { useSetState } from '@my-hooks/hooks';

function Demo() {
  const [state, setState] = useSetState({ a: 1, b: 10 });

  return (
    <div>
      <p>current value: {JSON.stringify(state)}</p>
      <button onClick={() => setState({ a: 10 })}>set a: 10</button>
      <button onClick={() => setState({ b: 100 })}>set b: 10</button>
    </div>
  );
}
```

## Updating with callback

```jsx
import { useSetState } from '@my-hooks/hooks';

function Demo() {
  const [state, setState] = useSetState({ a: 1, b: 10 });

  return (
    <div>
      <p>current value: {JSON.stringify(state)}</p>
      <button
        onClick={() =>
          setState(prev => {
            a: 10;
          })
        }
      >
        set a: 10
      </button>
      <button
        onClick={() =>
          setState(prev => {
            b: 100;
          })
        }
      >
        set b: 10
      </button>
    </div>
  );
}
```
