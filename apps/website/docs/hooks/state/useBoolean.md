# useBoolean

限於布爾值的狀態切換

## API

```typescript
const [state, { toggle, set, setTrue, setFalse }] = useBoolean(defaultValue);
```

### Params

| Parameters   | Details  | Type      | Default |
| ------------ | -------- | --------- | ------- |
| defaultValue | optional | `boolean` | `false` |

### Result

| Parameters      | Details          | Type                       |
| --------------- | ---------------- | -------------------------- |
| state           | 當前狀態         | `boolean`                  |
| action.toggle   | 切換狀態         | `() => void`               |
| action.set      | 設置狀態為指定值 | `(value: boolean) => void` |
| action.setTrue  | 設置狀態為 True  | `() => void`               |
| action.setFalse | 設置狀態為 False | `() => void`               |

## Basic

```jsx
import { useBoolean } from '@my-hooks/hooks';

function Demo() {
  const [state, { toggle, set, setTrue, setFalse }] = useBoolean();

  return (
    <div>
      <p>current value: {String(state)}</p>
      <button onClick={toggle}>toggle</button>
      <button onClick={setTrue}>設為 true</button>
      <button onClick={setFalse}>設為 false</button>
      <button onClick={() => set(true)}>設為 true</button>
    </div>
  );
}
```

## Toggle Modal

```jsx
import { useBoolean } from '@my-hooks/hooks';

function Demo() {
  const [visible, { setTrue: show, setFalse: hide }] = useBoolean();

  return (
    <div>
      <button onClick={showModal}>open modal</button>
      {visible && (
        <div className="modal">
          <div className="modal-content">
            <h2>mock modal content</h2>
            <p>example modal</p>
            <button onClick={hideModal}>close</button>
          </div>
        </div>
      )}
    </div>
  );
}
```
