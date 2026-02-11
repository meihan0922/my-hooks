# useTimeout

用 hook 方式建立 setTimeout，並且：

- callback 永遠是最新（不 stale closure）
- delay 變了會重設 timeout
- delay = null/undefined 時暫停

## API

```typescript
const clear = useTimeout(fn: () => void, delay?: number | undefined);
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
import { useTimeout } from '@my-hooks/hooks';

export default () => {
  const [count, setCount] = useState<number>(0);
  const [timeout, setTimeout] = useState<number | undefined>(1000);

  const clear = useTimeout(() => {
    setCount(count + 1);
  }, interval);

  return (
    <div>
      <p>count: {count}</p>
      <button onClick={() => setTimeout(t => t + 1000)} style={{ marginRight: 8 }}>
        + 1000ms
      </button>
      <button onClick={clear}>clear</button>
      <button onClick={() => setTimeout(1000)}>reset</button>
    </div>
  );
};
```
