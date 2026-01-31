# useMemoizedFn

讓函式引用永遠穩定（stable reference）永遠用到最新的 props/state（no stale closure）。
大多數情況下可以替代 useCallback （回傳的 fn 不等同於傳入的 fn，有被持久化 wrapper 包裹）。

原始問題：useCallback 在 dependencies 是空陣列的情況下，因 closure，內容會保持舊值; 如果有 dependencies 且發生變化，handler 會一直變換。

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const log = useCallback(() => {
    console.log(count); // 永遠回傳舊值
  }, []);

  return <button onClick={log}>log</button>;
}
```

useMemoizedFn 目標是對外暴露的函式引用永遠一樣、內部執行時，用的會是最新的 props/state。

## API

```typescript
const memoizedFn = useMemoizedFn<T>(fn: T ): T;
```

### Params

| Parameters | Type                       | Default |
| ---------- | -------------------------- | ------- |
| fn         | `(...args: any[]) => any>` | -       |

### Result

| Parameters | Details    | Type                       |
| ---------- | ---------- | -------------------------- |
| fn         | 持久化函式 | `(...args: any[]) => any>` |

## Basic

```jsx
import { useMemoizedFn } from '@my-hooks/hooks';

function Count({ showCount }) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  return (
    <div>
      渲染次數：{renderCountRef.current}
      <button type="button" onClick={showCount}>
        點擊顯示當前最新的 count
      </button>
    </div>
  );
}

function Demo() {
  const [count, setCount] = React.useState(0);
  const increment = () => setCount(prev => prev + 1);

  const showCountOnUseMemoizedFn = useMemoizedFn(() => {
    alert(count);
  });

  const showCountOnUseCallback = useCallback(() => {
    alert(count);
  }, [count]);

  return (
    <div>
      <p>current value: {String(state)}</p>
      <button onClick={increment}>increment</button>
      {/** 渲染次數不會跟著 count 變動 */}
      <Count showCount={showCountOnUseMemoizedFn} />
      {/** 渲染次數會跟著 count 變動 */}
      <Count showCount={showCountOnUseCallback} />
    </div>
  );
}
```
