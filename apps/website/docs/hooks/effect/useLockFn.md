# useLockFn

用來鎖定非同步函式的 hook，當上一次 Promise 尚未完成時，會忽略後續的呼叫，避免重複觸發（例如防止重複提交表單）。

## API

```typescript
const lockedFn = useLockFn(fn);
```

### Params

| Parameters | Details            | Type                               | Default |
| ---------- | ------------------ | ---------------------------------- | ------- |
| fn         | 要鎖定的非同步函式 | `(...args: any[]) => Promise<any>` | -       |

### Result

| Parameters | Details                            | Type                               |
| ---------- | ---------------------------------- | ---------------------------------- |
| lockedFn   | 鎖定後的函式，執行中會忽略後續呼叫 | `(...args: any[]) => Promise<any>` |

## Basic

```jsx
import { useLockFn } from '@my-hooks/hooks';

function Demo() {
  const submit = useLockFn(async () => {
    await fetch('/api/submit', { method: 'POST' });
  });

  return <button onClick={submit}>提交（快速點擊不會重複發送）</button>;
}
```

## 行為說明

- **執行中忽略呼叫**：當函式正在執行（Promise pending）時，後續呼叫會被忽略，只有第一次的參數會被傳入
- **完成後可再次呼叫**：當 Promise resolve 或 reject 後，鎖定會解除，下次呼叫會正常執行
- **穩定引用**：回傳的函式引用在重新渲染時保持穩定
