# useUnmount

組件 unmount 時執行一次 callback（等同於 useEffect(() => () => fn(), []) 的抽象）。

- 典型用途：
  - 清理訂閱、listener
  - 中止請求、關閉連線
  - 上報離開頁面事件
  - 釋放外部資源

## API

```typescript
useUnmount(fn: () => void);
```

### Params

| Parameters | Type         | Default |
| ---------- | ------------ | ------- |
| fn         | `() => void` | -       |

## Basic

```jsx
import { useUnmount } from '@my-hooks/hooks';

function Demo() {
  const [count, setCount] = React.useState(0);
  const increment = () => setCount(prev => prev + 1);

  useUnmount(() => {
    // 只會在 卸載時呼叫，且不會被 closure 影響
    alert('count:', count);
  });

  return (
    <div>
      <p>current value: {String(state)}</p>
      <button onClick={increment}>increment</button>
    </div>
  );
}
```
