# useDebounceFn

用來處理防抖的 hook，呼叫後不立即執行，等 wait 毫秒內沒有呼叫才執行。
回傳 `run` `cancel` `flush`，讓外部控制呼叫的時機。

## API

```typescript
const { run, cancel, flush } = useDebounceFn(fn, { wait: 300 });
```

### Params

| Parameters | Details        | Type                      | Default |
| ---------- | -------------- | ------------------------- | ------- |
| fn         | 防抖函式       | `(...args: any[]) => any` | -       |
| options    | 防抖的控制細項 | `Options`                 | -       |

### Options

| Parameters | Details  | Type   | Default |
| ---------- | -------- | ------ | ------- |
| wait       | 等待毫秒 | number | 1000    |

### Result

| Parameters | Details                          | Type                      |
| ---------- | -------------------------------- | ------------------------- |
| run        | 觸發執行 fn，函式參數將傳遞給 fn | `(...args: any[]) => any` |
| cancel     | 取消當前的防抖函式               | `() => void`              |
| flush      | 立即調用當前的防抖函式           | `() => void`              |

## Basic

```jsx
import { useDebounceFn } from '@my-hooks/hooks';

function Demo() {
  const [value, setValue] = useState(0);
  const { run } = useDebounceFn(() => setValue(value + 1), {
    wait: 500,
  });

  return (
    <div>
      <p>have been called: {String(value)}</p>
      <button onClick={run}>click fast will debounce.</button>
    </div>
  );
}
```
