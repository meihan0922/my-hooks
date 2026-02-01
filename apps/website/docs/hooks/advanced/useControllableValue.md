# useControllableValue

讓元件可以同時支援受控與非受控。

- 受控：值由外部 props 控制，由使用者管理狀態
- 非受控：useControllableValue 內部有 state

## API

```typescript
const [value, setValue] = useControllableValue(props);
```

### Params

| Parameters | Type    | Default |
| ---------- | ------- | ------- |
| props      | `Props` | -       |

### Props

| Parameters   | Type                             | Default |
| ------------ | -------------------------------- | ------- |
| value        | `T`                              | -       |
| defaultValue | `T`                              | -       |
| onChange     | `(v: T, ...args: any[]) => void` | -       |

### Result

| Parameters | Details      | Type                             |
| ---------- | ------------ | -------------------------------- |
| state      | 狀態值       | `-`                              |
| setState   | 修改狀態函式 | `(v: T, ...args: any[]) => void` |

## Uncontrolled

```jsx
import { useControllableValue } from '@my-hooks/hooks';

function Demo() {
  const [state, setState] = useControllableValue({
    defaultValue: '',
  });

  return (
    <div>
      <input value={state} onChange={e => setState(e.target.value)} style={{ width: 300 }} />
      <button onClick={() => setState('')}>clear</button>
    </div>
  );
}
```

## Controlled

```jsx
import { useState } from 'react';
import { useControllableValue } from '@my-hooks/hooks';

function ControlledComp({ onChange, value }) {
  const [state, setState] = useControllableValue({
    onChange,
    value,
  });

  return <input value={state} onChange={e => setState(e.target.value)} style={{ width: 300 }} />;
}

function Demo() {
  const [state, setState] = useState('');

  return <ControlledComp value={state} onChange={setState} />;
}
```
