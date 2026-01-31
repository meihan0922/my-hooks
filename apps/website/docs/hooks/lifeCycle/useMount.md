# useMount

元件 mount 時，執行一次 callback（等同於 useEffect(() => fn(), []) 的抽象）。

- 典型用途：
  - 初始化
  - 註冊一次性的外部初始化(SDK init)

## API

```typescript
useMount(fn: () => void);
```

### Params

| Parameters | Type         | Default |
| ---------- | ------------ | ------- |
| fn         | `() => void` | -       |

## Basic

```jsx
import { useMount } from '@my-hooks/hooks';

function Demo() {
  const [count, setCount] = React.useState(0);
  const increment = () => setCount(prev => prev + 1);

  useMount(() => {
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
