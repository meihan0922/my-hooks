# useEventListener

安全的註冊或是解除事件監聽，避免

- handler closure stale
- 重複 add/remove 事件 -> 性能/bug
- target 變動時沒重新綁定
- unmount 清理忘記做造成的 leak

## API

```typescript
useEventListener(
  eventName: string,
  handler: (ev: Event) => void,
  target: EventTarget | null | undefined | React.RefObject<EventTarget | null | undefined>;
  options?: boolean | AddEventListenerOptions,
);
```

### Params

| Parameters | Details          | Type                                                                                    | Default |
| ---------- | ---------------- | --------------------------------------------------------------------------------------- | ------- |
| eventName  | 事件名           | `string`                                                                                | `-`     |
| handler    | 回調             | `(ev: Event) => void`                                                                   | `-`     |
| target     | 綁定節點或是 ref | `EventTarget \| null \| undefined \| React.RefObject<EventTarget \| null \| undefined>` | `-`     |
| options    | 事件設置         | `boolean \| AddEventListenerOptions`                                                    | `-`     |

## Basic

```jsx
import React, { useState, useRef } from 'react';
import { useEventListener } from '@my-hooks/hooks';

function Demo() {
  const [value, setValue] = useState(0);
  const ref = useRef(null);

  useEventListener(
    'click',
    () => {
      setValue(value + 1);
    },
    { target: ref },
  );

  return (
    <button ref={ref} type="button">
      You click {value} times
    </button>
  );
}
```
