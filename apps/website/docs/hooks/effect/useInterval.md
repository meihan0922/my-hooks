# useInterval

用 hook 方式建立 setInterval，並且：

- callback 永遠是最新（不 stale closure）
- delay 變了會重設 interval
- delay = null/undefined 時暫停

## API

```typescript
const clear = useInterval(fn: () => void, delay?: number | undefined);
```

### Params

| Parameters | Type                          | Default     |
| ---------- | ----------------------------- | ----------- |
| fn         | `() => void`                  | -           |
| delay      | `number \| undefined \| null` | `undefined` |

### Result

| Parameters | Details        | Type         |
| ---------- | -------------- | ------------ |
| clear      | 清理計時器函式 | `() => void` |

## Basic

```tsx
import React, { useState } from 'react';
import { useInterval } from '@my-hooks/hooks';

export default () => {
  const [count, setCount] = useState<number>(0);
  const [interval, setInterval] = useState<number | undefined>(1000);

  const clear = useInterval(() => {
    setCount(count + 1);
  }, interval);

  return (
    <div>
      <p>count: {count}</p>
      <button onClick={() => setInterval(t => t + 1000)} style={{ marginRight: 8 }}>
        + 1000ms
      </button>
      <button onClick={clear}>clear</button>
      <button onClick={() => setInterval(1000)}>reset</button>
    </div>
  );
};
```
