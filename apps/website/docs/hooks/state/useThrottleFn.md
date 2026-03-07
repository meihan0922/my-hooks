# useThrottleFn

用來處理節流的 hook，呼叫後不立即執行，等固定間隔才會執行一次。
回傳 `run` `cancel` `flush`，讓外部控制呼叫的時機。

## API

```typescript
const { run, cancel, flush } = useThrottleFn(fn, { wait: 300 });
```

### Params

| Parameters | Details        | Type                      | Default |
| ---------- | -------------- | ------------------------- | ------- |
| fn         | 防抖函式       | `(...args: any[]) => any` | -       |
| options    | 防抖的控制細項 | `Options`                 | -       |

### Options

| Parameters | Details                                                                | Type    | Default |
| ---------- | ---------------------------------------------------------------------- | ------- | ------- |
| wait       | 等待毫秒                                                               | number  | 1000    |
| leading    | 是否在延遲開始前調用函式                                               | boolean | true    |
| trailing   | 是否在延遲開始後調用函式（如果在計時器結束前仍有呼叫，則最後再補一次） | boolean | true    |

### Result

| Parameters | Details                          | Type                      |
| ---------- | -------------------------------- | ------------------------- |
| run        | 觸發執行 fn，函式參數將傳遞給 fn | `(...args: any[]) => any` |
| cancel     | 取消當前的節流函式               | `() => void`              |
| flush      | 立即調用當前的節流函式           | `() => void`              |

### Conditions

|                 | leading: true                                                  | leading: false                                                               |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| trailing: true  | 第一次立即執行，期間內呼叫僅只會更新參數，結束後會執行最後一次 | 不立即執行，會開始一個計時器，結束後會執行最後一次，期間內呼叫僅只會更新參數 |
| trailing: false | 立即執行，計時器內或結束後全部忽略，只會看到第一個             | 無效配置                                                                     |

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
